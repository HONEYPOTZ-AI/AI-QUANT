"""
FastAPI Market Data Processing Service
Advanced market data processing, iron condor strategy analysis, and options analytics
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Tuple
import random
import time
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from scipy import stats
from scipy.optimize import minimize_scalar
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Market Data Processing Service",
    description="Python FastAPI service for market data processing, iron condor strategy, and options analytics",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Data Models ====================

class MarketDataRequest(BaseModel):
    symbols: List[str]
    timeframe: Optional[str] = "1m"
    
class Position(BaseModel):
    position_id: str
    symbol: str
    position_type: str
    quantity: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    commission: float
    open_time: str

class EquityData(BaseModel):
    broker: str
    equity_balance: float
    cash_balance: float
    margin_used: float
    available_margin: float
    unrealized_pnl: float
    timestamp: str

# Iron Condor Models
class IronCondorAnalysisRequest(BaseModel):
    symbol: str
    expiration_date: str
    long_call_strike: float
    short_call_strike: float
    short_put_strike: float
    long_put_strike: float
    contracts: int = Field(default=1, gt=0)
    current_price: Optional[float] = None
    implied_volatility: Optional[float] = Field(default=0.20, gt=0, le=2.0)
    risk_free_rate: Optional[float] = Field(default=0.05, ge=0, le=0.20)

class IronCondorGreeksRequest(BaseModel):
    long_call_greeks: Dict[str, float]
    short_call_greeks: Dict[str, float]
    short_put_greeks: Dict[str, float]
    long_put_greeks: Dict[str, float]
    contracts: int = Field(default=1, gt=0)

class IronCondorOptimizationRequest(BaseModel):
    symbol: str
    expiration_date: str
    current_price: float
    implied_volatility: float
    target_probability: Optional[float] = Field(default=0.70, ge=0.5, le=0.95)
    wing_width: Optional[float] = Field(default=5.0, gt=0)
    contracts: int = Field(default=1, gt=0)

class PositionMonitorRequest(BaseModel):
    strategy_id: int
    symbol: str
    expiration_date: str
    strikes: Dict[str, float]  # long_call, short_call, short_put, long_put
    contracts: int
    entry_credit: float

class RealTimeUpdateRequest(BaseModel):
    positions: List[Dict[str, Any]]
    market_data: Dict[str, float]

# ==================== Helper Functions ====================

def generate_market_price(symbol: str) -> Dict[str, Any]:
    """Generate realistic market price data for a given symbol"""
    base_prices = {
        "US30": 42500.0,
        "SPX": 4500.0,
        "AAPL": 175.0,
        "GOOGL": 140.0,
        "MSFT": 340.0,
        "TSLA": 250.0,
        "EURUSD": 1.0850,
        "GBPUSD": 1.2650,
    }
    
    base_price = base_prices.get(symbol, 100.0 + random.random() * 900.0)
    change = (random.random() - 0.5) * base_price * 0.02
    change_percent = (change / base_price) * 100
    
    return {
        "symbol": symbol,
        "last": round(base_price, 4),
        "bid": round(base_price * 0.9995, 4),
        "ask": round(base_price * 1.0005, 4),
        "high": round(base_price + abs(change) * 1.5, 4),
        "low": round(base_price - abs(change) * 1.5, 4),
        "open": round(base_price - change, 4),
        "volume": int(random.random() * 10000 + 5000),
        "change": round(change, 4),
        "change_percent": round(change_percent, 2),
        "timestamp": datetime.now().isoformat()
    }

def calculate_technical_indicators(prices: List[float]) -> Dict[str, Any]:
    """Calculate technical indicators using pandas and numpy"""
    if len(prices) < 20:
        return {
            "rsi": round(50.0 + random.random() * 30 - 15, 2),
            "macd": round((random.random() - 0.5) * 2, 4),
            "sma_20": sum(prices) / len(prices) if prices else 0,
        }
    
    df = pd.DataFrame({'price': prices})
    
    # RSI calculation
    delta = df['price'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    # Moving averages
    sma_20 = df['price'].rolling(window=20).mean()
    sma_50 = df['price'].rolling(window=min(50, len(prices))).mean()
    ema_12 = df['price'].ewm(span=12, adjust=False).mean()
    ema_26 = df['price'].ewm(span=26, adjust=False).mean()
    
    # MACD
    macd = ema_12 - ema_26
    signal = macd.ewm(span=9, adjust=False).mean()
    
    return {
        "rsi": round(float(rsi.iloc[-1]) if not np.isnan(rsi.iloc[-1]) else 50.0, 2),
        "macd": round(float(macd.iloc[-1]) if not np.isnan(macd.iloc[-1]) else 0.0, 4),
        "macd_signal": round(float(signal.iloc[-1]) if not np.isnan(signal.iloc[-1]) else 0.0, 4),
        "sma_20": round(float(sma_20.iloc[-1]) if not np.isnan(sma_20.iloc[-1]) else 0.0, 4),
        "sma_50": round(float(sma_50.iloc[-1]) if not np.isnan(sma_50.iloc[-1]) else 0.0, 4),
        "ema_12": round(float(ema_12.iloc[-1]) if not np.isnan(ema_12.iloc[-1]) else 0.0, 4),
        "ema_26": round(float(ema_26.iloc[-1]) if not np.isnan(ema_26.iloc[-1]) else 0.0, 4)
    }

# ==================== Black-Scholes Options Pricing ====================

def black_scholes_call(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Calculate Black-Scholes call option price"""
    if T <= 0:
        return max(0, S - K)
    
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    call_price = S * stats.norm.cdf(d1) - K * np.exp(-r * T) * stats.norm.cdf(d2)
    return call_price

def black_scholes_put(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Calculate Black-Scholes put option price"""
    if T <= 0:
        return max(0, K - S)
    
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    put_price = K * np.exp(-r * T) * stats.norm.cdf(-d2) - S * stats.norm.cdf(-d1)
    return put_price

def calculate_greeks(S: float, K: float, T: float, r: float, sigma: float, 
                     option_type: str) -> Dict[str, float]:
    """Calculate option Greeks"""
    if T <= 0:
        return {"delta": 0, "gamma": 0, "theta": 0, "vega": 0}
    
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    if option_type.upper() == 'C':
        delta = stats.norm.cdf(d1)
        theta = (-S * stats.norm.pdf(d1) * sigma / (2 * np.sqrt(T)) - 
                 r * K * np.exp(-r * T) * stats.norm.cdf(d2)) / 365
    else:  # Put
        delta = stats.norm.cdf(d1) - 1
        theta = (-S * stats.norm.pdf(d1) * sigma / (2 * np.sqrt(T)) + 
                 r * K * np.exp(-r * T) * stats.norm.cdf(-d2)) / 365
    
    gamma = stats.norm.pdf(d1) / (S * sigma * np.sqrt(T))
    vega = S * stats.norm.pdf(d1) * np.sqrt(T) / 100
    
    return {
        "delta": delta,
        "gamma": gamma,
        "theta": theta,
        "vega": vega
    }

# ==================== Iron Condor Analysis Functions ====================

def calculate_iron_condor_payoff(underlying_price: float, strikes: Dict[str, float], 
                                 net_credit: float) -> float:
    """Calculate iron condor payoff at given underlying price"""
    lc = strikes['long_call']
    sc = strikes['short_call']
    sp = strikes['short_put']
    lp = strikes['long_put']
    
    # Call spread P&L
    if underlying_price <= sc:
        call_pnl = 0
    elif underlying_price >= lc:
        call_pnl = -(lc - sc)
    else:
        call_pnl = -(underlying_price - sc)
    
    # Put spread P&L
    if underlying_price >= sp:
        put_pnl = 0
    elif underlying_price <= lp:
        put_pnl = -(sp - lp)
    else:
        put_pnl = -(sp - underlying_price)
    
    total_pnl = (call_pnl + put_pnl) * 100 + net_credit
    return total_pnl

def calculate_probability_itm(S: float, K: float, T: float, sigma: float, 
                              option_type: str) -> float:
    """Calculate probability of option being ITM at expiration"""
    if T <= 0:
        return 1.0 if (option_type == 'C' and S > K) or (option_type == 'P' and S < K) else 0.0
    
    d2 = (np.log(S / K) + (-0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    
    if option_type.upper() == 'C':
        return 1 - stats.norm.cdf(d2)
    else:
        return stats.norm.cdf(d2)

def optimize_iron_condor_strikes(current_price: float, T: float, sigma: float,
                                 target_pop: float, wing_width: float) -> Dict[str, float]:
    """Optimize iron condor strikes for target probability of profit"""
    
    # Calculate standard deviation of price movement
    price_std = current_price * sigma * np.sqrt(T)
    
    # For target PoP, find the z-score
    # PoP relates to probability that price stays between short strikes
    z_score = stats.norm.ppf((1 + target_pop) / 2)
    
    # Place short strikes at z-score standard deviations
    short_call_strike = current_price + (z_score * price_std)
    short_put_strike = current_price - (z_score * price_std)
    
    # Add wings
    long_call_strike = short_call_strike + wing_width
    long_put_strike = short_put_strike - wing_width
    
    # Round to nearest 5
    return {
        'long_call': round(long_call_strike / 5) * 5,
        'short_call': round(short_call_strike / 5) * 5,
        'short_put': round(short_put_strike / 5) * 5,
        'long_put': round(long_put_strike / 5) * 5
    }

def calculate_strategy_score(return_on_risk: float, probability_of_profit: float, 
                            days_to_expiration: int) -> float:
    """Calculate overall strategy quality score (0-100)"""
    # Weight factors
    ror_score = min(100, return_on_risk * 2)  # 50% ROR = 100 score
    pop_score = probability_of_profit  # Already 0-100
    
    # Time factor (prefer 30-45 days to expiration)
    if 30 <= days_to_expiration <= 45:
        time_score = 100
    elif days_to_expiration < 30:
        time_score = max(0, (days_to_expiration / 30) * 100)
    else:
        time_score = max(0, 100 - ((days_to_expiration - 45) * 2))
    
    # Weighted average
    total_score = (ror_score * 0.3) + (pop_score * 0.5) + (time_score * 0.2)
    return round(total_score, 2)

def get_strategy_rating(return_on_risk: float, probability_of_profit: float) -> str:
    """Get qualitative rating for strategy"""
    score = (return_on_risk * 2 * 0.4) + (probability_of_profit * 0.6)
    
    if score >= 80:
        return "Excellent"
    elif score >= 65:
        return "Good"
    elif score >= 50:
        return "Fair"
    else:
        return "Poor"

# ==================== API Endpoints ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Market Data Processing Service",
        "status": "online",
        "version": "2.0.0",
        "features": [
            "Market Data Processing",
            "Iron Condor Strategy Analysis",
            "Options Greeks Calculation",
            "Position Management",
            "Real-time Updates"
        ],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "fastapi-market-data",
        "timestamp": datetime.now().isoformat(),
        "uptime": time.process_time()
    }

@app.post("/market-data")
async def get_market_data(request: MarketDataRequest):
    """
    Fetch and process market data for given symbols
    
    Args:
        request: MarketDataRequest containing symbols and optional timeframe
        
    Returns:
        Processed market data with prices, indicators, and analysis
    """
    try:
        if not request.symbols:
            raise HTTPException(status_code=400, detail="At least one symbol is required")
        
        market_data = {}
        
        for symbol in request.symbols:
            price_data = generate_market_price(symbol)
            
            # Generate historical prices for indicators
            historical_prices = [
                price_data["last"] * (1 + (random.random() - 0.5) * 0.01)
                for _ in range(50)
            ]
            
            indicators = calculate_technical_indicators(historical_prices)
            
            market_data[symbol] = {
                "price": price_data,
                "indicators": indicators,
                "sentiment": {
                    "score": round(50 + (price_data["change_percent"] * 5), 1),
                    "signal": "bullish" if price_data["change_percent"] > 0.5 else "bearish" if price_data["change_percent"] < -0.5 else "neutral"
                },
                "processed_at": datetime.now().isoformat()
            }
        
        return {
            "success": True,
            "data": market_data,
            "symbols_count": len(request.symbols),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error processing market data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process market data: {str(e)}")

@app.get("/positions")
async def get_positions(account_id: Optional[str] = Query(None, description="Account ID")):
    """
    Retrieve current trading positions
    """
    try:
        positions = [
            {
                "position_id": f"POS_{random.randint(1000, 9999)}",
                "symbol": "EURUSD",
                "position_type": "LONG",
                "quantity": 100000.0,
                "entry_price": 1.0850,
                "current_price": 1.0875,
                "unrealized_pnl": 250.0,
                "commission": 5.0,
                "open_time": datetime.now().isoformat()
            }
        ]
        
        total_pnl = sum(pos["unrealized_pnl"] for pos in positions)
        
        return {
            "success": True,
            "account_id": account_id or "DEFAULT",
            "positions": positions,
            "total_positions": len(positions),
            "total_unrealized_pnl": round(total_pnl, 2),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching positions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch positions: {str(e)}")

@app.get("/equity")
async def get_equity(account_id: Optional[str] = Query(None, description="Account ID")):
    """
    Retrieve account equity and balance information
    """
    try:
        base_equity = 50000.0
        unrealized_pnl = random.random() * 1000 - 500
        
        equity_data = {
            "broker": "FastAPI",
            "account_id": account_id or "DEFAULT",
            "equity_balance": round(base_equity + unrealized_pnl, 2),
            "cash_balance": base_equity,
            "margin_used": round(base_equity * 0.04, 2),
            "available_margin": round(base_equity * 0.96, 2),
            "unrealized_pnl": round(unrealized_pnl, 2),
            "margin_level": round((base_equity + unrealized_pnl) / (base_equity * 0.04) * 100, 2),
            "timestamp": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "data": equity_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching equity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch equity: {str(e)}")

# ==================== Iron Condor Strategy Endpoints ====================

@app.post("/iron-condor/analyze")
async def analyze_iron_condor(request: IronCondorAnalysisRequest):
    """
    Comprehensive iron condor strategy analysis
    
    Returns:
        - Risk/reward metrics
        - Breakeven points
        - Probability analysis
        - Optimal strike recommendations
        - Sensitivity analysis
        - Quality metrics
    """
    try:
        # Parse expiration date
        expiration = datetime.strptime(request.expiration_date, "%Y-%m-%d")
        days_to_expiration = (expiration - datetime.now()).days
        years_to_expiration = days_to_expiration / 365.0
        
        if days_to_expiration <= 0:
            raise HTTPException(status_code=400, detail="Expiration date must be in the future")
        
        # Use provided current price or calculate midpoint
        current_price = request.current_price or (request.short_call_strike + request.short_put_strike) / 2
        
        # Calculate spread widths
        call_spread_width = request.long_call_strike - request.short_call_strike
        put_spread_width = request.short_put_strike - request.long_put_strike
        
        # Calculate option prices using Black-Scholes
        r = request.risk_free_rate
        sigma = request.implied_volatility
        T = years_to_expiration
        
        long_call_price = black_scholes_call(current_price, request.long_call_strike, T, r, sigma)
        short_call_price = black_scholes_call(current_price, request.short_call_strike, T, r, sigma)
        short_put_price = black_scholes_put(current_price, request.short_put_strike, T, r, sigma)
        long_put_price = black_scholes_put(current_price, request.long_put_strike, T, r, sigma)
        
        # Calculate net credit
        call_spread_credit = short_call_price - long_call_price
        put_spread_credit = short_put_price - long_put_price
        net_credit = (call_spread_credit + put_spread_credit) * request.contracts * 100
        
        # Calculate max profit and loss
        max_profit = net_credit
        max_loss = (max(call_spread_width, put_spread_width) * request.contracts * 100) - net_credit
        
        # Calculate breakeven points
        credit_per_share = net_credit / (request.contracts * 100)
        upper_breakeven = request.short_call_strike + credit_per_share
        lower_breakeven = request.short_put_strike - credit_per_share
        
        # Calculate return on risk
        return_on_risk = (max_profit / max_loss * 100) if max_loss > 0 else 0
        
        # Calculate probability of profit
        price_std = current_price * sigma * np.sqrt(T)
        z_upper = (upper_breakeven - current_price) / price_std
        z_lower = (lower_breakeven - current_price) / price_std
        
        prob_below_upper = stats.norm.cdf(z_upper) * 100
        prob_below_lower = stats.norm.cdf(z_lower) * 100
        probability_of_profit = prob_below_upper - prob_below_lower
        
        # Calculate individual leg probabilities
        prob_short_call_itm = calculate_probability_itm(current_price, request.short_call_strike, T, sigma, 'C') * 100
        prob_short_put_itm = calculate_probability_itm(current_price, request.short_put_strike, T, sigma, 'P') * 100
        
        # Optimal strike recommendations
        optimal_strikes = optimize_iron_condor_strikes(current_price, T, sigma, 0.70, 
                                                      max(call_spread_width, put_spread_width))
        
        # Sensitivity analysis
        upside_room = ((upper_breakeven - current_price) / current_price) * 100
        downside_room = ((current_price - lower_breakeven) / current_price) * 100
        
        # Calculate payoff at various price points
        price_points = np.linspace(current_price * 0.85, current_price * 1.15, 20)
        strikes = {
            'long_call': request.long_call_strike,
            'short_call': request.short_call_strike,
            'short_put': request.short_put_strike,
            'long_put': request.long_put_strike
        }
        payoff_profile = [
            {
                "price": round(float(price), 2),
                "pnl": round(calculate_iron_condor_payoff(price, strikes, net_credit), 2)
            }
            for price in price_points
        ]
        
        # Quality metrics
        score = calculate_strategy_score(return_on_risk, probability_of_profit, days_to_expiration)
        rating = get_strategy_rating(return_on_risk, probability_of_profit)
        
        return {
            "success": True,
            "analysis": {
                "risk_reward": {
                    "max_profit": round(max_profit, 2),
                    "max_loss": round(max_loss, 2),
                    "return_on_risk_percent": round(return_on_risk, 2),
                    "risk_reward_ratio": round(max_profit / max_loss, 3) if max_loss > 0 else 0,
                    "net_credit": round(net_credit, 2)
                },
                "breakevens": {
                    "upper": round(upper_breakeven, 2),
                    "lower": round(lower_breakeven, 2),
                    "range": round(upper_breakeven - lower_breakeven, 2),
                    "range_percent": round((upper_breakeven - lower_breakeven) / current_price * 100, 2)
                },
                "probability": {
                    "profit_percent": round(probability_of_profit, 2),
                    "loss_percent": round(100 - probability_of_profit, 2),
                    "short_call_itm_percent": round(prob_short_call_itm, 2),
                    "short_put_itm_percent": round(prob_short_put_itm, 2),
                    "method": "black_scholes_normal_distribution"
                },
                "sensitivity": {
                    "upside_room_percent": round(upside_room, 2),
                    "downside_room_percent": round(downside_room, 2),
                    "days_to_expiration": days_to_expiration,
                    "implied_volatility": sigma,
                    "current_price": current_price
                },
                "recommendations": {
                    "optimal_long_call_strike": optimal_strikes['long_call'],
                    "optimal_short_call_strike": optimal_strikes['short_call'],
                    "optimal_short_put_strike": optimal_strikes['short_put'],
                    "optimal_long_put_strike": optimal_strikes['long_put'],
                    "reasoning": f"Strikes optimized for ~70% probability of profit based on {sigma:.0%} IV"
                },
                "quality_metrics": {
                    "score": score,
                    "rating": rating,
                    "factors": {
                        "return_on_risk": "Good" if return_on_risk > 20 else "Fair" if return_on_risk > 10 else "Poor",
                        "probability_of_profit": "Good" if probability_of_profit > 65 else "Fair" if probability_of_profit > 50 else "Poor",
                        "time_to_expiration": "Optimal" if 30 <= days_to_expiration <= 45 else "Acceptable" if days_to_expiration > 20 else "Risky"
                    }
                },
                "payoff_profile": payoff_profile
            },
            "timestamp": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        logger.error(f"Iron condor analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/iron-condor/greeks")
async def calculate_iron_condor_greeks(request: IronCondorGreeksRequest):
    """
    Calculate combined Greeks for iron condor position
    
    Returns:
        Portfolio-level Greeks, individual leg breakdown, risk profile, and interpretations
    """
    try:
        lc = request.long_call_greeks
        sc = request.short_call_greeks
        sp = request.short_put_greeks
        lp = request.long_put_greeks
        contracts = request.contracts
        
        # Calculate net Greeks (long = negative, short = positive)
        portfolio_delta = (
            -lc.get('delta', 0) +
            sc.get('delta', 0) +
            sp.get('delta', 0) +
            -lp.get('delta', 0)
        ) * contracts * 100
        
        portfolio_gamma = (
            -lc.get('gamma', 0) +
            sc.get('gamma', 0) +
            sp.get('gamma', 0) +
            -lp.get('gamma', 0)
        ) * contracts * 100
        
        portfolio_theta = (
            -lc.get('theta', 0) +
            sc.get('theta', 0) +
            sp.get('theta', 0) +
            -lp.get('theta', 0)
        ) * contracts * 100
        
        portfolio_vega = (
            -lc.get('vega', 0) +
            sc.get('vega', 0) +
            sp.get('vega', 0) +
            -lp.get('vega', 0)
        ) * contracts * 100
        
        # Individual leg contributions
        legs_breakdown = {
            "long_call": {
                "delta": round(-lc.get('delta', 0) * contracts * 100, 4),
                "gamma": round(-lc.get('gamma', 0) * contracts * 100, 4),
                "theta": round(-lc.get('theta', 0) * contracts * 100, 4),
                "vega": round(-lc.get('vega', 0) * contracts * 100, 4)
            },
            "short_call": {
                "delta": round(sc.get('delta', 0) * contracts * 100, 4),
                "gamma": round(sc.get('gamma', 0) * contracts * 100, 4),
                "theta": round(sc.get('theta', 0) * contracts * 100, 4),
                "vega": round(sc.get('vega', 0) * contracts * 100, 4)
            },
            "short_put": {
                "delta": round(sp.get('delta', 0) * contracts * 100, 4),
                "gamma": round(sp.get('gamma', 0) * contracts * 100, 4),
                "theta": round(sp.get('theta', 0) * contracts * 100, 4),
                "vega": round(sp.get('vega', 0) * contracts * 100, 4)
            },
            "long_put": {
                "delta": round(-lp.get('delta', 0) * contracts * 100, 4),
                "gamma": round(-lp.get('gamma', 0) * contracts * 100, 4),
                "theta": round(-lp.get('theta', 0) * contracts * 100, 4),
                "vega": round(-lp.get('vega', 0) * contracts * 100, 4)
            }
        }
        
        # Risk interpretation
        risk_profile = {
            "delta_neutral": abs(portfolio_delta) < 5,
            "positive_theta": portfolio_theta > 0,
            "negative_vega": portfolio_vega < 0,
            "gamma_risk": "low" if abs(portfolio_gamma) < 0.1 else "moderate" if abs(portfolio_gamma) < 0.5 else "high"
        }
        
        # Daily P&L estimates
        daily_theta_pnl = portfolio_theta
        daily_move_1pct = portfolio_delta * 0.01
        
        return {
            "success": True,
            "portfolio_greeks": {
                "delta": round(portfolio_delta, 4),
                "gamma": round(portfolio_gamma, 4),
                "theta": round(portfolio_theta, 4),
                "vega": round(portfolio_vega, 4)
            },
            "legs_breakdown": legs_breakdown,
            "risk_profile": risk_profile,
            "daily_estimates": {
                "theta_decay_pnl": round(daily_theta_pnl, 2),
                "pnl_if_underlying_up_1pct": round(daily_move_1pct, 2),
                "pnl_if_underlying_down_1pct": round(-daily_move_1pct, 2)
            },
            "interpretation": {
                "delta": "Position is delta-neutral" if risk_profile["delta_neutral"] else f"Position has directional bias (delta: {round(portfolio_delta, 2)})",
                "theta": "Position benefits from time decay" if risk_profile["positive_theta"] else "Position loses value over time",
                "vega": "Position benefits from decreasing volatility" if risk_profile["negative_vega"] else "Position benefits from increasing volatility",
                "gamma": f"Gamma risk is {risk_profile['gamma_risk']}"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Greeks calculation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Greeks calculation failed: {str(e)}")

@app.post("/iron-condor/optimize")
async def optimize_iron_condor(request: IronCondorOptimizationRequest):
    """
    Optimize iron condor strikes for target probability of profit
    
    Returns:
        Optimized strike prices and expected performance metrics
    """
    try:
        expiration = datetime.strptime(request.expiration_date, "%Y-%m-%d")
        days_to_expiration = (expiration - datetime.now()).days
        T = days_to_expiration / 365.0
        
        if T <= 0:
            raise HTTPException(status_code=400, detail="Expiration must be in future")
        
        # Optimize strikes
        optimal_strikes = optimize_iron_condor_strikes(
            request.current_price,
            T,
            request.implied_volatility,
            request.target_probability,
            request.wing_width
        )
        
        # Calculate expected metrics with optimal strikes
        analysis_request = IronCondorAnalysisRequest(
            symbol=request.symbol,
            expiration_date=request.expiration_date,
            long_call_strike=optimal_strikes['long_call'],
            short_call_strike=optimal_strikes['short_call'],
            short_put_strike=optimal_strikes['short_put'],
            long_put_strike=optimal_strikes['long_put'],
            contracts=request.contracts,
            current_price=request.current_price,
            implied_volatility=request.implied_volatility
        )
        
        analysis = await analyze_iron_condor(analysis_request)
        
        return {
            "success": True,
            "optimal_strikes": optimal_strikes,
            "expected_performance": analysis["analysis"],
            "optimization_parameters": {
                "target_probability": request.target_probability,
                "wing_width": request.wing_width,
                "current_price": request.current_price,
                "implied_volatility": request.implied_volatility,
                "days_to_expiration": days_to_expiration
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.post("/iron-condor/monitor")
async def monitor_position(request: PositionMonitorRequest):
    """
    Monitor iron condor position and provide real-time analysis
    
    Returns:
        Current position status, P&L, Greeks, and alerts
    """
    try:
        # This would integrate with real market data in production
        expiration = datetime.strptime(request.expiration_date, "%Y-%m-%d")
        days_to_expiration = (expiration - datetime.now()).days
        
        # Calculate current metrics (placeholder - use real market data)
        current_price = request.market_data.get('price', 4500.0) if hasattr(request, 'market_data') else 4500.0
        
        # Calculate current P&L
        strikes = request.strikes
        current_pnl = calculate_iron_condor_payoff(current_price, strikes, request.entry_credit)
        
        # Check for alerts
        alerts = []
        pnl_percent = (current_pnl / abs(request.entry_credit)) * 100
        
        if pnl_percent >= 50:
            alerts.append({
                "type": "PROFIT_TARGET",
                "message": f"Position has reached {pnl_percent:.1f}% of max profit",
                "severity": "INFO"
            })
        
        if current_pnl < -request.entry_credit * 0.5:
            alerts.append({
                "type": "LOSS_THRESHOLD",
                "message": f"Position has lost {abs(current_pnl / request.entry_credit * 100):.1f}% of max profit",
                "severity": "WARNING"
            })
        
        if days_to_expiration <= 7:
            alerts.append({
                "type": "EXPIRATION_WARNING",
                "message": f"Position expires in {days_to_expiration} days",
                "severity": "INFO"
            })
        
        return {
            "success": True,
            "position_status": {
                "strategy_id": request.strategy_id,
                "current_price": current_price,
                "current_pnl": round(current_pnl, 2),
                "pnl_percent": round(pnl_percent, 2),
                "days_to_expiration": days_to_expiration,
                "entry_credit": request.entry_credit
            },
            "alerts": alerts,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Position monitoring failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Monitoring failed: {str(e)}")

@app.post("/iron-condor/batch-update")
async def batch_update_positions(request: RealTimeUpdateRequest):
    """
    Batch update multiple iron condor positions with real-time data
    
    Returns:
        Updated metrics for all positions
    """
    try:
        updates = []
        
        for position in request.positions:
            # Calculate current metrics for each position
            current_price = request.market_data.get(position['symbol'], position.get('entry_price', 4500))
            
            # This is a simplified example - implement full logic as needed
            update = {
                "position_id": position.get('id'),
                "symbol": position.get('symbol'),
                "current_price": current_price,
                "updated_at": datetime.now().isoformat()
            }
            updates.append(update)
        
        return {
            "success": True,
            "updates": updates,
            "total_updated": len(updates),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Batch update failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")

# ==================== Startup ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

"""
FastAPI Market Data Processing Service
This service provides HTTP endpoints for market data processing and analysis.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import random
import time
from datetime import datetime
import pandas as pd
import numpy as np

app = FastAPI(
    title="Market Data Processing Service",
    description="Python FastAPI service for market data processing and analysis",
    version="1.0.0"
)

# Add CORS middleware to allow requests from Deno backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
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

# Helper functions
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
        # Not enough data, return basic indicators
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

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Market Data Processing Service",
        "status": "online",
        "version": "1.0.0",
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
            # Generate or fetch price data
            price_data = generate_market_price(symbol)
            
            # Generate historical prices for indicators (simulation)
            historical_prices = [
                price_data["last"] * (1 + (random.random() - 0.5) * 0.01)
                for _ in range(50)
            ]
            
            # Calculate technical indicators
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
        raise HTTPException(status_code=500, detail=f"Failed to process market data: {str(e)}")

@app.get("/positions")
async def get_positions(account_id: Optional[str] = Query(None, description="Account ID")):
    """
    Retrieve current trading positions
    
    Args:
        account_id: Optional account identifier
        
    Returns:
        List of current positions with P&L information
    """
    try:
        # Generate sample positions (in production, fetch from actual broker API)
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
            },
            {
                "position_id": f"POS_{random.randint(1000, 9999)}",
                "symbol": "GBPUSD",
                "position_type": "SHORT",
                "quantity": 50000.0,
                "entry_price": 1.2650,
                "current_price": 1.2620,
                "unrealized_pnl": 150.0,
                "commission": 3.5,
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch positions: {str(e)}")

@app.get("/equity")
async def get_equity(account_id: Optional[str] = Query(None, description="Account ID")):
    """
    Retrieve account equity and balance information
    
    Args:
        account_id: Optional account identifier
        
    Returns:
        Current equity, balance, and margin information
    """
    try:
        # Generate sample equity data (in production, fetch from actual broker API)
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch equity: {str(e)}")

@app.post("/analyze")
async def analyze_market(symbols: List[str] = Query(..., description="Symbols to analyze")):
    """
    Perform advanced market analysis on given symbols
    
    Args:
        symbols: List of symbols to analyze
        
    Returns:
        Comprehensive market analysis including correlations and trends
    """
    try:
        if not symbols:
            raise HTTPException(status_code=400, detail="At least one symbol is required")
        
        # Generate correlation matrix
        correlation_matrix = {}
        for sym1 in symbols:
            correlation_matrix[sym1] = {}
            for sym2 in symbols:
                if sym1 == sym2:
                    correlation_matrix[sym1][sym2] = 1.0
                else:
                    # Simulate correlation
                    correlation_matrix[sym1][sym2] = round(random.random() * 0.8 + 0.1, 3)
        
        # Calculate market trends
        trends = {}
        for symbol in symbols:
            price_data = generate_market_price(symbol)
            trends[symbol] = {
                "trend": "bullish" if price_data["change_percent"] > 0 else "bearish",
                "strength": round(abs(price_data["change_percent"]) * 10, 1),
                "volatility": round(random.random() * 3 + 1, 2)
            }
        
        return {
            "success": True,
            "analysis": {
                "correlations": correlation_matrix,
                "trends": trends,
                "market_sentiment": {
                    "overall": "neutral",
                    "confidence": round(random.random() * 30 + 60, 1)
                }
            },
            "analyzed_symbols": len(symbols),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Iron Condor Strategy Models
class IronCondorAnalysisRequest(BaseModel):
    symbol: str
    expiration_date: str
    long_call_strike: float
    short_call_strike: float
    short_put_strike: float
    long_put_strike: float
    contracts: int
    current_price: Optional[float] = None
    implied_volatility: Optional[float] = 0.20  # Default 20% IV

class IronCondorGreeksRequest(BaseModel):
    long_call_greeks: Dict[str, float]
    short_call_greeks: Dict[str, float]
    short_put_greeks: Dict[str, float]
    long_put_greeks: Dict[str, float]
    contracts: int

# Iron Condor Endpoints
@app.post("/iron-condor/analyze")
async def analyze_iron_condor(request: IronCondorAnalysisRequest):
    """
    Analyze iron condor strategy
    
    Returns:
        - Risk/reward metrics
        - Optimal strike recommendations
        - Probability of profit
        - Sensitivity analysis
    """
    try:
        # Calculate spread widths
        call_spread_width = request.long_call_strike - request.short_call_strike
        put_spread_width = request.short_put_strike - request.long_put_strike
        
        # Estimate net credit (simplified - in production, use real option prices)
        # Assume short strikes are worth more than long strikes
        estimated_call_credit = call_spread_width * 0.4  # 40% of width
        estimated_put_credit = put_spread_width * 0.4
        net_credit = (estimated_call_credit + estimated_put_credit) * request.contracts * 100
        
        # Calculate max profit and loss
        max_profit = net_credit
        max_loss = (max(call_spread_width, put_spread_width) * request.contracts * 100) - net_credit
        
        # Calculate breakeven points
        credit_per_share = net_credit / (request.contracts * 100)
        upper_breakeven = request.short_call_strike + credit_per_share
        lower_breakeven = request.short_put_strike - credit_per_share
        
        # Calculate return on risk
        return_on_risk = (max_profit / max_loss) * 100 if max_loss > 0 else 0
        
        # Calculate probability of profit (using normal distribution approximation)
        if request.current_price:
            current_price = request.current_price
        else:
            # Estimate current price as midpoint of strikes
            current_price = (request.short_call_strike + request.short_put_strike) / 2
        
        # Days to expiration
        expiration = datetime.strptime(request.expiration_date, "%Y-%m-%d")
        days_to_expiration = (expiration - datetime.now()).days
        years_to_expiration = days_to_expiration / 365.0
        
        # Probability calculation using implied volatility
        iv = request.implied_volatility
        if years_to_expiration > 0 and iv > 0:
            # Standard deviation of price movement
            price_std = current_price * iv * np.sqrt(years_to_expiration)
            
            # Z-scores for breakeven points
            z_upper = (upper_breakeven - current_price) / price_std
            z_lower = (lower_breakeven - current_price) / price_std
            
            # Probability that price stays within range (between lower and upper breakeven)
            from scipy import stats
            prob_below_upper = stats.norm.cdf(z_upper)
            prob_below_lower = stats.norm.cdf(z_lower)
            probability_of_profit = (prob_below_upper - prob_below_lower) * 100
        else:
            probability_of_profit = 60.0  # Default estimate
        
        # Optimal strike recommendations
        # For iron condors, typically place short strikes at 1 standard deviation
        optimal_std = current_price * iv * np.sqrt(years_to_expiration)
        recommended_short_call = current_price + optimal_std
        recommended_short_put = current_price - optimal_std
        
        # Wing width recommendation (typically 5-10 points)
        recommended_wing_width = max(5, current_price * 0.02)
        
        # Sensitivity analysis - how much can underlying move before breakeven
        upside_room = ((upper_breakeven - current_price) / current_price) * 100
        downside_room = ((current_price - lower_breakeven) / current_price) * 100
        
        return {
            "success": True,
            "analysis": {
                "risk_reward": {
                    "max_profit": round(max_profit, 2),
                    "max_loss": round(max_loss, 2),
                    "return_on_risk_percent": round(return_on_risk, 2),
                    "risk_reward_ratio": round(max_profit / max_loss, 3) if max_loss > 0 else 0
                },
                "breakevens": {
                    "upper": round(upper_breakeven, 2),
                    "lower": round(lower_breakeven, 2),
                    "range": round(upper_breakeven - lower_breakeven, 2)
                },
                "probability": {
                    "profit_percent": round(probability_of_profit, 2),
                    "loss_percent": round(100 - probability_of_profit, 2),
                    "method": "normal_distribution_approximation"
                },
                "sensitivity": {
                    "upside_room_percent": round(upside_room, 2),
                    "downside_room_percent": round(downside_room, 2),
                    "days_to_expiration": days_to_expiration
                },
                "recommendations": {
                    "optimal_short_call_strike": round(recommended_short_call, 2),
                    "optimal_short_put_strike": round(recommended_short_put, 2),
                    "recommended_wing_width": round(recommended_wing_width, 2),
                    "reasoning": "Strikes placed at ~1 standard deviation from current price"
                },
                "quality_metrics": {
                    "score": calculate_strategy_score(return_on_risk, probability_of_profit, days_to_expiration),
                    "rating": get_strategy_rating(return_on_risk, probability_of_profit)
                }
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/iron-condor/greeks")
async def calculate_iron_condor_greeks(request: IronCondorGreeksRequest):
    """
    Calculate combined Greeks for iron condor position
    
    Args:
        request: Greeks for each of the four legs
        
    Returns:
        Portfolio-level Greeks and risk metrics
    """
    try:
        # Extract individual leg Greeks
        lc = request.long_call_greeks
        sc = request.short_call_greeks
        sp = request.short_put_greeks
        lp = request.long_put_greeks
        contracts = request.contracts
        
        # Calculate net Greeks (consider position direction)
        # Long positions: negative contribution to portfolio
        # Short positions: positive contribution to portfolio
        portfolio_delta = (
            -lc.get('delta', 0) +  # Long call
            sc.get('delta', 0) +    # Short call
            sp.get('delta', 0) +    # Short put
            -lp.get('delta', 0)     # Long put
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
        
        # Calculate individual leg contributions (for analysis)
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
        daily_theta_pnl = portfolio_theta  # Theta decay per day
        daily_move_1pct = portfolio_delta * 0.01  # P&L if underlying moves 1%
        
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
        raise HTTPException(status_code=500, detail=f"Greeks calculation failed: {str(e)}")

# Helper functions for iron condor analysis
def calculate_strategy_score(return_on_risk: float, probability_of_profit: float, days_to_expiration: int) -> float:
    """
    Calculate overall strategy quality score (0-100)
    """
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
    """
    Get qualitative rating for strategy
    """
    score = (return_on_risk * 2 * 0.4) + (probability_of_profit * 0.6)
    
    if score >= 80:
        return "Excellent"
    elif score >= 65:
        return "Good"
    elif score >= 50:
        return "Fair"
    else:
        return "Poor"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

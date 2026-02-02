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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

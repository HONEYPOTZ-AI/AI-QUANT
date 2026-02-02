# Market Data Processing Python Service

FastAPI service for advanced market data processing, options analytics, and iron condor strategy analysis.

## Features

- **Market Data Processing**: Real-time market data aggregation and technical indicators
- **Options Greeks**: Calculate portfolio-level Greeks for options positions
- **Iron Condor Analysis**: Risk/reward analysis and optimal strike selection
- **Position Management**: Fetch positions and equity data from trading platforms

## Installation

```bash
cd python_service
pip install -r requirements.txt
```

## Running the Service

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### General
- `GET /` - Service information
- `GET /health` - Health check

### Market Data
- `POST /market-data` - Fetch and process market data for symbols
- `GET /positions` - Get current trading positions
- `GET /equity` - Get account equity and balance
- `POST /analyze` - Perform market analysis

### Iron Condor Strategy
- `POST /iron-condor/analyze` - Analyze iron condor risk/reward
- `POST /iron-condor/greeks` - Calculate combined Greeks for iron condor

## Iron Condor Endpoints

### POST /iron-condor/analyze

Analyzes iron condor strategy setup and provides recommendations.

**Request Body:**
```json
{
  "symbol": "SPX",
  "expiration_date": "2024-12-20",
  "long_call_strike": 4600,
  "short_call_strike": 4550,
  "short_put_strike": 4400,
  "long_put_strike": 4350,
  "contracts": 1,
  "current_price": 4475,
  "implied_volatility": 0.20
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "risk_reward": {
      "max_profit": 800,
      "max_loss": 4200,
      "return_on_risk_percent": 19.05,
      "risk_reward_ratio": 0.190
    },
    "breakevens": {
      "upper": 4558,
      "lower": 4392,
      "range": 166
    },
    "probability": {
      "profit_percent": 68.5,
      "loss_percent": 31.5
    },
    "recommendations": {
      "optimal_short_call_strike": 4565,
      "optimal_short_put_strike": 4385
    }
  }
}
```

### POST /iron-condor/greeks

Calculates portfolio-level Greeks for iron condor position.

**Request Body:**
```json
{
  "long_call_greeks": {"delta": 0.25, "gamma": 0.01, "theta": -2, "vega": 15},
  "short_call_greeks": {"delta": 0.35, "gamma": 0.015, "theta": -3, "vega": 20},
  "short_put_greeks": {"delta": -0.35, "gamma": 0.015, "theta": -3, "vega": 20},
  "long_put_greeks": {"delta": -0.25, "gamma": 0.01, "theta": -2, "vega": 15},
  "contracts": 1
}
```

**Response:**
```json
{
  "success": true,
  "portfolio_greeks": {
    "delta": 0.0,
    "gamma": -0.8,
    "theta": 4.0,
    "vega": -20.0
  },
  "risk_profile": {
    "delta_neutral": true,
    "positive_theta": true,
    "negative_vega": true,
    "gamma_risk": "low"
  },
  "daily_estimates": {
    "theta_decay_pnl": 4.0,
    "pnl_if_underlying_up_1pct": 0.0
  }
}
```

## Integration with Deno Backend

The Deno backend (`__easysite_nodejs__/ironCondorStrategy.js`) calls this Python service for advanced analytics:

```javascript
// Example: Analyze iron condor setup
const response = await axios.post('http://localhost:8000/iron-condor/analyze', {
  symbol: 'SPX',
  expiration_date: '2024-12-20',
  // ... other parameters
});
```

## Environment Variables

Configure in `.env` file at project root (shared with frontend/Deno backend).

## Development

- API documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

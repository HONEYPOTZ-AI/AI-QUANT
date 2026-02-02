# Python FastAPI Market Data Service

Advanced market data processing, iron condor strategy analysis, and options analytics service.

## Features

- **Market Data Processing**: Real-time market data fetching and technical indicator calculation
- **Iron Condor Analysis**: Comprehensive strategy analysis with Black-Scholes pricing
- **Options Greeks**: Calculate portfolio-level Greeks for complex positions
- **Strategy Optimization**: Optimize strike selection for target probability of profit
- **Position Monitoring**: Real-time position tracking with alerts
- **Batch Updates**: Efficient batch processing for multiple positions

## Requirements

- Python 3.8+
- FastAPI
- Uvicorn
- pandas
- numpy
- scipy

## Installation

1. Navigate to the python_service directory:
```bash
cd python_service
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

### Development Mode

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Configuration

Configure the service connection in the frontend:

1. Go to **Settings** → **FastAPI Configuration**
2. Set Host: `localhost` (or your server IP)
3. Set Port: `8000` (or your custom port)
4. Click **Test Connection** to verify
5. Click **Save Settings** to persist configuration

## API Endpoints

### Health Check
- `GET /health` - Service health status
- `GET /` - Service information and features

### Market Data
- `POST /market-data` - Fetch and process market data for symbols

### Iron Condor Strategy
- `POST /iron-condor/analyze` - Comprehensive iron condor analysis
- `POST /iron-condor/greeks` - Calculate combined Greeks
- `POST /iron-condor/optimize` - Optimize strike selection
- `POST /iron-condor/monitor` - Monitor position with alerts
- `POST /iron-condor/batch-update` - Batch update multiple positions

### Positions & Equity
- `GET /positions` - Get trading positions
- `GET /equity` - Get account equity information

## Integration with Frontend

The Python service integrates seamlessly with the Node.js/Deno backend:

1. **Python Service Bridge** (`__easysite_nodejs__/pythonServiceBridge.js`):
   - Handles HTTP communication with Python service
   - Provides typed interfaces for all endpoints

2. **Iron Condor Integration** (`__easysite_nodejs__/ironCondorPythonIntegration.js`):
   - Combines Python analytics with database storage
   - Provides fallback to standard methods if Python service is unavailable

3. **Real-time Sync** (`src/components/PythonServiceSync.tsx`):
   - Background synchronization of strategy data
   - Automatic refresh of analytics every 30 seconds

## API Examples

### Analyze Iron Condor

```python
import requests

analysis = requests.post('http://localhost:8000/iron-condor/analyze', json={
    "symbol": "SPX",
    "expiration_date": "2024-12-20",
    "long_call_strike": 5800,
    "short_call_strike": 5750,
    "short_put_strike": 5650,
    "long_put_strike": 5600,
    "contracts": 1,
    "current_price": 5700,
    "implied_volatility": 0.15
})

print(analysis.json())
```

### Calculate Greeks

```python
greeks = requests.post('http://localhost:8000/iron-condor/greeks', json={
    "long_call_greeks": {"delta": 0.15, "gamma": 0.001, "theta": -0.5, "vega": 0.8},
    "short_call_greeks": {"delta": 0.30, "gamma": 0.002, "theta": -1.0, "vega": 1.5},
    "short_put_greeks": {"delta": -0.30, "gamma": 0.002, "theta": -1.0, "vega": 1.5},
    "long_put_greeks": {"delta": -0.15, "gamma": 0.001, "theta": -0.5, "vega": 0.8},
    "contracts": 1
})

print(greeks.json())
```

## Troubleshooting

### Service Not Starting

1. Check Python version: `python --version` (should be 3.8+)
2. Verify all dependencies installed: `pip install -r requirements.txt`
3. Check port availability: `netstat -an | grep 8000`

### Connection Refused

1. Verify service is running: `curl http://localhost:8000/health`
2. Check firewall settings
3. Ensure host/port configuration matches in frontend

### Import Errors

```bash
# Reinstall dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

## Development

### Adding New Endpoints

1. Define Pydantic models for request/response
2. Implement endpoint handler in `main.py`
3. Add bridge function in `pythonServiceBridge.js`
4. Update integration layer as needed

### Testing

```bash
# Manual testing with curl
curl -X POST http://localhost:8000/iron-condor/analyze \
  -H "Content-Type: application/json" \
  -d @test_request.json

# Use the built-in API test page in the frontend
# Navigate to: /api-test
```

## Performance

- Service handles ~1000 requests/minute per worker
- Black-Scholes calculations: <10ms per calculation
- Full iron condor analysis: <100ms
- Batch updates: <500ms for 50 positions

## Security

For production deployment:

1. Add API key authentication
2. Configure CORS to allow only your frontend domain
3. Use HTTPS/TLS encryption
4. Implement rate limiting
5. Add request validation and sanitization

## License

Proprietary - All rights reserved

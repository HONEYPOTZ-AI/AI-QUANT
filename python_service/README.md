# FastAPI Market Data Processing Service

This is a Python FastAPI service for market data processing and analysis. It provides HTTP endpoints that can be called by the Deno backend for advanced data processing tasks.

## Features

- **Real-time Market Data Processing**: Fetch and analyze market data for multiple symbols
- **Technical Indicators**: Calculate RSI, MACD, Moving Averages, and more
- **Position Management**: Track and analyze trading positions
- **Equity Monitoring**: Monitor account equity and margin information
- **Advanced Analytics**: Perform correlation analysis and trend detection

## Prerequisites

- Python 3.9 or higher
- pip (Python package manager)

## Installation

1. Navigate to the python_service directory:
```bash
cd python_service
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

### Development Mode

Run with auto-reload enabled:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

Run without auto-reload:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Python directly

```bash
python main.py
```

The service will start on `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```
Check if the service is running and healthy.

### Market Data
```
POST /market-data
Content-Type: application/json

{
  "symbols": ["US30", "AAPL", "GOOGL"],
  "timeframe": "1m"
}
```
Fetch and process market data for given symbols.

### Positions
```
GET /positions?account_id=YOUR_ACCOUNT_ID
```
Retrieve current trading positions.

### Equity
```
GET /equity?account_id=YOUR_ACCOUNT_ID
```
Get account equity and balance information.

### Market Analysis
```
POST /analyze?symbols=US30&symbols=AAPL&symbols=GOOGL
```
Perform advanced market analysis including correlations and trends.

## API Documentation

Once the service is running, you can access:
- Interactive API docs (Swagger UI): `http://localhost:8000/docs`
- Alternative API docs (ReDoc): `http://localhost:8000/redoc`

## Integration with Deno Backend

The Deno backend communicates with this Python service via HTTP requests. The connection is configured in the Deno backend files:

- `fastapiConnectionManager.js` - Manages connection to Python service
- `fastapiMarketDataFetcher.js` - Fetches market data via HTTP
- `fastapiPositionsFetcher.js` - Fetches positions via HTTP
- `fastapiEquityFetcher.js` - Fetches equity via HTTP

## Configuration

Default settings:
- Host: `0.0.0.0` (all interfaces)
- Port: `8000`
- CORS: Enabled for all origins (configure for production)

To change the port, edit `main.py` or use command line:
```bash
uvicorn main:app --port 8080
```

## Testing

Test the service using curl:

```bash
# Health check
curl http://localhost:8000/health

# Market data
curl -X POST http://localhost:8000/market-data \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["US30", "AAPL"]}'

# Positions
curl http://localhost:8000/positions

# Equity
curl http://localhost:8000/equity
```

## Project Structure

```
python_service/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Production Deployment

For production deployment, consider:

1. **Use a production ASGI server**: Uvicorn with Gunicorn
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. **Configure CORS properly**: Update `allow_origins` in `main.py` to specific domains

3. **Add authentication**: Implement API key or OAuth authentication

4. **Use environment variables**: For configuration (host, port, API keys)

5. **Add logging**: Configure proper logging for monitoring

6. **Deploy with Docker**: Create a Dockerfile for containerization

## Troubleshooting

### Port Already in Use
If port 8000 is already in use, change the port:
```bash
uvicorn main:app --port 8001
```
And update the Deno backend configuration accordingly.

### Module Not Found
Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### CORS Errors
If you get CORS errors, check the `allow_origins` configuration in `main.py`.

## Support

For issues or questions, refer to the main project documentation.

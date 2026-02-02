# Python FastAPI Service Integration Guide

This document explains the complete integration between the React frontend, Node.js/Deno backend, and Python FastAPI service for iron condor strategy analysis.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                         │
│  (IronCondorPage.tsx, FastAPIConfiguration.tsx)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ window.ezsite.apis.run()
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Deno/Node.js Backend                      │
│  • pythonServiceBridge.js (HTTP communication)              │
│  • ironCondorPythonIntegration.js (Business logic)          │
│  • ironCondorStrategy.js (Database operations)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP REST API
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Python FastAPI Service                    │
│  • Black-Scholes Options Pricing                            │
│  • Greeks Calculation                                        │
│  • Strategy Optimization                                     │
│  • Technical Indicators                                      │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Components

#### 1. **FastAPIConfiguration.tsx**
Configuration interface for Python service connection.

**Features:**
- Host and port configuration
- Connection testing
- Service status display
- Settings persistence

**Usage:**
```tsx
import FastAPIConfiguration from '@/components/FastAPIConfiguration';

<FastAPIConfiguration />
```

#### 2. **PythonServiceSync.tsx**
Headless component for real-time data synchronization.

**Features:**
- Background data sync every 30 seconds
- Automatic query invalidation
- Error handling with retry logic

**Usage:**
```tsx
import PythonServiceSync from '@/components/PythonServiceSync';

<PythonServiceSync 
  enabled={true}
  interval={30000}
  strategyIds={[1, 2, 3]}
/>
```

#### 3. **PythonServiceStatus.tsx**
Visual indicator of Python service connection status.

**Features:**
- Real-time status monitoring
- Tooltip with service details
- Auto-refresh every 60 seconds

**Usage:**
```tsx
import PythonServiceStatus from '@/components/PythonServiceStatus';

<PythonServiceStatus />
```

### Backend Handlers

#### 1. **pythonServiceBridge.js**
Low-level HTTP communication with Python service.

**Functions:**
- `testPythonServiceConnection(host, port)` - Test connection
- `fetchPythonMarketData(symbols)` - Fetch market data
- `analyzePythonIronCondor(config)` - Analyze strategy
- `calculatePythonIronCondorGreeks(request)` - Calculate Greeks
- `optimizePythonIronCondor(request)` - Optimize strikes
- `monitorPythonPosition(request)` - Monitor position

**Example:**
```javascript
import { analyzePythonIronCondor } from './pythonServiceBridge.js';

const analysis = await analyzePythonIronCondor({
  symbol: 'SPX',
  expiration_date: '2024-12-20',
  long_call_strike: 5800,
  short_call_strike: 5750,
  short_put_strike: 5650,
  long_put_strike: 5600,
  contracts: 1,
  implied_volatility: 0.15
});
```

#### 2. **ironCondorPythonIntegration.js**
High-level integration combining Python analytics with database operations.

**Functions:**
- `createIronCondorWithPython(userId, config)` - Create strategy with Python analytics
- `updateStrategyWithPython(strategyId)` - Update with latest Python data
- `getOptimizationRecommendations(...)` - Get optimal strikes

**Example:**
```javascript
const strategy = await createIronCondorWithPython(userId, {
  symbol: 'SPX',
  expirationDate: '2024-12-20',
  longCallStrike: 5800,
  shortCallStrike: 5750,
  shortPutStrike: 5650,
  longPutStrike: 5600,
  contracts: 1,
  impliedVolatility: 0.15
});
```

#### 3. **ironCondorStrategy.js**
Original strategy handler with fallback capabilities.

**Purpose:**
- Provides fallback when Python service is unavailable
- Handles all database operations
- Maintains backward compatibility

## Data Flow

### Creating an Iron Condor Strategy

1. **User Input** (IronCondorPage.tsx)
   - User fills out strategy form
   - Form data validated on frontend

2. **API Call** (Frontend → Backend)
   ```typescript
   const result = await window.ezsite.apis.run({
     path: 'ironCondorPythonIntegration',
     methodName: 'createIronCondorWithPython',
     param: [userId, strategyConfig]
   });
   ```

3. **Python Analytics** (Backend → Python)
   ```javascript
   const pythonAnalysis = await analyzePythonIronCondor({
     symbol: config.symbol,
     expiration_date: config.expirationDate,
     // ... other parameters
   });
   ```

4. **Database Storage** (Backend → Database)
   ```javascript
   await easysite.table.create(74342, {
     user_id: userId,
     // ... strategy data
     // ... Python analytics results
   });
   ```

5. **Response** (Backend → Frontend)
   ```javascript
   return {
     strategyId: createdStrategy.id,
     pythonAnalysis,
     message: 'Strategy created with Python analytics'
   };
   ```

### Real-time Updates

1. **Background Sync** (PythonServiceSync component)
   - Runs every 30 seconds
   - Fetches latest analytics for active strategies

2. **Query Invalidation**
   - React Query automatically refetches data
   - UI updates with latest information

3. **Manual Refresh**
   - Users can manually trigger refresh
   - Immediate data update

## Error Handling

### Graceful Degradation

The system implements a fallback mechanism:

1. **Try Python-enhanced method first**
   ```javascript
   try {
     const result = await createIronCondorWithPython(userId, config);
     return result; // With Python analytics
   } catch (pythonError) {
     console.warn('Python service unavailable, using standard method');
     const result = await createIronCondor(userId, config);
     return result; // Without Python analytics
   }
   ```

2. **User Notification**
   - Toast notification indicates Python analytics availability
   - Status indicator shows service connection state

3. **Continued Functionality**
   - System remains functional even if Python service is offline
   - Basic analytics provided by Node.js backend

## Configuration

### Environment Variables

```env
# Python Service (optional - defaults used if not set)
PYTHON_SERVICE_HOST=localhost
PYTHON_SERVICE_PORT=8000
```

### Frontend Configuration

Stored in localStorage:
```json
{
  "host": "localhost",
  "port": "8000",
  "isEnabled": true
}
```

### Database Tables

**iron_condor_strategies** (ID: 74342)
- Stores strategy details
- Updated with Python analytics results

**iron_condor_alerts** (ID: 74343)
- Stores triggered alerts

**iron_condor_performance** (ID: 74344)
- Stores performance snapshots

## Starting the Services

### 1. Start Python Service

```bash
cd python_service
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Configure Frontend

1. Navigate to Settings → FastAPI Configuration
2. Enter Host: `localhost`
3. Enter Port: `8000`
4. Click "Test Connection"
5. Click "Save Settings"

### 3. Verify Integration

1. Check Python service status indicator
2. Create a test iron condor strategy
3. Verify Python analytics in toast notification
4. Monitor real-time updates

## API Endpoints

### Python Service Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/` | GET | Service info |
| `/market-data` | POST | Market data processing |
| `/iron-condor/analyze` | POST | Strategy analysis |
| `/iron-condor/greeks` | POST | Greeks calculation |
| `/iron-condor/optimize` | POST | Strike optimization |
| `/iron-condor/monitor` | POST | Position monitoring |
| `/iron-condor/batch-update` | POST | Batch updates |
| `/positions` | GET | Get positions |
| `/equity` | GET | Get equity |

### Backend Bridge Functions

All bridge functions follow this pattern:

```javascript
export async function functionName(params) {
  const serviceUrl = getServiceUrl();
  
  try {
    const response = await axios.post(
      `${serviceUrl}/endpoint`,
      params,
      { timeout: REQUEST_TIMEOUT }
    );
    
    if (!response.data?.success) {
      throw new Error('Request failed');
    }
    
    return response.data;
  } catch (error) {
    throw new Error(`Operation failed: ${error.message}`);
  }
}
```

## Testing

### Manual Testing

1. **Connection Test**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Strategy Analysis**
   ```bash
   curl -X POST http://localhost:8000/iron-condor/analyze \
     -H "Content-Type: application/json" \
     -d '{"symbol":"SPX","expiration_date":"2024-12-20",...}'
   ```

### Frontend Testing

1. Use built-in API test page at `/api-test`
2. Test connection in FastAPI Configuration
3. Create test iron condor strategy

## Performance Considerations

### Caching

- React Query caches API responses
- Stale time configured per query
- Background refetch for real-time data

### Request Optimization

- Batch updates for multiple positions
- Debounced API calls
- Request timeout: 30 seconds

### Resource Usage

- Python service: ~50-100ms per analysis
- Database operations: ~10-20ms
- Total end-to-end: ~100-200ms

## Troubleshooting

### Common Issues

1. **"Connection Failed" Error**
   - Verify Python service is running
   - Check firewall settings
   - Confirm host/port configuration

2. **"Service Unavailable" Warning**
   - Python service offline (fallback active)
   - Check Python service logs
   - Restart Python service

3. **Stale Data**
   - Check PythonServiceSync interval
   - Manually refresh page
   - Clear React Query cache

### Debug Mode

Enable detailed logging:

```javascript
// In browser console
localStorage.setItem('debug', 'python-service:*');
```

## Security Considerations

### Production Deployment

1. **Add Authentication**
   - API key header
   - JWT tokens
   - OAuth integration

2. **Configure CORS**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://yourdomain.com"],
       allow_credentials=True,
       allow_methods=["POST", "GET"],
       allow_headers=["*"],
   )
   ```

3. **Use HTTPS**
   - SSL/TLS certificates
   - Secure WebSocket connections

4. **Rate Limiting**
   - Implement per-user limits
   - Add request throttling

## Future Enhancements

1. **WebSocket Support**
   - Real-time streaming updates
   - Live position monitoring

2. **Caching Layer**
   - Redis for market data
   - Reduce API calls

3. **Advanced Analytics**
   - Machine learning predictions
   - Pattern recognition
   - Volatility forecasting

4. **Multi-Strategy Support**
   - Butterfly spreads
   - Calendar spreads
   - Custom combinations

## Support

For issues or questions:
1. Check logs in Python service
2. Review browser console for errors
3. Test connection with curl
4. Verify database table structure

## License

Proprietary - All rights reserved

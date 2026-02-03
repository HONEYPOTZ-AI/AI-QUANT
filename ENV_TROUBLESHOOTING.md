# Environment Variables Troubleshooting Guide

## ✅ Current Configuration Status

Your environment is **properly configured**. Here's what's set up:

### 1. .env File Location ✅
- **Location**: Project root directory
- **File**: `.env`
- **Status**: Configured correctly

### 2. Environment Variables ✅
```
POLYGON_API_KEY=SfT6VXJpySjdDdHyNP6SZNZgETYSDieA
VITE_APP_NAME="Trading Dashboard"
```

### 3. Security Configuration ✅
- ✅ `.env` file is listed in `.gitignore`
- ✅ API keys are NOT exposed to frontend
- ✅ Backend-only access pattern implemented

---

## 🔒 How Environment Variables Work in This Project

### Backend (Deno) Access - ✅ CORRECT METHOD
Backend files in `__easysite_nodejs__/` can directly access environment variables:

```javascript
// __easysite_nodejs__/example.js
export function getApiKey() {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in .env file');
  }
  
  return { configured: true };
}
```

### Frontend Access - ❌ CANNOT Access Backend Env Vars
Frontend code **CANNOT** and **SHOULD NOT** access `POLYGON_API_KEY`:

```javascript
// ❌ WRONG - Frontend cannot access backend environment variables
const apiKey = import.meta.env.POLYGON_API_KEY;  // undefined

// ❌ WRONG - Even with VITE_ prefix, DO NOT expose API keys
const apiKey = import.meta.env.VITE_POLYGON_API_KEY;  // Security risk!
```

**Correct Pattern**: Frontend calls backend functions:
```javascript
// ✅ CORRECT - Frontend calls backend securely
const { data, error } = await window.ezsite.apis.run({
  path: 'polygonMarketDataFetcher',
  methodName: 'getMarketOverviewData',
  param: []
});
```

---

## 🐛 Common Issues and Solutions

### Issue 1: "POLYGON_API_KEY is not configured" Error

**Symptoms:**
- Backend throws error about missing API key
- Functions like `getMarketOverviewData()` fail

**Solution:**
1. Verify `.env` file exists in project root:
   ```bash
   ls -la .env
   ```

2. Check file contents:
   ```bash
   cat .env
   ```

3. Ensure variable is set (no quotes needed):
   ```
   POLYGON_API_KEY=SfT6VXJpySjdDdHyNP6SZNZgETYSDieA
   ```

4. **Restart the development server** after changing `.env`:
   ```bash
   # Stop current server (Ctrl+C)
   # Start again
   npm run dev
   ```

### Issue 2: Frontend Gets "undefined" for Environment Variable

**Symptoms:**
- `import.meta.env.POLYGON_API_KEY` returns `undefined`
- Frontend code cannot access the variable

**Explanation:**
This is **correct behavior**! Frontend should NOT access backend API keys.

**Solution:**
Call backend functions instead:
```javascript
// Backend file: __easysite_nodejs__/myService.js
export async function fetchData() {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  // Use apiKey for API calls
  return data;
}

// Frontend code: src/components/MyComponent.tsx
const { data, error } = await window.ezsite.apis.run({
  path: 'myService',
  methodName: 'fetchData',
  param: []
});
```

### Issue 3: "Cannot update a component while rendering" React Warning

**Symptoms:**
- Console warning about setState during render
- Usually related to toast notifications

**Solution:**
Import `toast` correctly:
```javascript
// ❌ WRONG
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();  // Causes render issues

// ✅ CORRECT
import { toast } from '@/hooks/use-toast';
// Use directly: toast({ title: '...', description: '...' })
```

---

## 🔧 Verification Steps

### 1. Check Backend Environment Access
Visit the API Test page and click "Verify" in the Environment Configuration card:
- Navigate to: `/api-test`
- Check "Environment Configuration" section
- Should show: ✅ API key found (32 characters)

### 2. Test Backend API Calls
Run the full verification:
- Navigate to: `/api-test`
- Click "Run Verification" button
- All tests should pass with green checkmarks

### 3. Check Browser Console
Open Developer Tools (F12) and check console for:
```
✅ POLYGON_API_KEY found and configured
✅ Returning cached market overview data
✅ Market overview data cached: X indices, Y forex, Z crypto
```

---

## 📁 File Structure

```
your-project/
├── .env                              # ✅ Environment variables (DO NOT commit)
├── .gitignore                        # ✅ Excludes .env from Git
├── vite.config.ts                    # Vite configuration
├── ENVIRONMENT_SETUP.md              # Setup documentation
├── ENV_TROUBLESHOOTING.md           # This file
│
├── __easysite_nodejs__/             # Backend code (Deno)
│   ├── envVerification.js           # Environment verification
│   ├── polygonMarketDataFetcher.js  # Uses POLYGON_API_KEY
│   └── ...
│
└── src/                             # Frontend code (React)
    ├── components/
    │   ├── EnvVerification.tsx      # Shows env status
    │   ├── PolygonAPITestPanel.tsx  # Tests backend APIs
    │   └── ...
    └── pages/
        └── APITestPage.tsx           # Full testing page
```

---

## 🎯 Best Practices

1. **Never Commit .env File**
   - Always keep `.env` in `.gitignore`
   - Share credentials securely (not via Git)

2. **Backend-Only API Keys**
   - All API keys should be accessed from backend only
   - Frontend calls backend functions

3. **Environment Variable Naming**
   - Backend-only: `API_KEY_NAME`
   - Frontend-safe (non-sensitive): `VITE_APP_NAME`

4. **Restart After Changes**
   - Always restart dev server after editing `.env`
   - Environment variables are loaded at startup

5. **Test Regularly**
   - Use the API Test page (`/api-test`)
   - Verify environment configuration
   - Run full integration tests

---

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check .env file location**
   - Must be in project root (same level as `package.json`)
   - Not in `src/` or `__easysite_nodejs__/`

2. **Verify file permissions**
   ```bash
   chmod 644 .env
   ```

3. **Check for typos**
   - Variable name: `POLYGON_API_KEY` (exact match)
   - No spaces around `=` sign
   - No quotes needed for simple values

4. **Clear cache and restart**
   ```bash
   # Stop server
   # Clear Node cache
   rm -rf node_modules/.vite
   # Restart
   npm run dev
   ```

5. **Check backend logs**
   - Look for error messages in terminal
   - Check browser console for API errors

---

## ✅ Confirmation Checklist

- [ ] `.env` file exists in project root
- [ ] `POLYGON_API_KEY` is set in `.env`
- [ ] `.env` is listed in `.gitignore`
- [ ] Development server restarted after `.env` changes
- [ ] Environment verification shows ✅ success
- [ ] API test page shows all tests passing
- [ ] No React warnings in console
- [ ] Market data loads successfully

If all items are checked, your environment is properly configured! 🎉

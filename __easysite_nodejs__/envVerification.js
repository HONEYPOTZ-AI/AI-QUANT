/**
 * Environment Variable Verification
 * Verifies that the .env file is properly configured and POLYGON_API_KEY is available
 */

export function verifyPolygonApiKey() {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  
  if (!apiKey) {
    return {
      exists: false,
      length: 0,
      masked: null,
      message: 'POLYGON_API_KEY not found in environment variables'
    };
  }
  
  // Mask the API key: show first 4 and last 4 characters
  const masked = apiKey.length > 8
    ? `${apiKey.slice(0, 4)}${'*'.repeat(Math.max(apiKey.length - 8, 4))}${apiKey.slice(-4)}`
    : '*'.repeat(apiKey.length);
  
  return {
    exists: true,
    length: apiKey.length,
    masked: masked,
    message: 'POLYGON_API_KEY found and configured'
  };
}

export function verifyAllEnvVariables() {
  const variables = [
    'POLYGON_API_KEY',
    'VITE_APP_NAME',
    'VITE_API_URL'
  ];
  
  const results = {};
  
  for (const varName of variables) {
    const value = Deno.env.get(varName);
    results[varName] = {
      exists: !!value,
      length: value ? value.length : 0
    };
  }
  
  return results;
}

# API Connection Guide

This guide will help you connect your frontend to the Decentralized Belt System backend API.

## 🔧 Configuration

### 1. Update API URL

The API URL is configured in `src/config/api.ts`. You can modify this file directly or set an environment variable:

**Option A: Direct file modification**
```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'http://your-backend-server:port', // Update this line
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 0,
};
```

**Option B: Environment variable (recommended)**
```bash
# Create .env.local file (not committed to git)
NEXT_PUBLIC_API_URL=http://your-backend-server:port
```

### 2. Common Backend URLs

- **Local development**: `http://localhost:8000`
- **Docker**: `http://localhost:8000`
- **Remote server**: `http://your-server-ip:8000`
- **HTTPS**: `https://your-domain.com`

## 🧪 Testing the Connection

### Method 1: Web Interface
1. Start your frontend: `npm run dev`
2. Navigate to the Dashboard
3. Scroll down to the "API Connection Test" section
4. Click "Test API Connection"
5. Review the results for each endpoint

### Method 2: Command Line
```bash
# Test with default URL (localhost:8000)
node scripts/test-api.js

# Test with custom URL
API_URL=http://your-server:port node scripts/test-api.js
```

### Method 3: Browser Developer Tools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate through the app pages
4. Check for failed requests and error messages

## 🚨 Common Issues & Solutions

### 1. Connection Refused
```
❌ Error: connect ECONNREFUSED 127.0.0.1:8000
```
**Solution**: Make sure your backend server is running and accessible

### 2. CORS Errors
```
❌ CORS policy: No 'Access-Control-Allow-Origin' header
```
**Solution**: Configure your backend to allow CORS requests from your frontend domain

### 3. Timeout Errors
```
❌ Error: Request timeout
```
**Solution**: Increase timeout in `src/config/api.ts` or check network connectivity

### 4. 404 Not Found
```
❌ Error: 404 Not Found
```
**Solution**: Verify the API endpoints match your backend implementation

## 🔍 API Endpoints

The frontend expects these endpoints to be available:

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/belts` | GET | List all belts with filtering |
| `/belts/count` | GET | Get total belts count |
| `/belts/frequency` | GET | Get belt distribution |
| `/profiles` | GET | List all profiles |
| `/profiles/count` | GET | Get total profiles count |
| `/promotions` | GET | List pending promotions |
| `/promotions/count` | GET | Get pending promotions count |
| `/practitioner/{id}` | GET | Get practitioner profile |
| `/organization/{id}` | GET | Get organization profile |

## 🛠️ Backend Setup Checklist

- [ ] Backend server is running and accessible
- [ ] API endpoints are implemented and working
- [ ] CORS is configured to allow frontend requests
- [ ] Response format matches expected types
- [ ] Authentication/authorization is properly configured (if required)

## 📱 Testing Different Scenarios

### Test with Sample Data
If your backend doesn't have data yet, you can:
1. Use the API test component to see which endpoints work
2. Check the browser console for detailed error messages
3. Verify the backend is responding with the expected data format

### Test with Real Data
Once connected:
1. Navigate to different pages (Belts, Profiles, Promotions)
2. Use filters to test API parameters
3. Check pagination functionality
4. Verify data displays correctly

## 🆘 Getting Help

If you're still having issues:

1. **Check the browser console** for detailed error messages
2. **Verify backend logs** for any server-side errors
3. **Test API endpoints directly** using tools like Postman or curl
4. **Check network tab** in browser DevTools for request/response details

## 🔄 Updating API Configuration

After making changes to the API configuration:

1. **Restart the development server**: `npm run dev`
2. **Clear browser cache** if needed
3. **Test the connection** using the API test component
4. **Verify all pages load** without errors

---

**Need more help?** Check the backend repository documentation or create an issue with specific error messages.

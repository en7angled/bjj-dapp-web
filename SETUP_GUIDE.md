# BJJ DApp Setup Guide

## 🚨 Quick Fix for "fetch failed" Error

The "fetch failed" error occurs when the API credentials are not properly configured. Here's how to fix it:

### 1. Set Environment Variables

You need to set these environment variables with the correct credentials:

```bash
# For local development, create .env.local file:
NEXT_PUBLIC_API_URL=https://bjjbackend.cardano.vip
API_USER=cardano
API_PASS=lovelace
NEXT_PUBLIC_PROFILE_POLICY_ID=your_profile_policy_id
NEXT_PUBLIC_NETWORK_ID=1
```

### 2. For Docker Deployment

Make sure your `.env` file contains:

```bash
NEXT_PUBLIC_API_URL=https://bjjbackend.cardano.vip
API_USER=cardano
API_PASS=lovelace
NEXT_PUBLIC_PROFILE_POLICY_ID=your_profile_policy_id
NEXT_PUBLIC_NETWORK_ID=1
```

### 3. Test the Connection

Run the API test script to verify everything is working:

```bash
# Test with correct credentials
API_URL=https://bjjbackend.cardano.vip API_USER=cardano API_PASS=lovelace node scripts/test-api.js
```

Expected output:
```
✅ Success (200): 4                    # belts/count
✅ Success (200): [["White",2],...]    # belts/frequency
✅ Success (200): 3                    # profiles/count (fallback)
✅ Success (200): 0                    # promotions/count (fallback)
```

## 🔧 What Was Fixed

1. **Enhanced Error Handling**: The API now provides specific error messages for:
   - Missing credentials
   - Authentication failures
   - Network connectivity issues
   - Missing endpoints

2. **Fallback Mechanisms**: For endpoints that don't exist on the backend:
   - `/profiles/count` → Falls back to counting `/profiles` results
   - `/promotions/count` → Falls back to counting `/promotions` results

3. **Better Logging**: More detailed error logs to help diagnose issues

## 🚀 Available API Endpoints

### Working Endpoints ✅
- `GET /belts` - List all belts
- `GET /belts/count` - Count of belts
- `GET /belts/frequency` - Belt distribution
- `GET /profiles` - List all profiles
- `GET /promotions` - List all promotions (currently empty)

### Endpoints with Fallback 🔄
- `GET /profiles/count` - Uses fallback to count profiles
- `GET /promotions/count` - Uses fallback to count promotions

## 🐛 Troubleshooting

### Still getting "fetch failed"?

1. **Check environment variables**:
   ```bash
   echo $API_USER
   echo $API_PASS
   ```

2. **Verify backend connectivity**:
   ```bash
   curl -u cardano:lovelace https://bjjbackend.cardano.vip/belts/count
   ```

3. **Check application logs** for detailed error messages

4. **Restart the application** after setting environment variables

### Common Error Messages

- `"API credentials not configured"` → Set API_USER and API_PASS
- `"Authentication failed"` → Check username/password
- `"Network error: Unable to connect"` → Check internet/backend status
- `"API endpoint not found"` → Endpoint doesn't exist (fallback will be used)

## 📝 Next Steps

1. Set the environment variables with the correct credentials
2. Restart your application (development server or Docker container)
3. Test the connection using the API test script
4. Navigate through the app to verify all pages load correctly

The application should now work properly with the BJJ backend API!

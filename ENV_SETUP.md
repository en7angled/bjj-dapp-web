# Environment Variables Setup Guide

## 📋 **Required Environment Variables**

Create a `.env` file in the project root with these variables:

```bash
# =============================================================================
# API Configuration
# =============================================================================

# Backend API URL (Runtime configuration - RECOMMENDED)
# This variable is read at runtime and allows true dynamic configuration
API_BASE_URL=https://bjjbackend.cardano.vip

# Legacy API URL (Build-time configuration - for compatibility)
# This is exposed to the browser and set at build time
NEXT_PUBLIC_API_URL=https://bjjbackend.cardano.vip

# API Authentication (Server-side only - NOT exposed to browser)
API_USER=cardano
API_PASS=lovelace

# =============================================================================
# Cardano Network Configuration
# =============================================================================

# Profile Policy ID for Cardano assets
NEXT_PUBLIC_PROFILE_POLICY_ID=your_profile_policy_id_here

# Network ID (0 = testnet, 1 = mainnet)
NEXT_PUBLIC_NETWORK_ID=1

# =============================================================================
# Development/Debug Configuration (Optional)
# =============================================================================

# Enable debug endpoints in production (optional)
# ENABLE_DEBUG=true
```

## 🔧 **Setup Instructions**

### 1. **Local Development**

Create `.env.local`:
```bash
# Runtime API Configuration
API_BASE_URL=https://bjjbackend.cardano.vip
API_USER=cardano
API_PASS=lovelace
NEXT_PUBLIC_PROFILE_POLICY_ID=your_profile_policy_id_here
NEXT_PUBLIC_NETWORK_ID=1
ENABLE_DEBUG=true
```

### 2. **Docker Development**

Create `.env`:
```bash
API_BASE_URL=https://bjjbackend.cardano.vip
NEXT_PUBLIC_API_URL=https://bjjbackend.cardano.vip
API_USER=cardano
API_PASS=lovelace
NEXT_PUBLIC_PROFILE_POLICY_ID=your_profile_policy_id_here
NEXT_PUBLIC_NETWORK_ID=1
```

### 3. **Kubernetes Deployment**

Add to your deployment YAML:
```yaml
env:
- name: API_BASE_URL
  value: "https://bjjbackend.cardano.vip"
- name: API_USER
  value: "cardano"
- name: API_PASS
  value: "lovelace"
- name: NEXT_PUBLIC_PROFILE_POLICY_ID
  value: "your_profile_policy_id_here"
- name: NEXT_PUBLIC_NETWORK_ID
  value: "1"
```

### 4. **Production**

Create `.env.production`:
```bash
API_BASE_URL=https://bjjbackend.cardano.vip
API_USER=cardano
API_PASS=lovelace
NEXT_PUBLIC_PROFILE_POLICY_ID=your_production_profile_policy_id
NEXT_PUBLIC_NETWORK_ID=1
```

## 🎯 **Variable Priority & Usage**

### **API URL Configuration**
1. **`API_BASE_URL`** (highest priority)
   - ✅ Runtime configuration
   - ✅ Server-side only (secure)
   - ✅ Can be changed without rebuild
   - **Use this for dynamic URL changes**

2. **`NEXT_PUBLIC_API_URL`** (fallback)
   - ⚠️ Build-time configuration
   - ⚠️ Exposed to browser
   - ⚠️ Requires rebuild to change
   - **Use for compatibility only**

### **Authentication**
- **`API_USER`** & **`API_PASS`**: Server-side only, secure

### **Cardano Configuration**
- **`NEXT_PUBLIC_PROFILE_POLICY_ID`**: Public, exposed to browser
- **`NEXT_PUBLIC_NETWORK_ID`**: Public, exposed to browser

## 🧪 **Testing Your Configuration**

### 1. **Check Variables**
```bash
# In your container/environment
echo $API_BASE_URL
echo $API_USER
echo $API_PASS
```

### 2. **Test API Connection**
```bash
curl -u $API_USER:$API_PASS $API_BASE_URL/belts/count
```

### 3. **Check Application Configuration**
```bash
curl http://localhost:3000/api/config
```

## 🚨 **Important Notes**

1. **Never commit `.env` files** - they contain sensitive credentials
2. **Use `API_BASE_URL`** for runtime URL changes
3. **Restart your application** after changing environment variables
4. **Use secure secrets management** in production (Kubernetes secrets, etc.)

## 📝 **Quick Setup Commands**

```bash
# Create .env file for local development
cat > .env << EOF
API_BASE_URL=https://bjjbackend.cardano.vip
API_USER=cardano
API_PASS=lovelace
NEXT_PUBLIC_PROFILE_POLICY_ID=your_profile_policy_id_here
NEXT_PUBLIC_NETWORK_ID=1
EOF

# Test the configuration
source .env
curl -u $API_USER:$API_PASS $API_BASE_URL/belts/count
```

## 🔄 **Migrating from Old Configuration**

If you were using only `NEXT_PUBLIC_API_URL`:

1. **Add** `API_BASE_URL` with the same value
2. **Keep** `NEXT_PUBLIC_API_URL` for compatibility
3. **Use** `API_BASE_URL` for runtime changes going forward

The application will automatically use `API_BASE_URL` if available, falling back to `NEXT_PUBLIC_API_URL` if not.

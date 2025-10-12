# Configurarea URL-ului Backend la Runtime

## 🎯 **Variabile de Mediu**

URL-ul backend-ului se configurează prin una din aceste variabile de mediu (în ordine de prioritate):

1. **API_BASE_URL** (server-side only, recomandat pentru runtime)
```bash
API_BASE_URL=https://your-backend-url.com
```

2. **NEXT_PUBLIC_API_URL** (expus în browser, setat la build time)
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

**Recomandare**: Folosește `API_BASE_URL` pentru configurare runtime adevărată!

## 🔧 **Metode de Configurare**

### 1. **În Kubernetes (Deployment/Pod)**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bjj-dapp-web
spec:
  template:
    spec:
      containers:
      - name: bjj-dapp-web
        image: your-image
        env:
        - name: API_BASE_URL
          value: "https://your-backend-url.com"
        - name: API_USER
          value: "cardano"
        - name: API_PASS
          value: "lovelace"
```

### 2. **În Docker Compose**

Creează fișierul `.env`:
```bash
API_BASE_URL=https://your-backend-url.com
API_USER=cardano
API_PASS=lovelace
```

Apoi rulează:
```bash
docker-compose up -d
```

### 3. **Direct în Container**

```bash
# Intră în container
kubectl exec -it your-pod-name -- bash

# Setează variabila (runtime)
export API_BASE_URL=https://your-new-backend-url.com

# Verifică că s-a setat
echo $API_BASE_URL

# Restart aplicația pentru a aplica schimbările
```

### 4. **Cu Docker Run**

```bash
docker run -e API_BASE_URL=https://your-backend-url.com \
           -e API_USER=cardano \
           -e API_PASS=lovelace \
           -p 3000:3000 \
           your-image
```

## 🧪 **Testarea Configurației**

### 1. **Verifică variabilele în container**
```bash
echo $API_BASE_URL
echo $NEXT_PUBLIC_API_URL
echo $API_USER  
echo $API_PASS
```

### 2. **Testează conectivitatea**
```bash
curl -u cardano:lovelace $API_BASE_URL/belts/count
```

### 3. **Verifică în aplicație**
```bash
# Verifică configurația runtime
curl http://localhost:3000/api/config
```

## 📝 **Exemple de URL-uri**

```bash
# Backend local
API_BASE_URL=http://localhost:8000

# Backend în Kubernetes
API_BASE_URL=http://bjj-backend-service:8000

# Backend extern
API_BASE_URL=https://bjjbackend.cardano.vip

# Backend de development
API_BASE_URL=https://dev-bjjbackend.cardano.vip
```

## ⚠️ **Importante**

1. **API_BASE_URL**: Server-side only, nu este expusă în browser - SIGURĂ pentru runtime
2. **NEXT_PUBLIC_API_URL**: Expusă în browser, setată la build time - pentru compatibilitate
3. **API_USER/API_PASS**: Server-side only și nu sunt expuse în browser
4. **Runtime vs Build-time**: `API_BASE_URL` se citește la runtime, `NEXT_PUBLIC_API_URL` la build time
5. **Restart**: După schimbarea variabilei, restartează aplicația pentru a aplica schimbările

## 🚀 **Pentru problema ta actuală**

Acum poți schimba URL-ul la runtime cu adevărat:

```bash
# În pod-ul tău Kubernetes
export API_BASE_URL=https://alt-backend.com

# Verifică că s-a setat
echo $API_BASE_URL

# Testează noul URL
curl -u cardano:lovelace $API_BASE_URL/belts/count

# Verifică configurația aplicației
curl http://localhost:3000/api/config
```

Sau modifică deployment-ul Kubernetes să includă:
```yaml
env:
- name: API_BASE_URL
  value: "https://your-new-backend-url.com"
```

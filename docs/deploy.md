# Deploying Signal Hunter

## Hetzner + Coolify (Recommended)

Cheap, fast, European hosting with one-click deploys.

### 1. Provision Hetzner VPS

1. Create account at [hetzner.com](https://hetzner.com)
2. Cloud Console → Create Server
3. Settings:
   - **Location:** Falkenstein or Helsinki (EU)
   - **Image:** Ubuntu 22.04
   - **Type:** CX22 (2 vCPU, 4GB RAM) - €4/month
   - **SSH Key:** Add your public key
4. Create server, note the IP address

### 2. Install Coolify

SSH into your server and run:

```bash
ssh root@YOUR_SERVER_IP
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Access Coolify at `http://YOUR_SERVER_IP:8000`

Create your admin account.

### 3. Deploy Signal Hunter

1. **Add Project:**
   - Projects → New Project → Name it

2. **Add Application:**
   - Add Resource → Public Repository
   - URL: `https://github.com/xotw/signal-hunter`
   - Build Pack: Nixpacks (auto-detected)

3. **Configure Environment Variables:**
   ```
   GNEWS_API_KEY=your_gnews_key
   OPENROUTER_API_KEY=your_openrouter_key (optional)
   API_KEY=your_secret_api_key
   PORT=3000
   ```

4. **Add signals config:**
   - Go to "Storages" tab
   - Add a file mount: `/app/signals.yaml`
   - Paste your customized signals.yaml content

5. **Deploy:**
   - Click Deploy
   - Wait for build to complete

### 4. Configure Domain + SSL

1. Point your domain to server IP (A record)
2. In Coolify → Settings → Domains
3. Add your domain
4. Enable "Generate SSL" (uses Let's Encrypt)

### 5. Test

```bash
curl https://your-domain.com/health

curl -H "X-API-Key: your_key" \
  "https://your-domain.com/api/signals?query=Stripe"
```

---

## Railway

One-click deploy:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Click button
2. Add environment variables
3. Deploy

Note: You'll need to add `signals.yaml` via Railway's file system or include it in a fork.

---

## Render

1. Connect GitHub repo
2. Set environment variables
3. Add `signals.yaml` as a secret file
4. Deploy

---

## Docker (Any VPS)

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build
docker build -t signal-hunter .

# Run
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/signals.yaml:/app/signals.yaml \
  --env-file .env \
  --name signal-hunter \
  signal-hunter
```

---

## Costs

| Provider | Spec | Monthly |
|----------|------|---------|
| Hetzner CX22 | 2 vCPU, 4GB | €4 |
| Railway | Hobby | $5 |
| Render | Free tier | $0 |
| DigitalOcean | Basic | $6 |

GNews API: Free tier = 100 requests/day

---

<p align="center">
  <a href="https://www.bulldozer-collective.com"><strong>Need help deploying? → Bulldozer</strong></a>
</p>

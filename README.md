# Signal Hunter

```
   ____  _                   _   _   _             _
  / ___|(_) __ _ _ __   __ _| | | | | |_   _ _ __ | |_ ___ _ __
  \___ \| |/ _` | '_ \ / _` | | | |_| | | | | '_ \| __/ _ \ '__|
   ___) | | (_| | | | | (_| | | |  _  | |_| | | | | ||  __/ |
  |____/|_|\__, |_| |_|\__,_|_| |_| |_|\__,_|_| |_|\__\___|_|
           |___/
```

**Hunt buying signals from news. Score leads. Close deals.**

Config-driven signal detection API that monitors news for buying signals, leadership changes, funding rounds, and competitive moves. Built for Clay enrichment and GTM automation.

---

## How It Works

```
Company Name → News Search → Signal Detection → Lead Score
                   ↓               ↓
              GNews API      Keywords + LLM
```

1. You define signals in `signals.yaml` (keywords, competitors, scoring)
2. API fetches news for a company/topic
3. Detects signals via keyword matching + optional LLM
4. Returns structured JSON with score and tier

---

## Quick Start

```bash
# Clone
git clone https://github.com/xotw/signal-hunter.git
cd signal-hunter

# Configure
cp signals.example.yaml signals.yaml
cp .env.example .env
# Edit both files for your use case

# Install & run
npm install
npm start

# Test
curl "http://localhost:3000/api/signals?query=Stripe"
```

---

## Configuration

### signals.yaml

Define your signals - triggers, context, and negatives:

```yaml
name: "My Sales Signals"

signals:
  trig_funding:
    type: trigger
    description: "Company raised funding"
    keywords:
      - "series A"
      - "raised funding"
      - "funding round"
    match: any

  neg_competitor:
    type: negative
    description: "Using a competitor"
    competitors:
      - "Competitor1"
      - "Competitor2"
    deployment_terms:
      - "partners with"
      - "implements"
    match: competitor_deployment

scoring:
  trigger_weight: 30
  context_weight: 10
  negative_weight: -20
  tiers:
    hot: 50
    warm: 30
    cool: 10
```

### Environment Variables

```bash
# Required
GNEWS_API_KEY=your_gnews_key      # Get at gnews.io

# Optional
OPENROUTER_API_KEY=your_key       # For LLM detection
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
API_KEY=your_api_key              # Protect your endpoint
PORT=3000
```

---

## API

### GET /api/signals

```bash
curl -H "X-API-Key: your_key" \
  "http://localhost:3000/api/signals?query=Notion&language=en"
```

**Response:**
```json
{
  "query": "Notion",
  "articles_found": 15,
  "detection_method": "llm",
  "signals": {
    "trig_funding": true,
    "trig_expansion": true,
    "trig_leadership_change": false,
    "ctx_product_launch": true,
    "neg_layoffs": false
  },
  "score": 70,
  "tier": "hot",
  "articles": [
    {
      "title": "Notion raises $150M Series C",
      "source": "TechCrunch",
      "url": "https://..."
    }
  ]
}
```

### GET /health

```json
{
  "status": "ok",
  "config": "My Sales Signals",
  "signals": 12
}
```

---

## Clay Integration

Add an HTTP enrichment column:

**URL:**
```
https://your-api.com/api/signals?query={{Company Name}}
```

**Headers:**
```
X-API-Key: your_api_key
```

**Formula columns:**
```javascript
// Has hot trigger?
signals.trig_funding || signals.trig_expansion

// Lead tier
tier === "hot" ? "🔥 HOT" : tier === "warm" ? "WARM" : "COLD"
```

---

## Use Cases

**SaaS Sales**
- Funding rounds, expansion, new leadership
- Tech adoption signals
- Competitor deployments

**Recruiting**
- Hiring announcements, growth signals
- Leadership changes

**Investor Research**
- M&A activity, market moves
- Financial signals

**PR/Comms**
- Brand mentions, crisis signals
- Industry trends

---

## Deploy

### Railway / Render

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Docker

```bash
docker build -t signal-hunter .
docker run -p 3000:3000 --env-file .env signal-hunter
```

### Hetzner + Coolify

See [deployment docs](./docs/deploy.md) for full walkthrough.

---

## Extending

### Add new signals

Edit `signals.yaml`:

```yaml
signals:
  trig_ipo:
    type: trigger
    description: "IPO announcement"
    keywords:
      - "files for IPO"
      - "going public"
      - "IPO filing"
    match: any
```

Restart. Done.

### Different news sources

Swap `src/services/scraper.js` with your preferred source:
- NewsAPI
- Bing News
- Custom RSS feeds
- Social media APIs

---

## Stack

- **Runtime:** Node.js + Express
- **News:** GNews API
- **LLM:** OpenRouter (Llama, Claude, GPT)
- **Config:** YAML

---

<p align="center">
  <br>
  <a href="https://www.bulldozer-collective.com"><strong>Built by Bulldozer</strong></a>
  <br>
  <sub>GTM infrastructure for companies that ship</sub>
  <br>
  <br>
</p>

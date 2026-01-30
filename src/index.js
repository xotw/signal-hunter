import express from 'express';
import pino from 'pino';
import { loadSignalsConfig, getSignalsConfig } from './config/signals.js';
import { searchWithRetry } from './services/scraper.js';
import { detectSignals, calculateScore, getSignalNames, createEmptySignals } from './services/signals.js';
import { detectSignalsWithLLM } from './services/llm.js';

// Initialize
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();

// Load signals config on startup
try {
  loadSignalsConfig();
  logger.info({ config: getSignalsConfig().name }, 'Signals config loaded');
} catch (err) {
  logger.error({ err }, 'Failed to load signals config');
  process.exit(1);
}

// Middleware
app.use(express.json());

// API Key auth (optional)
app.use('/api', (req, res, next) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return next(); // No auth if no key set

  const provided = req.headers['x-api-key'];
  if (provided !== apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  const config = getSignalsConfig();
  res.json({
    status: 'ok',
    config: config.name,
    signals: getSignalNames().length
  });
});

// Main signals endpoint
app.get('/api/signals', async (req, res) => {
  const { query, language = 'en', country } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'query parameter required' });
  }

  try {
    // Fetch news
    const articles = await searchWithRetry(query, { language, country }, logger);

    if (articles.length === 0) {
      return res.json({
        query,
        articles_found: 0,
        signals: createEmptySignals(),
        score: 0,
        tier: 'cold'
      });
    }

    // Detect signals (try LLM first, fallback to keywords)
    let signals = await detectSignalsWithLLM(articles, query, logger);
    const method = signals ? 'llm' : 'keywords';

    if (!signals) {
      signals = detectSignals(articles, language);
    }

    // Calculate score
    const { score, tier } = calculateScore(signals);

    res.json({
      query,
      language,
      country: country || null,
      articles_found: articles.length,
      detection_method: method,
      signals,
      score,
      tier,
      articles: articles.slice(0, 5).map(a => ({
        title: a.title,
        source: a.source,
        url: a.url
      }))
    });

  } catch (err) {
    logger.error({ err, query }, 'Signal detection failed');
    res.status(503).json({ error: 'Signal detection failed', message: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Signal Hunter running');
});

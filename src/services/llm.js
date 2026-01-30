import { getSignals, getSignalsConfig } from '../config/signals.js';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = {
  'llama-small': 'meta-llama/llama-3.1-8b-instruct',
  'llama': 'meta-llama/llama-3.1-70b-instruct',
  'claude-haiku': 'anthropic/claude-3-haiku',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
};

/**
 * Build signal definitions for LLM prompt
 */
function buildSignalDefinitions() {
  const signals = getSignals();
  const lines = [];

  const types = ['trigger', 'context', 'negative'];
  const typeLabels = {
    trigger: 'TRIGGERS (High Intent)',
    context: 'CONTEXT (Opportunity)',
    negative: 'NEGATIVE (Risk)'
  };

  for (const type of types) {
    lines.push(`${typeLabels[type]}:`);
    for (const [name, config] of Object.entries(signals)) {
      if (config.type === type) {
        lines.push(`- ${name}: ${config.description}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build empty signals object for LLM response template
 */
function buildEmptySignalsJson() {
  const signals = getSignals();
  const obj = {};
  for (const name of Object.keys(signals)) {
    obj[name] = false;
  }
  return JSON.stringify(obj, null, 2);
}

/**
 * Analyze articles with LLM
 */
export async function detectSignalsWithLLM(articles, query, logger = null) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    logger?.warn?.('OPENROUTER_API_KEY not set, using keyword matching only');
    return null;
  }

  if (articles.length === 0) {
    return createEmptySignals();
  }

  const config = getSignalsConfig();
  const articleText = articles
    .slice(0, 10)
    .map((a, i) => `[${i + 1}] ${a.title}\n${a.description || ''}`)
    .join('\n\n');

  const prompt = `You are a sales intelligence analyst. Analyze these news articles about "${query}" and detect which signals are present.

${buildSignalDefinitions()}

ARTICLES:
${articleText}

RULES:
1. Only mark TRUE if there's clear evidence in the articles
2. News must be ABOUT "${query}" specifically
3. Be conservative - when uncertain, mark FALSE

Respond with ONLY valid JSON:
${buildEmptySignalsJson()}`;

  try {
    const model = process.env.OPENROUTER_MODEL || MODELS['llama-small'];
    logger?.info?.({ model, articleCount: articles.length }, 'Calling LLM');

    const response = await fetch(OPENROUTER_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://github.com/xotw/signal-hunter',
        'X-Title': config.name || 'Signal Hunter'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      logger?.error?.({ status: response.status, error }, 'OpenRouter error');
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      logger?.error?.('No content in LLM response');
      return null;
    }

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    return normalizeSignals(JSON.parse(jsonStr));

  } catch (err) {
    logger?.error?.({ err }, 'LLM detection failed');
    return null;
  }
}

function createEmptySignals() {
  const signals = getSignals();
  const obj = {};
  for (const name of Object.keys(signals)) {
    obj[name] = false;
  }
  return obj;
}

function normalizeSignals(signals) {
  const empty = createEmptySignals();
  const normalized = { ...empty };
  for (const key of Object.keys(empty)) {
    if (typeof signals[key] === 'boolean') {
      normalized[key] = signals[key];
    }
  }
  return normalized;
}

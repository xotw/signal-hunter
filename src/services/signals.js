import { getSignals, getScoringConfig } from '../config/signals.js';

/**
 * Detect signals from articles using keyword matching
 */
export function detectSignals(articles, language = 'en') {
  const signals = getSignals();
  const allText = articles
    .map(a => `${a.title || ''} ${a.description || ''}`)
    .join(' ')
    .toLowerCase();

  const results = {};

  for (const [name, config] of Object.entries(signals)) {
    if (config.match === 'competitor_deployment') {
      // Special case: need BOTH competitor AND deployment term
      const competitors = (config.competitors || []).map(c => c.toLowerCase());
      const deploymentTerms = (config.deployment_terms || []).map(d => d.toLowerCase());

      const hasCompetitor = competitors.some(c => allText.includes(c));
      const hasDeployment = deploymentTerms.some(d => allText.includes(d));

      results[name] = hasCompetitor && hasDeployment;
    } else if (config.match === 'all') {
      // All keywords must match
      const keywords = (config.keywords || []).map(k => k.toLowerCase());
      results[name] = keywords.every(k => allText.includes(k));
    } else {
      // Default: any keyword match
      const keywords = (config.keywords || []).map(k => k.toLowerCase());
      results[name] = keywords.some(k => allText.includes(k));
    }
  }

  return results;
}

/**
 * Calculate score and tier from signals
 */
export function calculateScore(signalResults) {
  const signals = getSignals();
  const scoring = getScoringConfig();

  let score = 0;

  for (const [name, detected] of Object.entries(signalResults)) {
    if (!detected) continue;

    const config = signals[name];
    if (!config) continue;

    switch (config.type) {
      case 'trigger':
        score += scoring.trigger_weight;
        break;
      case 'context':
        score += scoring.context_weight;
        break;
      case 'negative':
        score += scoring.negative_weight;
        break;
    }
  }

  // Determine tier
  let tier = 'cold';
  if (score >= scoring.tiers.hot) tier = 'hot';
  else if (score >= scoring.tiers.warm) tier = 'warm';
  else if (score >= scoring.tiers.cool) tier = 'cool';

  return { score, tier };
}

/**
 * Get signal names
 */
export function getSignalNames() {
  return Object.keys(getSignals());
}

/**
 * Create empty signals object (all false)
 */
export function createEmptySignals() {
  const signals = {};
  for (const name of getSignalNames()) {
    signals[name] = false;
  }
  return signals;
}

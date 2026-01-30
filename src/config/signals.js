import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

let signalsConfig = null;

/**
 * Load signals configuration from YAML file
 */
export function loadSignalsConfig(configPath = null) {
  const filePath = configPath || process.env.SIGNALS_CONFIG || './signals.yaml';

  if (!fs.existsSync(filePath)) {
    throw new Error(`Signals config not found: ${filePath}. Copy signals.example.yaml to signals.yaml and customize.`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  signalsConfig = yaml.load(content);

  return signalsConfig;
}

/**
 * Get loaded signals config
 */
export function getSignalsConfig() {
  if (!signalsConfig) {
    loadSignalsConfig();
  }
  return signalsConfig;
}

/**
 * Get all signal definitions
 */
export function getSignals() {
  const config = getSignalsConfig();
  return config.signals || {};
}

/**
 * Get signal names by type
 */
export function getSignalsByType(type) {
  const signals = getSignals();
  return Object.entries(signals)
    .filter(([, config]) => config.type === type)
    .map(([name]) => name);
}

/**
 * Get scoring config
 */
export function getScoringConfig() {
  const config = getSignalsConfig();
  return config.scoring || {
    trigger_weight: 30,
    context_weight: 10,
    negative_weight: -20,
    tiers: { hot: 50, warm: 30, cool: 10, cold: 0 }
  };
}

/**
 * Get all keywords that need translation
 */
export function getTranslatableKeywords() {
  const signals = getSignals();
  const keywords = new Set();

  for (const [, config] of Object.entries(signals)) {
    if (config.no_translate) continue;

    if (config.keywords) {
      config.keywords.forEach(k => keywords.add(k));
    }
    if (config.deployment_terms) {
      config.deployment_terms.forEach(k => keywords.add(k));
    }
  }

  return Array.from(keywords);
}

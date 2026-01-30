const GNEWS_ENDPOINT = 'https://gnews.io/api/v4/search';

/**
 * Search GNews for a company/topic
 */
export async function searchNews(query, options = {}) {
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    throw new Error('GNEWS_API_KEY environment variable is required');
  }

  const {
    language = 'en',
    country = null,
    maxResults = 20
  } = options;

  const url = new URL(GNEWS_ENDPOINT);
  url.searchParams.set('q', `"${query}"`);
  url.searchParams.set('lang', language);
  url.searchParams.set('max', maxResults.toString());
  url.searchParams.set('apikey', apiKey);

  if (country) {
    url.searchParams.set('country', country.toLowerCase());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GNews API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return (data.articles || []).map(item => ({
    title: item.title || '',
    description: item.description || '',
    url: item.url || '',
    published_at: item.publishedAt || '',
    source: item.source?.name || ''
  }));
}

/**
 * Search with retry and exponential backoff
 */
export async function searchWithRetry(query, options = {}, logger = null) {
  const maxRetries = parseInt(process.env.SCRAPE_MAX_RETRIES) || 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await searchNews(query, options);
    } catch (err) {
      lastError = err;
      const delay = Math.pow(2, attempt) * 1000;

      logger?.warn?.(
        { attempt: attempt + 1, maxRetries, delay, error: err.message },
        'News search failed, retrying...'
      );

      if (attempt < maxRetries - 1) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

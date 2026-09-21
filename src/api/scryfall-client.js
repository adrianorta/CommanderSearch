const API_ORIGIN = 'https://api.scryfall.com';

export class ScryfallApiError extends Error {
  constructor(message, { code = 'request_failed', status = 0, cause } = {}) {
    super(message, { cause });
    this.name = 'ScryfallApiError';
    this.code = code;
    this.status = status;
  }
}

function assertScryfallUrl(url) {
  const parsed = new URL(url, API_ORIGIN);
  if (parsed.origin !== API_ORIGIN) {
    throw new ScryfallApiError('Unexpected Scryfall URL.', { code: 'invalid_url' });
  }
  return parsed;
}

async function readJson(response, url) {
  let data;
  try {
    data = await response.json();
  } catch (cause) {
    throw new ScryfallApiError('Scryfall returned an invalid response.', {
      code: 'invalid_response',
      status: response.status,
      cause,
    });
  }
  if (!response.ok) {
    throw new ScryfallApiError(data?.details || data?.code || 'Scryfall request failed.', {
      code: data?.code || 'request_failed',
      status: response.status,
    });
  }
  if (!data || typeof data !== 'object') {
    throw new ScryfallApiError('Scryfall returned an invalid response.', {
      code: 'invalid_response',
      status: response.status,
    });
  }
  return data;
}

function assertSearchResponse(data) {
  if (!Array.isArray(data.data) || typeof data.has_more !== 'boolean') {
    throw new ScryfallApiError('Scryfall returned an invalid search response.', {
      code: 'invalid_response',
    });
  }
  if (data.has_more) {
    if (typeof data.next_page !== 'string' || !data.next_page.trim()) {
      throw new ScryfallApiError('Scryfall returned an invalid pagination response.', {
        code: 'invalid_response',
      });
    }
    try {
      assertScryfallUrl(data.next_page);
    } catch (cause) {
      throw new ScryfallApiError('Scryfall returned an invalid pagination URL.', {
        code: 'invalid_response',
        cause,
      });
    }
  }
  return data;
}

function assertCatalogResponse(data) {
  if (!Array.isArray(data.data)) {
    throw new ScryfallApiError('Scryfall returned an invalid catalog response.', {
      code: 'invalid_response',
    });
  }
  return data.data;
}

export function createScryfallClient({ fetchImpl = fetch } = {}) {
  async function request(url, options = {}) {
    const parsed = assertScryfallUrl(url);
    let response;
    try {
      response = await fetchImpl(parsed, {
        ...options,
        headers: {
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });
    } catch (cause) {
      if (cause?.name === 'AbortError') throw cause;
      throw new ScryfallApiError('Unable to reach Scryfall.', {
        code: 'network_error',
        cause,
      });
    }
    return readJson(response, parsed.href);
  }

  return {
    searchCards({ query, unique, order, dir, signal }) {
      const url = new URL('/cards/search', API_ORIGIN);
      url.search = new URLSearchParams({ q: query, unique, order, dir }).toString();
      return request(url, { signal }).then(assertSearchResponse);
    },

    searchPage(url, { signal } = {}) {
      return request(url, { signal }).then(assertSearchResponse);
    },

    searchPrints(query, { signal } = {}) {
      const url = new URL('/cards/search', API_ORIGIN);
      url.search = new URLSearchParams({
        q: query,
        unique: 'prints',
        order: 'usd',
        dir: 'asc',
      }).toString();
      return request(url, { signal }).then(assertSearchResponse);
    },

    catalog(name, { signal } = {}) {
      return request(new URL(`/catalog/${name}`, API_ORIGIN), { signal }).then(
        assertCatalogResponse
      );
    },
  };
}

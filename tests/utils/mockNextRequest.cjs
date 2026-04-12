class MockHeaders {
  constructor(initial = {}) {
    this.initial = {};
    for (const [k, v] of Object.entries(initial)) {
      this.initial[k.toLowerCase()] = v;
    }
  }
  get(name) {
    if (!name) return null;
    const key = String(name).toLowerCase();
    return this.initial[key] ?? null;
  }
}

class MockCookies {
  constructor(token) {
    this.token = token;
  }
  get(name) {
    if (name === 'token' && this.token) {
      return { value: this.token };
    }
    return undefined;
  }
}

function createMockNextRequest({ body, textBody, headers, cookiesToken, url = 'http://localhost' }) {
  const resolvedHeaders = headers || {};
  const resolvedText = typeof textBody === 'string' ? textBody : (typeof body === 'string' ? body : undefined);

  return {
    url,
    headers: new MockHeaders(resolvedHeaders),
    cookies: new MockCookies(cookiesToken),
    async json() {
      if (body === undefined) return {};
      return body;
    },
    async text() {
      return resolvedText || JSON.stringify(body ?? {});
    },
  };
}

module.exports = { createMockNextRequest };


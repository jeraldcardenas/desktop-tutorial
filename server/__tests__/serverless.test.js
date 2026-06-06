const { vercelHandler, netlifyHandler } = require('../serverless');

const validInput = {
  model: 'claude-opus-4-8',
  tools: [{ name: 'emit_missions', input_schema: { type: 'object' } }],
  messages: [{ role: 'user', content: 'make missions' }],
};

// Minimal Vercel-style res mock.
function mockRes() {
  return {
    statusCode: null,
    headers: null,
    bodyText: '',
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = headers;
    },
    end(text) {
      this.bodyText = text || '';
    },
  };
}

describe('vercelHandler', () => {
  const OLD = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = OLD;
  });

  it('answers OPTIONS preflight with 204 + CORS', async () => {
    const res = mockRes();
    await vercelHandler({ method: 'OPTIONS' }, res);
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBeTruthy();
  });

  it('rejects non-POST with 405', async () => {
    const res = mockRes();
    await vercelHandler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 500 when the server key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = mockRes();
    await vercelHandler({ method: 'POST', body: validInput }, res);
    expect(res.statusCode).toBe(500);
  });

  it('returns 400 for an invalid body (key present)', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-dummy';
    const res = mockRes();
    await vercelHandler({ method: 'POST', body: { messages: [] } }, res);
    expect(res.statusCode).toBe(400);
  });
});

describe('netlifyHandler', () => {
  const OLD = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = OLD;
  });

  it('answers OPTIONS preflight with 204', async () => {
    const out = await netlifyHandler({ httpMethod: 'OPTIONS' });
    expect(out.statusCode).toBe(204);
  });

  it('returns 400 for invalid JSON', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-dummy';
    const out = await netlifyHandler({ httpMethod: 'POST', body: '{not json' });
    expect(out.statusCode).toBe(400);
    expect(JSON.parse(out.body).error).toMatch(/JSON/);
  });

  it('returns 400 for a valid-JSON but invalid request', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-dummy';
    const out = await netlifyHandler({ httpMethod: 'POST', body: JSON.stringify({ messages: [] }) });
    expect(out.statusCode).toBe(400);
  });
});

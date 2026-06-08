const { handleMissionRequest, buildSafeBody, DEFAULT_MODEL, MAX_OUTPUT_TOKENS } = require('../proxy');

const validInput = {
  model: 'claude-opus-4-8',
  max_tokens: 1500,
  system: 'be safe',
  tools: [{ name: 'emit_missions', input_schema: { type: 'object' } }],
  tool_choice: { type: 'tool', name: 'emit_missions' },
  messages: [{ role: 'user', content: 'make 3 missions' }],
};

describe('buildSafeBody', () => {
  it('accepts a valid mission request', () => {
    const r = buildSafeBody(validInput);
    expect(r.ok).toBe(true);
    expect(r.body.model).toBe('claude-opus-4-8');
    expect(r.body.tool_choice).toEqual({ type: 'tool', name: 'emit_missions' });
  });

  it('rejects non-objects and missing messages', () => {
    expect(buildSafeBody(null).ok).toBe(false);
    expect(buildSafeBody({ tools: validInput.tools }).ok).toBe(false);
  });

  it('rejects requests without the emit_missions tool (no open relay)', () => {
    expect(buildSafeBody({ ...validInput, tools: [{ name: 'other' }] }).ok).toBe(false);
  });

  it('forces an unknown model to the default', () => {
    expect(buildSafeBody({ ...validInput, model: 'gpt-4' }).body.model).toBe(DEFAULT_MODEL);
  });

  it('caps max_tokens', () => {
    expect(buildSafeBody({ ...validInput, max_tokens: 999999 }).body.max_tokens).toBe(MAX_OUTPUT_TOKENS);
  });
});

describe('handleMissionRequest', () => {
  it('forwards to Anthropic with auth headers and passes the response through', async () => {
    const upstream = { content: [{ type: 'tool_use', name: 'emit_missions', input: { missions: [] } }] };
    const fetchImpl = jest.fn(async () => ({ status: 200, json: async () => upstream }));

    const out = await handleMissionRequest(validInput, { apiKey: 'sk-test', fetchImpl });
    expect(out.status).toBe(200);
    expect(out.body).toEqual(upstream);

    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toContain('api.anthropic.com');
    expect(opts.headers['x-api-key']).toBe('sk-test');
    expect(opts.headers['anthropic-version']).toBeTruthy();
    // The forwarded body must be the rebuilt-safe one, not raw input.
    expect(JSON.parse(opts.body).tool_choice).toEqual({ type: 'tool', name: 'emit_missions' });
  });

  it('returns 500 when the key is missing', async () => {
    const out = await handleMissionRequest(validInput, { apiKey: '', fetchImpl: jest.fn() });
    expect(out.status).toBe(500);
  });

  it('returns 400 for an invalid request', async () => {
    const out = await handleMissionRequest({ messages: [] }, { apiKey: 'sk', fetchImpl: jest.fn() });
    expect(out.status).toBe(400);
  });

  it('returns 502 when the upstream call throws', async () => {
    const fetchImpl = jest.fn(async () => {
      throw new Error('network down');
    });
    const out = await handleMissionRequest(validInput, { apiKey: 'sk', fetchImpl });
    expect(out.status).toBe(502);
  });

  it('mirrors a non-200 upstream status', async () => {
    const fetchImpl = jest.fn(async () => ({ status: 429, json: async () => ({ error: 'rate limited' }) }));
    const out = await handleMissionRequest(validInput, { apiKey: 'sk', fetchImpl });
    expect(out.status).toBe(429);
  });
});

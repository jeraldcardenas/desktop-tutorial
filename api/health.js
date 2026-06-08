// Vercel serverless function: GET /api/health — quick liveness/config check.
module.exports = function handler(req, res) {
  res.setHeader('content-type', 'application/json');
  res.statusCode = 200;
  res.end(
    JSON.stringify({ ok: true, keyConfigured: Boolean(process.env.ANTHROPIC_API_KEY) })
  );
};

// Netlify function: POST /.netlify/functions/missions
// (also reachable at /api/missions via the redirect in netlify.toml)
// Reads ANTHROPIC_API_KEY from the function environment — never in the app.
exports.handler = require('../../server/serverless').netlifyHandler;

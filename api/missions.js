// Vercel serverless function: POST /api/missions
// Deploys the TalkQuest mission proxy. The Anthropic key is read from the
// ANTHROPIC_API_KEY environment variable configured in your Vercel project —
// it never ships in the app bundle.
module.exports = require('../server/serverless').vercelHandler;

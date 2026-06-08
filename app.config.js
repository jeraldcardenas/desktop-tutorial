// Dynamic Expo config. Reads the static app.json (passed in as `config`) and
// only adds a web base path when EXPO_BASE_URL is set — needed for GitHub Pages
// project sites (served under /<repo>/). Left unset for Vercel/local (root /).
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  return {
    ...config,
    experiments: {
      ...(config.experiments || {}),
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};

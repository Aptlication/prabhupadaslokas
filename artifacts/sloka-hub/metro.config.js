const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add a /status health-check endpoint so Replit's preview health check
// gets a 200 immediately when Metro starts — before any bundle is compiled.
const originalServerMiddleware = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base =
      typeof originalServerMiddleware === "function"
        ? originalServerMiddleware(middleware, server)
        : middleware;

    return (req, res, next) => {
      if (req.url === "/status" || req.url === "/healthz") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      base(req, res, next);
    };
  },
};

module.exports = config;

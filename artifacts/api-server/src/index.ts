import app from "./app";

// Cloudflare Workers entry. The Hono app implements the Worker `fetch` handler,
// so exporting it as the default is all that's needed.
export default app;

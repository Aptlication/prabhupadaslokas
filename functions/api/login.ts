// functions/api/login.ts — login bounce.
//
// This route is gated by Access (it's under /api/* and NOT in the middleware
// allowlist). Navigating the browser here when logged out triggers the Access
// One-time-PIN screen; after a successful login Access forwards the request
// back here WITH a valid JWT, the middleware passes it through, and we redirect
// to the app root — now authenticated (CF_Authorization cookie set).

export const onRequestGet: PagesFunction = (ctx) => {
  const url = new URL(ctx.request.url);
  return Response.redirect(url.origin + "/", 302);
};

export function request(ctx) {
  return {};
}

export function response(ctx) {
  const claims = ctx.identity?.claims || {};
  return {
    sub: ctx.identity?.sub,
    email: claims.email || null,
  };
}
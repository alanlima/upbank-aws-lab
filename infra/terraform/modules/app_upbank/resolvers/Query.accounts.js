export function request(ctx) {
  // Pipeline "before" step; first function receives ctx.prev.result = this output
  return {};
}

export function response(ctx) {
  // Final result is output from last function in pipeline
  return ctx.prev.result;
}

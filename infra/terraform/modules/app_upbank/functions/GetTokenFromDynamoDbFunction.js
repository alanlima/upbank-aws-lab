import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const sub = ctx.identity?.sub;
  if(!sub) util.unauthorized();

  return {
    operation: 'GetItem',
    key: util.dynamodb.toMapValues({
      pk: `USER#${sub}`,
      sk: 'TOKEN#UPBANK'
    })
  };
}

export function response(ctx) {
  const item = ctx.result;

  if(!item || !item.token) {
    util.error('Token not found', 'TokenNotRegistered');
  }

  // Stash token for next pipeline function
  ctx.stash.upbankToken = item.token;

  // Return something small; stash is what matters
  return { ok: true };
}
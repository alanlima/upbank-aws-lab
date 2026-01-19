import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const sub = ctx.identity?.sub;

  if (!sub) util.unauthorized();

  const token = ctx.args?.token;

  if(!token || token.trim().length < 10) {
    util.error("Invalid token", "BadRequest");
  }

  const now = util.time.nowISO8601();

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      pk: `USER#${sub}`,
      sk: "TOKEN#UPBANK"
    }),
    attributeValues: util.dynamodb.toMapValues({
      token: token.trim(), // LAB ONLY (later: move to secrets manager or encrypt)
      updatedAt: now
    })
  }
}

export function response(ctx) {
  return {
    registered: true,
    updatedAt: ctx.result?.updatedAt ?? null,
    //updatedAt: ctx.result.attributes?.updatedAt || null
  }
}
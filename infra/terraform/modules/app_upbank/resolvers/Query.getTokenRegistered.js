import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const sub = ctx.identity?.sub;

  if(!sub) util.unauthorized();

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      pk: `USER#${sub}`,
      sk: "TOKEN#UPBANK"
    })
  }
}

export function response(ctx) {
  const item = ctx.result;
  return {
    registered: !!item,
    updatedAt: item?.updatedAt ?? null
  }
}
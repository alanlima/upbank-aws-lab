import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const token = ctx.stash.upbankToken;
  if(!token) {
    util.error('Missing Upbank token in stash', 'InternalError');
  }

  return {
    method: 'GET',
    resourcePath: '/api/v1/accounts',
    params: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    }
  }
}

export function response(ctx) {
  // AppSync HTTP DS puts status + body in result
  const { statusCode, body } = ctx.result || {};

  if(statusCode === 401 || statusCode === 403) {
    util.error(`Upbank token rejected by upstream API, returned status ${statusCode}`, 'UpbankUnauthorized', { statusCode, body });
  }

  if(statusCode && statusCode >= 400) {
    util.error(`Upbank API returned error status ${statusCode}`, 'UpbankApiError', { statusCode, body });
  }

  const json = typeof body === 'string' ? JSON.parse(body) : body;
  const accounts = json?.data || [];

  return accounts.map(a => { 
    var attrs = a?.attributes || {};
    var balance = attrs?.balance || {};
    return {
      id: a?.id,
      displayName: attrs?.displayName || null,
      accountType: attrs?.accountType || null,
      ownershipType: attrs?.ownershipType || null,
      balanceValue: balance?.value ?? null,
      balanceValueInBaseUnits: balance?.valueInBaseUnits ?? null,
      currencyCode: balance?.currencyCode ?? null,
      createdAt: attrs?.createdAt || null
    };
  });
}
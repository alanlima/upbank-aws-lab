import config from '../auth/config'
import { getIdToken } from '../auth/tokenStore'

export const GET_STATUS = /* GraphQL */ `
  query GetStatus {
    getTokenRegistered {
        registered
        updatedAt
    }
  }
`

export const REGISTER_TOKEN = /* GraphQL */ `
  mutation RegisterToken($token: String!) {
    registerToken(token: $token) {
        registered
        updatedAt
    }
  }
`

export const ME = /* GraphQL */ `
  query Me {
    me {
      sub
      email
    }
  }
`

type AppSyncResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

export const callAppSync = async <T>(query: string, variables?: Record<string, unknown>) => {
  const idToken = getIdToken()
  if (!idToken) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(config.appSyncUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: idToken,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = (await response.json()) as AppSyncResponse<T>

  if (!response.ok) {
    const errorMessage = json.errors?.[0]?.message ?? `AppSync error (${response.status})`
    throw new Error(errorMessage)
  }

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0]?.message ?? 'AppSync returned an error')
  }

  if (!json.data) {
    throw new Error('No data returned from AppSync')
  }

  return json.data
}

const normalizeRegistered = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (value && typeof value === 'object' && 'registered' in value) {
    return Boolean((value as { registered?: boolean }).registered)
  }
  return false
}

export const fetchRegistrationStatus = async () => {
  const data = await callAppSync<{ getTokenRegistered: unknown }>(GET_STATUS)
  return normalizeRegistered(data.getTokenRegistered)
}

export const registerToken = async (token: string) => {
  const data = await callAppSync<{ registerToken: unknown }>(REGISTER_TOKEN, { token })
  return normalizeRegistered(data.registerToken)
}

export const fetchMe = async () => {
  const data = await callAppSync<{ me?: { sub?: string; email?: string } }>(ME)
  return data.me ?? null
}

export const STATUS_AND_ME = /* GraphQL */ `
  query StatusAndMe {
    getTokenRegistered {
        registered
        updatedAt
    }
    me {
      sub
      email
    }
  }
`

export const fetchStatusAndMe = async () => {
  const data = await callAppSync<{ getTokenRegistered: unknown; me?: { sub?: string; email?: string } }>(
    STATUS_AND_ME,
  )
  return {
    registered: normalizeRegistered(data.getTokenRegistered),
    me: data.me ?? null,
  }
}

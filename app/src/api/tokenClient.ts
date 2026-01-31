export type TokenStatus = {
  registered: boolean
  masked?: string
}

export type TokenClient = {
  registerToken: (token: string) => Promise<void>
  getTokenStatus: () => Promise<TokenStatus>
}

export type TokenClientErrorCode = 'INVALID' | 'NETWORK' | 'UNAUTHORIZED' | 'UNKNOWN'

export class TokenClientError extends Error {
  code: TokenClientErrorCode

  constructor(message: string, code: TokenClientErrorCode = 'UNKNOWN') {
    super(message)
    this.name = 'TokenClientError'
    this.code = code
  }
}

const TOKEN_MASK_KEY = 'upbanklab.token.masked'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const maskToken = (token: string) => {
  const cleaned = token.trim()
  const prefix = cleaned.startsWith('up:') ? 'up:' : cleaned.slice(0, 2)
  const suffix = cleaned.slice(-4)
  return `${prefix}****...${suffix}`
}

export const createMockTokenClient = (): TokenClient => {
  return {
    registerToken: async (token: string) => {
      if (!token.trim()) {
        throw new TokenClientError('Token is required.', 'INVALID')
      }

      await delay(500)

      if (token.toLowerCase().includes('unauthorized')) {
        throw new TokenClientError('Unauthorized token.', 'UNAUTHORIZED')
      }

      if (token.toLowerCase().includes('network')) {
        throw new TokenClientError('Network error while registering token.', 'NETWORK')
      }

      const masked = maskToken(token)

      // Store only the masked token to avoid persisting secrets client-side.
      localStorage.setItem(TOKEN_MASK_KEY, masked)
    },
    getTokenStatus: async () => {
      await delay(300)
      const masked = localStorage.getItem(TOKEN_MASK_KEY)
      return { registered: Boolean(masked), masked: masked ?? undefined }
    },
  }
}

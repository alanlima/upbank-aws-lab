const VERIFIER_KEY = 'pkce_verifier'

const toBase64Url = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const generateVerifier = () => {
  const random = new Uint8Array(32)
  crypto.getRandomValues(random)
  return toBase64Url(random)
}

export const storeVerifier = (verifier: string) => {
  sessionStorage.setItem(VERIFIER_KEY, verifier)
}

export const getStoredVerifier = () => sessionStorage.getItem(VERIFIER_KEY) || null

export const clearStoredVerifier = () => {
  sessionStorage.removeItem(VERIFIER_KEY)
}

export const generateChallenge = async (verifier: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toBase64Url(digest)
}

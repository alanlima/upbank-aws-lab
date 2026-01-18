# UpBank Simple UI - Registration Testing

## 1.1 Primary user journeys

### Journey A - First time user (no token registered)

1. User opens the site (`/`)
2. User clicks **Sign in**
3. Redirects to Cognito Hosted UI
4. User authenticates and is redirected back to `/callback`
5. App exchanges auth `code` for tokens (PKCE)
6. App stores tokens
7. App calls AppSync `getTokenRegistered`
8. If `registered=false`, user is taken to `/register-token`
9. User pastes Upbank token and submits
10. App calls AppSync `registerUpbankToken(token)`
11. On success, app navigates to `/app` (dashboard/home)

### Journey B - Returning user (token already registered)

1. User opens site
2. If already logged in (valid tokens), app calls `getTokenRegistered`
3. If `registered=true`, go to `/app`

### Journey C - Logout

1. User clicks **Logout**
2. App clears local tokens
3. Redirect to Cognito logout endpoint
4. Return to `/`

---

# 2) Tech decisions

## 2.1 Stack

* Vite
* React 18+
* TypeScript
* React Router
* Plain `fetch` for AppSync calls (keep it minimal)
* No Amplify (unless you explicitly want it)

## 2.2 Token storage (lab-acceptable)

* Store in `sessionStorage`:

  * `id_token`
  * `access_token`
  * `refresh_token` (optional; you can omit refresh in Phase 3)
  * `expires_at` (epoch milliseconds)
* Use `id_token` as the AppSync `Authorization` header

> Session storage is simple for labs. For production, you'd think harder (XSS risk), but don't block your lab.

---

# 3) Configuration modes

Controlled by `VITE_USE_ENV_CONFIG`:

* `true` (default): read values from env vars / `.env.local` (better for local dev because missing vars throw).
* `false`: load `/config/runtime-config.json` at runtime (recommended for container/K8s; mount via ConfigMap/Secret).

## 3.1 Env variables (`VITE_USE_ENV_CONFIG=true`, default)

Create `.env.local` (not committed):

```env
VITE_USE_ENV_CONFIG=true
VITE_COGNITO_DOMAIN=https://YOUR_DOMAIN.auth.ap-southeast-2.amazoncognito.com
VITE_COGNITO_CLIENT_ID=YOUR_CLIENT_ID
VITE_COGNITO_REDIRECT_URI=https://localhost:5173/callback
VITE_COGNITO_LOGOUT_URI=https://localhost:5173/
VITE_COGNITO_SCOPES=openid email profile

VITE_APPSYNC_URL=https://xxxx.appsync-api.ap-southeast-2.amazonaws.com/graphql
```

## 3.2 Runtime configuration file (`VITE_USE_ENV_CONFIG=false`)

Create `public/config/runtime-config.json` (baked into the image and overridable via a ConfigMap):

```json
{
  "cognitoDomain": "https://YOUR_DOMAIN.auth.ap-southeast-2.amazoncognito.com",
  "clientId": "YOUR_CLIENT_ID",
  "redirectUri": "https://localhost:5173/callback",
  "logoutUri": "https://localhost:5173/",
  "scopes": "openid email profile",
  "appSyncUrl": "https://xxxx.appsync-api.ap-southeast-2.amazonaws.com/graphql"
}
```

At runtime the app fetches `/config/runtime-config.json`. In Kubernetes, mount a ConfigMap (and Secret if needed) to that path to inject per-environment values without rebuilding the image. The Dockerfile sets `VITE_USE_ENV_CONFIG=false` during the build so the bundle expects this runtime file in containers.

**?? IMPORTANT: Vite MUST run with HTTPS protocol** (even locally), otherwise Cognito will reject the callback.

Configure in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [ mkcert() ]
})

```

Your deployed env (EKS/ALB) must also use HTTPS. Redirect/logout URLs must match your ALB URL exactly and use HTTPS.

---

# 4) App routes and pages

## 4.1 Routes

* `/` - Landing page with Sign in button
* `/callback` - OAuth callback handler (code exchange)
* `/register-token` - Upbank token registration page
* `/app` - Authenticated home/dashboard
* `*` - 404 - redirect to `/`

## 4.2 Page requirements

### Landing (`/`)

* If not authenticated: show "Sign in"
* If authenticated: show "Continue" (go to `/app`) and "Logout"
* If authenticated but token not registered: go `/register-token`

### Callback (`/callback`)

* Shows "Signing you in."
* Reads `code` and exchanges it for tokens
* Handles errors cleanly (show message + link back to `/`)

### Register token (`/register-token`)

* Input: token textarea (paste)
* Submit button
* On submit:

  * disable button
  * call AppSync mutation
  * show success and navigate to `/app`
* Do **not** display the token afterward

### App (`/app`)

* Show the logged-in user (email/sub)
* Show token registration status
* Logout button
* For Phase 3 keep it simple (read-only)

---

# 5) Build the app (commands)

```bash
# create project
npm create vite@latest upbank-ui-simple -- --template react-ts
cd upbank-ui-simple

# install deps
npm install

# router
npm install react-router-dom
```

Run locally:

```bash
npm run dev
```

---

# 6) Project structure (recommended)

```
src/
  auth/
    config.ts
    pkce.ts
    oauth.ts
    tokenStore.ts
  api/
    appsync.ts
  pages/
    Landing.tsx
    Callback.tsx
    RegisterToken.tsx
    AppHome.tsx
  components/
    ProtectedRoute.tsx
  App.tsx
  main.tsx
```

---

# 7) Implementation details (what to code)

## 7.1 `auth/config.ts`

* Reads runtime config loaded from `/config/runtime-config.json`
* Exports typed config values
* Validates they exist; if missing show a clear error

## 7.2 PKCE support (`auth/pkce.ts`)

Must implement:

* `generateVerifier()`
* `generateChallenge(verifier)` using `SHA-256` + base64url
* Store the `verifier` in `sessionStorage` for callback

## 7.3 Cognito URLs (`auth/oauth.ts`)

Implement:

* `login()` constructs authorize URL:

  * response_type=code
  * client_id
  * redirect_uri
  * scope
  * code_challenge + method S256
  * (optional) state parameter
* `logout()` constructs logout URL:

  * client_id
  * logout_uri

## 7.4 Token exchange (`pages/Callback.tsx`)

* Read `code` from query params
* Retrieve stored `code_verifier`
* POST to:

  * `${COGNITO_DOMAIN}/oauth2/token`
  * content-type `application/x-www-form-urlencoded`
  * body:

    * grant_type=authorization_code
    * client_id
    * code
    * redirect_uri
    * code_verifier
* Save tokens + expiry

## 7.5 AppSync API client (`api/appsync.ts`)

Implement:

* `callAppSync<T>(query: string, variables?: any)`:

  * reads `id_token` from tokenStore
  * adds header `Authorization: ${idToken}`
  * parses and returns data
  * throws on `errors[]`

GraphQL operations to embed:

* `GET_STATUS`
* `REGISTER_TOKEN`
* `ME`

## 7.6 Auth guard (`ProtectedRoute.tsx`)

* If no token: redirect to `/`
* else render children

## 7.7 Token registration logic

* On entering `/app` or `/register-token`, call `getTokenRegistered`
* Route user accordingly

---

# 8) Security/validation requirements (minimum)

* Never log tokens to console
* Never store token in URL params
* Clear PKCE verifier after token exchange
* Logout clears storage before redirecting

---

# 9) Local test plan

1. Start app: `npm run dev`
2. Go `/`
3. Click "Sign in"
4. Complete login
5. Verify:

   * callback works
   * tokens saved in sessionStorage
6. Navigate to `/register-token`
7. Paste any "fake token" and submit
8. Verify:

   * AppSync mutation returns success
   * subsequent status returns registered=true

---

# 10) Docker + EKS (when you're ready)

For Phase 3 you'll likely:

* build static site
* serve via Nginx container
* deploy behind ALB ingress

I can give you:

* Dockerfile for Vite build + Nginx
* k8s manifests
* recommended ALB path routing

# Quick Reference: Fixing OAuth Errors

## Current Error

```
Error 400: redirect_uri_mismatch
Request details: redirect_uri=https://weddingwin.ca/oauth-callback
```

## What This Means

✅ **You're using the right approach** (HTTPS redirect - Google compliant!)

❌ **The redirect URI is not registered** in Google Console

## The 2-Minute Fix

### 1. Open Google Console

https://console.cloud.google.com/apis/credentials

### 2. Find Your OAuth Client

Look for the OAuth 2.0 Client ID that your web app uses.

### 3. Add This Redirect URI

Click the client → Scroll to "Authorized redirect URIs" → Click "+ ADD URI"

```
https://weddingwin.ca/oauth-callback
```

### 4. Save

Click SAVE. Works immediately!

### 5. Test

```bash
npm run dev
```

Click "Sign in with Google" and test.

## Expected Result

✅ Google redirects to: `https://weddingwin.ca/oauth-callback?access_token=...`

The redirect will work! The app might not open automatically yet (that requires Universal Links setup).

## If App Doesn't Open Automatically

That's OK! It means Universal Links aren't configured yet. You can:

**Option A: Test without automatic opening**
- OAuth completes successfully
- Safari shows the callback URL
- Tokens are in the URL
- This proves OAuth works!

**Option B: Set up Universal Links** (for automatic opening)
- Create `/.well-known/apple-app-site-association` on your server
- Create `/.well-known/assetlinks.json` on your server
- See [ADD_REDIRECT_URI_GUIDE.md](ADD_REDIRECT_URI_GUIDE.md) for details

## Still Getting Errors?

### redirect_uri_mismatch

**Check:**
1. URI is EXACTLY `https://weddingwin.ca/oauth-callback`
2. No trailing slash
3. Using `https://` not `http://`
4. You edited the correct OAuth client
5. You clicked SAVE

### invalid_request

**This means:** Custom URI scheme is being used instead of HTTPS

**Check Metro logs** to see which redirect URI is being sent.

Should see:
```
[RN] Redirect URI: https://weddingwin.ca/oauth-callback
```

## Metro Logs Help

When you click "Sign in with Google", check Metro logs for:

```
[RN] ====== GOOGLE OAUTH DEBUG ======
[RN] Client ID: 123456789-abc.apps.googleusercontent.com
[RN] Redirect URI: https://weddingwin.ca/oauth-callback
[RN] ================================
[RN] ✅ Using HTTPS redirect (compliant with Google policy)
[RN]
[RN] If you get "redirect_uri_mismatch" error:
[RN] 1. Go to: console.cloud.google.com/apis/credentials
[RN] 2. Find Client ID: 123456789-abc.apps.googleusercontent.com
[RN] 3. Add redirect URI: https://weddingwin.ca/oauth-callback
[RN] 4. Save (works immediately!)
```

Use this info to find the exact client and add the redirect URI.

## Documentation

| Guide | Purpose |
|-------|---------|
| [ADD_REDIRECT_URI_GUIDE.md](ADD_REDIRECT_URI_GUIDE.md) | Step-by-step: Add redirect URI to Google Console |
| [OAUTH_POLICY_UPDATE_2024.md](OAUTH_POLICY_UPDATE_2024.md) | Understanding Google's new policy |
| [IMMEDIATE_WORKAROUND.md](IMMEDIATE_WORKAROUND.md) | Alternative approaches |

## Summary

1. ✅ Code is correct (using HTTPS redirect)
2. ❌ Just need to add URI to Google Console
3. ⏱️ Takes 2 minutes
4. ⚡ Works immediately (no waiting)

**Go to:** [ADD_REDIRECT_URI_GUIDE.md](ADD_REDIRECT_URI_GUIDE.md) for detailed steps!

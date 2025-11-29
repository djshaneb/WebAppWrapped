# Immediate Workaround for Error 400

## The Problem

You're getting this error:
```
Error 400: invalid_request
Request details: redirect_uri=mycoolapp://oauth-callback
```

This happens because the web app is using a **Web OAuth Client** that doesn't support custom URI schemes.

## Two Solutions

### Solution 1: Wait for Proper Fix (Recommended but Takes Time)

This requires either:
- Access to modify the web app's code
- Or convincing the web app owner to support mobile apps

**Steps:**
1. Create iOS/Android OAuth client in Google Console
2. Enable "Custom URI scheme"
3. Update web app to use iOS/Android client when in mobile
4. Wait 5-30 minutes

**This is the proper solution but you might not have control over it.**

### Solution 2: Immediate Workaround (Works Now)

Use a different approach that works with Web OAuth clients.

## Immediate Workaround: Universal Links / App Links

Instead of custom URI schemes (`mycoolapp://`), use HTTPS URLs that redirect to your app.

### How It Works

```
Instead of:
mycoolapp://oauth-callback

Use:
https://weddingwin.ca/app/oauth-callback
```

Google redirects to the HTTPS URL, and iOS/Android can open your app from that URL.

### Implementation

#### Step 1: Update Redirect URI in Code

Edit `app/index.tsx`:

```javascript
// Find this line (around line 51):
urlObj.searchParams.set('redirect_uri', 'mycoolapp://oauth-callback');

// Change to:
urlObj.searchParams.set('redirect_uri', 'https://weddingwin.ca/app/oauth-callback');
```

#### Step 2: Add HTTPS Redirect URI to Google Console

1. Go to Google Cloud Console → Credentials
2. Click your **Web OAuth Client**
3. Under "Authorized redirect URIs", add:
   ```
   https://weddingwin.ca/app/oauth-callback
   ```
4. Click SAVE

**No waiting required!** Web clients already support HTTPS redirects.

#### Step 3: Configure Universal Links (iOS)

Add to `app.json`:

```json
{
  "expo": {
    "scheme": "mycoolapp",
    "ios": {
      "associatedDomains": ["applinks:weddingwin.ca"],
      "bundleIdentifier": "com.weddingwin.app"
    }
  }
}
```

#### Step 4: Update Deep Link Handler

The deep link handler already supports HTTPS URLs, but let's make it explicit:

```javascript
// In app/index.tsx, the handleOAuthCallback function already handles this
// Just ensure it checks for both schemes:

if (urlObj.protocol === 'mycoolapp:' || urlObj.protocol === 'https:') {
  // Extract tokens...
}
```

### Pros and Cons

#### Using HTTPS Redirect (Solution 2)
✅ Works immediately with Web OAuth clients
✅ No need to create iOS/Android clients
✅ No waiting for Google propagation
❌ Requires domain ownership verification
❌ More complex setup on iOS/Android

#### Using Custom URI Scheme (Solution 1)
✅ Standard approach for mobile OAuth
✅ Simpler to implement
✅ Works better on mobile
❌ Requires iOS/Android OAuth client
❌ Requires waiting 5-30 minutes
❌ Might require web app code changes

## Quick Test: Check Client Type

Before implementing workarounds, let's see what Client ID is being used.

### Add This Logging

I've already added logging to your app. Now when you click "Sign in with Google", check the Metro logs for:

```
[RN] ====== GOOGLE OAUTH DEBUG ======
[RN] Full OAuth URL: https://accounts.google.com/...
[RN] Client ID: 123456789-abc.apps.googleusercontent.com
[RN] Redirect URI: mycoolapp://oauth-callback
[RN] Response Type: token
[RN] ================================
```

### Copy the Client ID

Take the Client ID from the logs and:

1. Go to Google Cloud Console → Credentials
2. Find the client with that ID
3. Check what type it is:
   - **Web application** → Use Solution 2 (HTTPS) or ask web app owner for help
   - **iOS** → Use Solution 1 (just enable custom URI scheme)
   - **Android** → Use Solution 1 (just enable custom URI scheme)

## Most Likely Scenario

Since you're getting Error 400, you're probably using a **Web OAuth Client**.

### Quick Fix Options

**Option A: Can you modify the web app?**
- Yes → Create iOS OAuth client and update web app
- No → Use Solution 2 (HTTPS redirect)

**Option B: Can you contact the web app owner?**
- Yes → Ask them to support mobile apps
- No → Use Solution 2 (HTTPS redirect)

**Option C: Just want to test quickly?**
- Use localhost redirect (see below)

## Testing Workaround: Localhost

For quick testing, you can use localhost:

### Step 1: Update Code

```javascript
// In app/index.tsx, change redirect URI to:
urlObj.searchParams.set('redirect_uri', 'http://127.0.0.1:8081/callback');
```

### Step 2: Add to Google Console

1. Web OAuth Client → Authorized redirect URIs
2. Add: `http://127.0.0.1:8081/callback`
3. Add: `http://localhost:8081/callback`
4. Save (no waiting needed)

### Step 3: Create Local Server

Create `app/oauth-server.ts`:

```typescript
import { createServer } from 'http';

export function startOAuthServer(onSuccess: (tokens: any) => void) {
  const server = createServer((req, res) => {
    if (req.url?.includes('/callback')) {
      const url = new URL(req.url, 'http://localhost:8081');
      const params = new URLSearchParams(url.search || url.hash.substring(1));

      const tokens = {
        accessToken: params.get('access_token'),
        idToken: params.get('id_token'),
        code: params.get('code')
      };

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>Authentication successful! You can close this window.</h1></body></html>');

      server.close();
      onSuccess(tokens);
    }
  });

  server.listen(8081);
  console.log('[OAuth Server] Listening on http://localhost:8081');
}
```

**Limitation:** This only works for testing and won't work in production builds.

## Recommended Action Plan

1. **Right Now:** Add logging and check what Client ID is being used
2. **Copy the Client ID** from Metro logs
3. **Check Google Console** to see if it's Web, iOS, or Android
4. **Then decide:**
   - If iOS/Android → Just enable custom URI scheme (5 min fix)
   - If Web → Either use HTTPS redirect or contact web app owner

## Next Steps

1. Restart your app: `npm run dev`
2. Click "Sign in with Google"
3. Check Metro logs for the Client ID
4. Share the Client ID here (you can redact part of it)
5. I'll help you determine the best solution

The logging will show exactly what's happening, and we can fix it from there!

# OAuth Setup Instructions

## Problem: White Screen in Safari After Login

The white screen occurs because after Google authentication, Safari is trying to redirect to a URL that either:
1. Doesn't exist in your web app
2. Isn't configured as a valid redirect URI in Google Cloud Console

## Solution: Configure OAuth Redirect URIs

### Step 1: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID
5. Click Edit
6. Under "Authorized redirect URIs", add:

```
mycoolapp://oauth-callback
```

**Important:** The scheme `mycoolapp` must match the `scheme` in your `app.json` file.

### Step 2: Update Your Web App's OAuth Configuration

In your web application (https://www.weddingwin.ca/webapp), when initializing Google OAuth, you need to specify the redirect URI based on the environment:

```javascript
// In your web app's Google OAuth initialization
const isNative = !!(window.ReactNativeWebView || window.Android || window.webkit);

const redirectUri = isNative
  ? 'mycoolapp://oauth-callback'  // For mobile app
  : 'https://www.weddingwin.ca/webapp/auth/callback';  // For web

// Use this redirectUri when calling Google OAuth
```

### Step 3: Alternative - Use Authorization Code Flow

If your web app uses Supabase or similar, you might need to use the authorization code flow instead of implicit flow:

**For Supabase:**

```javascript
// In your web app
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Check if in native environment
const isNative = !!(window.ReactNativeWebView || window.Android || window.webkit);

if (isNative) {
  // Use custom redirect URL for mobile
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'mycoolapp://oauth-callback',
      skipBrowserRedirect: false
    }
  })
} else {
  // Use standard web flow
  await supabase.auth.signInWithOAuth({
    provider: 'google'
  })
}
```

## Testing the Flow

### Step 1: Check Current Behavior

Run your app and check the Metro logs when clicking "Sign in with Google":

```
[RN] Google Login request received: https://accounts.google.com/o/oauth2/...
```

Look at the URL that's being opened. It should contain a `redirect_uri` parameter.

### Step 2: Verify Redirect URI

The URL should look something like:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID
  &redirect_uri=mycoolapp://oauth-callback  <-- Should match your scheme
  &response_type=token
  &scope=...
```

If the `redirect_uri` is pointing to a web URL instead of your app scheme, that's the problem.

### Step 3: Test Deep Link

Test if your app can handle deep links:

```bash
# iOS Simulator
xcrun simctl openurl booted "mycoolapp://oauth-callback?access_token=test123"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "mycoolapp://oauth-callback?access_token=test123"

# Expo
npx uri-scheme open mycoolapp://oauth-callback?access_token=test123 --ios
```

You should see in Metro logs:
```
[RN] Deep link received: mycoolapp://oauth-callback?access_token=test123
[RN] Processing OAuth callback URL: ...
[RN] Sending tokens to WebView
```

## Common Issues

### Issue 1: "redirect_uri_mismatch" Error

**Cause:** The redirect URI in the OAuth request doesn't match what's configured in Google Cloud Console.

**Fix:**
1. Check the exact URL in the error message
2. Add that exact URL to Google Cloud Console
3. Make sure there are no trailing slashes or typos

### Issue 2: White Screen After Login

**Cause:** Google is trying to redirect to a URL that your web app doesn't handle.

**Fix:**
- If using Supabase: Use the `redirectTo` option to specify your app scheme
- If using custom OAuth: Update the redirect_uri parameter in the authorization URL

### Issue 3: App Doesn't Open After Login

**Cause:** Deep linking not properly configured.

**Fix:**
1. Verify `scheme` in `app.json` is set correctly
2. Test deep links manually (see Step 3 above)
3. Check Metro logs for errors

## Debugging Tips

### Enable Verbose Logging

In your web app's Google OAuth code, add logging:

```javascript
console.log('[OAuth] Starting Google login');
console.log('[OAuth] Redirect URI:', redirectUri);
console.log('[OAuth] Is Native:', isNative);
```

### Check OAuth URL

Before opening the browser, log the full OAuth URL:

```javascript
console.log('[OAuth] Full URL:', oauthUrl);
```

The URL should contain:
- `client_id`: Your Google OAuth client ID
- `redirect_uri`: Should be `mycoolapp://oauth-callback` for mobile
- `response_type`: Usually `token` or `code`
- `scope`: OAuth scopes you need

### Monitor Deep Link Events

In your React Native app, add logging:

```javascript
Linking.addEventListener('url', (event) => {
  console.log('[RN] Deep link event:', event);
});
```

## Web App Integration Example

If your web app doesn't already have this logic, you need to add it. Here's a complete example:

```javascript
// In your web app's authentication module

function getOAuthRedirectUri() {
  const isNative = !!(
    window.ReactNativeWebView ||
    window.Android ||
    window.webkit?.messageHandlers?.nativeHandler
  );

  if (isNative) {
    // Mobile app scheme
    return 'mycoolapp://oauth-callback';
  } else {
    // Web callback URL
    return window.location.origin + '/auth/callback';
  }
}

async function initiateGoogleLogin() {
  const redirectUri = getOAuthRedirectUri();

  console.log('Starting OAuth with redirect URI:', redirectUri);

  // Build OAuth URL
  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.set('client_id', YOUR_CLIENT_ID);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('response_type', 'token');
  oauthUrl.searchParams.set('scope', 'email profile');

  // Open OAuth URL
  window.location.href = oauthUrl.toString();
}
```

## Need More Help?

If you're still seeing a white screen:

1. Check the web app's network console in Safari
2. Look for redirect errors
3. Verify the OAuth configuration in Google Cloud Console
4. Test the deep link manually
5. Share the exact OAuth URL being generated (remove sensitive tokens)

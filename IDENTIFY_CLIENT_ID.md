# How to Identify Which Client ID Is Being Used

## Why This Matters

The error `redirect_uri=mycoolapp://oauth-callback` is being rejected because your web app is likely using a **Web Client ID** instead of an **iOS/Android Client ID**.

## Quick Diagnostic

### Step 1: Check the OAuth URL

When you click "Sign in with Google", check the Metro logs for the full URL:

```
[RN] Opening Google OAuth in system browser: https://accounts.google.com/o/oauth2/v2/auth?client_id=...
```

Look at the `client_id` parameter in the URL.

### Step 2: Match the Client ID

Go to [Google Cloud Console](https://console.cloud.google.com) → Credentials

Compare the Client ID from the URL with your clients:

```
Web client 1
Client ID: 123456789-abc123.apps.googleusercontent.com
Type: Web application
Status: ❌ Won't work with mycoolapp://

iOS client 1
Client ID: 987654321-xyz789.apps.googleusercontent.com
Type: iOS
Status: ✅ Will work with mycoolapp://
```

### Step 3: Determine the Issue

**If using Web Client ID:**
- Problem: Web clients don't support custom URI schemes
- Solution: Change your web app to use iOS/Android Client ID

**If using iOS/Android Client ID:**
- Problem: Custom URI scheme not enabled
- Solution: Enable it in Advanced Settings (see FIX_REDIRECT_URI_ERROR.md)

## How to Get the Client ID from the OAuth URL

### Method 1: Check Metro Logs

1. Run your app: `npm run dev`
2. Click "Sign in with Google"
3. Look in Metro logs for:
   ```
   [RN] Opening Google OAuth in system browser: https://accounts.google.com/...
   ```
4. Copy the full URL
5. Find the `client_id=` parameter

Example:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=123456789-abc.apps.googleusercontent.com&redirect_uri=mycoolapp://oauth-callback&...
                                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                        This is your Client ID
```

### Method 2: Check Browser Dev Tools

If your web app is accessible in a browser:

1. Open https://www.weddingwin.ca/webapp in Chrome
2. Open Developer Tools (F12)
3. Go to Network tab
4. Click "Sign in with Google"
5. Look for a request to `accounts.google.com`
6. Check the URL parameters for `client_id`

### Method 3: Check Web App Source Code

If you have access to the web app's source code:

1. Search for files containing "google" or "oauth"
2. Look for where the OAuth URL is constructed
3. Find the `client_id` value

Common locations:
```javascript
// In a config file
const GOOGLE_CLIENT_ID = "123456789-abc.apps.googleusercontent.com";

// In OAuth initialization
const clientId = process.env.GOOGLE_CLIENT_ID;

// In Supabase config (if using Supabase)
// Check your Supabase project settings → Authentication → Providers → Google
```

## What to Do Next

### Scenario A: Web App Uses Web Client ID

**You need to update the web app to use iOS/Android Client ID when in mobile:**

1. Create an iOS or Android OAuth client in Google Console
2. Get the Client ID
3. Update your web app to detect native environment and use the correct Client ID:

```javascript
// In your web app's OAuth code
const isNative = window.isNativeApp; // Set by injected script

const clientId = isNative
  ? "IOS_CLIENT_ID.apps.googleusercontent.com"  // Replace with actual
  : "WEB_CLIENT_ID.apps.googleusercontent.com";
```

### Scenario B: Web App Uses iOS/Android Client ID

**You just need to enable custom URI scheme:**

1. Go to Google Cloud Console
2. Find your iOS/Android OAuth client
3. Enable "Custom URI scheme" in Advanced Settings
4. Wait 5-30 minutes
5. Test again

### Scenario C: Don't Have Access to Web App Source Code

If you can't modify the web app source code:

**Workaround 1: Create Web Client with Localhost**

This won't work perfectly but can help for testing:

1. Use a Web client
2. Add `http://localhost:8081` as redirect URI
3. Modify the injected script to use localhost instead of custom scheme
4. Implement a local HTTP server in React Native to capture the callback

**Workaround 2: Ask Web App Developers**

Contact the developers of weddingwin.ca and ask them to:
1. Create an iOS OAuth client in their Google Console
2. Detect when running in native app (using `window.isNativeApp`)
3. Use the iOS Client ID when in native environment
4. Use the custom redirect URI when in native environment

## Testing After Changes

1. Clear app cache and restart
2. Try signing in with Google
3. Check the OAuth URL in logs
4. Verify the Client ID is correct
5. The error should be gone if:
   - Using iOS/Android Client ID
   - Custom URI scheme is enabled
   - Changes have propagated (wait 5-30 minutes)

## Quick Reference

### Web Client
- Type: `Web application`
- Supports: `https://` redirect URIs only
- Custom schemes: ❌ NOT supported
- Use case: Browser-based apps

### iOS Client
- Type: `iOS`
- Supports: `mycoolapp://` custom schemes
- Custom schemes: ✅ Supported (must enable in Advanced Settings)
- Use case: iOS mobile apps

### Android Client
- Type: `Android`
- Supports: `mycoolapp://` custom schemes
- Custom schemes: ✅ Supported (must enable in Advanced Settings)
- Use case: Android mobile apps

## Summary

**To fix the error:**

1. ✅ Identify which Client ID is being used (check OAuth URL)
2. ✅ If Web Client → create/switch to iOS/Android Client
3. ✅ Enable "Custom URI scheme" in Advanced Settings
4. ✅ Update web app to use correct Client ID
5. ✅ Wait 5-30 minutes
6. ✅ Test again

The key is making sure your web app uses an **iOS or Android Client ID** (not Web) when running in the mobile app.

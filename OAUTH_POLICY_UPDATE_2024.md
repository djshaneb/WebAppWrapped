# Google OAuth Policy Update (2024/2025)

## ⚠️ CRITICAL: Custom URI Schemes No Longer Supported by Default

Google has changed their OAuth policy for mobile apps effective immediately.

## What Changed

### Old Way (Deprecated)
```
redirect_uri=mycoolapp://oauth-callback
```
**Status:** ❌ Blocked by default for new apps
**Error:** `Error 400: invalid_request`

### New Way (Required)
```
redirect_uri=https://weddingwin.ca/oauth-callback
```
**Status:** ✅ Supported via Universal Links (iOS) / App Links (Android)

## Official Google Announcement

Source: [Google Developers Blog](https://developers.googleblog.com/en/improving-user-safety-in-oauth-flows-through-new-oauth-custom-uri-scheme-restrictions/)

### Key Changes:

1. **Chrome Extensions:**
   - Custom URI schemes NO LONGER work
   - Must use Chrome Identity API

2. **Android Apps:**
   - Custom URI schemes **disabled by default**
   - Must enable manually in Google Console Advanced Settings
   - Recommended: Use Google Identity Services SDK instead

3. **iOS Apps:**
   - Custom URI schemes deprecated
   - Recommended: Use Sign In with Google iOS SDK
   - Or use Universal Links with HTTPS redirect

### Why Google Made This Change

- **Prevent app impersonation attacks**
- **Improve user safety**
- **Reduce credential theft risk**

Custom URI schemes like `mycoolapp://` can be registered by ANY app, making it easy for malicious apps to intercept OAuth tokens.

## The Proper Solution: HTTPS Redirects with Universal Links/App Links

### How It Works

1. Use **HTTPS redirect URI** instead of custom scheme
2. Configure **Universal Links (iOS)** or **App Links (Android)**
3. Operating system verifies domain ownership
4. Your app is opened securely

### Example Flow

```
1. User clicks "Sign in with Google"
2. Safari opens: https://accounts.google.com/o/oauth2/auth?...
3. User authenticates
4. Google redirects to: https://weddingwin.ca/oauth-callback?token=...
5. iOS/Android recognizes this URL belongs to your app
6. Your app opens with the tokens
7. User is logged in! ✅
```

## Implementation

### Step 1: Configure Google Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth Client (Web, iOS, or Android)
3. Under "Authorized redirect URIs", add:
   ```
   https://weddingwin.ca/oauth-callback
   https://www.weddingwin.ca/oauth-callback
   ```
4. Click SAVE

**No waiting required!** HTTPS redirects work immediately.

### Step 2: Configure iOS Universal Links

Add to `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.weddingwin.app",
      "associatedDomains": [
        "applinks:weddingwin.ca",
        "applinks:www.weddingwin.ca"
      ]
    }
  }
}
```

### Step 3: Configure Android App Links

Add to `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.weddingwin.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "weddingwin.ca",
              "pathPrefix": "/oauth-callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Step 4: Create Apple App Site Association File

Create `.well-known/apple-app-site-association` on your server:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.weddingwin.app",
        "paths": ["/oauth-callback"]
      }
    ]
  }
}
```

**Requirements:**
- Must be served from `https://weddingwin.ca/.well-known/apple-app-site-association`
- Must be HTTPS (not HTTP)
- Must have `Content-Type: application/json`
- No `.json` extension

### Step 5: Create Android Digital Asset Links File

Create `.well-known/assetlinks.json` on your server:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.weddingwin.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**Requirements:**
- Must be served from `https://weddingwin.ca/.well-known/assetlinks.json`
- Must be HTTPS
- Must have `Content-Type: application/json`

### Step 6: Update Your OAuth Code

Change the redirect URI in your OAuth flow:

```javascript
// OLD (Deprecated)
urlObj.searchParams.set('redirect_uri', 'mycoolapp://oauth-callback');

// NEW (Compliant)
urlObj.searchParams.set('redirect_uri', 'https://weddingwin.ca/oauth-callback');
```

### Step 7: Handle HTTPS Callbacks

Update your deep link handler to accept HTTPS URLs:

```javascript
const handleOAuthCallback = (url: string) => {
  const urlObj = new URL(url);

  // Support both custom scheme (fallback) and HTTPS
  const isCustomScheme = urlObj.protocol === 'mycoolapp:';
  const isHttpsCallback =
    urlObj.protocol === 'https:' &&
    urlObj.hostname === 'weddingwin.ca' &&
    urlObj.pathname === '/oauth-callback';

  if (isCustomScheme || isHttpsCallback) {
    // Extract tokens...
  }
};
```

## Domain Ownership Verification

### iOS Universal Links

Apple will verify your domain by:
1. Fetching `https://weddingwin.ca/.well-known/apple-app-site-association`
2. Checking if your app's Bundle ID matches
3. Checking if your Team ID matches

### Android App Links

Google will verify your domain by:
1. Fetching `https://weddingwin.ca/.well-known/assetlinks.json`
2. Checking if your app's package name matches
3. Checking if your signing certificate matches

## Testing

### Test Universal Links (iOS)

```bash
# On Mac with connected iOS device
xcrun simctl openurl booted "https://weddingwin.ca/oauth-callback?test=true"
```

### Test App Links (Android)

```bash
# Using ADB
adb shell am start -a android.intent.action.VIEW -d "https://weddingwin.ca/oauth-callback?test=true"
```

### Verify iOS Association File

```bash
curl https://weddingwin.ca/.well-known/apple-app-site-association
```

### Verify Android Asset Links

```bash
curl https://weddingwin.ca/.well-known/assetlinks.json
```

## Fallback: Enable Custom URI Scheme (Not Recommended)

If you MUST use custom URI schemes temporarily:

1. Go to Google Cloud Console → Credentials
2. Select your **Android** OAuth client
3. Scroll to "Advanced Settings"
4. Check "Enable custom URI scheme"
5. Click SAVE

**Warning:** This is a temporary workaround and may be removed in the future.

## Comparison

| Feature | Custom URI Scheme | HTTPS + Universal/App Links |
|---------|-------------------|----------------------------|
| Security | ❌ Low (any app can intercept) | ✅ High (domain verified) |
| Google Policy | ❌ Deprecated | ✅ Recommended |
| Setup Complexity | ✅ Simple | ⚠️ Moderate (requires server files) |
| Works on Web | ❌ No | ✅ Yes |
| Future-proof | ❌ No | ✅ Yes |
| Wait time | ⚠️ 5-30 minutes | ✅ Immediate |

## Benefits of HTTPS Redirects

### Security
- ✅ Domain ownership verified by OS
- ✅ No risk of app impersonation
- ✅ Complies with Google's security policy

### Compatibility
- ✅ Works on iOS 9+
- ✅ Works on Android 6.0+
- ✅ Works with all OAuth clients (Web, iOS, Android)

### Reliability
- ✅ No waiting for Google propagation
- ✅ No need to enable "Advanced Settings"
- ✅ Future-proof against policy changes

## Troubleshooting

### Universal Links Not Opening App (iOS)

**Problem:** Safari opens webpage instead of app

**Solutions:**
1. Verify `.well-known/apple-app-site-association` is accessible via HTTPS
2. Check that Bundle ID and Team ID match
3. Rebuild app (Universal Links are configured at build time)
4. Test on device (not simulator)
5. Long-press link to see "Open in [App Name]" option

### App Links Not Opening App (Android)

**Problem:** Browser opens webpage instead of app

**Solutions:**
1. Verify `.well-known/assetlinks.json` is accessible via HTTPS
2. Check that package name matches
3. Verify SHA-256 fingerprint is correct:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore
   ```
4. Clear Android default app settings:
   ```
   Settings → Apps → Default apps → Opening links
   ```

### Still Getting Error 400

If you're still getting `Error 400: invalid_request`:

1. **Check the redirect URI in logs:**
   ```
   [RN] Modified redirect_uri to: https://weddingwin.ca/oauth-callback
   ```

2. **Verify it's added in Google Console:**
   - Must be exact match (including path)
   - Must use HTTPS (not HTTP)

3. **Check Client Type:**
   - Web, iOS, and Android clients all support HTTPS redirects
   - No need to enable custom URI schemes

## Summary

**What You Need to Do:**

1. ✅ Add HTTPS redirect URI to Google Console
2. ✅ Configure Universal Links (iOS) in app.json
3. ✅ Configure App Links (Android) in app.json
4. ✅ Create `.well-known/apple-app-site-association` on your server
5. ✅ Create `.well-known/assetlinks.json` on your server
6. ✅ Update your code to use HTTPS redirect
7. ✅ Test on real devices

**This solution:**
- ✅ Complies with Google's new OAuth policy
- ✅ More secure than custom URI schemes
- ✅ Works immediately (no waiting)
- ✅ Future-proof
- ✅ Industry standard

## Resources

- [Google OAuth 2.0 for Native Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Google Blog: OAuth Custom URI Scheme Restrictions](https://developers.googleblog.com/en/improving-user-safety-in-oauth-flows-through-new-oauth-custom-uri-scheme-restrictions/)
- [Apple Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [RFC 8252: OAuth 2.0 for Native Apps](https://datatracker.ietf.org/doc/html/rfc8252)

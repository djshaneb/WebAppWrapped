# Fix: Error 400 - redirect_uri=mycoolapp://oauth-callback

## The Exact Error

```
Error 400: invalid_request
Request details: redirect_uri=mycoolapp://oauth-callback flowName=GeneralOAuthFlow
```

This means:
- ✅ Your app is correctly sending `mycoolapp://oauth-callback` as the redirect URI
- ❌ Google is rejecting it because it's not configured properly

## Root Cause

You're likely using a **Web OAuth client** which doesn't support custom URI schemes. You need to use an **iOS** or **Android** OAuth client instead.

## Solution: Two Options

### Option A: Use iOS/Android OAuth Client (Recommended)

This is the proper solution for mobile apps.

#### Step 1: Check What Client Type You're Using

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to: **APIs & Services** → **Credentials**
3. Look at your OAuth 2.0 Client IDs

You'll see something like:
```
Web client 1          [Type: Web application]
iOS client 1          [Type: iOS]
Android client 1      [Type: Android]
```

#### Step 2: Determine the Problem

**If you ONLY see "Web application" clients:**
- This is the problem! Web clients don't support `mycoolapp://` schemes
- Solution: Create an iOS or Android client (see Step 3)

**If you have iOS/Android clients:**
- Your web app might be using the wrong Client ID
- Solution: Make sure your web app uses the iOS/Android Client ID (see Step 4)

#### Step 3: Create iOS/Android OAuth Client

##### For iOS:

1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. Select **"iOS"** as Application type
3. Fill in:
   - **Name:** `WeddingWin iOS`
   - **Bundle ID:** Get this from your app.json (e.g., `com.weddingwin.app`)
4. Click **"CREATE"**
5. Copy the Client ID that appears (you'll need this)

##### For Android:

1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. Select **"Android"** as Application type
3. Fill in:
   - **Name:** `WeddingWin Android`
   - **Package name:** Get this from your app.json
   - **SHA-1 certificate fingerprint:**
     ```bash
     # For development, run:
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```
4. Click **"CREATE"**
5. Copy the Client ID that appears

#### Step 4: Enable Custom URI Scheme (iOS/Android Clients Only)

After creating or selecting your iOS/Android client:

1. Click on the iOS or Android client in the list
2. Scroll down to **"Advanced Settings"**
3. Find **"Enable custom URI scheme"**
4. ✅ **Check the box** (ignore the warning)
5. Click **"SAVE"**

**Wait 5-30 minutes** for changes to propagate.

#### Step 5: Configure Your Web App to Use Correct Client ID

Your web app needs to use the iOS/Android Client ID when running in the mobile app.

You have two options:

**Option 5A: Let the app detect it automatically**

Your web app can check if it's running in a native app:

```javascript
// In your web app's Google OAuth initialization
const isNative = window.isNativeApp; // Provided by the injected script

const clientId = isNative
  ? "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com"  // Use iOS client
  : "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com";  // Use Web client
```

**Option 5B: Always use iOS/Android Client ID**

If your web app only runs in the mobile app wrapper, just use the iOS/Android Client ID everywhere:

```javascript
const clientId = "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com";
```

### Option B: Use Localhost Redirect (Quick Test)

If you want to test immediately without creating iOS/Android clients, you can temporarily use localhost:

#### Step 1: Configure Web Client for Localhost

1. Go to your **Web application** OAuth client
2. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:8081
   http://127.0.0.1:8081
   ```
3. Click **"SAVE"**

#### Step 2: Modify the App Code

Edit `app/index.tsx` and change the redirect URI:

```javascript
// Find this line (around line 51):
urlObj.searchParams.set('redirect_uri', 'mycoolapp://oauth-callback');

// Change to:
urlObj.searchParams.set('redirect_uri', 'http://localhost:8081');
```

**Limitations:**
- ⚠️ This is ONLY for testing
- ⚠️ You'll need to implement a local HTTP server to capture the callback
- ⚠️ Not recommended for production
- ⚠️ Won't work when app is closed

## Testing

After making changes:

1. **Wait 5-30 minutes** if you enabled custom URI scheme
2. **Close your app completely** and reopen it
3. **Try signing in with Google**
4. Check Metro logs for:
   ```
   [RN] Opening Google OAuth in system browser
   ```
5. In Safari, you should NOT see the error anymore

## Debugging

### Still Getting the Error?

Check these:

#### 1. Are you using the right Client ID?

In your web app's source code, search for the Client ID:
- Should be: `123456-abc.apps.googleusercontent.com` (iOS/Android)
- Should NOT be: `987654-xyz.apps.googleusercontent.com` (Web)

#### 2. Did you enable custom URI scheme?

In Google Cloud Console:
1. Click your iOS/Android client
2. Scroll to Advanced Settings
3. Verify "Enable custom URI scheme" is ✅ checked

#### 3. Did you wait long enough?

Changes can take up to 30 minutes to propagate. Try waiting a bit longer.

#### 4. Is the redirect URI in the error message correct?

Look at the error:
```
redirect_uri=mycoolapp://oauth-callback
```

This should match:
- The scheme in `app.json` (scheme: "mycoolapp")
- The callback path in the injected script

## Common Scenarios

### Scenario 1: Using Supabase Auth

If your web app uses Supabase for authentication:

```javascript
// In your web app
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// When signing in with Google
const isNative = window.isNativeApp;

if (isNative) {
  // Use iOS client with custom redirect
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'mycoolapp://oauth-callback',
      queryParams: {
        client_id: 'IOS_CLIENT_ID.apps.googleusercontent.com'
      }
    }
  })
} else {
  // Use standard web flow
  await supabase.auth.signInWithOAuth({
    provider: 'google'
  })
}
```

### Scenario 2: Custom OAuth Implementation

If your web app implements Google OAuth directly:

```javascript
function buildGoogleAuthUrl() {
  const isNative = window.isNativeApp;

  const params = new URLSearchParams({
    client_id: isNative
      ? 'IOS_CLIENT_ID.apps.googleusercontent.com'
      : 'WEB_CLIENT_ID.apps.googleusercontent.com',
    redirect_uri: isNative
      ? 'mycoolapp://oauth-callback'
      : 'https://weddingwin.ca/auth/callback',
    response_type: 'token',
    scope: 'email profile'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
```

## Summary

The error `redirect_uri=mycoolapp://oauth-callback` means:

1. ✅ Your React Native app is working correctly
2. ✅ The redirect URI is being sent properly
3. ❌ Google Cloud Console is not configured to accept it

**Fix:**
1. Create or use iOS/Android OAuth client (not Web)
2. Enable "Custom URI scheme" in Advanced Settings
3. Make sure your web app uses the iOS/Android Client ID
4. Wait 5-30 minutes
5. Test again

After these steps, the error should be resolved! ✅

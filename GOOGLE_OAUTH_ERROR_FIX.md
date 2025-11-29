# Fix: Google OAuth Error 400: invalid_request

## The Error You're Seeing

```
Access blocked: Authorization Error
Error 400: invalid_request
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy
```

## Root Cause

Google blocks custom URI schemes (like `mycoolapp://oauth-callback`) by default for security reasons. You need to explicitly enable them in Google Cloud Console.

## Solution: Enable Custom URI Scheme

### Step 1: Go to Google Cloud Console

1. Navigate to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Click on "APIs & Services" in the left sidebar
4. Click on "Credentials"

### Step 2: Find Your OAuth Client ID

Look for your OAuth 2.0 Client ID in the list. You might have:
- **Web Client** - Used for web applications
- **iOS Client** - Used for iOS apps
- **Android Client** - Used for Android apps

**Important:** For mobile apps using custom URI schemes, you need an **iOS Client** or **Android Client**, NOT a Web Client.

### Step 3: Create Mobile OAuth Client (If You Don't Have One)

If you only have a Web Client, you need to create mobile clients:

#### For iOS:
1. Click "CREATE CREDENTIALS" → "OAuth Client ID"
2. Select "iOS" as application type
3. Enter your app name
4. Enter Bundle ID: (from your app.json - use your actual bundle identifier)
5. Click "CREATE"

#### For Android:
1. Click "CREATE CREDENTIALS" → "OAuth Client ID"
2. Select "Android" as application type
3. Enter your app name
4. Enter Package name: (from your app.json)
5. Enter SHA-1 certificate fingerprint (get from your app)
6. Click "CREATE"

### Step 4: Enable Custom URI Scheme

1. In the "OAuth 2.0 Client IDs" section, click on your **iOS** or **Android** client
2. Scroll down to find "**Advanced Settings**"
3. Look for "**Enable custom URI scheme**"
4. **Check the box** to enable it (ignore the warning that says "not recommended")
5. Click **"SAVE"** at the bottom

### Step 5: Wait for Changes to Propagate

**Important:** After enabling, you must wait **5-30 minutes** for Google's servers to update. Some users report it taking up to a few hours.

During this time, you'll still see the error. Be patient!

### Step 6: Add Redirect URI (iOS Client)

If you're using an iOS OAuth Client:

1. In the iOS client settings
2. Under "Redirect URIs", add: `mycoolapp://oauth-callback`
3. Save

## Alternative Solution: Use Localhost Redirect (Recommended for Testing)

If you want to test immediately without waiting, you can use a localhost redirect instead:

### Step 1: Create/Use Web OAuth Client

1. Go to "Credentials" in Google Cloud Console
2. Use or create a "Web application" OAuth Client ID
3. Under "Authorized redirect URIs", add:
   ```
   http://localhost:8081/auth/callback
   ```
4. Save

### Step 2: Update Your Code

Instead of using custom schemes, use localhost:

```javascript
// In app/index.tsx, modify the redirect URI
urlObj.searchParams.set('redirect_uri', 'http://localhost:8081/auth/callback');
```

**However**, this approach is more complex because:
- You need to run a local web server in your app to capture the callback
- It's more work to implement
- Custom URI schemes are the standard for mobile apps

## Why This Error Happens

Google's OAuth policy has become stricter to prevent malicious apps from impersonating legitimate apps. The error occurs because:

1. **Custom URI schemes can be registered by any app** - A malicious app could register `mycoolapp://` and steal tokens
2. **Google requires explicit opt-in** - You must acknowledge the security risk and enable custom schemes
3. **Web clients don't support custom schemes** - You need a mobile-specific OAuth client

## Common Mistakes

### ❌ Using Web Client for Mobile App
```
Client Type: Web application
Redirect URI: mycoolapp://oauth-callback
Result: Error 400: invalid_request
```

### ✅ Using iOS/Android Client with Custom Scheme Enabled
```
Client Type: iOS application
Redirect URI: mycoolapp://oauth-callback
Custom URI Scheme: ENABLED
Result: Works! ✅
```

## Testing After Fix

1. Wait 5-30 minutes after enabling custom URI scheme
2. Restart your app completely
3. Try signing in with Google again
4. Check Metro logs for:
   ```
   [RN] Opening Google OAuth in system browser
   ```
5. Safari should open without the error
6. After authentication, you should see the "Open in app" popup

## If It Still Doesn't Work

### Check 1: Client ID in Your Code

Make sure your app is using the correct Client ID:

```javascript
// Check your web app's OAuth initialization
// It should use the iOS/Android client ID, NOT the web client ID
const CLIENT_ID = "YOUR_IOS_OR_ANDROID_CLIENT_ID.apps.googleusercontent.com";
```

### Check 2: OAuth Consent Screen

1. Go to "OAuth consent screen" in Google Cloud Console
2. Make sure:
   - Publishing status is "Testing" or "Published"
   - Your email is added as a test user (if in Testing mode)
   - All required fields are filled out

### Check 3: Multiple Client IDs

If you have multiple client IDs (Web, iOS, Android), make sure:
- Your web app uses the **iOS or Android** client ID when in native environment
- The web client ID is only used for actual web browsers

You can detect this in your web app:

```javascript
// In your web app's OAuth code
const isNative = window.isNativeApp || window.ReactNativeWebView;

const clientId = isNative
  ? "IOS_CLIENT_ID.apps.googleusercontent.com"
  : "WEB_CLIENT_ID.apps.googleusercontent.com";
```

## Advanced: Using Google Sign-In SDK (Alternative)

If custom URI schemes continue to be problematic, consider using Google's official SDKs:

- **iOS:** [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios/start-integrating)
- **Android:** [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android/start-integrating)

These SDKs handle OAuth flow internally and don't require custom URI schemes.

## Summary

**Quick Fix:**
1. ✅ Go to Google Cloud Console → Credentials
2. ✅ Click your iOS/Android OAuth Client (or create one)
3. ✅ Scroll to "Advanced Settings"
4. ✅ Enable "Enable custom URI scheme"
5. ✅ Save and wait 5-30 minutes
6. ✅ Try again

**The error should be resolved!**

# Testing Guide: OAuth Flow

## What Changed

The app now:
1. **Automatically modifies OAuth URLs** to use `mycoolapp://oauth-callback` as the redirect URI
2. **Captures deep link callbacks** and extracts tokens
3. **Injects tokens into the WebView** so the web app can complete authentication
4. **Navigates back to the main page** after receiving tokens

## Testing Steps

### Step 1: Start the Development Server

```bash
npm run dev
```

### Step 2: Open the App

- Scan the QR code with Expo Go
- Or press `i` for iOS simulator
- Or press `a` for Android emulator

### Step 3: Monitor Logs

Watch the Metro bundler logs for these messages:

```
[WebView] Auth Bridge injection script loaded
[WebView] Native environment detected - setting up Google Auth interception
```

### Step 4: Click "Sign in with Google"

When you click the Google Sign-In button, you should see:

```
[WebView] Google OAuth detected - delegating to native
[WebView] Current redirect_uri: https://... (original)
[WebView] Modified redirect_uri to: mycoolapp://oauth-callback
[RN] Message from WebView: {type: 'LOGIN_GOOGLE', ...}
[RN] Google Login request received
[RN] Opening Google OAuth in system browser
```

### Step 5: Authenticate in Safari/Chrome

- Safari/Chrome should open
- Complete the Google authentication
- **Important:** After authentication, Safari should show a popup asking to open the app

### Step 6: Return to App

After clicking "Open" in Safari, you should see:

```
[RN] Deep link received: mycoolapp://oauth-callback?access_token=...
[RN] Processing OAuth callback URL
[RN] OAuth callback params: {hasAccessToken: true, ...}
[RN] Sending tokens to WebView
[WebView] Received OAuth tokens from native
```

The WebView should reload and you should be logged in.

## Troubleshooting

### Issue: Safari Shows "Invalid redirect_uri"

**Cause:** The redirect URI `mycoolapp://oauth-callback` is not added to Google Cloud Console.

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add `mycoolapp://oauth-callback` to "Authorized redirect URIs"
5. Save changes

### Issue: Safari Shows White Screen

**Cause:** Google is trying to redirect to `mycoolapp://oauth-callback` but Safari can't handle it.

**What This Means:** This is actually **correct behavior**! Safari shows a white screen because it's trying to open the deep link.

**What Should Happen:**
1. White screen appears in Safari
2. A popup/banner appears asking "Open in [Your App Name]?"
3. Click "Open"
4. Your app should open with the tokens

**If No Popup Appears:**
- On iOS: Swipe up on Safari and manually switch back to your app
- The deep link might still be captured in the background

### Issue: App Doesn't Open After Authentication

**Possible Causes:**

1. **Deep linking not configured properly**

   Test manually:
   ```bash
   # iOS
   npx uri-scheme open mycoolapp://oauth-callback?access_token=test123 --ios

   # Android
   npx uri-scheme open mycoolapp://oauth-callback?access_token=test123 --android
   ```

   You should see the app open and logs showing the deep link was received.

2. **App was closed**

   Make sure your app is running in the background when you authenticate in Safari.

3. **iOS Universal Links conflict**

   Try restarting the app after authentication.

### Issue: No Logs After Clicking "Sign In"

**Check:**
1. Are you in the native app or web browser?
2. Is the injected JavaScript running? Look for: `[WebView] Auth Bridge injection script loaded`
3. Is the Google Sign-In button actually a Google OAuth link?

### Issue: Tokens Not Received in WebView

Check the Metro logs for errors. Common issues:

1. **URL parsing error:** The deep link URL format might be unexpected
2. **Token extraction error:** Tokens might be in hash fragment instead of query params

To debug, add this to your deep link handler:
```javascript
console.log('[RN] Full callback URL:', url);
```

## Testing Different Scenarios

### Test 1: Web Browser (Should Work Unchanged)

1. Open http://localhost:8081 in Chrome
2. Click "Sign in with Google"
3. Should redirect to Google normally (no interception)
4. Should work as before

### Test 2: First Time Login

1. Clear app data/reinstall
2. Open app in Expo Go
3. Click "Sign in with Google"
4. Complete authentication
5. App should open with user logged in

### Test 3: Already Logged In

1. Restart the app
2. WebView should remember session
3. User should still be logged in

### Test 4: Deep Link with Different Token Formats

Test with various URL formats:

```bash
# Query parameters
npx uri-scheme open "mycoolapp://oauth-callback?access_token=abc123&id_token=xyz789" --ios

# Hash fragment
npx uri-scheme open "mycoolapp://oauth-callback#access_token=abc123&id_token=xyz789" --ios

# Authorization code
npx uri-scheme open "mycoolapp://oauth-callback?code=abc123" --ios

# Error
npx uri-scheme open "mycoolapp://oauth-callback?error=access_denied" --ios
```

Check logs to ensure each format is handled correctly.

## Expected Behavior Summary

### ✅ Correct Flow

1. User clicks "Sign in with Google" in app
2. Safari opens with Google login page
3. User authenticates in Safari
4. Safari shows white screen or popup to open app
5. App opens/comes to foreground
6. Tokens are injected into WebView
7. WebView reloads and user is logged in

### ❌ Incorrect Flow

1. User clicks "Sign in with Google"
2. Nothing happens (check injected script)
3. OR Safari opens but shows error (check redirect URI in Google Console)
4. OR Safari hangs (web app might not be sending correct OAuth URL)
5. OR App doesn't open after auth (check deep linking setup)

## Additional Debugging

### View WebView Console Logs

If using React Native Debugger or Flipper, you can see the WebView's console logs:

1. Enable remote debugging
2. Open Chrome DevTools
3. Look for WebView console messages

### Inspect OAuth URL

To see the exact OAuth URL being opened, add a breakpoint or log in `handleGoogleLogin`:

```javascript
const handleGoogleLogin = async (url: string) => {
  console.log('[RN] Full OAuth URL:', url);
  // ... rest of function
};
```

The URL should contain:
- `client_id=...`
- `redirect_uri=mycoolapp://oauth-callback`
- `response_type=token` or `code`
- `scope=...`

### Check Deep Link Registration

Verify your app is registered for the `mycoolapp://` scheme:

```bash
# iOS
npx uri-scheme list --ios

# Android
npx uri-scheme list --android
```

You should see `mycoolapp` in the list.

## Next Steps After Testing

Once the flow works end-to-end:

1. ✅ The OAuth URL is being modified correctly
2. ✅ Safari opens for authentication
3. ✅ App captures the deep link callback
4. ✅ Tokens are sent to WebView
5. ✅ User is logged in

Then you can:
- Deploy to TestFlight/Google Play for real device testing
- Update documentation for your team
- Monitor production logs for any issues

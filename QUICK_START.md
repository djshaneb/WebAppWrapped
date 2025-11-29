# Quick Start: Google OAuth Native Bridge

## 🎯 What This Does

Fixes the `403 disallowed_useragent` error when users try to sign in with Google in your mobile app by:
- Opening Google OAuth in the **system browser** (Safari/Chrome) instead of WebView
- Maintaining normal web browser functionality (no changes)

## ✅ What's Already Done

The web/React Native side is **fully implemented**:
- ✅ Environment detection (web vs native)
- ✅ OAuth interception in WebView
- ✅ Message passing to native layer
- ✅ System browser opening with `expo-linking`
- ✅ Token callback handling

## 📱 What You Need to Do

### Option 1: Using Expo (Recommended)

If you're using Expo Go or building with EAS:

1. **Configure `app.json`:**
   ```json
   {
     "expo": {
       "scheme": "yourapp",
       "android": {
         "intentFilters": [
           {
             "action": "VIEW",
             "data": [{"scheme": "yourapp", "host": "oauth-callback"}],
             "category": ["BROWSABLE", "DEFAULT"]
           }
         ]
       }
     }
   }
   ```

2. **Update Google OAuth Settings:**
   - Go to Google Cloud Console
   - Add redirect URI: `yourapp://oauth-callback`

3. **Test:**
   ```bash
   npm run dev
   # Open in Expo Go and try signing in
   ```

### Option 2: Building Native App

If you're creating a standalone native build:

1. **Read the full guide:** `NATIVE_BRIDGE_GUIDE.md`
2. **Implement native code:**
   - Android: Add JavaScript interface (see guide)
   - iOS: Add WKWebView message handler (see guide)
3. **Configure deep linking**
4. **Test the complete flow**

## 🧪 Testing

### Test in Web Browser
```bash
# Should work with NO changes to existing flow
open http://localhost:8081
# Click "Sign in with Google" - should work normally
```

### Test in Expo Go
```bash
npm run dev
# Scan QR code with Expo Go
# Click "Sign in with Google"
# Check Metro logs for: "[RN] Google Login request received"
# System browser should attempt to open
```

## 🐛 Debugging

Enable verbose logging by checking:

**Metro Bundler Logs:**
- `[WebView] Native environment detected`
- `[RN] Message from WebView: {type: 'LOGIN_GOOGLE', ...}`
- `[RN] Opening Google OAuth in system browser`

**WebView Console (use React Native Debugger):**
- `[WebView] Auth Bridge injection script loaded`
- `[WebView] Google OAuth detected - delegating to native`

## 📚 Documentation

- **NATIVE_BRIDGE_GUIDE.md** - Full implementation guide for Android/iOS
- **IMPLEMENTATION_SUMMARY.md** - Technical details of what changed

## 🆘 Troubleshooting

**Still getting 403 error?**
- Check that system browser is actually opening (not WebView)
- Verify OAuth URL is being intercepted (check logs)

**OAuth callback not working?**
- Verify deep link configuration in `app.json`
- Test deep link manually: `npx uri-scheme open yourapp://oauth-callback --ios`

**Nothing happening when clicking Sign In?**
- Check Metro logs for errors
- Verify Google OAuth button is using a detectable URL pattern
- The injected script looks for URLs containing: `accounts.google.com/o/oauth2`

## 🔐 Security Notes

- Tokens are passed from native → WebView via JavaScript
- Never log tokens in production
- Always validate tokens server-side
- Implement token refresh logic

## 🚀 Next Steps

1. Test in web browser (should work unchanged) ✓
2. Configure deep linking in `app.json`
3. Update Google OAuth redirect URIs
4. Test in Expo Go / development build
5. (Optional) Implement native Android/iOS code for production build
6. Deploy and test end-to-end

## 💡 Pro Tips

- Start testing in web browser to ensure nothing broke
- Use Expo Go for quick testing before building native
- Check the full documentation in `NATIVE_BRIDGE_GUIDE.md` for production
- The web app continues to work normally - changes only affect native environment

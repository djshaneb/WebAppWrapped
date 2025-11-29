# WeddingWin - Google OAuth Native Bridge

## 🚨 Quick Fix for Error 400

Getting `Error 400: invalid_request` from Google?

**→ Read: [QUICK_FIX.md](QUICK_FIX.md)** (5 minute fix)

**→ Or: [GOOGLE_CONSOLE_SETUP_GUIDE.md](GOOGLE_CONSOLE_SETUP_GUIDE.md)** (visual guide)

## 📚 Documentation

### Setup & Configuration
- **[QUICK_FIX.md](QUICK_FIX.md)** - Fast fix for Error 400 (START HERE!)
- **[GOOGLE_CONSOLE_SETUP_GUIDE.md](GOOGLE_CONSOLE_SETUP_GUIDE.md)** - Visual walkthrough
- **[GOOGLE_OAUTH_ERROR_FIX.md](GOOGLE_OAUTH_ERROR_FIX.md)** - Detailed error explanation
- **[OAUTH_SETUP_INSTRUCTIONS.md](OAUTH_SETUP_INSTRUCTIONS.md)** - Configuration guide

### Understanding the Implementation
- **[OAUTH_FIX_SUMMARY.md](OAUTH_FIX_SUMMARY.md)** - What was fixed and how it works
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical changes
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture diagrams

### Testing & Development
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - How to test OAuth flow
- **[QUICK_START.md](QUICK_START.md)** - Getting started guide
- **[NATIVE_BRIDGE_GUIDE.md](NATIVE_BRIDGE_GUIDE.md)** - Native iOS/Android code

## 🎯 What This Project Does

This is a React Native (Expo) WebView app that:
- Loads https://www.weddingwin.ca/webapp
- Enables Google OAuth authentication in mobile app
- Fixes the `403 disallowed_useragent` error
- Handles OAuth callbacks via deep links

## ⚡ Quick Start

1. **Fix the Google OAuth error:**
   ```
   Read QUICK_FIX.md and enable custom URI scheme in Google Console
   ```

2. **Run the app:**
   ```bash
   npm run dev
   ```

3. **Test OAuth:**
   - Click "Sign in with Google"
   - Complete authentication in Safari
   - Return to app
   - You're logged in! ✅

## 🐛 Troubleshooting

### Error 400: invalid_request
→ [QUICK_FIX.md](QUICK_FIX.md)

### White screen in Safari after login
→ [OAUTH_FIX_SUMMARY.md](OAUTH_FIX_SUMMARY.md) (This is normal behavior!)

### Deep link not working
→ [TESTING_GUIDE.md](TESTING_GUIDE.md)

### Need to understand the flow
→ [ARCHITECTURE.md](ARCHITECTURE.md)

## 📱 How It Works

```
1. User clicks "Sign in with Google" in app
2. OAuth URL is intercepted and modified
3. Safari opens with Google login
4. User authenticates
5. Google redirects to mycoolapp://oauth-callback
6. App captures deep link
7. Tokens injected into WebView
8. User is logged in! ✅
```

## 🔑 Key Files

- `app/index.tsx` - WebView with OAuth interception
- `app/_layout.tsx` - Auth bridge initialization
- `utils/authBridge.ts` - Token handling
- `utils/environmentDetection.ts` - Native detection

## 📖 Documentation Index

| Issue | Documentation |
|-------|---------------|
| 🚨 Error 400: invalid_request | [QUICK_FIX.md](QUICK_FIX.md) |
| 🖼️ Need visual guide | [GOOGLE_CONSOLE_SETUP_GUIDE.md](GOOGLE_CONSOLE_SETUP_GUIDE.md) |
| 🧪 How to test | [TESTING_GUIDE.md](TESTING_GUIDE.md) |
| 📄 White screen in Safari | [OAUTH_FIX_SUMMARY.md](OAUTH_FIX_SUMMARY.md) |
| 🏗️ Architecture overview | [ARCHITECTURE.md](ARCHITECTURE.md) |
| 🔧 Technical details | [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) |
| 📱 Native iOS/Android code | [NATIVE_BRIDGE_GUIDE.md](NATIVE_BRIDGE_GUIDE.md) |

## ✅ Checklist

Before testing, ensure:
- ✅ Custom URI scheme enabled in Google Console
- ✅ Waited 5-30 minutes after enabling
- ✅ Using iOS or Android OAuth client (not Web)
- ✅ Redirect URI `mycoolapp://oauth-callback` configured
- ✅ App scheme in app.json is `mycoolapp`

## 🆘 Support

If you're stuck:
1. Check [QUICK_FIX.md](QUICK_FIX.md) first
2. Read [GOOGLE_CONSOLE_SETUP_GUIDE.md](GOOGLE_CONSOLE_SETUP_GUIDE.md)
3. Review [TESTING_GUIDE.md](TESTING_GUIDE.md)
4. Check Metro logs for error messages

---

**Start here:** [QUICK_FIX.md](QUICK_FIX.md) 🚀

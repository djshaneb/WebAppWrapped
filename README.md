# WeddingWin - Google OAuth Native Bridge

## 🚨 Getting `redirect_uri_mismatch` Error?

```
Error 400: redirect_uri_mismatch
redirect_uri=https://weddingwin.ca/oauth-callback
```

**→ Quick Fix: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)** (2 minutes)

**→ Detailed Guide: [ADD_REDIRECT_URI_GUIDE.md](ADD_REDIRECT_URI_GUIDE.md)**

**TL;DR:** Add `https://weddingwin.ca/oauth-callback` to Google Console → Authorized redirect URIs → Save

---

## ℹ️ About Google OAuth Policy Change (2024/2025)

Google no longer supports custom URI schemes (`mycoolapp://`) by default.

**This app now uses HTTPS redirects** (`https://weddingwin.ca/oauth-callback`) which is:
- ✅ Google's recommended approach
- ✅ More secure
- ✅ Works immediately

**Learn more:** [OAUTH_POLICY_UPDATE_2024.md](OAUTH_POLICY_UPDATE_2024.md)

## 📚 Documentation

### Setup & Configuration (UPDATED FOR 2024/2025)
- **[ADD_REDIRECT_URI_GUIDE.md](ADD_REDIRECT_URI_GUIDE.md)** - ⭐ **START HERE** - Fix redirect_uri_mismatch (2 min)
- **[OAUTH_POLICY_UPDATE_2024.md](OAUTH_POLICY_UPDATE_2024.md)** - ⚠️ Google's new policy explained
- **[IMMEDIATE_WORKAROUND.md](IMMEDIATE_WORKAROUND.md)** - Alternative solutions
- **[FIX_REDIRECT_URI_ERROR.md](FIX_REDIRECT_URI_ERROR.md)** - Fix redirect_uri error
- **[IDENTIFY_CLIENT_ID.md](IDENTIFY_CLIENT_ID.md)** - Find which Client ID you're using

### Legacy Guides (Custom URI Schemes - Deprecated)
- **[QUICK_FIX.md](QUICK_FIX.md)** - Old method using custom URI schemes
- **[GOOGLE_CONSOLE_SETUP_GUIDE.md](GOOGLE_CONSOLE_SETUP_GUIDE.md)** - Visual walkthrough (deprecated approach)
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
- **Uses HTTPS redirects with Universal Links/App Links (Google's new policy compliant)**
- Supports both custom URI schemes (legacy) and HTTPS redirects

## ⚡ Quick Start

### Step 1: Add HTTPS Redirect to Google Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth Client
3. Under "Authorized redirect URIs", add:
   ```
   https://weddingwin.ca/oauth-callback
   ```
4. Click SAVE (works immediately!)

### Step 2: Set Up Domain Verification

Create these files on `weddingwin.ca`:

**For iOS:** `/.well-known/apple-app-site-association`
```json
{
  "applinks": {
    "apps": [],
    "details": [{"appID": "TEAM_ID.com.weddingwin.app", "paths": ["/oauth-callback"]}]
  }
}
```

**For Android:** `/.well-known/assetlinks.json`
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.weddingwin.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_HERE"]
  }
}]
```

### Step 3: Run the App

```bash
npm run dev
```

### Step 4: Test OAuth

- Click "Sign in with Google"
- Complete authentication in Safari
- App opens automatically with tokens
- You're logged in! ✅

**See [OAUTH_POLICY_UPDATE_2024.md](OAUTH_POLICY_UPDATE_2024.md) for detailed setup**

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

## ✅ Checklist (Updated for 2024/2025)

Before testing, ensure:
- ✅ HTTPS redirect URI added to Google Console: `https://weddingwin.ca/oauth-callback`
- ✅ `.well-known/apple-app-site-association` file created on server
- ✅ `.well-known/assetlinks.json` file created on server
- ✅ Universal Links configured in app.json (iOS)
- ✅ App Links configured in app.json (Android)
- ✅ Domain verification files accessible via HTTPS
- ✅ Using any OAuth client type (Web, iOS, or Android - all support HTTPS redirects)

## 🆘 Support

If you're stuck:
1. **Read [OAUTH_POLICY_UPDATE_2024.md](OAUTH_POLICY_UPDATE_2024.md) first** - Explains Google's new policy
2. Check Metro logs for OAuth URL details
3. Verify domain verification files are accessible
4. Review [TESTING_GUIDE.md](TESTING_GUIDE.md)
5. Test Universal Links/App Links independently

---

**Start here:** [OAUTH_POLICY_UPDATE_2024.md](OAUTH_POLICY_UPDATE_2024.md) ⚠️

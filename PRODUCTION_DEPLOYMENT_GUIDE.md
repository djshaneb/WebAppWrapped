# Production Deployment Guide

## ✅ Issues Fixed

The following issues have been resolved:

1. **URL Scheme Consistency**: Updated `oauth-callback.html` from `mycoolapp://` to `bolt-expo-nativewind://` to match `app.json`
2. **Deep Link Handler**: Verified and updated comment in `app/index.tsx` to reflect correct scheme
3. **Project Configuration**: All configuration files are now consistent

## 🔧 Required Configuration (Action Needed)

### 1. Apple Team ID (iOS Universal Links)

**File**: `apple-app-site-association`

**Current Status**: Contains placeholder `TEAMID`

**Action Required**:
1. Login to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to "Membership" section
3. Copy your Team ID (format: ABC123XYZ)
4. Replace `TEAMID` in `apple-app-site-association` with your actual Team ID

**Example**:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "ABC123XYZ.com.weddingwin.app",
        "paths": [
          "/oauth-callback",
          "/oauth-callback/*"
        ]
      }
    ]
  }
}
```

### 2. Android SHA256 Fingerprint (Android App Links)

**File**: `assetlinks.json`

**Current Status**: Contains placeholder `REPLACE_WITH_YOUR_SHA256_FINGERPRINT`

**Action Required**:
1. Generate your app's signing key:
   ```bash
   eas credentials
   ```
2. Select your Android build configuration
3. Copy the SHA256 fingerprint
4. Replace placeholder in `assetlinks.json` with your fingerprint

**Example**:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.weddingwin.app",
      "sha256_cert_fingerprints": [
        "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"
      ]
    }
  }
]
```

## 🌐 Domain File Deployment

**CRITICAL**: These files must be deployed to your domain root (`weddingwin.ca`) for deep linking to work:

### Deploy to: `https://weddingwin.ca/.well-known/`

1. **apple-app-site-association** (iOS)
   - No file extension
   - Content-Type: `application/json`
   - Must be accessible at: `https://weddingwin.ca/.well-known/apple-app-site-association`

2. **assetlinks.json** (Android)
   - Must be accessible at: `https://weddingwin.ca/.well-known/assetlinks.json`

### Deploy to: `https://weddingwin.ca/`

3. **oauth-callback.html**
   - Must be accessible at: `https://weddingwin.ca/oauth-callback.html`
   - Handles OAuth redirect and deep linking

## 🔐 Supabase Configuration

### Authentication Settings

**Supabase Dashboard URL**: `https://supabase.com/dashboard/project/wyxomopugglszvucucdv/auth/url-configuration`

### Required Redirect URLs

Navigate to: **Authentication** > **URL Configuration** > **Redirect URLs**

Add the following URLs:

1. **Production OAuth Callback** (Web):
   ```
   https://weddingwin.ca/oauth-callback
   ```

2. **Custom Scheme** (Mobile):
   ```
   bolt-expo-nativewind://oauth-callback
   ```

3. **Universal Link** (iOS/Android Production):
   ```
   https://weddingwin.ca/oauth-callback
   ```

4. **Development** (Optional):
   ```
   exp://localhost:8081/--/oauth-callback
   ```

### Google OAuth Provider

Ensure Google OAuth is configured:

1. Navigate to: **Authentication** > **Providers** > **Google**
2. Enable Google provider
3. Add your Google Client ID: `655876057326-34nnmbkgd077bjlsqvba0tke25mlkhm3`
4. Add your Google Client Secret (from Google Cloud Console)
5. Click "Save"

### Google Cloud Console Configuration

**Console URL**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

Required Authorized Redirect URIs:

1. **Supabase Callback**:
   ```
   https://wyxomopugglszvucucdv.supabase.co/auth/v1/callback
   ```

2. **Your Domain Callback**:
   ```
   https://weddingwin.ca/oauth-callback
   ```

## 📱 App Configuration Summary

### Bundle Identifiers

- **iOS**: `com.weddingwin.app`
- **Android**: `com.weddingwin.app`
- **Custom Scheme**: `bolt-expo-nativewind://`

### Domain Configuration

- **Primary Domain**: `weddingwin.ca`
- **OAuth Callback Path**: `/oauth-callback`

### EAS Build

- **Project ID**: `11db546d-12cb-4fd8-8423-ac14b508f682`

## 🚀 Deployment Checklist

- [ ] Replace `TEAMID` in `apple-app-site-association` with your Apple Team ID
- [ ] Replace SHA256 fingerprint in `assetlinks.json` with your Android app's fingerprint
- [ ] Deploy `apple-app-site-association` to `https://weddingwin.ca/.well-known/`
- [ ] Deploy `assetlinks.json` to `https://weddingwin.ca/.well-known/`
- [ ] Deploy `oauth-callback.html` to `https://weddingwin.ca/`
- [ ] Configure Supabase redirect URLs
- [ ] Verify Google OAuth provider is enabled in Supabase
- [ ] Configure Google Cloud Console redirect URIs
- [ ] Build production app with EAS: `eas build --platform all`
- [ ] Test OAuth flow on iOS device
- [ ] Test OAuth flow on Android device

## 🧪 Testing the OAuth Flow

### iOS Testing

1. Install the production build on an iOS device
2. Tap "Sign in with Google"
3. Complete Google authentication
4. Verify redirect back to app
5. Check that user is logged in

### Android Testing

1. Install the production build on an Android device
2. Tap "Sign in with Google"
3. Complete Google authentication
4. Verify redirect back to app
5. Check that user is logged in

### Debugging

If OAuth fails, check:

1. **Domain files are accessible**:
   - `curl https://weddingwin.ca/.well-known/apple-app-site-association`
   - `curl https://weddingwin.ca/.well-known/assetlinks.json`
   - `curl https://weddingwin.ca/oauth-callback.html`

2. **Supabase redirect URLs** are correctly configured

3. **Google Cloud Console** has all redirect URIs added

4. **App logs** for error messages:
   - iOS: Xcode console
   - Android: Android Studio Logcat

## 📝 Additional Notes

### URL Scheme Priority

The OAuth callback page tries multiple redirect methods in this order:

**Mobile Devices**:
1. Custom scheme: `bolt-expo-nativewind://`
2. Universal link: `https://weddingwin.ca/oauth-callback`

**Desktop/Web**:
1. Universal link: `https://weddingwin.ca/oauth-callback`
2. Custom scheme: `bolt-expo-nativewind://`

### Security Considerations

- OAuth tokens are passed via URL fragments (hash) for client-side apps
- Tokens are not logged to server access logs
- Session is established using Supabase's secure session management
- All communication happens over HTTPS

### Support Resources

- [Expo Universal Links](https://docs.expo.dev/guides/linking/)
- [Supabase OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Apple Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)

---

**Last Updated**: December 3, 2025
**App Version**: 1.1.0

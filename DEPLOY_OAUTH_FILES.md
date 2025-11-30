# OAuth Callback Deployment Instructions

## Overview
This guide explains how to deploy the OAuth callback files to fix the white screen issue and enable Universal Links.

## Files to Deploy

### 1. OAuth Callback Page (IMMEDIATE FIX)
**File:** `oauth-callback.html`
**Deploy to:** `https://www.weddingwin.ca/oauth-callback`

**What it does:**
- Shows "Login Successful!" message immediately (no white screen)
- Displays a large, animated "Open WeddingWin App" button instantly
- Tries automatic redirect after 0.5 seconds
- Provides helpful instructions if the app doesn't open

**How to deploy:**
```bash
# Upload oauth-callback.html to your web server
# Make sure it's accessible at: https://www.weddingwin.ca/oauth-callback
```

### 2. Apple App Site Association (For Native Builds)
**File:** `apple-app-site-association`
**Deploy to:** `https://www.weddingwin.ca/.well-known/apple-app-site-association`
**Also deploy to:** `https://www.weddingwin.ca/apple-app-site-association` (as backup)

**IMPORTANT:** Before deploying, replace `TEAMID` with your actual Apple Team ID.

**How to find your Apple Team ID:**
1. Go to https://developer.apple.com/account
2. Click on "Membership" in the sidebar
3. Your Team ID is shown there (10 characters, like `ABCD123456`)

**Update the file:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "ABCD123456.com.weddingwin.app",  // Replace TEAMID
        "paths": ["/oauth-callback", "/oauth-callback/*"]
      }
    ]
  },
  "webcredentials": {
    "apps": ["ABCD123456.com.weddingwin.app"]  // Replace TEAMID
  }
}
```

**How to deploy:**
```bash
# Create .well-known directory if it doesn't exist
mkdir -p /var/www/weddingwin.ca/.well-known/

# Upload the file (NO .json extension!)
cp apple-app-site-association /var/www/weddingwin.ca/.well-known/apple-app-site-association
cp apple-app-site-association /var/www/weddingwin.ca/apple-app-site-association

# Set correct permissions and content type
chmod 644 /var/www/weddingwin.ca/.well-known/apple-app-site-association
```

**Verify deployment:**
```bash
# Test that it's accessible (should return JSON, not 404)
curl -I https://www.weddingwin.ca/.well-known/apple-app-site-association
```

### 3. Android Digital Asset Links (For Native Builds)
**File:** `assetlinks.json`
**Deploy to:** `https://www.weddingwin.ca/.well-known/assetlinks.json`

**IMPORTANT:** Before deploying, you need to get your Android app's SHA256 fingerprint.

**How to get SHA256 fingerprint:**

For development builds:
```bash
cd android
./gradlew signingReport
# Look for SHA256 under "Variant: debug"
```

For production builds (after you have your keystore):
```bash
keytool -list -v -keystore your-keystore.jks -alias your-key-alias
```

**Update the file:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.weddingwin.app",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
      ]
    }
  }
]
```

**How to deploy:**
```bash
# Create .well-known directory if it doesn't exist
mkdir -p /var/www/weddingwin.ca/.well-known/

# Upload the file
cp assetlinks.json /var/www/weddingwin.ca/.well-known/assetlinks.json

# Set correct permissions
chmod 644 /var/www/weddingwin.ca/.well-known/assetlinks.json
```

**Verify deployment:**
```bash
curl https://www.weddingwin.ca/.well-known/assetlinks.json
```

## Quick Deployment Steps

### For Immediate Fix (Expo Go)
**Priority: HIGH - This fixes the white screen issue immediately**

1. Upload `oauth-callback.html` to your server
2. Make it accessible at `https://www.weddingwin.ca/oauth-callback`
3. Test in Safari - you should see the button immediately
4. Tap the button - it should open your app in Expo Go

### For Future Native Builds
**Priority: MEDIUM - Set this up when you build your production app**

1. Get your Apple Team ID from developer.apple.com
2. Update `apple-app-site-association` with your Team ID
3. Upload to `https://www.weddingwin.ca/.well-known/apple-app-site-association`
4. When you build a native iOS app, Universal Links will work automatically

5. Get your Android SHA256 fingerprint
6. Update `assetlinks.json` with the fingerprint
7. Upload to `https://www.weddingwin.ca/.well-known/assetlinks.json`
8. When you build a native Android app, App Links will work automatically

## Testing

### Test OAuth Callback Page (Expo Go)
1. Open your app in Expo Go on your iPhone
2. Tap "Sign in with Google"
3. Complete the Google login
4. **Expected result:** You immediately see "Login Successful!" with a button (no white screen)
5. Tap "Open WeddingWin App"
6. **Expected result:** App opens and you're logged in

### Test Universal Links (Native Build Only)
1. Build a native iOS app with Xcode or EAS Build
2. Install on your device
3. Sign in with Google
4. **Expected result:** After Google login, Safari closes automatically and your app opens (no callback page visible at all)

### Verify Universal Links Setup
Use Apple's validation tool:
```bash
# Test your Universal Links configuration
curl -I https://www.weddingwin.ca/.well-known/apple-app-site-association
```

Visit: https://branch.io/resources/aasa-validator/
- Enter: `weddingwin.ca`
- It should show your configuration is valid

## Troubleshooting

### "OAuth callback shows white screen"
- Upload the new `oauth-callback.html` file
- Clear Safari cache and try again

### "Button doesn't open the app"
- Make sure Expo Go is running in the background
- Check that your app's scheme is `mycoolapp://` (confirmed in app.json)
- Try manually switching to Expo Go/your app

### "Universal Links not working"
- Only works with native builds (not Expo Go)
- Verify the file is accessible at the exact URL (no redirects)
- File must be served with `Content-Type: application/json`
- File must have NO .json extension
- Apple caches these files - may take time to update

### "App Links not working on Android"
- Only works with native builds (not Expo Go)
- Verify SHA256 fingerprint is correct
- Must match the signing certificate of your installed app
- Check that `autoVerify` is set to `true` in app.json (already configured)

## Server Configuration

### Apache (.htaccess)
```apache
# Enable CORS for association files
<FilesMatch "^(apple-app-site-association|assetlinks\.json)$">
    Header set Content-Type "application/json"
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>
```

### Nginx
```nginx
location /.well-known/apple-app-site-association {
    default_type application/json;
    add_header Access-Control-Allow-Origin "*";
}

location /.well-known/assetlinks.json {
    default_type application/json;
    add_header Access-Control-Allow-Origin "*";
}
```

## Summary

**Do now:** Upload `oauth-callback.html` to fix the white screen issue

**Do later:** Set up Universal Links/App Links when building your production app

The new callback page eliminates the white screen by showing the button immediately. Universal Links will make the experience even better by skipping the browser entirely, but they only work with native builds (not Expo Go).

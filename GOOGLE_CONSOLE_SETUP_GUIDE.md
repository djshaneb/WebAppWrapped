# Visual Guide: Google Cloud Console Setup

## Step-by-Step Visual Guide to Fix Error 400

### Step 1: Navigate to Google Cloud Console

Go to: https://console.cloud.google.com

```
┌─────────────────────────────────────────────────────┐
│  Google Cloud Console                                │
├─────────────────────────────────────────────────────┤
│  Select Project: [Your Project Name ▼]              │
│                                                       │
│  ☰ Navigation Menu                                   │
│    ├─ Home                                           │
│    ├─ APIs & Services  ◄── CLICK HERE               │
│    │   ├─ Dashboard                                  │
│    │   ├─ Library                                    │
│    │   ├─ Credentials  ◄── THEN CLICK HERE          │
│    │   ├─ OAuth consent screen                      │
│    │   └─ Domain verification                       │
│    └─ ...                                            │
└─────────────────────────────────────────────────────┘
```

### Step 2: View Your OAuth Clients

```
┌─────────────────────────────────────────────────────────────┐
│  Credentials                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  OAuth 2.0 Client IDs                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Name                    Type        Client ID         │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Web client 1           Web          123456789...      │  │
│  │ iOS client 1           iOS          987654321...  ◄── │  │
│  │ Android client 1       Android      456789123...      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [+ CREATE CREDENTIALS ▼]                                   │
└─────────────────────────────────────────────────────────────┘
```

**IMPORTANT:** Click on your **iOS** or **Android** client, NOT the Web client!

### Step 3: Open Client Settings

After clicking your iOS/Android client:

```
┌─────────────────────────────────────────────────────────────┐
│  OAuth 2.0 Client ID: iOS client 1                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Name: iOS client 1                                          │
│  Client ID: 987654321-abc123.apps.googleusercontent.com     │
│  Created: Jan 1, 2024                                        │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  Bundle ID                                                   │
│  com.yourcompany.yourapp                                     │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  Redirect URIs                                               │
│  [Add URI]                                                   │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  ▼ Advanced Settings  ◄── CLICK TO EXPAND                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Enable Custom URI Scheme

Scroll down and expand "Advanced Settings":

```
┌─────────────────────────────────────────────────────────────┐
│  ▼ Advanced Settings                                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ☐ Enable custom URI scheme  ◄── CHECK THIS BOX!           │
│                                                               │
│  ⚠️  This setting is not recommended for Android clients.   │
│     Custom URI schemes can be intercepted by other apps.    │
│                                                               │
│  [Learn more]                                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**DO THIS:**
1. ✅ Check the box "Enable custom URI scheme"
2. ✅ Ignore the warning (it's expected for mobile apps)
3. ✅ Scroll to the bottom and click **SAVE**

### Step 5: Save and Wait

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    [CANCEL]  [SAVE]  ◄── CLICK SAVE         │
│                                                               │
└─────────────────────────────────────────────────────────────┘

After saving:
┌─────────────────────────────────────────────────────────────┐
│  ✓ Changes saved successfully                                │
│                                                               │
│  ⏱️  Note: Changes may take 5-30 minutes to propagate       │
└─────────────────────────────────────────────────────────────┘
```

### Step 6: Add Redirect URI (iOS Only)

If you're using an iOS client, also add the redirect URI:

```
┌─────────────────────────────────────────────────────────────┐
│  Redirect URIs                                               │
├─────────────────────────────────────────────────────────────┤
│  mycoolapp://oauth-callback  [×]  ◄── ADD THIS             │
│  [+ Add URI]                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Don't Have an iOS/Android Client?

If you only see a "Web" client, you need to create a mobile client:

### Creating an iOS Client

```
1. Click [+ CREATE CREDENTIALS] at the top
2. Select "OAuth client ID"

┌─────────────────────────────────────────────────────────────┐
│  Create OAuth client ID                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Application type:                                           │
│  ○ Web application                                           │
│  ● iOS  ◄── SELECT THIS                                     │
│  ○ Android                                                   │
│  ○ Chrome extension                                          │
│  ○ Desktop app                                               │
│                                                               │
│  Name:                                                       │
│  [My iOS App___________________]                            │
│                                                               │
│  Bundle ID:                                                  │
│  [com.yourcompany.yourapp______]  ◄── From app.json        │
│                                                               │
│                           [CANCEL]  [CREATE]                │
└─────────────────────────────────────────────────────────────┘
```

### Creating an Android Client

```
1. Click [+ CREATE CREDENTIALS] at the top
2. Select "OAuth client ID"

┌─────────────────────────────────────────────────────────────┐
│  Create OAuth client ID                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Application type:                                           │
│  ○ Web application                                           │
│  ○ iOS                                                       │
│  ● Android  ◄── SELECT THIS                                 │
│  ○ Chrome extension                                          │
│  ○ Desktop app                                               │
│                                                               │
│  Name:                                                       │
│  [My Android App_______________]                            │
│                                                               │
│  Package name:                                               │
│  [com.yourcompany.yourapp______]  ◄── From app.json        │
│                                                               │
│  SHA-1 certificate fingerprint:                              │
│  [AA:BB:CC:DD:EE:FF:...________]  ◄── Get from keystore    │
│                                                               │
│                           [CANCEL]  [CREATE]                │
└─────────────────────────────────────────────────────────────┘
```

## Checklist

Before testing again, verify:

- ✅ You have an iOS or Android OAuth client (not just Web)
- ✅ "Enable custom URI scheme" is checked in Advanced Settings
- ✅ You clicked SAVE
- ✅ You waited at least 5-10 minutes
- ✅ Redirect URI `mycoolapp://oauth-callback` is added (iOS)
- ✅ Your app uses the correct Client ID

## Getting Your Bundle ID

Your Bundle ID should match what's in your `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"  ◄── Use this
    },
    "android": {
      "package": "com.yourcompany.yourapp"  ◄── Use this
    }
  }
}
```

## Getting SHA-1 Fingerprint (Android)

For development:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for the SHA-1 fingerprint in the output.

## After Setup

1. Wait 5-30 minutes for changes to take effect
2. Close and reopen your app completely
3. Try Google Sign-In again
4. The error should be gone! ✅

## Still Getting Error?

Check:
1. Did you enable custom URI scheme? (Most common issue)
2. Did you wait long enough? (5-30 minutes)
3. Are you using the iOS/Android client ID in your code?
4. Is your OAuth consent screen published or in testing mode with your email as a test user?

## Visual Summary

```
❌ BEFORE (Error 400)
Web OAuth Client
└─ Custom URI schemes: Not allowed
   └─ Result: Error 400: invalid_request

✅ AFTER (Works!)
iOS/Android OAuth Client
├─ Advanced Settings
│  └─ Enable custom URI scheme: ✓ CHECKED
└─ Redirect URIs
   └─ mycoolapp://oauth-callback
      └─ Result: Authentication works! ✅
```

## Need More Help?

See the full guide in: `GOOGLE_OAUTH_ERROR_FIX.md`

# How to Add Redirect URI to Google Console

## ✅ You're Getting This Error:

```
Error 400: redirect_uri_mismatch
Request details: redirect_uri=https://weddingwin.ca/oauth-callback
```

## What This Means

✅ **Good news:** Google accepts HTTPS redirects (you're using the right approach!)

❌ **Problem:** The redirect URI `https://weddingwin.ca/oauth-callback` is not registered in your Google Cloud Console

## The Fix (2 Minutes)

### Step 1: Open Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Sign in with your Google account
3. Make sure you're in the correct project

### Step 2: Find Your OAuth Client

You'll see a list of credentials. Look for:
- **Type:** "OAuth 2.0 Client IDs"
- **Name:** Something like "Web client 1" or your app name
- **Type column:** Will show "Web application" or "iOS" or "Android"

**Important:** Find the client that your web app (`weddingwin.ca/webapp`) is currently using.

### Step 3: Click on the Client to Edit

Click on the OAuth client name to open the edit screen.

### Step 4: Scroll to "Authorized redirect URIs"

You'll see a section called **"Authorized redirect URIs"**.

It might already have some URIs like:
- `https://weddingwin.ca/some-path`
- `http://localhost:3000`
- etc.

### Step 5: Add the New Redirect URI

Click the **"+ ADD URI"** button at the bottom of the redirect URIs list.

A new empty text field will appear.

**Type EXACTLY this (copy-paste to avoid typos):**

```
https://weddingwin.ca/oauth-callback
```

**Critical Details:**
- ✅ Use `https://` (with the "s")
- ✅ Use `weddingwin.ca` (your exact domain)
- ✅ Use `/oauth-callback` (exact path from error message)
- ❌ NO trailing slash
- ❌ NO extra characters
- ❌ NO spaces

### Step 6: Optionally Add WWW Version

If your website uses `www`, also add:

```
https://www.weddingwin.ca/oauth-callback
```

### Step 7: Save Changes

Scroll to the bottom and click the **"SAVE"** button.

**Wait for:** A success message (usually appears in 1-2 seconds)

**No propagation delay:** HTTPS redirects work immediately!

### Step 8: Test

Now try the OAuth flow again:

```bash
npm run dev
```

1. Click "Sign in with Google"
2. Complete authentication
3. Check what happens

## Expected Results After Adding URI

### Scenario A: OAuth Works! ✅

You'll see:
- Google redirects successfully
- Safari shows `https://weddingwin.ca/oauth-callback?access_token=...`
- Check Metro logs for token information

**If the app doesn't open automatically,** that's OK for now. It means Universal Links/App Links aren't set up yet (see next section).

### Scenario B: Still Get Error ❌

If you still get `redirect_uri_mismatch`:

1. **Check for typos:** Make sure the URI is EXACTLY `https://weddingwin.ca/oauth-callback`
2. **Check which client you edited:** The web app might be using a different OAuth client
3. **Check Metro logs:** Look for the Client ID being used and verify you edited that specific client

## What If the App Doesn't Open?

After adding the redirect URI, Google will successfully redirect to `https://weddingwin.ca/oauth-callback`, but the app might not open automatically.

This happens if Universal Links (iOS) / App Links (Android) aren't configured yet.

### Quick Test Without Universal Links

To test that OAuth is working WITHOUT Universal Links:

1. Click "Sign in with Google"
2. After authentication, Safari will show: `https://weddingwin.ca/oauth-callback?access_token=...`
3. Copy the entire URL
4. The URL contains the authentication tokens

This proves OAuth is working! Now you just need Universal Links to make the app open automatically.

### Setting Up Universal Links (iOS)

You need to create a file on your server:

**File:** `https://weddingwin.ca/.well-known/apple-app-site-association`

**Content:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.weddingwin.app",
        "paths": ["/oauth-callback"]
      }
    ]
  }
}
```

**Replace `YOUR_TEAM_ID`** with your Apple Team ID (find it in Apple Developer account).

**Requirements:**
- Must be accessible via HTTPS
- Must return `Content-Type: application/json`
- No `.json` extension in filename
- Must be at root: `/.well-known/apple-app-site-association`

### Setting Up App Links (Android)

You need to create a file on your server:

**File:** `https://weddingwin.ca/.well-known/assetlinks.json`

**Content:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.weddingwin.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

**To get your SHA-256 fingerprint:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Requirements:**
- Must be accessible via HTTPS
- Must return `Content-Type: application/json`
- Must be at root: `/.well-known/assetlinks.json`

### Verify Domain Files

**Test iOS file:**
```bash
curl -I https://weddingwin.ca/.well-known/apple-app-site-association
```

Should return:
```
HTTP/2 200
content-type: application/json
```

**Test Android file:**
```bash
curl -I https://weddingwin.ca/.well-known/assetlinks.json
```

Should return:
```
HTTP/2 200
content-type: application/json
```

## Troubleshooting

### Issue: "I don't see my OAuth client in the list"

**Solution:**
1. Check if you're in the correct Google Cloud project (top left dropdown)
2. The OAuth client might be in a different project
3. Check with your team who created the OAuth credentials

### Issue: "I added the URI but still get redirect_uri_mismatch"

**Solutions:**
1. **Verify exact match:** The URI must be EXACTLY `https://weddingwin.ca/oauth-callback`
   - Check for trailing slashes
   - Check for http vs https
   - Check for typos in domain or path

2. **Check Metro logs:** Look for the Client ID:
   ```
   [RN] ====== GOOGLE OAUTH DEBUG ======
   [RN] Client ID: 123456789-abc.apps.googleusercontent.com
   ```

3. **Verify you edited the correct client:** Go back to Google Console and find the client with that exact ID

4. **Clear browser cache:** Sometimes OAuth errors are cached

### Issue: "The app doesn't open after authentication"

This is **expected** if you haven't set up Universal Links/App Links yet.

**Two options:**

**Option A: Set up domain verification files** (recommended)
- Create `.well-known/apple-app-site-association`
- Create `.well-known/assetlinks.json`
- See sections above

**Option B: Test without automatic opening** (quick test)
- OAuth will complete successfully
- Safari will show the callback URL with tokens
- You can manually extract tokens from URL
- This proves OAuth is working

## Summary Checklist

- [ ] Go to https://console.cloud.google.com/apis/credentials
- [ ] Find the OAuth 2.0 Client ID your app uses
- [ ] Click to edit it
- [ ] Scroll to "Authorized redirect URIs"
- [ ] Click "+ ADD URI"
- [ ] Add: `https://weddingwin.ca/oauth-callback`
- [ ] Click "SAVE"
- [ ] Test OAuth flow
- [ ] (Optional) Set up Universal Links/App Links for automatic app opening

## Next Steps

1. **First:** Add the redirect URI to Google Console (this fixes the error)
2. **Test:** Verify OAuth completes successfully (even if app doesn't open)
3. **Then:** Set up Universal Links/App Links (makes app open automatically)

**Need more help?** See [OAUTH_POLICY_UPDATE_2024.md](OAUTH_POLICY_UPDATE_2024.md) for complete setup.

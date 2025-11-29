# Quick Fix: Error 400: invalid_request

## The Error
```
Access blocked: Authorization Error
Error 400: invalid_request
```

## The Fix (5 Minutes)

### 1. Go to Google Cloud Console
https://console.cloud.google.com → APIs & Services → Credentials

### 2. Click Your iOS or Android Client
(Not the "Web" client!)

### 3. Scroll to "Advanced Settings"
Expand the section

### 4. Check the Box
✅ Enable custom URI scheme

### 5. Save
Click SAVE at the bottom

### 6. Wait
Wait 5-30 minutes for Google's servers to update

### 7. Test Again
Close your app completely and try again

## That's It!

The error should be gone after waiting.

---

## Don't Have iOS/Android Client?

### Create One:

1. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
2. Choose "iOS" or "Android"
3. Fill in:
   - Name: "My App"
   - Bundle ID (iOS) or Package (Android): From your app.json
4. Click "CREATE"
5. Now follow steps 2-7 above

---

## Visual Reference

```
┌────────────────────────────────────────┐
│  OAuth 2.0 Client IDs                  │
├────────────────────────────────────────┤
│  Web client 1        [Web]      ❌     │
│  iOS client 1        [iOS]      ✅ ◄── │
│  Android client 1    [Android]  ✅     │
└────────────────────────────────────────┘
        Click iOS or Android only!


┌────────────────────────────────────────┐
│  ▼ Advanced Settings                   │
├────────────────────────────────────────┤
│  ✅ Enable custom URI scheme  ◄────    │
│     CHECK THIS BOX!                    │
└────────────────────────────────────────┘


┌────────────────────────────────────────┐
│                                        │
│         [CANCEL]  [SAVE]  ◄────       │
│                   CLICK HERE           │
└────────────────────────────────────────┘
```

---

## Troubleshooting

### Still getting error?
- Did you wait 5-30 minutes?
- Did you enable it on iOS/Android client (not Web)?
- Did you click SAVE?
- Did you close and reopen your app?

### Don't see "Advanced Settings"?
- You're probably viewing a Web client
- Look for iOS or Android client instead
- If you don't have one, create it (see above)

---

## More Help

- Full guide: `GOOGLE_OAUTH_ERROR_FIX.md`
- Visual guide: `GOOGLE_CONSOLE_SETUP_GUIDE.md`
- Testing guide: `TESTING_GUIDE.md`

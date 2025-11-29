# Native Bridge Implementation Guide for Google OAuth

This document explains how to implement the native side of the Google OAuth bridge pattern for Android and iOS.

## Overview

The web application now detects when it's running inside a native mobile app wrapper and delegates Google OAuth authentication to the native layer. This solves the `403 disallowed_useragent` error that occurs when Google OAuth is attempted within a WebView.

## How It Works

### 1. Web Layer (Already Implemented)

The web application:
- Detects when running in a native wrapper
- Intercepts Google OAuth attempts (clicks on login buttons, `window.open` calls)
- Sends a message to the native layer with the OAuth URL
- Waits for the native layer to call back with authentication tokens

### 2. Native Layer (You Need to Implement)

The native layer must:
- Listen for messages from the WebView
- Open the system browser for Google OAuth
- Capture the OAuth callback/tokens
- Send tokens back to the WebView

---

## Android Implementation

### Step 1: Listen for WebView Messages

In your Android WebView setup, add a JavaScript interface or message handler:

\`\`\`java
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import org.json.JSONObject;

public class WebAppInterface {
    Context mContext;
    WebView mWebView;

    WebAppInterface(Context c, WebView webView) {
        mContext = c;
        mWebView = webView;
    }

    @JavascriptInterface
    public void postMessage(String message) {
        try {
            JSONObject json = new JSONObject(message);
            String type = json.getString("type");

            if ("LOGIN_GOOGLE".equals(type)) {
                String oauthUrl = json.getString("url");
                handleGoogleLogin(oauthUrl);
            }
        } catch (Exception e) {
            Log.e("WebApp", "Error parsing message", e);
        }
    }

    private void handleGoogleLogin(String oauthUrl) {
        // Open system browser for OAuth
        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(oauthUrl));
        mContext.startActivity(browserIntent);
    }
}
\`\`\`

### Step 2: Register the Interface

In your Activity where you set up the WebView:

\`\`\`java
WebView webView = findViewById(R.id.webview);
webView.getSettings().setJavaScriptEnabled(true);
webView.addJavascriptInterface(new WebAppInterface(this, webView), "Android");
\`\`\`

### Step 3: Handle OAuth Callback

Add an intent filter to your `AndroidManifest.xml` to capture the OAuth redirect:

\`\`\`xml
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="yourapp"
            android:host="oauth-callback" />
    </intent-filter>
</activity>
\`\`\`

### Step 4: Extract Token and Call WebView

In your Activity's `onNewIntent` or `onCreate`:

\`\`\`java
@Override
protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);

    Uri data = intent.getData();
    if (data != null && "oauth-callback".equals(data.getHost())) {
        // Extract token from URL
        String token = data.getQueryParameter("access_token");
        String idToken = data.getQueryParameter("id_token");

        // Send token back to WebView
        sendTokenToWebView(token, idToken);
    }
}

private void sendTokenToWebView(String accessToken, String idToken) {
    String jsCode = String.format(
        "if (window.onNativeLoginSuccess) { " +
        "  window.onNativeLoginSuccess({ " +
        "    accessToken: '%s', " +
        "    idToken: '%s', " +
        "    tokenType: 'Bearer' " +
        "  }); " +
        "}",
        accessToken, idToken
    );

    webView.evaluateJavascript(jsCode, null);
}
\`\`\`

---

## iOS Implementation

### Step 1: Setup WKWebView Message Handler

In your ViewController:

\`\`\`swift
import WebKit
import AuthenticationServices

class ViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let contentController = WKUserContentController()
        contentController.add(self, name: "nativeHandler")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        view.addSubview(webView)

        // Load your URL
        let url = URL(string: "https://www.weddingwin.ca/webapp")!
        webView.load(URLRequest(url: url))
    }

    // Handle messages from JavaScript
    func userContentController(_ userContentController: WKUserContentController,
                              didReceive message: WKScriptMessage) {
        guard let dict = message.body as? [String: Any],
              let type = dict["type"] as? String else { return }

        if type == "LOGIN_GOOGLE" {
            if let urlString = dict["url"] as? String,
               let url = URL(string: urlString) {
                handleGoogleLogin(url: url)
            }
        }
    }
}
\`\`\`

### Step 2: Open System Browser for OAuth

\`\`\`swift
import SafariServices

func handleGoogleLogin(url: URL) {
    // Use ASWebAuthenticationSession for OAuth
    let session = ASWebAuthenticationSession(
        url: url,
        callbackURLScheme: "yourapp"
    ) { [weak self] callbackURL, error in
        if let error = error {
            print("OAuth error: \\(error)")
            self?.sendErrorToWebView(error.localizedDescription)
            return
        }

        if let callbackURL = callbackURL {
            self?.handleOAuthCallback(callbackURL)
        }
    }

    session.presentationContextProvider = self
    session.start()
}
\`\`\`

### Step 3: Handle OAuth Callback

\`\`\`swift
func handleOAuthCallback(_ url: URL) {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
        return
    }

    // Extract tokens from URL parameters
    var accessToken: String?
    var idToken: String?

    if let queryItems = components.queryItems {
        for item in queryItems {
            if item.name == "access_token" {
                accessToken = item.value
            } else if item.name == "id_token" {
                idToken = item.value
            }
        }
    }

    // Or extract from fragment (common for OAuth)
    if let fragment = components.fragment {
        let params = fragment.components(separatedBy: "&")
        for param in params {
            let keyValue = param.components(separatedBy: "=")
            if keyValue.count == 2 {
                let key = keyValue[0]
                let value = keyValue[1]
                if key == "access_token" {
                    accessToken = value
                } else if key == "id_token" {
                    idToken = value
                }
            }
        }
    }

    sendTokenToWebView(accessToken: accessToken, idToken: idToken)
}
\`\`\`

### Step 4: Send Token Back to WebView

\`\`\`swift
func sendTokenToWebView(accessToken: String?, idToken: String?) {
    guard let accessToken = accessToken else {
        sendErrorToWebView("No access token received")
        return
    }

    let tokenData: [String: Any] = [
        "accessToken": accessToken,
        "idToken": idToken ?? "",
        "tokenType": "Bearer"
    ]

    if let jsonData = try? JSONSerialization.data(withJSONObject: tokenData),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        let js = """
        if (window.onNativeLoginSuccess) {
            window.onNativeLoginSuccess(\(jsonString));
        }
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }
}

func sendErrorToWebView(_ error: String) {
    let js = """
    if (window.onNativeLoginError) {
        window.onNativeLoginError('\(error)');
    }
    """
    webView.evaluateJavaScript(js, completionHandler: nil)
}
\`\`\`

### Step 5: Conform to Presentation Context Provider

\`\`\`swift
extension ViewController: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return view.window!
    }
}
\`\`\`

---

## React Native (Expo) Implementation

For React Native (which this project uses), the implementation is already handled in `app/index.tsx`. The WebView automatically:

1. Detects Google OAuth attempts via the injected JavaScript
2. Sends messages to React Native using `window.ReactNativeWebView.postMessage()`
3. Opens the system browser using `expo-linking`
4. Handles deep links to capture OAuth callbacks

### Additional Setup Needed for React Native:

#### 1. Configure Deep Linking in `app.json`:

\`\`\`json
{
  "expo": {
    "scheme": "yourapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "associatedDomains": ["applinks:yourapp.com"]
    },
    "android": {
      "package": "com.yourcompany.yourapp",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "yourapp",
              "host": "oauth-callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
\`\`\`

#### 2. Configure OAuth Redirect URI:

When setting up Google OAuth in your Google Cloud Console, add the redirect URI:
- For iOS: `yourapp://oauth-callback`
- For Android: `yourapp://oauth-callback`

#### 3. Handle the Callback in Your Web App:

Your web application's OAuth callback page should:

\`\`\`javascript
// On your OAuth callback page
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const idToken = urlParams.get('id_token');

// Check if running in native app
const isNative = window.ReactNativeWebView || window.Android || window.webkit;

if (isNative && window.onNativeLoginSuccess) {
  window.onNativeLoginSuccess({
    accessToken,
    idToken,
    tokenType: 'Bearer'
  });
}
\`\`\`

---

## Testing the Implementation

### 1. Test in Web Browser
- Open the app in a regular browser
- Click "Sign in with Google"
- Should proceed with normal OAuth flow (no interception)

### 2. Test in Native App
- Build and run the native app
- Click "Sign in with Google"
- Should open system browser
- After authentication, should return to app with tokens
- Check console logs for "[RN] Google Login request received"

### 3. Debugging

Enable verbose logging in both web and native layers:

**Web (check browser console or WebView console):**
- `[WebView] Auth Bridge injection script loaded`
- `[WebView] Google OAuth detected - delegating to native`

**React Native (check Metro bundler logs):**
- `[RN] Message from WebView: {type: 'LOGIN_GOOGLE', ...}`
- `[RN] Opening Google OAuth in system browser`

**Native iOS/Android:**
- Add logging at each step of the OAuth flow
- Verify URL is received correctly
- Verify browser opens
- Verify callback is captured
- Verify token is sent back to WebView

---

## Troubleshooting

### Issue: "403 disallowed_useragent" still occurs

**Solution:** Ensure the OAuth flow is actually opening in the system browser, not in the WebView. Check that:
1. The injected JavaScript is correctly detecting the native environment
2. Messages are being sent to the native layer
3. The native layer is using the system browser (Safari, Chrome) not an in-app WebView

### Issue: OAuth callback not captured

**Solution:**
1. Verify the redirect URI matches exactly in Google Console and your app config
2. Check that deep link handling is properly configured
3. Test the deep link manually: `adb shell am start -W -a android.intent.action.VIEW -d "yourapp://oauth-callback?access_token=test"`

### Issue: Token not reaching WebView

**Solution:**
1. Check that `window.onNativeLoginSuccess` is defined in the WebView
2. Verify the JavaScript is being executed on the correct WebView instance
3. Check for JavaScript errors in the WebView console

---

## Security Considerations

1. **Token Storage:** Never log or store tokens in plain text
2. **HTTPS Only:** Ensure all OAuth URLs use HTTPS
3. **Validate Tokens:** Always validate tokens server-side
4. **Token Expiration:** Implement token refresh logic
5. **Deep Link Validation:** Validate the callback URL scheme and host before processing

---

## Support

For issues specific to:
- **Web Layer:** Check `app/index.tsx` and `utils/authBridge.ts`
- **Native Layer:** Refer to platform-specific documentation
- **OAuth Configuration:** Check Google Cloud Console settings

import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Linking from 'expo-linking';

const STARTING_URL = 'https://www.weddingwin.ca/webapp';

const injectedJavaScript = `
(function() {
  console.log('[WebView] Auth Bridge injection script loaded');

  // Detect if running in native wrapper
  const isNative = !!(window.ReactNativeWebView || window.Android || window.webkit?.messageHandlers?.nativeHandler);

  if (isNative) {
    console.log('[WebView] Native environment detected - setting up Google Auth interception');

    // Expose helper function for web app to check if in native environment
    window.isNativeApp = true;
    window.getNativeRedirectUri = function() {
      return 'mycoolapp://oauth-callback';
    };

    // Function to send message to React Native
    function sendToNative(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      } else if (window.Android) {
        window.Android.postMessage(JSON.stringify(message));
      } else if (window.webkit?.messageHandlers?.nativeHandler) {
        window.webkit.messageHandlers.nativeHandler.postMessage(message);
      }
    }

    // Store original window.open
    const originalWindowOpen = window.open;

    // Helper to modify OAuth URL with correct redirect URI
    function modifyOAuthUrl(url) {
      try {
        const urlObj = new URL(url);

        // Check if this is a Google OAuth URL
        if (urlObj.hostname.includes('accounts.google.com')) {
          // Replace redirect_uri with HTTPS redirect (Google's new policy)
          const currentRedirectUri = urlObj.searchParams.get('redirect_uri');
          console.log('[WebView] Current redirect_uri:', currentRedirectUri);

          // Use HTTPS redirect with Universal Links/App Links instead of custom scheme
          // This complies with Google's new OAuth policy
          urlObj.searchParams.set('redirect_uri', 'https://www.weddingwin.ca/oauth-callback');
          const modifiedUrl = urlObj.toString();

          console.log('[WebView] Modified redirect_uri to: https://www.weddingwin.ca/oauth-callback');
          console.log('[WebView] Using HTTPS redirect (Google OAuth policy compliant)');
          return modifiedUrl;
        }
      } catch (e) {
        console.warn('[WebView] Error modifying OAuth URL:', e);
      }
      return url;
    }

    // Override window.open to intercept Google OAuth
    window.open = function(url, target, features) {
      console.log('[WebView] window.open intercepted:', url);

      // Check if this is a Google OAuth URL
      if (url && (
        url.includes('accounts.google.com/o/oauth2') ||
        url.includes('accounts.google.com/signin/oauth')
      )) {
        console.log('[WebView] Google OAuth detected - delegating to native');

        // Modify the URL to use correct redirect URI
        const modifiedUrl = modifyOAuthUrl(url);

        // Send message to native to handle OAuth
        sendToNative({
          type: 'LOGIN_GOOGLE',
          url: modifiedUrl,
          timestamp: Date.now()
        });

        // Prevent default behavior
        return null;
      }

      // For non-OAuth URLs, use default behavior (navigate in same window)
      if (url) {
        window.location.href = url;
      }
      return window;
    };

    // Intercept clicks on Google Sign-In buttons
    document.addEventListener('click', function(e) {
      const element = e.target.closest('a, button');
      if (!element) return;

      const href = element.href || element.getAttribute('data-href');
      const onclick = element.getAttribute('onclick');

      // Check if this looks like a Google OAuth link
      if ((href && (
        href.includes('accounts.google.com/o/oauth2') ||
        href.includes('accounts.google.com/signin/oauth')
      )) || (onclick && onclick.includes('google'))) {
        console.log('[WebView] Google OAuth link clicked - delegating to native');
        e.preventDefault();
        e.stopPropagation();

        // Modify the URL to use correct redirect URI
        const modifiedUrl = href ? modifyOAuthUrl(href) : 'GOOGLE_LOGIN_REQUESTED';

        sendToNative({
          type: 'LOGIN_GOOGLE',
          url: modifiedUrl,
          timestamp: Date.now()
        });
      }
    }, true);

    console.log('[WebView] Google OAuth interception configured');
  } else {
    console.log('[WebView] Web environment - using standard OAuth flow');
  }
})();
true;
`;

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [key, setKey] = useState(0);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('[RN] Deep link received:', event.url);
      handleOAuthCallback(event.url);
    };

    const handleOAuthCallback = (url: string) => {
      if (!url || !webViewRef.current) return;

      console.log('[RN] Processing OAuth callback URL:', url);

      // Parse the URL to extract tokens
      try {
        const urlObj = new URL(url);

        // Check if this is an OAuth callback (support both custom scheme and HTTPS)
        const isCustomScheme = urlObj.protocol === 'mycoolapp:';
        const isHttpsCallback =
          (urlObj.protocol === 'https:' || urlObj.protocol === 'http:') &&
          urlObj.hostname === 'www.weddingwin.ca' &&
          urlObj.pathname === '/oauth-callback';

        if (isCustomScheme || isHttpsCallback) {
          console.log('[RN] OAuth callback detected:', {
            isCustomScheme,
            isHttpsCallback,
            protocol: urlObj.protocol,
            hostname: urlObj.hostname,
            pathname: urlObj.pathname
          });

          // Extract tokens from query parameters or hash fragment
          const params = new URLSearchParams(urlObj.search || urlObj.hash.substring(1));

          const accessToken = params.get('access_token');
          const idToken = params.get('id_token');
          const code = params.get('code');
          const error = params.get('error');

          console.log('[RN] OAuth callback params:', {
            hasAccessToken: !!accessToken,
            hasIdToken: !!idToken,
            hasCode: !!code,
            error: error
          });

          if (error) {
            console.error('[RN] OAuth error:', error);
            // Inject error into WebView
            const errorScript = `
              if (window.onNativeLoginError) {
                window.onNativeLoginError('${error}');
              }
              true;
            `;
            webViewRef.current.injectJavaScript(errorScript);
            return;
          }

          if (accessToken || idToken || code) {
            console.log('[RN] Sending tokens to WebView');

            // Create token object
            const tokenData = {
              accessToken: accessToken || '',
              idToken: idToken || '',
              code: code || '',
              tokenType: 'Bearer'
            };

            // Inject success callback into WebView
            const successScript = `
              console.log('[WebView] Received OAuth tokens from native');
              if (window.onNativeLoginSuccess) {
                window.onNativeLoginSuccess(${JSON.stringify(tokenData)});
              } else {
                console.warn('[WebView] onNativeLoginSuccess not defined yet');
              }
              true;
            `;
            webViewRef.current.injectJavaScript(successScript);

            // Also navigate back to the main page to ensure WebView shows content
            setTimeout(() => {
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  window.location.href = '${STARTING_URL}';
                  true;
                `);
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error('[RN] Error parsing OAuth callback URL:', error);
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[RN] Initial URL:', url);
        handleOAuthCallback(url);
      }
    });

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsFirstPage(navState.url === STARTING_URL);

    console.log('Navigation:', {
      url: navState.url,
      loading: navState.loading,
      title: navState.title
    });
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
  };

  const handleLoadEnd = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setLoading(false);
    console.log('Load ended:', nativeEvent.url, 'Title:', nativeEvent.title);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[RN] Message from WebView:', data);

      if (data.type === 'LOGIN_GOOGLE') {
        console.log('[RN] Google Login request received:', data.url);
        handleGoogleLogin(data.url);
      }
    } catch (e) {
      console.log('[RN] Non-JSON message:', event.nativeEvent.data);
    }
  };

  const handleGoogleLogin = async (url: string) => {
    console.log('[RN] ====== GOOGLE OAUTH DEBUG ======');
    console.log('[RN] Full OAuth URL:', url);

    // Extract and log key parameters
    try {
      const urlObj = new URL(url);
      const clientId = urlObj.searchParams.get('client_id');
      const redirectUri = urlObj.searchParams.get('redirect_uri');
      const responseType = urlObj.searchParams.get('response_type');

      console.log('[RN] Client ID:', clientId);
      console.log('[RN] Redirect URI:', redirectUri);
      console.log('[RN] Response Type:', responseType);
      console.log('[RN] ================================');

      // Provide helpful instructions
      if (redirectUri === 'https://www.weddingwin.ca/oauth-callback') {
        console.log('[RN] ✅ Using HTTPS redirect (compliant with Google policy)');
        console.log('[RN]');
        console.log('[RN] If you get "redirect_uri_mismatch" error:');
        console.log('[RN] 1. Go to: console.cloud.google.com/apis/credentials');
        console.log('[RN] 2. Find Client ID:', clientId);
        console.log('[RN] 3. Add redirect URI: https://www.weddingwin.ca/oauth-callback');
        console.log('[RN] 4. Save (works immediately!)');
        console.log('[RN]');
        console.log('[RN] See: ADD_REDIRECT_URI_GUIDE.md for detailed steps');
      } else if (redirectUri?.startsWith('mycoolapp://')) {
        console.log('[RN] ⚠️  Using custom URI scheme (deprecated by Google)');
        console.log('[RN] This may cause "Error 400: invalid_request"');
        console.log('[RN] Consider switching to HTTPS redirect');
      }
    } catch (e) {
      console.warn('[RN] Could not parse OAuth URL:', e);
    }

    try {
      if (url === 'GOOGLE_LOGIN_REQUESTED' || !url.startsWith('http')) {
        console.warn('[RN] Invalid OAuth URL, cannot open browser');
        return;
      }

      const result = await Linking.openURL(url);
      console.log('[RN] Browser opened successfully');
    } catch (error) {
      console.error('[RN] Error opening browser:', error);
    }
  };

  const handleOpenWindow = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('[RN] Window open request:', nativeEvent.targetUrl);
    // With the injected JS forcing window.location.href, this might not trigger as often,
    // but if it does, we force it back to the WebView.
    if (nativeEvent.targetUrl && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
            window.location.href = "${nativeEvent.targetUrl}";
            true;
         `);
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;

    // Allow http and https requests to load in the WebView
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }

    // Handle other schemes (mailto, tel, etc.) with the system handler
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.warn('Cannot open URL:', url);
      }
    }).catch(err => console.error('An error occurred', err));

    // Prevent the WebView from loading these URLs
    return false;
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('HTTP Error:', nativeEvent.statusCode, nativeEvent.url);
  };

  return (
    <SafeAreaView style={[styles.container, isFirstPage && styles.blackBackground]}>
      <WebView
        key={key}
        ref={webViewRef}
        source={{ uri: STARTING_URL }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        incognito={false}
        cacheEnabled={true}
        setSupportMultipleWindows={true} // Enable multiple windows for Google Login popups
        onOpenWindow={handleOpenWindow} // Handle them manually
        javaScriptCanOpenWindowsAutomatically={true}
        allowsBackForwardNavigationGestures={true}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
        applicationNameForUserAgent=""
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      {(canGoBack || canGoForward) && (
        <View style={styles.navigationBar}>
          {canGoBack && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => webViewRef.current?.goBack()}
            >
              <ChevronLeft size={24} color="#666" />
            </TouchableOpacity>
          )}
          {canGoForward && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => webViewRef.current?.goForward()}
            >
              <ChevronRight size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blackBackground: {
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  navigationBar: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  navButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

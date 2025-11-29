import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const STARTING_URL = 'https://www.weddingwin.ca/webapp';

const injectedJavaScript = `
  (function() {
    // Override window.open to prevent popups and load URLs in the same window
    const originalOpen = window.open;
    window.open = function(url, target, features) {
      console.log('[WebView] Intercepted window.open:', url, 'target:', target);

      if (!url || url === 'about:blank' || url === '') {
        console.log('[WebView] Ignoring blank URL');
        return null;
      }

      // Post message to React Native
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'WINDOW_OPEN',
          url: url,
          target: target
        }));
      }

      // Navigate in the same window
      window.location.href = url;
      return window;
    };

    // Override links that try to open in new tab
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (link && (link.target === '_blank' || link.target === '_new')) {
        console.log('[WebView] Intercepted _blank link:', link.href);
        e.preventDefault();
        e.stopPropagation();
        if (link.href && link.href !== 'about:blank') {
          window.location.href = link.href;
        }
      }
    }, true);

    // Hide webdriver property to bypass bot detection
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    console.log('[WebView] Injection script loaded successfully');
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
      handleUrl(event.url);
    };

    const handleUrl = (url: string) => {
      const { queryParams } = Linking.parse(url);
      if (queryParams?.code || queryParams?.token) {
        // Extract code or token. Adjust based on what your auth provider returns.
        // Assuming 'code' for standard OAuth or 'token' for implicit flow.
        const code = queryParams.code || queryParams.token;
        console.log('[RN] Extracted auth code/token:', code);

        if (code && webViewRef.current) {
          const jsCode = `
              console.log('[WebView] Received auth code from native');
              if (typeof handleNativeLogin === 'function') {
                handleNativeLogin('${code}');
              } else {
                console.warn('[WebView] handleNativeLogin function not found');
                // Fallback: try to redirect or set a global variable
                window.authCode = '${code}';
              }
              true;
            `;
          webViewRef.current.injectJavaScript(jsCode);
        }
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleGoogleLogin = async (url: string) => {
    try {
      console.log('[RN] Opening system browser for Google Login:', url);
      // Ensure the redirect URI matches what's configured in Google Cloud Console
      // and what the backend expects.
      // Typically: mycoolapp://google-callback

      const result = await WebBrowser.openAuthSessionAsync(url, 'mycoolapp://google-callback');
      console.log('[RN] WebBrowser result:', result);

      if (result.type === 'success' && result.url) {
        // On iOS, the result URL is returned here.
        // On Android, it might be handled by the Linking listener, but sometimes here too.
        // We can try to handle it here just in case.
        const { queryParams } = Linking.parse(result.url);
        if (queryParams?.code || queryParams?.token) {
          const code = queryParams.code || queryParams.token;
          if (code && webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                    if (typeof handleNativeLogin === 'function') {
                        handleNativeLogin('${code}');
                    }
                    true;
                 `);
          }
        }
      }
    } catch (error) {
      console.error('[RN] WebBrowser error:', error);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsFirstPage(navState.url === STARTING_URL);

    const isOAuthUrl = navState.url && (
      navState.url.includes('accounts.google.com') ||
      navState.url.includes('google.com/accounts') ||
      navState.url.includes('oauth') ||
      navState.url.includes('signin') ||
      navState.url.includes('v1/auth')
    );

    if (isOAuthUrl && navState.loading) {
      console.log('[RN] Fail-safe: Intercepting Google Login in NavigationStateChange');
      webViewRef.current?.stopLoading();
      handleGoogleLogin(navState.url);
      return;
    }

    console.log('Navigation:', {
      url: navState.url,
      loading: navState.loading,
      title: navState.title,
      isOAuth: isOAuthUrl
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

      if (data.type === 'WINDOW_OPEN' && data.url && data.url !== 'about:blank') {
        console.log('[RN] Handling window.open from JS:', data.url);
      }
    } catch (error) {
      console.log('[RN] Message (non-JSON):', event.nativeEvent.data);
    }
  };

  const handleOpenWindow = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('[RN] Window open request:', nativeEvent.targetUrl);

    if (nativeEvent.targetUrl) {
      if (nativeEvent.targetUrl.includes('accounts.google.com') ||
        nativeEvent.targetUrl.includes('google.com/accounts') ||
        nativeEvent.targetUrl.includes('oauth') ||
        nativeEvent.targetUrl.includes('signin')) {
        console.log('[RN] Intercepting Google Login popup');
        handleGoogleLogin(nativeEvent.targetUrl);
        return;
      }

      if (nativeEvent.targetUrl !== 'about:blank') {
        console.log('[RN] Redirecting popup to main window:', nativeEvent.targetUrl);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.location.href = "${nativeEvent.targetUrl}";
            true;
          `);
        }
      }
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    console.log('[RN] Should start load:', request.url);

    if (request.url === 'about:blank' || request.url.startsWith('about:blank')) {
      console.log('[RN] Blocking about:blank navigation');
      return false;
    }

    if (request.url.startsWith('blob:')) {
      console.log('[RN] Blocking blob: URL');
      return false;
    }

    // Intercept Google Login
    if (request.url.includes('accounts.google.com') ||
      request.url.includes('google.com/accounts') ||
      request.url.includes('oauth') ||
      request.url.includes('signin')) {
      console.log('[RN] Intercepting Google Login URL');
      handleGoogleLogin(request.url);
      return false;
    }

    return true;
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
        onHttpError={handleHttpError}
        onMessage={handleMessage}
        onOpenWindow={handleOpenWindow}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        incognito={false}
        cacheEnabled={true}
        setSupportMultipleWindows={true}
        javaScriptCanOpenWindowsAutomatically={true}
        allowsBackForwardNavigationGestures={true}
        originWhitelist={['*']}
        userAgent={Platform.select({
          ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
          android: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
          default: undefined
        })}
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

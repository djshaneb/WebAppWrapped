import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Linking from 'expo-linking';

const STARTING_URL = 'https://www.weddingwin.ca/webapp';

const injectedJavaScript = `
(function () {
  // Helper to rewrite target="_blank" to "_self"
  function rewriteTarget(element) {
    if (element && element.target === '_blank') {
      element.target = '_self';
    }
  }

  // Intercept clicks on links
  document.addEventListener('click', function(e) {
    var element = e.target.closest('a');
    if (element) {
        rewriteTarget(element);
    }
  }, true);

  // Intercept form submissions
  document.addEventListener('submit', function(e) {
    var element = e.target;
    if (element && element.tagName === 'FORM') {
        rewriteTarget(element);
    }
  }, true);

  // Override window.open to force navigation in the same window
  window.open = function (url) {
    if (url && url !== 'about:blank') {
       window.location.href = url;
    }
    return window;
  };

  // Hide webdriver property
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
  });
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
      if (url && webViewRef.current) {
        // Handle deep links if needed
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
    // Keep for debugging
    try {
      console.log('[RN] Message:', event.nativeEvent.data);
    } catch (e) { }
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
    if (request.url === 'about:blank' || request.url.startsWith('about:blank')) {
      return false;
    }
    if (request.url.startsWith('blob:')) {
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
        setSupportMultipleWindows={false} // Disable multiple windows to force same-window nav
        javaScriptCanOpenWindowsAutomatically={false} // Let our JS handle it
        allowsBackForwardNavigationGestures={true}
        originWhitelist={['*']}
        userAgent={Platform.select({
          ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          android: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
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

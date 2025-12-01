import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabaseClient';

const STARTING_URL = 'https://www.weddingwin.ca/webapp';

const injectedJavaScript = `
(function() {
  console.log('[WebView] Native OAuth Bridge loaded');

  window.isNativeApp = true;

  function sendToNative(message) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  const originalWindowOpen = window.open;

  window.open = function(url, target, features) {
    console.log('[WebView] window.open intercepted:', url);

    if (url && (
      url.includes('accounts.google.com/o/oauth2') ||
      url.includes('accounts.google.com/signin/oauth')
    )) {
      console.log('[WebView] Google OAuth detected - delegating to native');
      sendToNative({
        type: 'LOGIN_GOOGLE',
        timestamp: Date.now()
      });
      return null;
    }

    if (url) {
      window.location.href = url;
    }
    return window;
  };

  document.addEventListener('click', function(e) {
    const element = e.target.closest('a, button');
    if (!element) return;

    const href = element.href || element.getAttribute('data-href');
    const onclick = element.getAttribute('onclick');

    if ((href && (
      href.includes('accounts.google.com/o/oauth2') ||
      href.includes('accounts.google.com/signin/oauth')
    )) || (onclick && onclick.includes('google'))) {
      console.log('[WebView] Google OAuth link clicked - delegating to native');
      e.preventDefault();
      e.stopPropagation();

      sendToNative({
        type: 'LOGIN_GOOGLE',
        timestamp: Date.now()
      });
    }
  }, true);

  console.log('[WebView] Native OAuth Bridge ready');
})();
true;
`;

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      console.log('[RN] Deep link received:', event.url);
      console.log('[RN] User agent:', navigator.userAgent);

      const url = event.url;

      // Handle both custom scheme (mycoolapp://) and universal links (https://)
      const isAuthCallback = url.includes('oauth-callback') || url.includes('auth/callback');
      const hasToken = url.includes('#access_token=') || url.includes('?access_token=');

      console.log('[RN] isAuthCallback:', isAuthCallback);
      console.log('[RN] hasToken:', hasToken);

      if (isAuthCallback && hasToken) {
        console.log('[RN] Processing OAuth callback...');
        try {
          const params = new URLSearchParams(
            url.includes('#') ? url.split('#')[1] : url.split('?')[1]
          );

          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const expiresIn = params.get('expires_in');
          const error = params.get('error');

          if (error) {
            console.error('[RN] OAuth error:', error);
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                if (window.onNativeLoginError) {
                  window.onNativeLoginError('${error}');
                }
                true;
              `);
            }
            return;
          }

          if (accessToken && refreshToken) {
            console.log('[RN] Setting session from tokens');

            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[RN] Session error:', sessionError);
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  if (window.onNativeLoginError) {
                    window.onNativeLoginError('${sessionError.message}');
                  }
                  true;
                `);
              }
              return;
            }

            if (data.session) {
              console.log('[RN] Session created successfully');

              const sessionData = {
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
                expiresAt: data.session.expires_at,
                user: data.session.user
              };

              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  console.log('[WebView] Received session from native');
                  if (window.onNativeLoginSuccess) {
                    window.onNativeLoginSuccess(${JSON.stringify(sessionData)});
                  } else {
                    console.warn('[WebView] onNativeLoginSuccess not defined yet');
                    localStorage.setItem('supabase_session', JSON.stringify(${JSON.stringify(sessionData)}));
                    window.location.href = '${STARTING_URL}';
                  }
                  true;
                `);
              }
            }
          }
        } catch (error) {
          console.error('[RN] Error processing session:', error);
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[RN] Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsFirstPage(navState.url === STARTING_URL);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
  };

  const handleLoadEnd = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setLoading(false);
    console.log('Load ended:', nativeEvent.url);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[RN] Message from WebView:', data);

      if (data.type === 'LOGIN_GOOGLE') {
        console.log('[RN] Google Login request received');
        handleGoogleLogin();
      }
    } catch (e) {
      console.log('[RN] Non-JSON message:', event.nativeEvent.data);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('[RN] Starting native Google OAuth flow');

      const redirectUrl = 'https://weddingwin.ca/oauth-callback';
      console.log('[RN] Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        }
      });

      if (error) {
        console.error('[RN] OAuth error:', error);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            if (window.onNativeLoginError) {
              window.onNativeLoginError('${error.message}');
            }
            true;
          `);
        }
        return;
      }

      if (data?.url) {
        console.log('[RN] Opening OAuth URL:', data.url);
        await Linking.openURL(data.url);
      }
    } catch (error) {
      console.error('[RN] Error in Google login:', error);
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (window.onNativeLoginError) {
            window.onNativeLoginError('Failed to start OAuth flow');
          }
          true;
        `);
      }
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.warn('Cannot open URL:', url);
      }
    }).catch(err => console.error('An error occurred', err));

    return false;
  };

  return (
    <SafeAreaView style={[styles.container, isFirstPage && styles.blackBackground]}>
      <WebView
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
        allowsBackForwardNavigationGestures={true}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
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

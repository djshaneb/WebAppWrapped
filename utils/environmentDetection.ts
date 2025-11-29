export interface NativeEnvironment {
  isNative: boolean;
  platform: 'web' | 'ios' | 'android';
}

export function detectEnvironment(): NativeEnvironment {
  if (typeof window === 'undefined') {
    return { isNative: false, platform: 'web' };
  }

  const hasReactNativeWebView = !!(window as any).ReactNativeWebView;
  const hasAndroidBridge = !!(window as any).Android;
  const hasIOSBridge = !!(window as any).webkit?.messageHandlers?.nativeHandler;

  const isNative = hasReactNativeWebView || hasAndroidBridge || hasIOSBridge;

  let platform: 'web' | 'ios' | 'android' = 'web';
  if (hasAndroidBridge) {
    platform = 'android';
  } else if (hasIOSBridge || hasReactNativeWebView) {
    platform = 'ios';
  }

  return { isNative, platform };
}

export function sendMessageToNative(message: any): boolean {
  const env = detectEnvironment();

  if (!env.isNative) {
    console.warn('[Bridge] Not in native environment, cannot send message');
    return false;
  }

  try {
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
      return true;
    }

    if ((window as any).Android) {
      (window as any).Android.postMessage(JSON.stringify(message));
      return true;
    }

    if ((window as any).webkit?.messageHandlers?.nativeHandler) {
      (window as any).webkit.messageHandlers.nativeHandler.postMessage(message);
      return true;
    }

    console.warn('[Bridge] Native environment detected but no bridge available');
    return false;
  } catch (error) {
    console.error('[Bridge] Error sending message to native:', error);
    return false;
  }
}

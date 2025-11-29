import { detectEnvironment, sendMessageToNative } from './environmentDetection';

export interface GoogleAuthRequest {
  type: 'LOGIN_GOOGLE';
  url: string;
  clientId?: string;
  redirectUri?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export type AuthCallback = (token: AuthToken | null, error?: string) => void;

class AuthBridgeService {
  private callbacks: Map<string, AuthCallback> = new Map();
  private initialized = false;

  initialize() {
    if (this.initialized) return;

    if (typeof window !== 'undefined') {
      (window as any).onNativeLoginSuccess = this.handleNativeLoginSuccess.bind(this);
      (window as any).onNativeLoginError = this.handleNativeLoginError.bind(this);
      this.initialized = true;
      console.log('[AuthBridge] Initialized successfully');
    }
  }

  private handleNativeLoginSuccess(tokenData: string | AuthToken) {
    console.log('[AuthBridge] Login success received from native');

    let token: AuthToken;
    if (typeof tokenData === 'string') {
      try {
        token = JSON.parse(tokenData);
      } catch (error) {
        token = { accessToken: tokenData };
      }
    } else {
      token = tokenData;
    }

    this.callbacks.forEach(callback => {
      try {
        callback(token);
      } catch (error) {
        console.error('[AuthBridge] Error in callback:', error);
      }
    });
  }

  private handleNativeLoginError(error: string) {
    console.error('[AuthBridge] Login error received from native:', error);

    this.callbacks.forEach(callback => {
      try {
        callback(null, error);
      } catch (err) {
        console.error('[AuthBridge] Error in error callback:', err);
      }
    });
  }

  registerCallback(id: string, callback: AuthCallback) {
    this.callbacks.set(id, callback);
    console.log(`[AuthBridge] Registered callback: ${id}`);
  }

  unregisterCallback(id: string) {
    this.callbacks.delete(id);
    console.log(`[AuthBridge] Unregistered callback: ${id}`);
  }

  initiateGoogleLogin(authUrl: string, options?: { clientId?: string; redirectUri?: string }): boolean {
    const env = detectEnvironment();

    if (!env.isNative) {
      console.log('[AuthBridge] Web environment detected, use standard OAuth flow');
      return false;
    }

    console.log('[AuthBridge] Native environment detected, delegating to native');

    const message: GoogleAuthRequest = {
      type: 'LOGIN_GOOGLE',
      url: authUrl,
      clientId: options?.clientId,
      redirectUri: options?.redirectUri,
    };

    return sendMessageToNative(message);
  }

  clearCallbacks() {
    this.callbacks.clear();
  }
}

export const authBridge = new AuthBridgeService();

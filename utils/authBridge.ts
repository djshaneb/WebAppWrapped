type AuthCallback = (session: any) => void;
type ErrorCallback = (error: string) => void;

class AuthBridge {
  private successCallback: AuthCallback | null = null;
  private errorCallback: ErrorCallback | null = null;

  initialize() {
    console.log('[AuthBridge] Initialized');
  }

  onSuccess(callback: AuthCallback) {
    this.successCallback = callback;
  }

  onError(callback: ErrorCallback) {
    this.errorCallback = callback;
  }

  handleSuccess(session: any) {
    if (this.successCallback) {
      this.successCallback(session);
    }
  }

  handleError(error: string) {
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }

  clearCallbacks() {
    this.successCallback = null;
    this.errorCallback = null;
  }
}

export const authBridge = new AuthBridge();

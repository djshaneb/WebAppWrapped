# Architecture: Google OAuth Bridge Pattern

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Device                             │
│                                                                   │
│  ┌────────────────────┐           ┌──────────────────────┐      │
│  │   Web Browser      │    OR     │   Mobile App         │      │
│  │   (Chrome/Safari)  │           │   (iOS/Android)      │      │
│  └────────────────────┘           └──────────────────────┘      │
│           │                                  │                   │
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              WebView / Browser Window                     │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  WeddingWin Web App                               │   │  │
│  │  │  (https://www.weddingwin.ca/webapp)              │   │  │
│  │  │                                                    │   │  │
│  │  │  Injected JavaScript:                             │   │  │
│  │  │  • Detects environment (web vs native)           │   │  │
│  │  │  • Intercepts Google OAuth attempts              │   │  │
│  │  │  • Routes to appropriate flow                    │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Flow Diagrams

### Web Browser Flow (Unchanged)

```
User                    Web App                 Google OAuth
 │                         │                         │
 │   Click "Sign In"       │                         │
 ├────────────────────────>│                         │
 │                         │                         │
 │                         │  Detect: Web Browser    │
 │                         │  Action: Allow normal   │
 │                         │          redirect       │
 │                         │                         │
 │                  [Redirect to Google]             │
 │<──────────────────────────────────────────────────┤
 │                         │                         │
 │      Authenticate       │                         │
 ├──────────────────────────────────────────────────>│
 │                         │                         │
 │   [Redirect with token] │                         │
 │<──────────────────────────────────────────────────┤
 │                         │                         │
 │      User Logged In     │                         │
 └─────────────────────────┴─────────────────────────┘
```

### Native Mobile App Flow (New)

```
User          WebView       React Native    System Browser    Google OAuth
 │               │                │               │                 │
 │ Click         │                │               │                 │
 │ "Sign In"     │                │               │                 │
 ├──────────────>│                │               │                 │
 │               │                │               │                 │
 │               │ Detect: Native │               │                 │
 │               │ Intercept      │               │                 │
 │               │                │               │                 │
 │               │ postMessage()  │               │                 │
 │               │ {type:         │               │                 │
 │               │  LOGIN_GOOGLE} │               │                 │
 │               ├───────────────>│               │                 │
 │               │                │               │                 │
 │               │                │ Linking       │                 │
 │               │                │ .openURL()    │                 │
 │               │                ├──────────────>│                 │
 │               │                │               │                 │
 │               │                │               │ Open OAuth URL  │
 │               │                │               ├────────────────>│
 │               │                │               │                 │
 │  [System Browser Opens]        │               │                 │
 │<──────────────────────────────────────────────>│                 │
 │               │                │               │                 │
 │ Authenticate  │                │               │                 │
 ├───────────────────────────────────────────────────────────────>│
 │               │                │               │                 │
 │               │                │               │ [Redirect with  │
 │               │                │               │  token to       │
 │               │                │               │  yourapp://]    │
 │<──────────────────────────────────────────────────────────────┤
 │               │                │               │                 │
 │               │                │ [Deep Link    │                 │
 │               │                │  Captured]    │                 │
 │               │                │<──────────────┤                 │
 │               │                │               │                 │
 │               │ window         │               │                 │
 │               │ .onNativeLogin │               │                 │
 │               │ Success(token) │               │                 │
 │               │<───────────────┤               │                 │
 │               │                │               │                 │
 │  User         │                │               │                 │
 │  Logged In    │                │               │                 │
 └───────────────┴────────────────┴───────────────┴─────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         app/_layout.tsx                          │
│                                                                   │
│  • Initializes authBridge on mount                               │
│  • Sets up global callbacks:                                     │
│    - window.onNativeLoginSuccess()                              │
│    - window.onNativeLoginError()                                │
│  • Cleans up on unmount                                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ imports
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      utils/authBridge.ts                         │
│                                                                   │
│  • Manages authentication callbacks                              │
│  • Handles token data from native layer                         │
│  • Initiates Google Login via native bridge                     │
│  • Type-safe token interface                                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ uses
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  utils/environmentDetection.ts                   │
│                                                                   │
│  • detectEnvironment(): Checks if web or native                 │
│  • sendMessageToNative(): Sends messages cross-platform         │
│  • Handles: ReactNativeWebView, Android, iOS bridges           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ used by
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        app/index.tsx                             │
│                                                                   │
│  • WebView component with injected JavaScript                    │
│  • Intercepts Google OAuth in web content                       │
│  • Sends messages to React Native layer                        │
│  • Opens system browser using expo-linking                      │
│  • Handles deep link callbacks                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Message Types

#### From WebView to React Native

```typescript
{
  type: 'LOGIN_GOOGLE',
  url: 'https://accounts.google.com/o/oauth2/...',
  timestamp: 1234567890
}
```

#### From Native to WebView

```typescript
// Success
window.onNativeLoginSuccess({
  accessToken: 'ya29.xxx...',
  idToken: 'eyJhbGc...',
  tokenType: 'Bearer',
  expiresIn: 3600
});

// Error
window.onNativeLoginError('User cancelled authentication');
```

## Environment Detection Logic

```javascript
// Injected into WebView
const isNative = !!(
  window.ReactNativeWebView ||  // React Native WebView
  window.Android ||               // Android native bridge
  window.webkit?.messageHandlers?.nativeHandler  // iOS WKWebView
);

if (isNative) {
  // Use native OAuth flow (system browser)
} else {
  // Use standard web OAuth flow (redirect)
}
```

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                     Trusted Boundary                         │
│                                                               │
│  ┌────────────────┐         ┌─────────────────────┐         │
│  │  React Native  │◄───────►│  Native Code       │         │
│  │  JavaScript    │         │  (iOS/Android)     │         │
│  └────────────────┘         └─────────────────────┘         │
│         ▲                              │                     │
│         │                              │                     │
│         │ postMessage()                │ Deep Link          │
│         │                              │ (yourapp://)       │
│         │                              ▼                     │
│  ┌─────────────────────────────────────────────────┐        │
│  │           System Browser (Safari/Chrome)        │        │
│  │           • Trusted by Google OAuth             │        │
│  │           • No WebView restrictions             │        │
│  │           • Full cookie/session support         │        │
│  └─────────────────────────────────────────────────┘        │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
              ┌──────────────────────┐
              │   Google OAuth       │
              │   Server             │
              └──────────────────────┘
```

## File Dependencies

```
app/_layout.tsx
├── imports: utils/authBridge
└── initializes: window.onNativeLoginSuccess

utils/authBridge.ts
├── imports: utils/environmentDetection
├── exports: authBridge (singleton)
└── types: AuthToken, GoogleAuthRequest

utils/environmentDetection.ts
├── exports: detectEnvironment()
├── exports: sendMessageToNative()
└── types: NativeEnvironment

app/index.tsx
├── imports: expo-linking
├── uses: WebView postMessage handling
└── calls: Linking.openURL() for OAuth
```

## Platform Compatibility

| Feature                | Web Browser | React Native | Native iOS | Native Android |
|------------------------|-------------|--------------|------------|----------------|
| Environment Detection  | ✅          | ✅           | ⚠️ *       | ⚠️ *          |
| OAuth Interception     | ❌ (not needed) | ✅      | ⚠️ *       | ⚠️ *          |
| System Browser Launch  | N/A         | ✅ (expo-linking) | ⚠️ * | ⚠️ *     |
| Deep Link Handling     | N/A         | ✅           | ⚠️ *       | ⚠️ *          |
| Token Callback         | N/A         | ✅           | ⚠️ *       | ⚠️ *          |

⚠️ * = Requires native code implementation (see NATIVE_BRIDGE_GUIDE.md)

## Build Targets

### Development (Current)
- ✅ Web Browser: Fully functional
- ✅ Expo Go: Partially functional (browser opens, but callback needs configuration)
- ✅ Development Build: Fully functional with proper deep link setup

### Production
- ✅ Web: No changes needed
- ⚠️ iOS App: Requires native implementation
- ⚠️ Android App: Requires native implementation

## Performance Considerations

1. **Injection Script**: Runs once per page load (~5ms overhead)
2. **Environment Detection**: O(1) operation, negligible performance impact
3. **Message Passing**: Asynchronous, non-blocking
4. **Browser Launch**: Native OS operation, ~200-500ms
5. **Deep Link**: Native OS routing, ~100-300ms

## Rollback Strategy

All changes are **non-breaking** and can be reverted by:

1. Restore previous `app/index.tsx` (simpler injected script)
2. Restore previous `app/_layout.tsx` (remove auth bridge)
3. Delete utility files: `utils/authBridge.ts`, `utils/environmentDetection.ts`

No database migrations, no breaking API changes, no user data affected.

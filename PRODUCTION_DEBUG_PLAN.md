# Production Debugging Plan: Interview Session Creation Crash

## Issue Summary
After successfully creating an interview session (RLS policies now work), the app crashes with "supabaseUrl is required" error when navigating to `/test/full`.

## Root Cause Analysis

### Symptoms
1. Interview session creation succeeds (no more RLS errors)
2. Navigation to `/test/full` triggers a white screen
3. Console shows: `Error: supabaseUrl is required`
4. Error occurs in the Supabase client initialization

### Likely Causes
1. **Code Splitting Issue**: The route lazy loads a component that re-initializes Supabase
2. **Environment Variable Issue**: Production build doesn't have access to hardcoded values
3. **Import Order Issue**: Supabase client is imported before it's properly initialized
4. **Navigation State Issue**: Query parameters or state is lost during navigation

## Debugging Steps

### Step 1: Add Debug Logging (Immediate)
Create a debug version that logs the navigation flow:

```typescript
// In TestInterview.tsx, before navigation:
console.log('[DEBUG] About to navigate with params:', {
  sessionId,
  selectedCandidate,
  selectedPosition,
  tenantId,
  selectedCompany
});

// Add to the navigation URL
navigate(`/test/full?session=${sessionId}&candidate=${selectedCandidate}&position=${selectedPosition}&tenant=${tenantId}&company=${selectedCompany}&debug=true`);
```

### Step 2: Create Error Boundary (5 minutes)
Add an error boundary to catch and display the exact error:

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee', border: '1px solid #fcc' }}>
          <h2>Production Error Caught</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
          <button onClick={() => window.location.href = '/'}>
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Wrap the route in App.tsx:
```typescript
<Route path="/test/full" element={
  <ErrorBoundary>
    <InterviewTestSimple />
  </ErrorBoundary>
} />
```

### Step 3: Check Supabase Initialization (10 minutes)
Add defensive checks to Supabase client:

```typescript
// In src/integrations/supabase/client.ts, add validation:
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE] Missing configuration:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    isDevelopment,
    importMetaEnv: import.meta.env
  });
  
  // Fallback to production values
  const fallbackUrl = REMOTE_SUPABASE_URL;
  const fallbackKey = REMOTE_SUPABASE_KEY;
  
  console.warn('[SUPABASE] Using fallback configuration');
  
  return createClient<Database>(fallbackUrl, fallbackKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
}
```

### Step 4: Create Diagnostic Page (15 minutes)
Create a diagnostic page to test in production:

```typescript
// src/pages/DiagnosticTest.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DiagnosticTest = () => {
  const [diagnostics, setDiagnostics] = useState<any>({});

  useEffect(() => {
    const runDiagnostics = async () => {
      const diag = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        
        // Environment checks
        env: {
          isDev: import.meta.env.DEV,
          mode: import.meta.env.MODE,
          base: import.meta.env.BASE_URL,
          allEnvKeys: Object.keys(import.meta.env)
        },
        
        // Supabase checks
        supabase: {
          clientExists: !!supabase,
          authExists: !!supabase?.auth,
          canGetSession: false,
          session: null,
          error: null
        },
        
        // Navigation params
        urlParams: Object.fromEntries(new URLSearchParams(window.location.search))
      };

      try {
        const { data, error } = await supabase.auth.getSession();
        diag.supabase.canGetSession = true;
        diag.supabase.session = data?.session ? 'exists' : 'null';
        diag.supabase.error = error?.message || null;
      } catch (e) {
        diag.supabase.error = e instanceof Error ? e.message : 'Unknown error';
      }

      setDiagnostics(diag);
    };

    runDiagnostics();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Production Diagnostics</h1>
      <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(diagnostics, null, 2)}
      </pre>
      <button onClick={() => window.location.reload()}>
        Refresh
      </button>
    </div>
  );
};

export default DiagnosticTest;
```

Add route in App.tsx:
```typescript
<Route path="/diagnostic" element={<DiagnosticTest />} />
```

### Step 5: Test Alternative Navigation (5 minutes)
Instead of using React Router navigation, try:

```typescript
// In TestInterview.tsx handleStartInterview:
// Option 1: Use window.location
window.location.href = `/test/full?session=${sessionId}&candidate=${selectedCandidate}&position=${selectedPosition}&tenant=${tenantId}&company=${selectedCompany}`;

// Option 2: Use a delay
setTimeout(() => {
  navigate(`/test/full?session=${sessionId}...`);
}, 100);
```

### Step 6: Production Testing Checklist

1. **Deploy diagnostic changes**
   ```bash
   git add -A
   git commit -m "feat: Add production debugging tools"
   git push origin main
   ```

2. **Test in production (after deployment)**
   - [ ] Visit `/diagnostic` to check Supabase initialization
   - [ ] Try creating an interview session
   - [ ] Check browser console for debug logs
   - [ ] Check if error boundary catches the error
   - [ ] Test alternative navigation methods

3. **Monitor Network Tab**
   - [ ] Check if any chunks fail to load
   - [ ] Verify all JavaScript files load with 200 status
   - [ ] Look for CORS errors

4. **Check Vercel Logs**
   - Visit Vercel dashboard
   - Check Function logs for any server-side errors
   - Check Build logs for any warnings

### Step 7: Quick Fixes to Try

1. **Force Page Reload**
   ```typescript
   // Instead of navigate()
   window.location.href = `/test/full?${params}`;
   ```

2. **Ensure Supabase is Singleton**
   ```typescript
   // In client.ts, ensure single instance:
   let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

   export const getSupabase = () => {
     if (!supabaseInstance) {
       supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
         auth: { persistSession: true, autoRefreshToken: true }
       });
     }
     return supabaseInstance;
   };

   export const supabase = getSupabase();
   ```

3. **Add Loading State**
   ```typescript
   // In InterviewTestSimple.tsx
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
     // Ensure Supabase is ready
     const checkSupabase = async () => {
       try {
         await supabase.auth.getSession();
         setIsLoading(false);
       } catch (error) {
         console.error('Supabase not ready:', error);
       }
     };
     checkSupabase();
   }, []);

   if (isLoading) return <div>Loading...</div>;
   ```

## Expected Outcomes

After implementing these debugging steps, we should be able to:
1. Identify exactly where the Supabase client loses its configuration
2. Capture the full error stack trace
3. Understand the navigation flow that causes the issue
4. Implement a workaround or permanent fix

## Next Steps

Based on findings:
- If it's a code splitting issue → Ensure Supabase is imported at the app root
- If it's an environment issue → Add proper environment variable handling
- If it's a navigation issue → Use window.location instead of React Router
- If it's a timing issue → Add proper loading states and initialization checks
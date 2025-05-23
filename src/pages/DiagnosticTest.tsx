import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DiagnosticTest = () => {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

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
          allEnvKeys: Object.keys(import.meta.env).filter(key => !key.includes('VITE'))
        },
        
        // Supabase checks
        supabase: {
          clientExists: !!supabase,
          authExists: !!supabase?.auth,
          functionsExist: !!supabase?.functions,
          realtimeExists: !!supabase?.realtime,
          storageExists: !!supabase?.storage,
          canGetSession: false,
          session: null,
          user: null,
          error: null
        },
        
        // Navigation params
        urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
        
        // Browser checks
        browser: {
          cookiesEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          language: navigator.language,
          platform: navigator.platform
        },
        
        // Storage checks
        storage: {
          localStorageAvailable: false,
          sessionStorageAvailable: false,
          localStorageKeys: [],
          supabaseAuthToken: null
        }
      };

      // Test Supabase connection
      try {
        const { data, error } = await supabase.auth.getSession();
        diag.supabase.canGetSession = true;
        diag.supabase.session = data?.session ? {
          exists: true,
          expiresAt: data.session.expires_at,
          provider: data.session.user?.app_metadata?.provider
        } : null;
        diag.supabase.user = data?.session?.user ? {
          id: data.session.user.id,
          email: data.session.user.email,
          hasAppMetadata: !!data.session.user.app_metadata,
          hasTenantId: !!data.session.user.app_metadata?.tenant_id,
          tenantId: data.session.user.app_metadata?.tenant_id
        } : null;
        diag.supabase.error = error?.message || null;
      } catch (e) {
        diag.supabase.error = e instanceof Error ? e.message : 'Unknown error';
      }

      // Test localStorage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        diag.storage.localStorageAvailable = true;
        diag.storage.localStorageKeys = Object.keys(localStorage);
        
        // Check for Supabase auth token
        const authToken = localStorage.getItem('supabase.auth.token');
        diag.storage.supabaseAuthToken = authToken ? 'exists' : 'not found';
      } catch (e) {
        diag.storage.localStorageAvailable = false;
      }

      // Test sessionStorage
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        diag.storage.sessionStorageAvailable = true;
      } catch (e) {
        diag.storage.sessionStorageAvailable = false;
      }

      setDiagnostics(diag);
      setIsLoading(false);
    };

    runDiagnostics();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
    alert('Diagnostics copied to clipboard!');
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Production Diagnostics</CardTitle>
          <CardDescription>
            System information and Supabase connection status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Running diagnostics...</div>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Diagnostics
                </Button>
                <Button onClick={copyToClipboard} variant="outline" className="ml-2">
                  Copy to Clipboard
                </Button>
                <Button 
                  onClick={() => window.location.href = '/test-interview'} 
                  variant="default" 
                  className="ml-2"
                >
                  Go to Test Interview
                </Button>
              </div>
              
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticTest;
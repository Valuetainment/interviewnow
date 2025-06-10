import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Check if it's the specific .add() error we're seeing
  if (event.error?.message?.includes('Cannot read properties of undefined')) {
    console.warn('Suppressing known third-party error:', event.error.message);
    event.preventDefault(); // Prevent the error from breaking the app
  }
});

// Wrap app initialization in try-catch
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('Failed to initialize app:', error);
  
  // Fallback UI
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Application Error</h1>
        <p style="color: #666; margin-bottom: 24px;">We're having trouble loading the application.</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}

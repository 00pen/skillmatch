// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser behavior of logging to console
    event.preventDefault();
    
    // You could send this to an error reporting service here
    // Example: Sentry.captureException(event.reason);
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
  });
};

// Utility function to safely handle async operations
export const safeAsync = (asyncFn) => {
  return (...args) => {
    try {
      const result = asyncFn(...args);
      if (result && typeof result.catch === 'function') {
        return result.catch(error => {
          console.error('Async operation failed:', error);
          throw error;
        });
      }
      return result;
    } catch (error) {
      console.error('Sync operation failed:', error);
      throw error;
    }
  };
};
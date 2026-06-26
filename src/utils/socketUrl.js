export function getSocketServerUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      // fall through
    }
  }

  return 'http://localhost:5000';
}

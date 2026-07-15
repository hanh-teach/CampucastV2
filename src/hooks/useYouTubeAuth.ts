import { useState } from 'react';

export function useYouTubeAuth(onAuthSuccess: () => void) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const connectYouTube = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const { url } = await response.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          setIsAuthenticated(true);
          if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            window.removeEventListener('message', handleMessage);
          }
          onAuthSuccess();
        }
      };
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('message', handleMessage);
      }
    } catch (err) {
      console.error("Failed to initiate OAuth:", err);
    }
  };

  return {
    isAuthenticated,
    connectYouTube
  };
}

export const getApiUrl = (endpoint: string): string => {
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (envApiUrl) {
    const base = envApiUrl.endsWith("/") ? envApiUrl.slice(0, -1) : envApiUrl;
    const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${base}${formattedEndpoint}`;
  }
  return endpoint;
};

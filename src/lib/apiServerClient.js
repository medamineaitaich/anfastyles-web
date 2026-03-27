const getBaseUrl = () => {
  const envBaseUrl = import.meta?.env?.VITE_API_BASE_URL;
  const defaultBaseUrl = import.meta?.env?.PROD ? 'https://api-layer.anfastyles.shop' : 'http://localhost:3001';
  return (envBaseUrl && String(envBaseUrl).trim()) || defaultBaseUrl;
};

const joinUrl = (baseUrl, path) => {
  const base = String(baseUrl).replace(/\/+$/, '');
  const p = String(path || '');

  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith('/')) return `${base}${p}`;
  return `${base}/${p}`;
};

const apiServerClient = {
  fetch: (path, init = {}) => {
    const url = joinUrl(getBaseUrl(), path);
    return fetch(url, {
      credentials: 'include',
      ...init
    });
  }
};

export default apiServerClient;


const getBaseUrl = () => {
  const envBaseUrl =
    import.meta?.env?.VITE_API_URL ?? import.meta?.env?.VITE_API_BASE_URL;
  return (envBaseUrl && String(envBaseUrl).trim()) || 'http://localhost:3001';
};

const joinUrl = (baseUrl, path) => {
  const base = String(baseUrl).replace(/\/+$/, '');
  const p = String(path || '');

  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith('/')) return `${base}${p}`;
  return `${base}/${p}`;
};

const apiServerClient = {
  getBaseUrl,
  buildUrl: (path) => joinUrl(getBaseUrl(), path),
  fetch: (path, init = {}) => {
    const baseUrl = getBaseUrl();
    const url = joinUrl(baseUrl, path);

    // Temporary diagnostics: log only products flow to avoid noisy console.
    if (String(path || '').startsWith('/products')) {
      console.log('[api] baseUrl=', baseUrl);
      console.log('[api] requestUrl=', url);
    }

    return fetch(url, {
      credentials: 'include',
      ...init
    })
      .then((res) => {
        if (String(path || '').startsWith('/products')) {
          console.log('[api] status=', res.status, res.statusText);
        }
        return res;
      })
      .catch((error) => {
        if (String(path || '').startsWith('/products')) {
          console.error('[api] fetch error:', error);
        }
        throw error;
      });
  }
};

export default apiServerClient;

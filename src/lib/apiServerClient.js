const getBaseUrl = () => {
  const envBaseUrl = import.meta?.env?.VITE_API_BASE_URL;
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
  fetch: (path, init = {}) => {
    const url = joinUrl(getBaseUrl(), path);
    return fetch(url, {
      credentials: 'include',
      ...init
    });
  }
};

export default apiServerClient;


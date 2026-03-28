const getWpBaseUrl = () => {
  const envBaseUrl = import.meta?.env?.VITE_WP_BASE_URL;
  const defaultBaseUrl = 'https://wp.anfastyles.shop';
  return (envBaseUrl && String(envBaseUrl).trim()) || defaultBaseUrl;
};

const joinUrl = (baseUrl, path) => {
  const base = String(baseUrl).replace(/\/+$/, '');
  const p = String(path || '');

  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith('/')) return `${base}${p}`;
  return `${base}/${p}`;
};

const wpBridgeClient = {
  fetch: (path, init = {}) => {
    const url = joinUrl(getWpBaseUrl(), path);
    return fetch(url, {
      credentials: 'omit',
      ...init
    });
  }
};

export const fetchWooPaymentsConfig = async ({ signal } = {}) => {
  const res = await wpBridgeClient.fetch('/wp-json/anfastyles/v1/woopayments-config', { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to load WooPayments config');
  }
  return res.json();
};

export default wpBridgeClient;

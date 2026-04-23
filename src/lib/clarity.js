const CLARITY_PROJECT_ID = String(import.meta.env.VITE_CLARITY_PROJECT_ID || '').trim();
const CLARITY_SCRIPT_ID = 'microsoft-clarity-script';

let clarityBootstrapped = false;

const ensureQueue = () => {
  if (typeof window === 'undefined') return null;

  if (typeof window.clarity !== 'function') {
    window.clarity = function clarityProxy(...args) {
      window.clarity.q = window.clarity.q || [];
      window.clarity.q.push(args);
    };
  }

  return window.clarity;
};

export const initClarity = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (!CLARITY_PROJECT_ID) return false;

  ensureQueue();

  if (clarityBootstrapped) return true;
  if (document.getElementById(CLARITY_SCRIPT_ID)) {
    clarityBootstrapped = true;
    return true;
  }

  const script = document.createElement('script');
  script.id = CLARITY_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_PROJECT_ID)}`;

  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  clarityBootstrapped = true;
  return true;
};

export const trackClarityRoute = (pathname) => {
  const clarity = ensureQueue();
  if (!clarity || !initClarity()) return false;

  const safePath = typeof pathname === 'string' ? pathname.trim() : '';
  if (!safePath) return false;

  // Keep SPA route context updated without forwarding query strings or field data.
  clarity('set', 'route', safePath);
  return true;
};


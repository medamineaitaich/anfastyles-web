const normalizeText = (value) => String(value || '').trim();

const getMetaPixelId = () => normalizeText(import.meta?.env?.VITE_META_PIXEL_ID);

export const initMetaPixel = () => {
  const pixelId = getMetaPixelId();
  if (!pixelId || typeof window === 'undefined') return false;

  if (window.fbq && window._fbq) {
    return true;
  }

  // Meta base pixel, but with env-provided pixel id and safe no-op when unset.
  // This keeps tracking in-app (headless storefront) and works for SPA navigation.
  /* eslint-disable */
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', pixelId);
  return true;
};

const getFbq = () => {
  if (typeof window === 'undefined') return null;
  return typeof window.fbq === 'function' ? window.fbq : null;
};

export const trackMetaEvent = (eventName, params) => {
  if (!initMetaPixel()) return false;

  const fbq = getFbq();
  if (!fbq) return false;

  try {
    if (params && typeof params === 'object') {
      fbq('track', eventName, params);
    } else {
      fbq('track', eventName);
    }
    return true;
  } catch (error) {
    console.warn(`Meta Pixel track(${eventName}) failed`, error);
    return false;
  }
};

export const trackMetaPageView = () => trackMetaEvent('PageView');


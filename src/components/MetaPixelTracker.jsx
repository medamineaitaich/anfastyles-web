import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initMetaPixel, trackMetaPageView } from '@/lib/metaPixel.js';

const MetaPixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (!initMetaPixel()) return;
    trackMetaPageView();
  }, [location.pathname, location.search]);

  return null;
};

export default MetaPixelTracker;


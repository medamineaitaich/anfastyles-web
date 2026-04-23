import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initClarity, trackClarityRoute } from '@/lib/clarity.js';

const ClarityTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (!initClarity()) return;
    trackClarityRoute(location.pathname);
  }, [location.pathname]);

  return null;
};

export default ClarityTracker;


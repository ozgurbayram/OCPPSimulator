import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPage } from '@/lib/analytics';

export function AnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPage(pathname);
  }, [pathname]);

  return null;
}

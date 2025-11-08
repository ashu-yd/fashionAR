import { useEffect, useState } from 'react';
import AuthPage from './AuthPage';
import HomePage from './HomePage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import TryOnPage from './TryOnPage';
import { useAuth } from '../contexts/AuthContext';

export default function Router() {
  const [route, setRoute] = useState(window.location.pathname);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setRoute(window.location.pathname);
    };

    return () => {
      window.history.pushState = originalPushState;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (route.startsWith('/tryon/')) {
    const productId = route.split('/tryon/')[1];
    return <TryOnPage productId={productId} />;
  }

  switch (route) {
    case '/cart':
      return <CartPage />;
    case '/checkout':
      return <CheckoutPage />;
    case '/':
    default:
      return <HomePage />;
  }
}

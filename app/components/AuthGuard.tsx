'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // CRITICAL: Wait for session restore to complete before redirecting
    // Do NOT redirect on loading state - this prevents false logouts
    if (!isLoading && !isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router, isRedirecting]);

  // Show loading state while checking auth (prevents flash of login page)
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.125rem' }}>Yuklanmoqda...</div>
      </div>
    );
  }

  // Redirect only if truly not authenticated (after loading completes)
  if (!isAuthenticated || isRedirecting) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
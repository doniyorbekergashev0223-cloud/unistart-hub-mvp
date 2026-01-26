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
    // Wait for session restore to complete before redirecting
    if (!isLoading && !isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router, isRedirecting]);

  // Show nothing while loading or redirecting
  if (isLoading || !isAuthenticated || isRedirecting) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
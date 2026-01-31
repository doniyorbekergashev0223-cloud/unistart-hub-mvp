'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import PublicDashboard from './components/PublicDashboard';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #fef7ed 0%, #fef3e2 100%)',
        }}
        role="status"
        aria-live="polite"
      >
        <div style={{ color: '#0f172a', fontSize: '1.125rem' }}>Yuklanmoqda...</div>
      </div>
    );
  }

  return <PublicDashboard />;
}

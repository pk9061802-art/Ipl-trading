'use client';

import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-950 text-white">
          <Navbar />
          <main className="pt-16">{children}</main>
          <ToastContainer />
        </div>
      </AuthProvider>
    </ToastProvider>
  );
}

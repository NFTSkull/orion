'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si existe cookie de tenant
    const cookies = document.cookie.split(';');
    const tenantCookie = cookies.find(c => c.trim().startsWith('orion_tenant='));
    
    if (tenantCookie) {
      // Si existe cookie, redirigir al dashboard
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">ORION</h1>
        <p className="text-xl text-gray-600 mb-8">
          Vendedor automático por WhatsApp
        </p>
        <p className="text-gray-500 mb-12">
          Responde, agenda, cobra y analiza tu negocio automáticamente
        </p>
        
        <div className="space-y-4">
          <a 
            href="/onboarding" 
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Configurar mi negocio
          </a>
          
          <div className="text-sm text-gray-400">
            <a href="/playground" className="hover:text-gray-600">
              O ir al playground de desarrollo →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

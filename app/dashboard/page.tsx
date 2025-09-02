'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/time';

interface Metrics {
  leadsWeek: number;
  bookingsWeek: number;
  paidAmountWeekMXN: number;
  conversionPct: number;
  latestBookings: Array<{
    id: string;
    leadId?: string;
    startsAt: string;
    status: string;
  }>;
  latestPayments: Array<{
    id: string;
    leadId?: string;
    amountCents: number;
    status: string;
  }>;
}

export default function Dashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantSlug, setTenantSlug] = useState('');

  useEffect(() => {
    // Obtener tenant slug de la cookie
    const cookies = document.cookie.split(';');
    const tenantCookie = cookies.find(c => c.trim().startsWith('orion_tenant='));
    
    if (tenantCookie) {
      const slug = tenantCookie.split('=')[1];
      setTenantSlug(slug);
      // Por ahora, no cargar métricas automáticamente para evitar problemas de conexión
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMetrics = async (slug: string) => {
    try {
      const response = await fetch(`/api/metrics?tenantSlug=${slug}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!tenantSlug) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-4">Configura tu negocio para ver las métricas</p>
          <a 
            href="/onboarding" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Configura tu negocio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Resumen de tu negocio</p>
          <p className="text-sm text-gray-500 mt-2">
            Tenant: <strong>{tenantSlug}</strong>
          </p>
        </div>
        
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Leads esta semana</h3>
            <p className="text-3xl font-bold text-blue-600">
              {metrics?.leadsWeek || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Citas esta semana</h3>
            <p className="text-3xl font-bold text-green-600">
              {metrics?.bookingsWeek || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Ingresos esta semana</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {formatCurrency(metrics?.paidAmountWeekMXN || 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Conversión</h3>
            <p className="text-3xl font-bold text-purple-600">
              {metrics?.conversionPct || 0}%
            </p>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Próximas citas</h3>
            </div>
            <div className="p-4">
              {metrics?.latestBookings && metrics.latestBookings.length > 0 ? (
                <div className="space-y-3">
                  {metrics.latestBookings.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">
                          {booking.leadId ? `Lead ${booking.leadId.slice(0, 8)}...` : 'Sin lead'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(booking.startsAt)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No hay citas programadas</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Últimos pagos</h3>
            </div>
            <div className="p-4">
              {metrics?.latestPayments && metrics.latestPayments.length > 0 ? (
                <div className="space-y-3">
                  {metrics.latestPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">
                          {payment.leadId ? `Lead ${payment.leadId.slice(0, 8)}...` : 'Sin lead'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatCurrency(payment.amountCents)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        payment.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No hay pagos registrados</p>
              )}
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Acciones rápidas</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => fetchMetrics(tenantSlug)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Cargar Métricas
            </button>
            <a 
              href="/playground" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Ir al Playground
            </a>
            <button 
              onClick={() => {
                document.cookie = 'orion_tenant=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                router.push('/');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cambiar negocio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

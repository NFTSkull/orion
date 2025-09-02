'use client';

import { useState, useEffect } from 'react';
import { formatToE164 } from '@/lib/phone';

interface Log {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export default function Playground() {
  const [tenantSlug, setTenantSlug] = useState('');
  const [leadData, setLeadData] = useState({ name: '', phone: '' });
  const [bookingData, setBookingData] = useState({ 
    leadId: '', 
    startsAt: '', 
    durationMin: 30 
  });
  const [paymentData, setPaymentData] = useState({ 
    leadId: '', 
    amountCents: 0, 
    paymentId: '' 
  });
  const [stripeData, setStripeData] = useState({
    leadId: '',
    amountCents: 0,
    currency: 'MXN'
  });
  const [statusData, setStatusData] = useState({
    leadId: '',
    status: 'contacted',
    lostReason: ''
  });
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtener tenant slug de la cookie
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const tenantCookie = cookies.find(c => c.trim().startsWith('orion_tenant='));
    if (tenantCookie) {
      setTenantSlug(tenantCookie.split('=')[1]);
    }
  }, []);

  // Polling de logs cada 3 segundos
  useEffect(() => {
    if (!tenantSlug) return;

    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/metrics?tenantSlug=${tenantSlug}`);
        if (response.ok) {
          // Los logs se obtienen del store directamente
          // En una implementación real, tendríamos un endpoint específico para logs
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [tenantSlug]);

  const createLead = async () => {
    if (!tenantSlug || !leadData.name || !leadData.phone) {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          name: leadData.name,
          phoneE164: formatToE164(leadData.phone),
          source: 'playground',
        }),
      });

      if (response.ok) {
        const lead = await response.json();
        setBookingData(prev => ({ ...prev, leadId: lead.id }));
        setPaymentData(prev => ({ ...prev, leadId: lead.id }));
        setStatusData(prev => ({ ...prev, leadId: lead.id }));
        alert('Lead creado exitosamente');
        setLeadData({ name: '', phone: '' });
      } else {
        alert('Error al crear lead');
      }
    } catch (error) {
      alert('Error al crear lead');
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    if (!tenantSlug || !bookingData.startsAt) {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          leadId: bookingData.leadId || undefined,
          startsAt: bookingData.startsAt,
          durationMin: bookingData.durationMin,
        }),
      });

      if (response.ok) {
        alert('Cita creada exitosamente');
        setBookingData({ leadId: '', startsAt: '', durationMin: 30 });
      } else {
        alert('Error al crear cita');
      }
    } catch (error) {
      alert('Error al crear cita');
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async () => {
    if (!tenantSlug || !paymentData.amountCents) {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          leadId: paymentData.leadId || undefined,
          amountCents: paymentData.amountCents,
          currency: 'MXN',
        }),
      });

      if (response.ok) {
        const payment = await response.json();
        setPaymentData(prev => ({ ...prev, paymentId: payment.id }));
        alert('Pago creado exitosamente');
      } else {
        alert('Error al crear pago');
      }
    } catch (error) {
      alert('Error al crear pago');
    } finally {
      setLoading(false);
    }
  };

  const markPaymentPaid = async () => {
    if (!tenantSlug || !paymentData.paymentId) {
      alert('No hay pago para marcar como pagado');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          paymentId: paymentData.paymentId,
        }),
      });

      if (response.ok) {
        alert('Pago marcado como pagado');
        setPaymentData(prev => ({ ...prev, paymentId: '' }));
      } else {
        alert('Error al marcar pago como pagado');
      }
    } catch (error) {
      alert('Error al marcar pago como pagado');
    } finally {
      setLoading(false);
    }
  };

  const generateStripeCheckout = async () => {
    if (!tenantSlug || !stripeData.leadId || !stripeData.amountCents) {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          leadId: stripeData.leadId,
          amountCents: stripeData.amountCents,
          currency: stripeData.currency,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        // Abrir Stripe Checkout en nueva pestaña
        window.open(url, '_blank');
        alert('Checkout de Stripe generado. Revisa la nueva pestaña.');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert('Error al generar checkout de Stripe');
    } finally {
      setLoading(false);
    }
  };

  const changeLeadStatus = async () => {
    if (!tenantSlug || !statusData.leadId) {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/leads/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          leadId: statusData.leadId,
          status: statusData.status,
          lostReason: statusData.lostReason || undefined,
        }),
      });

      if (response.ok) {
        alert('Estado del lead cambiado exitosamente');
        setStatusData({ leadId: '', status: 'contacted', lostReason: '' });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert('Error al cambiar estado del lead');
    } finally {
      setLoading(false);
    }
  };

  if (!tenantSlug) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Playground</h1>
          <p className="text-gray-600 mb-4">Necesitas configurar tu negocio primero</p>
          <a 
            href="/onboarding" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ir a configuración
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Playground</h1>
          <p className="text-gray-600">
            Este playground es de desarrollo; no envía WhatsApp ni cobra, solo simula flujos
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Tenant: <strong>{tenantSlug}</strong>
          </p>
          <p className="text-sm text-blue-600 mt-2">
            💡 El estado también cambia automáticamente cuando creas una cita (→booked) y cuando marcas un pago como pagado (→paid).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo - Acciones */}
          <div className="space-y-6">
            {/* Crear Lead */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Crear Lead</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre del lead"
                  value={leadData.name}
                  onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (+52...)"
                  value={leadData.phone}
                  onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={createLead}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Crear Lead
                </button>
              </div>
            </div>

            {/* Estado Lead */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Estado Lead</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="ID del lead"
                  value={statusData.leadId}
                  onChange={(e) => setStatusData(prev => ({ ...prev, leadId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={statusData.status}
                  onChange={(e) => setStatusData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="contacted">Contactado</option>
                  <option value="booked">Agendado</option>
                  <option value="paid">Pagado</option>
                  <option value="lost">Perdido</option>
                </select>
                {statusData.status === 'lost' && (
                  <input
                    type="text"
                    placeholder="Razón de pérdida (opcional)"
                    value={statusData.lostReason}
                    onChange={(e) => setStatusData(prev => ({ ...prev, lostReason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                )}
                <button
                  onClick={changeLeadStatus}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  Cambiar Estado
                </button>
              </div>
            </div>

            {/* Crear Cita */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Crear Cita</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="ID del lead (opcional)"
                  value={bookingData.leadId}
                  onChange={(e) => setBookingData(prev => ({ ...prev, leadId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="datetime-local"
                  value={bookingData.startsAt}
                  onChange={(e) => setBookingData(prev => ({ ...prev, startsAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={bookingData.durationMin}
                  onChange={(e) => setBookingData(prev => ({ ...prev, durationMin: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
                <button
                  onClick={createBooking}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Crear Cita
                </button>
              </div>
            </div>

            {/* Crear Pago */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Crear Pago</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="ID del lead (opcional)"
                  value={paymentData.leadId}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, leadId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Monto en centavos"
                  value={paymentData.amountCents}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amountCents: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={createPayment}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  Crear Pago
                </button>
                <button
                  onClick={markPaymentPaid}
                  disabled={loading || !paymentData.paymentId}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Marcar Pagado
                </button>
              </div>
            </div>

            {/* Stripe Checkout */}
            <div className="bg-white p-6 rounded-lg shadow border-2 border-purple-200">
              <h2 className="text-lg font-semibold mb-4">💳 Stripe Checkout (Pago Real)</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="ID del lead"
                  value={stripeData.leadId}
                  onChange={(e) => setStripeData(prev => ({ ...prev, leadId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Monto en centavos (ej: 49900 = $499.00)"
                  value={stripeData.amountCents}
                  onChange={(e) => setStripeData(prev => ({ ...prev, amountCents: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={stripeData.currency}
                  onChange={(e) => setStripeData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="MXN">MXN (Pesos)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
                <button
                  onClick={generateStripeCheckout}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  💳 Generar Checkout
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Usa tarjeta de prueba: 4242 4242 4242 4242
                </p>
              </div>
            </div>
          </div>

          {/* Panel derecho - Logs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Logs en tiempo real</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay logs aún. Crea algunos leads, citas o pagos para ver la actividad.
                </p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{log.action}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Actor: {log.actor}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

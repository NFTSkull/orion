'use client';

import Link from 'next/link';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Pago Cancelado
        </h1>
        
        <p className="text-gray-600 mb-6">
          El proceso de pago ha sido cancelado. 
          No se ha realizado ningún cargo a tu cuenta.
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/playground"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reintentar Pago
          </Link>
          
          <div>
            <Link 
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Volver al Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

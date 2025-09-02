'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatToE164 } from '@/lib/phone';

interface OnboardingData {
  name: string;
  slug: string;
  industry: string;
  phoneE164: string;
  openingHours: string;
  slotMinutes: number;
  templatePack: string;
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    slug: '',
    industry: '',
    phoneE164: '',
    openingHours: '09:00-18:00',
    slotMinutes: 30,
    templatePack: 'clinica',
  });

  const handleInputChange = (field: keyof OnboardingData, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step === 3) {
      // Crear tenant
      try {
        const response = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            slug: data.slug,
            industry: data.industry,
            phoneE164: formatToE164(data.phoneE164),
            settings: {
              openingHours: data.openingHours,
              slotMinutes: data.slotMinutes,
              templatePack: data.templatePack,
            },
          }),
        });

        if (response.ok) {
          // Guardar cookie y redirigir
          document.cookie = `orion_tenant=${data.slug}; path=/`;
          router.push('/dashboard');
        } else {
          alert('Error al crear el negocio');
        }
      } catch (error) {
        alert('Error al crear el negocio');
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return data.name && data.slug && data.industry;
      case 2:
        return data.openingHours && data.slotMinutes;
      case 3:
        return data.templatePack;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configura tu negocio</h1>
          <p className="text-gray-600">Paso {step} de 3</p>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Datos del negocio</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del negocio
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Clínica Dental ABC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL única
              </label>
              <input
                type="text"
                value={data.slug}
                onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="clinica-dental-abc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industria
              </label>
              <select
                value={data.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una industria</option>
                <option value="clinica">Clínica médica</option>
                <option value="estetica">Estética y belleza</option>
                <option value="gym">Gimnasio</option>
                <option value="inmobiliaria">Inmobiliaria</option>
                <option value="consultoria">Consultoría</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={data.phoneE164}
                onChange={(e) => handleInputChange('phoneE164', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+52 55 1234 5678"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Horarios y disponibilidad</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horario de atención
              </label>
              <input
                type="text"
                value={data.openingHours}
                onChange={(e) => handleInputChange('openingHours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="09:00-18:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración de citas (minutos)
              </label>
              <select
                value={data.slotMinutes}
                onChange={(e) => handleInputChange('slotMinutes', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Plantillas de mensajes</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecciona un paquete
              </label>
              <select
                value={data.templatePack}
                onChange={(e) => handleInputChange('templatePack', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="clinica">Clínica médica</option>
                <option value="estetica">Estética y belleza</option>
                <option value="gym">Gimnasio</option>
                <option value="inmobiliaria">Inmobiliaria</option>
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Paquete {data.templatePack}:</strong> Incluye mensajes automáticos 
                personalizados para tu industria, respuestas rápidas y seguimiento de citas.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Atrás
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 3 ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}

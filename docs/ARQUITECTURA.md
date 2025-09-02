# ORION - Arquitectura

## Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Database      │
│   Next.js 14    │◄──►│   Next.js API   │◄──►│   Supabase      │
│   TypeScript    │    │   TypeScript    │    │   PostgreSQL    │
│   Tailwind CSS  │    │   Zod Validation│    │   RLS Policies  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Outbox/Logs   │
                       │   Supabase      │
                       │   Action Log    │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   External      │    │   Future        │
                       │   Integrations  │    │   Integrations  │
                       │   WhatsApp API  │    │   Stripe        │
                       │   (Future)      │    │   Make.com      │
                       └─────────────────┘    └─────────────────┘
```

## Capas del Sistema

### 1. UI Layer (Frontend)
- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para styling
- **Componentes reutilizables** y responsive

### 2. API Layer (Backend)
- **Next.js API Routes** para endpoints
- **Zod** para validación de esquemas
- **Supabase Client** para operaciones DB
- **Middleware** para autenticación y logging

### 3. Database Layer
- **Supabase** como BaaS
- **PostgreSQL** como base de datos
- **Row Level Security (RLS)** para multi-tenancy
- **Índices optimizados** para consultas frecuentes

### 4. Outbox/Logs Layer
- **Action Log** para auditoría completa
- **Outbox Pattern** para operaciones asíncronas
- **Retry Logic** para resiliencia
- **Event Sourcing** para trazabilidad

## Principios de Diseño

- **Multi-tenancy** con aislamiento completo por tenant
- **Event-driven** para desacoplamiento
- **Idempotencia** para operaciones críticas
- **Observabilidad** con logging extensivo
- **Escalabilidad** horizontal

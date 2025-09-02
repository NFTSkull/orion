# ORION - API Contratos

## Endpoints Implementados (B1C)

### Gestión de Tenants
- `POST /api/tenants` - Crear nuevo tenant
  - **Request**: `{ name, slug, industry?, phoneE164?, settings? }`
  - **Response**: `Tenant` object
  - **Log**: `{ actor: 'user:dev', action: 'create_tenant' }`
  - **Persistencia**: Base de datos Supabase

- `GET /api/tenants/[slug]` - Obtener tenant por slug
  - **Response**: `Tenant` object o 404
  - **Persistencia**: Base de datos Supabase

### Gestión de Leads
- `POST /api/leads` - Crear nuevo lead
  - **Request**: `{ tenantSlug, name?, phoneE164, source?, meta? }`
  - **Response**: `Lead` object (status: 'new')
  - **Log**: `{ action: 'create_lead', ref_id: leadId, details: payload }`
  - **Persistencia**: Base de datos Supabase

- `POST /api/leads/status` - Cambiar estado del lead
  - **Request**: `{ tenantSlug, leadId, status, lostReason? }`
  - **Response**: `{ ok: true }`
  - **Log**: `{ action: 'lead_status_change', ref_id: leadId, details: { from, to, lostReason? } }`
  - **Validación**: Transiciones de estado permitidas
  - **Errores**: 422 si transición inválida, 404 si lead no encontrado
  - **Persistencia**: Base de datos Supabase

### Gestión de Citas
- `POST /api/bookings` - Crear nueva cita
  - **Request**: `{ tenantSlug, leadId?, startsAt, durationMin }`
  - **Response**: `Booking` object
  - **Log**: `{ action: 'create_booking', ref_id: bookingId, details: payload }`
  - **Autopromoción**: Si hay leadId, promueve estado a 'booked' si está en 'new' o 'contacted'
  - **Persistencia**: Base de datos Supabase

### Gestión de Pagos
- `POST /api/payments` - Crear nuevo pago
  - **Request**: `{ tenantSlug, leadId?, amountCents, currency? }`
  - **Response**: `Payment` object (status: 'pending')
  - **Log**: `{ action: 'create_payment', ref_id: paymentId, details: payload }`
  - **Persistencia**: Base de datos Supabase

- `POST /api/payments/mark-paid` - Marcar pago como pagado
  - **Request**: `{ tenantSlug, paymentId }`
  - **Response**: `{ success: true }`
  - **Log**: `{ action: 'payment_paid', ref_id: paymentId }`
  - **Autopromoción**: Si hay leadId, promueve estado a 'paid' si no está en 'lost' ni ya 'paid'
  - **Persistencia**: Base de datos Supabase

- `POST /api/payments/stripe` - Generar checkout de Stripe
  - **Request**: `{ tenantSlug, leadId, amountCents, currency? }`
  - **Response**: `{ url: string }` (URL de Stripe Checkout)
  - **Log**: `{ action: 'stripe_checkout_created', ref_id: paymentId, details: { sessionId } }`
  - **Idempotencia**: Usa `Idempotency-Key` basado en payment.id
  - **Persistencia**: Crea payment con status='pending', provider='stripe', provider_ref=session.id

### Métricas y Reportes
- `GET /api/metrics?tenantSlug=...` - Obtener métricas del tenant
  - **Response**: `{
    leadsWeek, bookingsWeek, paidAmountWeekMXN,
    conversionPct, latestBookings, latestPayments
  }`
  - **Definición semana**: Lunes 00:00 a domingo 23:59:59 (TZ local)
  - **Conversión estricta**: Leads creados esta semana con ≥1 payment 'paid' en esta semana
  - **Persistencia**: Base de datos Supabase

### Utilidades
- `GET /api/health` - Health check del sistema
  - **Response**: `{ ok: true }`

## Endpoints Planificados (Futuros)

### Gestión de Leads
- `GET /api/leads` - Listar leads del tenant
- `GET /api/leads/[id]` - Obtener lead específico
- `PUT /api/leads/[id]` - Actualizar lead
- `DELETE /api/leads/[id]` - Eliminar lead

### Gestión de Citas
- `GET /api/bookings` - Listar citas del tenant
- `GET /api/bookings/[id]` - Obtener cita específica
- `PUT /api/bookings/[id]` - Actualizar cita
- `DELETE /api/bookings/[id]` - Cancelar cita

### Gestión de Pagos
- `GET /api/payments` - Listar pagos del tenant
- `GET /api/payments/[id]` - Obtener pago específico
- `PUT /api/payments/[id]` - Actualizar estado de pago

### Webhooks
- `POST /api/webhooks/stripe` - Webhook de Stripe
  - **Eventos**: `checkout.session.completed`, `payment_intent.succeeded`
  - **Verificación**: Firma de Stripe con `STRIPE_WEBHOOK_SECRET`
  - **Acciones**: Marca payment como 'paid', autopromueve lead a 'paid'
  - **Log**: `{ action: 'payment_paid', ref_id: paymentId, details: { sessionId, eventType } }`
  - **Idempotencia**: Verifica payment.status antes de procesar
- `POST /api/webhooks/whatsapp` - Webhook de WhatsApp

### Outbox y Automatización
- `GET /api/outbox/render?id=...` - Renderizar mensaje de outbox
  - **Query**: `id` (UUID del item de outbox)
  - **Response**: `{ to: string|null, text: string, target: string, payload: object }`
  - **Funcionalidad**: Compone texto y teléfono para envío
  - **Sin autenticación**: Solo composición de contenido

- `POST /api/outbox/lease` - Obtener items para procesar
  - **Headers**: `x-cron-token` (requerido)
  - **Body**: `{ max?: number }` (default: 10)
  - **Response**: `{ leaseId: string, items: Array<{id, tenantId, target, payload}> }`
  - **Funcionalidad**: Selecciona items pendientes y los marca como 'processing'
  - **Lease**: 2 minutos de exclusividad

- `POST /api/outbox/complete` - Completar procesamiento
  - **Headers**: `x-cron-token` (requerido)
  - **Body**: `{ leaseId: string, results: Array<{id, ok, error?}> }`
  - **Response**: `{ success: true }`
  - **Funcionalidad**: Actualiza status y intentos, log de resultados
  - **Retry**: Hasta 5 intentos antes de marcar como 'failed'

### Digest y Reportes
- `GET /api/digest/weekly?tenantSlug=...` - Digest semanal
  - **Query**: `tenantSlug` (requerido)
  - **Response**: `{ businessName, weekRange, leadsWeek, bookingsWeek, paidAmountWeekMXN, conversionPct, message }`
  - **Funcionalidad**: Métricas de la semana con mensaje renderizado
  - **Mensaje**: Formato optimizado para WhatsApp

### Métricas y Reportes
- `GET /api/metrics/leads` - Métricas específicas de leads
- `GET /api/metrics/conversion` - Métricas de conversión
- `GET /api/metrics/revenue` - Métricas de ingresos

## Esquemas de Validación

Todos los endpoints utilizan **Zod** para validación de esquemas:

### CreateTenantSchema
```typescript
{
  name: string (required),
  slug: string (required, regex: /^[a-z0-9-]+$/),
  industry?: string,
  phoneE164?: string,
  settings?: {
    openingHours?: string,
    slotMinutes?: number,
    templatePack?: string
  }
}
```

### CreateLeadSchema
```typescript
{
  tenantSlug: string (required),
  name?: string,
  phoneE164: string (regex E.164),
  source?: string,
  meta?: Record<string, unknown>
}
```

### CreateBookingSchema
```typescript
{
  tenantSlug: string (required),
  leadId?: string,
  startsAt: string (ISO datetime),
  durationMin: number (15|30|45|60)
}
```

### CreatePaymentSchema
```typescript
{
  tenantSlug: string (required),
  leadId?: string,
  amountCents: number (positive integer),
  currency?: string (default: 'MXN')
}
```

### ChangeLeadStatusSchema
```typescript
{
  tenantSlug: string (required, min: 2),
  leadId: string (required, UUID),
  status: 'new' | 'contacted' | 'booked' | 'paid' | 'lost',
  lostReason?: string (min: 2, max: 200, solo si status='lost')
}
```

## Estados de Lead

### Estados Disponibles
- `new` - Lead recién creado
- `contacted` - Lead contactado
- `booked` - Lead con cita agendada
- `paid` - Lead con pago completado
- `lost` - Lead perdido

### Reglas de Transición
- `new` → `contacted` | `lost`
- `contacted` → `booked` | `lost`
- `booked` → `paid` | `lost`
- `paid` y `lost` son estados terminales (no pueden cambiar)

### Autopromoción
- **Crear cita**: Si lead está en `new` o `contacted` → promueve a `booked`
- **Marcar pago pagado**: Si lead no está en `lost` ni ya `paid` → promueve a `paid`

## Autenticación y Autorización

- **Multi-tenancy** con aislamiento por tenant
- **Tenant resolution** a partir de `tenantSlug`
- **Cookie-based session** (`orion_tenant`)
- **Row Level Security (RLS)** habilitado en Supabase
- **Service Role Key** para operaciones server-side

## Logging y Auditoría

- **Action Log** en todos los endpoints
- **Trazabilidad** completa de operaciones
- **Métricas** de rendimiento
- **Alertas** para errores críticos
- **Persistencia** en base de datos Supabase

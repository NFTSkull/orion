## [Unreleased]

## [0.6.0] - 2024-12-19

### Added
- **B3-n8n implementado**: Sistema de outbox y automatización
- Helpers de tiempo: `minusMinutes()`, `isWithinNextMinutes()`
- Templates de mensajes: `renderReminderMessage()`, `renderWeeklyDigest()`
- Endpoint de render: `GET /api/outbox/render` para componer mensajes
- Endpoints de outbox: `POST /api/outbox/lease`, `POST /api/outbox/complete`
- Digest semanal: `GET /api/digest/weekly` con métricas y mensaje
- Programación automática de recordatorios en `createBooking()`
- Protección por token `CRON_TOKEN` para endpoints críticos
- Sistema de lease para evitar procesamiento duplicado
- Logging detallado de eventos de outbox

### Technical
- Función `minusMinutes()` para calcular fechas pasadas
- Función `isWithinNextMinutes()` para verificar proximidad temporal
- Templates con formato optimizado para WhatsApp
- Sistema de lease con exclusividad de 2 minutos
- Retry logic con máximo 5 intentos antes de fallar
- Idempotencia en programación de recordatorios
- Validación de token con `x-cron-token` header

### Database
- Campo `reminders_scheduled` en tabla bookings
- Tabla `outbox` con campos: status, attempt, lease_id, lease_until, run_at
- Logging de eventos: `booking_reminders_scheduled`, `outbox_sent`, `outbox_failed`
- Índices optimizados para consultas por status y run_at

### API Endpoints
- `GET /api/outbox/render` - Renderizar mensaje de outbox
- `POST /api/outbox/lease` - Obtener items para procesar (protegido por token)
- `POST /api/outbox/complete` - Completar procesamiento (protegido por token)
- `GET /api/digest/weekly` - Digest semanal con métricas y mensaje
- Validación de entrada con Zod schemas
- Manejo de errores robusto para todos los endpoints

### UI/UX
- Mensajes de recordatorio con formato profesional
- Digest semanal con métricas visuales y mensaje optimizado
- Templates en español con emojis y formato claro
- Mensajes adaptativos según performance (excelente/bueno/mejorar)

### Security
- Protección por token para endpoints de outbox
- Validación de lease para evitar procesamiento duplicado
- Headers requeridos: `x-cron-token`
- Variables de entorno para configuración segura

### Testing
- Verificación manual con CRON_TOKEN
- Tests de flujo completo: booking → outbox → lease → render → complete
- Validación de idempotencia y lease system
- Verificación de templates y digest semanal

## [0.5.0] - 2024-12-19

### Added
- **B2 implementado**: Pagos reales con Stripe Checkout
- Integración completa con Stripe para procesamiento de pagos
- Cliente Stripe configurado con API v2024-06-20
- Endpoint `POST /api/payments/stripe` para generar checkout sessions
- Webhook `POST /api/webhooks/stripe` con verificación de firma
- Páginas de success/cancel para flujo de Stripe
- Idempotencia en llamadas a Stripe usando payment.id
- Autopromoción automática de lead a 'paid' en webhook
- Integración en playground con botón "Generar Checkout"
- Logging detallado de eventos de Stripe

### Technical
- Función `getStripe()` para inicializar cliente Stripe
- Helpers `buildCheckoutSessionParams()` y `makeIdempotencyKey()`
- Verificación de firma de webhook con `STRIPE_WEBHOOK_SECRET`
- Manejo de eventos: checkout.session.completed, payment_intent.succeeded
- Búsqueda de payment por provider_ref (session.id) en webhook
- Actualización de payment.status y autopromoción de lead
- Manejo de errores robusto para Stripe y base de datos

### Database
- Campo `provider_ref` en tabla payments para almacenar session.id
- Método `updatePaymentProviderRef()` en IStore interface
- Implementación en supabaseStore y memoryStore
- Logging de eventos stripe_checkout_created y payment_paid

### API Endpoints
- `POST /api/payments/stripe` - Generar checkout de Stripe
- `POST /api/webhooks/stripe` - Webhook de Stripe con verificación
- Validación de entrada con Zod schemas
- Respuestas JSON con URLs de checkout
- Manejo de errores: 400 para datos inválidos, 500 para errores internos

### UI/UX
- Nueva sección "Stripe Checkout (Pago Real)" en playground
- Botón "Generar Checkout" que abre Stripe en nueva pestaña
- Páginas de success y cancel con mensajes apropiados
- Selector de moneda (MXN/USD) en playground
- Instrucciones para tarjetas de prueba
- Integración visual con borde morado para distinguir pagos reales

### Security
- Verificación de firma de webhook de Stripe
- Variables de entorno para claves secretas
- Idempotencia para prevenir cargos duplicados
- Validación de datos de entrada con Zod
- Logging de errores sin exponer información sensible

### Testing
- Verificación manual con Stripe CLI
- Tests de flujo completo: checkout → pago → webhook → dashboard
- Validación de idempotencia y autopromoción
- Verificación de métricas actualizadas post-pago
- Tests de páginas success/cancel

## [0.4.0] - 2024-12-19

### Added
- **B1C implementado**: Estados de lead y métricas estrictas
- Estados de lead: new, contacted, booked, paid, lost
- Reglas de transición de estado con validación estricta
- Autopromoción automática de estado en bookings y payments
- Métricas estrictas de conversión por semana (solo pagos pagados en la misma semana)
- Endpoint `POST /api/leads/status` para cambio manual de estado
- Campos adicionales: last_status_change, lost_reason en tabla leads
- Índices de base de datos para optimizar consultas por estado
- Tests unitarios para transiciones de estado y métricas estrictas
- Sección "Estado Lead" en playground para cambio manual

### Technical
- Función `canTransition()` para validar transiciones de estado
- Autopromoción en `createBooking()`: new/contacted → booked
- Autopromoción en `markPaymentPaid()`: cualquier estado → paid (excepto lost/paid)
- Métricas estrictas: solo cuenta leads con pagos pagados en la semana actual
- Validación de transiciones con errores específicos (422)
- Logging detallado de cambios de estado con from/to
- Mapeo de campos adicionales en Supabase (last_status_change, lost_reason)

### Database
- Patch SQL para agregar campos a tabla leads
- Índices optimizados: idx_leads_tenant_status, idx_payments_tenant_status_created
- Campo `last_status_change` con timestamp automático
- Campo `lost_reason` opcional para leads perdidos
- Actualización automática de last_status_change en cambios de estado

### API Endpoints
- `POST /api/leads/status` - Cambiar estado de lead manualmente
- Validación de transiciones de estado en endpoint
- Errores específicos: 422 para transiciones inválidas, 404 para lead no encontrado
- Logging automático de cambios de estado con detalles

### UI/UX
- Nueva sección "Estado Lead" en playground
- Selector de estado con opciones: contacted, booked, paid, lost
- Campo opcional de razón de pérdida para estado 'lost'
- Mensaje informativo sobre autopromoción automática
- Validación en tiempo real de transiciones permitidas

### Testing
- Tests unitarios para todas las transiciones de estado
- Tests de métricas estrictas con casos edge
- Validación de autopromoción en bookings y payments
- Tests de casos inválidos y estados terminales
- Cobertura completa de reglas de negocio

## [0.3.0] - 2024-12-19

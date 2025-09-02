## 2024-12-19 - Bloque 1C: Estados de Lead y Métricas Estrictas

### Decisiones Técnicas

**1. Estados de Lead**
- **Decisión**: 5 estados: new, contacted, booked, paid, lost
- **Razón**: Cubrir todo el funnel de ventas de manera granular
- **Implementación**: Enum TypeScript con validación Zod
- **Beneficio**: Trazabilidad completa del proceso de venta

**2. Reglas de Transición**
- **Decisión**: Transiciones estrictas con validación
- **Razón**: Prevenir estados inconsistentes y mantener integridad
- **Implementación**: Función `canTransition()` con reglas explícitas
- **Beneficio**: Validación automática en API y tests

**3. Autopromoción Automática**
- **Decisión**: Promoción automática en bookings y payments
- **Razón**: Reducir trabajo manual y mantener consistencia
- **Implementación**: Lógica integrada en createBooking y markPaymentPaid
- **Beneficio**: UX mejorada con menos clicks necesarios

**4. Métricas Estrictas**
- **Decisión**: Conversión basada solo en pagos pagados de la misma semana
- **Razón**: Métricas más precisas y accionables
- **Implementación**: Filtrado estricto por fecha de creación
- **Beneficio**: KPIs más confiables para toma de decisiones

**5. Campos Adicionales**
- **Decisión**: last_status_change y lost_reason en tabla leads
- **Razón**: Trazabilidad y análisis de pérdidas
- **Implementación**: Campos opcionales con índices optimizados
- **Beneficio**: Insights para mejorar conversión

### Implementación

**Validación de Transiciones**
- Función `canTransition()` con reglas explícitas
- Estados terminales (paid, lost) no pueden cambiar
- Validación en endpoint `/api/leads/status`
- Errores específicos para transiciones inválidas

**Autopromoción**
- En `createBooking()`: promueve new/contacted → booked
- En `markPaymentPaid()`: promueve cualquier estado → paid (excepto lost/paid)
- Lógica no bloqueante (try/catch para no romper flujo principal)
- Logging detallado de autopromociones

**Métricas Estrictas**
- Filtrado por semana actual (lunes a domingo)
- Solo cuenta leads con pagos pagados en la misma semana
- Conversión = (leads con pagos pagados) / (total leads de la semana)
- TOP 10 para latestBookings y latestPayments

**Base de Datos**
- Patch SQL para agregar campos a tabla leads
- Índices optimizados para consultas por estado
- Campo last_status_change con timestamp automático
- Campo lost_reason opcional para análisis

### Lecciones Aprendidas

**1. Estados de Lead**
- 5 estados son suficientes para la mayoría de casos
- Estados terminales son importantes para prevenir cambios accidentales
- Validación estricta previene inconsistencias

**2. Autopromoción**
- Muy útil para UX pero puede ser confusa
- Documentar claramente en UI
- Considerar opción de deshabilitar para casos especiales

**3. Métricas Estrictas**
- Métricas más precisas requieren más lógica
- Importante documentar qué se cuenta y qué no
- Considerar cache para métricas calculadas frecuentemente

**4. Validación de Transiciones**
- Reglas explícitas son más mantenibles que implícitas
- Tests unitarios son esenciales para validar reglas
- Considerar visualización de funnel para análisis

### Próximos Pasos

**1. Análisis de Funnel**
- Dashboard con visualización de conversión por etapa
- Métricas de tiempo entre estados
- Análisis de razones de pérdida

**2. Optimizaciones**
- Cache para métricas calculadas
- Índices adicionales para consultas complejas
- Paginación para listas grandes

**3. UX Mejorada**
- Visualización de estado actual en UI
- Historial de cambios de estado
- Notificaciones de autopromoción

**4. Testing**
- Tests de integración para autopromoción
- Tests de rendimiento para métricas
- Tests de casos edge en transiciones

## 2024-12-19 - Bloque B2: Pagos Reales con Stripe

### Decisiones Técnicas

**1. Integración con Stripe**
- **Decisión**: Usar Stripe Checkout para simplicidad y seguridad
- **Razón**: Stripe maneja PCI compliance y UX optimizada
- **Implementación**: Cliente Stripe con API v2024-06-20
- **Beneficio**: Menos código, más seguridad, mejor UX

**2. Idempotencia**
- **Decisión**: Usar Idempotency-Key basado en payment.id
- **Razón**: Prevenir cargos duplicados en caso de reintentos
- **Implementación**: `makeIdempotencyKey()` con prefijo 'orion:checkout:'
- **Beneficio**: Seguridad financiera y confiabilidad

**3. Webhook con Verificación**
- **Decisión**: Verificar firma de webhook con STRIPE_WEBHOOK_SECRET
- **Razón**: Seguridad crítica para confirmar pagos reales
- **Implementación**: `stripe.webhooks.constructEvent()` con raw body
- **Beneficio**: Prevenir ataques de replay y falsificación

**4. Autopromoción en Webhook**
- **Decisión**: Promover lead a 'paid' automáticamente en webhook
- **Razón**: Mantener consistencia entre pago y estado del lead
- **Implementación**: Lógica integrada en webhook handler
- **Beneficio**: UX fluida sin intervención manual

**5. Páginas de Success/Cancel**
- **Decisión**: Páginas separadas para mejor UX
- **Razón**: Confirmación clara del resultado del pago
- **Implementación**: Páginas estáticas con mensajes apropiados
- **Beneficio**: Menor confusión y mejor retención

### Implementación

**Cliente Stripe**
- Función `getStripe()` con validación de STRIPE_SECRET_KEY
- API version 2024-06-20 para compatibilidad
- Error handling para clave faltante

**Checkout Session**
- Helper `buildCheckoutSessionParams()` para configuración consistente
- Metadata con tenantSlug y leadId para trazabilidad
- URLs de success/cancel usando NEXT_PUBLIC_BASE_URL
- Mode 'payment' para pagos únicos

**Webhook Handler**
- Lectura de raw body con `req.text()`
- Verificación de firma con `stripe.webhooks.constructEvent()`
- Manejo de eventos: checkout.session.completed, payment_intent.succeeded
- Búsqueda de payment por provider_ref (session.id)
- Actualización de status y autopromoción de lead

**Base de Datos**
- Campo `provider_ref` en tabla payments para session.id
- Método `updatePaymentProviderRef()` en IStore interface
- Implementación en supabaseStore y memoryStore
- Logging de eventos stripe_checkout_created y payment_paid

**UI/UX**
- Nueva sección en playground con borde morado
- Botón "Generar Checkout" que abre Stripe en nueva pestaña
- Páginas de success y cancel con mensajes apropiados
- Selector de moneda (MXN/USD)
- Instrucciones para tarjetas de prueba

### Lecciones Aprendidas

**1. Seguridad de Webhooks**
- Verificación de firma es crítica
- Raw body es necesario para verificación
- Error handling debe ser robusto

**2. Idempotencia**
- Importante para operaciones financieras
- Basar en ID interno del sistema
- Documentar claramente el comportamiento

**3. UX de Pagos**
- Páginas de confirmación son importantes
- Instrucciones claras para testing
- Feedback inmediato del resultado

**4. Integración con Estado**
- Autopromoción debe ser consistente
- Logging detallado para debugging
- Manejo de errores no debe romper flujo

### Próximos Pasos

**1. Testing Completo**
- Tests de integración con Stripe Test Mode
- Validación de webhooks con Stripe CLI
- Tests de edge cases y errores

**2. Monitoreo**
- Logging de eventos de Stripe
- Métricas de conversión de checkout
- Alertas para webhook failures

**3. UX Mejorada**
- Loading states durante checkout
- Mejor feedback de errores
- Integración con notificaciones

**4. Optimizaciones**
- Cache de configuración de Stripe
- Retry logic para webhook failures
- Métricas de performance de checkout

## 2024-12-19 - Bloque B3-n8n: Outbox y Automatización

### Decisiones Técnicas

**1. Sistema de Outbox**
- **Decisión**: Implementar outbox para mensajes programados
- **Razón**: Separar composición de envío, permitir reintentos y monitoreo
- **Implementación**: Tabla outbox con status, attempt, lease_id, run_at
- **Beneficio**: Confiabilidad y trazabilidad de mensajes

**2. Protección por Token**
- **Decisión**: Usar CRON_TOKEN para endpoints críticos
- **Razón**: Seguridad para endpoints que modifican estado del sistema
- **Implementación**: Header `x-cron-token` requerido
- **Beneficio**: Prevenir acceso no autorizado a automatización

**3. Sistema de Lease**
- **Decisión**: Lease de 2 minutos para evitar duplicados
- **Razón**: Prevenir procesamiento simultáneo del mismo item
- **Implementación**: lease_id y lease_until en tabla outbox
- **Beneficio**: Consistencia en procesamiento distribuido

**4. Templates de Mensajes**
- **Decisión**: Templates separados para diferentes tipos de mensaje
- **Razón**: Flexibilidad y mantenibilidad del contenido
- **Implementación**: Funciones renderReminderMessage y renderWeeklyDigest
- **Beneficio**: Consistencia y fácil personalización

**5. Programación Automática**
- **Decisión**: Programar recordatorios al crear booking
- **Razón**: Automatizar flujo completo sin intervención manual
- **Implementación**: Lógica integrada en createBooking
- **Beneficio**: UX fluida y menos errores humanos

### Implementación

**Helpers de Tiempo**
- `minusMinutes()` para calcular fechas pasadas
- `isWithinNextMinutes()` para verificar proximidad temporal
- Funciones utilitarias para manejo de fechas ISO

**Templates de Mensajes**
- `renderReminderMessage()` con datos de booking y lead
- `renderWeeklyDigest()` con métricas de la semana
- Formato optimizado para WhatsApp con emojis
- Mensajes adaptativos según performance

**Endpoints de Outbox**
- `GET /api/outbox/render` para composición de mensajes
- `POST /api/outbox/lease` para obtener items (protegido)
- `POST /api/outbox/complete` para reportar resultados (protegido)
- Validación de token en endpoints críticos

**Programación de Recordatorios**
- Lógica integrada en `createBooking()`
- Programación de recordatorios 24h y 1h antes
- Idempotencia con campo `reminders_scheduled`
- Logging de eventos de programación

**Digest Semanal**
- `GET /api/digest/weekly` con métricas de la semana
- Cálculo de conversión estricta
- Mensaje renderizado con formato optimizado
- Métricas consistentes con `/api/metrics`

### Lecciones Aprendidas

**1. Sistema de Outbox**
- Separar composición de envío es muy útil
- Lease system previene problemas de concurrencia
- Retry logic es esencial para confiabilidad

**2. Protección por Token**
- Endpoints críticos deben estar protegidos
- Token simple pero efectivo para automatización
- Headers son más seguros que query params

**3. Templates de Mensajes**
- Templates separados son más mantenibles
- Formato optimizado mejora engagement
- Mensajes adaptativos son más efectivos

**4. Programación Automática**
- Integrar en flujo principal mejora UX
- Idempotencia es crítica para confiabilidad
- Logging detallado facilita debugging

**5. Digest Semanal**
- Métricas consistentes son importantes
- Formato optimizado para el canal
- Mensajes adaptativos mejoran engagement

### Próximos Pasos

**1. Integración con WhatsApp**
- Implementar envío real de mensajes
- Webhook para confirmación de entrega
- Métricas de delivery y engagement

**2. Optimizaciones**
- Cache para templates frecuentes
- Batch processing para outbox
- Métricas de performance de envío

**3. Personalización**
- Templates configurables por tenant
- Horarios de recordatorio personalizables
- Contenido adaptativo según lead

**4. Monitoreo**
- Dashboard de outbox status
- Alertas para fallos de envío
- Métricas de engagement por mensaje

## 2024-12-19 - Bloque 1B: Migración a Supabase y Persistencia

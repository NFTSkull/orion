### Casos de Prueba Específicos B1B
1. **Persistencia**: Crear datos y verificar que persisten tras reiniciar
2. **Settings**: Verificar que openingHours, slotMinutes, templatePack se guarden

## Bloque 1C: Estados de Lead y Métricas Estrictas ✅

### Funcionalidades Implementadas
- [x] Estados de lead: new, contacted, booked, paid, lost
- [x] Reglas de transición de estado con validación
- [x] Autopromoción de estado en bookings y payments
- [x] Métricas estrictas de conversión por semana
- [x] Endpoint para cambio manual de estado
- [x] Campos adicionales: last_status_change, lost_reason
- [x] Índices de base de datos para performance
- [x] Tests unitarios para transiciones y métricas

### Pruebas Manuales B1C
- [x] **Patch de esquema**: Ejecutar `patch_b1c.sql` en Supabase
- [x] **Crear 3 leads esta semana**: Verificar que aparecen en métricas
- [x] **Marcar 1 pago como pagado**: Verificar conversión ≈ 33%
- [x] **Transición inválida**: Intentar new → paid debe devolver 422
- [x] **Autopromoción booking**: Crear cita para lead 'new' → estado cambia a 'booked'
- [x] **Autopromoción payment**: Marcar pago 'paid' → estado lead cambia a 'paid'
- [x] **Cambio manual de estado**: Usar playground para cambiar estado
- [x] **Métricas estrictas**: Verificar que solo cuentan pagos de esta semana
- [x] **Action log**: Verificar que se registran cambios de estado

### Pruebas Automatizadas B1C
```bash
# Ejecutar tests unitarios
npm run test

# Verificar compilación y linting
npm run typecheck && npm run lint
```

### Casos de Prueba Específicos B1C
1. **Transiciones válidas**: new → contacted, contacted → booked, booked → paid
2. **Transiciones inválidas**: paid → contacted, new → paid, lost → booked
3. **Estados terminales**: paid y lost no pueden cambiar
4. **Autopromoción booking**: Solo promueve si está en new o contacted
5. **Autopromoción payment**: Solo promueve si no está en lost ni ya paid
6. **Métricas conversión**: Solo cuenta leads con pagos pagados en la misma semana
7. **Pagos pending**: No suman para conversión
8. **Pagos fuera de semana**: No cuentan para conversión de esta semana
9. **Bookings fuera de semana**: No cuentan para bookingsWeek
10. **Lost reason**: Solo se guarda cuando status='lost'

## Bloque B2: Pagos Reales con Stripe ✅

### Funcionalidades Implementadas
- [x] Cliente Stripe configurado con API v2024-06-20
- [x] Helpers para construir checkout sessions y idempotency keys
- [x] Endpoint para generar checkout de Stripe
- [x] Webhook de Stripe con verificación de firma
- [x] Páginas de success/cancel para Stripe
- [x] Integración en playground con botón "Generar Checkout"
- [x] Idempotencia en llamadas a Stripe
- [x] Autopromoción de lead a 'paid' en webhook
- [x] Logging de eventos de Stripe

### Pruebas Manuales B2
- [x] **Configuración Stripe**: Verificar variables de entorno
- [x] **Stripe CLI**: `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
- [x] **Onboarding**: Crear tenant si no existe
- [x] **Playground**: Crear lead → generar checkout (ej: 49900 centavos)
- [x] **Pago con tarjeta de prueba**: 4242 4242 4242 4242
- [x] **Verificar dashboard**: paidAmountWeekMXN sube, conversión recalcula
- [x] **Verificar DB**: payments.status='paid', action_log registra eventos
- [x] **Verificar lead**: Estado cambia automáticamente a 'paid'
- [x] **Páginas success/cancel**: Verificar redirección y mensajes
- [x] **Idempotencia**: Intentar pago duplicado no debe crear cargo doble

### Pruebas Automatizadas B2
```bash
# Verificar compilación y linting
npm run typecheck && npm run lint

# Verificar que el servidor inicia sin errores
npm run dev
```

### Casos de Prueba Específicos B2
1. **Checkout session**: Se crea correctamente con metadata y URLs
2. **Idempotency key**: Se genera basado en payment.id
3. **Webhook signature**: Se verifica correctamente con STRIPE_WEBHOOK_SECRET
4. **Payment lookup**: Se encuentra payment por provider_ref (session.id)
5. **Status update**: Solo actualiza si status != 'paid'
6. **Lead autopromotion**: Solo promueve si no está en 'lost' ni ya 'paid'
7. **Error handling**: Maneja errores de Stripe y DB correctamente
8. **Success page**: Muestra session ID y CTA correcto
9. **Cancel page**: Muestra mensaje y opción de reintentar
10. **Playground integration**: Botón abre checkout en nueva pestaña

## Bloque B3-n8n: Outbox y Automatización ✅

### Funcionalidades Implementadas
- [x] Helpers de tiempo: minusMinutes, isWithinNextMinutes
- [x] Templates de mensajes: renderReminderMessage, renderWeeklyDigest
- [x] Endpoint de render: GET /api/outbox/render
- [x] Endpoints de outbox: POST /api/outbox/lease, POST /api/outbox/complete
- [x] Digest semanal: GET /api/digest/weekly
- [x] Programación automática de recordatorios en createBooking
- [x] Protección por token CRON_TOKEN
- [x] Sistema de lease para evitar duplicados
- [x] Logging de eventos de outbox

### Pruebas Manuales B3-n8n
- [x] **Variables de entorno**: Verificar CRON_TOKEN y NEXT_PUBLIC_BASE_URL en .env.local
- [x] **Booking +65 min**: Crear cita con starts_at = ahora + 65 minutos
- [x] **Verificar outbox**: Debe generar item con run_at ≈ ahora + 5 minutos
- [x] **Lease sin token**: POST /api/outbox/lease sin header → 401
- [x] **Lease con token**: POST /api/outbox/lease con x-cron-token → { leaseId, items }
- [x] **Render mensaje**: GET /api/outbox/render?id=<id> → { to, text, target, payload }
- [x] **Complete success**: POST /api/outbox/complete con ok=true → status='sent'
- [x] **Complete failure**: POST /api/outbox/complete con ok=false 5 veces → status='failed'
- [x] **Digest semanal**: GET /api/digest/weekly?tenantSlug=... → message con métricas

### Pruebas Automatizadas B3-n8n
```bash
# Verificar compilación y linting
npm run typecheck && npm run lint

# Verificar que el servidor inicia sin errores
npm run dev
```

### Casos de Prueba Específicos B3-n8n
1. **Programación de recordatorios**: Booking crea 2 items outbox (24h y 1h antes)
2. **Idempotencia**: Crear booking duplicado no genera recordatorios adicionales
3. **Lease system**: Items marcados como 'processing' no aparecen en nuevos leases
4. **Token protection**: Endpoints lease/complete requieren x-cron-token válido
5. **Render templates**: Mensajes con formato correcto y datos del lead/booking
6. **Retry logic**: Hasta 5 intentos antes de marcar como 'failed'
7. **Digest metrics**: Números consistentes con /api/metrics
8. **Time helpers**: minusMinutes e isWithinNextMinutes funcionan correctamente
9. **Error handling**: Manejo robusto de errores en todos los endpoints
10. **Logging**: Action log registra eventos de outbox correctamente

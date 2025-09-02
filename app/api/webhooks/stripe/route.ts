import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getStore } from '@/lib/store';
import { getServiceClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    const store = getStore();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const sessionId = session.id;
        const metadata = session.metadata;
        
        // Buscar payment por provider_ref usando Supabase directamente
        const supabase = (store as any).supabase || getServiceClient();
        const { data: payment, error } = await supabase
          .from('payments')
          .select('*')
          .eq('provider_ref', sessionId)
          .single();
        
        if (payment && payment.status !== 'paid') {
          // Actualizar payment a paid
          await store.markPaymentPaid(payment.id);
          
          // Log del webhook
          await store.appendLog({
            tenantId: payment.tenant_id,
            actor: 'stripe:webhook',
            action: 'payment_paid',
            refType: 'payment',
            refId: payment.id,
            details: { sessionId, eventType: event.type, metadata },
          });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        // Fallback por si llega primero que checkout.session.completed
        const paymentIntent = event.data.object as any;
        console.log('Payment intent succeeded:', paymentIntent.id);
        // Aquí podríamos buscar por payment_intent_id si lo guardamos
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    
    if (error.message.includes('Invalid signature')) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}

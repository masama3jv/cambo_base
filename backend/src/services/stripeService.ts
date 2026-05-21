import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SK;
if (!stripeKey) {
  console.warn('STRIPE_SECRET_KEY not set — Stripe payments will fail');
}

let stripe: any = null;
if (stripeKey) {
  stripe = new Stripe(stripeKey, { apiVersion: '2025-03-31.basil' as any });
}

export function getStripe(): any {
  if (!stripe) throw new Error('Stripe not configured: set STRIPE_SECRET_KEY');
  return stripe;
}

export async function createPaymentIntent(amount: number, teamId: number) {
  const s = getStripe();
  return s.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'eur',
    metadata: { teamId: String(teamId) },
    automatic_payment_methods: { enabled: true },
  });
}

export async function getPaymentIntent(id: string) {
  const s = getStripe();
  return s.paymentIntents.retrieve(id);
}

export function constructWebhookEvent(payload: Buffer, signature: string) {
  const s = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WH;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not set');
  return s.webhooks.constructEvent(payload, signature, webhookSecret);
}
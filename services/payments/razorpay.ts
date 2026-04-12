import Razorpay from 'razorpay';

type RazorpayOrder = {
  id: string;
  amount: number; // smallest unit (minor)
  currency: string;
  receipt?: string;
};

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number; // smallest unit (minor)
  currency: string;
};

/**
 * Production client: real Razorpay SDK
 * Test client: in-memory mock (no external calls) when RAZORPAY_MOCK=true
 */
const useMock = process.env.RAZORPAY_MOCK === 'true';

// Next.js dev mode can reload route modules between requests, which would
// otherwise wipe this module-level mock state. Keep it in globalThis so
// create-order and verify-payment can share the same seeded data.
const mockState = (globalThis as any).__RAZORPAY_MOCK_STATE__ ||
  ((globalThis as any).__RAZORPAY_MOCK_STATE__ = {
    ordersById: new Map<string, { amount: number; currency: string; receipt?: string }>(),
    paymentsById: new Map<string, { order_id: string; amount: number; currency: string }>(),
  });

const ordersById = mockState.ordersById as Map<string, { amount: number; currency: string; receipt?: string }>;
const paymentsById = mockState.paymentsById as Map<string, { order_id: string; amount: number; currency: string }>;

function makeOrderId(receipt?: string) {
  const r = (receipt || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '');
  return `order_mock_${r}_${Date.now()}`;
}

export const __razorpayMock = {
  reset() {
    ordersById.clear();
    paymentsById.clear();
  },
  /**
   * Seed a mock payment entity for payments.fetch(paymentId).
   */
  setPayment(paymentId: string, payment: { orderId: string; amount: number; currency: string }) {
    paymentsById.set(paymentId, { order_id: payment.orderId, amount: payment.amount, currency: payment.currency });
  },
  /**
   * Seed a mock order entity for orders.create return mapping.
   */
  setOrder(orderId: string, order: { amount: number; currency: string; receipt?: string }) {
    ordersById.set(orderId, { amount: order.amount, currency: order.currency, receipt: order.receipt });
  },
};

export const razorpay = useMock
  ? ({
      orders: {
        async create(options: any): Promise<RazorpayOrder> {
          const orderId = makeOrderId(options?.receipt);
          ordersById.set(orderId, { amount: options?.amount ?? 0, currency: String(options?.currency ?? 'INR'), receipt: options?.receipt });
          return {
            id: orderId,
            amount: options?.amount ?? 0,
            currency: String(options?.currency ?? 'INR'),
            receipt: options?.receipt,
          };
        },
      },
      payments: {
        async fetch(paymentId: string): Promise<RazorpayPayment> {
          const seeded = paymentsById.get(paymentId);
          if (seeded) {
            return {
              id: paymentId,
              order_id: seeded.order_id,
              amount: seeded.amount,
              currency: seeded.currency,
            };
          }

          // Deterministic fallback: if paymentId contains an order id, resolve from ordersById.
          // e.g. paymentId = "pay_mock_for_<orderId>"
          const marker = 'for_';
          const idx = paymentId.indexOf(marker);
          if (idx >= 0) {
            const possibleOrderId = paymentId.slice(idx + marker.length);
            const orderFromId = ordersById.get(possibleOrderId);
            if (orderFromId) {
              return {
                id: paymentId,
                order_id: possibleOrderId,
                amount: orderFromId.amount,
                currency: orderFromId.currency,
              };
            }
          }

          // Fallback deterministic values if test forgot to seed.
          const orderFallback = Array.from(ordersById.entries())[0];
          const order = orderFallback
            ? orderFallback[1]
            : {
                amount: Number(process.env.RAZORPAY_MOCK_AMOUNT_MINOR || 0),
                currency: String(process.env.RAZORPAY_MOCK_CURRENCY || 'INR'),
                receipt: undefined,
              };
          const orderId = orderFallback ? orderFallback[0] : 'order_mock_fallback';

          const amount = order.amount;
          const currency = order.currency;
          return {
            id: paymentId,
            order_id: orderId,
            amount,
            currency,
          };
        },
      },
    } as any)
  : new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_51Gz8P3G8J8J8J',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret',
    });

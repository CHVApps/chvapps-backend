import crypto from 'node:crypto';

class RazorpayService {
  constructor({ keyId, keySecret } = {}) {
    this.keyId = keyId || process.env.RAZORPAY_KEY_ID;
    this.keySecret = keySecret || process.env.RAZORPAY_KEY_SECRET;
    this.baseUrl = 'https://api.razorpay.com/v1';
  }

  async createOrder({ amountPaise, currency = 'INR', receipt, notes = {} }) {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: Number(amountPaise),
        currency,
        receipt: receipt || String(Date.now()),
        payment_capture: 1,
        notes
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.description || 'Failed to create Razorpay order');
    }

    return data;
  }

  verifyPaymentSignature({ orderId, paymentId, signature }) {
    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  }

  verifyWebhookSignature({ bodyRaw, signature, secret }) {
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyRaw)
      .digest('hex');

    return generatedSignature === signature;
  }
}

export default RazorpayService;
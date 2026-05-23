export interface MidtransTransactionDetails {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  finishUrl?: string;
}

export async function createMidtransTransaction({
  orderId,
  grossAmount,
  customerName,
  customerPhone,
  serviceName,
  finishUrl,
}: MidtransTransactionDetails) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!serverKey) {
    console.warn('Midtrans Server Key is not set. Skipping Midtrans integration.');
    return { token: null, redirectUrl: null };
  }

  const baseUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  // Base64 encode the Server Key for Basic Authentication (password is empty string)
  const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`;

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(grossAmount),
    },
    credit_card: {
      secure: true,
    },
    customer_details: {
      first_name: customerName,
      phone: customerPhone || undefined,
    },
    item_details: [
      {
        id: 'laundry-service',
        price: Math.round(grossAmount),
        quantity: 1,
        name: serviceName,
      },
    ],
  };

  if (finishUrl) {
    (payload as any).callbacks = {
      finish: finishUrl,
    };
  }

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Midtrans API Error Response:', errorText);
      throw new Error(`Midtrans API responded with status ${response.status}`);
    }

    const data = await response.json();
    return {
      token: data.token as string,
      redirectUrl: data.redirect_url as string,
    };
  } catch (error) {
    console.error('Failed to create Midtrans transaction:', error);
    return { token: null, redirectUrl: null };
  }
}

export async function checkMidtransStatus(orderId: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!serverKey) {
    return null;
  }

  const baseUrl = isProduction
    ? `https://api.midtrans.com/v2/${orderId}/status`
    : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

  const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`;

  try {
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
         return null;
      }
      throw new Error(`Midtrans API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to check Midtrans status:', error);
    return null;
  }
}

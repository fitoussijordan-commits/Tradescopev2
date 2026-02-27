import { ensurePlans } from '@/lib/paypal';
import { NextResponse } from 'next/server';

// Cache plans in memory to avoid re-creating
let cachedPlans = null;

export async function GET() {
  try {
    if (!cachedPlans) {
      cachedPlans = await ensurePlans();
    }
    return NextResponse.json(cachedPlans);
  } catch (error) {
    console.error('PayPal plans error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

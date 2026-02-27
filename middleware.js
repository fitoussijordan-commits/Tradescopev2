import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value; },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Pages publiques
  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/callback', '/cgv'];
  if (publicPaths.includes(path)) {
    if (user && (path === '/auth/login' || path === '/auth/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  // API routes publiques
  if (path.startsWith('/api/paypal/webhook') || path.startsWith('/api/cron') || path.startsWith('/api/emails')) {
    return response;
  }

  // Tout le reste nécessite une connexion
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Vérifier l'abonnement pour les routes dashboard
  if (path.startsWith('/dashboard') || path.startsWith('/trades') ||
      path.startsWith('/payouts') || path.startsWith('/statistics') ||
      path.startsWith('/global-stats') || path.startsWith('/playbook')) {

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single();

    const isActive = profile?.subscription_status === 'active';
    const isTrialing = profile?.subscription_status === 'trialing' &&
                       profile?.trial_ends_at &&
                       new Date(profile.trial_ends_at) > new Date();

    if (!isActive && !isTrialing) {
      return NextResponse.redirect(new URL('/account?expired=true', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};

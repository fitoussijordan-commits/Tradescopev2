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
  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/callback'];
  if (publicPaths.includes(path)) {
    // Si connecté et va sur login/register, rediriger vers dashboard
    if (user && (path === '/auth/login' || path === '/auth/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  // API routes publiques
  if (path.startsWith('/api/stripe/webhook')) {
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
      .select('plan, subscription_status')
      .eq('id', user.id)
      .single();

    const hasAccess = profile?.subscription_status === 'active' || 
                      profile?.subscription_status === 'trialing';

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};

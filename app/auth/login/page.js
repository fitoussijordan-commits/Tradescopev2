'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <AuthLayout title="Bon retour" subtitle="Connecte-toi à ton journal de trading.">
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl text-sm bg-loss-dim text-loss border border-loss/20">{error}</div>
        )}

        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@email.com"
            autoComplete="email"
            required
            className="field"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="field"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <p className="text-center text-txt-2 text-sm pt-2">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-accent font-medium hover:underline">S'inscrire</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

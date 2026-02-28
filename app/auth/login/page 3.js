'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-400 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-accent-glow">
              TS
            </div>
            <span className="font-display font-bold text-xl tracking-tight">TradeScope</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Bon retour</h1>
          <p className="text-txt-2 text-sm">Connecte-toi à ton journal de trading</p>
        </div>

        <form onSubmit={handleLogin} className="bg-bg-card border border-brd rounded-xl p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm bg-loss-dim text-loss">{error}</div>
          )}

          <div>
            <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@email.com"
              required
              className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm text-txt-1 placeholder:text-txt-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-dim transition-all"
            />
          </div>

          <div>
            <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-sm text-txt-1 placeholder:text-txt-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-dim transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all shadow-lg shadow-accent-glow disabled:opacity-50 text-sm"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-center text-txt-2 text-xs">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-accent hover:underline">S'inscrire</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

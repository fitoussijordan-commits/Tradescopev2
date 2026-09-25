'use client';
import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback?plan=${plan}` },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.session) {
      window.location.href = '/account';
    } else { setError('Vérifie ta boîte mail pour confirmer ton compte !'); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {error && <div className={`p-3 rounded-xl text-sm border ${error.includes('Vérifie') ? 'bg-profit-dim text-profit border-profit/20' : 'bg-loss-dim text-loss border-loss/20'}`}>{error}</div>}
      <div>
        <label className="field-label" htmlFor="fullName">Nom complet</label>
        <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ton nom" autoComplete="name" required className="field" />
      </div>
      <div>
        <label className="field-label" htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@email.com" autoComplete="email" required className="field" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Mot de passe</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6 caractères minimum" autoComplete="new-password" required minLength={6} className="field" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full !py-3">{loading ? 'Création…' : 'Créer mon compte'}</button>
      <p className="text-center text-txt-3 text-xs">Sans carte bancaire · Annulation en 1 clic</p>
      <p className="text-center text-txt-2 text-sm pt-2">Déjà un compte ? <Link href="/auth/login" className="text-accent font-medium hover:underline">Se connecter</Link></p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <AuthLayout title="Créer un compte" subtitle="7 jours d'essai gratuit — aucun engagement.">
      <Suspense fallback={<div className="text-center text-txt-3">Chargement…</div>}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}

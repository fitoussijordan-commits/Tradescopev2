'use client';
import { useState } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('sent');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="bg-profit-dim border border-profit/20 rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <div className="font-bold text-profit mb-1">Message envoyé !</div>
        <div className="text-txt-2 text-sm">On te répond le plus vite possible.</div>
        <button onClick={() => setStatus(null)} className="mt-4 text-accent text-sm hover:underline">Envoyer un autre message</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-card border border-brd rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Nom</label>
          <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            placeholder="Jordan" className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base text-txt-1 placeholder:text-txt-3 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Email</label>
          <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            placeholder="jordan@email.com" className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base text-txt-1 placeholder:text-txt-3 focus:outline-none focus:border-accent" />
        </div>
      </div>
      <div>
        <label className="block text-[0.65rem] text-txt-3 font-bold uppercase tracking-wider font-mono mb-1.5">Message</label>
        <textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})}
          rows="4" placeholder="Ton message..." className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2.5 text-base text-txt-1 placeholder:text-txt-3 focus:outline-none focus:border-accent resize-none" />
      </div>
      {status === 'error' && <div className="text-loss text-sm bg-loss-dim p-3 rounded-lg">Erreur lors de l'envoi. Réessaie.</div>}
      <button type="submit" disabled={status === 'sending'}
        className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:opacity-90 shadow-lg shadow-accent-glow disabled:opacity-50 text-sm transition-all">
        {status === 'sending' ? 'Envoi en cours...' : 'Envoyer'}
      </button>
    </form>
  );
}

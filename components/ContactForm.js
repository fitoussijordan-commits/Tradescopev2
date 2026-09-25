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
      <div className="card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-profit-dim text-profit flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <div className="font-semibold mb-1">Message envoyé !</div>
        <div className="text-txt-2 text-sm">On te répond le plus vite possible.</div>
        <button onClick={() => setStatus(null)} className="mt-5 text-accent text-sm font-medium hover:underline">Envoyer un autre message</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Nom</label>
          <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            placeholder="Ton nom" className="field" />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            placeholder="toi@email.com" className="field" />
        </div>
      </div>
      <div>
        <label className="field-label">Message</label>
        <textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})}
          rows="4" placeholder="Ton message..." className="field resize-none" />
      </div>
      {status === 'error' && <div className="text-loss text-sm bg-loss-dim border border-loss/20 p-3 rounded-xl">Erreur lors de l'envoi. Réessaie.</div>}
      <button type="submit" disabled={status === 'sending'}
        className="btn-primary w-full !py-3">
        {status === 'sending' ? 'Envoi en cours…' : 'Envoyer'}
      </button>
    </form>
  );
}

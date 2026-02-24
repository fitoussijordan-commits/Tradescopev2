'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

const DEFAULT_COLORS = [
  '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899', 
  '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6' });

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const res = await fetch('/api/strategies');
      const data = await res.json();
      setStrategies(data);
      
      // Create default strategies if none exist
      if (data.length === 0) {
        await createDefaultStrategies();
        loadStrategies();
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultStrategies = async () => {
    const defaults = [
      { name: 'Breakout', description: 'Entrée sur cassure de résistance/support', color: '#10B981' },
      { name: 'Reversal', description: 'Retournement sur zones clés', color: '#EF4444' },
      { name: 'Scalp', description: 'Trades courts sous 5 minutes', color: '#8B5CF6' },
      { name: 'Swing', description: 'Trades de plusieurs heures/jours', color: '#F59E0B' },
    ];

    for (const strategy of defaults) {
      await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { id: editingId, ...form } : form;
      
      const res = await fetch('/api/strategies', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        await loadStrategies();
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur');
      }
    } catch (error) {
      alert('Erreur de connexion');
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', color: '#3B82F6' });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (strategy) => {
    setForm({
      name: strategy.name,
      description: strategy.description || '',
      color: strategy.color,
    });
    setEditingId(strategy.id);
    setShowForm(true);
  };

  const deleteStrategy = async (id, name) => {
    if (!confirm(`Supprimer la stratégie "${name}" ?`)) return;
    
    try {
      const res = await fetch(`/api/strategies?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadStrategies();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur');
      }
    } catch (error) {
      alert('Erreur de connexion');
    }
  };

  if (loading) return <div className="text-center py-20">Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Stratégies de Trading</h1>
          <p className="text-txt-2 text-sm">Organisez vos différentes approches de trading</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-all"
        >
          + Nouvelle Stratégie
        </button>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="bg-bg-card border border-brd rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: strategy.color }}
                />
                <div>
                  <div className="font-bold">{strategy.name}</div>
                  {strategy.description && (
                    <div className="text-txt-2 text-sm">{strategy.description}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(strategy)}
                  className="text-txt-3 hover:text-accent text-sm px-2 py-1 rounded"
                >
                  ✏
                </button>
                <button
                  onClick={() => deleteStrategy(strategy.id, strategy.name)}
                  className="text-txt-3 hover:text-loss text-sm px-2 py-1 rounded"
                >
                  ✗
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card border border-brd rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {editingId ? 'Modifier la Stratégie' : 'Nouvelle Stratégie'}
              </h3>
              <button onClick={resetForm} className="text-txt-3 hover:text-txt-1">✗</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
                  placeholder="Ex: Breakout"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description (optionnel)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full bg-bg-secondary border border-brd rounded-lg px-3 py-2 focus:outline-none focus:border-accent resize-none"
                  rows="2"
                  placeholder="Décrivez votre stratégie..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({...form, color})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.color === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-accent text-white py-2 rounded-lg font-semibold hover:opacity-90"
                >
                  {editingId ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-brd py-2 rounded-lg hover:bg-bg-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

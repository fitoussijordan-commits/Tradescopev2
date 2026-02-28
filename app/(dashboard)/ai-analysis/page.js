'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAccount } from '@/components/AccountContext';

const PROMPTS = [
  { label: 'Analyse globale', text: 'Analyse mes performances de trading en détail. Identifie mes forces, mes faiblesses, et donne-moi 3 actions concrètes pour m\'améliorer.' },
  { label: 'Meilleure stratégie', text: 'Quelle est ma stratégie la plus performante ? Pourquoi ? Que devrais-je faire pour maximiser mes résultats avec elle ?' },
  { label: 'Gestion du risque', text: 'Analyse ma gestion du risque. Mon R:R est-il cohérent ? Est-ce que je coupe mes pertes assez vite ? Que devrais-je améliorer ?' },
  { label: 'Patterns négatifs', text: 'Identifie mes patterns négatifs : jours difficiles, sessions où je perds, comportements récurrents qui me coûtent de l\'argent.' },
  { label: 'Plan d\'action', text: 'Basé sur mes stats, crée-moi un plan d\'action pour les 30 prochains jours pour améliorer mon trading.' },
];

export default function AIAnalysisPage() {
  const { currentAccountId, currentAccount } = useAccount();
  const [trades, setTrades] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
    const saved = localStorage.getItem('ts-gemini-key');
    if (saved) setApiKey(saved);
    else setShowKeyInput(true);
  }, [currentAccountId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: t }, sRes] = await Promise.all([
      supabase.from('trades').select('*').eq('user_id', user.id).eq('is_payout', false),
      fetch('/api/strategies'),
    ]);
    const s = await sRes.json();
    setTrades(t || []);
    setStrategies(Array.isArray(s) ? s : []);
    setLoading(false);
  };

  const saveKey = () => {
    localStorage.setItem('ts-gemini-key', apiKey);
    setShowKeyInput(false);
  };

  const buildContext = () => {
    const at = trades.filter(t => t.account_id === currentAccountId);
    if (at.length === 0) return 'Aucun trade enregistré.';

    const wins = at.filter(t => t.pnl > 0);
    const losses = at.filter(t => t.pnl < 0);
    const totalPnl = at.reduce((s, t) => s + parseFloat(t.pnl), 0);
    const winRate = ((wins.length / at.length) * 100).toFixed(1);
    const rrTrades = at.filter(t => t.rr != null);
    const avgRR = rrTrades.length > 0 ? (rrTrades.reduce((s, t) => s + parseFloat(t.rr), 0) / rrTrades.length).toFixed(2) : 'N/A';
    const grossWin = wins.reduce((s, t) => s + parseFloat(t.pnl), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + parseFloat(t.pnl), 0));
    const pf = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : 'N/A';

    // Stats par stratégie
    const stratStats = strategies.map(s => {
      const st = at.filter(t => t.strategy_id === s.id);
      if (st.length === 0) return null;
      const wr = ((st.filter(t => t.pnl > 0).length / st.length) * 100).toFixed(0);
      const pnl = st.reduce((sum, t) => sum + parseFloat(t.pnl), 0).toFixed(2);
      return `  - ${s.name}: ${st.length} trades, WR ${wr}%, P&L ${pnl}€`;
    }).filter(Boolean);

    // Perf par jour
    const dayNames = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const dayPnl = {};
    dayNames.forEach(d => dayPnl[d] = 0);
    at.forEach(t => { const di = new Date(t.date).getDay(); dayPnl[dayNames[di === 0 ? 6 : di - 1]] += parseFloat(t.pnl); });
    const dayStats = Object.entries(dayPnl).filter(([,v]) => v !== 0).map(([d,v]) => `${d}: ${v >= 0 ? '+' : ''}${v.toFixed(0)}€`).join(', ');

    // Sessions
    const london = at.filter(t => t.session === 'london');
    const us = at.filter(t => t.session === 'us');
    const londonWR = london.length > 0 ? ((london.filter(t => t.pnl > 0).length / london.length) * 100).toFixed(0) : 'N/A';
    const usWR = us.length > 0 ? ((us.filter(t => t.pnl > 0).length / us.length) * 100).toFixed(0) : 'N/A';

    return `
DONNÉES DE TRADING — ${currentAccount?.name || 'Compte'} (${currentAccount?.prop_firm || ''})
Capital de base: ${currentAccount?.base_capital || 'N/A'}€

RÉSUMÉ GLOBAL:
- Total trades: ${at.length} (${wins.length} wins, ${losses.length} losses)
- P&L Total: ${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}€
- Win Rate: ${winRate}%
- R:R Moyen: ${avgRR}R
- Profit Factor: ${pf}
- Trades avec stratégie respectée: ${at.filter(t => t.followed_strategy).length}/${at.length}

PAR STRATÉGIE:
${stratStats.length > 0 ? stratStats.join('\n') : '  Aucune stratégie définie'}
  - Hors stratégie: ${at.filter(t => !t.strategy_id).length} trades, P&L ${at.filter(t => !t.strategy_id).reduce((s,t) => s+parseFloat(t.pnl), 0).toFixed(2)}€

PAR JOUR:
${dayStats || 'Pas de données'}

PAR SESSION:
- Londres AM: ${london.length} trades, WR ${londonWR}%, P&L ${london.reduce((s,t) => s+parseFloat(t.pnl), 0).toFixed(2)}€
- US PM: ${us.length} trades, WR ${usWR}%, P&L ${us.reduce((s,t) => s+parseFloat(t.pnl), 0).toFixed(2)}€

INSTRUMENTS:
${[...new Set(at.map(t => t.instrument).filter(Boolean))].map(inst => {
  const instTrades = at.filter(t => t.instrument === inst);
  const instPnl = instTrades.reduce((s,t) => s+parseFloat(t.pnl), 0);
  const instWR = ((instTrades.filter(t => t.pnl > 0).length / instTrades.length) * 100).toFixed(0);
  return `  - ${inst}: ${instTrades.length} trades, WR ${instWR}%, P&L ${instPnl >= 0 ? '+' : ''}${instPnl.toFixed(2)}€`;
}).join('\n')}

5 DERNIERS TRADES:
${at.slice(0, 5).map(t => `  - ${t.date} | ${t.instrument} ${t.type} | P&L: ${parseFloat(t.pnl) >= 0 ? '+' : ''}${parseFloat(t.pnl).toFixed(2)}€ | RR: ${t.rr ? parseFloat(t.rr).toFixed(2) + 'R' : 'N/A'}`).join('\n')}
`.trim();
  };

  const sendMessage = async (text) => {
    if (!text.trim() || thinking) return;
    if (!apiKey) { setShowKeyInput(true); return; }

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setThinking(true);

    const context = buildContext();
    const systemPrompt = `Tu es un coach de trading expert qui analyse les performances d'un trader. Tu as accès à ses données réelles. Sois direct, précis et actionnable. Réponds en français. Utilise des données chiffrées de ses stats pour appuyer tes analyses. Formate ta réponse avec des sections claires.`;

    const conversationHistory = newMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    // Inject context in first user message
    if (conversationHistory.length === 1) {
      conversationHistory[0].parts[0].text = `${systemPrompt}\n\nVoici mes données de trading:\n\n${context}\n\nMa question: ${text}`;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: conversationHistory }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Erreur API Gemini');
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse.';
      setMessages([...newMessages, { role: 'model', content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'model', content: `❌ Erreur: ${err.message}` }]);
    } finally {
      setThinking(false);
    }
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^#{1,3} (.+)$/gm, '<div class="font-bold text-sm mt-3 mb-1 text-accent">$1</div>')
      .replace(/^- (.+)$/gm, '<div class="flex gap-2 text-sm"><span class="text-accent flex-shrink-0">▸</span><span>$1</span></div>')
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '<br/>');
  };

  if (loading) return <div className="text-center py-20 text-txt-3">Chargement...</div>;

  const atLen = trades.filter(t => t.account_id === currentAccountId).length;

  return (
    <div className="animate-fade-up max-w-4xl flex flex-col h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h2 className="font-display font-bold text-xl flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">✦</span> Analyse IA
          </h2>
          <p className="text-txt-3 text-sm mt-0.5">Gemini analyse tes {atLen} trades et te coache</p>
        </div>
        <button onClick={() => setShowKeyInput(!showKeyInput)} className="px-3 py-1.5 border border-brd text-txt-3 rounded-lg text-xs hover:border-accent hover:text-accent transition-all">
          {apiKey ? '🔑 Clé configurée' : '🔑 Configurer clé'}
        </button>
      </div>

      {/* API Key config */}
      {showKeyInput && (
        <div className="bg-bg-card border border-accent/30 rounded-xl p-4 mb-4 flex-shrink-0">
          <div className="text-sm font-semibold mb-2">Clé API Gemini</div>
          <p className="text-txt-3 text-xs mb-3">Obtiens ta clé gratuite sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-accent underline">aistudio.google.com</a></p>
          <div className="flex gap-2">
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..." className="flex-1 bg-bg-secondary border border-brd rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            <button onClick={saveKey} disabled={!apiKey} className="px-4 py-2 bg-accent text-white text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-40">Sauvegarder</button>
          </div>
          <p className="text-txt-3 text-[0.6rem] mt-2">La clé est stockée localement dans ton navigateur uniquement.</p>
        </div>
      )}

      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="flex-shrink-0 mb-4">
          <p className="text-txt-3 text-xs mb-2 font-mono uppercase tracking-wider">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p.text)}
                className="px-3 py-2 bg-bg-card border border-brd rounded-lg text-xs font-semibold text-txt-2 hover:border-accent hover:text-accent transition-all">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-16 text-txt-3">
            <div className="text-4xl mb-3 opacity-30">✦</div>
            <p className="font-semibold">Pose une question sur tes trades</p>
            <p className="text-xs mt-1">Gemini analysera tes données réelles pour te répondre</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'model' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">✦</div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-accent text-white rounded-br-sm'
                : 'bg-bg-card border border-brd rounded-bl-sm'
            }`}>
              {m.role === 'model'
                ? <div dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }} />
                : m.content
              }
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">✦</div>
            <div className="bg-bg-card border border-brd rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={apiKey ? "Pose une question sur tes performances..." : "Configure ta clé Gemini d'abord"}
            disabled={!apiKey || thinking}
            className="flex-1 bg-bg-card border border-brd rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || !apiKey || thinking}
            className="px-4 py-3 bg-accent text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all">
            ↑
          </button>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="text-txt-3 text-xs mt-2 hover:text-loss transition-colors">
            Effacer la conversation
          </button>
        )}
      </div>
    </div>
  );
}

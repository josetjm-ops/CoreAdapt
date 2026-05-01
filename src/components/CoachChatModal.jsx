import { useState, useRef, useEffect } from 'react';
import { X, Send, Brain } from 'lucide-react';

const TONO_COLOR = {
  energizante: 'var(--primary)',
  calmo: 'var(--secondary)',
  moderado: 'var(--amber, #FFBF00)',
  celebrativo: '#FFD700',
  reconectado: 'var(--secondary)',
  épico: 'var(--primary)',
  tapering: 'var(--amber, #FFBF00)',
};

const CoachChatModal = ({ onClose, userProfile, checkinHoy, sesionHoy, initialMessage }) => {
  const [messages, setMessages] = useState(
    initialMessage
      ? [{ role: 'coach', text: initialMessage }]
      : []
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);

    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/motivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          checkinHoy,
          sesionHoy,
          historialSemana: [],
          streakDias: 0,
          chatHistory: newMessages.slice(-5),
          preguntaUsuario: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'coach', text: data.mensaje, tono: data.tono }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'coach', text: 'Error de conexión. Intenta de nuevo.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', zIndex: 2000,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'var(--surface-low)', maxWidth: '480px', width: '100%', margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Brain size={20} color="var(--primary)" />
            <div>
              <p className="title-lg" style={{ fontWeight: '800', lineHeight: 1 }}>Coach Alpha</p>
              <p className="label-md" style={{ fontSize: '0.6rem', color: 'var(--on-surface-variant)' }}>CoreAdapt · IA Deportiva</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
            <X size={22} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginTop: '2rem' }}>
              Pregúntale al Coach lo que necesites sobre tu entrenamiento.
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '80%', padding: '0.875rem 1.25rem',
                borderRadius: msg.role === 'user' ? '1.25rem 1.25rem 0.25rem 1.25rem' : '0.25rem 1.25rem 1.25rem 1.25rem',
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-high)',
                color: msg.role === 'user' ? '#0a0a0a' : 'var(--on-surface)',
              }}>
                {msg.tono && (
                  <p style={{ fontSize: '0.55rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: TONO_COLOR[msg.tono] || 'var(--primary)', marginBottom: '0.3rem' }}>
                    {msg.tono}
                  </p>
                )}
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{msg.text}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div style={{ display: 'flex', gap: '4px', paddingLeft: '0.5rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: `pulse 1s ${i * 0.25}s infinite ease-in-out` }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '1rem 1.5rem 2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            rows={1}
            style={{ flex: 1, padding: '0.875rem', background: 'var(--surface-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', fontSize: '0.9rem', resize: 'none', fontFamily: 'inherit', outline: 'none' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-full)', background: 'var(--primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: !input.trim() || sending ? 0.5 : 1 }}
          >
            <Send size={18} color="#0a0a0a" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.4);opacity:1} }`}</style>
    </div>
  );
};

export default CoachChatModal;

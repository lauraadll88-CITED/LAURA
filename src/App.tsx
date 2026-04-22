/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';

const INITIAL_MESSAGE = `Informante detectado. Iniciando registro para la Guía Galáctica.\n\nEstoy analizando la temporalidad denominada "Historia Terrestre". Los registros indican que los humanos eliminaron a sus líderes para luego entregar el poder a un militar de corta estatura. Explique la lógica de este proceso desde una perspectiva de recursos y poder, no de sentimientos.`;

interface MessagePart {
  text: string;
}

interface Message {
  role: 'user' | 'bot' | 'model';
  parts: MessagePart[];
  isError?: boolean;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', parts: [{ text: INITIAL_MESSAGE }] }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const autoResizeInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = (scrollHeight < 150 ? scrollHeight : 150) + 'px';
      if (inputValue === '') {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const formatText = (text: string) => {
    const formatted = text
      .replace(/</g, "&lt;").replace(/>/g, "&gt;") // Sanitizar
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\n/g, "<br>");
    return { __html: formatted };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    const newHistory = [...messages, { role: 'user' as const, parts: [{ text: trimmedMessage }] }];
    setMessages(newHistory);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedMessage, history: newHistory })
      });

      if (!response.ok) throw new Error('Fallo en la comunicación subespacial');

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'bot', parts: [{ text: data.reply }] }]);
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'bot', 
          parts: [{ text: `[ALERTA DE SISTEMA] Interferencia detectada en el enlace con Xylanth-9. La red de la Guía Galáctica está temporalmente inaccesible. Verifique sus nodos de conexión e inténtelo de nuevo.` }],
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    autoResizeInput();
  };

  const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );

  return (
    <div className="terminal-grid relative bg-[#05080f] text-[#e2e8f0]">
      <div className="scanline"></div>
      
      {/* CABECERA */}
      <header className="col-span-full border-b border-slate-800 bg-[#0a0f18]/80 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-[#00f2fe] flex items-center justify-center rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest accent-text">XYLANTH-9</h1>
            <p className="text-[10px] mono opacity-50 uppercase tracking-[0.2em]">Red de Análisis: Historia Terrestre</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] opacity-40 mono">SESIÓN: X-9-8821</p>
            <p className="text-[10px] opacity-40 mono">LATENCIA: 14MS</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded">
            <div className="w-2 h-2 rounded-full bg-[#00f2fe] shadow-[0_0_8px_#00f2fe] animate-pulse"></div>
            <span className="text-[10px] mono font-bold accent-text hidden sm:inline">ENLACE ACTIVO</span>
          </div>
        </div>
      </header>

      {/* ÁREA IZQUIERDA */}
      <aside className="hidden lg:block border-r border-slate-800 p-5 bg-[#0a0f18]/40 overflow-y-auto">
        <div className="space-y-6">
          <section>
            <div>
              <p className="text-[10px] mono opacity-40 mb-2 uppercase">Módulos de Sistema</p>
              <div className="space-y-2">
                <div className="bg-slate-800/20 border border-[#00f2fe]/10 rounded p-3 flex justify-between items-center">
                  <span className="text-xs mono">Causalidad</span>
                  <span className="text-xs accent-text">94.2%</span>
                </div>
                <div className="bg-slate-800/20 border border-[#00f2fe]/10 rounded p-3 flex justify-between items-center">
                  <span className="text-xs mono">Temporalidad</span>
                  <span className="text-xs accent-text">READY</span>
                </div>
                <div className="bg-slate-800/20 border border-[#00f2fe]/10 rounded p-3 flex justify-between items-center">
                  <span className="text-xs mono">Ética Terrestre</span>
                  <span className="text-xs text-red-400">DISABLED</span>
                </div>
              </div>
            </div>
          </section>
          <section>
            <div>
              <p className="text-[10px] mono opacity-40 mb-2 uppercase">Nodos de Datos</p>
              <div className="h-40 border-l border-dashed border-cyan-900 ml-2 space-y-4 pt-2">
                <div className="relative pl-4">
                  <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-cyan-500"></div>
                  <p className="text-[11px] font-bold">Revolución Francesa</p>
                  <p className="text-[10px] opacity-50">ID: FR-1789</p>
                </div>
                <div className="relative pl-4">
                  <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full border border-cyan-500"></div>
                  <p className="text-[11px] font-bold">Imperio de Napoleón</p>
                  <p className="text-[10px] opacity-50">ID: FR-1804</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>

      {/* ÁREA DE CHAT */}
      <main id="chat-container" className="p-6 flex flex-col gap-5 overflow-y-auto bg-[radial-gradient(circle_at_50%_50%,#0a1428_0,#05080f_100%)] w-full relative z-10 scroll-smooth">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isError = msg.isError;
          return (
            <div key={index} className={`flex items-start gap-4 max-w-3xl msg-enter w-full ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
              {isUser ? (
                <>
                  <div className="w-8 h-8 shrink-0 bg-slate-700 flex items-center justify-center rounded text-[10px] font-bold">TU</div>
                  <div className="p-4 rounded-lg bg-blue-900/30 border border-blue-500/30 text-right">
                    <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={formatText(msg.parts[0].text)} />
                  </div>
                </>
              ) : (
                <>
                  <div className={`w-8 h-8 shrink-0 border border-cyan-500 bg-cyan-500/10 flex items-center justify-center rounded text-cyan-500`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className={`p-4 rounded-lg bg-slate-800/40 border ${isError ? 'border-red-500/50' : 'border-slate-700'}`}>
                    <p className={`text-sm leading-relaxed mono ${isError ? 'text-red-400' : ''}`} dangerouslySetInnerHTML={formatText(msg.parts[0].text)} />
                  </div>
                </>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-start gap-4 max-w-3xl msg-enter w-full">
            <div className={`w-8 h-8 shrink-0 border border-cyan-500 bg-cyan-500/10 flex items-center justify-center rounded text-cyan-500`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-[10px] mono accent-text uppercase tracking-widest opacity-70">Procesando Causalidad...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* ÁREA DERECHA */}
      <aside className="hidden lg:block border-l border-slate-800 p-5 bg-[#0a0f18]/40 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] mono opacity-40 mb-3 uppercase">Análisis de Telemetría</p>
            <div className="aspect-square w-full border border-slate-800 bg-slate-900/50 rounded flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-32 h-32 border border-cyan-500 rounded-full"></div>
                <div className="w-16 h-16 border border-cyan-500 rounded-full"></div>
                <div className="w-[1px] h-32 bg-cyan-500 rotate-45"></div>
              </div>
              <div className="text-center">
                <p className="text-[10px] mono accent-text">MAP_REF_TERRA</p>
                <p className="text-[8px] opacity-40">48.8566° N, 2.3522° E</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] mono opacity-40 mb-2 uppercase">Frecuencia Subespacial</p>
            <div className="flex items-end gap-[2px] h-12">
              <div className="w-1 bg-cyan-500/30" style={{ height: '40%' }}></div>
              <div className="w-1 bg-cyan-500/50" style={{ height: '70%' }}></div>
              <div className="w-1 bg-cyan-500" style={{ height: '90%' }}></div>
              <div className="w-1 bg-cyan-500/40" style={{ height: '30%' }}></div>
              <div className="w-1 bg-cyan-500/60" style={{ height: '50%' }}></div>
              <div className="w-1 bg-cyan-500" style={{ height: '100%' }}></div>
              <div className="w-1 bg-cyan-500/30" style={{ height: '20%' }}></div>
              <div className="w-1 bg-cyan-500/50" style={{ height: '60%' }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA DE INPUT */}
      <footer className="col-span-full border-t border-slate-800 bg-[#0a0f18] p-4 flex items-center gap-4 z-10 relative">
        <form onSubmit={handleSubmit} id="chat-form" className="flex items-end w-full gap-3 sm:gap-4 max-w-5xl mx-auto">
          <div className="w-6 h-6 shrink-0 border border-slate-700 hidden sm:flex items-center justify-center rounded text-[10px] mono text-slate-500 self-center">$</div>
          <div className="flex-1 relative">
            <textarea 
              ref={textareaRef}
              id="user-input" 
              rows={1}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="block w-full bg-transparent border-0 border-b border-slate-600 focus:border-cyan-500 focus:ring-0 p-2 resize-none text-slate-100 placeholder-slate-500 font-mono text-sm md:text-base outline-none transition-colors"
              placeholder="Transmite datos históricos al observador..."
              required
            />
          </div>
          <button 
            type="submit" 
            id="send-btn"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 self-center bg-cyan-500 text-slate-950 text-xs font-bold rounded uppercase tracking-tighter hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Transmitir</span>
            <span className="sm:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </span>
          </button>
        </form>
      </footer>
    </div>
  );
}

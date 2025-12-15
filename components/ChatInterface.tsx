import React, { useState, useEffect, useRef } from 'react';
import { generateChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const result = await generateChatResponse(history, userMsg.text, [], {
        useThinking,
        useSearch,
        useMaps,
        location
      });

      const text = result.text || '...';
      
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedUrls = groundingChunks.map((chunk: any) => {
        if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title };
        if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title };
        return null;
      }).filter(Boolean);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        groundingUrls: extractedUrls
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: 'Connection Error.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-zinc-950/80 p-5 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)]"></div>
            <h2 className="text-lg font-mono font-bold text-zinc-100 tracking-wider">NEXUS INTELLIGENCE</h2>
        </div>
        <div className="flex gap-4 text-xs font-medium">
            <button onClick={() => setUseThinking(!useThinking)} className={`px-3 py-1.5 rounded-full border transition ${useThinking ? 'bg-purple-900/40 border-purple-500 text-purple-300' : 'border-zinc-700 text-zinc-500'}`}>
                Thinking 2.0
            </button>
            <button onClick={() => { setUseSearch(!useSearch); setUseMaps(false); }} className={`px-3 py-1.5 rounded-full border transition ${useSearch ? 'bg-blue-900/40 border-blue-500 text-blue-300' : 'border-zinc-700 text-zinc-500'}`}>
                Web Access
            </button>
            <button onClick={() => { setUseMaps(!useMaps); setUseSearch(false); }} className={`px-3 py-1.5 rounded-full border transition ${useMaps ? 'bg-green-900/40 border-green-500 text-green-300' : 'border-zinc-700 text-zinc-500'}`}>
                Geo Data
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-zinc-950 to-zinc-900">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor" className="w-32 h-32 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
                </svg>
                <p className="font-mono text-sm tracking-widest uppercase">System Online. Awaiting Input.</p>
            </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-5 rounded-2xl border backdrop-blur-sm ${
              msg.role === 'user' 
                ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100 rounded-br-none' 
                : 'bg-teal-950/20 border-teal-900/30 text-zinc-200 rounded-bl-none shadow-[0_0_15px_rgba(20,184,166,0.05)]'
            }`}>
              <div className="whitespace-pre-wrap leading-7 text-[15px] font-light">{msg.text}</div>
              
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 grid gap-1">
                      {msg.groundingUrls.map((url, idx) => (
                          <a key={idx} href={url.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-teal-500 hover:text-teal-400 transition bg-black/20 p-2 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                              <span className="truncate opacity-80">{url.title || url.uri}</span>
                          </a>
                      ))}
                  </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-end">
                <div className="flex gap-1 items-center bg-teal-950/20 border border-teal-900/30 px-4 py-3 rounded-2xl rounded-bl-none">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-200"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-5 bg-zinc-950/90 border-t border-white/5 backdrop-blur-md">
        <div className="flex gap-3 relative">
            <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your command..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-light"
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-black px-6 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 rotate-180">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};
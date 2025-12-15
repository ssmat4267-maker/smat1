import React, { useState } from 'react';
import { AppMode } from './types';
import { ChatInterface } from './components/ChatInterface';
import { MediaGenerator } from './components/MediaGenerator';
import { VoiceAgent } from './components/VoiceAgent';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.Chat);

  return (
    <div className="flex h-screen w-full bg-black text-zinc-100 overflow-hidden font-sans relative">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[150px]"></div>
      </div>

      {/* Floating Navigation Dock */}
      <nav className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-8 glass-panel p-3 rounded-2xl shadow-2xl border border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-purple-600 flex items-center justify-center shadow-lg mb-4">
            <span className="font-bold text-black text-lg">N</span>
        </div>

        <div className="flex flex-col gap-4">
            <NavButton 
                active={mode === AppMode.Chat} 
                onClick={() => setMode(AppMode.Chat)} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />} 
                tooltip="Chat"
            />
            <NavButton 
                active={mode === AppMode.Image} 
                onClick={() => setMode(AppMode.Image)} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />}
                tooltip="Studio"
            />
            <NavButton 
                active={mode === AppMode.Voice} 
                onClick={() => setMode(AppMode.Voice)} 
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />} 
                tooltip="Voice"
            />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 ml-24 h-full p-6 z-10 relative">
        <div className="h-full w-full max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            {mode === AppMode.Chat && <ChatInterface />}
            {mode === AppMode.Image && <MediaGenerator />}
            {mode === AppMode.Voice && <VoiceAgent />}
        </div>
      </main>
    </div>
  );
};

// Nav Helper
const NavButton = ({ active, onClick, icon, tooltip }: { active: boolean, onClick: () => void, icon: React.ReactNode, tooltip: string }) => (
    <div className="group relative flex items-center">
        <button
            onClick={onClick}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                active 
                ? 'bg-zinc-100 text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                : 'text-zinc-500 hover:text-white hover:bg-white/10'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {icon}
            </svg>
        </button>
        {/* Tooltip */}
        <div className="absolute left-14 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap border border-zinc-700">
            {tooltip}
        </div>
    </div>
)

export default App;

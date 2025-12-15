import React, { useState } from 'react';
import { generateImage, generateVideo } from '../services/geminiService';
import { AspectRatio, ImageSize } from '../types';

export const MediaGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Premium State for Video
  const [isVideoUnlocked, setIsVideoUnlocked] = useState(false);

  // Image Configs
  const [modelType, setModelType] = useState<'flash' | 'pro'>('flash');
  const [ratio, setRatio] = useState<AspectRatio>("1:1");
  const [size, setSize] = useState<ImageSize>("1K");
  const [editImage, setEditImage] = useState<string | null>(null);

  // Video Configs
  const [videoRatio, setVideoRatio] = useState<"16:9" | "9:16">("16:9");
  const [videoQuality, setVideoQuality] = useState<'fast' | 'hq'>('fast'); // HQ = Veo 2
  const [videoImage, setVideoImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const data = base64.split(',')[1];
        if (type === 'image') setEditImage(data);
        else setVideoImage(data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnlockVideo = async () => {
      try {
          if (window.aistudio) {
              await window.aistudio.openSelectKey();
          }
          setIsVideoUnlocked(true);
      } catch (e) {
          console.error("Unlock failed", e);
      }
  };

  const handleGenerate = async () => {
    if (!prompt && activeTab === 'image') return;
    if (!prompt && !videoImage && activeTab === 'video') return;

    setIsLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      if (activeTab === 'image') {
        const base64 = await generateImage(prompt, {
            modelType,
            size: modelType === 'pro' ? size : undefined,
            ratio,
            refImage: editImage || undefined
        });

        if (base64) {
            setResultUrl(`data:image/jpeg;base64,${base64}`);
        } else {
            throw new Error("לא התקבלה תמונה");
        }
      } else {
        const url = await generateVideo(prompt, videoRatio, videoQuality, videoImage || undefined);
        setResultUrl(url);
      }
    } catch (err: any) {
      setError(err.message || "שגיאה ביצירת התוכן");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8 p-4 lg:p-8 overflow-y-auto">
      {/* Controls Panel */}
      <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-6">
        
        {/* Header Tabs */}
        <div className="glass-panel p-1 rounded-2xl flex relative overflow-hidden">
            <button 
                onClick={() => { setActiveTab('image'); setResultUrl(null); }}
                className={`flex-1 py-3 text-sm font-bold tracking-wide uppercase z-10 transition-all duration-300 ${activeTab === 'image' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}
            >
                Image Studio
            </button>
            <button 
                onClick={() => { setActiveTab('video'); setResultUrl(null); }}
                className={`flex-1 py-3 text-sm font-bold tracking-wide uppercase z-10 transition-all duration-300 ${activeTab === 'video' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}
            >
                Video Lab
            </button>
            
            {/* Sliding Indicator */}
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.5)] transition-transform duration-300 ${activeTab === 'video' ? 'translate-x-[calc(-100%-8px)] bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'translate-x-0'} right-1`}></div>
        </div>

        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5 border-t border-white/10 relative overflow-hidden">
            
            {/* PREMIUM LOCK OVERLAY FOR VIDEO */}
            {activeTab === 'video' && !isVideoUnlocked && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-black">
                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-wide">PREMIUM LOCKED</h3>
                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                        Veo video generation requires a premium subscription key.
                    </p>
                    <button 
                        onClick={handleUnlockVideo}
                        className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-yellow-500/20 hover:scale-105 transition-all transform"
                    >
                        Unlock Access $
                    </button>
                </div>
            )}

            {/* Prompt */}
            <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${activeTab === 'image' ? 'text-teal-400' : 'text-purple-400'}`}>
                    {activeTab === 'image' ? 'Image Prompt' : 'Video Prompt'}
                </label>
                <textarea 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={5}
                    className={`w-full bg-zinc-950/50 border rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:ring-1 focus:outline-none transition-all resize-none ${activeTab === 'image' ? 'border-zinc-700 focus:border-teal-500 focus:ring-teal-500' : 'border-zinc-700 focus:border-purple-500 focus:ring-purple-500'}`}
                    placeholder={activeTab === 'image' ? "A futuristic city made of glass and neon..." : "Cinematic drone shot of a waterfall..."}
                />
            </div>

            {/* Image Controls */}
            {activeTab === 'image' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                     <div className="flex gap-2 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800">
                        <button onClick={() => setModelType('flash')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${modelType === 'flash' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>Nano Banana 🍌</button>
                        <button onClick={() => setModelType('pro')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${modelType === 'pro' ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30' : 'text-zinc-500'}`}>Pro (High Res)</button>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Aspect Ratio</label>
                        <div className="grid grid-cols-5 gap-2">
                            {(["1:1", "3:4", "4:3", "9:16", "16:9"] as AspectRatio[]).map(r => (
                                <button 
                                    key={r} 
                                    onClick={() => setRatio(r)}
                                    className={`py-2 text-[10px] font-bold rounded-lg border transition ${ratio === r ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                     </div>

                     {modelType === 'pro' && (
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Resolution</label>
                            <div className="flex gap-2">
                                {(["1K", "2K", "4K"] as ImageSize[]).map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setSize(s)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${size === s ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                     )}

                     <div>
                         <label className="block w-full cursor-pointer group">
                             <div className={`p-3 rounded-xl border border-dashed transition flex items-center justify-center gap-3 ${editImage ? 'border-teal-500 bg-teal-900/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900'}`}>
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${editImage ? 'text-teal-400' : 'text-zinc-500'}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                 </svg>
                                 <span className={`text-xs font-medium ${editImage ? 'text-teal-400' : 'text-zinc-400'}`}>
                                     {editImage ? 'Reference Image Loaded' : 'Upload Reference Image'}
                                 </span>
                             </div>
                             <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'image')} />
                         </label>
                     </div>
                </div>
            )}

            {/* Video Controls */}
            {activeTab === 'video' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Aspect Ratio</label>
                            <div className="flex gap-2">
                                <button onClick={() => setVideoRatio("16:9")} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${videoRatio === "16:9" ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>16:9</button>
                                <button onClick={() => setVideoRatio("9:16")} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${videoRatio === "9:16" ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>9:16</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Model</label>
                            <div className="flex gap-2">
                                <button onClick={() => setVideoQuality("fast")} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${videoQuality === "fast" ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>Fast</button>
                                <button onClick={() => setVideoQuality("hq")} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${videoQuality === "hq" ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>Veo 2 (HQ)</button>
                            </div>
                        </div>
                    </div>
                     <div>
                         <label className="block w-full cursor-pointer group">
                             <div className={`p-3 rounded-xl border border-dashed transition flex items-center justify-center gap-3 ${videoImage ? 'border-purple-500 bg-purple-900/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900'}`}>
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${videoImage ? 'text-purple-400' : 'text-zinc-500'}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                 </svg>
                                 <span className={`text-xs font-medium ${videoImage ? 'text-purple-400' : 'text-zinc-400'}`}>
                                     {videoImage ? 'Start Frame Loaded' : 'Upload Start Frame'}
                                 </span>
                             </div>
                             <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'video')} />
                         </label>
                     </div>
                </div>
            )}

            <button 
                onClick={handleGenerate}
                disabled={isLoading || (activeTab === 'video' && !isVideoUnlocked)}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-black ${
                    activeTab === 'image' 
                    ? 'bg-teal-400 hover:bg-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.3)]' 
                    : 'bg-purple-400 hover:bg-purple-300 shadow-[0_0_20px_rgba(192,132,252,0.3)]'
                }`}
            >
                {isLoading ? 'Processing...' : 'Generate'}
            </button>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-xs text-center">
                    {error}
                </div>
            )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 glass-panel rounded-3xl p-1 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/30 to-black/50 z-0"></div>
        <div className="relative z-10 w-full h-full rounded-2xl bg-zinc-950/80 flex items-center justify-center overflow-hidden border border-zinc-800/50">
             {!resultUrl && !isLoading && (
                <div className="text-center opacity-30">
                    <h3 className="text-4xl font-light tracking-tighter text-white mb-2">NEXUS</h3>
                    <p className="text-sm font-mono text-teal-500 uppercase tracking-widest">
                        {activeTab === 'image' ? 'Visual Synthesis Ready' : 'Motion Engine Standby'}
                    </p>
                </div>
            )}
            
            {isLoading && (
                 <div className="text-center relative">
                     <div className="w-24 h-24 rounded-full border border-zinc-800 relative flex items-center justify-center">
                         <div className={`absolute inset-0 rounded-full border-t-2 animate-spin ${activeTab === 'image' ? 'border-teal-400' : 'border-purple-400'}`}></div>
                     </div>
                     <p className="mt-6 text-xs font-mono text-zinc-400 uppercase tracking-widest animate-pulse">
                         Generative Process Initiated
                     </p>
                 </div>
            )}

            {resultUrl && !isLoading && activeTab === 'image' && (
                <img src={resultUrl} alt="Generated" className="max-w-full max-h-full object-contain shadow-2xl" />
            )}

            {resultUrl && !isLoading && activeTab === 'video' && (
                <video controls autoPlay loop className="max-w-full max-h-full shadow-2xl">
                    <source src={resultUrl} type="video/mp4" />
                </video>
            )}
        </div>
      </div>
    </div>
  );
};
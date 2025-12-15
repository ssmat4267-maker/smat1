import React, { useRef, useState, useEffect } from 'react';
import { connectLiveSession, base64ToFloat32, arrayBufferToBase64 } from '../services/geminiService';

export const VoiceAgent: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("Standby Mode");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Visualizer
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startSession = async () => {
    try {
      setStatus("Initializing Link...");
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 64; // Smaller for blockier look
      analyserRef.current = analyser;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const { session, sendRealtimeInput } = await connectLiveSession(
        async (base64Audio) => {
            const float32Data = base64ToFloat32(base64Audio);
            const audioBuffer = outputCtx.createBuffer(1, float32Data.length, 24000);
            audioBuffer.getChannelData(0).set(float32Data);

            const sourceNode = outputCtx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(outputCtx.destination);
            sourceNode.connect(analyser);

            const currentTime = outputCtx.currentTime;
            if (nextStartTimeRef.current < currentTime) {
                nextStartTimeRef.current = currentTime;
            }
            
            sourceNode.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            
            sourcesRef.current.add(sourceNode);
            sourceNode.onended = () => {
                sourcesRef.current.delete(sourceNode);
            };
        },
        () => {
            stopSession();
        }
      );
      
      sessionRef.current = session;

      processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
             int16[i] = inputData[i] * 32768;
          }
          const base64Data = arrayBufferToBase64(int16.buffer);
          sendRealtimeInput({
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data
          });
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      setIsConnected(true);
      setStatus("Live Connection Established");
      drawVisualizer();

    } catch (err) {
      console.error(err);
      setStatus("Connection Failed");
      stopSession();
    }
  };

  const stopSession = () => {
    setIsConnected(false);
    setStatus("Disconnected");
    streamRef.current?.getTracks().forEach(t => t.stop());
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const drawVisualizer = () => {
      if (!canvasRef.current || !analyserRef.current || !isConnected) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if(!ctx) return;

      const draw = () => {
          if (!isConnected) return;
          requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const radius = 80;

          // Draw circle based on frequency
          ctx.beginPath();
          for(let i = 0; i < bufferLength; i++) {
              const v = dataArray[i];
              const angle = (i / bufferLength) * Math.PI * 2;
              const r = radius + (v / 2);
              const x = cx + r * Math.cos(angle);
              const y = cy + r * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = '#2dd4bf'; // teal-400
          ctx.lineWidth = 2;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#2dd4bf';
          ctx.stroke();

          // Second ring
          ctx.beginPath();
          ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
          ctx.stroke();
      };
      draw();
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-black/20 backdrop-blur-3xl rounded-3xl border border-white/5">
      <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
        <canvas ref={canvasRef} width="400" height="400" className="absolute inset-0 w-full h-full pointer-events-none" />
        
        <div className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 ${isConnected ? 'bg-black border border-teal-500 shadow-[0_0_50px_rgba(45,212,191,0.2)]' : 'bg-zinc-900 border border-zinc-800'}`}>
             {isConnected ? (
                 <div className="w-16 h-1 bg-teal-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(45,212,191,1)]"></div>
             ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-zinc-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                 </svg>
             )}
        </div>
      </div>

      <h2 className="text-xl font-mono font-bold text-zinc-200 tracking-widest uppercase mb-1">{status}</h2>
      
      <button 
        onClick={isConnected ? stopSession : startSession}
        className={`mt-10 px-10 py-3 rounded-full font-bold tracking-wider uppercase transition-all duration-300 transform hover:scale-105 ${
            isConnected 
            ? 'bg-red-950/50 text-red-400 border border-red-900 hover:bg-red-900/50' 
            : 'bg-teal-950/50 text-teal-400 border border-teal-900 hover:bg-teal-900/50 hover:shadow-[0_0_30px_rgba(45,212,191,0.15)]'
        }`}
      >
        {isConnected ? 'Terminate Link' : 'Initialize Voice'}
      </button>
    </div>
  );
};
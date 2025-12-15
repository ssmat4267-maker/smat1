import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { AspectRatio, ImageSize, VideoResolution } from "../types";

const getApiKey = () => process.env.API_KEY || '';

// --- Chat & Analysis ---

export const generateChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  images: string[] = [],
  options: {
    useThinking?: boolean;
    useSearch?: boolean;
    useMaps?: boolean;
    useCode?: boolean;
    location?: { lat: number; lng: number };
  }
) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  let model = 'gemini-2.5-flash';
  if (options.useThinking || options.useCode || images.length > 0) {
    model = 'gemini-3-pro-preview';
  } else if (options.useSearch || options.useMaps) {
    model = 'gemini-2.5-flash';
  }

  const tools: any[] = [];
  if (options.useSearch) tools.push({ googleSearch: {} });
  if (options.useMaps) tools.push({ googleMaps: {} });

  const config: any = {
    tools: tools.length > 0 ? tools : undefined,
  };

  if (options.useMaps && options.location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: options.location.lat,
          longitude: options.location.lng
        }
      }
    };
  }

  if (options.useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const parts: any[] = [{ text: message }];
  images.forEach(img => {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    });
  });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config
  });

  return response;
};

// --- Image Generation ---

export const generateImage = async (
  prompt: string,
  options: {
    modelType: 'flash' | 'pro';
    size?: ImageSize;
    ratio: AspectRatio;
    refImage?: string;
  }
) => {
  if (window.aistudio && await window.aistudio.hasSelectedApiKey() === false) {
     await window.aistudio.openSelectKey();
  }

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const model = options.modelType === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const parts: any[] = [{ text: prompt }];
  if (options.refImage) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: options.refImage
      }
    });
  }

  const config: any = {
    imageConfig: {
        aspectRatio: options.ratio
    }
  };
  
  if (options.modelType === 'pro' && options.size) {
    config.imageConfig.imageSize = options.size;
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config
  });

  let base64Image = '';
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }
  }

  return base64Image;
};

// --- Video Generation (Veo) ---

export const generateVideo = async (
  prompt: string,
  ratio: "16:9" | "9:16",
  quality: 'fast' | 'hq', // 'hq' maps to Veo 2 capability
  inputImage?: string
): Promise<string | null> => {
  
  if (window.aistudio && await window.aistudio.hasSelectedApiKey() === false) {
    await window.aistudio.openSelectKey();
  }

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Model mapping
  const model = quality === 'hq' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
  
  try {
    const config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: ratio
    };

    let operation;
    
    if (inputImage) {
        operation = await ai.models.generateVideos({
            model,
            prompt: prompt || "Animate this image",
            image: {
                imageBytes: inputImage,
                mimeType: 'image/jpeg'
            },
            config
        });
    } else {
        operation = await ai.models.generateVideos({
            model,
            prompt,
            config
        });
    }

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (uri) {
        return `${uri}&key=${getApiKey()}`;
    }
    return null;

  } catch (e) {
    console.error("Video generation failed", e);
    if (String(e).includes("Requested entity was not found") && window.aistudio) {
        await window.aistudio.openSelectKey();
        throw new Error("אנא בחר מפתח API תקין.");
    }
    throw e;
  }
};


// --- Live API (Voice) ---

export const connectLiveSession = async (
  onAudioData: (base64: string) => void,
  onClose: () => void,
) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const config: any = {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
    },
    systemInstruction: "You are a creative AI assistant speaking Hebrew.",
  };

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: async () => {},
      onmessage: (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          onAudioData(base64Audio);
        }
      },
      onclose: () => {
        onClose();
      },
      onerror: (e) => {
        console.error(e);
        onClose();
      }
    },
    config
  });

  const session = await sessionPromise;
  
  const sendRealtimeInput = (blob: any) => {
      session.sendRealtimeInput(blob);
  }

  return { session, sendRealtimeInput };
};

export function base64ToFloat32(base64: string): Float32Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
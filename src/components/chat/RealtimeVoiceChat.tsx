import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

interface RealtimeVoiceChatProps {
  onConversationEnd?: (summary: string) => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type AudioState = 'idle' | 'listening' | 'speaking' | 'processing';

export function RealtimeVoiceChat({ onConversationEnd }: RealtimeVoiceChatProps) {
  const { profile } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const initializeAudioContext = async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        },
      });
      
      mediaStreamRef.current = stream;
      
      // Create analyser for visualization
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      
      return true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      toast.error('Failed to access microphone');
      return false;
    }
  };

  const startAudioVisualization = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAudioLevel(0);
  };

  const connect = async () => {
    if (!profile) {
      toast.error('Please log in to use voice chat');
      return;
    }

    setConnectionState('connecting');
    
    // Initialize audio
    const audioInitialized = await initializeAudioContext();
    if (!audioInitialized) {
      setConnectionState('error');
      return;
    }

    try {
      // Get WebSocket URL from Edge Function
      const { data, error } = await supabase.functions.invoke('realtime-voice-session', {
        body: {
          action: 'create',
          userProfile: {
            id: profile.id,
            nickname: profile.nickname,
            personality_traits: profile.personality_traits,
          },
        },
      });

      if (error) throw error;

      const { sessionId, wsUrl } = data;
      sessionIdRef.current = sessionId;

      // Connect to WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionState('connected');
        setAudioState('listening');
        startAudioVisualization();
        startAudioStreaming();
        toast.success('Connected to NewMe');
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        toast.error('Connection error');
      };

      ws.onclose = () => {
        setConnectionState('disconnected');
        setAudioState('idle');
        stopAudioVisualization();
        toast.info('Disconnected from NewMe');
      };

    } catch (error) {
      console.error('Error connecting:', error);
      setConnectionState('error');
      toast.error('Failed to connect');
    }
  };

  const disconnect = () => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop audio streaming
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    stopAudioVisualization();
    setConnectionState('disconnected');
    setAudioState('idle');

    // Save conversation summary
    if (sessionIdRef.current && transcript.length > 0) {
      saveConversationSummary();
    }
  };

  const startAudioStreaming = () => {
    if (!audioContextRef.current || !mediaStreamRef.current || !wsRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    
    // Create ScriptProcessorNode for audio capture
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert Float32Array to Int16Array (PCM16)
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Send audio data to WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: arrayBufferToBase64(pcm16.buffer),
      }));
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
  };

  const handleWebSocketMessage = async (message: any) => {
    switch (message.type) {
      case 'session.created':
        console.log('Session created:', message.session);
        break;

      case 'conversation.item.created':
        if (message.item.type === 'message' && message.item.role === 'assistant') {
          setAudioState('processing');
        }
        break;

      case 'response.audio.delta':
        // Receive audio chunks from AI
        if (!isSpeakerMuted) {
          await playAudioChunk(message.delta);
        }
        setAudioState('speaking');
        break;

      case 'response.audio.done':
        setAudioState('listening');
        break;

      case 'response.text.delta':
        // Update transcript
        setTranscript(prev => {
          const newTranscript = [...prev];
          const lastIndex = newTranscript.length - 1;
          if (lastIndex >= 0 && newTranscript[lastIndex].startsWith('NewMe:')) {
            newTranscript[lastIndex] += message.delta;
          } else {
            newTranscript.push('NewMe: ' + message.delta);
          }
          return newTranscript;
        });
        break;

      case 'input_audio_buffer.speech_started':
        setAudioState('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        setAudioState('processing');
        break;

      case 'error':
        console.error('Realtime API error:', message.error);
        toast.error(message.error.message || 'An error occurred');
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContextRef.current) return;

    try {
      const audioData = base64ToArrayBuffer(base64Audio);
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      
      audioQueueRef.current.push(audioBuffer);
      
      if (!isPlayingRef.current) {
        playNextAudioBuffer();
      }
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  };

  const playNextAudioBuffer = () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift()!;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      playNextAudioBuffer();
    };
    
    source.start();
  };

  const saveConversationSummary = async () => {
    if (!profile || !sessionIdRef.current) return;

    try {
      const summary = transcript.join('\n');
      
      await supabase.functions.invoke('realtime-voice-session', {
        body: {
          action: 'save',
          sessionId: sessionIdRef.current,
          userId: profile.id,
          transcript: summary,
        },
      });

      if (onConversationEnd) {
        onConversationEnd(summary);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    toast.info(isSpeakerMuted ? 'Speaker unmuted' : 'Speaker muted');
  };

  // Helper functions
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  return (
    <Card className="glass-card p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Voice Chat with NewMe</h3>
          <p className="text-muted-foreground">
            Real-time voice conversation powered by OpenAI
          </p>
        </div>

        {/* Audio Visualization */}
        <div className="relative h-32 bg-background/50 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {connectionState === 'connected' ? (
              <div className="flex gap-1 items-end h-20">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-primary rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(10, audioLevel * 100 * (0.5 + Math.random() * 0.5))}%`,
                      opacity: audioState === 'listening' ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">
                {connectionState === 'connecting' ? 'Connecting...' : 'Not connected'}
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50">
            <div
              className={`w-3 h-3 rounded-full ${
                audioState === 'listening'
                  ? 'bg-green-500 animate-pulse'
                  : audioState === 'speaking'
                  ? 'bg-blue-500 animate-pulse'
                  : audioState === 'processing'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-muted'
              }`}
            />
            <span className="text-sm font-medium">
              {audioState === 'listening'
                ? 'Listening...'
                : audioState === 'speaking'
                ? 'NewMe is speaking...'
                : audioState === 'processing'
                ? 'Processing...'
                : 'Idle'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {connectionState === 'connected' ? (
            <>
              <Button
                onClick={toggleMute}
                variant={isMuted ? 'destructive' : 'outline'}
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button
                onClick={disconnect}
                variant="destructive"
                size="icon"
                className="h-16 w-16 rounded-full"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>

              <Button
                onClick={toggleSpeaker}
                variant={isSpeakerMuted ? 'destructive' : 'outline'}
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                {isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <Button
              onClick={connect}
              disabled={connectionState === 'connecting'}
              size="lg"
              className="h-16 w-16 rounded-full cosmic-gradient"
            >
              {connectionState === 'connecting' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </Button>
          )}
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="mt-6 max-h-48 overflow-y-auto space-y-2 p-4 bg-background/30 rounded-lg">
            {transcript.map((line, i) => (
              <p key={i} className="text-sm">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

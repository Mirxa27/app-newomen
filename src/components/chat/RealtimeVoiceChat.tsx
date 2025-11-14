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
      
      // Resume audio context if suspended (required for mobile browsers)
      audioContextRef.current = new AudioContextClass({ 
        sampleRate: 24000,
        latencyHint: 'interactive',
      });
      
      // Mobile browsers require user interaction to start audio context
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Get microphone access with mobile-optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          // Mobile-specific optimizations
          channelCount: 1,
          sampleSize: 16,
        },
      });
      
      mediaStreamRef.current = stream;
      
      // Ensure audio context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Create analyser for visualization
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      
      return true;
    } catch (error: any) {
      console.error('Error initializing audio:', error);
      
      // Provide more specific error messages for mobile
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Microphone permission denied. Please enable microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Audio features not supported in this browser. Please try a different browser.');
      } else {
        toast.error('Failed to access microphone. Please check your browser settings.');
      }
      
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

      if (error) {
        // Handle Edge Function errors
        let errorMsg = 'Failed to create realtime session';
        if (typeof error === 'string') {
          errorMsg = error;
        } else if (error?.message) {
          errorMsg = error.message;
        } else if (error?.context) {
          try {
            if (typeof error.context === 'string') {
              errorMsg = error.context;
            } else if (error.context?.message) {
              errorMsg = error.context.message;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        setConnectionState('error');
        toast.error(errorMsg);
        return;
      }

      // Check if the response contains an error
      if (data.error || (data.message && (data.message.includes('API key') || data.message.includes('not configured') || data.message.includes('not active')))) {
        setConnectionState('error');
        const errorMsg = data.message || data.error || 'OpenAI API key not configured';
        
        // Provide more helpful error message
        let helpText = 'Configure it in Admin Panel → API Providers → OpenAI';
        if (errorMsg.includes('not active')) {
          helpText = 'Activate the OpenAI provider in Admin Panel → API Providers';
        } else if (errorMsg.includes('not found')) {
          helpText = 'Create an OpenAI provider in Admin Panel → API Providers with name "OpenAI"';
        } else if (errorMsg.includes('no API key')) {
          helpText = 'Add your OpenAI API key in Admin Panel → API Providers → OpenAI';
        }
        
        toast.error(
          <div className="space-y-1">
            <p className="font-semibold">{errorMsg}</p>
            <p className="text-sm">
              {helpText}.{' '}
              <a 
                href="/admin/api-providers" 
                className="underline hover:text-primary font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/admin/api-providers';
                }}
              >
                Go to API Providers
              </a>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Note: Changes may take up to 5 seconds to take effect due to caching.
            </p>
          </div>,
          { duration: 12000 }
        );
        return;
      }

      // Check if this is a mock session (no API key configured) - legacy check
      if ((data.message && data.message.includes('mock session')) || 
          (data.wsUrl && data.wsUrl.includes('mock-realtime-api.example.com'))) {
        setConnectionState('error');
        toast.error(
          <div className="space-y-1">
            <p className="font-semibold">OpenAI API key not configured</p>
            <p className="text-sm">
              Configure it in{' '}
              <a 
                href="/admin/api-providers" 
                className="underline hover:text-primary font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/admin/api-providers';
                }}
              >
                Admin Panel → API Providers → OpenAI
              </a>
            </p>
          </div>,
          { duration: 10000 }
        );
        return;
      }

      // Validate required fields
      if (!data.ephemeralKey || !data.wsUrl) {
        setConnectionState('error');
        toast.error('Invalid response from server: missing ephemeralKey or wsUrl. Please check Edge Function configuration.');
        return;
      }

      const { sessionId, ephemeralKey, wsUrl, model } = data;
      sessionIdRef.current = sessionId;

      // OpenAI Realtime API: Connect to WebSocket with ephemeral key
      // IMPORTANT: Browsers cannot set custom headers on WebSocket connections
      // OpenAI Realtime API requires: Authorization: Bearer {ephemeralKey}
      // 
      // Solution: We'll try passing the key as a query parameter first
      // If that doesn't work, we may need to use a WebSocket proxy or library
      // that supports custom headers (like using a WebSocket library with header support)
      //
      // Format attempt: wss://api.openai.com/v1/realtime?model={model}&authorization=Bearer {ephemeralKey}
      const wsUrlWithAuth = `${wsUrl}&authorization=Bearer ${encodeURIComponent(ephemeralKey)}`;
      
      console.log('Connecting to OpenAI Realtime API with ephemeral key...');
      console.log('WebSocket URL:', wsUrlWithAuth.substring(0, 100) + '...'); // Log partial URL for debugging
      
      // Create WebSocket connection
      // Note: If OpenAI doesn't accept auth via query param, we'll need to implement
      // a WebSocket proxy in our Edge Function that adds the Authorization header
      const ws = new WebSocket(wsUrlWithAuth);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to OpenAI Realtime API');
        
        // The session is already configured via client_secrets endpoint
        // Wait for session.created event before starting audio streaming
        setConnectionState('connected');
        setAudioState('idle');
        startAudioVisualization();
        toast.success('Connected to NewMe');
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          await handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
          // Try to handle binary data if it's not JSON
          if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
            console.warn('Received binary data, this might be audio data');
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        
        // Provide more specific error messages
        const errorMessage = 'Connection error. Please check your internet connection and try again.';
        toast.error(errorMessage);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnectionState('disconnected');
        setAudioState('idle');
        stopAudioVisualization();
        
        // Provide feedback based on close code
        if (event.code === 1006) {
          // Abnormal closure (no close frame)
          toast.error('Connection lost. Please try reconnecting.');
        } else if (event.code === 1008) {
          // Policy violation (likely authentication issue)
          toast.error('Authentication failed. Please check API key configuration.');
        } else if (event.code !== 1000) {
          // Normal closure is 1000, anything else is an error
          toast.info('Disconnected from NewMe');
        }
        
        // Clean up
        if (wsRef.current) {
          wsRef.current = null;
        }
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
    if (!audioContextRef.current || !mediaStreamRef.current || !wsRef.current) {
      console.warn('Cannot start audio streaming: missing required components');
      return;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not open, waiting...');
      // Retry after a short delay
      setTimeout(() => startAudioStreaming(), 100);
      return;
    }

    try {
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      // Use ScriptProcessorNode for audio capture (deprecated but widely supported)
      // For better performance, consider using AudioWorkletNode in the future
      const bufferSize = 4096; // 4096 samples at 24kHz = ~170ms chunks
      const processor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array (-1.0 to 1.0) to Int16Array (PCM16, -32768 to 32767)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Clamp and convert to 16-bit integer
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // Send audio data to OpenAI Realtime API
        // Format: base64-encoded PCM16 audio
        try {
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: arrayBufferToBase64(pcm16.buffer),
          }));
        } catch (error) {
          console.error('Error sending audio data:', error);
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      console.log('Audio streaming started');
    } catch (error) {
      console.error('Error starting audio streaming:', error);
      toast.error('Failed to start audio streaming');
    }
  };

  const handleWebSocketMessage = async (message: any) => {
    try {
      switch (message.type) {
        case 'session.created':
          console.log('Session created:', message.session);
          // Start audio streaming after session is created
          startAudioStreaming();
          setAudioState('listening');
          break;

        case 'session.updated':
          console.log('Session updated:', message.session);
          break;

        case 'conversation.item.created':
          if (message.item?.type === 'message') {
            if (message.item.role === 'assistant') {
              setAudioState('processing');
              // Initialize transcript entry for assistant message
              setTranscript(prev => [...prev, 'NewMe: ']);
            } else if (message.item.role === 'user') {
              // User message created
              setTranscript(prev => [...prev, 'You: ']);
            }
          }
          break;

        case 'conversation.item.input_audio_transcription.completed':
          // User speech transcribed
          if (message.transcript) {
            setTranscript(prev => {
              const newTranscript = [...prev];
              const lastIndex = newTranscript.length - 1;
              if (lastIndex >= 0 && newTranscript[lastIndex].startsWith('You: ')) {
                newTranscript[lastIndex] = 'You: ' + message.transcript;
              } else {
                newTranscript.push('You: ' + message.transcript);
              }
              return newTranscript;
            });
          }
          break;

        case 'response.audio_transcript.delta':
          // Partial transcript of AI response
          if (message.delta) {
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
          }
          break;

        case 'response.audio_transcript.done':
          // AI response transcript complete
          if (message.transcript) {
            setTranscript(prev => {
              const newTranscript = [...prev];
              const lastIndex = newTranscript.length - 1;
              if (lastIndex >= 0 && newTranscript[lastIndex].startsWith('NewMe:')) {
                newTranscript[lastIndex] = 'NewMe: ' + message.transcript;
              } else {
                newTranscript.push('NewMe: ' + message.transcript);
              }
              return newTranscript;
            });
          }
          break;

        case 'response.audio.delta':
          // Receive audio chunks from AI (base64-encoded PCM16)
          if (!isSpeakerMuted && message.delta) {
            await playAudioChunk(message.delta);
          }
          setAudioState('speaking');
          break;

        case 'response.audio.done':
          // AI finished speaking
          setAudioState('listening');
          break;

        case 'response.done':
          // Response complete
          setAudioState('listening');
          break;

        case 'input_audio_buffer.speech_started':
          // User started speaking
          setAudioState('listening');
          break;

        case 'input_audio_buffer.speech_stopped':
          // User stopped speaking, AI is processing
          setAudioState('processing');
          break;

        case 'response.created':
          // AI started generating response
          setAudioState('processing');
          break;

        case 'response.output_item.added':
          // New output item added to response
          if (message.item?.type === 'audio') {
            setAudioState('speaking');
          }
          break;

        case 'error':
          console.error('Realtime API error:', message.error);
          const errorMsg = message.error?.message || message.error?.code || 'An error occurred';
          toast.error(`Error: ${errorMsg}`);
          setConnectionState('error');
          break;

        case 'ping':
          // Respond to ping with pong
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'pong' }));
          }
          break;

        default:
          // Log unhandled messages for debugging (but don't spam console)
          if (!message.type?.startsWith('response.') && !message.type?.startsWith('conversation.')) {
            console.log('Unhandled message type:', message.type, message);
          }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error, message);
    }
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContextRef.current || !base64Audio) return;

    try {
      // Resume audio context if suspended (required for mobile browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Decode base64 to ArrayBuffer
      const audioData = base64ToArrayBuffer(base64Audio);
      
      // OpenAI Realtime API sends PCM16 audio (16-bit signed integers, 24kHz, mono)
      // We need to convert this to Float32Array for Web Audio API
      const pcm16Data = new Int16Array(audioData);
      const float32Data = new Float32Array(pcm16Data.length);
      
      // Convert PCM16 to Float32 (-1.0 to 1.0)
      for (let i = 0; i < pcm16Data.length; i++) {
        float32Data[i] = pcm16Data[i] / 32768.0;
      }
      
      // Create AudioBuffer from the converted data
      // Sample rate: 24000 Hz (OpenAI Realtime API standard)
      const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
      audioBuffer.copyToChannel(float32Data, 0);
      
      // Queue the audio buffer for playback
      audioQueueRef.current.push(audioBuffer);
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextAudioBuffer();
      }
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      // Don't show error to user for individual chunks - might be transient
    }
  };

  const playNextAudioBuffer = async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    try {
      // Resume audio context if suspended (required for mobile browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      isPlayingRef.current = true;
      const buffer = audioQueueRef.current.shift()!;
      
      // Create a new source for each buffer
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      
      // Create a gain node to control volume (useful for speaker mute)
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = isSpeakerMuted ? 0 : 1;
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        // Clean up and play next buffer
        source.disconnect();
        gainNode.disconnect();
        playNextAudioBuffer();
      };
      
      // Handle errors
      source.onerror = (error) => {
        console.error('Error playing audio source:', error);
        isPlayingRef.current = false;
        // Try next buffer if available
        if (audioQueueRef.current.length > 0) {
          playNextAudioBuffer();
        }
      };
      
      source.start(0);
    } catch (error) {
      console.error('Error playing audio buffer:', error);
      isPlayingRef.current = false;
      // Try next buffer if available
      if (audioQueueRef.current.length > 0) {
        setTimeout(() => playNextAudioBuffer(), 10);
      }
    }
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
    
    // Update gain for currently playing audio
    // Note: This requires maintaining a reference to the gain node
    // For now, the gain is set when creating new sources
    // Future improvement: maintain gain node reference for real-time control
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
    <Card className="glass-card p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Voice Chat with NewMe</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time voice conversation powered by OpenAI
          </p>
        </div>

        {/* Audio Visualization */}
        <div className="relative h-24 sm:h-32 bg-background/50 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {connectionState === 'connected' ? (
              <div className="flex gap-0.5 sm:gap-1 items-end h-16 sm:h-20 px-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 sm:w-2 bg-primary rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(10, audioLevel * 100 * (0.5 + Math.random() * 0.5))}%`,
                      opacity: audioState === 'listening' ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-muted-foreground px-4">
                {connectionState === 'connecting' ? 'Connecting...' : 'Not connected'}
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-background/50">
            <div
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                audioState === 'listening'
                  ? 'bg-green-500 animate-pulse'
                  : audioState === 'speaking'
                  ? 'bg-blue-500 animate-pulse'
                  : audioState === 'processing'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-muted'
              }`}
            />
            <span className="text-xs sm:text-sm font-medium">
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
        <div className="flex justify-center gap-3 sm:gap-4">
          {connectionState === 'connected' ? (
            <>
              <Button
                onClick={toggleMute}
                variant={isMuted ? 'destructive' : 'outline'}
                size="icon"
                className="h-14 w-14 sm:h-12 sm:w-12 rounded-full touch-manipulation"
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="h-5 w-5 sm:h-5 sm:w-5" /> : <Mic className="h-5 w-5 sm:h-5 sm:w-5" />}
              </Button>

              <Button
                onClick={disconnect}
                variant="destructive"
                size="icon"
                className="h-[72px] w-[72px] sm:h-16 sm:w-16 rounded-full touch-manipulation"
                aria-label="End call"
              >
                <PhoneOff className="h-6 w-6 sm:h-6 sm:w-6" />
              </Button>

              <Button
                onClick={toggleSpeaker}
                variant={isSpeakerMuted ? 'destructive' : 'outline'}
                size="icon"
                className="h-14 w-14 sm:h-12 sm:w-12 rounded-full touch-manipulation"
                aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
              >
                {isSpeakerMuted ? <VolumeX className="h-5 w-5 sm:h-5 sm:w-5" /> : <Volume2 className="h-5 w-5 sm:h-5 sm:w-5" />}
              </Button>
            </>
          ) : (
            <Button
              onClick={connect}
              disabled={connectionState === 'connecting'}
              size="lg"
              className="h-[72px] w-[72px] sm:h-16 sm:w-16 rounded-full cosmic-gradient touch-manipulation"
              aria-label="Start voice chat"
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
          <div className="mt-4 sm:mt-6 max-h-40 sm:max-h-48 overflow-y-auto space-y-2 p-3 sm:p-4 bg-background/30 rounded-lg overscroll-contain">
            {transcript.map((line, i) => (
              <p key={i} className="text-xs sm:text-sm break-words">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

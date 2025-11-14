import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone with mobile-optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Mobile optimizations
          channelCount: 1,
          sampleRate: 16000, // Standard for speech recognition
        } 
      });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ 
        sampleRate: 16000,
        latencyHint: 'interactive',
      });
      
      // Resume if suspended (mobile browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Use webm for better mobile browser support
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm'; // fallback
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000, // Good quality for speech
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mimeType || 'audio/webm' 
        });
        stream.getTracks().forEach(track => track.stop());
        
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }
        
        await processAudio(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms for better mobile performance
      setIsRecording(true);
      visualizeAudio();
      
      toast.success('Recording started');
    } catch (error: any) {
      console.error('Error starting recording:', error);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Microphone permission denied. Please enable microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No microphone found. Please connect a microphone.');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Audio recording not supported in this browser.');
      } else {
        toast.error('Failed to access microphone. Please check your browser settings.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const visualizeAudio = () => {
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

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Try OpenAI Whisper API first (more accurate, especially for mobile)
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (openaiApiKey) {
        try {
          // Convert blob to File for FormData
          const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', audioFile);
          formData.append('model', 'whisper-1');
          formData.append('language', 'en');

          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            const transcript = data.text;
            onTranscript(transcript);
            toast.success('Voice message transcribed');
            setIsProcessing(false);
            return;
          }
        } catch (openaiError) {
          console.error('OpenAI transcription error:', openaiError);
          // Fall through to Web Speech API
        }
      }

      // Fallback to Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error('Speech recognition not supported. Please type your message.');
        setIsProcessing(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        toast.success('Voice message transcribed');
        setIsProcessing(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Failed to transcribe audio. Please try typing instead.';
        
        if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please try again.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'No microphone found. Please check your device.';
        } else if (event.error === 'not-allowed') {
          errorMessage = 'Microphone permission denied. Please enable microphone access.';
        }
        
        toast.error(errorMessage);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        setIsProcessing(false);
      };

      // Start recognition
      recognition.start();
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process audio. Please try typing instead.');
      setIsProcessing(false);
    }
  };

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleToggle}
        disabled={disabled || isProcessing}
        size="icon"
        variant={isRecording ? 'destructive' : 'default'}
        className="relative overflow-hidden h-[52px] w-[52px] sm:h-10 sm:w-10 touch-manipulation"
        aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
        
        {isRecording && (
          <div
            className="absolute inset-0 bg-primary/30 animate-pulse"
            style={{
              transform: `scale(${1 + audioLevel * 0.5})`,
              transition: 'transform 0.1s ease-out',
            }}
          />
        )}
      </Button>
      
      {isRecording && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

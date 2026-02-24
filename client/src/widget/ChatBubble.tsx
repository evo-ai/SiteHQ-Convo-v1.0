import { h } from 'preact';
import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import { useConversation } from './useConversation';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
import { MessageCircleIcon, MicIcon, MicOffIcon, WandIcon, SunIcon, MoonIcon } from './icons';
import type { WidgetConfig } from './types';

interface ChatBubbleProps extends WidgetConfig {}

export function ChatBubble({
  apiKey,
  agentId,
  title = 'AI Assistant',
  theme,
  darkMode: initialDarkMode = false,
  solarSystemTheme = true,
  initiallyOpen = false
}: ChatBubbleProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(initialDarkMode);
  const [isTyping, setIsTyping] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const primaryColor = theme?.primary || '#F95638';

  const conversation = useConversation({
    onConnect: () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    },
    onDisconnect: () => {
      stopMicVisualization();
    },
    onError: (error) => {
      showToast('Error', error.message || 'Failed to connect to the AI assistant');
    },
    onMessage: () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  });

  // Simple toast notification
  const showToast = (title: string, message: string) => {
    // Create toast element in shadow DOM
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `<strong>${title}</strong><p>${message}</p>`;

    // Find shadow root and append
    const shadowRoot = document.getElementById('convo-widget-root')?.shadowRoot;
    if (shadowRoot) {
      shadowRoot.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    }
  };

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Start microphone visualization
  const startMicVisualization = async () => {
    try {
      if (!micStreamRef.current) {
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        const source = audioContextRef.current.createMediaStreamSource(micStreamRef.current);
        source.connect(analyserRef.current);
      }

      const analyzeVolume = () => {
        if (!analyserRef.current || conversation.isSpeaking) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setMicVolume(Math.min(100, average * 1.2));

        if (conversation.status === 'connected' && !conversation.isSpeaking) {
          requestAnimationFrame(analyzeVolume);
        }
      };

      analyzeVolume();
    } catch {
      // Microphone access denied or unavailable
    }
  };

  const stopMicVisualization = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    setMicVolume(0);
  };

  // Handle start call
  const handleStartCall = () => {
    setShowTerms(true);
  };

  // Start mic visualization when listening
  useEffect(() => {
    if (conversation.status === 'connected' && !conversation.isSpeaking) {
      startMicVisualization();
    } else {
      stopMicVisualization();
    }

    return () => stopMicVisualization();
  }, [conversation.status, conversation.isSpeaking]);

  // Handle initially open
  useEffect(() => {
    if (initiallyOpen) {
      handleStartCall();
    }
  }, [initiallyOpen]);

  // Accept terms and start conversation
  const handleAcceptTerms = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const response = await fetch(`/api/get-signed-url?agentId=${agentId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }

      const { signedUrl } = await response.json();
      await conversation.startSession({ signedUrl });

      setShowTerms(false);
    } catch (error) {
      showToast('Error', error instanceof Error ? error.message : 'Failed to start conversation');
    }
  }, [apiKey, agentId, conversation]);

  // Render sound wave animation
  const SoundWave = () => (
    <div className="sound-wave">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="sound-wave__bar" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );

  // Render typing indicator
  const TypingIndicator = () => (
    <div className="typing-indicator">
      <div className="typing-indicator__dot" />
      <div className="typing-indicator__dot" />
      <div className="typing-indicator__dot" />
    </div>
  );

  // Render mic wave
  const MicrophoneWave = () => (
    <div className="mic-wave">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="mic-wave__bar"
          style={{
            height: `${Math.max(3, micVolume / 10)}px`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  // Render solar system particles
  const SolarParticles = () => (
    <>
      <div
        className="particle particle-sun"
        style={{
          backgroundColor: '#FFCC00',
          boxShadow: '0 0 10px rgba(255, 204, 0, 0.8)'
        }}
      />
      <div className="particle particle-earth" style={{ backgroundColor: '#00CCFF' }} />
    </>
  );

  // Render standard particles
  const StandardParticles = () => (
    <>
      <div className="particle particle-yellow" />
      <div className="particle particle-blue" />
    </>
  );

  return (
    <div className={`widget-root ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Dark mode toggle */}
      <button className="dark-mode-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
        {isDarkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
      </button>

      {conversation.status !== 'connected' ? (
        // Collapsed state - bubble
        <div className="bubble-container">
          {/* Tooltip */}
          <div className={`tooltip ${isHovered ? 'visible' : ''} ${isDarkMode ? 'dark' : ''}`}>
            <p>Ask me anything! I'm here to help.</p>
          </div>

          {/* Main bubble */}
          <div
            className={`bubble ${isVisible ? 'visible' : ''} ${isHovered ? 'hovered' : ''}`}
            style={{
              background: `radial-gradient(circle at 30% 30%, ${primaryColor}, ${primaryColor}DD)`,
              boxShadow: `0 4px 20px ${primaryColor}4D`
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleStartCall}
          >
            <MessageCircleIcon className="w-6 h-6 text-white" />
          </div>

          {/* Pulse effect */}
          <div className="pulse-ring" style={{ background: primaryColor }} />

          {/* Particles */}
          {solarSystemTheme ? <SolarParticles /> : <StandardParticles />}
        </div>
      ) : (
        // Connected state - active call UI
        <div className={`connected-card ${isDarkMode ? 'dark' : ''} ${isVisible ? 'visible' : ''}`}>
          <div className="connected-icon" style={{ background: `radial-gradient(circle at 30% 30%, ${primaryColor}, ${primaryColor}DD)` }}>
            {conversation.isSpeaking ? (
              <WandIcon className="w-5 h-5 text-white" />
            ) : (
              <MicIcon className="w-5 h-5 text-white mic-pulse" />
            )}
            {conversation.isSpeaking && <div className="speaking-indicator" />}
          </div>

          <div className="connected-content">
            <h3 className="connected-title" style={{ color: isDarkMode ? '#fff' : primaryColor }}>
              {title}
            </h3>

            {isTyping ? (
              <div className="status-row">
                <span className={`status-text ${isDarkMode ? 'dark' : ''}`}>Thinking</span>
                <TypingIndicator />
              </div>
            ) : conversation.isSpeaking ? (
              <div className="status-row">
                <span className={`status-text ${isDarkMode ? 'dark' : ''}`}>Speaking</span>
                <SoundWave />
              </div>
            ) : (
              <div className="status-row">
                <span className={`status-text listening ${isDarkMode ? 'dark' : ''}`}>Listening</span>
                <MicrophoneWave />
              </div>
            )}
          </div>

          <button
            className={`end-call-btn ${isDarkMode ? 'dark' : ''}`}
            onClick={() => conversation.endSession()}
          >
            <MicOffIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Powered by footer */}
      <div className="powered-by">
        Powered by{' '}
        <a href="https://www.futurnod.com/" target="_blank" rel="noopener noreferrer">
          Futur Nod
        </a>
      </div>

      {/* Terms dialog */}
      <Dialog open={showTerms} onClose={() => setShowTerms(false)} className={isDarkMode ? 'dark' : ''}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? 'text-white' : ''}>Terms and conditions</DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-300' : ''}>
            By clicking "Agree," and each time I interact with this AI agent, I consent to the
            recording, storage, and sharing of my communications with third-party service providers,
            and as described in the Privacy Policy. If you do not wish to have your conversations
            recorded, please refrain from using this service.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            className={`btn btn-outline ${isDarkMode ? 'dark' : ''}`}
            onClick={() => setShowTerms(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ backgroundColor: primaryColor }}
            onClick={handleAcceptTerms}
          >
            Agree
          </button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

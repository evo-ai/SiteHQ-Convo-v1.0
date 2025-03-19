import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConversation } from "@11labs/react";
import {
  MessageCircle,
  MicOff,
  Volume2,
  Wand2,
  Sun,
  Moon,
  Mic as MicIcon,
} from "lucide-react";

interface ChatBubbleProps {
  apiKey?: string;
  agentId?: string;
  title?: string;
  theme?: {
    primary: string;
    background: string;
    text: string;
  };
  initiallyOpen?: boolean;
}

export default function ChatBubble({
  apiKey = process.env.ELEVENLABS_API_KEY,
  agentId = "FnTVTPK2FfEkaktJIFFx",
  title = "AI Assistant",
  theme,
  initiallyOpen = false,
}: ChatBubbleProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const { toast } = useToast();
  const primaryColor = theme?.primary || "#5c078c";

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      // Simulate typing indicator when connected
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      stopMicVisualization();
    },
    onError: (error: Error) => {
      console.error("Conversation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect to the AI assistant",
        variant: "destructive",
      });
    },
    onMessage: (message: unknown) => {
      console.log("Message:", message);
      // Simulate typing indicator when receiving a message
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    },
  });

  // Start microphone visualization when not speaking (listening to user)
  useEffect(() => {
    if (conversation.status === "connected" && !conversation.isSpeaking) {
      startMicVisualization();
    } else {
      stopMicVisualization();
    }

    return () => {
      stopMicVisualization();
    };
  }, [conversation.status, conversation.isSpeaking]);

  // Start microphone volume visualization
  const startMicVisualization = async () => {
    try {
      // Request microphone access if we don't have it yet
      if (!micStreamRef.current) {
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }

      // Initialize audio context and analyzer if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        const source = audioContextRef.current.createMediaStreamSource(
          micStreamRef.current,
        );
        source.connect(analyserRef.current);
      }

      // Start the volume analysis
      const analyzeVolume = () => {
        if (!analyserRef.current || conversation.isSpeaking) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate volume level (0-100)
        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setMicVolume(Math.min(100, average * 1.2)); // Scale up a bit and cap at 100

        if (conversation.status === "connected" && !conversation.isSpeaking) {
          requestAnimationFrame(analyzeVolume);
        }
      };

      analyzeVolume();
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  // Stop microphone visualization
  const stopMicVisualization = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    setMicVolume(0);
  };

  const handleStartCall = () => {
    setShowTerms(true);
  };

  const handleAcceptTerms = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const response = await fetch("/api/get-signed-url", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get signed URL");
      }

      const { signedUrl } = await response.json();
      await conversation.startSession({
        signedUrl,
      });

      setShowTerms(false);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to start conversation. Please check your permissions and try again.",
        variant: "destructive",
      });
    }
  }, [apiKey, conversation, toast]);

  // Pulse animation for the indicator
  const pulseVariants = {
    inactive: { scale: 1, opacity: 0.7 },
    active: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        repeat: Infinity,
        duration: 2,
      },
    },
  };

  // Wave animation for the sound wave when AI is speaking
  const SoundWave = () => (
    <div className="flex gap-[2px] items-end justify-center h-4 w-12">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ height: "30%" }}
          animate={{ height: ["30%", `${Math.random() * 70 + 30}%`, "30%"] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.1,
          }}
          className="w-1 bg-blue-500 rounded-full"
          style={{ opacity: 0.7 + i * 0.1 }}
        />
      ))}
    </div>
  );

  // Typing indicator animation
  const TypingIndicator = () => (
    <div className="typing-indicator">
      <div className="typing-indicator__dot"></div>
      <div className="typing-indicator__dot"></div>
      <div className="typing-indicator__dot"></div>
    </div>
  );

  // Microphone level visualization
  const MicrophoneWave = () => (
    <div className="mic-wave">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="mic-wave__bar"
          style={{
            height: `${Math.max(3, micVolume / 10)}px`,
            animationDuration: `${0.5 + i * 0.1}s`,
          }}
        ></div>
      ))}
    </div>
  );

  // Decorative particles for the background
  const Particles = () => (
    <div className="particles-container">
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
    </div>
  );

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="relative">
      {/* Dark mode toggle */}
      <button className="dark-mode-toggle" onClick={toggleDarkMode}>
        {isDarkMode ? (
          <Sun className="w-4 h-4 text-yellow-400" />
        ) : (
          <Moon className="w-4 h-4 text-gray-600" />
        )}
      </button>

      <AnimatePresence>
        {conversation.status !== "connected" ? (
          <div className="flex flex-col items-end">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`mb-3 px-4 py-2 shadow-lg max-w-[220px] rounded-lg ${isDarkMode ? "dark-theme" : "bg-white"}`}
              style={{
                opacity: isHovered ? 1 : 0,
                pointerEvents: isHovered ? "auto" : "none",
                transform: `translateY(${isHovered ? "0px" : "10px"})`,
                transition: "opacity 0.3s, transform 0.3s",
              }}
            >
              <p
                className={`text-sm font-medium ${isDarkMode ? "dark-text" : ""}`}
                style={{ color: isDarkMode ? "#eee" : theme?.text || "#333" }}
              >
                Ask me anything! I'm here to help.
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative cursor-pointer group float-animation"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleStartCall}
            >
              {/* Main circular button */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${primaryColor}, ${primaryColor}DD)`,
                  boxShadow: `0 4px 20px rgba(92, 7, 140, 0.3)`,
                }}
              >
                <motion.div
                  initial="inactive"
                  animate={isHovered ? "active" : "inactive"}
                  variants={pulseVariants}
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                </motion.div>
              </div>

              {/* Pulse effect around the button */}
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: [0, 0.2, 0],
                  scale: [1, 1.4, 1.8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
                style={{
                  background: primaryColor,
                  zIndex: -1,
                }}
              />

              {/* Small decorative particle elements */}
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-300"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-blue-400"
                animate={{
                  y: [0, 8, 0],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />

              {/* Floating particles in the background */}
              <Particles />
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className={`rounded-xl shadow-xl p-4 flex items-center gap-3 max-w-[280px] ${isDarkMode ? "dark-theme" : "bg-white"}`}
            style={{
              boxShadow: isDarkMode
                ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -5px rgba(0, 0, 0, 0.2)"
                : "0 10px 25px -5px rgba(92, 7, 140, 0.15), 0 8px 10px -5px rgba(92, 7, 140, 0.1)",
            }}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${primaryColor}, ${primaryColor}DD)`,
                }}
              >
                {conversation.isSpeaking ? (
                  <Wand2 className="w-5 h-5 text-white" />
                ) : (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                    }}
                  >
                    <MicIcon className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>
              {conversation.isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full"
                />
              )}
            </div>

            <div className="flex-1">
              <h3
                className={`text-sm font-medium mb-1 ${isDarkMode ? "text-white" : ""}`}
                style={{ color: isDarkMode ? "#fff" : primaryColor }}
              >
                SiteHQ Assistant
              </h3>

              {isTyping ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${isDarkMode ? "text-blue-300" : "text-blue-600"}`}
                  >
                    Thinking
                  </span>
                  <TypingIndicator />
                </div>
              ) : conversation.isSpeaking ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${isDarkMode ? "text-blue-300" : "text-blue-600"}`}
                  >
                    Speaking
                  </span>
                  <SoundWave />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${isDarkMode ? "text-green-300" : "text-green-600"}`}
                  >
                    Listening
                  </span>
                  <MicrophoneWave />
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 rounded-full p-0 ${isDarkMode ? "bg-red-900 hover:bg-red-800" : "bg-red-50 hover:bg-red-100"}`}
              onClick={() => conversation.endSession()}
            >
              <MicOff
                className={`w-4 h-4 ${isDarkMode ? "text-red-200" : "text-red-500"}`}
              />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-xs text-gray-500 mt-1.5">
        Powered by{" "}
        <a
          href="https://www.futurnod.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Futur Nod
        </a>
      </div>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent
          className={`sm:max-w-lg ${isDarkMode ? "dark-theme" : ""}`}
        >
          <DialogHeader>
            <DialogTitle
              className={`text-xl ${isDarkMode ? "text-white" : ""}`}
            >
              Terms and conditions
            </DialogTitle>
            <DialogDescription
              className={`text-base leading-relaxed ${isDarkMode ? "text-gray-300" : ""}`}
            >
              By clicking "Agree," and each time I interact with this AI agent,
              I consent to the recording, storage, and sharing of my
              communications with third-party service providers, and as
              described in the Privacy Policy. If you do not wish to have your
              conversations recorded, please refrain from using this service.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant={isDarkMode ? "default" : "outline"}
              className={isDarkMode ? "bg-gray-700 text-white" : ""}
              onClick={() => setShowTerms(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptTerms}
              className="terms-agree-button"
              style={{ backgroundColor: primaryColor }}
            >
              Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

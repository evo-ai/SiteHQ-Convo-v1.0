export interface WidgetTheme {
  primary: string;
  background: string;
  text: string;
}

export interface WidgetConfig {
  apiKey: string;
  agentId: string;
  title?: string;
  theme?: WidgetTheme;
  darkMode?: boolean;
  solarSystemTheme?: boolean;
  initiallyOpen?: boolean;
}

export type ConversationStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export interface ConversationCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: () => void;
}

export interface ConversationState {
  status: ConversationStatus;
  isSpeaking: boolean;
  startSession: (options: { signedUrl: string }) => Promise<void>;
  endSession: () => Promise<void>;
}

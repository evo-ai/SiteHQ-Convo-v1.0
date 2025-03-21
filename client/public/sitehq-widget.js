class SiteHQChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.config = {};
    this.state = {
      isOpen: false,
      isDarkMode: false,
      status: 'disconnected',
      micVolume: 0,
      isSpeaking: false,
      acceptedTerms: false,
    };
    this.refs = {};
    this.micStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.ws = null;
  }

  connectedCallback() {
    this.loadConfig();
    this.render();
    this.setupEventListeners();
    if (this.config.initiallyOpen) {
      this.toggleChatWindow(true);
    }
  }

  disconnectedCallback() {
    this.cleanup();
  }

  loadConfig() {
    const defaultConfig = {
      apiKey: 'demo-key',
      agentId: 'demo-agent',
      theme: { primary: '#5c078c' },
      initiallyOpen: false,
      widgetTitle: 'SiteHQ Assistant',
    };

    this.config = {
      apiKey: this.getAttribute('api-key') || defaultConfig.apiKey,
      agentId: this.getAttribute('agent-id') || defaultConfig.agentId,
      initiallyOpen: this.getAttribute('initially-open') === 'true',
      widgetTitle: this.getAttribute('title') || defaultConfig.widgetTitle,
      theme: defaultConfig.theme,
    };

    if (this.hasAttribute('theme')) {
      try {
        this.config.theme = JSON.parse(this.getAttribute('theme'));
      } catch (e) {
        console.warn('Invalid theme JSON:', e);
      }
    }

    this.shadowRoot.host.style.setProperty('--primary-color', this.config.theme.primary);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .sitehq-container {
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          position: fixed;
          z-index: 9999;
          bottom: 20px;
          right: 20px;
        }

        .sitehq-toggle-button {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--primary-color, #5c078c);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .sitehq-chat-window {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 350px;
          max-height: 500px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sitehq-header {
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          background-color: #f9f9f9;
        }

        .sitehq-messages {
          padding: 15px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sitehq-message-bubble {
          padding: 10px 15px;
          border-radius: 18px;
          max-width: 80%;
          word-break: break-word;
        }

        .sitehq-user-message .sitehq-message-bubble {
          background-color: #f1f1f1;
          border-bottom-right-radius: 4px;
          align-self: flex-end;
        }

        .sitehq-assistant-message .sitehq-message-bubble {
          background-color: var(--primary-color, #5c078c);
          color: white;
          border-bottom-left-radius: 4px;
          align-self: flex-start;
        }

        .sitehq-input-area {
          padding: 10px 15px;
          display: flex;
          gap: 10px;
          border-top: 1px solid #eee;
          background-color: #f9f9f9;
        }

        .sitehq-message-input {
          flex: 1;
          padding: 10px;
          border-radius: 20px;
          border: 1px solid #ddd;
          resize: none;
          outline: none;
        }

        .sitehq-send-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--primary-color, #5c078c);
          color: white;
          border: none;
          cursor: pointer;
        }

        .sitehq-terms-dialog {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: none;
          align-items: center;
          justify-content: center;
        }

        .sitehq-terms-content {
          background-color: white;
          padding: 20px;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
        }

        .sitehq-terms-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .sitehq-primary-button {
          background-color: var(--primary-color, #5c078c);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .sitehq-cancel-button {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .sitehq-typing-indicator {
          display: flex;
          gap: 5px;
          padding: 10px 15px;
        }

        .sitehq-typing-dot {
          width: 8px;
          height: 8px;
          background-color: #888;
          border-radius: 50%;
          animation: sitehq-typing-dot 1.4s infinite ease-in-out;
        }

        @keyframes sitehq-typing-dot {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      </style>
      <div class="sitehq-container">
        <div class="sitehq-chat-window" style="display: none;">
          <div class="sitehq-header">
            <div class="sitehq-header-content">
              <div class="sitehq-header-title">${this.config.widgetTitle || 'Chat with AI'}</div>
              <div class="sitehq-status" id="sitehq-status">Initializing...</div>
            </div>
            <div class="sitehq-header-actions">
              <button class="sitehq-icon-button" aria-label="Toggle dark mode">🌙</button>
              <button class="sitehq-icon-button" aria-label="Close chat">✖</button>
            </div>
          </div>
          <div class="sitehq-messages"></div>
          <div class="sitehq-typing-indicator" style="display: none;">
            <div class="sitehq-typing-dot"></div>
            <div class="sitehq-typing-dot"></div>
            <div class="sitehq-typing-dot"></div>
          </div>
          <div class="sitehq-input-area">
            <textarea class="sitehq-message-input" placeholder="Type a message..." rows="1"></textarea>
            <button class="sitehq-send-button" aria-label="Send message">➤</button>
          </div>
        </div>
        <button class="sitehq-toggle-button" aria-label="Toggle chat">💬</button>
        <div class="sitehq-tooltip">Chat with our AI assistant</div>
        <div class="sitehq-terms-dialog" style="display: none;">
          <div class="sitehq-terms-content">
            <h3>Terms and Conditions</h3>
            <p>By clicking "Agree," you consent to the recording and storage of your communications as per our Privacy Policy.</p>
            <div class="sitehq-terms-buttons">
              <button class="sitehq-cancel-button">Cancel</button>
              <button class="sitehq-primary-button"> Agree</button>
            </div>
          </div>
        </div>
        <div class="sitehq-branding">Powered by <a href="https://www.sitehq.ai" target="_blank">SiteHQ</a></div>
      </div>
    `;

    // Store references to key elements
    this.refs.container = this.shadowRoot.querySelector('.sitehq-container');
    this.refs.chatWindow = this.shadowRoot.querySelector('.sitehq-chat-window');
    this.refs.chatButton = this.shadowRoot.querySelector('.sitehq-toggle-button');
    this.refs.messagesContainer = this.shadowRoot.querySelector('.sitehq-messages');
    this.refs.typingIndicator = this.shadowRoot.querySelector('.sitehq-typing-indicator');
    this.refs.messageInput = this.shadowRoot.querySelector('.sitehq-message-input');
    this.refs.termsDialog = this.shadowRoot.querySelector('.sitehq-terms-dialog');
  }

  setupEventListeners() {
    this.refs.chatButton.addEventListener('click', () => this.toggleChatWindow(!this.state.isOpen));
    this.refs.chatWindow.querySelector('[aria-label="Close chat"]').addEventListener('click', () => this.toggleChatWindow(false));
    this.refs.chatWindow.querySelector('.sitehq-send-button').addEventListener('click', () => this.sendMessage());
    this.refs.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    this.refs.termsDialog.querySelector('.sitehq-cancel-button').addEventListener('click', () => {
      this.refs.termsDialog.style.display = 'none';
      this.toggleChatWindow(false);
    });
    this.refs.termsDialog.querySelector('.sitehq-primary-button').addEventListener('click', () => {
      this.state.acceptedTerms = true;
      this.refs.termsDialog.style.display = 'none';
      this.initializeChat();
    });
  }

  toggleChatWindow(open) {
    this.state.isOpen = open;
    this.refs.chatWindow.style.display = open ? 'flex' : 'none';
    if (open && !this.state.acceptedTerms) {
      this.refs.termsDialog.style.display = 'flex';
    }
  }

  async startMicVisualization() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      source.connect(this.analyser);
      this.analyzeVolume();
    } catch (err) {
      console.error('Microphone error:', err);
    }
  }

  analyzeVolume() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    this.state.micVolume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    if (this.state.status === 'connected') {
      requestAnimationFrame(() => this.analyzeVolume());
    }
  }

  async initializeChat() {
    try {
      // Use the absolute URL of the Replit server
      const serverUrl = 'https://c46a1c6d-3d97-4f35-8e97-39c88d29fcc3-00-3jso8wzm23kek.pike.replit.dev';
      const response = await fetch(`${serverUrl}/api/get-signed-url?agentId=${this.config.agentId}`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch signed URL: ${response.statusText}`);
      }
      const { signedUrl } = await response.json();
      this.connectWebSocket(signedUrl);
    } catch (err) {
      console.error('Chat initialization error:', err);
      this.setStatus('error');
    }
  }

  connectWebSocket(signedUrl) {
    this.ws = new WebSocket(signedUrl);
    this.ws.onopen = () => {
      this.setStatus('connected');
      this.addMessage('assistant', 'Hello! How can I assist you?');
    };
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') this.addMessage('assistant', data.text);
    };
    this.ws.onerror = () => this.setStatus('error');
    this.ws.onclose = () => this.setStatus('disconnected');
  }

  sendMessage() {
    const content = this.refs.messageInput.value.trim();
    if (!content || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.addMessage('user', content);
    this.ws.send(JSON.stringify({ text: content, action: 'message' }));
    this.refs.messageInput.value = '';
  }

  addMessage(role, content) {
    const messageEl = document.createElement('div');
    messageEl.className = `sitehq-message sitehq-${role}-message`;
    const bubble = document.createElement('div');
    bubble.className = 'sitehq-message-bubble';
    bubble.textContent = content;
    messageEl.appendChild(bubble);
    this.refs.messagesContainer.appendChild(messageEl);
    this.refs.messagesContainer.scrollTop = this.refs.messagesContainer.scrollHeight;
  }

  setStatus(status) {
    this.state.status = status;
    const statusEl = this.shadowRoot.querySelector('#sitehq-status');
    statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    this.refs.typingIndicator.style.display = status === 'thinking' ? 'flex' : 'none';
  }

  cleanup() {
    if (this.micStream) this.micStream.getTracks().forEach(track => track.stop());
    if (this.ws) this.ws.close();
  }
}

customElements.define('sitehq-chat', SiteHQChat);
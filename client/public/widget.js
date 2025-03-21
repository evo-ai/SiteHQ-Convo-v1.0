class VoiceConvoWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.initialized = false;
  }

  async connectedCallback() {
    const styles = document.createElement('style');
    styles.textContent = `
      :host {
        display: contents;
      }

      #voice-convo-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .widget-button-wrapper {
        position: relative;
      }

      .widget-button {
        background: radial-gradient(circle at 30% 30%, var(--primary-color, #0066cc), var(--primary-color, #0066cc)DD);
        color: var(--text-color, white);
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;
        position: relative;
        z-index: 2;
      }

      .widget-button:hover {
        transform: scale(1.1);
      }

      .pulse-effect {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: var(--primary-color, #0066cc);
        z-index: -1;
        opacity: 0;
        animation: pulse 2s infinite ease-in-out;
      }

      @keyframes pulse {
        0% { opacity: 0; transform: scale(1); }
        50% { opacity: 0.2; transform: scale(1.4); }
        100% { opacity: 0; transform: scale(1.8); }
      }

      .float-animation {
        animation: float 6s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .particles {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        pointer-events: none;
      }

      .particle {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        opacity: 0.7;
      }

      .particle:nth-child(1) {
        top: -5px;
        right: 10px;
        background-color: #ffcc00;
        animation: particle-move 3s infinite ease-in-out;
      }

      .particle:nth-child(2) {
        top: 10px;
        right: -5px;
        background-color: #ff6699;
        animation: particle-move 3s infinite ease-in-out 0.5s;
      }

      .particle:nth-child(3) {
        bottom: 10px;
        right: -5px;
        background-color: #66ccff;
        animation: particle-move 3s infinite ease-in-out 1s;
      }

      .particle:nth-child(4) {
        bottom: -5px;
        right: 10px;
        background-color: #99ff99;
        animation: particle-move 3s infinite ease-in-out 1.5s;
      }

      .particle:nth-child(5) {
        bottom: -5px;
        left: 10px;
        background-color: #cc99ff;
        animation: particle-move 3s infinite ease-in-out 2s;
      }

      @keyframes particle-move {
        0%, 100% {
          transform: translateY(0) scale(1);
        }
        50% {
          transform: translateY(-10px) scale(1.2);
          opacity: 0.9;
        }
      }

      .chat-window {
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .chat-header {
        padding: 15px;
        background: var(--primary-color, #0066cc);
        color: var(--text-color, white);
        font-weight: bold;
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
      }

      .message {
        padding: 10px 15px;
        margin: 5px;
        border-radius: 8px;
        max-width: 80%;
      }

      .message.user {
        background-color: var(--primary-color, #0066cc);
        color: var(--text-color, white);
        margin-left: auto;
      }

      .message.ai {
        background-color: #f0f0f0;
        color: #333;
        margin-right: auto;
      }

      .error {
        color: #dc2626;
        padding: 10px;
        text-align: center;
        background: #fee2e2;
        border-radius: 4px;
        margin: 10px;
      }
    `;

    this.shadowRoot.appendChild(styles);
    await this.initializeWidget();
  }

  async initializeWidget() {
    try {
      const container = document.createElement('div');
      container.id = 'voice-convo-widget';

      const buttonWrapper = document.createElement('div');
      buttonWrapper.className = 'widget-button-wrapper float-animation';

      const button = document.createElement('button');
      button.className = 'widget-button';
      button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';

      const pulseEffect = document.createElement('div');
      pulseEffect.className = 'pulse-effect';

      const particles = document.createElement('div');
      particles.className = 'particles';
      for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particles.appendChild(particle);
      }

      buttonWrapper.appendChild(button);
      buttonWrapper.appendChild(pulseEffect);
      buttonWrapper.appendChild(particles);

      const chatWindow = document.createElement('div');
      chatWindow.className = 'chat-window';

      const chatHeader = document.createElement('div');
      chatHeader.className = 'chat-header';
      chatHeader.textContent = 'Chat Assistant';

      const chatMessages = document.createElement('div');
      chatMessages.className = 'chat-messages';

      chatWindow.appendChild(chatHeader);
      chatWindow.appendChild(chatMessages);

      button.addEventListener('click', () => {
        const isVisible = chatWindow.style.display === 'flex';
        chatWindow.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible && !this.initialized) {
          this.initializeChat(chatWindow);
          this.initialized = true;
        }
      });

      container.appendChild(buttonWrapper);
      container.appendChild(chatWindow);
      this.shadowRoot.appendChild(container);

      // Apply custom theme if provided
      this.applyTheme();
    } catch (error) {
      console.error('Failed to initialize widget:', error);
    }
  }

  async initializeChat(chatWindow) {
    try {
      const messagesContainer = chatWindow.querySelector('.chat-messages');

      // Get the script URL to determine the base URL
      const scriptUrl = document.querySelector('script[src*="widget.js"]')?.src;
      const baseUrl = scriptUrl ? new URL(scriptUrl).origin : window.location.origin;

      console.log('Initializing chat with base URL:', baseUrl);

      const response = await fetch(`${baseUrl}/api/get-signed-url`, {
        headers: {
          'Authorization': `Bearer ${this.getAttribute('api-key')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }

      const { signedUrl } = await response.json();
      console.log('Received signed URL:', signedUrl);

      const ws = new WebSocket(signedUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
          type: 'init',
          agentId: this.getAttribute('agent-id'),
          signedUrl
        }));

        // Show initial message
        this.addMessage(messagesContainer, {
          role: 'ai',
          content: 'Hello! How can I assist you today?'
        });
      };

      ws.onmessage = (event) => {
        console.log('Received message:', event.data);
        const data = JSON.parse(event.data);
        this.addMessage(messagesContainer, data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.showError(messagesContainer, 'Connection error occurred. Please try again.');
      };

      this.ws = ws;
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      this.showError(chatWindow.querySelector('.chat-messages'), 'Failed to initialize chat. Please check your credentials.');
    }
  }

  addMessage(container, message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role || 'ai'}`;
    messageElement.textContent = message.content || message.text;
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
  }

  showError(container, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error';
    errorElement.textContent = message;
    container.appendChild(errorElement);
  }

  applyTheme() {
    const theme = this.getAttribute('theme');
    if (theme) {
      try {
        const themeData = JSON.parse(theme);
        const style = this.shadowRoot.querySelector('style');
        style.textContent += `
          :host {
            --primary-color: ${themeData.primary || '#0066cc'};
            --background-color: ${themeData.background || 'white'};
            --text-color: ${themeData.text || 'white'};
          }
        `;
      } catch (error) {
        console.error('Failed to parse theme:', error);
      }
    }
  }

  disconnectedCallback() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Register the custom element
customElements.define('voice-convo-widget', VoiceConvoWidget);
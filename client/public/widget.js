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

      .widget-button {
        background-color: var(--primary-color, #0066cc);
        color: var(--text-color, white);
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
      }

      .widget-button:hover {
        transform: scale(1.05);
      }

      .chat-window {
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: var(--background-color, white);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        display: none;
        overflow: hidden;
        transition: opacity 0.3s ease;
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
        background-color: #fee;
        color: #c00;
        padding: 10px;
        margin: 10px;
        border-radius: 4px;
        font-size: 14px;
      }
    `;

    this.shadowRoot.appendChild(styles);
    await this.initializeWidget();
  }

  async initializeWidget() {
    try {
      const container = document.createElement('div');
      container.id = 'voice-convo-widget';

      const button = document.createElement('button');
      button.className = 'widget-button';
      button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';

      const chatWindow = document.createElement('div');
      chatWindow.className = 'chat-window';

      button.addEventListener('click', () => {
        const isVisible = chatWindow.style.display === 'block';
        chatWindow.style.display = isVisible ? 'none' : 'block';
        if (!isVisible && !this.initialized) {
          this.initializeChat(chatWindow);
          this.initialized = true;
        }
      });

      container.appendChild(button);
      container.appendChild(chatWindow);
      this.shadowRoot.appendChild(container);

      this.applyTheme();
    } catch (error) {
      console.error('Failed to initialize widget:', error);
    }
  }

  async initializeChat(chatWindow) {
    try {
      const apiKey = this.getAttribute('api-key');
      const agentId = this.getAttribute('agent-id');

      if (!apiKey || !agentId) {
        throw new Error('Missing required attributes: api-key and agent-id must be provided');
      }

      console.log('Initializing chat with:', { agentId });

      // Get the script URL
      const currentScript = document.currentScript || document.querySelector('script[src*="widget.js"]');
      const baseUrl = currentScript ? new URL(currentScript.src).origin : window.location.origin;
      console.log('Base URL:', baseUrl);

      const response = await fetch(`${baseUrl}/api/get-signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ agentId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const { signedUrl } = await response.json();
      console.log('Connected to WebSocket');

      const ws = new WebSocket(signedUrl);

      ws.onopen = () => {
        console.log('Connected to ElevenLabs');
        ws.send(JSON.stringify({
          type: 'init',
          agentId,
          signedUrl
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message:', data);
        this.updateChatUI(chatWindow, data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.showError(chatWindow, 'Connection error occurred. Please try again.');
      };

      ws.onclose = () => {
        console.log('Disconnected from ElevenLabs');
      };

      this.ws = ws;
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      this.showError(chatWindow, `Failed to initialize chat: ${error.message}`);
    }
  }

  updateChatUI(chatWindow, message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role || 'ai'}`;
    messageElement.textContent = message.content || message.text;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  showError(chatWindow, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'message error';
    errorElement.textContent = message;
    chatWindow.appendChild(errorElement);
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
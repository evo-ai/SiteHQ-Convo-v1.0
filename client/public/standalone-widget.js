/**
 * SiteHQ Chat Widget
 * A standalone chat widget that can be embedded on any website
 */

class SiteHQChatWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.apiKey = this.getAttribute('api-key') || '';
    this.agentId = this.getAttribute('agent-id') || '';
    this.themeAttr = this.getAttribute('theme') || '{}';
    this.theme = JSON.parse(this.themeAttr);
    this.isInitialized = false;
    this.isWidgetOpen = false;
    this.websocket = null;
    this.messages = [];
    this.primaryColor = this.theme.primary || '#5c078c';
    this.backgroundColor = this.theme.background || '#ffffff';
    this.textColor = this.theme.text || '#333333';
    this.darkMode = this.getAttribute('dark-mode') === 'true';
  }

  connectedCallback() {
    // Add stylesheet
    const styles = document.createElement('style');
    styles.textContent = this.getStyles();
    this.shadowRoot.appendChild(styles);

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'sitehq-widget-container';
    
    // Add chat bubble button
    this.chatButton = document.createElement('div');
    this.chatButton.className = 'chat-bubble';
    this.chatButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    this.chatButton.addEventListener('click', () => this.toggleWidget());
    
    // Add tooltip element
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'chat-tooltip';
    this.tooltipElement.textContent = 'Ask me anything! I\'m here to help.';
    this.tooltipElement.style.display = 'none';
    
    // Create chat window
    this.chatWindow = document.createElement('div');
    this.chatWindow.className = 'chat-window';
    this.chatWindow.style.display = 'none';
    this.chatWindow.innerHTML = `
      <div class="chat-header">
        <div class="chat-title">SiteHQ Assistant</div>
        <div class="chat-controls">
          <button class="control-button dark-mode-toggle">
            <svg class="moon-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <svg class="sun-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </button>
          <button class="control-button close-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-container">
        <div class="chat-status">
          <div class="status-indicator"></div>
          <span>Ready to chat</span>
        </div>
        <div class="input-wrapper">
          <input type="text" class="chat-input" placeholder="Type your message...">
          <button class="send-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
          <button class="mic-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="powered-by">Powered by SiteHQ</div>
    `;

    // Add particles for visual effect
    const particles = document.createElement('div');
    particles.className = 'particles';
    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particles.appendChild(particle);
    }

    // Append everything to widget container
    widgetContainer.appendChild(this.tooltipElement);
    widgetContainer.appendChild(this.chatButton);
    widgetContainer.appendChild(particles);
    widgetContainer.appendChild(this.chatWindow);
    this.shadowRoot.appendChild(widgetContainer);

    // Set up event listeners
    this.setupEventListeners();

    // Set dark mode if specified
    if (this.darkMode) {
      this.toggleDarkMode();
    }

    // Hover effect for chat bubble
    this.chatButton.addEventListener('mouseenter', () => {
      this.tooltipElement.style.display = 'block';
      setTimeout(() => {
        this.tooltipElement.style.opacity = '1';
        this.tooltipElement.style.transform = 'translateY(0)';
      }, 10);
    });

    this.chatButton.addEventListener('mouseleave', () => {
      this.tooltipElement.style.opacity = '0';
      this.tooltipElement.style.transform = 'translateY(10px)';
      setTimeout(() => {
        this.tooltipElement.style.display = 'none';
      }, 300);
    });
  }

  setupEventListeners() {
    // Close button
    const closeButton = this.chatWindow.querySelector('.close-button');
    closeButton.addEventListener('click', () => this.toggleWidget());

    // Dark mode toggle
    const darkModeToggle = this.chatWindow.querySelector('.dark-mode-toggle');
    darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

    // Send button
    const sendButton = this.chatWindow.querySelector('.send-button');
    const chatInput = this.chatWindow.querySelector('.chat-input');
    
    const sendMessage = () => {
      const message = chatInput.value.trim();
      if (message) {
        this.addMessage('user', message);
        chatInput.value = '';
        
        // Simulate typing indicator
        this.setStatus('typing');
        setTimeout(() => {
          this.setStatus('idle');
          // In a real implementation, this would be handled by the websocket response
          this.addMessage('assistant', 'Thank you for your message. For a working chat experience, please use your API key and agent ID.');
        }, 1500);
      }
    };
    
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Microphone button (simulated functionality)
    const micButton = this.chatWindow.querySelector('.mic-button');
    micButton.addEventListener('click', () => {
      this.showTermsDialog();
    });
  }

  showTermsDialog() {
    // Create terms dialog
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog-content';
    dialogContent.innerHTML = `
      <h3>Terms and conditions</h3>
      <p>By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as described in the Privacy Policy. If you do not wish to have your conversations recorded, please refrain from using this service.</p>
      <div class="dialog-actions">
        <button class="cancel-button">Cancel</button>
        <button class="agree-button">Agree</button>
      </div>
    `;
    
    dialogOverlay.appendChild(dialogContent);
    this.shadowRoot.appendChild(dialogOverlay);
    
    // Dialog buttons
    const cancelButton = dialogContent.querySelector('.cancel-button');
    const agreeButton = dialogContent.querySelector('.agree-button');
    
    cancelButton.addEventListener('click', () => {
      dialogOverlay.remove();
    });
    
    agreeButton.addEventListener('click', () => {
      dialogOverlay.remove();
      this.setStatus('listening');
      
      // Simulate microphone activity
      setTimeout(() => {
        this.setStatus('idle');
        this.addMessage('assistant', 'I heard you! In a real implementation, voice would be processed by the AI.');
      }, 3000);
    });
  }

  toggleWidget() {
    this.isWidgetOpen = !this.isWidgetOpen;
    
    if (this.isWidgetOpen) {
      this.chatWindow.style.display = 'flex';
      this.chatButton.classList.add('active');
      
      // Initialize chat if not already done
      if (!this.isInitialized) {
        this.initializeChat();
        this.isInitialized = true;
      }
    } else {
      this.chatWindow.style.display = 'none';
      this.chatButton.classList.remove('active');
    }
  }

  toggleDarkMode() {
    const container = this.shadowRoot.querySelector('.sitehq-widget-container');
    container.classList.toggle('dark-mode');
    this.darkMode = !this.darkMode;
  }

  initializeChat() {
    const messagesContainer = this.chatWindow.querySelector('.chat-messages');
    
    // Add welcome message
    this.addMessage('assistant', 'Hello! How can I assist you today?');
    
    // If API key and Agent ID are provided, we could initialize the websocket here
    if (this.apiKey && this.agentId) {
      // Initialize real chat functionality
      this.initializeRealChat();
    }
  }

  initializeRealChat() {
    // In a real implementation, this would connect to the websocket
    // and handle message sending/receiving
    try {
      // Get the script URL to determine the base URL
      const scriptUrl = document.querySelector('script[src*="standalone-widget.js"]')?.src;
      const baseUrl = scriptUrl ? new URL(scriptUrl).origin : window.location.origin;
      
      console.log('Initializing chat with base URL:', baseUrl);
      
      // This is just a placeholder - the actual implementation would:
      // 1. Get a signed URL from your server
      // 2. Connect to the websocket
      // 3. Set up message handlers
      
      // this.websocket = new WebSocket(signedUrl);
      // this.websocket.onmessage = (event) => {
      //   const data = JSON.parse(event.data);
      //   this.addMessage(data.role, data.content);
      // };
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      this.addMessage('system', 'Failed to initialize chat. Please check your credentials.');
    }
  }

  addMessage(role, content) {
    const messagesContainer = this.chatWindow.querySelector('.chat-messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${role}`;
    messageElement.textContent = content;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store message
    this.messages.push({ role, content });
  }

  setStatus(status) {
    const statusContainer = this.chatWindow.querySelector('.chat-status');
    const statusIndicator = statusContainer.querySelector('.status-indicator');
    const statusText = statusContainer.querySelector('span');
    
    statusContainer.className = 'chat-status';
    statusContainer.classList.add(`status-${status}`);
    
    switch (status) {
      case 'typing':
        statusText.textContent = 'Assistant is typing...';
        break;
      case 'listening':
        statusText.textContent = 'Listening...';
        break;
      case 'speaking':
        statusText.textContent = 'Speaking...';
        break;
      default:
        statusText.textContent = 'Ready to chat';
    }
  }

  getStyles() {
    return `
      /* Base styles */
      :host {
        --primary-color: ${this.primaryColor};
        --background-color: ${this.backgroundColor};
        --text-color: ${this.textColor};
        --dark-primary: #3a3a3a;
        --dark-background: #1f1f1f;
        --dark-text: #f0f0f0;
        --animation-duration: 0.3s;
        --border-radius: 16px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .sitehq-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-size: 16px;
      }
      
      /* Dark mode */
      .sitehq-widget-container.dark-mode {
        --primary-color: var(--dark-primary);
        --background-color: var(--dark-background);
        --text-color: var(--dark-text);
      }
      
      .sitehq-widget-container.dark-mode .chat-window {
        background-color: var(--dark-background);
        color: var(--dark-text);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      }
      
      .sitehq-widget-container.dark-mode .chat-header {
        background-color: var(--dark-primary);
      }
      
      .sitehq-widget-container.dark-mode .chat-input {
        background-color: #333;
        color: var(--dark-text);
        border-color: #444;
      }
      
      .sitehq-widget-container.dark-mode .message-assistant {
        background-color: #333;
      }
      
      .sitehq-widget-container.dark-mode .message-user {
        background-color: #555;
      }
      
      .sitehq-widget-container.dark-mode .sun-icon {
        display: block;
      }
      
      .sitehq-widget-container.dark-mode .moon-icon {
        display: none;
      }
      
      .sitehq-widget-container.dark-mode .powered-by {
        color: #888;
      }
      
      /* Chat bubble */
      .chat-bubble {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform var(--animation-duration) ease;
        color: white;
        position: relative;
        z-index: 2;
      }
      
      .chat-bubble:hover {
        transform: scale(1.1);
      }
      
      .chat-bubble.active {
        transform: scale(0.9);
      }
      
      /* Tooltip */
      .chat-tooltip {
        position: absolute;
        bottom: 70px;
        right: 0;
        background-color: white;
        color: #333;
        padding: 10px 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        max-width: 200px;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity var(--animation-duration) ease, transform var(--animation-duration) ease;
        pointer-events: none;
      }
      
      /* Particles for visual effect */
      .particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 60px;
        height: 60px;
        pointer-events: none;
      }
      
      .particle {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ffcc00;
        opacity: 0.7;
        animation: float 3s infinite ease-in-out;
      }
      
      .particle:nth-child(1) {
        top: -5px;
        right: 10px;
        background-color: #ffcc00;
        animation-delay: 0s;
      }
      
      .particle:nth-child(2) {
        top: 10px;
        right: -5px;
        background-color: #ff6699;
        animation-delay: 0.5s;
      }
      
      .particle:nth-child(3) {
        bottom: 10px;
        right: -5px;
        background-color: #66ccff;
        animation-delay: 1s;
      }
      
      .particle:nth-child(4) {
        bottom: -5px;
        right: 10px;
        background-color: #99ff99;
        animation-delay: 1.5s;
      }
      
      .particle:nth-child(5) {
        bottom: -5px;
        left: 10px;
        background-color: #cc99ff;
        animation-delay: 2s;
      }
      
      @keyframes float {
        0%, 100% {
          transform: translateY(0) scale(1);
        }
        50% {
          transform: translateY(-10px) scale(1.2);
          opacity: 0.9;
        }
      }
      
      /* Chat window */
      .chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 350px;
        height: 500px;
        background-color: white;
        border-radius: var(--border-radius);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform var(--animation-duration) ease, opacity var(--animation-duration) ease;
      }
      
      /* Chat header */
      .chat-header {
        padding: 15px;
        background-color: var(--primary-color);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chat-title {
        font-weight: bold;
        font-size: 16px;
      }
      
      .chat-controls {
        display: flex;
        gap: 8px;
      }
      
      .control-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      
      .control-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .sun-icon {
        display: none;
      }
      
      /* Chat messages */
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .message {
        padding: 10px 15px;
        border-radius: 8px;
        max-width: 80%;
        word-break: break-word;
      }
      
      .message-user {
        background-color: var(--primary-color);
        color: white;
        margin-left: auto;
      }
      
      .message-assistant {
        background-color: #f0f0f0;
        color: #333;
        margin-right: auto;
      }
      
      .message-system {
        background-color: #fff4f4;
        color: #e74c3c;
        margin: 0 auto;
        text-align: center;
      }
      
      /* Chat input */
      .chat-input-container {
        padding: 10px 15px;
        border-top: 1px solid #eee;
      }
      
      .chat-status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #666;
      }
      
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #22c55e;
      }
      
      .status-typing .status-indicator {
        background-color: #3b82f6;
        animation: pulse 1.5s infinite;
      }
      
      .status-listening .status-indicator {
        background-color: #22c55e;
        animation: pulse 1.5s infinite;
      }
      
      .status-speaking .status-indicator {
        background-color: #f59e0b;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      
      .input-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .chat-input {
        flex: 1;
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
      }
      
      .chat-input:focus {
        border-color: var(--primary-color);
      }
      
      .send-button, .mic-button {
        background: none;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
      }
      
      /* Powered by */
      .powered-by {
        text-align: center;
        padding: 8px;
        font-size: 12px;
        color: #999;
      }
      
      /* Dialog */
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      
      .dialog-content {
        background-color: white;
        border-radius: var(--border-radius);
        padding: 20px;
        max-width: 400px;
        width: 90%;
      }
      
      .dialog-content h3 {
        margin-top: 0;
        margin-bottom: 10px;
      }
      
      .dialog-content p {
        font-size: 14px;
        line-height: 1.5;
        color: #555;
      }
      
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      
      .dialog-actions button {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      }
      
      .cancel-button {
        background-color: white;
        border: 1px solid #ddd;
        color: #555;
      }
      
      .agree-button {
        background-color: var(--primary-color);
        border: none;
        color: white;
      }
    `;
  }

  disconnectedCallback() {
    // Clean up websocket connection if it exists
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// Register custom element
customElements.define('sitehq-chat-widget', SiteHQChatWidget);

// Function to insert widget script into the page, which is necessary to avoid
// requiring the user to manually add the script tag
(function() {
  // Auto-initialize
  const autoInitialize = () => {
    // If site has opted-in to auto-initialization
    const autoInit = document.querySelector('script[data-sitehq-auto="true"]');
    if (autoInit) {
      // Find configuration from script tag
      const apiKey = autoInit.getAttribute('data-api-key') || '';
      const agentId = autoInit.getAttribute('data-agent-id') || '';
      const theme = autoInit.getAttribute('data-theme') || '{}';
      const darkMode = autoInit.getAttribute('data-dark-mode') || 'false';
      
      // Create and append widget element
      const widgetElement = document.createElement('sitehq-chat-widget');
      widgetElement.setAttribute('api-key', apiKey);
      widgetElement.setAttribute('agent-id', agentId);
      widgetElement.setAttribute('theme', theme);
      widgetElement.setAttribute('dark-mode', darkMode);
      document.body.appendChild(widgetElement);
    }
  };
  
  // Run auto-initialization when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    autoInitialize();
  }
})();
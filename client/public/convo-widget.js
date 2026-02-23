/**
 * Convo Chat Widget
 * A standalone chat widget that can be embedded on any website
 */

(function() {
  // Constants
  const DEFAULT_THEME = {
    primary: '#5c078c',
    background: '#ffffff',
    text: '#333333'
  };

  // Configuration - will be extracted from data attributes or defaults
  let config = {
    apiKey: 'demo-key',
    agentId: 'demo-agent',
    theme: DEFAULT_THEME,
    autoInit: false,
    darkMode: false,
    buttonText: 'Chat with AI',
    widgetTitle: 'AI Assistant'
  };

  // Widget state
  let state = {
    isOpen: false,
    isInitialized: false,
    messages: [],
    isLoading: false,
    connection: null,
    acceptedTerms: false,
    lastUserMessageTimestamp: null
  };

  class ConvoChatWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      
      // Extract configuration from attributes
      const apiKey = this.getAttribute('api-key') || config.apiKey;
      const agentId = this.getAttribute('agent-id') || config.agentId;
      const themeStr = this.getAttribute('theme');
      const darkMode = this.getAttribute('dark-mode') === 'true';
      const title = this.getAttribute('title') || config.widgetTitle;
      
      // Parse theme if provided
      let theme = config.theme;
      if (themeStr) {
        try {
          theme = JSON.parse(themeStr);
        } catch (e) {
          console.warn('Convo Widget: Invalid theme JSON, using default theme');
        }
      }
      
      // Update config
      config = {
        ...config,
        apiKey,
        agentId,
        theme,
        darkMode,
        widgetTitle: title
      };
      
      // Initialize the widget
      this.render();
      this.setupEventListeners();
    }
    
    connectedCallback() {
      // Widget is now in the DOM
      console.log('Convo Chat Widget: Connected to DOM');
    }
    
    setupEventListeners() {
      const shadow = this.shadowRoot;
      
      // Toggle chat button
      const toggleBtn = shadow.getElementById('convo-toggle-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggleWidget());
      }
      
      // Close button
      const closeBtn = shadow.getElementById('convo-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.toggleWidget());
      }
      
      // Send message button and input
      const sendBtn = shadow.getElementById('convo-send-btn');
      const messageInput = shadow.getElementById('convo-message-input');
      
      if (sendBtn && messageInput) {
        // Send on button click
        sendBtn.addEventListener('click', () => {
          const message = messageInput.value.trim();
          if (message) {
            this.sendMessage(message);
            messageInput.value = '';
          }
        });
        
        // Send on Enter key
        messageInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = messageInput.value.trim();
            if (message) {
              this.sendMessage(message);
              messageInput.value = '';
            }
          }
        });
      }
      
      // Dark mode toggle
      const darkModeToggle = shadow.getElementById('convo-dark-mode-toggle');
      if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
      }
      
      // Accept terms button
      const acceptTermsBtn = shadow.getElementById('convo-accept-terms');
      if (acceptTermsBtn) {
        acceptTermsBtn.addEventListener('click', () => {
          state.acceptedTerms = true;
          this.initializeRealChat();
          
          // Hide terms dialog
          const termsDialog = shadow.getElementById('convo-terms-dialog');
          if (termsDialog) {
            termsDialog.style.display = 'none';
          }
        });
      }
    }
    
    showTermsDialog() {
      const shadow = this.shadowRoot;
      const termsDialog = shadow.getElementById('convo-terms-dialog');
      if (termsDialog) {
        termsDialog.style.display = 'flex';
      }
    }
    
    toggleWidget() {
      state.isOpen = !state.isOpen;
      
      const shadow = this.shadowRoot;
      const chatWindow = shadow.getElementById('convo-chat-window');
      const toggleBtn = shadow.getElementById('convo-toggle-btn');
      
      if (chatWindow && toggleBtn) {
        if (state.isOpen) {
          chatWindow.style.display = 'flex';
          toggleBtn.style.display = 'none';
          
          // Initialize chat if not already done
          if (!state.isInitialized) {
            this.initializeChat();
          }
          
          // Focus input
          setTimeout(() => {
            const messageInput = shadow.getElementById('convo-message-input');
            if (messageInput) {
              messageInput.focus();
            }
          }, 300);
        } else {
          chatWindow.style.display = 'none';
          toggleBtn.style.display = 'flex';
        }
      }
    }
    
    toggleDarkMode() {
      config.darkMode = !config.darkMode;
      
      const shadow = this.shadowRoot;
      const chatContainer = shadow.getElementById('convo-container');
      
      if (chatContainer) {
        if (config.darkMode) {
          chatContainer.classList.add('convo-dark-mode');
        } else {
          chatContainer.classList.remove('convo-dark-mode');
        }
      }
    }
    
    initializeChat() {
      if (state.isInitialized) return;
      
      this.showTermsDialog();
      state.isInitialized = true;
    }
    
    initializeRealChat() {
      try {
        // Get DOM elements
        const shadow = this.shadowRoot;
        const messagesContainer = shadow.getElementById('convo-messages');
        
        // Add initial greeting message
        this.addMessage('assistant', 'Hello! How can I assist you today?');
        
        // Initialize WebSocket connection
        const baseUrl = window.location.origin;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/api/chat`;
        
        state.connection = new WebSocket(wsUrl);
        
        state.connection.onopen = () => {
          console.log('Convo Chat: WebSocket connection established');
          this.setStatus('connected');
          
          // Send initialization message with API key and agent ID
          state.connection.send(JSON.stringify({
            type: 'init',
            apiKey: config.apiKey,
            agentId: config.agentId
          }));
        };
        
        state.connection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'message') {
              this.addMessage('assistant', data.content);
            } else if (data.type === 'status') {
              this.setStatus(data.status);
            } else if (data.type === 'error') {
              console.error('Convo Chat: Error from server:', data.message);
              this.addMessage('assistant', `Sorry, there was an error: ${data.message}`);
            }
          } catch (error) {
            console.error('Convo Chat: Error parsing message:', error);
          }
        };
        
        state.connection.onclose = () => {
          console.log('Convo Chat: WebSocket connection closed');
          this.setStatus('disconnected');
        };
        
        state.connection.onerror = (error) => {
          console.error('Convo Chat: WebSocket error:', error);
          this.setStatus('error');
        };
      } catch (error) {
        console.error('Convo Chat: Initialization error:', error);
      }
    }
    
    sendMessage(content) {
      if (!content || !state.connection) return;
      
      // Add user message to UI
      this.addMessage('user', content);
      
      // Set typing indicator
      this.setStatus('typing');
      
      // Record timestamp to measure response time
      state.lastUserMessageTimestamp = Date.now();
      
      // Send message to server
      state.connection.send(JSON.stringify({
        type: 'message',
        content
      }));
    }
    
    addMessage(role, content) {
      const shadow = this.shadowRoot;
      const messagesContainer = shadow.getElementById('convo-messages');
      
      if (!messagesContainer) return;
      
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.className = `convo-message convo-${role}-message`;
      
      // Message bubble
      const bubble = document.createElement('div');
      bubble.className = 'convo-message-bubble';
      bubble.textContent = content;
      
      // Apply theme
      if (role === 'assistant') {
        bubble.style.backgroundColor = config.theme.primary;
        bubble.style.color = '#ffffff';
      }
      
      messageElement.appendChild(bubble);
      messagesContainer.appendChild(messageElement);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    setStatus(status) {
      const shadow = this.shadowRoot;
      const statusIndicator = shadow.getElementById('convo-status');
      const typingIndicator = shadow.getElementById('convo-typing-indicator');
      
      if (!statusIndicator || !typingIndicator) return;
      
      switch (status) {
        case 'connected':
          statusIndicator.textContent = 'Connected';
          statusIndicator.className = 'convo-status convo-status-connected';
          typingIndicator.style.display = 'none';
          break;
        case 'disconnected':
          statusIndicator.textContent = 'Disconnected';
          statusIndicator.className = 'convo-status convo-status-disconnected';
          typingIndicator.style.display = 'none';
          break;
        case 'typing':
          statusIndicator.textContent = '';
          typingIndicator.style.display = 'flex';
          break;
        case 'error':
          statusIndicator.textContent = 'Error';
          statusIndicator.className = 'convo-status convo-status-error';
          typingIndicator.style.display = 'none';
          break;
        default:
          statusIndicator.textContent = '';
          typingIndicator.style.display = 'none';
      }
    }
    
    render() {
      // Apply any initial state, like dark mode
      const darkModeClass = config.darkMode ? 'convo-dark-mode' : '';
      
      // Generate widget HTML
      this.shadowRoot.innerHTML = `
        <style>
          ${this.getStyles()}
        </style>
        
        <div id="convo-container" class="convo-container ${darkModeClass}">
          <!-- Terms Dialog -->
          <div id="convo-terms-dialog" class="convo-terms-dialog">
            <div class="convo-terms-content">
              <h3>Terms & Conditions</h3>
              <p>
                By using this chat service, you agree that your conversations will be processed and stored to improve the quality of responses. 
                Your data will be handled according to our privacy policy.
              </p>
              <button id="convo-accept-terms" class="convo-button convo-primary-button">
                Accept & Continue
              </button>
            </div>
          </div>
          
          <!-- Toggle Button -->
          <button id="convo-toggle-btn" class="convo-toggle-button" aria-label="Toggle chat">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 11.5C21 16.1944 16.9706 20 12 20C10.9 20 9.83943 19.8325 8.85145 19.5247C8.17238 19.3139 7.8323 19.2083 7.68265 19.2292C7.53301 19.25 7.31884 19.3693 6.88694 19.6084L4.8 20.8L4.3636 20.9964C4.01558 21.1495 3.84157 21.2261 3.67736 21.2433C3.38636 21.2725 3.09829 21.1872 2.87926 21.0113C2.79366 20.9488 2.72192 20.8663 2.5764 20.7055C2.19781 20.2685 2.18538 19.6598 2.54001 19.2082L3 18.6462L4.09513 17.2981C4.25177 17.1069 4.33008 17.0113 4.38058 16.9031C4.43108 16.795 4.4473 16.6716 4.47097 16.4224C4.49464 16.1732 4.45304 15.9049 4.37088 15.3755C4.12225 13.7754 4 13 4 11.5C4 6.80558 8.02944 3 13 3C17.9706 3 21 6.80558 21 11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <!-- Chat Window -->
          <div id="convo-chat-window" class="convo-chat-window">
            <!-- Header -->
            <div class="convo-header">
              <div class="convo-header-content">
                <div class="convo-header-title">${config.widgetTitle}</div>
                <div id="convo-status" class="convo-status"></div>
              </div>
              <div class="convo-header-actions">
                <button id="convo-dark-mode-toggle" class="convo-icon-button" aria-label="Toggle dark mode">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 2V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 20V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M4.93 4.93L6.34 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M17.66 17.66L19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6.34 17.66L4.93 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19.07 4.93L17.66 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button id="convo-close-btn" class="convo-icon-button" aria-label="Close chat">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Messages Container -->
            <div id="convo-messages" class="convo-messages"></div>
            
            <!-- Typing Indicator -->
            <div id="convo-typing-indicator" class="convo-typing-indicator">
              <div class="convo-typing-dot"></div>
              <div class="convo-typing-dot"></div>
              <div class="convo-typing-dot"></div>
            </div>
            
            <!-- Input Area -->
            <div class="convo-input-area">
              <textarea 
                id="convo-message-input" 
                class="convo-message-input" 
                placeholder="Type your message..." 
                rows="1"
              ></textarea>
              <button id="convo-send-btn" class="convo-send-button" aria-label="Send message">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.3009 13.6948L20.102 3.89844M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.5698 20.4379 14.8447 20.2747C15.1585 20.0849 15.3551 19.5183 15.7482 18.385L19.559 6.31857C19.9067 5.29877 20.0806 4.78887 19.9522 4.4044C19.8395 4.06634 19.5879 3.79171 19.2585 3.65265C18.8847 3.49507 18.3435 3.6255 17.2612 3.88635L5.19472 7.69712C4.06146 8.09024 3.49483 8.28679 3.30507 8.6006C3.14185 8.87552 3.11913 9.20591 3.24411 9.49952C3.3881 9.83787 3.9252 10.1063 4.9994 10.6434L9.44428 12.8658C9.60689 12.9474 9.68819 12.9882 9.75121 13.0491C9.80737 13.1037 9.85128 13.1711 9.87984 13.2465C9.91242 13.3317 9.91242 13.4267 9.91242 13.6167V17.0271C9.91242 18.5118 9.91242 19.2542 10.1433 19.518C10.3446 19.747 10.651 19.8486 10.9352 19.7782C11.2609 19.6982 11.5836 19.1225 12.2291 17.971L13.773 15.3486" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            
            <!-- Footer -->
            <div class="convo-footer">
              <div class="convo-footer-text">Powered by Convo</div>
            </div>
          </div>
        </div>
      `;
    }
    
    getStyles() {
      return `
        /* Base styles */
        :host {
          --convo-primary: ${config.theme.primary};
          --convo-background: ${config.theme.background};
          --convo-text: ${config.theme.text};
          --convo-light-gray: #f0f0f0;
          --convo-gray: #aaaaaa;
          --convo-dark-gray: #666666;
          --convo-border-radius: 12px;
          --convo-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          --convo-transition: all 0.3s ease;
          --convo-padding: 16px;
          
          /* Dark mode variables */
          --convo-dark-background: #1e1e2e;
          --convo-dark-secondary: #2a2a3a;
          --convo-dark-text: #e0e0e0;
          --convo-dark-input: #2a2a3a;
          
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          font-size: 16px;
          line-height: 1.6;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .convo-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
        }
        
        /* Toggle Button */
        .convo-toggle-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: var(--convo-primary);
          color: white;
          border: none;
          box-shadow: var(--convo-shadow);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--convo-transition);
          animation: convo-float 2s ease-in-out infinite;
        }
        
        .convo-toggle-button:hover {
          transform: scale(1.05);
        }
        
        @keyframes convo-float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        
        /* Chat Window */
        .convo-chat-window {
          display: none;
          flex-direction: column;
          width: 380px;
          height: 550px;
          background-color: var(--convo-background);
          border-radius: var(--convo-border-radius);
          box-shadow: var(--convo-shadow);
          overflow: hidden;
          animation: convo-slide-up 0.3s ease-out;
        }
        
        @keyframes convo-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Header */
        .convo-header {
          background-color: var(--convo-primary);
          color: white;
          padding: var(--convo-padding);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .convo-header-content {
          display: flex;
          flex-direction: column;
        }
        
        .convo-header-title {
          font-weight: bold;
          font-size: 1.1rem;
        }
        
        .convo-header-actions {
          display: flex;
          gap: 8px;
        }
        
        .convo-icon-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: var(--convo-transition);
        }
        
        .convo-icon-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        /* Status */
        .convo-status {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        
        .convo-status-connected {
          color: #4caf50;
        }
        
        .convo-status-disconnected {
          color: #f44336;
        }
        
        .convo-status-error {
          color: #f44336;
        }
        
        /* Messages */
        .convo-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--convo-padding);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .convo-message {
          display: flex;
          flex-direction: column;
          max-width: 85%;
        }
        
        .convo-user-message {
          align-self: flex-end;
        }
        
        .convo-assistant-message {
          align-self: flex-start;
        }
        
        .convo-message-bubble {
          padding: 10px 14px;
          border-radius: 18px;
          word-break: break-word;
        }
        
        .convo-user-message .convo-message-bubble {
          background-color: #e0e0e0;
          color: var(--convo-text);
          border-bottom-right-radius: 4px;
        }
        
        .convo-assistant-message .convo-message-bubble {
          background-color: var(--convo-primary);
          color: white;
          border-bottom-left-radius: 4px;
        }
        
        /* Typing Indicator */
        .convo-typing-indicator {
          display: none;
          align-items: center;
          margin: 0 var(--convo-padding);
          margin-bottom: 10px;
          gap: 4px;
        }
        
        .convo-typing-dot {
          width: 8px;
          height: 8px;
          background-color: var(--convo-primary);
          border-radius: 50%;
          opacity: 0.6;
          animation: convo-typing-dot 1.5s infinite ease-in-out;
        }
        
        .convo-typing-dot:nth-child(1) {
          animation-delay: 0s;
        }
        
        .convo-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .convo-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes convo-typing-dot {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-6px);
          }
        }
        
        /* Input Area */
        .convo-input-area {
          padding: var(--convo-padding);
          display: flex;
          gap: 10px;
          border-top: 1px solid var(--convo-light-gray);
        }
        
        .convo-message-input {
          flex: 1;
          border: 1px solid var(--convo-light-gray);
          border-radius: 24px;
          padding: 12px 16px;
          resize: none;
          outline: none;
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--convo-text);
          transition: var(--convo-transition);
        }
        
        .convo-message-input:focus {
          border-color: var(--convo-primary);
        }
        
        .convo-send-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--convo-primary);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--convo-transition);
        }
        
        .convo-send-button:hover {
          opacity: 0.9;
        }
        
        .convo-send-button svg {
          width: 18px;
          height: 18px;
        }
        
        /* Footer */
        .convo-footer {
          padding: 8px var(--convo-padding);
          text-align: center;
          font-size: 0.8rem;
          color: var(--convo-gray);
          border-top: 1px solid var(--convo-light-gray);
        }
        
        /* Terms Dialog */
        .convo-terms-dialog {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 10;
          border-radius: var(--convo-border-radius);
        }
        
        .convo-terms-content {
          background-color: var(--convo-background);
          padding: 24px;
          border-radius: 8px;
          max-width: 90%;
          text-align: center;
        }
        
        .convo-terms-content h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: var(--convo-text);
        }
        
        .convo-terms-content p {
          margin-bottom: 24px;
          font-size: 0.9rem;
          color: var(--convo-dark-gray);
        }
        
        .convo-button {
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--convo-transition);
          border: none;
        }
        
        .convo-primary-button {
          background-color: var(--convo-primary);
          color: white;
        }
        
        .convo-primary-button:hover {
          opacity: 0.9;
        }
        
        /* Dark Mode */
        .convo-dark-mode .convo-chat-window {
          background-color: var(--convo-dark-background);
          color: var(--convo-dark-text);
        }
        
        .convo-dark-mode .convo-input-area {
          border-top-color: var(--convo-dark-secondary);
        }
        
        .convo-dark-mode .convo-message-input {
          background-color: var(--convo-dark-input);
          border-color: var(--convo-dark-secondary);
          color: var(--convo-dark-text);
        }
        
        .convo-dark-mode .convo-user-message .convo-message-bubble {
          background-color: var(--convo-dark-secondary);
          color: var(--convo-dark-text);
        }
        
        .convo-dark-mode .convo-footer {
          border-top-color: var(--convo-dark-secondary);
        }
        
        .convo-dark-mode .convo-terms-content {
          background-color: var(--convo-dark-background);
        }
        
        .convo-dark-mode .convo-terms-content h3 {
          color: var(--convo-dark-text);
        }
        
        .convo-dark-mode .convo-terms-content p {
          color: var(--convo-dark-text);
          opacity: 0.8;
        }
        
        /* Mobile Responsive */
        @media (max-width: 480px) {
          .convo-chat-window {
            width: calc(100vw - 40px);
            height: 80vh;
            max-height: 600px;
          }
          
          .convo-container {
            right: 50%;
            transform: translateX(50%);
          }
        }
      `;
    }
    
    disconnectedCallback() {
      // Cleanup when widget is removed from the DOM
      if (state.connection) {
        state.connection.close();
      }
    }
  }
  
  // Define the custom element
  if (!customElements.get('convo-chat-widget')) {
    customElements.define('convo-chat-widget', ConvoChatWidget);
  }
  
  // Auto initialization if specified via data attribute
  function initialize() {
    const scripts = document.querySelectorAll('script[data-auto-init]');
    
    scripts.forEach(script => {
      // Extract configuration from data attributes
      const apiKey = script.getAttribute('data-api-key');
      const agentId = script.getAttribute('data-agent-id');
      const themeAttr = script.getAttribute('data-theme');
      const darkMode = script.getAttribute('data-dark-mode') === 'true';
      const title = script.getAttribute('data-title');
      
      // Parse theme if provided
      let theme = DEFAULT_THEME;
      if (themeAttr) {
        try {
          theme = JSON.parse(themeAttr);
        } catch (e) {
          console.warn('Convo Widget: Invalid theme JSON, using default theme');
        }
      }
      
      // Create and append the widget element
      const widget = document.createElement('convo-chat-widget');
      
      // Set attributes
      if (apiKey) widget.setAttribute('api-key', apiKey);
      if (agentId) widget.setAttribute('agent-id', agentId);
      if (title) widget.setAttribute('title', title);
      if (themeAttr) widget.setAttribute('theme', themeAttr);
      if (darkMode) widget.setAttribute('dark-mode', 'true');
      
      document.body.appendChild(widget);
    });
  }
  
  // Initialize on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
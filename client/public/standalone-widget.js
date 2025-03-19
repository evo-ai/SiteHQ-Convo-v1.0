/**
 * SiteHQ Chat Widget
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
    widgetTitle: 'SiteHQ Assistant'
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

  class SiteHQChatWidget extends HTMLElement {
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
          console.warn('SiteHQ Widget: Invalid theme JSON, using default theme');
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
      console.log('SiteHQ Chat Widget: Connected to DOM');
    }
    
    setupEventListeners() {
      const shadow = this.shadowRoot;
      
      // Toggle chat button
      const toggleBtn = shadow.getElementById('sitehq-toggle-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggleWidget());
      }
      
      // Close button
      const closeBtn = shadow.getElementById('sitehq-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.toggleWidget());
      }
      
      // Send message button and input
      const sendBtn = shadow.getElementById('sitehq-send-btn');
      const messageInput = shadow.getElementById('sitehq-message-input');
      
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
      const darkModeToggle = shadow.getElementById('sitehq-dark-mode-toggle');
      if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
      }
      
      // Accept terms button
      const acceptTermsBtn = shadow.getElementById('sitehq-accept-terms');
      if (acceptTermsBtn) {
        acceptTermsBtn.addEventListener('click', () => {
          state.acceptedTerms = true;
          this.initializeRealChat();
          
          // Hide terms dialog
          const termsDialog = shadow.getElementById('sitehq-terms-dialog');
          if (termsDialog) {
            termsDialog.style.display = 'none';
          }
        });
      }
    }
    
    showTermsDialog() {
      const shadow = this.shadowRoot;
      const termsDialog = shadow.getElementById('sitehq-terms-dialog');
      if (termsDialog) {
        termsDialog.style.display = 'flex';
      }
    }
    
    toggleWidget() {
      state.isOpen = !state.isOpen;
      
      const shadow = this.shadowRoot;
      const chatWindow = shadow.getElementById('sitehq-chat-window');
      const toggleBtn = shadow.getElementById('sitehq-toggle-btn');
      
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
            const messageInput = shadow.getElementById('sitehq-message-input');
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
      const chatContainer = shadow.getElementById('sitehq-container');
      
      if (chatContainer) {
        if (config.darkMode) {
          chatContainer.classList.add('sitehq-dark-mode');
        } else {
          chatContainer.classList.remove('sitehq-dark-mode');
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
        const messagesContainer = shadow.getElementById('sitehq-messages');
        
        // Add initial greeting message
        this.addMessage('assistant', 'Hello! How can I assist you today?');
        
        // Initialize WebSocket connection
        const baseUrl = window.location.origin;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/api/chat`;
        
        state.connection = new WebSocket(wsUrl);
        
        state.connection.onopen = () => {
          console.log('SiteHQ Chat: WebSocket connection established');
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
              console.error('SiteHQ Chat: Error from server:', data.message);
              this.addMessage('assistant', `Sorry, there was an error: ${data.message}`);
            }
          } catch (error) {
            console.error('SiteHQ Chat: Error parsing message:', error);
          }
        };
        
        state.connection.onclose = () => {
          console.log('SiteHQ Chat: WebSocket connection closed');
          this.setStatus('disconnected');
        };
        
        state.connection.onerror = (error) => {
          console.error('SiteHQ Chat: WebSocket error:', error);
          this.setStatus('error');
        };
      } catch (error) {
        console.error('SiteHQ Chat: Initialization error:', error);
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
      const messagesContainer = shadow.getElementById('sitehq-messages');
      
      if (!messagesContainer) return;
      
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.className = `sitehq-message sitehq-${role}-message`;
      
      // Message bubble
      const bubble = document.createElement('div');
      bubble.className = 'sitehq-message-bubble';
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
      const statusIndicator = shadow.getElementById('sitehq-status');
      const typingIndicator = shadow.getElementById('sitehq-typing-indicator');
      
      if (!statusIndicator || !typingIndicator) return;
      
      switch (status) {
        case 'connected':
          statusIndicator.textContent = 'Connected';
          statusIndicator.className = 'sitehq-status sitehq-status-connected';
          typingIndicator.style.display = 'none';
          break;
        case 'disconnected':
          statusIndicator.textContent = 'Disconnected';
          statusIndicator.className = 'sitehq-status sitehq-status-disconnected';
          typingIndicator.style.display = 'none';
          break;
        case 'typing':
          statusIndicator.textContent = '';
          typingIndicator.style.display = 'flex';
          break;
        case 'error':
          statusIndicator.textContent = 'Error';
          statusIndicator.className = 'sitehq-status sitehq-status-error';
          typingIndicator.style.display = 'none';
          break;
        default:
          statusIndicator.textContent = '';
          typingIndicator.style.display = 'none';
      }
    }
    
    render() {
      // Apply any initial state, like dark mode
      const darkModeClass = config.darkMode ? 'sitehq-dark-mode' : '';
      
      // Generate widget HTML
      this.shadowRoot.innerHTML = `
        <style>
          ${this.getStyles()}
        </style>
        
        <div id="sitehq-container" class="sitehq-container ${darkModeClass}">
          <!-- Terms Dialog -->
          <div id="sitehq-terms-dialog" class="sitehq-terms-dialog">
            <div class="sitehq-terms-content">
              <h3>Terms & Conditions</h3>
              <p>
                By using this chat service, you agree that your conversations will be processed and stored to improve the quality of responses. 
                Your data will be handled according to our privacy policy.
              </p>
              <button id="sitehq-accept-terms" class="sitehq-button sitehq-primary-button">
                Accept & Continue
              </button>
            </div>
          </div>
          
          <!-- Toggle Button -->
          <button id="sitehq-toggle-btn" class="sitehq-toggle-button" aria-label="Toggle chat">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 11.5C21 16.1944 16.9706 20 12 20C10.9 20 9.83943 19.8325 8.85145 19.5247C8.17238 19.3139 7.8323 19.2083 7.68265 19.2292C7.53301 19.25 7.31884 19.3693 6.88694 19.6084L4.8 20.8L4.3636 20.9964C4.01558 21.1495 3.84157 21.2261 3.67736 21.2433C3.38636 21.2725 3.09829 21.1872 2.87926 21.0113C2.79366 20.9488 2.72192 20.8663 2.5764 20.7055C2.19781 20.2685 2.18538 19.6598 2.54001 19.2082L3 18.6462L4.09513 17.2981C4.25177 17.1069 4.33008 17.0113 4.38058 16.9031C4.43108 16.795 4.4473 16.6716 4.47097 16.4224C4.49464 16.1732 4.45304 15.9049 4.37088 15.3755C4.12225 13.7754 4 13 4 11.5C4 6.80558 8.02944 3 13 3C17.9706 3 21 6.80558 21 11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <!-- Chat Window -->
          <div id="sitehq-chat-window" class="sitehq-chat-window">
            <!-- Header -->
            <div class="sitehq-header">
              <div class="sitehq-header-content">
                <div class="sitehq-header-title">${config.widgetTitle}</div>
                <div id="sitehq-status" class="sitehq-status"></div>
              </div>
              <div class="sitehq-header-actions">
                <button id="sitehq-dark-mode-toggle" class="sitehq-icon-button" aria-label="Toggle dark mode">
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
                <button id="sitehq-close-btn" class="sitehq-icon-button" aria-label="Close chat">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Messages Container -->
            <div id="sitehq-messages" class="sitehq-messages"></div>
            
            <!-- Typing Indicator -->
            <div id="sitehq-typing-indicator" class="sitehq-typing-indicator">
              <div class="sitehq-typing-dot"></div>
              <div class="sitehq-typing-dot"></div>
              <div class="sitehq-typing-dot"></div>
            </div>
            
            <!-- Input Area -->
            <div class="sitehq-input-area">
              <textarea 
                id="sitehq-message-input" 
                class="sitehq-message-input" 
                placeholder="Type your message..." 
                rows="1"
              ></textarea>
              <button id="sitehq-send-btn" class="sitehq-send-button" aria-label="Send message">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.3009 13.6948L20.102 3.89844M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.5698 20.4379 14.8447 20.2747C15.1585 20.0849 15.3551 19.5183 15.7482 18.385L19.559 6.31857C19.9067 5.29877 20.0806 4.78887 19.9522 4.4044C19.8395 4.06634 19.5879 3.79171 19.2585 3.65265C18.8847 3.49507 18.3435 3.6255 17.2612 3.88635L5.19472 7.69712C4.06146 8.09024 3.49483 8.28679 3.30507 8.6006C3.14185 8.87552 3.11913 9.20591 3.24411 9.49952C3.3881 9.83787 3.9252 10.1063 4.9994 10.6434L9.44428 12.8658C9.60689 12.9474 9.68819 12.9882 9.75121 13.0491C9.80737 13.1037 9.85128 13.1711 9.87984 13.2465C9.91242 13.3317 9.91242 13.4267 9.91242 13.6167V17.0271C9.91242 18.5118 9.91242 19.2542 10.1433 19.518C10.3446 19.747 10.651 19.8486 10.9352 19.7782C11.2609 19.6982 11.5836 19.1225 12.2291 17.971L13.773 15.3486" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            
            <!-- Footer -->
            <div class="sitehq-footer">
              <div class="sitehq-footer-text">Powered by SiteHQ</div>
            </div>
          </div>
        </div>
      `;
    }
    
    getStyles() {
      return `
        /* Base styles */
        :host {
          --sitehq-primary: ${config.theme.primary};
          --sitehq-background: ${config.theme.background};
          --sitehq-text: ${config.theme.text};
          --sitehq-light-gray: #f0f0f0;
          --sitehq-gray: #aaaaaa;
          --sitehq-dark-gray: #666666;
          --sitehq-border-radius: 12px;
          --sitehq-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          --sitehq-transition: all 0.3s ease;
          --sitehq-padding: 16px;
          
          /* Dark mode variables */
          --sitehq-dark-background: #1e1e2e;
          --sitehq-dark-secondary: #2a2a3a;
          --sitehq-dark-text: #e0e0e0;
          --sitehq-dark-input: #2a2a3a;
          
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          font-size: 16px;
          line-height: 1.6;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .sitehq-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
        }
        
        /* Toggle Button */
        .sitehq-toggle-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: var(--sitehq-primary);
          color: white;
          border: none;
          box-shadow: var(--sitehq-shadow);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--sitehq-transition);
          animation: sitehq-float 2s ease-in-out infinite;
        }
        
        .sitehq-toggle-button:hover {
          transform: scale(1.05);
        }
        
        @keyframes sitehq-float {
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
        .sitehq-chat-window {
          display: none;
          flex-direction: column;
          width: 380px;
          height: 550px;
          background-color: var(--sitehq-background);
          border-radius: var(--sitehq-border-radius);
          box-shadow: var(--sitehq-shadow);
          overflow: hidden;
          animation: sitehq-slide-up 0.3s ease-out;
        }
        
        @keyframes sitehq-slide-up {
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
        .sitehq-header {
          background-color: var(--sitehq-primary);
          color: white;
          padding: var(--sitehq-padding);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .sitehq-header-content {
          display: flex;
          flex-direction: column;
        }
        
        .sitehq-header-title {
          font-weight: bold;
          font-size: 1.1rem;
        }
        
        .sitehq-header-actions {
          display: flex;
          gap: 8px;
        }
        
        .sitehq-icon-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: var(--sitehq-transition);
        }
        
        .sitehq-icon-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        /* Status */
        .sitehq-status {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        
        .sitehq-status-connected {
          color: #4caf50;
        }
        
        .sitehq-status-disconnected {
          color: #f44336;
        }
        
        .sitehq-status-error {
          color: #f44336;
        }
        
        /* Messages */
        .sitehq-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--sitehq-padding);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .sitehq-message {
          display: flex;
          flex-direction: column;
          max-width: 85%;
        }
        
        .sitehq-user-message {
          align-self: flex-end;
        }
        
        .sitehq-assistant-message {
          align-self: flex-start;
        }
        
        .sitehq-message-bubble {
          padding: 10px 14px;
          border-radius: 18px;
          word-break: break-word;
        }
        
        .sitehq-user-message .sitehq-message-bubble {
          background-color: #e0e0e0;
          color: var(--sitehq-text);
          border-bottom-right-radius: 4px;
        }
        
        .sitehq-assistant-message .sitehq-message-bubble {
          background-color: var(--sitehq-primary);
          color: white;
          border-bottom-left-radius: 4px;
        }
        
        /* Typing Indicator */
        .sitehq-typing-indicator {
          display: none;
          align-items: center;
          margin: 0 var(--sitehq-padding);
          margin-bottom: 10px;
          gap: 4px;
        }
        
        .sitehq-typing-dot {
          width: 8px;
          height: 8px;
          background-color: var(--sitehq-primary);
          border-radius: 50%;
          opacity: 0.6;
          animation: sitehq-typing-dot 1.5s infinite ease-in-out;
        }
        
        .sitehq-typing-dot:nth-child(1) {
          animation-delay: 0s;
        }
        
        .sitehq-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .sitehq-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes sitehq-typing-dot {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-6px);
          }
        }
        
        /* Input Area */
        .sitehq-input-area {
          padding: var(--sitehq-padding);
          display: flex;
          gap: 10px;
          border-top: 1px solid var(--sitehq-light-gray);
        }
        
        .sitehq-message-input {
          flex: 1;
          border: 1px solid var(--sitehq-light-gray);
          border-radius: 24px;
          padding: 12px 16px;
          resize: none;
          outline: none;
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--sitehq-text);
          transition: var(--sitehq-transition);
        }
        
        .sitehq-message-input:focus {
          border-color: var(--sitehq-primary);
        }
        
        .sitehq-send-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--sitehq-primary);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--sitehq-transition);
        }
        
        .sitehq-send-button:hover {
          opacity: 0.9;
        }
        
        .sitehq-send-button svg {
          width: 18px;
          height: 18px;
        }
        
        /* Footer */
        .sitehq-footer {
          padding: 8px var(--sitehq-padding);
          text-align: center;
          font-size: 0.8rem;
          color: var(--sitehq-gray);
          border-top: 1px solid var(--sitehq-light-gray);
        }
        
        /* Terms Dialog */
        .sitehq-terms-dialog {
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
          border-radius: var(--sitehq-border-radius);
        }
        
        .sitehq-terms-content {
          background-color: var(--sitehq-background);
          padding: 24px;
          border-radius: 8px;
          max-width: 90%;
          text-align: center;
        }
        
        .sitehq-terms-content h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: var(--sitehq-text);
        }
        
        .sitehq-terms-content p {
          margin-bottom: 24px;
          font-size: 0.9rem;
          color: var(--sitehq-dark-gray);
        }
        
        .sitehq-button {
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--sitehq-transition);
          border: none;
        }
        
        .sitehq-primary-button {
          background-color: var(--sitehq-primary);
          color: white;
        }
        
        .sitehq-primary-button:hover {
          opacity: 0.9;
        }
        
        /* Dark Mode */
        .sitehq-dark-mode .sitehq-chat-window {
          background-color: var(--sitehq-dark-background);
          color: var(--sitehq-dark-text);
        }
        
        .sitehq-dark-mode .sitehq-input-area {
          border-top-color: var(--sitehq-dark-secondary);
        }
        
        .sitehq-dark-mode .sitehq-message-input {
          background-color: var(--sitehq-dark-input);
          border-color: var(--sitehq-dark-secondary);
          color: var(--sitehq-dark-text);
        }
        
        .sitehq-dark-mode .sitehq-user-message .sitehq-message-bubble {
          background-color: var(--sitehq-dark-secondary);
          color: var(--sitehq-dark-text);
        }
        
        .sitehq-dark-mode .sitehq-footer {
          border-top-color: var(--sitehq-dark-secondary);
        }
        
        .sitehq-dark-mode .sitehq-terms-content {
          background-color: var(--sitehq-dark-background);
        }
        
        .sitehq-dark-mode .sitehq-terms-content h3 {
          color: var(--sitehq-dark-text);
        }
        
        .sitehq-dark-mode .sitehq-terms-content p {
          color: var(--sitehq-dark-text);
          opacity: 0.8;
        }
        
        /* Mobile Responsive */
        @media (max-width: 480px) {
          .sitehq-chat-window {
            width: calc(100vw - 40px);
            height: 80vh;
            max-height: 600px;
          }
          
          .sitehq-container {
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
  if (!customElements.get('sitehq-chat-widget')) {
    customElements.define('sitehq-chat-widget', SiteHQChatWidget);
  }
  
  // Auto initialization if specified via data attribute
  function initialize() {
    const scripts = document.querySelectorAll('script[data-sitehq-auto]');
    
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
          console.warn('SiteHQ Widget: Invalid theme JSON, using default theme');
        }
      }
      
      // Create and append the widget element
      const widget = document.createElement('sitehq-chat-widget');
      
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
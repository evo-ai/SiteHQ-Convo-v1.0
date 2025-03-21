/**
 * SiteHQ Chat Widget
 * A self-contained chat widget for embedding on any website
 */

class SiteHQChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.config = {};
    this.state = {
      isOpen: false,
      isDarkMode: false,
      status: 'disconnected',
      isSpeaking: false,
      acceptedTerms: false,
      isTyping: false,
    };
    this.refs = {};
    this.silenceTimeout = null;
  }

  connectedCallback() {
    this.loadConfig();
    this.render();
    this.setupEventListeners();
    this.setupReactContainer();
    if (this.config.initiallyOpen) {
      this.toggleChatWindow(true);
    }

    // Listen for status updates from React component
    document.addEventListener('sitehq-status-update', (event) => {
      this.setStatus(event.detail.status);
    });
  }

  disconnectedCallback() {
    this.cleanup();
  }

  loadConfig() {
    const defaultConfig = {
      apiKey: 'demo-key',
      agentId: 'demo-agent',
      theme: {
        primary: '#5c078c',
        background: '#ffffff',
        text: '#333333'
      },
      darkMode: false,
      position: 'bottom-right',
      initiallyOpen: false,
      widgetTitle: 'SiteHQ Assistant',
      useSolarSystemTheme: true,
    };

    this.config = {
      apiKey: this.getAttribute('api-key') || defaultConfig.apiKey,
      agentId: this.getAttribute('agent-id') || defaultConfig.agentId,
      position: this.getAttribute('position') || defaultConfig.position,
      initiallyOpen: this.getAttribute('initially-open') === 'true',
      widgetTitle: this.getAttribute('title') || defaultConfig.widgetTitle,
      darkMode: this.getAttribute('dark-mode') === 'true',
      useSolarSystemTheme: this.getAttribute('solar-system-theme') === 'true' || defaultConfig.useSolarSystemTheme,
      theme: defaultConfig.theme,
    };

    if (this.hasAttribute('theme')) {
      try {
        const themeData = JSON.parse(this.getAttribute('theme'));
        this.config.theme = { ...defaultConfig.theme, ...themeData };
      } catch (e) {
        console.warn('Invalid theme JSON:', e);
      }
    }

    this.state.isDarkMode = this.config.darkMode;
    this.shadowRoot.host.style.setProperty('--primary-color', this.config.theme.primary);
  }

  createSVG(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', path);

    svg.appendChild(pathEl);
    return svg;
  }

  SVGS = {
    chatBubble: 'M21 11.5C21 16.1944 16.9706 20 12 20C10.9 20 9.83943 19.8325 8.85145 19.5247C8.17238 19.3139 7.8323 19.2083 7.68265 19.2292C7.53301 19.25 7.31884 19.3693 6.88694 19.6084L4.8 20.8L4.3636 20.9964C4.01558 21.1495 3.84157 21.2261 3.67736 21.2433C3.38636 21.2725 3.09829 21.1872 2.87926 21.0113C2.79366 20.9488 2.72192 20.8663 2.5764 20.7055C2.19781 20.2685 2.18538 19.6598 2.54001 19.2082L3 18.6462L4.09513 17.2981C4.25177 17.1069 4.33008 17.0113 4.38058 16.9031C4.43108 16.795 4.4473 16.6716 4.47097 16.4224C4.49464 16.1732 4.45304 15.9049 4.37088 15.3755C4.12225 13.7754 4 13 4 11.5C4 6.80558 8.02944 3 13 3C17.9706 3 21 6.80558 21 11.5Z',
    close: 'M18 6L6 18 M6 6L18 18',
    send: 'M22 2L11 13 M22 2L15 22L11 13M22 2L2 9L11 13',
    sun: 'M12 16A4 4 0 0 0 16 12A4 4 0 0 0 12 8A4 4 0 0 0 8 12A4 4 0 0 0 12 16Z M12 2V4 M12 20V22 M4.93 4.93L6.34 6.34 M17.66 17.66L19.07 19.07 M2 12H4 M20 12H22 M6.34 17.66L4.93 19.07 M19.07 4.93L17.66 6.34',
    moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
    hangup: 'M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M6 18H18C20.2091 18 22 16.2091 22 14V10C22 7.79086 20.2091 6 18 6H6C3.79086 6 2 7.79086 2 10V14C2 16.2091 3.79086 18 6 18Z'
  };

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .sitehq-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          position: fixed;
          z-index: 9999;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .sitehq-container.sitehq-dark-mode {
          color: #f5f5f5;
        }

        .sitehq-container.sitehq-top-right {
          top: 20px;
          right: 20px;
          bottom: auto;
          left: auto;
        }

        .sitehq-container.sitehq-top-left {
          top: 20px;
          left: 20px;
          bottom: auto;
          right: auto;
        }

        .sitehq-container.sitehq-bottom-left {
          bottom: 20px;
          left: 20px;
          top: auto;
          right: auto;
        }

        .sitehq-toggle-button {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #F95638, #F95638);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(92, 7, 140, 0.3);
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: sitehq-float 3s ease-in-out infinite;
        }

        .sitehq-sun-particle {
          animation: sitehq-orbit 8s linear infinite !important;
          box-shadow: 0 0 10px rgba(255, 204, 0, 0.8);
        }

        .sitehq-planet-particle {
          animation: sitehq-orbit-reverse 6s linear infinite !important;
        }

        @keyframes sitehq-orbit {
          0% {
            transform: rotate(0deg) translateX(6px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(6px) rotate(-360deg);
          }
        }

        @keyframes sitehq-orbit-reverse {
          0% {
            transform: rotate(0deg) translateX(4px) rotate(0deg);
          }
          100% {
            transform: rotate(-360deg) translateX(4px) rotate(360deg);
          }
        }

        @keyframes sitehq-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .sitehq-toggle-button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 0 8px rgba(255, 165, 0, 0.4),
                      0 6px 25px rgba(0, 0, 0, 0.3);
        }

        .sitehq-toggle-button:focus {
          outline: none;
        }

        .sitehq-toggle-button::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #FFA500;
          opacity: 0;
          z-index: -1;
          animation: sitehq-pulse 2s infinite;
        }

        @keyframes sitehq-pulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
            box-shadow: 0 0 8px rgba(255, 165, 0, 0.5);
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
            box-shadow: 0 0 20px rgba(255, 165, 0, 0);
          }
        }

        .sitehq-particle {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          pointer-events: none;
        }

        .sitehq-particle:nth-child(1) {
          top: -10px;
          right: -5px;
          background-color: #FFCC00;
          animation: sitehq-float-particle 4s ease-in-out infinite;
        }

        .sitehq-particle:nth-child(2) {
          bottom: -8px;
          left: -5px;
          width: 8px;
          height: 8px;
          background-color: #00CCFF;
          animation: sitehq-float-particle 3.5s ease-in-out infinite 0.5s;
        }

        @keyframes sitehq-float-particle {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(5px, -10px);
          }
        }

        .sitehq-tooltip {
          position: absolute;
          bottom: 70px;
          right: 0;
          background-color: white;
          color: #333;
          padding: 10px 15px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          max-width: 220px;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.3s, transform 0.3s;
          pointer-events: none;
        }

        .sitehq-dark-mode .sitehq-tooltip {
          background-color: #2d2d2d;
          color: #f5f5f5;
        }

        .sitehq-toggle-button:hover + .sitehq-tooltip {
          opacity: 1;
          transform: translateY(0);
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
          transition: all 0.3s ease;
          transform-origin: bottom right;
          animation: sitehq-popup 0.3s ease-out;
          display: none;
        }

        .sitehq-dark-mode .sitehq-chat-window {
          background-color: #222;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
        }

        @keyframes sitehq-popup {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .sitehq-header {
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          background-color: #f9f9f9;
          position: relative;
        }

        .sitehq-dark-mode .sitehq-header {
          border-bottom: 1px solid #333;
          background-color: #2d2d2d;
        }

        .sitehq-header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .sitehq-header-title {
          font-weight: 600;
          font-size: 16px;
          color: var(--primary-color, #5c078c);
        }

        .sitehq-dark-mode .sitehq-header-title {
          color: #bb86fc;
        }

        .sitehq-status {
          font-size: 12px;
          color: #888;
          margin-top: 5px;
        }

        .sitehq-dark-mode .sitehq-status {
          color: #aaa;
        }

        .sitehq-status-connected {
          color: #4CAF50;
        }

        .sitehq-dark-mode .sitehq-status-connected {
          color: #81c784;
        }

        .sitehq-status-disconnected, .sitehq-status-error {
          color: #F44336;
        }

        .sitehq-dark-mode .sitehq-status-disconnected,
        .sitehq-dark-mode .sitehq-status-error {
          color: #e57373;
        }

        .sitehq-status-listening {
          color: #4CAF50;
        }

        .sitehq-status-speaking {
          color: #FF9800;
        }

        .sitehq-equalizer {
          display: none;
          flex-direction: row;
          gap: 3px;
          margin-top: 5px;
        }

        .sitehq-equalizer-bar {
          width: 4px;
          height: 10px;
          background-color: #4CAF50;
          border-radius: 2px;
          animation: sitehq-wave 1s infinite ease-in-out;
        }

        .sitehq-equalizer-bar:nth-child(2) {
          animation-delay: 0.2s;
        }

        .sitehq-equalizer-bar:nth-child(3) {
          animation-delay: 0.4s;
        }

        .sitehq-status-listening ~ .sitehq-equalizer {
          display: flex;
        }

        .sitehq-sound-wave {
          display: none;
          flex-direction: row;
          gap: 3px;
          margin-top: 5px;
        }

        .sitehq-sound-wave-bar {
          width: 4px;
          height: 10px;
          background-color: #FF9800;
          border-radius: 2px;
          animation: sitehq-wave 1s infinite ease-in-out;
        }

        .sitehq-sound-wave-bar:nth-child(2) {
          animation-delay: 0.2s;
        }

        .sitehq-sound-wave-bar:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes sitehq-wave {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(2);
          }
        }

        .sitehq-status-speaking ~ .sitehq-sound-wave {
          display: flex;
        }

        .sitehq-header-actions {
          position: absolute;
          right: 15px;
          display: flex;
          gap: 8px;
        }

        .sitehq-icon-button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          transition: background-color 0.2s;
        }

        .sitehq-dark-mode .sitehq-icon-button {
          color: #ddd;
        }

        .sitehq-icon-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .sitehq-dark-mode .sitehq-icon-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .sitehq-messages {
          display: none;
        }

        .sitehq-typing-indicator {
          display: none;
          padding: 10px 15px;
          align-items: center;
          gap: 5px;
        }

        .sitehq-typing-dot {
          width: 8px;
          height: 8px;
          background-color: #888;
          border-radius: 50%;
          animation: sitehq-typing-dot 1.4s infinite ease-in-out;
        }

        .sitehq-dark-mode .sitehq-typing-dot {
          background-color: #aaa;
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
            transform: translateY(-5px);
          }
        }

        .sitehq-input-area {
          padding: 10px 15px;
          display: flex;
          gap: 10px;
          border-top: 1px solid #eee;
          background-color: #f9f9f9;
          justify-content: center;
        }

        .sitehq-dark-mode .sitehq-input-area {
          border-top: 1px solid #333;
          background-color: #2d2d2d;
        }

        .sitehq-message-input {
          display: none;
        }

        .sitehq-send-button {
          display: none;
        }

        .sitehq-disconnect-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #F44336;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .sitehq-disconnect-button:hover {
          background-color: #d32f2f;
        }

        .sitehq-terms-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .sitehq-terms-content {
          background-color: white;
          padding: 20px;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
        }

        .sitehq-dark-mode .sitehq-terms-content {
          background-color: #2d2d2d;
          color: #f5f5f5;
        }

        .sitehq-terms-content h3 {
          margin-top: 0;
          color: var(--primary-color, #5c078c);
        }

        .sitehq-dark-mode .sitehq-terms-content h3 {
          color: #bb86fc;
        }

        .sitehq-primary-button {
          background-color: var(--primary-color, #5c078c);
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          display: block;
          width: 100%;
          margin-top: 15px;
          transition: background-color 0.2s;
        }

        .sitehq-dark-mode .sitehq-primary-button {
          background-color: #bb86fc;
          color: #000;
        }

        .sitehq-primary-button:hover {
          background-color: #4a0670;
        }

        .sitehq-dark-mode .sitehq-primary-button:hover {
          background-color: #a370db;
        }

        .sitehq-cancel-button {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 10px;
          width: 100%;
        }

        .sitehq-dark-mode .sitehq-cancel-button {
          background-color: #333;
          color: #f5f5f5;
          border: 1px solid #444;
        }

        .sitehq-branding {
          font-size: 11px;
          color: #888;
          text-align: center;
          margin-top: 5px;
        }

        .sitehq-dark-mode .sitehq-branding {
          color: #aaa;
        }

        .sitehq-branding a {
          color: var(--primary-color, #5c078c);
          text-decoration: none;
        }

        .sitehq-dark-mode .sitehq-branding a {
          color: #bb86fc;
        }

        .sitehq-branding a:hover {
          text-decoration: underline;
        }

        .sitehq-react-container {
          display: none;
        }
      </style>
      <div class="sitehq-container ${this.config.position ? 'sitehq-' + this.config.position : 'sitehq-bottom-right'} ${this.state.isDarkMode ? 'sitehq-dark-mode' : ''}">
        <div class="sitehq-chat-window" style="display: none;">
          <div class="sitehq-header">
            <div class="sitehq-header-content">
              <div class="sitehq-header-title">${this.config.widgetTitle || 'Chat with AI'}</div>
              <div class="sitehq-status" id="sitehq-status">Initializing...</div>
              <div class="sitehq-equalizer">
                <div class="sitehq-equalizer-bar"></div>
                <div class="sitehq-equalizer-bar"></div>
                <div class="sitehq-equalizer-bar"></div>
                <div class="sitehq-equalizer-bar"></div>
              </div>
              <div class="sitehq-sound-wave">
                <div class="sitehq-sound-wave-bar"></div>
                <div class="sitehq-sound-wave-bar"></div>
                <div class="sitehq-sound-wave-bar"></div>
              </div>
            </div>
            <div class="sitehq-header-actions">
              <button class="sitehq-icon-button" aria-label="Toggle dark mode"></button>
            </div>
          </div>
          <div class="sitehq-messages"></div>
          <div class="sitehq-typing-indicator" style="display: none;">
            <div class="sitehq-typing-dot"></div>
            <div class="sitehq-typing-dot"></div>
            <div class="sitehq-typing-dot"></div>
          </div>
          <div class="sitehq-input-area">
            <button class="sitehq-disconnect-button" aria-label="Disconnect call"></button>
          </div>
        </div>
        <button class="sitehq-toggle-button" aria-label="Toggle chat"></button>
        <div class="sitehq-tooltip">Ask me anything! I'm here to help.</div>
        <div class="sitehq-terms-dialog" style="display: none;">
          <div class="sitehq-terms-content">
            <h3>Terms and Conditions</h3>
            <p>By clicking " Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as described in the Privacy Policy. If you do not wish to have your conversations recorded, please refrain from using this service.</p>
            <button class="sitehq-primary-button"> Agree</button>
            <button class="sitehq-cancel-button">Cancel</button>
          </div>
        </div>
        <div class="sitehq-branding">Powered by <a href="https://www.sitehq.ai" target="_blank">SiteHQ</a></div>
        <div class="sitehq-react-container"></div>
      </div>
    `;

    this.refs.container = this.shadowRoot.querySelector('.sitehq-container');
    this.refs.chatWindow = this.shadowRoot.querySelector('.sitehq-chat-window');
    this.refs.chatButton = this.shadowRoot.querySelector('.sitehq-toggle-button');
    this.refs.messagesContainer = this.shadowRoot.querySelector('.sitehq-messages');
    this.refs.typingIndicator = this.shadowRoot.querySelector('.sitehq-typing-indicator');
    this.refs.messageInput = this.shadowRoot.querySelector('.sitehq-message-input');
    this.refs.termsDialog = this.shadowRoot.querySelector('.sitehq-terms-dialog');
    this.refs.disconnectButton = this.shadowRoot.querySelector('.sitehq-disconnect-button');
    this.refs.reactContainer = this.shadowRoot.querySelector('.sitehq-react-container');

    this.refs.chatButton.appendChild(this.createSVG(this.SVGS.chatBubble));
    this.refs.disconnectButton.appendChild(this.createSVG(this.SVGS.hangup));
    this.updateDarkModeIcon();

    if (this.config.useSolarSystemTheme) {
      const sunParticle = document.createElement('div');
      sunParticle.className = 'sitehq-particle sitehq-sun-particle';
      sunParticle.style.top = '-10px';
      sunParticle.style.right = '-8px';
      sunParticle.style.width = '18px';
      sunParticle.style.height = '18px';
      sunParticle.style.backgroundColor = '#FFCC00';
      sunParticle.style.boxShadow = '0 0 10px rgba(255, 204, 0, 0.8)';

      const planetParticle = document.createElement('div');
      planetParticle.className = 'sitehq-particle sitehq-planet-particle';
      planetParticle.style.bottom = '-5px';
      planetParticle.style.left = '-3px';
      planetParticle.style.width = '8px';
      planetParticle.style.height = '8px';
      planetParticle.style.backgroundColor = '#00CCFF';

      this.refs.chatButton.appendChild(sunParticle);
      this.refs.chatButton.appendChild(planetParticle);
    } else {
      const particle1 = document.createElement('div');
      particle1.className = 'sitehq-particle';

      const particle2 = document.createElement('div');
      particle2.className = 'sitehq-particle';

      this.refs.chatButton.appendChild(particle1);
      this.refs.chatButton.appendChild(particle2);
    }
  }

  updateDarkModeIcon() {
    const darkModeButton = this.refs.chatWindow.querySelector('[aria-label="Toggle dark mode"]');
    darkModeButton.innerHTML = '';
    darkModeButton.appendChild(this.createSVG(this.state.isDarkMode ? this.SVGS.sun : this.SVGS.moon));
  }

  setupEventListeners() {
    this.refs.chatButton.addEventListener('click', () => this.toggleChatWindow(!this.state.isOpen));
    this.refs.chatWindow.querySelector('[aria-label="Toggle dark mode"]').addEventListener('click', () => this.toggleDarkMode());
    this.refs.disconnectButton.addEventListener('click', () => this.disconnectCall());
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

  setupReactContainer() {
    // Dispatch an event to initialize the React component with config
    const event = new CustomEvent('sitehq-init', {
      detail: {
        apiKey: this.config.apiKey,
        agentId: this.config.agentId,
        container: this.refs.reactContainer,
      },
    });
    document.dispatchEvent(event);
  }

  toggleChatWindow(open) {
    this.state.isOpen = open;
    this.refs.chatWindow.style.display = open ? 'flex' : 'none';
    if (open && !this.state.acceptedTerms) {
      this.refs.termsDialog.style.display = 'flex';
    } else if (!open) {
      this.state.acceptedTerms = false;
      this.setStatus('disconnected');
    }
  }

  toggleDarkMode() {
    this.state.isDarkMode = !this.state.isDarkMode;
    if (this.state.isDarkMode) {
      this.refs.container.classList.add('sitehq-dark-mode');
    } else {
      this.refs.container.classList.remove('sitehq-dark-mode');
    }
    this.updateDarkModeIcon();
  }

  initializeChat() {
    // Dispatch event to React component to start the conversation
    document.dispatchEvent(new CustomEvent('sitehq-accept-terms'));
  }

  setStatus(status) {
    this.state.status = status;
    const statusEl = this.shadowRoot.querySelector('#sitehq-status');
    statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusEl.className = `sitehq-status sitehq-status-${status}`;
    this.refs.typingIndicator.style.display = (status === 'thinking' || this.state.isTyping) ? 'flex' : 'none';
  }

  disconnectCall() {
    // Dispatch event to React component to end the conversation
    document.dispatchEvent(new CustomEvent('sitehq-disconnect'));
    this.setStatus('disconnected');
    this.state.acceptedTerms = false;
    this.state.isOpen = false;
    this.refs.chatWindow.style.display = 'none';
  }

  cleanup() {
    // No cleanup needed for WebSocket or audio, handled by React component
  }
}

customElements.define('sitehq-chat', SiteHQChat);
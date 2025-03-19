/**
 * SiteHQ Standalone Chat Bubble - Fixed Version
 * A self-contained widget that can be embedded on any website
 * No React dependencies required
 */

(function() {
  'use strict';
  
  // Define the global SiteHQChat namespace
  window.SiteHQChat = window.SiteHQChat || {};
  
  // Define the init function in the namespace
  window.SiteHQChat.init = function(config) {
    initializeWidget(config);
  };

  // Debug functionality
  let debugMode = false;
  
  function log(...args) {
    if (debugMode) {
      console.log('[SiteHQ Chat]', ...args);
    }
  }
  
  function warn(...args) {
    if (debugMode) {
      console.warn('[SiteHQ Chat]', ...args);
    }
  }
  
  function error(...args) {
    if (debugMode) {
      console.error('[SiteHQ Chat]', ...args);
    }
  }

  // Widget configuration
  const DEFAULT_CONFIG = {
    apiKey: 'demo-key',
    agentId: 'demo-agent',
    theme: {
      primary: '#5c078c',
      background: '#ffffff',
      text: '#333333'
    },
    darkMode: false,
    position: 'bottom-right', // or 'bottom-left', 'top-right', 'top-left'
    initiallyOpen: false,
    widgetTitle: 'SiteHQ Assistant',
    useSolarSystemTheme: true, // Enable the solar system theme
    debug: false  // Enable debug logging
  };

  // Widget state
  let state = {
    isOpen: false,
    isInitialized: false,
    messages: [],
    isLoading: false,
    connection: null,
    acceptedTerms: false,
    lastUserMessageTimestamp: null,
    isDarkMode: false,
    isHovered: false,
    isTyping: false,
    micVolume: 0,
    isSpeaking: false
  };

  // DOM references
  const refs = {
    container: null,
    chatWindow: null,
    chatButton: null,
    messagesContainer: null,
    typingIndicator: null,
    messageInput: null,
    termsDialog: null
  };

  // Create and apply the widget styles
  function injectStyles() {
    const styleEl = document.createElement('style');
    styleEl.id = 'sitehq-chat-styles';
    styleEl.textContent = `
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
        background: radial-gradient(circle at 30% 30%, #5c078c, #5c078cDD);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(92, 7, 140, 0.3);
        position: relative;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        animation: sitehq-float 3s ease-in-out infinite;
      }
      
      /* Solar System Theme Styles */
      .sitehq-sun-particle {
        position: absolute;
        width: 18px !important;
        height: 18px !important;
        border-radius: 50%;
        background-color: #FFCC00 !important;
        box-shadow: 0 0 10px rgba(255, 204, 0, 0.8);
        top: -10px;
        right: -8px;
        animation: sitehq-orbit 8s linear infinite !important;
      }
      
      .sitehq-planet-particle {
        position: absolute;
        width: 10px !important;
        height: 10px !important;
        border-radius: 50%;
        background-color: #00CCFF !important;
        box-shadow: 0 0 6px rgba(0, 204, 255, 0.8);
        bottom: -6px;
        left: -4px;
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
        box-shadow: 0 6px 25px rgba(92, 7, 140, 0.4);
      }
      
      .sitehq-toggle-button:focus {
        outline: none;
      }
      
      .sitehq-toggle-button::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: #5c078c;
        opacity: 0;
        z-index: -1;
        animation: sitehq-pulse 2s infinite;
      }
      
      @keyframes sitehq-pulse {
        0% {
          transform: scale(1);
          opacity: 0.3;
        }
        100% {
          transform: scale(1.8);
          opacity: 0;
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
      }
      
      .sitehq-dark-mode .sitehq-header {
        border-bottom: 1px solid #333;
        background-color: #2d2d2d;
      }
      
      .sitehq-header-content {
        display: flex;
        flex-direction: column;
      }
      
      .sitehq-header-title {
        font-weight: 600;
        font-size: 16px;
        color: #5c078c;
      }
      
      .sitehq-dark-mode .sitehq-header-title {
        color: #bb86fc;
      }
      
      .sitehq-status {
        font-size: 12px;
        color: #888;
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
      
      .sitehq-header-actions {
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
        padding: 15px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .sitehq-message {
        display: flex;
        margin-bottom: 10px;
      }
      
      .sitehq-user-message {
        justify-content: flex-end;
      }
      
      .sitehq-assistant-message {
        justify-content: flex-start;
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
      }
      
      .sitehq-dark-mode .sitehq-user-message .sitehq-message-bubble {
        background-color: #333;
      }
      
      .sitehq-assistant-message .sitehq-message-bubble {
        background-color: #5c078c;
        color: white;
        border-bottom-left-radius: 4px;
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
      }
      
      .sitehq-dark-mode .sitehq-input-area {
        border-top: 1px solid #333;
        background-color: #2d2d2d;
      }
      
      .sitehq-message-input {
        flex: 1;
        padding: 10px 15px;
        border-radius: 20px;
        border: 1px solid #ddd;
        background-color: white;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .sitehq-dark-mode .sitehq-message-input {
        border: 1px solid #444;
        background-color: #333;
        color: #f5f5f5;
      }
      
      .sitehq-message-input:focus {
        border-color: #5c078c;
      }
      
      .sitehq-dark-mode .sitehq-message-input:focus {
        border-color: #bb86fc;
      }
      
      .sitehq-send-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #5c078c;
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      }
      
      .sitehq-dark-mode .sitehq-send-button {
        background-color: #bb86fc;
        color: #000;
      }
      
      .sitehq-send-button:hover {
        background-color: #4a0670;
      }
      
      .sitehq-dark-mode .sitehq-send-button:hover {
        background-color: #a370db;
      }
      
      /* Improved Terms Dialog Styling */
      .sitehq-terms-dialog {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.7);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      
      .sitehq-terms-content {
        background-color: white;
        padding: 24px;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
        position: relative;
      }
      
      .sitehq-dark-mode .sitehq-terms-content {
        background-color: #2d2d2d;
        color: #f5f5f5;
      }
      
      .sitehq-terms-content h3 {
        margin-top: 0;
        color: #5c078c;
        font-size: 18px;
        margin-bottom: 16px;
      }
      
      .sitehq-dark-mode .sitehq-terms-content h3 {
        color: #bb86fc;
      }
      
      .sitehq-terms-content p {
        margin-bottom: 20px;
        line-height: 1.5;
      }
      
      .sitehq-terms-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 20px;
      }
      
      .sitehq-cancel-button {
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .sitehq-dark-mode .sitehq-cancel-button {
        background-color: #333;
        border-color: #555;
        color: #ddd;
      }
      
      .sitehq-cancel-button:hover {
        background-color: #e5e5e5;
      }
      
      .sitehq-dark-mode .sitehq-cancel-button:hover {
        background-color: #444;
      }
      
      .sitehq-primary-button {
        background-color: #5c078c;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
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
        color: #5c078c;
        text-decoration: none;
      }
      
      .sitehq-dark-mode .sitehq-branding a {
        color: #bb86fc;
      }
      
      .sitehq-branding a:hover {
        text-decoration: underline;
      }
      
      /* Sound wave animation (for speaking state) */
      .sitehq-sound-wave {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 20px;
        width: 40px;
        margin-left: 8px;
      }
      
      .sitehq-sound-wave-bar {
        width: 4px;
        height: 100%;
        background-color: var(--primary-color, #5c078c);
        border-radius: 2px;
        animation: sitehq-sound-wave 1.2s ease-in-out infinite;
      }
      
      .sitehq-sound-wave-bar:nth-child(1) { animation-delay: 0.0s; }
      .sitehq-sound-wave-bar:nth-child(2) { animation-delay: 0.2s; }
      .sitehq-sound-wave-bar:nth-child(3) { animation-delay: 0.4s; }
      .sitehq-sound-wave-bar:nth-child(4) { animation-delay: 0.6s; }
      .sitehq-sound-wave-bar:nth-child(5) { animation-delay: 0.8s; }
      
      @keyframes sitehq-sound-wave {
        0%, 100% { transform: scaleY(0.3); }
        50% { transform: scaleY(1); }
      }
      
      /* Microphone wave animation (for listening state) */
      .sitehq-mic-wave {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 20px;
        width: 40px;
        margin-left: 8px;
      }
      
      .sitehq-mic-wave-bar {
        width: 4px;
        height: 100%;
        background-color: #f43f5e;
        border-radius: 2px;
        animation: sitehq-mic-wave 1.5s ease-in-out infinite;
      }
      
      .sitehq-mic-wave-bar:nth-child(1) { animation-delay: 0.2s; }
      .sitehq-mic-wave-bar:nth-child(2) { animation-delay: 0.4s; }
      .sitehq-mic-wave-bar:nth-child(3) { animation-delay: 0.6s; }
      .sitehq-mic-wave-bar:nth-child(4) { animation-delay: 0.8s; }
      .sitehq-mic-wave-bar:nth-child(5) { animation-delay: 1.0s; }
      
      @keyframes sitehq-mic-wave {
        0%, 100% { transform: scaleY(0.2); }
        50% { transform: scaleY(0.8); opacity: 1; }
        75% { opacity: 0.7; }
      }
      
      /* Status container - for status text and animations */
      .sitehq-status-container {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: #666;
        margin-top: 2px;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Create SVG elements
  function createSVG(pathData, options = {}) {
    const { width = 24, height = 24, viewBox = '0 0 24 24' } = options;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    if (Array.isArray(pathData)) {
      pathData.forEach(d => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
      });
    } else {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      svg.appendChild(path);
    }
    
    return svg;
  }

  // SVG Icons
  const svgIcons = {
    chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    close: [
      'M18 6L6 18',
      'M6 6l12 12'
    ],
    send: [
      'M22 2L11 13',
      'M22 2L15 22L11 13L2 9L22 2'
    ],
    sun: [
      'M12 1v2',
      'M12 21v2',
      'M4.22 4.22l1.42 1.42',
      'M18.36 18.36l1.42 1.42',
      'M1 12h2',
      'M21 12h2',
      'M4.22 19.78l1.42-1.42',
      'M18.36 5.64l1.42-1.42'
    ],
    sunCircle: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
    moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'
  };

  // Create the chat bubble DOM elements
  function createWidgetDOM(config = {}) {
    // Main container
    const container = document.createElement('div');
    container.className = `sitehq-container sitehq-${config.position || 'bottom-right'}`;
    if (config.darkMode) {
      container.classList.add('sitehq-dark-mode');
    }
    
    // Apply primary color as CSS variable for easy theming
    if (config.theme && config.theme.primary) {
      container.style.setProperty('--primary-color', config.theme.primary);
    }

    // Chat toggle button
    const chatButton = document.createElement('button');
    chatButton.className = 'sitehq-toggle-button';
    chatButton.setAttribute('aria-label', 'Toggle chat');
    
    // Solar system theme (if enabled)
    if (config.useSolarSystemTheme) {
      const sunParticle = document.createElement('div');
      sunParticle.className = 'sitehq-sun-particle';
      
      const planetParticle = document.createElement('div');
      planetParticle.className = 'sitehq-planet-particle';
      
      chatButton.appendChild(sunParticle);
      chatButton.appendChild(planetParticle);
    }
    
    const chatIcon = createSVG(svgIcons.chat);
    chatButton.appendChild(chatIcon);

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'sitehq-tooltip';
    tooltip.textContent = 'Chat with our AI assistant';

    // Chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'sitehq-chat-window';

    // Chat window header
    const header = document.createElement('div');
    header.className = 'sitehq-header';

    const headerContent = document.createElement('div');
    headerContent.className = 'sitehq-header-content';

    const headerTitle = document.createElement('div');
    headerTitle.className = 'sitehq-header-title';
    headerTitle.textContent = config.widgetTitle || 'Chat with AI';

    // Status container
    const statusContainer = document.createElement('div');
    statusContainer.className = 'sitehq-status-container';
    
    // Status indicator
    const statusEl = document.createElement('div');
    statusEl.className = 'sitehq-status';
    statusEl.id = 'sitehq-status';
    statusEl.textContent = 'Initializing...';
    statusContainer.appendChild(statusEl);
    
    // Sound wave animation (for speaking state)
    const soundWave = document.createElement('div');
    soundWave.id = 'sitehq-sound-wave';
    soundWave.className = 'sitehq-sound-wave';
    soundWave.style.display = 'none';
    
    // Create 5 bars for the sound wave
    for (let i = 0; i < 5; i++) {
      const bar = document.createElement('div');
      bar.className = 'sitehq-sound-wave-bar';
      soundWave.appendChild(bar);
    }
    statusContainer.appendChild(soundWave);
    
    // Microphone wave animation (for listening state)
    const micWave = document.createElement('div');
    micWave.id = 'sitehq-mic-wave';
    micWave.className = 'sitehq-mic-wave';
    micWave.style.display = 'none';
    
    // Create 5 bars for the mic wave
    for (let i = 0; i < 5; i++) {
      const bar = document.createElement('div');
      bar.className = 'sitehq-mic-wave-bar';
      micWave.appendChild(bar);
    }
    statusContainer.appendChild(micWave);
    
    headerContent.appendChild(headerTitle);
    headerContent.appendChild(statusContainer);

    const headerActions = document.createElement('div');
    headerActions.className = 'sitehq-header-actions';

    // Create dark mode toggle
    const darkModeButton = document.createElement('button');
    darkModeButton.className = 'sitehq-icon-button';
    darkModeButton.setAttribute('aria-label', 'Toggle dark mode');
    
    // Add appropriate icon for dark mode
    const darkModeIcon = state.isDarkMode ? 
      createSVG([svgIcons.sun, svgIcons.sunCircle]) : 
      createSVG(svgIcons.moon);
    darkModeButton.appendChild(darkModeIcon);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'sitehq-icon-button';
    closeButton.setAttribute('aria-label', 'Close chat');
    
    const closeIcon = createSVG(svgIcons.close);
    closeButton.appendChild(closeIcon);

    headerActions.appendChild(darkModeButton);
    headerActions.appendChild(closeButton);

    header.appendChild(headerContent);
    header.appendChild(headerActions);

    // Messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'sitehq-messages';

    // Typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'sitehq-typing-indicator';
    typingIndicator.id = 'sitehq-typing-indicator';
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'sitehq-typing-dot';
      typingIndicator.appendChild(dot);
    }

    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'sitehq-input-area';

    const messageInput = document.createElement('textarea');
    messageInput.className = 'sitehq-message-input';
    messageInput.placeholder = 'Type a message...';
    messageInput.rows = 1;

    const sendButton = document.createElement('button');
    sendButton.className = 'sitehq-send-button';
    sendButton.setAttribute('aria-label', 'Send message');
    
    const sendIcon = createSVG(svgIcons.send);
    sendButton.appendChild(sendIcon);

    inputArea.appendChild(messageInput);
    inputArea.appendChild(sendButton);

    // Terms and conditions dialog
    const termsDialog = document.createElement('div');
    termsDialog.className = 'sitehq-terms-dialog';

    const termsContent = document.createElement('div');
    termsContent.className = 'sitehq-terms-content';

    const termsTitle = document.createElement('h3');
    termsTitle.textContent = 'Terms and conditions';

    const termsText = document.createElement('p');
    termsText.textContent = 'By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as described in the Privacy Policy. If you do not wish to have your conversations recorded, please refrain from using this service.';

    const termsButtons = document.createElement('div');
    termsButtons.className = 'sitehq-terms-buttons';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'sitehq-cancel-button';
    cancelButton.textContent = 'Cancel';

    const agreeButton = document.createElement('button');
    agreeButton.className = 'sitehq-primary-button';
    agreeButton.textContent = 'Agree';

    termsButtons.appendChild(cancelButton);
    termsButtons.appendChild(agreeButton);

    termsContent.appendChild(termsTitle);
    termsContent.appendChild(termsText);
    termsContent.appendChild(termsButtons);

    termsDialog.appendChild(termsContent);

    // Assemble the chat window
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(typingIndicator);
    chatWindow.appendChild(inputArea);
    chatWindow.appendChild(termsDialog);

    // Branding footer
    const branding = document.createElement('div');
    branding.className = 'sitehq-branding';
    
    const brandingText = document.createTextNode('Powered by ');
    const brandingLink = document.createElement('a');
    brandingLink.href = 'https://www.sitehq.ai';
    brandingLink.textContent = 'SiteHQ';
    brandingLink.target = '_blank';
    brandingLink.rel = 'noopener noreferrer';
    
    branding.appendChild(brandingText);
    branding.appendChild(brandingLink);

    // Assemble the entire widget
    container.appendChild(chatWindow);
    container.appendChild(chatButton);
    container.appendChild(tooltip);
    container.appendChild(branding);

    // Store references for later use
    refs.container = container;
    refs.chatWindow = chatWindow;
    refs.chatButton = chatButton;
    refs.messagesContainer = messagesContainer;
    refs.typingIndicator = typingIndicator;
    refs.messageInput = messageInput;
    refs.termsDialog = termsDialog;

    return container;
  }

  // Apply configuration from data attributes or passed object
  function applyConfig(userConfig = {}) {
    // Start with default config
    const config = { ...DEFAULT_CONFIG };
    
    // Apply user config
    if (userConfig) {
      Object.keys(userConfig).forEach(key => {
        if (key === 'theme' && userConfig.theme) {
          config.theme = { ...config.theme, ...userConfig.theme };
        } else {
          config[key] = userConfig[key];
        }
      });
    }
    
    // Check if debug mode should be enabled
    debugMode = config.debug || false;
    
    if (debugMode) {
      log('Configuration applied:', config);
    }
    
    return config;
  }

  // Initialize chat widget
  function initializeWidget(userConfig) {
    // Apply configuration
    const config = applyConfig(userConfig);
    
    // Inject styles
    injectStyles();
    
    // Create DOM elements
    const container = createWidgetDOM(config);
    document.body.appendChild(container);
    
    // Set up event listeners
    setupEventListeners(config);
    
    // Open chat if initiallyOpen is true
    if (config.initiallyOpen) {
      toggleChatWindow(true);
    }
    
    log('Widget initialized');
  }

  // Set up event listeners
  function setupEventListeners(config) {
    const { chatButton, chatWindow, messageInput, termsDialog } = refs;
    
    // Toggle chat window when chat button is clicked
    chatButton.addEventListener('click', () => {
      toggleChatWindow(!state.isOpen);
    });
    
    // Close chat window when close button is clicked
    const closeButton = chatWindow.querySelector('.sitehq-header-actions button:last-child');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        toggleChatWindow(false);
      });
    }
    
    // Toggle dark mode
    const darkModeButton = chatWindow.querySelector('.sitehq-header-actions button:first-child');
    if (darkModeButton) {
      darkModeButton.addEventListener('click', toggleDarkMode);
    }
    
    // Send message when send button is clicked
    const sendButton = chatWindow.querySelector('.sitehq-send-button');
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        sendMessage();
      });
    }
    
    // Send message when Enter key is pressed (but allow Shift+Enter for new line)
    if (messageInput) {
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      
      // Auto-resize message input as user types
      messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
    }
    
    // Handle terms dialog buttons
    const cancelButton = termsDialog.querySelector('.sitehq-cancel-button');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        toggleChatWindow(false);
      });
    }
    
    const agreeButton = termsDialog.querySelector('.sitehq-primary-button');
    if (agreeButton) {
      agreeButton.addEventListener('click', () => {
        acceptTerms();
        initializeChat(config);
      });
    }
  }

  // Toggle chat window visibility
  function toggleChatWindow(open) {
    const { chatWindow, termsDialog } = refs;
    state.isOpen = open;
    
    if (open) {
      chatWindow.style.display = 'flex';
      
      // Show terms dialog if not accepted yet
      if (!state.acceptedTerms) {
        termsDialog.style.display = 'flex';
      }
    } else {
      chatWindow.style.display = 'none';
    }
    
    log(`Chat window ${open ? 'opened' : 'closed'}`);
  }

  // Accept terms and conditions
  function acceptTerms() {
    const { termsDialog } = refs;
    state.acceptedTerms = true;
    termsDialog.style.display = 'none';
    log('Terms accepted');
  }

  // Toggle dark mode
  function toggleDarkMode() {
    const { container } = refs;
    state.isDarkMode = !state.isDarkMode;
    
    if (state.isDarkMode) {
      container.classList.add('sitehq-dark-mode');
    } else {
      container.classList.remove('sitehq-dark-mode');
    }
    
    // Update dark mode button icon
    const darkModeButton = container.querySelector('.sitehq-header-actions button:first-child');
    if (darkModeButton) {
      darkModeButton.innerHTML = '';
      darkModeButton.appendChild(
        state.isDarkMode ?
          createSVG([svgIcons.sun, svgIcons.sunCircle]) :
          createSVG(svgIcons.moon)
      );
    }
    
    log(`Dark mode ${state.isDarkMode ? 'enabled' : 'disabled'}`);
  }

  // Initialize chat connection
  async function initializeChat(config) {
    try {
      log('Initializing chat connection');
      
      if (!config.apiKey || !config.agentId) {
        error('Missing required API key or agent ID');
        setStatus('error');
        addMessage('assistant', 'Error: Missing required API key or agent ID. Please check your configuration.');
        return;
      }
      
      // Set connected status first
      setStatus('connected');
      
      // Add welcome message
      addMessage('assistant', 'Hello! How can I assist you today?');
      
      // Create WebSocket connection
      connectWebSocket(config);
      
    } catch (err) {
      error('Failed to initialize chat:', err);
      setStatus('error');
      addMessage('assistant', 'Sorry, there was an error initializing the chat. Please try again later.');
    }
  }

  // Create WebSocket connection
  function connectWebSocket(config) {
    try {
      // Close existing connection if any
      if (state.connection) {
        state.connection.close();
      }
      
      // Create new WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://api.elevenlabs.io/v1/text-to-speech/synthesis/voice-chat/websocket`;
      
      const socket = new WebSocket(wsUrl);
      state.connection = socket;
      
      socket.onopen = () => {
        log('WebSocket connection established');
        
        // Send auth message
        const authMessage = {
          text: "",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          },
          xi_api_key: config.apiKey,
          agent_id: config.agentId,
          initial_latency: 3,
          model_id: "eleven_turbo_v2",
          speaker_boost: true,
          optimize_streaming_latency: 4
        };
        
        socket.send(JSON.stringify(authMessage));
        log('Authentication message sent');
        
        setStatus('connected');
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log('Message received:', data);
          
          if (data.type === 'message') {
            addMessage('assistant', data.text);
          } else if (data.type === 'status') {
            console.log('SiteHQ Chat: Status update:', data.status);
            setStatus(data.status);
            if (data.status === 'speaking') {
              // Handle speaking state
            } else if (data.status === 'listening') {
              // Handle listening state 
            }
          } else if (data.type === 'voice_status') {
            // Handle voice-specific status updates
            console.log('SiteHQ Chat: Voice status update:', data.status);
            // Always log the voice status updates, useful for debugging
            if (data.status === 'listening') {
              console.log('SiteHQ Chat: Voice UI - LISTENING - showing mic wave animation');
              setStatus('listening');
            } else if (data.status === 'speaking') {
              console.log('SiteHQ Chat: Voice UI - SPEAKING - showing sound wave animation');
              setStatus('speaking');
            } else if (data.status === 'thinking') {
              console.log('SiteHQ Chat: Voice UI - THINKING - showing typing indicator');
              setStatus('thinking');
            }
          } else if (data.type === 'error') {
            console.error('SiteHQ Chat: Error from server:', data.message);
            addMessage('assistant', `Sorry, there was an error: ${data.message}`);
          }
        } catch (error) {
          console.error('SiteHQ Chat: Error parsing message:', error);
        }
      };
      
      socket.onclose = () => {
        log('WebSocket connection closed');
        setStatus('disconnected');
      };
      
      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        setStatus('error');
        addMessage('assistant', 'Sorry, there was an error with the connection. Please try again later.');
      };
    } catch (err) {
      error('Failed to connect to WebSocket:', err);
      setStatus('error');
      addMessage('assistant', 'Sorry, there was an error connecting to the chat service. Please try again later.');
    }
  }

  // Send a message
  function sendMessage() {
    const { messageInput } = refs;
    const content = messageInput.value.trim();
    
    if (!content) return;
    
    // Log the message for debugging
    log('Sending message:', content);
    
    // Add message to UI
    addMessage('user', content);
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Set UI status to typing
    setStatus('typing');
    
    // Send to websocket if connected
    if (state.connection && state.connection.readyState === WebSocket.OPEN) {
      const message = {
        text: content,
        action: "message"
      };
      
      try {
        state.connection.send(JSON.stringify(message));
        state.lastUserMessageTimestamp = Date.now();
      } catch (err) {
        error('Failed to send message:', err);
        setStatus('error');
        addMessage('assistant', 'Sorry, there was an error sending your message. Please try again.');
      }
    } else {
      error('Cannot send message - WebSocket not connected');
      setStatus('error');
      addMessage('assistant', 'Sorry, the chat connection is not available. Please try refreshing the page.');
    }
  }

  // Add a message to the chat UI
  function addMessage(role, content) {
    const { messagesContainer } = refs;
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `sitehq-message sitehq-${role}-message`;
    
    // Create message bubble
    const bubble = document.createElement('div');
    bubble.className = 'sitehq-message-bubble';
    bubble.textContent = content;
    
    messageEl.appendChild(bubble);
    messagesContainer.appendChild(messageEl);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Set chat status and update UI elements
  function setStatus(status) {
    console.log('SiteHQ Chat: Setting status to:', status);
    
    const statusIndicator = document.getElementById('sitehq-status');
    const typingIndicator = document.getElementById('sitehq-typing-indicator');
    const soundWave = document.getElementById('sitehq-sound-wave');
    const micWave = document.getElementById('sitehq-mic-wave');
    
    // Debug elements - log what we found
    console.log('SiteHQ Chat UI Elements:', {
      statusIndicator: !!statusIndicator,
      typingIndicator: !!typingIndicator,
      soundWave: !!soundWave,
      micWave: !!micWave
    });
    
    if (!statusIndicator || !typingIndicator) {
      console.error('SiteHQ Chat: Missing required UI elements');
      return;
    }
    
    // Hide all indicators first
    typingIndicator.style.display = 'none';
    if (soundWave) soundWave.style.display = 'none';
    if (micWave) micWave.style.display = 'none';
    
    switch (status) {
      case 'connected':
        statusIndicator.textContent = 'Connected';
        statusIndicator.className = 'sitehq-status sitehq-status-connected';
        break;
      case 'disconnected':
        statusIndicator.textContent = 'Disconnected';
        statusIndicator.className = 'sitehq-status sitehq-status-disconnected';
        break;
      case 'typing':
      case 'thinking':
        statusIndicator.textContent = '';
        typingIndicator.style.display = 'flex';
        console.log('SiteHQ Chat: Showing typing indicator');
        break;
      case 'speaking':
        statusIndicator.textContent = 'Speaking';
        statusIndicator.className = 'sitehq-status sitehq-status-connected';
        if (soundWave) {
          console.log('SiteHQ Chat: Showing sound wave animation');
          soundWave.style.display = 'flex';
        } else {
          console.error('SiteHQ Chat: Sound wave element missing!');
        }
        state.isSpeaking = true;
        break;
      case 'listening':
        statusIndicator.textContent = 'Listening';
        statusIndicator.className = 'sitehq-status sitehq-status-connected';
        if (micWave) {
          console.log('SiteHQ Chat: Showing mic wave animation');
          micWave.style.display = 'flex';
        } else {
          console.error('SiteHQ Chat: Mic wave element missing!');
        }
        state.isSpeaking = false;
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

  // Define the custom element
  class SiteHQChatElement extends HTMLElement {
    constructor() {
      super();
      
      // Extract attributes from custom element
      const config = {
        apiKey: this.getAttribute('api-key') || DEFAULT_CONFIG.apiKey,
        agentId: this.getAttribute('agent-id') || DEFAULT_CONFIG.agentId,
        position: this.getAttribute('position') || DEFAULT_CONFIG.position,
        darkMode: this.getAttribute('dark-mode') === 'true',
        initiallyOpen: this.getAttribute('initially-open') === 'true',
        widgetTitle: this.getAttribute('title') || DEFAULT_CONFIG.widgetTitle,
        useSolarSystemTheme: this.getAttribute('solar-system-theme') === 'true' || DEFAULT_CONFIG.useSolarSystemTheme,
        debug: this.getAttribute('debug') === 'true'
      };
      
      // Try to parse theme if provided
      if (this.hasAttribute('theme')) {
        try {
          const themeData = JSON.parse(this.getAttribute('theme'));
          config.theme = { ...DEFAULT_CONFIG.theme, ...themeData };
        } catch (e) {
          warn('Failed to parse theme JSON:', e);
        }
      }
      
      this.config = config;
    }
    
    connectedCallback() {
      // Initialize the widget when the element is added to the DOM
      initializeWidget(this.config);
    }
    
    disconnectedCallback() {
      // Clean up when the element is removed from the DOM
      if (state.connection) {
        state.connection.close();
      }
      
      // Remove the widget from the DOM
      if (refs.container && refs.container.parentNode) {
        refs.container.parentNode.removeChild(refs.container);
      }
      
      // Remove styles
      const styleEl = document.getElementById('sitehq-chat-styles');
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    }
  }

  // Register custom element if customElements is supported
  if (window.customElements) {
    window.customElements.define('sitehq-chat', SiteHQChatElement);
  }

  // Auto-initialize from script attributes if present
  function autoInitialize() {
    const scriptEl = document.querySelector('script[data-sitehq-chat="auto"]');
    
    if (scriptEl) {
      const config = {
        apiKey: scriptEl.getAttribute('data-api-key') || DEFAULT_CONFIG.apiKey,
        agentId: scriptEl.getAttribute('data-agent-id') || DEFAULT_CONFIG.agentId,
        position: scriptEl.getAttribute('data-position') || DEFAULT_CONFIG.position,
        darkMode: scriptEl.getAttribute('data-dark-mode') === 'true',
        initiallyOpen: scriptEl.getAttribute('data-initially-open') === 'true',
        widgetTitle: scriptEl.getAttribute('data-title') || DEFAULT_CONFIG.widgetTitle,
        useSolarSystemTheme: scriptEl.getAttribute('data-solar-system-theme') === 'true' || DEFAULT_CONFIG.useSolarSystemTheme,
        debug: scriptEl.getAttribute('data-debug') === 'true'
      };
      
      // Try to parse theme if provided
      const themeAttr = scriptEl.getAttribute('data-theme');
      if (themeAttr) {
        try {
          const themeData = JSON.parse(themeAttr);
          config.theme = { ...DEFAULT_CONFIG.theme, ...themeData };
        } catch (e) {
          warn('Failed to parse theme JSON:', e);
        }
      }
      
      // Initialize the widget
      initializeWidget(config);
    }
  }

  // Run auto-initialization when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    autoInitialize();
  }
})();
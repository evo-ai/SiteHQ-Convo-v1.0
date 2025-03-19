/**
 * SiteHQ Debug Chat Bubble
 * A debugging version of the standalone chat widget with forced UI animations
 */

(function() {
  'use strict';
  
  // Constants and state
  const DEFAULT_CONFIG = {
    position: 'bottom-right',
    apiKey: 'demo-key',
    agentId: 'demo-agent',
    widgetTitle: 'Chat with AI',
    useSolarSystemTheme: false,
    theme: {
      primary: '#5c078c',
      background: '#ffffff',
      text: '#333333'
    }
  };
  
  // SVG icons
  const SVGS = {
    chat: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    send: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
  };
  
  // Debug mode
  let debugMode = true;
  
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
  
  // Widget state
  const state = {
    isChatOpen: false,
    isDarkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
    connection: null,
    hasAcceptedTerms: false,
    isSpeaking: false,
    lastUserMessageTimestamp: 0,
    debugMode: debugMode
  };
  
  // Logger functions
  function log(...args) {
    if (debugMode) {
      console.log('[SiteHQ Chat]', ...args);
    }
  }
  
  function warn(...args) {
    console.warn('[SiteHQ Chat]', ...args);
  }
  
  function error(...args) {
    console.error('[SiteHQ Chat]', ...args);
  }
  
  // Inject styles
  function injectStyles() {
    const styleEl = document.createElement('style');
    styleEl.id = 'sitehq-chat-styles';
    styleEl.textContent = `
      .sitehq-container {
        position: fixed;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      
      .sitehq-bottom-right {
        bottom: 20px;
        right: 20px;
      }
      
      .sitehq-bottom-left {
        bottom: 20px;
        left: 20px;
      }
      
      .sitehq-top-right {
        top: 20px;
        right: 20px;
      }
      
      .sitehq-top-left {
        top: 20px;
        left: 20px;
      }
      
      .sitehq-toggle-button {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #5c078c, #5c078cDD);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        box-shadow: 0 4px 15px rgba(92, 7, 140, 0.3);
        transition: all 0.3s ease;
        padding: 0;
        overflow: hidden;
      }
      
      .sitehq-dark-mode .sitehq-toggle-button {
        background: radial-gradient(circle at 30% 30%, #bb86fc, #bb86fcDD);
        color: #000;
      }
      
      .sitehq-toggle-button svg {
        width: 24px;
        height: 24px;
        transition: transform 0.3s ease;
      }
      
      /* Solar system theme styles */
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
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .sitehq-dark-mode .sitehq-header {
        border-bottom-color: #333;
      }
      
      .sitehq-header-content {
        display: flex;
        flex-direction: column;
      }
      
      .sitehq-header-title {
        font-weight: bold;
        font-size: 16px;
        color: #333;
      }
      
      .sitehq-dark-mode .sitehq-header-title {
        color: #f5f5f5;
      }
      
      .sitehq-status {
        font-size: 12px;
        color: #666;
      }
      
      .sitehq-dark-mode .sitehq-status {
        color: #aaa;
      }
      
      .sitehq-header-actions {
        display: flex;
        gap: 10px;
      }
      
      .sitehq-icon-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: background-color 0.2s;
      }
      
      .sitehq-dark-mode .sitehq-icon-button {
        color: #aaa;
      }
      
      .sitehq-icon-button:hover {
        background-color: #f5f5f5;
        color: #333;
      }
      
      .sitehq-dark-mode .sitehq-icon-button:hover {
        background-color: #333;
        color: #f5f5f5;
      }
      
      .sitehq-icon-button svg {
        width: 18px;
        height: 18px;
      }
      
      .sitehq-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px 20px;
        display: flex;
        flex-direction: column;
        max-height: 300px;
      }
      
      .sitehq-message {
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
        max-width: 80%;
      }
      
      .sitehq-user-message {
        align-self: flex-end;
      }
      
      .sitehq-assistant-message {
        align-self: flex-start;
      }
      
      .sitehq-message-bubble {
        padding: 10px 15px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        position: relative;
        word-wrap: break-word;
      }
      
      .sitehq-user-message .sitehq-message-bubble {
        background-color: #f0f0f0;
        color: #333;
        border-bottom-right-radius: 4px;
      }
      
      .sitehq-dark-mode .sitehq-user-message .sitehq-message-bubble {
        background-color: #333;
        color: #f5f5f5;
      }
      
      .sitehq-assistant-message .sitehq-message-bubble {
        background-color: #5c078c;
        color: white;
        border-bottom-left-radius: 4px;
      }
      
      .sitehq-dark-mode .sitehq-assistant-message .sitehq-message-bubble {
        background-color: #bb86fc;
        color: #000;
      }
      
      .sitehq-typing-indicator {
        display: none;
        align-items: center;
        padding: 15px 20px;
        margin: 0 0 15px 20px;
      }
      
      .sitehq-typing-dot {
        width: 8px;
        height: 8px;
        background-color: #aaa;
        border-radius: 50%;
        margin-right: 5px;
        animation: sitehq-typing 1.5s infinite ease-in-out;
      }
      
      .sitehq-dark-mode .sitehq-typing-dot {
        background-color: #666;
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
      
      @keyframes sitehq-typing {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-5px);
        }
      }
      
      .sitehq-input-area {
        padding: 15px 20px;
        border-top: 1px solid #eee;
        display: flex;
        position: relative;
      }
      
      .sitehq-dark-mode .sitehq-input-area {
        border-top-color: #333;
      }
      
      .sitehq-message-input {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 18px;
        padding: 10px 15px;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.4;
        max-height: 100px;
        overflow-y: auto;
      }
      
      .sitehq-dark-mode .sitehq-message-input {
        background-color: #333;
        border-color: #444;
        color: #f5f5f5;
      }
      
      .sitehq-message-input:focus {
        outline: none;
        border-color: #5c078c;
      }
      
      .sitehq-dark-mode .sitehq-message-input:focus {
        border-color: #bb86fc;
      }
      
      .sitehq-send-button {
        background: none;
        border: none;
        padding: 0 0 0 10px;
        cursor: pointer;
        color: #5c078c;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .sitehq-dark-mode .sitehq-send-button {
        color: #bb86fc;
      }
      
      .sitehq-send-button svg {
        width: 20px;
        height: 20px;
      }
      
      .sitehq-send-button:hover svg {
        transform: translateX(2px);
      }
      
      .sitehq-terms-dialog {
        position: absolute;
        inset: 0;
        background-color: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        animation: sitehq-fade-in 0.3s ease-out;
      }
      
      .sitehq-dark-mode .sitehq-terms-dialog {
        background-color: rgba(34, 34, 34, 0.95);
      }
      
      @keyframes sitehq-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      .sitehq-terms-content {
        max-width: 300px;
        padding: 20px;
        text-align: center;
      }
      
      .sitehq-terms-content h3 {
        margin-top: 0;
        color: #333;
      }
      
      .sitehq-dark-mode .sitehq-terms-content h3 {
        color: #f5f5f5;
      }
      
      .sitehq-terms-content p {
        font-size: 14px;
        line-height: 1.5;
        color: #666;
        margin-bottom: 20px;
      }
      
      .sitehq-dark-mode .sitehq-terms-content p {
        color: #aaa;
      }
      
      .sitehq-terms-buttons {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }
      
      .sitehq-cancel-button {
        background-color: #f0f0f0;
        color: #333;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        flex: 1;
      }
      
      .sitehq-dark-mode .sitehq-cancel-button {
        background-color: #333;
        color: #f5f5f5;
      }
      
      .sitehq-primary-button {
        background-color: #5c078c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        flex: 1;
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
      
      .sitehq-bubble-state {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      
      .sitehq-bubble-content {
        background-color: white;
        padding: 10px 15px;
        margin-bottom: 15px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        max-width: 250px;
      }
      
      .sitehq-dark-mode .sitehq-bubble-content {
        background-color: #2d2d2d;
        color: #f5f5f5;
      }
      
      .sitehq-status-buttons {
        display: flex;
        justify-content: center;
        margin-top: 10px;
        padding: 0 10px;
        gap: 5px;
      }
      
      .sitehq-status-button {
        background-color: #f0f0f0;
        color: #333;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .sitehq-dark-mode .sitehq-status-button {
        background-color: #333;
        color: #f5f5f5;
      }
      
      .sitehq-status-button:hover {
        background-color: #e0e0e0;
      }
      
      .sitehq-status-button.sitehq-speaking {
        background-color: #5c078c;
        color: white;
      }
      
      .sitehq-status-button.sitehq-listening {
        background-color: #f43f5e;
        color: white;
      }
    `;
    document.head.appendChild(styleEl);
  }
  
  // Create SVG from path
  function createSVG(path) {
    const svgEl = document.createElement('div');
    svgEl.innerHTML = path;
    return svgEl.firstChild;
  }
  
  // Create widget DOM
  function createWidgetDOM(config) {
    // Create container
    const container = document.createElement('div');
    container.className = `sitehq-container sitehq-${config.position}`;
    if (config.darkMode) {
      container.classList.add('sitehq-dark-mode');
    }
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'sitehq-toggle-button';
    toggleButton.setAttribute('aria-label', 'Toggle chat');
    
    // Add solar system theme elements if enabled
    if (config.useSolarSystemTheme) {
      const sunParticle = document.createElement('div');
      sunParticle.className = 'sitehq-particle sitehq-sun-particle';
      
      const planetParticle = document.createElement('div');
      planetParticle.className = 'sitehq-particle sitehq-planet-particle';
      
      toggleButton.appendChild(sunParticle);
      toggleButton.appendChild(planetParticle);
    }
    
    const chatIcon = createSVG(SVGS.chat);
    toggleButton.appendChild(chatIcon);
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'sitehq-tooltip';
    tooltip.textContent = 'Chat with our AI assistant';
    
    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'sitehq-chat-window';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'sitehq-header';
    
    const headerContent = document.createElement('div');
    headerContent.className = 'sitehq-header-content';
    
    const headerTitle = document.createElement('div');
    headerTitle.className = 'sitehq-header-title';
    headerTitle.textContent = config.widgetTitle;
    
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
    
    // Add test buttons for status
    const statusButtons = document.createElement('div');
    statusButtons.className = 'sitehq-status-buttons';
    
    const speakingButton = document.createElement('button');
    speakingButton.className = 'sitehq-status-button sitehq-speaking';
    speakingButton.textContent = 'Speaking';
    speakingButton.addEventListener('click', () => {
      setStatus('speaking');
    });
    
    const listeningButton = document.createElement('button');
    listeningButton.className = 'sitehq-status-button sitehq-listening';
    listeningButton.textContent = 'Listening';
    listeningButton.addEventListener('click', () => {
      setStatus('listening');
    });
    
    const typingButton = document.createElement('button');
    typingButton.className = 'sitehq-status-button';
    typingButton.textContent = 'Typing';
    typingButton.addEventListener('click', () => {
      setStatus('typing');
    });
    
    statusButtons.appendChild(speakingButton);
    statusButtons.appendChild(listeningButton);
    statusButtons.appendChild(typingButton);
    
    headerContent.appendChild(statusButtons);
    
    const headerActions = document.createElement('div');
    headerActions.className = 'sitehq-header-actions';
    
    const darkModeButton = document.createElement('button');
    darkModeButton.className = 'sitehq-icon-button';
    darkModeButton.setAttribute('aria-label', 'Toggle dark mode');
    
    const darkModeIcon = state.isDarkMode ? 
      createSVG(SVGS.sun) : 
      createSVG(SVGS.moon);
    darkModeButton.appendChild(darkModeIcon);
    
    const closeButton = document.createElement('button');
    closeButton.className = 'sitehq-icon-button';
    closeButton.setAttribute('aria-label', 'Close chat');
    
    const closeIcon = createSVG(SVGS.close);
    closeButton.appendChild(closeIcon);
    
    headerActions.appendChild(darkModeButton);
    headerActions.appendChild(closeButton);
    
    header.appendChild(headerContent);
    header.appendChild(headerActions);
    
    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'sitehq-messages';
    
    // Create typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'sitehq-typing-indicator';
    typingIndicator.id = 'sitehq-typing-indicator';
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'sitehq-typing-dot';
      typingIndicator.appendChild(dot);
    }
    
    // Create input area
    const inputArea = document.createElement('div');
    inputArea.className = 'sitehq-input-area';
    
    const messageInput = document.createElement('textarea');
    messageInput.className = 'sitehq-message-input';
    messageInput.placeholder = 'Type your message...';
    messageInput.rows = 1;
    
    const sendButton = document.createElement('button');
    sendButton.className = 'sitehq-send-button';
    sendButton.setAttribute('aria-label', 'Send message');
    
    const sendIcon = createSVG(SVGS.send);
    sendButton.appendChild(sendIcon);
    
    inputArea.appendChild(messageInput);
    inputArea.appendChild(sendButton);
    
    // Create terms dialog with improved styling
    const termsDialog = document.createElement('div');
    termsDialog.className = 'sitehq-terms-dialog';
    
    const termsContent = document.createElement('div');
    termsContent.className = 'sitehq-terms-content';
    
    const termsTitle = document.createElement('h3');
    termsTitle.textContent = 'Terms and conditions';
    
    const termsText = document.createElement('p');
    termsText.textContent = 'By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as described in the Privacy Policy. If you do not wish to have your conversations recorded, please refrain from using this service.';
    
    // Create a container for the buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'sitehq-terms-buttons';
    
    // Create Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'sitehq-cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', function() {
      toggleChatWindow(false);
    });
    
    // Create Accept button
    const acceptButton = document.createElement('button');
    acceptButton.className = 'sitehq-primary-button';
    acceptButton.textContent = 'Agree';
    
    // Add buttons to container
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(acceptButton);
    
    termsContent.appendChild(termsTitle);
    termsContent.appendChild(termsText);
    termsContent.appendChild(buttonsContainer);
    
    termsDialog.appendChild(termsContent);
    
    // Assemble chat window
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(typingIndicator);
    chatWindow.appendChild(inputArea);
    chatWindow.appendChild(termsDialog);
    
    // Create branding
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
    
    // Assemble container
    container.appendChild(chatWindow);
    container.appendChild(toggleButton);
    container.appendChild(tooltip);
    container.appendChild(branding);
    
    // Store DOM references
    refs.container = container;
    refs.chatWindow = chatWindow;
    refs.chatButton = toggleButton;
    refs.messagesContainer = messagesContainer;
    refs.typingIndicator = typingIndicator;
    refs.messageInput = messageInput;
    refs.termsDialog = termsDialog;
    
    return container;
  }
  
  // Apply config from attributes or passed object
  function applyConfig() {
    const config = {
      ...DEFAULT_CONFIG
    };
    
    // If called from an element, extract attributes
    if (this instanceof HTMLElement) {
      // Extract values from attributes
      if (this.hasAttribute('api-key')) {
        config.apiKey = this.getAttribute('api-key');
      }
      
      if (this.hasAttribute('agent-id')) {
        config.agentId = this.getAttribute('agent-id');
      }
      
      if (this.hasAttribute('position')) {
        config.position = this.getAttribute('position');
      }
      
      if (this.hasAttribute('dark-mode')) {
        config.darkMode = this.getAttribute('dark-mode') === 'true';
      }
      
      if (this.hasAttribute('title')) {
        config.widgetTitle = this.getAttribute('title');
      }
      
      if (this.hasAttribute('debug')) {
        debugMode = this.getAttribute('debug') === 'true';
      }
      
      if (this.hasAttribute('solar-system-theme')) {
        config.useSolarSystemTheme = this.getAttribute('solar-system-theme') === 'true';
      }
      
      // Try to parse JSON theme
      if (this.hasAttribute('theme')) {
        try {
          const themeData = JSON.parse(this.getAttribute('theme'));
          config.theme = { ...DEFAULT_CONFIG.theme, ...themeData };
        } catch (e) {
          warn('Invalid theme JSON in element attribute:', e);
        }
      }
    }
    
    if (debugMode) {
      log('Configuration:', config);
    }
    
    return config;
  }
  
  // Initialize widget
  function initializeWidget(config) {
    if (!config) {
      throw new Error('Configuration is required');
    }
    
    // Apply theme
    if (config.theme) {
      document.documentElement.style.setProperty('--primary-color', config.theme.primary);
    }
    
    // Inject styles
    injectStyles();
    
    // Create DOM elements
    const container = createWidgetDOM(config);
    document.body.appendChild(container);
    
    // Setup event listeners for the widget
    setupEventListeners();
    
    // Apply initial state
    if (config.initiallyOpen) {
      toggleChatWindow(true);
    }
    
    // Simulate accepting terms (for testing)
    setTimeout(() => {
      acceptTerms();
      addMessage('assistant', 'Hello! How can I assist you today?');
      setStatus('connected');
    }, 500);
    
    log('Widget initialized with configuration:', config);
  }
  
  // Setup event listeners
  function setupEventListeners() {
    const { chatButton, chatWindow, messageInput, termsDialog } = refs;
    
    // Toggle chat window
    chatButton.addEventListener('click', () => {
      toggleChatWindow(!state.isChatOpen);
    });
    
    // Close chat window with X button
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
    
    // Send message on button click
    const sendButton = chatWindow.querySelector('.sitehq-send-button');
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
          sendMessage(message);
          messageInput.value = '';
          // Auto resize input
          messageInput.style.height = 'auto';
        }
      });
    }
    
    // Send message on Enter (but allow Shift+Enter for new line)
    if (messageInput) {
      messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          const message = messageInput.value.trim();
          if (message) {
            sendMessage(message);
            messageInput.value = '';
            // Auto resize input
            messageInput.style.height = 'auto';
          }
        }
      });
      
      // Auto-resize input as user types
      messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
    }
    
    // Accept terms
    const acceptButton = termsDialog.querySelector('.sitehq-primary-button');
    if (acceptButton) {
      acceptButton.addEventListener('click', acceptTerms);
    }
  }
  
  // Toggle chat window
  function toggleChatWindow(open) {
    const { chatWindow } = refs;
    state.isChatOpen = open;
    
    if (open) {
      chatWindow.style.display = 'flex';
    } else {
      chatWindow.style.display = 'none';
    }
    
    log(`Chat window ${open ? 'opened' : 'closed'}`);
  }
  
  // Show terms dialog
  function showTermsDialog() {
    const { termsDialog } = refs;
    termsDialog.style.display = 'flex';
    log('Terms dialog shown');
  }
  
  // Accept terms
  function acceptTerms() {
    const { termsDialog } = refs;
    state.hasAcceptedTerms = true;
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
        createSVG(state.isDarkMode ? SVGS.sun : SVGS.moon)
      );
    }
    
    log(`Dark mode ${state.isDarkMode ? 'enabled' : 'disabled'}`);
  }
  
  // Initialize chat connection
  function initializeChat() {
    log('Initializing chat - no real connection in debug mode');
    setStatus('connected');
  }
  
  // Send a message to the server
  function sendMessage(content) {
    if (!content) return;
    
    // Add user message to UI
    addMessage('user', content);
    
    // Set typing indicator
    setStatus('typing');
    
    // Show response after a delay (simulating AI response)
    setTimeout(() => {
      // Set speaking state first
      setStatus('speaking');
      
      // Then add a message
      setTimeout(() => {
        addMessage('assistant', 'Here is a simulated response to your message. This is debug mode so voice animations can be tested with the buttons above.');
        
        // Set listening state after message is shown
        setTimeout(() => {
          setStatus('listening');
          
          // Return to idle state after a delay
          setTimeout(() => {
            setStatus('connected');
          }, 3000);
        }, 2000);
      }, 1000);
    }, 1000);
  }
  
  // Add a message to the chat
  function addMessage(role, content) {
    const { messagesContainer } = refs;
    
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
      const primaryColor = window.sitehqConfig?.theme?.primary || DEFAULT_CONFIG.theme.primary;
      bubble.style.backgroundColor = primaryColor;
    }
    
    messageElement.appendChild(bubble);
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Set chat status and update UI
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
  
  // Custom Element for widget
  class SiteHQChatWidget extends HTMLElement {
    constructor() {
      super();
      
      // Extract config from attributes
      this.config = applyConfig.call(this);
    }
    
    connectedCallback() {
      // Initialize widget when element is connected to DOM
      initializeWidget(this.config);
    }
    
    disconnectedCallback() {
      // Clean up when element is removed from DOM
      if (state.connection) {
        state.connection.close();
      }
      
      // Remove DOM elements
      if (refs.container && refs.container.parentNode) {
        refs.container.parentNode.removeChild(refs.container);
      }
      
      // Remove style element
      const styleEl = document.getElementById('sitehq-chat-styles');
      if (styleEl) {
        styleEl.parentNode.removeChild(styleEl);
      }
    }
  }
  
  // Register custom element
  if (window.customElements) {
    window.customElements.define('sitehq-debug-chat', SiteHQChatWidget);
  }
  
  // Global initialization function
  window.SiteHQDebugChat = {
    init: function(config) {
      window.sitehqConfig = config;
      initializeWidget(config);
    }
  };
  
  // Auto initialize if data attribute is present
  function autoInitialize() {
    // First look for a script with auto attribute
    const script = document.querySelector('script[data-sitehq-debug-chat="auto"]');
    
    // If not found, look for any script that might have our attributes
    const anyScript = script || document.querySelector('script[data-debug-api-key], script[data-debug-agent-id]');
    
    if (anyScript) {
      // Check for debug mode
      debugMode = anyScript.getAttribute('data-debug') === 'true';
      
      if (debugMode) {
        console.log('[SiteHQ Debug Chat] Initializing widget in debug mode');
      }
      
      const config = {
        apiKey: anyScript.getAttribute('data-debug-api-key') || DEFAULT_CONFIG.apiKey,
        agentId: anyScript.getAttribute('data-debug-agent-id') || DEFAULT_CONFIG.agentId,
        position: anyScript.getAttribute('data-debug-position') || DEFAULT_CONFIG.position,
        darkMode: anyScript.getAttribute('data-debug-dark-mode') === 'true',
        initiallyOpen: anyScript.getAttribute('data-debug-initially-open') === 'true',
        widgetTitle: anyScript.getAttribute('data-debug-title') || DEFAULT_CONFIG.widgetTitle,
        useSolarSystemTheme: anyScript.getAttribute('data-debug-solar-system-theme') === 'true' || DEFAULT_CONFIG.useSolarSystemTheme,
        debug: debugMode
      };
      
      // Parse theme if provided
      const themeAttr = anyScript.getAttribute('data-debug-theme');
      if (themeAttr) {
        try {
          const themeData = JSON.parse(themeAttr);
          config.theme = { ...DEFAULT_CONFIG.theme, ...themeData };
          if (debugMode) {
            log('Parsed theme data:', themeData);
          }
        } catch (e) {
          warn('Invalid theme JSON in data attribute:', e);
        }
      }
      
      if (debugMode) {
        log('Widget configuration:', config);
      }
      
      // Initialize widget
      window.SiteHQDebugChat.init(config);
    } else if (debugMode) {
      warn('No script with debug attributes found');
    }
  }
  
  // Run auto-initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    autoInitialize();
  }
})();
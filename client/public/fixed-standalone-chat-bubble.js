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
      
      .sitehq-active-state {
        background-color: white;
        padding: 15px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 280px;
      }
      
      .sitehq-dark-mode .sitehq-active-state {
        background-color: #2d2d2d;
        color: #f5f5f5;
      }
      
      .sitehq-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #5c078c, #5c078cDD);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        position: relative;
      }
      
      .sitehq-avatar-indicator {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        background-color: #4CAF50;
        border-radius: 50%;
        border: 2px solid white;
      }
      
      .sitehq-dark-mode .sitehq-avatar-indicator {
        border-color: #2d2d2d;
      }
      
      .sitehq-dark-mode-toggle {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #555;
        z-index: 20;
      }
      
      .sitehq-dark-mode .sitehq-dark-mode-toggle {
        color: #ddd;
      }
      
      .sitehq-dark-mode-toggle:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .sitehq-dark-mode .sitehq-dark-mode-toggle:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Function to create SVG elements
  function createSVG(path) {
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

  // SVG path data
  const SVGS = {
    chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    close: 'M18 6L6 18M6 6l12 12',
    mic: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42',
    moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  };

  // Create the widget DOM
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
    
    const statusEl = document.createElement('div');
    statusEl.className = 'sitehq-status';
    statusEl.id = 'sitehq-status';
    statusEl.textContent = 'Initializing...';
    
    headerContent.appendChild(headerTitle);
    headerContent.appendChild(statusEl);
    
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

  // Apply configuration from user settings and data attributes
  function applyConfig(userConfig) {
    // Start with default config
    const config = { ...DEFAULT_CONFIG };
    
    // Apply any user config from initialization
    if (userConfig) {
      Object.assign(config, userConfig);
    }
    
    // Apply configs from data attributes if this is being used as a custom element
    if (this instanceof HTMLElement) {
      const el = this;
      
      if (el.hasAttribute('api-key')) {
        config.apiKey = el.getAttribute('api-key');
      }
      
      if (el.hasAttribute('agent-id')) {
        config.agentId = el.getAttribute('agent-id');
      }
      
      if (el.hasAttribute('position')) {
        config.position = el.getAttribute('position');
      }
      
      if (el.hasAttribute('title')) {
        config.widgetTitle = el.getAttribute('title');
      }
      
      if (el.hasAttribute('dark-mode')) {
        config.darkMode = el.getAttribute('dark-mode') === 'true';
      }
      
      if (el.hasAttribute('theme')) {
        try {
          const themeData = JSON.parse(el.getAttribute('theme'));
          config.theme = { ...config.theme, ...themeData };
        } catch (e) {
          console.warn('SiteHQ Chat: Invalid theme JSON in data attribute');
        }
      }
      
      if (el.hasAttribute('initially-open')) {
        config.initiallyOpen = el.getAttribute('initially-open') === 'true';
      }
      
      // Support both attribute formats for solar system theme
      if (el.hasAttribute('data-solar-system-theme')) {
        config.useSolarSystemTheme = el.getAttribute('data-solar-system-theme') === 'true';
      }
      
      // Support standard 'solar-system-theme' attribute (without data- prefix)
      if (el.hasAttribute('solar-system-theme')) {
        config.useSolarSystemTheme = el.getAttribute('solar-system-theme') === 'true';
      }
      
      // Enable debug mode if debug attribute is set
      if (el.hasAttribute('debug')) {
        config.debug = el.getAttribute('debug') === 'true';
        if (config.debug) {
          debugMode = true;
          console.log('[SiteHQ Chat] Debug mode enabled via custom element');
        }
      }
    }
    
    // Update state
    state.isDarkMode = config.darkMode;
    
    return config;
  }

  // Initialize the widget
  function initializeWidget(config) {
    // Enable debug mode if configured
    debugMode = config.debug === true;
    
    log('Initializing widget with config:', config);
    
    // 1. Inject styles
    injectStyles();
    log('Styles injected');
    
    // 2. Create widget DOM
    const widgetElement = createWidgetDOM(config);
    log('Widget DOM created');
    
    // 3. Append to document
    document.body.appendChild(widgetElement);
    log('Widget appended to document body');
    
    // 4. Setup event listeners
    setupEventListeners();
    log('Event listeners set up');
    
    // 5. Open chat if initiallyOpen is true
    if (config.initiallyOpen) {
      log('Auto-opening chat window based on initiallyOpen=true');
      toggleChatWindow(true);
    }
    
    log('Widget initialization complete');
  }

  // Setup event listeners
  function setupEventListeners() {
    const {
      chatButton,
      chatWindow,
      messageInput,
      termsDialog
    } = refs;
    
    // Toggle chat on button click
    if (chatButton) {
      chatButton.addEventListener('click', function() {
        toggleChatWindow(true);
      });
    }
    
    // Dark mode toggle
    const darkModeToggle = chatWindow.querySelector('.sitehq-icon-button[aria-label="Toggle dark mode"]');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Close chat
    const closeButton = chatWindow.querySelector('.sitehq-icon-button[aria-label="Close chat"]');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        toggleChatWindow(false);
      });
    }
    
    // Accept terms
    const acceptButton = termsDialog.querySelector('.sitehq-primary-button');
    if (acceptButton) {
      acceptButton.addEventListener('click', function() {
        acceptTerms();
      });
    }
    
    // Send message
    const sendButton = chatWindow.querySelector('.sitehq-send-button');
    if (sendButton && messageInput) {
      // Send on button click
      sendButton.addEventListener('click', function() {
        const message = messageInput.value.trim();
        if (message) {
          sendMessage(message);
          messageInput.value = '';
        }
      });
      
      // Send on Enter key
      messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const message = messageInput.value.trim();
          if (message) {
            sendMessage(message);
            messageInput.value = '';
          }
        }
      });
    }
  }

  // Toggle the chat window visibility
  function toggleChatWindow(open) {
    const { chatWindow, chatButton, termsDialog } = refs;
    
    if (open === undefined) {
      open = !state.isOpen;
    }
    
    state.isOpen = open;
    
    if (chatWindow && chatButton) {
      if (open) {
        chatWindow.style.display = 'flex';
        chatButton.style.display = 'none';
        
        // Initialize chat if not already done
        if (!state.isInitialized) {
          showTermsDialog();
          state.isInitialized = true;
        }
        
        // Focus input
        setTimeout(() => {
          if (refs.messageInput) {
            refs.messageInput.focus();
          }
        }, 300);
      } else {
        chatWindow.style.display = 'none';
        chatButton.style.display = 'flex';
      }
    }
  }

  // Show terms and conditions dialog
  function showTermsDialog() {
    if (refs.termsDialog) {
      refs.termsDialog.style.display = 'flex';
    }
  }

  // Accept terms and connect to chat
  function acceptTerms() {
    state.acceptedTerms = true;
    
    if (refs.termsDialog) {
      refs.termsDialog.style.display = 'none';
    }
    
    // Initialize the real chat connection
    initializeChat();
  }

  // Toggle dark mode
  function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    
    if (refs.container) {
      if (state.isDarkMode) {
        refs.container.classList.add('sitehq-dark-mode');
      } else {
        refs.container.classList.remove('sitehq-dark-mode');
      }
    }
  }

  // Initialize the chat connection
  function initializeChat() {
    try {
      // Add initial greeting message
      addMessage('assistant', 'Hello! How can I assist you today?');
      
      // Get API base URL
      const apiBase = window.sitehqConfig?.apiBase || 'https://api.sitehq.ai';
      
      // Create WebSocket connection
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/chat`;
      
      state.connection = new WebSocket(wsUrl);
      
      state.connection.onopen = function() {
        console.log('SiteHQ Chat: WebSocket connection established');
        setStatus('connected');
        
        // Send initialization message with API key and agent ID
        state.connection.send(JSON.stringify({
          type: 'init',
          apiKey: window.sitehqConfig?.apiKey || DEFAULT_CONFIG.apiKey,
          agentId: window.sitehqConfig?.agentId || DEFAULT_CONFIG.agentId
        }));
      };
      
      state.connection.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            addMessage('assistant', data.content);
            state.isSpeaking = false;
          } else if (data.type === 'status') {
            setStatus(data.status);
            if (data.status === 'speaking') {
              state.isSpeaking = true;
            } else if (data.status === 'listening') {
              state.isSpeaking = false;
            }
          } else if (data.type === 'error') {
            console.error('SiteHQ Chat: Error from server:', data.message);
            addMessage('assistant', `Sorry, there was an error: ${data.message}`);
          }
        } catch (error) {
          console.error('SiteHQ Chat: Error parsing message:', error);
        }
      };
      
      state.connection.onclose = function() {
        console.log('SiteHQ Chat: WebSocket connection closed');
        setStatus('disconnected');
      };
      
      state.connection.onerror = function(error) {
        console.error('SiteHQ Chat: WebSocket error:', error);
        setStatus('error');
      };
    } catch (error) {
      console.error('SiteHQ Chat: Initialization error:', error);
      addMessage('assistant', 'Sorry, I encountered an error while connecting. Please try again later.');
    }
  }

  // Send a message to the server
  function sendMessage(content) {
    if (!content || !state.connection) return;
    
    // Add user message to UI
    addMessage('user', content);
    
    // Set typing indicator
    setStatus('typing');
    
    // Record timestamp to measure response time
    state.lastUserMessageTimestamp = Date.now();
    
    // Send message to server
    state.connection.send(JSON.stringify({
      type: 'message',
      content
    }));
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
    const statusIndicator = document.getElementById('sitehq-status');
    const typingIndicator = document.getElementById('sitehq-typing-indicator');
    
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
      case 'thinking':
        statusIndicator.textContent = '';
        typingIndicator.style.display = 'flex';
        break;
      case 'speaking':
        statusIndicator.textContent = 'Speaking';
        statusIndicator.className = 'sitehq-status sitehq-status-connected';
        typingIndicator.style.display = 'none';
        state.isSpeaking = true;
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
    window.customElements.define('sitehq-chat', SiteHQChatWidget);
  }

  // Global initialization function
  window.SiteHQChat = {
    init: function(config) {
      window.sitehqConfig = config;
      initializeWidget(config);
    }
  };

  // Auto initialize if data attribute is present
  function autoInitialize() {
    // First look for a script with auto attribute
    const script = document.querySelector('script[data-sitehq-chat="auto"]');
    
    // If not found, look for any script that might have our attributes
    const anyScript = script || document.querySelector('script[data-api-key], script[data-agent-id]');
    
    if (anyScript) {
      // Check for debug mode
      debugMode = anyScript.getAttribute('data-debug') === 'true';
      
      if (debugMode) {
        console.log('[SiteHQ Chat] Initializing widget in debug mode');
      }
      
      const config = {
        apiKey: anyScript.getAttribute('data-api-key') || DEFAULT_CONFIG.apiKey,
        agentId: anyScript.getAttribute('data-agent-id') || DEFAULT_CONFIG.agentId,
        position: anyScript.getAttribute('data-position') || DEFAULT_CONFIG.position,
        darkMode: anyScript.getAttribute('data-dark-mode') === 'true',
        initiallyOpen: anyScript.getAttribute('data-initially-open') === 'true',
        widgetTitle: anyScript.getAttribute('data-title') || DEFAULT_CONFIG.widgetTitle,
        useSolarSystemTheme: anyScript.getAttribute('data-solar-system-theme') === 'true' || DEFAULT_CONFIG.useSolarSystemTheme,
        debug: debugMode
      };
      
      // Parse theme if provided
      const themeAttr = anyScript.getAttribute('data-theme');
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
      window.SiteHQChat.init(config);
    } else if (debugMode) {
      warn('No script with data-sitehq-chat="auto" found');
    }
  }

  // Run auto-initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    autoInitialize();
  }
  
  // Expose initialization functions globally for manual initialization
  window.SiteHQChatInit = function() {
    if (debugMode) {
      console.log('[SiteHQ Chat] Manual initialization triggered');
    }
    autoInitialize();
  };
  
  // Allow direct initialization with config object
  window.SiteHQChatInitWithConfig = function(config) {
    if (!config) {
      console.error('[SiteHQ Chat] Config object required for SiteHQChatInitWithConfig');
      return;
    }
    
    // Set debug mode if specified in config
    if (config.debug) {
      debugMode = true;
      console.log('[SiteHQ Chat] Initializing with custom config in debug mode');
    }
    
    // Ensure we have the required parameters
    if (!config.apiKey || !config.agentId) {
      console.error('[SiteHQ Chat] API key and Agent ID are required for initialization');
      return;
    }
    
    // Use provided config with defaults for missing properties
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      theme: { ...DEFAULT_CONFIG.theme, ...(config.theme || {}) }
    };
    
    if (debugMode) {
      log('Widget configuration (custom init):', finalConfig);
    }
    
    // Initialize widget with the config
    window.SiteHQChat.init(finalConfig);
  };
})();
/**
 * SiteHQ Standalone Chat Bubble
 * A self-contained widget that can be embedded on any website
 * No React dependencies required
 */

(function() {
  'use strict';

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
      
      .sitehq-terms-dialog {
        position: absolute;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10;
        border-radius: 12px;
      }
      
      .sitehq-terms-content {
        background-color: white;
        padding: 20px;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
      }
      
      .sitehq-dark-mode .sitehq-terms-content {
        background-color: #2d2d2d;
        color: #f5f5f5;
      }
      
      .sitehq-terms-content h3 {
        margin-top: 0;
        color: #5c078c;
      }
      
      .sitehq-dark-mode .sitehq-terms-content h3 {
        color: #bb86fc;
      }
      
      .sitehq-primary-button {
        background-color: #5c078c;
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
      
      .sitehq-active-content {
        flex: 1;
      }
      
      .sitehq-active-title {
        font-weight: 600;
        color: #5c078c;
        margin-bottom: 3px;
        font-size: 14px;
      }
      
      .sitehq-dark-mode .sitehq-active-title {
        color: #bb86fc;
      }
      
      .sitehq-active-status {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .sitehq-listening {
        color: #4CAF50;
      }
      
      .sitehq-dark-mode .sitehq-listening {
        color: #81c784;
      }
      
      .sitehq-speaking {
        color: #2196F3;
      }
      
      .sitehq-dark-mode .sitehq-speaking {
        color: #64b5f6;
      }
      
      .sitehq-thinking {
        color: #FF9800;
      }
      
      .sitehq-dark-mode .sitehq-thinking {
        color: #ffb74d;
      }
      
      .sitehq-mic-wave {
        display: flex;
        align-items: flex-end;
        height: 12px;
        gap: 2px;
      }
      
      .sitehq-mic-bar {
        width: 2px;
        height: 3px;
        background-color: currentColor;
        border-radius: 1px;
        animation: sitehq-mic-wave 1.2s ease-in-out infinite;
      }
      
      @keyframes sitehq-mic-wave {
        0%, 100% {
          height: 3px;
        }
        50% {
          height: 10px;
        }
      }
      
      .sitehq-sound-wave {
        display: flex;
        align-items: center;
        height: 12px;
        gap: 2px;
      }
      
      .sitehq-sound-bar {
        width: 2px;
        height: 8px;
        background-color: currentColor;
        border-radius: 1px;
        animation: sitehq-sound-wave 1s ease-in-out infinite;
      }
      
      @keyframes sitehq-sound-wave {
        0%, 100% {
          height: 4px;
        }
        50% {
          height: 12px;
        }
      }
      
      .sitehq-close-button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: rgba(255, 59, 48, 0.1);
        color: #FF3B30;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .sitehq-dark-mode .sitehq-close-button {
        background-color: rgba(255, 69, 58, 0.2);
        color: #FF453A;
      }
      
      .sitehq-close-button:hover {
        background-color: rgba(255, 59, 48, 0.2);
      }
      
      .sitehq-dark-mode .sitehq-close-button:hover {
        background-color: rgba(255, 69, 58, 0.3);
      }
      
      .sitehq-dark-mode-toggle {
        position: absolute;
        top: 12px;
        left: 12px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: transparent;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #888;
        z-index: 5;
        transition: background-color 0.2s;
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
    chatBubble: 'M21 11.5C21 16.1944 16.9706 20 12 20C10.9 20 9.83943 19.8325 8.85145 19.5247C8.17238 19.3139 7.8323 19.2083 7.68265 19.2292C7.53301 19.25 7.31884 19.3693 6.88694 19.6084L4.8 20.8L4.3636 20.9964C4.01558 21.1495 3.84157 21.2261 3.67736 21.2433C3.38636 21.2725 3.09829 21.1872 2.87926 21.0113C2.79366 20.9488 2.72192 20.8663 2.5764 20.7055C2.19781 20.2685 2.18538 19.6598 2.54001 19.2082L3 18.6462L4.09513 17.2981C4.25177 17.1069 4.33008 17.0113 4.38058 16.9031C4.43108 16.795 4.4473 16.6716 4.47097 16.4224C4.49464 16.1732 4.45304 15.9049 4.37088 15.3755C4.12225 13.7754 4 13 4 11.5C4 6.80558 8.02944 3 13 3C17.9706 3 21 6.80558 21 11.5Z',
    close: 'M18 6L6 18 M6 6L18 18',
    send: 'M22 2L11 13 M22 2L15 22L11 13M22 2L2 9L11 13',
    mic: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8',
    micOff: 'M1 1l22 22 M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6 M19 10v2a7 7 0 0 1-.11 1.23m-2.62 2.62A7.001 7.001 0 0 1 5 12v-2 M12 19v4 M8 23h8',
    wand: 'M15 4V2m0 12v-2m0 12v-2M4 15h2m12 0h2M5.63 5.63l1.42 1.42m9.9 9.9l1.42 1.42M4.93 19.07l1.42-1.42m9.9-9.9l1.42-1.42',
    sun: 'M12 16A4 4 0 0 0 16 12A4 4 0 0 0 12 8A4 4 0 0 0 8 12A4 4 0 0 0 12 16Z M12 2V4 M12 20V22 M4.93 4.93L6.34 6.34 M17.66 17.66L19.07 19.07 M2 12H4 M20 12H22 M6.34 17.66L4.93 19.07 M19.07 4.93L17.66 6.34',
    moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'
  };

  // Create the widget's DOM structure
  function createWidgetDOM(config) {
    const container = document.createElement('div');
    container.className = `sitehq-container ${config.position ? 'sitehq-' + config.position : 'sitehq-bottom-right'} ${config.darkMode ? 'sitehq-dark-mode' : ''}`;
    
    // Create toggle button (chat bubble)
    const toggleButton = document.createElement('button');
    toggleButton.className = 'sitehq-toggle-button';
    toggleButton.setAttribute('aria-label', 'Toggle chat');
    toggleButton.appendChild(createSVG(SVGS.chatBubble));
    
    // Create decorative particles
    const particle1 = document.createElement('div');
    particle1.className = 'sitehq-particle';
    
    const particle2 = document.createElement('div');
    particle2.className = 'sitehq-particle';
    
    toggleButton.appendChild(particle1);
    toggleButton.appendChild(particle2);
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'sitehq-tooltip';
    tooltip.textContent = 'Ask me anything! I\'m here to help.';
    
    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'sitehq-chat-window';
    
    // Create window header
    const header = document.createElement('div');
    header.className = 'sitehq-header';
    
    const headerContent = document.createElement('div');
    headerContent.className = 'sitehq-header-content';
    
    const headerTitle = document.createElement('div');
    headerTitle.className = 'sitehq-header-title';
    headerTitle.textContent = config.widgetTitle;
    
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'sitehq-status';
    statusIndicator.id = 'sitehq-status';
    
    headerContent.appendChild(headerTitle);
    headerContent.appendChild(statusIndicator);
    
    const headerActions = document.createElement('div');
    headerActions.className = 'sitehq-header-actions';
    
    const darkModeToggle = document.createElement('button');
    darkModeToggle.className = 'sitehq-icon-button';
    darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
    darkModeToggle.appendChild(createSVG(SVGS.sun));
    
    const closeButton = document.createElement('button');
    closeButton.className = 'sitehq-icon-button';
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.appendChild(createSVG(SVGS.close));
    
    headerActions.appendChild(darkModeToggle);
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
    messageInput.setAttribute('placeholder', 'Type your message...');
    messageInput.setAttribute('rows', '1');
    
    const sendButton = document.createElement('button');
    sendButton.className = 'sitehq-send-button';
    sendButton.setAttribute('aria-label', 'Send message');
    sendButton.appendChild(createSVG(SVGS.send));
    
    inputArea.appendChild(messageInput);
    inputArea.appendChild(sendButton);
    
    // Create terms dialog
    const termsDialog = document.createElement('div');
    termsDialog.className = 'sitehq-terms-dialog';
    
    const termsContent = document.createElement('div');
    termsContent.className = 'sitehq-terms-content';
    
    const termsTitle = document.createElement('h3');
    termsTitle.textContent = 'Terms and conditions';
    
    const termsText = document.createElement('p');
    termsText.textContent = 'By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as described in the Privacy Policy. If you do not wish to have your conversations recorded, please refrain from using this service.';
    
    const acceptButton = document.createElement('button');
    acceptButton.className = 'sitehq-primary-button';
    acceptButton.textContent = 'Agree';
    
    termsContent.appendChild(termsTitle);
    termsContent.appendChild(termsText);
    termsContent.appendChild(acceptButton);
    
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
    }
    
    // Update state
    state.isDarkMode = config.darkMode;
    
    return config;
  }

  // Initialize the widget
  function initializeWidget(config) {
    // 1. Inject styles
    injectStyles();
    
    // 2. Create widget DOM
    const widgetElement = createWidgetDOM(config);
    
    // 3. Append to document
    document.body.appendChild(widgetElement);
    
    // 4. Setup event listeners
    setupEventListeners();
    
    // 5. Open chat if initiallyOpen is true
    if (config.initiallyOpen) {
      toggleChatWindow(true);
    }
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
    const script = document.querySelector('script[data-sitehq-chat="auto"]');
    if (script) {
      const config = {
        apiKey: script.getAttribute('data-api-key') || DEFAULT_CONFIG.apiKey,
        agentId: script.getAttribute('data-agent-id') || DEFAULT_CONFIG.agentId,
        position: script.getAttribute('data-position') || DEFAULT_CONFIG.position,
        darkMode: script.getAttribute('data-dark-mode') === 'true',
        initiallyOpen: script.getAttribute('data-initially-open') === 'true',
        widgetTitle: script.getAttribute('data-title') || DEFAULT_CONFIG.widgetTitle
      };
      
      // Parse theme if provided
      const themeAttr = script.getAttribute('data-theme');
      if (themeAttr) {
        try {
          const themeData = JSON.parse(themeAttr);
          config.theme = { ...DEFAULT_CONFIG.theme, ...themeData };
        } catch (e) {
          console.warn('SiteHQ Chat: Invalid theme JSON in data attribute');
        }
      }
      
      // Initialize widget
      window.SiteHQChat.init(config);
    }
  }

  // Run auto-initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    autoInitialize();
  }
})();
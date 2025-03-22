Below is a detailed Markdown (`.md`) document that serves as a step-by-step guide for deploying a chat UI for ElevenLabs Conversational AI. This blueprint is designed to be reusable, starting with the embed code provided by ElevenLabs after creating an agent. It includes instructions for setting up the project, integrating the ElevenLabs React SDK, creating a custom chat UI, and deploying the widget to a website. You can use this as a reference for future projects.

---

# ElevenLabs Conversational AI Chat UI Deployment Guide

This guide provides a step-by-step blueprint for deploying a custom chat UI for an ElevenLabs Conversational AI agent. It starts with the embed code provided by ElevenLabs after creating an agent, then walks through setting up a custom React-based chat widget, integrating the ElevenLabs React SDK, and deploying the widget to a website. This guide assumes basic familiarity with JavaScript, React, and web development tools like Node.js and Webpack.

---

## Prerequisites

Before starting, ensure you have the following:

- **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io) and create a Conversational AI agent.
- **Agent ID**: After creating your agent, ElevenLabs will provide an embed code with an `agent-id`. For example:
  ```html
  <elevenlabs-convai agent-id="KRGVz0f5HAU0E7u6BbA5"></elevenlabs-convai>
  <script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
  ```
- **API Key**: Obtain your ElevenLabs API key from the ElevenLabs dashboard (under your account settings).
- **Node.js and npm**: Install Node.js (v16 or later) and npm to manage dependencies. Download from [nodejs.org](https://nodejs.org).
- **Code Editor**: Use a code editor like Visual Studio Code.
- **Basic Web Development Knowledge**: Familiarity with HTML, CSS, JavaScript, React, and Webpack.

---

## Step 1: Set Up the Project

1. **Create a New Project Directory**:
   ```bash
   mkdir elevenlabs-chat-widget
   cd elevenlabs-chat-widget
   ```

2. **Initialize a Node.js Project**:
   ```bash
   npm init -y
   ```
   This creates a `package.json` file.

3. **Install Dependencies**:
   Install the necessary dependencies for React, Webpack, and the ElevenLabs React SDK.
   ```bash
   npm install react react-dom @11labs/react
   npm install --save-dev webpack webpack-cli babel-loader @babel/core @babel/preset-env @babel/preset-react
   ```

4. **Set Up Project Structure**:
   Create the following directory structure:
   ```
   elevenlabs-chat-widget/
   ├── client/
   │   ├── public/
   │   │   ├── index.html
   │   │   └── elevenlabs-widget.js
   │   └── src/
   │       └── components/
   │           └── ElevenLabsChatController.jsx
   ├── webpack.config.js
   └── package.json
   ```

---

## Step 2: Create the Web Component for the Chat UI

1. **Create the Web Component (`elevenlabs-widget.js`)**:
   This file defines a custom HTML element (`<elevenlabs-chat>`) that renders the chat UI and dispatches events to the React controller.

   Create `client/public/elevenlabs-widget.js` with the following content:

   ```javascript
   // client/public/elevenlabs-widget.js
   import '../src/components/ElevenLabsChatController.jsx';

   class ElevenLabsChat extends HTMLElement {
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
         messages: [],
       };
       this.refs = {};
       console.log('ElevenLabsChat: Constructor called');
     }

     connectedCallback() {
       console.log('ElevenLabsChat: connectedCallback called');
       this.loadConfig();
       this.render();
       this.setupEventListeners();
       this.setupReactContainer();
       if (this.config.initiallyOpen) {
         this.toggleChatWindow(true);
       }

       document.addEventListener('elevenlabs-status-update', (event) => {
         console.log('ElevenLabsChat: Received elevenlabs-status-update event:', event.detail);
         this.setStatus(event.detail.status);
       });

       document.addEventListener('elevenlabs-message-received', (event) => {
         console.log('ElevenLabsChat: Received elevenlabs-message-received event:', event.detail);
         const { message } = event.detail;
         this.state.messages.push({ text: message.text, sender: message.sender || 'agent' });
         this.renderMessages();
       });
     }

     disconnectedCallback() {
       console.log('ElevenLabsChat: disconnectedCallback called');
       this.cleanup();
     }

     loadConfig() {
       console.log('ElevenLabsChat: loadConfig called');
       const defaultConfig = {
         apiKey: 'your-api-key',
         agentId: 'your-agent-id',
         theme: {
           primary: '#5c078c',
           background: '#ffffff',
           text: '#333333',
         },
         darkMode: false,
         position: 'bottom-right',
         initiallyOpen: false,
         widgetTitle: 'ElevenLabs Assistant',
       };

       this.config = {
         apiKey: this.getAttribute('api-key') || defaultConfig.apiKey,
         agentId: this.getAttribute('agent-id') || defaultConfig.agentId,
         position: this.getAttribute('position') || defaultConfig.position,
         initiallyOpen: this.getAttribute('initially-open') === 'true',
         widgetTitle: this.getAttribute('title') || defaultConfig.widgetTitle,
         darkMode: this.getAttribute('dark-mode') === 'true',
         theme: defaultConfig.theme,
       };

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
       hangup: 'M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M6 18H18C20.2091 18 22 16.2091 22 14V10C22 7.79086 20.2091 6 18 6H6C3.79086 6 2 7.79086 2 10V14C2 16.2091 3.79086 18 6 18Z',
     };

     render() {
       console.log('ElevenLabsChat: render called');
       this.shadowRoot.innerHTML = `
         <style>
           .elevenlabs-container {
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

           .elevenlabs-container.elevenlabs-dark-mode {
             color: #f5f5f5;
           }

           .elevenlabs-container.elevenlabs-top-right {
             top: 20px;
             right: 20px;
             bottom: auto;
             left: auto;
           }

           .elevenlabs-container.elevenlabs-top-left {
             top: 20px;
             left: 20px;
             bottom: auto;
             right: auto;
           }

           .elevenlabs-container.elevenlabs-bottom-left {
             bottom: 20px;
             left: 20px;
             top: auto;
             right: auto;
           }

           .elevenlabs-toggle-button {
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
             animation: elevenlabs-float 3s ease-in-out infinite;
           }

           @keyframes elevenlabs-float {
             0%, 100% { transform: translateY(0); }
             50% { transform: translateY(-10px); }
           }

           .elevenlabs-toggle-button:hover {
             transform: scale(1.05);
             box-shadow: 0 0 0 8px rgba(255, 165, 0, 0.4), 0 6px 25px rgba(0, 0, 0, 0.3);
           }

           .elevenlabs-toggle-button:focus {
             outline: none;
           }

           .elevenlabs-tooltip {
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

           .elevenlabs-dark-mode .elevenlabs-tooltip {
             background-color: #2d2d2d;
             color: #f5f5f5;
           }

           .elevenlabs-toggle-button:hover + .elevenlabs-tooltip {
             opacity: 1;
             transform: translateY(0);
           }

           .elevenlabs-chat-window {
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
             animation: elevenlabs-popup 0.3s ease-out;
             display: none;
           }

           .elevenlabs-dark-mode .elevenlabs-chat-window {
             background-color: #222;
             box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
           }

           @keyframes elevenlabs-popup {
             0% { transform: scale(0.8); opacity: 0; }
             100% { transform: scale(1); opacity: 1; }
           }

           .elevenlabs-header {
             padding: 15px;
             display: flex;
             justify-content: space-between;
             align-items: center;
             border-bottom: 1px solid #eee;
             background-color: #f9f9f9;
             position: relative;
           }

           .elevenlabs-dark-mode .elevenlabs-header {
             border-bottom: 1px solid #333;
             background-color: #2d2d2d;
           }

           .elevenlabs-header-content {
             display: flex;
             flex-direction: column;
             align-items: center;
             width: 100%;
           }

           .elevenlabs-header-title {
             font-weight: 600;
             font-size: 16px;
             color: var(--primary-color, #5c078c);
           }

           .elevenlabs-dark-mode .elevenlabs-header-title {
             color: #bb86fc;
           }

           .elevenlabs-status {
             font-size: 12px;
             color: #888;
             margin-top: 5px;
           }

           .elevenlabs-dark-mode .elevenlabs-status {
             color: #aaa;
           }

           .elevenlabs-status-connected, .elevenlabs-status-listening {
             color: #4CAF50;
           }

           .elevenlabs-dark-mode .elevenlabs-status-connected,
           .elevenlabs-dark-mode .elevenlabs-status-listening {
             color: #81c784;
           }

           .elevenlabs-status-disconnected, .elevenlabs-status-error {
             color: #F44336;
           }

           .elevenlabs-dark-mode .elevenlabs-status-disconnected,
           .elevenlabs-dark-mode .elevenlabs-status-error {
             color: #e57373;
           }

           .elevenlabs-status-speaking {
             color: #FF9800;
           }

           .elevenlabs-equalizer {
             display: none;
             flex-direction: row;
             gap: 3px;
             margin-top: 5px;
           }

           .elevenlabs-equalizer-bar {
             width: 4px;
             height: 10px;
             background-color: #4CAF50;
             border-radius: 2px;
             animation: elevenlabs-wave 1s infinite ease-in-out;
           }

           .elevenlabs-equalizer-bar:nth-child(2) {
             animation-delay: 0.2s;
           }

           .elevenlabs-equalizer-bar:nth-child(3) {
             animation-delay: 0.4s;
           }

           .elevenlabs-sound-wave {
             display: none;
             flex-direction: row;
             gap: 3px;
             margin-top: 5px;
           }

           .elevenlabs-sound-wave-bar {
             width: 4px;
             height: 10px;
             background-color: #FF9800;
             border-radius: 2px;
             animation: elevenlabs-wave 1s infinite ease-in-out;
           }

           .elevenlabs-sound-wave-bar:nth-child(2) {
             animation-delay: 0.2s;
           }

           .elevenlabs-sound-wave-bar:nth-child(3) {
             animation-delay: 0.4s;
           }

           @keyframes elevenlabs-wave {
             0%, 100% { transform: scaleY(1); }
             50% { transform: scaleY(2); }
           }

           .elevenlabs-status-listening ~ .elevenlabs-equalizer {
             display: flex;
           }

           .elevenlabs-status-speaking ~ .elevenlabs-sound-wave {
             display: flex;
           }

           .elevenlabs-header-actions {
             position: absolute;
             right: 15px;
             display: flex;
             gap: 8px;
           }

           .elevenlabs-icon-button {
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

           .elevenlabs-dark-mode .elevenlabs-icon-button {
             color: #ddd;
           }

           .elevenlabs-icon-button:hover {
             background-color: rgba(0, 0, 0, 0.05);
           }

           .elevenlabs-dark-mode .elevenlabs-icon-button:hover {
             background-color: rgba(255, 255, 255, 0.1);
           }

           .elevenlabs-messages {
             flex: 1;
             padding: 15px;
             overflow-y: auto;
             display: block;
           }

           .elevenlabs-message {
             margin-bottom: 10px;
             padding: 10px;
             border-radius: 8px;
             max-width: 80%;
           }

           .elevenlabs-message.agent {
             background-color: #f0f0f0;
             margin-left: auto;
           }

           .elevenlabs-dark-mode .elevenlabs-message.agent {
             background-color: #333;
           }

           .elevenlabs-message.user {
             background-color: #5c078c;
             color: white;
             margin-right: auto;
           }

           .elevenlabs-dark-mode .elevenlabs-message.user {
             background-color: #bb86fc;
             color: #000;
           }

           .elevenlabs-typing-indicator {
             display: none;
             padding: 10px 15px;
             align-items: center;
             gap: 5px;
           }

           .elevenlabs-typing-dot {
             width: 8px;
             height: 8px;
             background-color: #888;
             border-radius: 50%;
             animation: elevenlabs-typing-dot 1.4s infinite ease-in-out;
           }

           .elevenlabs-dark-mode .elevenlabs-typing-dot {
             background-color: #aaa;
           }

           .elevenlabs-typing-dot:nth-child(1) {
             animation-delay: 0s;
           }

           .elevenlabs-typing-dot:nth-child(2) {
             animation-delay: 0.2s;
           }

           .elevenlabs-typing-dot:nth-child(3) {
             animation-delay: 0.4s;
           }

           @keyframes elevenlabs-typing-dot {
             0%, 60%, 100% { transform: translateY(0); }
             30% { transform: translateY(-5px); }
           }

           .elevenlabs-input-area {
             padding: 10px 15px;
             display: flex;
             gap: 10px;
             border-top: 1px solid #eee;
             background-color: #f9f9f9;
             justify-content: center;
           }

           .elevenlabs-dark-mode .elevenlabs-input-area {
             border-top: 1px solid #333;
             background-color: #2d2d2d;
           }

           .elevenlabs-message-input {
             display: none;
           }

           .elevenlabs-send-button {
             display: none;
           }

           .elevenlabs-disconnect-button {
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

           .elevenlabs-disconnect-button:hover {
             background-color: #d32f2f;
           }

           .elevenlabs-terms-dialog {
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

           .elevenlabs-terms-content {
             background-color: white;
             padding: 20px;
             border-radius: 12px;
             width: 90%;
             max-width: 400px;
             max-height: 80vh;
             overflow-y: auto;
             box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
           }

           .elevenlabs-dark-mode .elevenlabs-terms-content {
             background-color: #2d2d2d;
             color: #f5f5f5;
           }

           .elevenlabs-terms-content h3 {
             margin-top: 0;
             color: var(--primary-color, #5c078c);
           }

           .elevenlabs-dark-mode .elevenlabs-terms-content h3 {
             color: #bb86fc;
           }

           .elevenlabs-primary-button {
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

           .elevenlabs-dark-mode .elevenlabs-primary-button {
             background-color: #bb86fc;
             color: #000;
           }

           .elevenlabs-primary-button:hover {
             background-color: #4a0670;
           }

           .elevenlabs-dark-mode .elevenlabs-primary-button:hover {
             background-color: #a370db;
           }

           .elevenlabs-cancel-button {
             background-color: #f5f5f5;
             color: #333;
             border: 1px solid #ddd;
             padding: 8px 16px;
             border-radius: 6px;
             cursor: pointer;
             margin-top: 10px;
             width: 100%;
           }

           .elevenlabs-dark-mode .elevenlabs-cancel-button {
             background-color: #333;
             color: #f5f5f5;
             border: 1px solid #444;
           }

           .elevenlabs-branding {
             font-size: 11px;
             color: #888;
             text-align: center;
             margin-top: 5px;
           }

           .elevenlabs-dark-mode .elevenlabs-branding {
             color: #aaa;
           }

           .elevenlabs-branding a {
             color: var(--primary-color, #5c078c);
             text-decoration: none;
           }

           .elevenlabs-dark-mode .elevenlabs-branding a {
             color: #bb86fc;
           }

           .elevenlabs-branding a:hover {
             text-decoration: underline;
           }

           .elevenlabs-react-container {
             display: none;
           }
         </style>
         <div class="elevenlabs-container ${this.config.position ? 'elevenlabs-' + this.config.position : 'elevenlabs-bottom-right'} ${this.state.isDarkMode ? 'elevenlabs-dark-mode' : ''}">
           <div class="elevenlabs-chat-window" style="display: none;">
             <div class="elevenlabs-header">
               <div class="elevenlabs-header-content">
                 <div class="elevenlabs-header-title">${this.config.widgetTitle || 'Chat with AI'}</div>
                 <div class="elevenlabs-status" id="elevenlabs-status">Initializing...</div>
                 <div class="elevenlabs-equalizer">
                   <div class="elevenlabs-equalizer-bar"></div>
                   <div class="elevenlabs-equalizer-bar"></div>
                   <div class="elevenlabs-equalizer-bar"></div>
                   <div class="elevenlabs-equalizer-bar"></div>
                 </div>
                 <div class="elevenlabs-sound-wave">
                   <div class="elevenlabs-sound-wave-bar"></div>
                   <div class="elevenlabs-sound-wave-bar"></div>
                   <div class="elevenlabs-sound-wave-bar"></div>
                 </div>
               </div>
               <div class="elevenlabs-header-actions">
                 <button class="elevenlabs-icon-button" aria-label="Toggle dark mode"></button>
               </div>
             </div>
             <div class="elevenlabs-messages"></div>
             <div class="elevenlabs-typing-indicator" style="display: none;">
               <div class="elevenlabs-typing-dot"></div>
               <div class="elevenlabs-typing-dot"></div>
               <div class="elevenlabs-typing-dot"></div>
             </div>
             <div class="elevenlabs-input-area">
               <button class="elevenlabs-disconnect-button" aria-label="Disconnect call"></button>
             </div>
           </div>
           <button class="elevenlabs-toggle-button" aria-label="Toggle chat"></button>
           <div class="elevenlabs-tooltip">Ask me anything! I'm here to help.</div>
           <div class="elevenlabs-terms-dialog" style="display: none;">
             <div class="elevenlabs-terms-content">
               <h3>Terms and Conditions</h3>
               <p>By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as described in the Privacy Policy. If you do not wish to have your conversations recorded, please refrain from using this service.</p>
               <button class="elevenlabs-primary-button">Agree</button>
               <button class="elevenlabs-cancel-button">Cancel</button>
             </div>
           </div>
           <div class="elevenlabs-branding">Powered by <a href="https://elevenlabs.io" target="_blank">ElevenLabs</a></div>
           <div class="elevenlabs-react-container"></div>
         </div>
       `;

       this.refs.container = this.shadowRoot.querySelector('.elevenlabs-container');
       this.refs.chatWindow = this.shadowRoot.querySelector('.elevenlabs-chat-window');
       this.refs.chatButton = this.shadowRoot.querySelector('.elevenlabs-toggle-button');
       this.refs.messagesContainer = this.shadowRoot.querySelector('.elevenlabs-messages');
       this.refs.typingIndicator = this.shadowRoot.querySelector('.elevenlabs-typing-indicator');
       this.refs.messageInput = this.shadowRoot.querySelector('.elevenlabs-message-input');
       this.refs.termsDialog = this.shadowRoot.querySelector('.elevenlabs-terms-dialog');
       this.refs.disconnectButton = this.shadowRoot.querySelector('.elevenlabs-disconnect-button');
       this.refs.reactContainer = this.shadowRoot.querySelector('.elevenlabs-react-container');

       this.refs.chatButton.appendChild(this.createSVG(this.SVGS.chatBubble));
       this.refs.disconnectButton.appendChild(this.createSVG(this.SVGS.hangup));
       this.updateDarkModeIcon();
       this.renderMessages();
     }

     renderMessages() {
       console.log('ElevenLabsChat: renderMessages called');
       this.refs.messagesContainer.innerHTML = this.state.messages
         .map((message) => `
           <div class="elevenlabs-message ${message.sender}">
             ${message.text}
           </div>
         `)
         .join('');
       this.refs.messagesContainer.scrollTop = this.refs.messagesContainer.scrollHeight;
     }

     updateDarkModeIcon() {
       console.log('ElevenLabsChat: updateDarkModeIcon called');
       const darkModeButton = this.refs.chatWindow.querySelector('[aria-label="Toggle dark mode"]');
       darkModeButton.innerHTML = '';
       darkModeButton.appendChild(this.createSVG(this.state.isDarkMode ? this.SVGS.sun : this.SVGS.moon));
     }

     setupEventListeners() {
       console.log('ElevenLabsChat: setupEventListeners called');
       this.refs.chatButton.addEventListener('click', () => this.toggleChatWindow(!this.state.isOpen));
       this.refs.chatWindow.querySelector('[aria-label="Toggle dark mode"]').addEventListener('click', () => this.toggleDarkMode());
       this.refs.disconnectButton.addEventListener('click', () => this.disconnectCall());
       this.refs.termsDialog.querySelector('.elevenlabs-cancel-button').addEventListener('click', () => {
         this.refs.termsDialog.style.display = 'none';
         this.toggleChatWindow(false);
       });
       this.refs.termsDialog.querySelector('.elevenlabs-primary-button').addEventListener('click', () => {
         this.state.acceptedTerms = true;
         this.refs.termsDialog.style.display = 'none';
         this.initializeChat();
       });
     }

     setupReactContainer() {
       console.log('ElevenLabsChat: setupReactContainer called');
       const event = new CustomEvent('elevenlabs-init', {
         detail: {
           apiKey: this.config.apiKey,
           agentId: this.config.agentId,
           container: this.refs.reactContainer,
         },
       });
       setTimeout(() => {
         console.log('ElevenLabsChat: Dispatching elevenlabs-init event');
         document.dispatchEvent(event);
       }, 500);
     }

     toggleChatWindow(open) {
       console.log('ElevenLabsChat: toggleChatWindow called with open:', open);
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
       console.log('ElevenLabsChat: toggleDarkMode called');
       this.state.isDarkMode = !this.state.isDarkMode;
       if (this.state.isDarkMode) {
         this.refs.container.classList.add('elevenlabs-dark-mode');
       } else {
         this.refs.container.classList.remove('elevenlabs-dark-mode');
       }
       this.updateDarkModeIcon();
     }

     initializeChat() {
       console.log('ElevenLabsChat: initializeChat called');
       setTimeout(() => {
         console.log('ElevenLabsChat: Dispatching elevenlabs-accept-terms event');
         document.dispatchEvent(new CustomEvent('elevenlabs-accept-terms'));
       }, 100);
     }

     setStatus(status) {
       console.log('ElevenLabsChat: setStatus called with status:', status);
       this.state.status = status;
       const statusEl = this.shadowRoot.querySelector('#elevenlabs-status');
       statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
       statusEl.className = `elevenlabs-status elevenlabs-status-${status}`;
       this.refs.typingIndicator.style.display = (status === 'thinking' || this.state.isTyping) ? 'flex' : 'none';
     }

     disconnectCall() {
       console.log('ElevenLabsChat: disconnectCall called');
       document.dispatchEvent(new CustomEvent('elevenlabs-disconnect'));
       this.setStatus('disconnected');
       this.state.acceptedTerms = false;
       this.state.isOpen = false;
       this.refs.chatWindow.style.display = 'none';
       this.state.messages = [];
       this.renderMessages();
     }

     cleanup() {
       console.log('ElevenLabsChat: cleanup called');
     }
   }

   console.log('ElevenLabsChat: Defining custom element elevenlabs-chat');
   customElements.define('elevenlabs-chat', ElevenLabsChat);
   ```

---

## Step 3: Create the React Controller (`ElevenLabsChatController.jsx`)

This file uses the ElevenLabs React SDK (`@11labs/react`) to manage the WebSocket connection and handle conversation logic.

Create `client/src/components/ElevenLabsChatController.jsx` with the following content:

```javascript
// client/src/components/ElevenLabsChatController.jsx
import React, { useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useConversation } from '@11labs/react';

let root = null;

const ElevenLabsChatController = ({ apiKey, agentId, container }) => {
  console.log('ElevenLabsChatController: Component mounted with apiKey:', apiKey, 'agentId:', agentId);

  const conversation = useConversation({
    onConnect: () => console.log('ElevenLabsChatController: Connected to ElevenLabs'),
    onDisconnect: () => console.log('ElevenLabsChatController: Disconnected from ElevenLabs'),
    onError: (error) => console.error('ElevenLabsChatController: Conversation error:', error),
    onMessage: (message) => {
      console.log('ElevenLabsChatController: Message received:', message);
      document.dispatchEvent(new CustomEvent('elevenlabs-message-received', { detail: { message } }));
    },
  });

  console.log('ElevenLabsChatController: useConversation status:', conversation.status);

  const handleAcceptTerms = useCallback(async () => {
    console.log('ElevenLabsChatController: handleAcceptTerms called');
    try {
      console.log('ElevenLabsChatController: Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('ElevenLabsChatController: Microphone access granted');
      console.log('ElevenLabsChatController: Fetching signed URL...');
      const response = await fetch(`https://your-backend-url/api/get-signed-url?agentId=${agentId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!response.ok) throw new Error('Failed to fetch signed URL');
      const { signedUrl } = await response.json();
      console.log('ElevenLabsChatController: Signed URL fetched:', signedUrl);
      console.log('ElevenLabsChatController: Starting session...');
      await conversation.startSession({ signedUrl });
      console.log('ElevenLabsChatController: Session started');
    } catch (error) {
      console.error('ElevenLabsChatController: Failed to start conversation:', error);
      document.dispatchEvent(new CustomEvent('elevenlabs-status-update', { detail: { status: 'error' } }));
    }
  }, [apiKey, agentId, conversation]);

  const handleDisconnect = useCallback(() => {
    console.log('ElevenLabsChatController: handleDisconnect called');
    conversation.endSession();
  }, [conversation]);

  useEffect(() => {
    console.log('ElevenLabsChatController: Conversation status changed:', conversation.status, 'isSpeaking:', conversation.isSpeaking);
    let status = 'disconnected';
    if (conversation.status === 'connected') {
      status = conversation.isSpeaking ? 'speaking' : 'listening';
    } else if (conversation.status === 'connecting') {
      status = 'thinking';
    }
    document.dispatchEvent(new CustomEvent('elevenlabs-status-update', { detail: { status } }));
  }, [conversation.status, conversation.isSpeaking]);

  useEffect(() => {
    const onAcceptTerms = () => handleAcceptTerms();
    const onDisconnect = () => handleDisconnect();

    console.log('ElevenLabsChatController: Adding event listeners for elevenlabs-accept-terms and elevenlabs-disconnect');
    document.addEventListener('elevenlabs-accept-terms', onAcceptTerms);
    document.addEventListener('elevenlabs-disconnect', onDisconnect);

    return () => {
      console.log('ElevenLabsChatController: Removing event listeners');
      document.removeEventListener('elevenlabs-accept-terms', onAcceptTerms);
      document.removeEventListener('elevenlabs-disconnect', onDisconnect);
    };
  }, [handleAcceptTerms, handleDisconnect]);

  return null;
};

const initializeReactComponent = (event) => {
  console.log('ElevenLabsChatController: elevenlabs-init event received:', event.detail);
  const { apiKey, agentId, container } = event.detail;

  if (!root) {
    root = createRoot(container);
    root.render(<ElevenLabsChatController apiKey={apiKey} agentId={agentId} container={container} />);
  }
};

if (!window.elevenLabsChatControllerInitialized) {
  document.addEventListener('elevenlabs-init', initializeReactComponent);
  window.elevenLabsChatControllerInitialized = true;
}
```

---

## Step 4: Configure Webpack

Create `webpack.config.js` in the project root to bundle the JavaScript files:

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  entry: './client/public/elevenlabs-widget.js',
  output: {
    path: path.resolve(__dirname, 'client/public'),
    filename: 'elevenlabs-widget.bundle.js',
    library: 'ElevenLabsChat',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  stats: 'verbose',
};
```

---

## Step 5: Set Up a Backend for Signed URLs

The ElevenLabs React SDK requires a signed URL to connect to a non-public agent. You’ll need a simple backend to generate this URL.

1. **Set Up a Backend**:
   Create a backend using Node.js and Express. For example, create a `server` directory:

   ```
   elevenlabs-chat-widget/
   ├── server/
   │   ├── index.js
   │   └── package.json
   ```

2. **Initialize the Backend**:
   In the `server` directory, initialize a new Node.js project:
   ```bash
   cd server
   npm init -y
   npm install express
   ```

3. **Create the Backend (`server/index.js`)**:
   ```javascript
   // server/index.js
   const express = require('express');
   const app = express();
   const port = process.env.PORT || 3000;

   app.use(express.json());

   app.get('/api/get-signed-url', async (req, res) => {
     const { agentId } = req.query;
     const apiKey = process.env.ELEVENLABS_API_KEY; // Set your ElevenLabs API key in environment variables

     if (!agentId) {
       return res.status(400).json({ error: 'agentId is required' });
     }

     try {
       const response = await fetch(
         `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
         {
           method: 'GET',
           headers: { 'xi-api-key': apiKey },
         }
       );

       if (!response.ok) {
         throw new Error('Failed to fetch signed URL from ElevenLabs');
       }

       const body = await response.json();
       res.json({ signedUrl: body.signed_url });
     } catch (error) {
       console.error('Error fetching signed URL:', error);
       res.status(500).json({ error: 'Failed to fetch signed URL' });
     }
   });

   app.listen(port, () => {
     console.log(`Server running on port ${port}`);
   });
   ```

4. **Set Environment Variables**:
   Create a `.env` file in the `server` directory:
   ```
   ELEVENLABS_API_KEY=your-elevenlabs-api-key
   ```

5. **Run the Backend**:
   ```bash
   node server/index.js
   ```
   The backend will be running on `http://localhost:3000`. Update the `fetch` URL in `ElevenLabsChatController.jsx` to point to your backend (e.g., `http://localhost:3000/api/get-signed-url`).

---

## Step 6: Create a Test Page

Create `client/public/index.html` to test the chat widget:

```html
<!-- client/public/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ElevenLabs Chatbot Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #5c078c; }
    </style>
</head>
<body>
    <div class="container">
        <h1>ElevenLabs Chatbot Test Page</h1>
        <p>This is a simple test page to demonstrate the ElevenLabs chatbot widget integration.</p>
        <p>The chat widget should appear in the bottom right corner of this page.</p>
    </div>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <elevenlabs-chat
      api-key="your-elevenlabs-api-key"
      agent-id="KRGVz0f5HAU0E7u6BbA5"
    ></elevenlabs-chat>
    <script src="elevenlabs-widget.bundle.js" type="text/javascript"></script>
</body>
</html>
```

Replace `your-elevenlabs-api-key` with your actual API key and `KRGVz0f5HAU0E7u6BbA5` with your agent ID.

---

## Step 7: Build and Test Locally

1. **Build the Widget**:
   ```bash
   npx webpack --mode production
   ```
   This generates `client/public/elevenlabs-widget.bundle.js`.

2. **Run a Local Server**:
   ```bash
   npx serve client/public
   ```
   Open `http://localhost:3000` in your browser.

3. **Test the Widget**:
   - The chat widget should appear in the bottom right corner.
   - Click the chat button, agree to the terms, and speak to the agent (e.g., "Hello, how can you help me?").
   - Verify that the agent responds, messages appear in the chat window, and logs appear in the ElevenLabs dashboard.

---

## Step 8: Deploy the Widget

1. **Host the Backend**:
   Deploy the backend to a hosting service like Render, Heroku, or Vercel. Update the `fetch` URL in `ElevenLabsChatController.jsx` to point to your deployed backend.

2. **Host the Frontend**:
   Upload the `client/public` directory to a static hosting service like Netlify or Vercel. Ensure `elevenlabs-widget.bundle.js` is accessible.

3. **Embed in a Website**:
   Add the following code to your website’s HTML, replacing the `src` URL with the URL of your hosted `elevenlabs-widget.bundle.js`:
   ```html
   <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
   <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
   <elevenlabs-chat
     api-key="your-elevenlabs-api-key"
     agent-id="KRGVz0f5HAU0E7u6BbA5"
   ></elevenlabs-chat>
   <script src="https://your-hosting-url/elevenlabs-widget.bundle.js" type="text/javascript"></script>
   ```

---

## Step 9: Troubleshooting

- **No Connection to ElevenLabs**:
  - Verify your `agentId` and `apiKey` are correct.
  - Ensure your backend is running and the `/api/get-signed-url` endpoint returns a valid signed URL.
  - Check the browser console for errors.

- **Microphone Issues**:
  - Ensure you’re testing on HTTPS (required for microphone access).
  - Check browser permissions for microphone access.

- **No Messages in UI**:
  - Verify the `onMessage` callback in `ElevenLabsChatController.jsx` is dispatching the `elevenlabs-message-received` event.
  - Ensure `elevenlabs-widget.js` is listening for this event and updating the UI.

- **Deployment Issues**:
  - Use a hosting service that supports WebSocket connections (e.g., Vercel, Netlify).
  - Check network logs for CORS or WebSocket errors.

---

## Additional Enhancements

- **Custom Styling**: Modify the CSS in `elevenlabs-widget.js` to match your website’s design.
- **Text Input**: Add a text input field to allow users to type messages instead of using voice.
- **Error Handling**: Enhance error handling for network issues, microphone access denial, etc.
- **Analytics**: Add analytics to track user interactions with the chat widget.

---

## Conclusion

This blueprint provides a reusable guide for deploying a custom chat UI for ElevenLabs Conversational AI. By following these steps, you can create a fully functional chat widget, integrate it with ElevenLabs, and deploy it to any website. Save this document for future reference and adapt it as needed for different projects.

--- 

You can save this as `elevenlabs-chat-ui-deployment-guide.md` and refer to it whenever you need to deploy a new ElevenLabs chat widget. Let me know if you’d like to add more details or make adjustments!
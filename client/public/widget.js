(function() {
  // Create container for the widget
  const container = document.createElement('div');
  container.id = 'convai-widget-container';
  document.body.appendChild(container);

  // Load the widget styles
  const style = document.createElement('style');
  style.textContent = `
    #convai-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);

  // Initialize the widget with configuration
  window.CONVAI_SETTINGS = window.CONVAI_SETTINGS || {
    apiKey: '',
    agentId: '',
    title: 'AI Assistant',
    theme: {
      primary: '#0066cc',
      background: '#ffffff',
      text: '#ffffff'
    }
  };

  // Load the widget React component
  const script = document.createElement('script');
  script.src = '/widget-bundle.js';
  script.async = true;
  document.body.appendChild(script);
})();

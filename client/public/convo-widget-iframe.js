/**
 * Convo Chat Widget Loader
 * Embeds the Conversational AI chat widget on any website via iframe.
 *
 * Usage (Script Tag - auto-init):
 *   <script
 *     src="https://convo-ai.futurnod.com/convo-widget.js"
 *     data-auto-init="true"
 *     data-agent-id="YOUR_AGENT_ID"
 *     data-api-key="YOUR_API_KEY"
 *     data-theme='{"primary":"#F95638","background":"#ffffff","text":"#333333"}'
 *     data-title="AI Assistant">
 *   </script>
 *
 * Usage (Custom Element):
 *   <script src="https://convo-ai.futurnod.com/convo-widget.js"></script>
 *   <convo-chat-widget
 *     agent-id="YOUR_AGENT_ID"
 *     api-key="YOUR_API_KEY"
 *     theme='{"primary":"#F95638","background":"#ffffff","text":"#333333"}'
 *     title="AI Assistant">
 *   </convo-chat-widget>
 */

(function() {
  'use strict';

  // Prevent double initialization
  if (window.__convoWidgetLoaded) return;
  window.__convoWidgetLoaded = true;

  // Detect the base URL from the script src
  var WIDGET_BASE_URL = (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('convo-widget.js') !== -1) {
        return src.replace(/\/convo-widget\.js.*$/, '');
      }
    }
    // Fallback to current origin if script detection fails
    return window.location.origin;
  })();

  var DEFAULTS = {
    apiKey: '',
    agentId: '',
    theme: { primary: '#F95638', background: '#ffffff', text: '#333333' },
    title: 'AI Assistant',
    darkMode: false
  };

  // Collapsed state: room for bubble (56px) + tooltip above + footer below + padding
  var COLLAPSED_WIDTH = 260;
  var COLLAPSED_HEIGHT = 140;
  // Expanded state: dialog/connected view
  var EXPANDED_WIDTH = 420;
  var EXPANDED_HEIGHT = 700;

  function buildEmbedUrl(config) {
    var params = [];
    if (config.apiKey) params.push('apiKey=' + encodeURIComponent(config.apiKey));
    if (config.agentId) params.push('agentId=' + encodeURIComponent(config.agentId));
    if (config.theme) params.push('theme=' + encodeURIComponent(JSON.stringify(config.theme)));
    if (config.title) params.push('title=' + encodeURIComponent(config.title));
    if (config.darkMode) params.push('darkMode=true');
    params.push('initiallyOpen=false');
    params.push('solarSystemTheme=true');
    return WIDGET_BASE_URL + '/widget-embed?' + params.join('&');
  }

  function createWidget(config) {
    // Validate required params
    if (!config.apiKey || !config.agentId) {
      console.error('Convo Widget: apiKey and agentId are required');
      return null;
    }

    // Remove existing widget if any
    var existing = document.getElementById('convo-widget-container');
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.id = 'convo-widget-container';
    container.style.cssText = 'position:fixed;bottom:0;right:0;z-index:2147483647;pointer-events:none;';

    var iframe = document.createElement('iframe');
    iframe.id = 'convo-widget-iframe';
    iframe.src = buildEmbedUrl(config);
    iframe.allow = 'microphone';
    iframe.style.cssText = [
      'position:fixed',
      'bottom:0',
      'right:0',
      'width:' + COLLAPSED_WIDTH + 'px',
      'height:' + COLLAPSED_HEIGHT + 'px',
      'border:none',
      'background:transparent',
      'z-index:2147483647',
      'overflow:hidden',
      'pointer-events:auto',
      'transition:width 0.3s ease, height 0.3s ease'
    ].join(';') + ';';

    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowtransparency', 'true');

    container.appendChild(iframe);
    document.body.appendChild(container);

    // Listen for resize messages from the widget
    window.addEventListener('message', function(event) {
      if (!event.data || !event.data.type) return;
      if (event.source !== iframe.contentWindow) return;

      if (event.data.type === 'convo-widget-toggle') {
        var isOpen = event.data.isOpen;
        if (isOpen) {
          // Expanded: show full dialog/connected view
          iframe.style.width = Math.min(EXPANDED_WIDTH, window.innerWidth - 20) + 'px';
          iframe.style.height = Math.min(EXPANDED_HEIGHT, window.innerHeight - 20) + 'px';
        } else {
          // Collapsed: just the bubble with tooltip and footer visible
          iframe.style.width = COLLAPSED_WIDTH + 'px';
          iframe.style.height = COLLAPSED_HEIGHT + 'px';
        }
      }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
      // Ensure iframe doesn't exceed viewport when expanded
      var currentWidth = parseInt(iframe.style.width) || COLLAPSED_WIDTH;
      if (currentWidth > COLLAPSED_WIDTH) {
        iframe.style.width = Math.min(EXPANDED_WIDTH, window.innerWidth - 20) + 'px';
        iframe.style.height = Math.min(EXPANDED_HEIGHT, window.innerHeight - 20) + 'px';
      }
    });

    return { container: container, iframe: iframe };
  }

  function parseConfig(element) {
    var config = {};
    config.apiKey = element.getAttribute('data-api-key') || element.getAttribute('api-key') || DEFAULTS.apiKey;
    config.agentId = element.getAttribute('data-agent-id') || element.getAttribute('agent-id') || DEFAULTS.agentId;
    config.title = element.getAttribute('data-title') || element.getAttribute('title') || DEFAULTS.title;
    config.darkMode = (element.getAttribute('data-dark-mode') || element.getAttribute('dark-mode')) === 'true';

    var themeStr = element.getAttribute('data-theme') || element.getAttribute('theme');
    if (themeStr) {
      try {
        config.theme = JSON.parse(themeStr);
      } catch (e) {
        console.warn('Convo Widget: Invalid theme JSON, using defaults');
        config.theme = DEFAULTS.theme;
      }
    } else {
      config.theme = DEFAULTS.theme;
    }

    return config;
  }

  // Define custom element
  if (!customElements.get('convo-chat-widget')) {
    customElements.define('convo-chat-widget', class extends HTMLElement {
      connectedCallback() {
        var config = parseConfig(this);
        this._widget = createWidget(config);
      }
      disconnectedCallback() {
        if (this._widget && this._widget.container) {
          this._widget.container.remove();
        }
      }
    });
  }

  // Auto-init from script tag
  var currentScript = document.currentScript;
  if (currentScript) {
    var autoInit = currentScript.getAttribute('data-auto-init');
    if (autoInit === 'true') {
      var config = parseConfig(currentScript);
      var initWidget = function() {
        createWidget(config);
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
      } else {
        initWidget();
      }
    }
  }

  // Expose API for programmatic control
  window.ConvoWidget = {
    create: createWidget,
    baseUrl: WIDGET_BASE_URL
  };

})();

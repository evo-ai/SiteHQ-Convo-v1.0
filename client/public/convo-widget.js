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

  var WIDGET_BASE_URL = (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('convo-widget.js') !== -1) {
        return src.replace(/\/convo-widget\.js.*$/, '');
      }
    }
    return '';
  })();

  var DEFAULTS = {
    apiKey: '',
    agentId: '',
    theme: { primary: '#F95638', background: '#ffffff', text: '#333333' },
    title: 'AI Assistant',
    darkMode: false,
    position: 'bottom-right',
    bubbleSize: 60
  };

  function buildEmbedUrl(config) {
    var params = [];
    if (config.apiKey) params.push('apiKey=' + encodeURIComponent(config.apiKey));
    if (config.agentId) params.push('agentId=' + encodeURIComponent(config.agentId));
    if (config.theme) params.push('theme=' + encodeURIComponent(JSON.stringify(config.theme)));
    if (config.title) params.push('title=' + encodeURIComponent(config.title));
    if (config.darkMode) params.push('darkMode=true');
    params.push('initiallyOpen=false');
    return WIDGET_BASE_URL + '/widget-embed?' + params.join('&');
  }

  function createWidget(config) {
    var container = document.createElement('div');
    container.id = 'convo-widget-container';
    container.style.cssText = 'position:fixed;bottom:0;right:0;z-index:2147483647;width:0;height:0;';

    var iframe = document.createElement('iframe');
    iframe.id = 'convo-widget-iframe';
    iframe.src = buildEmbedUrl(config);
    iframe.allow = 'microphone';
    iframe.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:20px',
      'width:80px',
      'height:80px',
      'border:none',
      'background:transparent',
      'z-index:2147483647',
      'overflow:hidden',
      'border-radius:50%',
      'transition:all 0.3s ease'
    ].join(';') + ';';

    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');

    container.appendChild(iframe);
    document.body.appendChild(container);

    window.addEventListener('message', function(event) {
      if (!event.data || !event.data.type) return;
      if (event.source !== iframe.contentWindow) return;

      if (event.data.type === 'convo-widget-toggle') {
        var isOpen = event.data.isOpen;
        if (isOpen) {
          iframe.style.width = '420px';
          iframe.style.height = '700px';
          iframe.style.borderRadius = '16px';
          iframe.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
          iframe.style.maxHeight = 'calc(100vh - 40px)';
          iframe.style.maxWidth = 'calc(100vw - 40px)';
        } else {
          iframe.style.width = '80px';
          iframe.style.height = '80px';
          iframe.style.borderRadius = '50%';
          iframe.style.boxShadow = 'none';
        }
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

  if (!customElements.get('convo-chat-widget')) {
    customElements.define('convo-chat-widget', class extends HTMLElement {
      connectedCallback() {
        var config = parseConfig(this);
        createWidget(config);
      }
    });
  }

  var currentScript = document.currentScript;
  if (currentScript) {
    var autoInit = currentScript.getAttribute('data-auto-init');
    if (autoInit === 'true') {
      var config = parseConfig(currentScript);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          createWidget(config);
        });
      } else {
        createWidget(config);
      }
    }
  }

})();

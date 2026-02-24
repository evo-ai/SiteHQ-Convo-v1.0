import { h, render } from 'preact';
import { ChatBubble } from './ChatBubble';
import type { WidgetConfig, WidgetTheme } from './types';
import styles from './styles.css?inline';

/**
 * Parse theme from string or object
 */
const parseTheme = (themeValue: string | object | null | undefined): WidgetTheme | undefined => {
  if (!themeValue) return undefined;

  if (typeof themeValue === 'string') {
    try {
      return JSON.parse(themeValue);
    } catch {
      return undefined;
    }
  }

  return themeValue as WidgetTheme;
};

/**
 * Initialize the Convo widget with Shadow DOM isolation
 */
const initWidget = (config: WidgetConfig): void => {
  // Remove existing widget if present
  const existing = document.getElementById('convo-widget-root');
  if (existing) {
    existing.remove();
  }

  // Create container
  const container = document.createElement('div');
  container.id = 'convo-widget-root';
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;

  // Attach Shadow DOM
  const shadow = container.attachShadow({ mode: 'open' });

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  // Create mount point
  const mountPoint = document.createElement('div');
  mountPoint.className = 'widget-mount';
  mountPoint.style.pointerEvents = 'auto';
  shadow.appendChild(mountPoint);

  // Render Preact component
  render(<ChatBubble {...config} />, mountPoint);

  // Add to document
  document.body.appendChild(container);
};

/**
 * Get configuration from script attributes
 */
const getConfigFromScript = (script: HTMLScriptElement): WidgetConfig | null => {
  const agentId = script.dataset.agentId || script.getAttribute('data-agent-id');
  const apiKey = script.dataset.apiKey || script.getAttribute('data-api-key');

  if (!agentId || !apiKey) {
    return null;
  }

  return {
    agentId,
    apiKey,
    title: script.dataset.title || script.getAttribute('data-title') || undefined,
    theme: parseTheme(script.dataset.theme || script.getAttribute('data-theme')),
    darkMode: script.dataset.darkMode === 'true' || script.getAttribute('data-dark-mode') === 'true',
    solarSystemTheme: script.dataset.solarSystemTheme !== 'false',
    initiallyOpen: script.dataset.initiallyOpen === 'true' || script.getAttribute('data-initially-open') === 'true'
  };
};

/**
 * Define custom element for declarative usage
 */
const defineCustomElement = (): void => {
  if (customElements.get('convo-chat-widget')) return;

  class ConvoChatWidget extends HTMLElement {
    private _initialized = false;

    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      const agentId = this.getAttribute('agent-id');
      const apiKey = this.getAttribute('api-key');

      if (!agentId || !apiKey) {
        console.error('[Convo Widget] agent-id and api-key attributes are required');
        return;
      }

      initWidget({
        agentId,
        apiKey,
        title: this.getAttribute('title') || undefined,
        theme: parseTheme(this.getAttribute('theme')),
        darkMode: this.getAttribute('dark-mode') === 'true',
        solarSystemTheme: this.getAttribute('solar-system-theme') !== 'false',
        initiallyOpen: this.getAttribute('initially-open') === 'true'
      });
    }

    disconnectedCallback() {
      const widget = document.getElementById('convo-widget-root');
      if (widget) widget.remove();
    }
  }

  customElements.define('convo-chat-widget', ConvoChatWidget);
};

/**
 * Initialize on DOM ready
 */
const initialize = (): void => {
  // Define custom element
  defineCustomElement();

  // Check for auto-init via script attributes
  const currentScript = document.currentScript as HTMLScriptElement | null;

  if (currentScript) {
    const autoInit = currentScript.dataset.autoInit === 'true' ||
                     currentScript.getAttribute('data-auto-init') === 'true';

    if (autoInit) {
      const config = getConfigFromScript(currentScript);
      if (config) {
        initWidget(config);
      } else {
        console.error('[Convo Widget] data-agent-id and data-api-key are required for auto-init');
      }
    }
  }
};

// Prevent double initialization
if (typeof window !== 'undefined' && !(window as any).__CONVO_WIDGET_LOADED__) {
  (window as any).__CONVO_WIDGET_LOADED__ = true;

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expose API for programmatic usage
  (window as any).ConvoWidget = {
    init: initWidget,
    version: '2.0.0'
  };
}

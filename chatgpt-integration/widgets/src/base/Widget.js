/**
 * Base Widget Class
 * Foundation for all CraftLocal widgets
 */

export class CraftLocalWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._accessToken = null;
    // API base should be configured via attribute or global config
    this._apiBase =
      this.getAttribute("api-base") || window.CRAFTLOCAL_API_BASE || "";

    if (!this._apiBase) {
      console.error(
        "CraftLocal Widget: API base URL not configured. Set via api-base attribute or window.CRAFTLOCAL_API_BASE"
      );
    }
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  /**
   * Set OAuth access token for API calls
   */
  setAccessToken(token) {
    this._accessToken = token;
  }

  /**
   * Make authenticated API call
   */
  async apiCall(endpoint, options = {}) {
    if (!this._accessToken) {
      throw new Error("Access token not set");
    }

    const response = await fetch(`${this._apiBase}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this._accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get base styles shared across widgets
   */
  getBaseStyles() {
    return `
      <style>
        :host {
          --primary: var(--craftlocal-primary, #0066cc);
          --background: var(--craftlocal-background, #ffffff);
          --text: var(--craftlocal-text, #333333);
          --border: var(--craftlocal-border, #e0e0e0);
          --radius: var(--craftlocal-border-radius, 8px);
          --shadow: var(--craftlocal-shadow, 0 2px 8px rgba(0,0,0,0.1));
          
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: var(--text);
        }

        * {
          box-sizing: border-box;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error {
          background: #fee;
          color: #c00;
          padding: 16px;
          border-radius: var(--radius);
          border: 1px solid #fcc;
        }

        button {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: var(--radius);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        button:hover {
          opacity: 0.9;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        button.secondary {
          background: white;
          color: var(--primary);
          border: 1px solid var(--primary);
        }

        .card {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: var(--shadow);
        }

        img {
          max-width: 100%;
          height: auto;
          display: block;
        }

        @media (max-width: 640px) {
          :host {
            font-size: 14px;
          }
          
          button {
            padding: 10px 20px;
            font-size: 13px;
          }
        }
      </style>
    `;
  }

  /**
   * Emit custom event
   */
  emit(eventName, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Format price
   */
  formatPrice(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(dateString) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  }

  // Override these in child classes
  render() {}
  attachEventListeners() {}
  cleanup() {}
}

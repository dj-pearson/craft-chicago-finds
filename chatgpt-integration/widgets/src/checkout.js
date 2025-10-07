/**
 * Checkout Widget
 * Displays checkout summary and payment options
 */

import { CraftLocalWidget } from './base/Widget.js';

class CheckoutWidget extends CraftLocalWidget {
  static get observedAttributes() {
    return ['session-id', 'compact'];
  }

  constructor() {
    super();
    this.sessionId = null;
    this.compact = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'session-id' && newValue) {
      this.sessionId = newValue;
      this.render();
    } else if (name === 'compact') {
      this.compact = newValue === 'true';
      this.render();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${this.getBaseStyles()}
      <style>
        .checkout-container {
          padding: 24px;
          max-width: 600px;
          margin: 0 auto;
        }

        .checkout-card {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow);
        }

        .heading {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 20px 0;
          text-align: center;
        }

        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .status-pending {
          background: #fff3e0;
          color: #e65100;
        }

        .status-complete {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .checkout-url {
          display: block;
          width: 100%;
          padding: 16px;
          margin: 16px 0;
          background: var(--primary);
          color: white;
          text-align: center;
          text-decoration: none;
          border-radius: var(--radius);
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .checkout-url:hover {
          opacity: 0.9;
        }

        .info-section {
          margin: 20px 0;
          padding: 16px;
          background: #f9f9f9;
          border-radius: var(--radius);
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }

        .info-label {
          color: #666;
        }

        .info-value {
          font-weight: 600;
        }

        .security-note {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 16px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: var(--radius);
        }

        .security-icon {
          color: #4caf50;
          margin-right: 4px;
        }

        @media (max-width: 640px) {
          .checkout-container {
            padding: 16px;
          }

          .checkout-card {
            padding: 16px;
          }

          .heading {
            font-size: 20px;
          }
        }
      </style>

      <div class="checkout-container">
        <div class="checkout-card">
          <h2 class="heading">Complete Your Purchase</h2>
          
          <div style="text-align: center;">
            <span class="status-badge status-pending">Payment Pending</span>
          </div>

          <div class="info-section">
            <div class="info-item">
              <span class="info-label">Session ID:</span>
              <span class="info-value">${this.sessionId?.substring(0, 20)}...</span>
            </div>
            <div class="info-item">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">Card</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="info-value">Ready for Payment</span>
            </div>
          </div>

          <a 
            href="https://checkout.stripe.com/c/pay/${this.sessionId}" 
            target="_blank"
            class="checkout-url"
            data-action="open-checkout"
          >
            Proceed to Secure Checkout →
          </a>

          <div class="security-note">
            <span class="security-icon">🔒</span>
            Secured by Stripe. Your payment information is encrypted and secure.
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    this.shadowRoot.addEventListener('click', (e) => {
      const link = e.target.closest('[data-action="open-checkout"]');
      if (link) {
        this.emit('checkout-initiated', { sessionId: this.sessionId });
      }
    });
  }
}

customElements.define('craftlocal-checkout', CheckoutWidget);

export { CheckoutWidget };

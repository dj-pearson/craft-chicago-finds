/**
 * Product Detail Widget
 * Shows detailed product information
 */

import { CraftLocalWidget } from './base/Widget.js';

class ProductDetailWidget extends CraftLocalWidget {
  static get observedAttributes() {
    return ['listing-id', 'show-similar'];
  }

  constructor() {
    super();
    this.listingId = null;
    this.showSimilar = true;
    this.listing = null;
    this.currentImageIndex = 0;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'listing-id' && newValue) {
      this.listingId = newValue;
      this.loadListing();
    } else if (name === 'show-similar') {
      this.showSimilar = newValue === 'true';
    }
  }

  async loadListing() {
    try {
      this.shadowRoot.innerHTML = `${this.getBaseStyles()}<div class="loading"><div class="spinner"></div></div>`;
      
      const data = await this.apiCall(`/rest/v1/listings?id=eq.${this.listingId}&select=*,profiles(display_name)`);
      this.listing = data[0];
      
      if (!this.listing) {
        throw new Error('Listing not found');
      }
      
      this.render();
    } catch (error) {
      this.shadowRoot.innerHTML = `${this.getBaseStyles()}<div class="error">Failed to load product: ${error.message}</div>`;
    }
  }

  render() {
    if (!this.listing) return;

    const images = this.listing.images || [];
    const currentImage = images[this.currentImageIndex] || 'https://via.placeholder.com/600x400?text=No+Image';

    this.shadowRoot.innerHTML = `
      ${this.getBaseStyles()}
      <style>
        .detail-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .product-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .image-gallery {
          position: relative;
        }

        .main-image {
          width: 100%;
          height: 500px;
          object-fit: cover;
          border-radius: var(--radius);
          background: #f5f5f5;
        }

        .thumbnails {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          overflow-x: auto;
        }

        .thumbnail {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }

        .thumbnail.active {
          border-color: var(--primary);
        }

        .product-details {
          padding: 20px 0;
        }

        .title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 12px 0;
        }

        .seller-info {
          color: #666;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .price {
          font-size: 32px;
          font-weight: 700;
          color: var(--primary);
          margin: 16px 0;
        }

        .description {
          line-height: 1.6;
          color: #444;
          margin: 20px 0;
        }

        .inventory-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          margin: 12px 0;
        }

        .in-stock {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .low-stock {
          background: #fff3e0;
          color: #e65100;
        }

        .out-of-stock {
          background: #ffebee;
          color: #c62828;
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .actions button {
          flex: 1;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 24px 0;
          padding: 20px;
          background: #f9f9f9;
          border-radius: var(--radius);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .detail-label {
          font-weight: 600;
          color: #666;
        }

        @media (max-width: 768px) {
          .product-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .main-image {
            height: 300px;
          }

          .title {
            font-size: 22px;
          }

          .price {
            font-size: 26px;
          }

          .actions {
            flex-direction: column;
          }
        }
      </style>

      <div class="detail-container">
        <div class="product-layout">
          <div class="image-gallery">
            <img src="${currentImage}" alt="${this.listing.title}" class="main-image" />
            ${images.length > 1 ? `
              <div class="thumbnails">
                ${images.map((img, idx) => `
                  <img 
                    src="${img}" 
                    alt="Thumbnail ${idx + 1}" 
                    class="thumbnail ${idx === this.currentImageIndex ? 'active' : ''}"
                    data-index="${idx}"
                  />
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="product-details">
            <h1 class="title">${this.listing.title}</h1>
            <div class="seller-info">
              by ${this.listing.profiles?.display_name || 'Artisan'}
            </div>
            
            <div class="price">${this.formatPrice(this.listing.price)}</div>
            
            ${this.renderInventoryStatus()}

            <div class="description">${this.listing.description || ''}</div>

            <div class="details-grid">
              ${this.listing.local_pickup_available ? `
                <div class="detail-item">
                  <span class="detail-label">📍 Local Pickup:</span>
                  <span>${this.listing.pickup_location || 'Available'}</span>
                </div>
              ` : ''}
              ${this.listing.shipping_available ? `
                <div class="detail-item">
                  <span class="detail-label">📦 Shipping:</span>
                  <span>Available</span>
                </div>
              ` : ''}
              ${this.listing.ready_today ? `
                <div class="detail-item">
                  <span class="detail-label">⚡ Ready Today:</span>
                  <span>Available now</span>
                </div>
              ` : ''}
            </div>

            <div class="actions">
              <button class="primary" data-action="add-to-cart">Add to Cart</button>
              <button class="secondary" data-action="contact-seller">Contact Seller</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderInventoryStatus() {
    const inventory = this.listing.inventory_count || 0;
    
    if (inventory === 0) {
      return '<div class="inventory-status out-of-stock">Out of Stock</div>';
    } else if (inventory <= 3) {
      return `<div class="inventory-status low-stock">Only ${inventory} left!</div>`;
    } else {
      return '<div class="inventory-status in-stock">In Stock</div>';
    }
  }

  attachEventListeners() {
    this.shadowRoot.addEventListener('click', (e) => {
      // Image thumbnail clicks
      const thumbnail = e.target.closest('.thumbnail');
      if (thumbnail) {
        this.currentImageIndex = parseInt(thumbnail.dataset.index);
        this.render();
        return;
      }

      // Action button clicks
      const button = e.target.closest('button[data-action]');
      if (button) {
        const action = button.dataset.action;
        if (action === 'add-to-cart') {
          this.emit('add-to-cart', { listingId: this.listingId, listing: this.listing });
        } else if (action === 'contact-seller') {
          this.emit('contact-seller', { sellerId: this.listing.seller_id });
        }
      }
    });
  }
}

customElements.define('craftlocal-product-detail', ProductDetailWidget);

export { ProductDetailWidget };

/**
 * Product Grid Widget
 * Displays a grid of product listings
 */

import { CraftLocalWidget } from './base/Widget.js';

class ProductGridWidget extends CraftLocalWidget {
  static get observedAttributes() {
    return ['listings', 'columns', 'show-filters'];
  }

  constructor() {
    super();
    this.listings = [];
    this.columns = 3;
    this.showFilters = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'listings' && newValue) {
      try {
        this.listings = JSON.parse(newValue);
        this.render();
      } catch (e) {
        console.error('Invalid listings JSON:', e);
      }
    } else if (name === 'columns') {
      this.columns = parseInt(newValue) || 3;
      this.render();
    } else if (name === 'show-filters') {
      this.showFilters = newValue === 'true';
      this.render();
    }
  }

  render() {
    const gridCols = Math.min(this.columns, 4);
    
    this.shadowRoot.innerHTML = `
      ${this.getBaseStyles()}
      <style>
        .grid-container {
          padding: 16px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(${gridCols}, 1fr);
          gap: 20px;
          margin-top: 16px;
        }

        .product-card {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow);
        }

        .product-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          background: #f5f5f5;
        }

        .product-info {
          padding: 16px;
        }

        .product-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--text);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-price {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary);
          margin: 8px 0;
        }

        .product-seller {
          font-size: 13px;
          color: #666;
          margin: 4px 0;
        }

        .product-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 8px;
        }

        .tag {
          background: #f0f0f0;
          color: #666;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        @media (max-width: 768px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .product-image {
            height: 160px;
          }
        }

        @media (max-width: 480px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="grid-container">
        ${this.listings.length === 0 ? `
          <div class="empty-state">
            <p>No products found</p>
          </div>
        ` : `
          <div class="grid">
            ${this.listings.map(listing => this.renderProductCard(listing)).join('')}
          </div>
        `}
      </div>
    `;
  }

  renderProductCard(listing) {
    const image = listing.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image';
    const tags = listing.tags?.slice(0, 3) || [];

    return `
      <div class="product-card" data-listing-id="${listing.id}">
        <img src="${image}" alt="${listing.title}" class="product-image" loading="lazy" />
        <div class="product-info">
          <h3 class="product-title">${listing.title}</h3>
          <div class="product-price">${this.formatPrice(listing.price)}</div>
          <div class="product-seller">by ${listing.seller_name || 'Artisan'}</div>
          ${tags.length > 0 ? `
            <div class="product-tags">
              ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    this.shadowRoot.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (card) {
        const listingId = card.dataset.listingId;
        this.emit('product-click', { listingId });
      }
    });
  }
}

customElements.define('craftlocal-product-grid', ProductGridWidget);

export { ProductGridWidget };

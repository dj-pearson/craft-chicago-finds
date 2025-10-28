# E2E Test Helpers

This directory contains helper functions and utilities for E2E tests.

## Test Data Helpers

### Auth Helpers
- `createTestUser()` - Create a test user account
- `login()` - Log in as a test user
- `logout()` - Log out current user

### Product Helpers  
- `addProductToCart()` - Add a product to cart
- `goToProduct()` - Navigate to a specific product
- `clearCart()` - Empty the shopping cart

### Database Helpers
- `seedTestData()` - Seed test database with sample data
- `cleanupTestData()` - Remove test data after tests

## Usage

```typescript
import { login, addProductToCart } from './helpers/auth';

test('checkout flow', async ({ page }) => {
  await login(page, 'test@example.com', 'password');
  await addProductToCart(page, 'product-123');
  // ... continue test
});
```

## Notes

- All helpers are async functions
- Use page fixtures from Playwright
- Clean up test data in afterEach hooks

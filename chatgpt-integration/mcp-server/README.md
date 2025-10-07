# CraftLocal MCP Server

Model Context Protocol server for integrating CraftLocal marketplace with ChatGPT.

## Overview

This server implements the Model Context Protocol (MCP) to enable ChatGPT users to browse, purchase, and manage listings on the CraftLocal marketplace through conversational AI.

## Features

- **🔍 Browse & Search**: Natural language product search
- **🛒 Checkout**: Guest and authenticated checkout flows
- **📦 Orders**: View and track orders
- **🏪 Seller Tools**: Create, update, and manage listings
- **📊 Analytics**: Seller dashboard with metrics
- **🔐 OAuth 2.1**: Secure authentication
- **🎨 Interactive Widgets**: Rich UI components in ChatGPT

## Architecture

```
ChatGPT → MCP Server → Supabase (Database + Functions)
                    → Stripe (Payments)
                    → OAuth Provider (Auth)
```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Supabase project
- Stripe account
- Redis (optional, for session storage)

### Setup

1. **Clone and install dependencies**:

```bash
cd chatgpt-integration/mcp-server
npm install
```

2. **Configure environment variables**:

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `STRIPE_SECRET_KEY`: Stripe secret key

3. **Build the project**:

```bash
npm run build
```

4. **Run in development**:

```bash
npm run dev
```

5. **Run in production**:

```bash
npm start
```

## API Endpoints

### Health Check

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependency checks

### OAuth Discovery

- `GET /.well-known/oauth-protected-resource` - OAuth resource metadata
- `GET /.well-known/openid-configuration` - OpenID Connect configuration
- `GET /.well-known/jwks.json` - JSON Web Key Set

### MCP Protocol

- `GET /mcp/tools` - List available tools
- `POST /mcp/execute` - Execute a tool
- `GET /mcp/widgets/:widgetType` - Get widget HTML

## Available Tools

### Public Tools (No Auth)

#### search_listings

Search and browse products:

```json
{
  "tool": "search_listings",
  "parameters": {
    "query": "ceramic mug",
    "price_max": 30,
    "city_id": "chicago",
    "limit": 20
  }
}
```

#### get_listing

View product details:

```json
{
  "tool": "get_listing",
  "parameters": {
    "listing_id": "abc123"
  }
}
```

#### create_checkout

Start checkout process:

```json
{
  "tool": "create_checkout",
  "parameters": {
    "listing_id": "abc123",
    "quantity": 1
  }
}
```

### Authenticated Tools

#### get_orders

View order history (requires `orders.read` scope):

```json
{
  "tool": "get_orders",
  "parameters": {
    "status": "all",
    "limit": 20
  }
}
```

#### create_listing

Create product listing (requires `listings.write` scope):

```json
{
  "tool": "create_listing",
  "parameters": {
    "title": "Handmade Ceramic Mug",
    "description": "Beautiful handcrafted ceramic mug...",
    "price": 25,
    "category_id": "home-decor",
    "city_id": "chicago"
  }
}
```

#### get_seller_dashboard

View seller analytics (requires `seller.manage` scope):

```json
{
  "tool": "get_seller_dashboard",
  "parameters": {
    "time_period": "30d"
  }
}
```

See full tool documentation in `/docs/tool-specifications.md`

## OAuth Scopes

- `listings.read` - View product listings
- `listings.write` - Create/edit listings
- `orders.read` - View orders
- `orders.write` - Create orders
- `seller.manage` - Full seller capabilities

## Authentication

### Using Supabase Auth

Set `USE_SUPABASE_AUTH=true` in `.env`:

```env
USE_SUPABASE_AUTH=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Using Auth0

Configure Auth0 credentials:

```env
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

## Development

### Project Structure

```
src/
├── index.ts              # Entry point
├── config/
│   └── environment.ts    # Configuration
├── middleware/
│   ├── auth.ts          # OAuth verification
│   ├── error-handler.ts # Error handling
│   └── request-logger.ts # Logging
├── routes/
│   ├── health.ts        # Health checks
│   ├── mcp.ts           # MCP endpoints
│   └── oauth.ts         # OAuth discovery
├── tools/               # MCP tool implementations
│   ├── search-listings.ts
│   ├── get-listing.ts
│   ├── checkout.ts
│   ├── orders.ts
│   ├── seller-listings.ts
│   └── seller-dashboard.ts
└── utils/
    └── logger.ts        # Winston logger
```

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Deployment

### Fly.io (Recommended)

1. Install Fly CLI:

```bash
curl -L https://fly.io/install.sh | sh
```

2. Create app:

```bash
fly launch
```

3. Set secrets:

```bash
fly secrets set SUPABASE_URL=xxx SUPABASE_ANON_KEY=xxx ...
```

4. Deploy:

```bash
fly deploy
```

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd chatgpt-integration/mcp-server && npm install && npm run build`
4. Set start command: `cd chatgpt-integration/mcp-server && npm start`
5. Add environment variables

### Railway

1. Create new project
2. Add GitHub repository
3. Set root directory: `chatgpt-integration/mcp-server`
4. Add environment variables
5. Deploy

## Monitoring

The server uses Winston for logging with structured JSON logs in production.

### Log Levels

- `error`: Error events
- `warn`: Warning events
- `info`: Informational messages
- `debug`: Debug messages

### Metrics to Monitor

- Request latency (target: <500ms p95)
- Error rates
- Tool invocation counts
- Authentication failures
- Database connection health

## Troubleshooting

### Common Issues

**OAuth token verification fails**:

- Check `JWT_ISSUER` and `JWT_AUDIENCE` match OAuth provider
- Verify JWKS endpoint is accessible
- Check token hasn't expired

**Database connection errors**:

- Verify `SUPABASE_URL` and keys are correct
- Check Supabase project is active
- Verify RLS policies allow access

**Stripe errors**:

- Confirm `STRIPE_SECRET_KEY` is correct
- Check webhook secret if using webhooks
- Verify Stripe account is active

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

## Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Submit pull request

## Documentation

- [Architecture Overview](../docs/architecture.md)
- [API Inventory](../docs/api-inventory.md)
- [Tool Specifications](../docs/tool-specifications.md)
- [Widget Development](../docs/widget-specifications.md)

## License

MIT

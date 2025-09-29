# Cloudflare Pages Deployment Guide

## Overview
This guide covers deploying CraftLocal Chicago marketplace to Cloudflare Pages with optimal performance and security configurations.

## Prerequisites
- Cloudflare account
- GitHub repository connected to Cloudflare Pages
- Environment variables configured

## Configuration Files

### 1. `wrangler.toml`
- Project configuration for Cloudflare Pages
- Build settings and environment variables
- Functions integration setup

### 2. `public/_headers`
- Security headers (CSP, HSTS, X-Frame-Options)
- Caching policies for different file types
- Performance optimizations
- CORS configuration

### 3. `public/_redirects`
- SEO-friendly URL redirects
- SPA routing fallback
- Domain canonicalization
- Legacy URL handling

## Environment Variables

Set these in your Cloudflare Pages dashboard:

### Required Variables
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_GA_MEASUREMENT_ID=G-3K5Z8EXE1P
```

### Optional Variables
```
SITE_URL=https://craftlocal.com
ENVIRONMENT=production
```

## Build Configuration

### Build Command
```bash
npm run build
```

### Output Directory
```
dist
```

### Root Directory
```
/ (project root)
```

## Deployment Steps

### 1. Connect Repository
1. Go to Cloudflare Pages dashboard
2. Click "Create a project"
3. Connect your GitHub repository
4. Select the repository: `craft-chicago-finds`

### 2. Configure Build Settings
- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

### 3. Set Environment Variables
Add all required environment variables in the Pages dashboard under Settings > Environment variables.

### 4. Configure Custom Domain
1. Add custom domain: `craftlocal.com`
2. Add www redirect: `www.craftlocal.com` → `craftlocal.com`
3. Enable automatic HTTPS

### 5. Enable Analytics
- Enable Cloudflare Web Analytics
- Configure Google Analytics (already set up with G-3K5Z8EXE1P)

## Performance Optimizations

### Caching Strategy
- **Static assets**: 1 year cache with immutable flag
- **HTML files**: 5 minutes cache
- **API responses**: No cache
- **Images**: 1 year cache

### Security Headers
- **CSP**: Configured for Stripe, Supabase, Google Analytics
- **HSTS**: 1 year max-age with includeSubDomains
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff

### Build Optimizations
- **Code splitting**: Vendor, UI, utilities separated
- **Tree shaking**: Unused code removed
- **Minification**: Terser with console.log removal
- **Asset optimization**: Images and fonts properly cached

## SEO Configuration

### Sitemap Generation
- Dynamic sitemaps via Supabase Edge Functions
- Automatic updates when content changes
- Proper indexing for products, sellers, cities, blog

### Meta Tags
- Comprehensive SEO meta tags
- Open Graph and Twitter Card support
- Structured data (JSON-LD schema)
- Local SEO optimization

### URL Structure
- Clean, SEO-friendly URLs
- Proper redirects for legacy URLs
- Canonical URL enforcement

## Monitoring and Analytics

### Cloudflare Analytics
- Page views and unique visitors
- Performance metrics (Core Web Vitals)
- Security events and threats
- Bandwidth usage

### Google Analytics 4
- E-commerce tracking
- User behavior analysis
- Conversion funnel tracking
- Custom marketplace events

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set
   - Verify Node.js version compatibility
   - Review build logs for specific errors

2. **Routing Issues**
   - Ensure `_redirects` file is in `public/` directory
   - Check SPA fallback rule is last in redirects
   - Verify React Router configuration

3. **Performance Issues**
   - Review `_headers` caching policies
   - Check bundle size and code splitting
   - Monitor Core Web Vitals

4. **Security Warnings**
   - Update CSP headers for new integrations
   - Review CORS configuration
   - Check HTTPS enforcement

## Maintenance

### Regular Tasks
- Monitor performance metrics
- Update dependencies monthly
- Review security headers quarterly
- Optimize images and assets
- Update sitemap configurations

### Scaling Considerations
- Monitor bandwidth usage
- Consider Cloudflare Pro for higher traffic
- Implement edge caching for dynamic content
- Set up load balancing if needed

## Support Resources
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router Deployment](https://reactrouter.com/en/main/guides/deploying)

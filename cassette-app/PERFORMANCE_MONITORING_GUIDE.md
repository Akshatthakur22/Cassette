# Performance Monitoring Guide — CASSETTE

## Overview

CASSETTE implements comprehensive performance monitoring with:
- Core Web Vitals tracking (LCP, FID, CLS, TTFB, FCP)
- Client-side performance observer using PerformanceObserver API
- Server-side metrics collection endpoint
- Lighthouse integration for production audits
- Real user monitoring (RUM) with PostHog analytics

## Core Web Vitals (CWV)

### Measured Metrics

| Metric | Abbreviation | Threshold (Good) | Unit | What It Measures |
|--------|--------------|------------------|------|------------------|
| Largest Contentful Paint | **LCP** | ≤ 2.5s | milliseconds | When the largest visible content loads |
| First Input Delay | **FID** | ≤ 100ms | milliseconds | Responsiveness to user input |
| Cumulative Layout Shift | **CLS** | ≤ 0.1 | unitless | Visual stability (unexpected shifts) |
| Time to First Byte | **TTFB** | ≤ 600ms | milliseconds | Server response speed |
| First Contentful Paint | **FCP** | ≤ 1.8s | milliseconds | When first content appears |

### Current Implementation

**File:** `cassette-app/app/lib/performance-monitoring.ts`

Provides:
- `observeWebVitals()`: Attaches PerformanceObserver for LCP, FID, CLS, FCP
- `reportMetric()`: Sends metrics to `/api/analytics/metrics` endpoint
- `rateMetric()`: Rates metric as "good", "needsImprovement", or "poor"
- `getPerformanceSummary()`: Returns Navigation Timing breakdown

**File:** `cassette-app/app/components/PerformanceMonitor.tsx`

Client-side component that:
- Initializes performance monitoring on page load
- Logs performance data in dev mode
- Attaches to root layout automatically

## Lighthouse Integration

### Local Testing

Run Lighthouse audits locally:

```bash
# Install Lighthouse CLI
npm install --save-dev @lhci/cli@latest

# Create lighthouserc.json (see below)
# Run audit
npm run lighthouse
```

**lighthouserc.json:**
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3,
      "settings": {
        "configPath": "./lighthouserc.json"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### CI/CD Integration

Add to GitHub Actions (`.github/workflows/lighthouse.yml`):

```yaml
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.json'
```

### Production Monitoring

**Vercel Analytics** (recommended):
1. Connect GitHub to Vercel
2. Enable Analytics in Vercel dashboard
3. View metrics at vercel.com/analytics

**Manual Integration** with PostHog:
- Metrics endpoint automatically sends to PostHog
- View at PostHog insights dashboard
- Set up alerts for metric degradation

## Performance Monitoring in Code

### Using the PerformanceMonitor Component

Already integrated in root layout. No action needed — it monitors automatically.

### Manual Performance Tracking

```typescript
import { reportMetric, rateMetric } from "@/app/lib/performance-monitoring";

// Report a custom metric
reportMetric({
  name: "CustomMetric",
  value: 1234,
  rating: rateMetric("CustomMetric", 1234),
  id: "custom-123",
});
```

### Checking Performance in Browser

1. Open **DevTools → Performance** tab
2. Click record → interact with page → stop
3. View flame chart showing:
   - JavaScript execution
   - Layout/Paint operations
   - Network requests
4. Open **DevTools → Lighthouse** tab
5. Click "Analyze page load"
6. View detailed audit report

## Metrics Collection Endpoint

**POST** `/api/analytics/metrics`

Accepts JSON:
```json
{
  "name": "LCP",
  "value": 2345,
  "rating": "good",
  "url": "https://cassette.fm/",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-08-15T10:30:00Z"
}
```

Response:
```json
{
  "ok": true,
  "metric": {
    "name": "LCP",
    "value": 2345,
    "rating": "good"
  }
}
```

## Optimization Checklist

### Critical (do first)
- [x] Enable AVIF/WebP image formats (done in Task #6)
- [x] Implement lazy loading for images
- [ ] Implement code splitting for large JS bundles
- [ ] Preload critical fonts and resources

### Important
- [ ] Minify CSS/JS (Next.js does automatically)
- [ ] Cache static assets (1-year TTL configured)
- [ ] Enable compression (gzip/brotli)
- [ ] Reduce main thread work (defer non-critical JS)

### Nice-to-have
- [ ] Generate PWA asset manifest
- [ ] Implement service worker caching strategy
- [ ] Add performance budgets to CI/CD
- [ ] Set up Real User Monitoring (RUM) dashboard

## Expected Metrics

Target scores for CASSETTE:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| LCP | ≤ 2.5s | TBD | ⏳ |
| FID | ≤ 100ms | TBD | ⏳ |
| CLS | ≤ 0.1 | TBD | ⏳ |
| TTFB | ≤ 600ms | TBD | ⏳ |
| Overall Score | ≥ 90 | TBD | ⏳ |

## Troubleshooting

### LCP is slow (> 2.5s)
1. Check image sizes (use DevTools Network tab)
2. Verify fonts are preloaded
3. Check for render-blocking JS/CSS
4. Consider lazy-loading above-fold images

### FID/INP is high (> 100ms)
1. Split large JavaScript bundles
2. Defer non-critical code
3. Use `requestIdleCallback` for background work
4. Check for long tasks in DevTools

### CLS is high (> 0.1)
1. Set explicit width/height on images
2. Reserve space for ads/embeds
3. Avoid inserting content above existing content
4. Use CSS `contain` for isolated components

### TTFB is high (> 600ms)
1. Check server response time (API latency)
2. Verify database queries are optimized
3. Enable response caching (already done)
4. Consider CDN for static assets

## References

- [Core Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [PerformanceObserver API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [Web Performance APIs](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Vercel Analytics](https://vercel.com/docs/analytics)

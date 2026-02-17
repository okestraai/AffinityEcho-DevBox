# Affinity Echo — Deployment Guide

This is a Vite + React + TypeScript SPA (Single Page Application). The build produces static files (`dist/`) that can be served from any static hosting platform.

---

## Prerequisites

- Node.js 18+ and npm
- Environment variables configured (see below)

## Environment Variables

Create a `.env.production` file (or set these in your hosting platform's dashboard):

```env
VITE_API_URL=https://your-api-domain.com/api
VITE_API_BASE_URL=https://your-api-domain.com
VITE_WS_URL=wss://your-api-domain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note:** All `VITE_` variables are embedded at build time — they're baked into the JS bundle, not read at runtime.

## Build

```bash
npm install
npm run build
```

This produces a `dist/` folder with all static assets.

## SPA Routing

Since this app uses React Router (client-side routing), all routes must fall back to `index.html`. Every platform below has a specific way to handle this.

---

## Option 1: AWS (S3 + CloudFront)

### S3 Setup

1. Create an S3 bucket (e.g. `affinity-echo-prod`)
2. Disable "Block all public access"
3. Upload the `dist/` contents to the bucket:
   ```bash
   aws s3 sync dist/ s3://affinity-echo-prod --delete
   ```
4. Enable **Static website hosting** under bucket Properties
5. Set **Index document** to `index.html`
6. Set **Error document** to `index.html` (handles SPA routing)

### CloudFront (CDN + HTTPS)

1. Create a CloudFront distribution pointing to the S3 bucket
2. Set **Default root object** to `index.html`
3. Add a **Custom Error Response**:
   - HTTP error code: `403`
   - Response page path: `/index.html`
   - HTTP response code: `200`
4. Repeat for error code `404`
5. Attach an SSL certificate via AWS Certificate Manager for HTTPS

### Automated Deploys (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS S3
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
          VITE_WS_URL: ${{ secrets.VITE_WS_URL }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
      - run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} --paths "/*"
```

---

## Option 2: Azure (Static Web Apps)

### Via Azure Portal

1. Go to **Azure Portal** > **Create a resource** > **Static Web App**
2. Connect your GitHub repo
3. Set build details:
   - **App location**: `/`
   - **Output location**: `dist`
   - **Build command**: `npm run build`
4. Add environment variables under **Configuration** > **Application settings**
5. Azure automatically handles SPA routing for Static Web Apps

### Via CLI

```bash
# Install Azure CLI and login
az login

# Create resource group (if needed)
az group create --name affinity-echo-rg --location eastus

# Create static web app
az staticwebapp create \
  --name affinity-echo \
  --resource-group affinity-echo-rg \
  --source https://github.com/your-org/your-repo \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

---

## Option 3: Vercel

### Setup

1. Go to [vercel.com](https://vercel.com), import your GitHub repo
2. Vercel auto-detects Vite — no config needed
3. Add environment variables in **Settings** > **Environment Variables**
4. SPA routing works automatically

### CLI Deploy

```bash
npm i -g vercel
vercel --prod
```

### Custom Config (optional)

Create `vercel.json` in project root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Option 4: Netlify

### Setup

1. Go to [netlify.com](https://netlify.com), import your GitHub repo
2. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Add environment variables in **Site settings** > **Environment variables**

### SPA Routing

Create `public/_redirects` (so it gets copied to `dist/`):

```
/*    /index.html   200
```

### CLI Deploy

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## Option 5: Docker + Any Cloud

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

Create `nginx.conf` in project root:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Build and Run

```bash
docker build \
  --build-arg VITE_API_URL=https://api.yoursite.com/api \
  --build-arg VITE_API_BASE_URL=https://api.yoursite.com \
  --build-arg VITE_WS_URL=wss://api.yoursite.com \
  -t affinity-echo .

docker run -p 80:80 affinity-echo
```

This Docker image can be deployed to AWS ECS, Azure Container Apps, Google Cloud Run, DigitalOcean App Platform, or any container hosting.

---

## Post-Deploy Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test login and API connectivity
- [ ] Test WebSocket connection (real-time notifications, messaging)
- [ ] Confirm SPA routing works (navigate to `/dashboard/feeds` directly — should not 404)
- [ ] Check browser console for errors
- [ ] Verify HTTPS is active
- [ ] Test on mobile

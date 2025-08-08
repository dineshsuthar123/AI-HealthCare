# 🚀 AI-HealthCare Deployment Guide

This document provides detailed instructions for deploying the AI-HealthCare platform to various environments.

## 📋 Prerequisites

Before deploying, make sure you have:

1. **MongoDB Database** - Either MongoDB Atlas (recommended for production) or a self-hosted MongoDB instance
2. **OpenAI API Key** - For the AI-powered symptom checker
3. **Twilio Account** (optional) - For SMS functionality
4. **Environment Variables** - All required environment variables as described below

## 🔧 Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# 🗄️ Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-healthcare?retryWrites=true&w=majority

# 🔐 Authentication
NEXTAUTH_URL=https://your-production-url.com
NEXTAUTH_SECRET=your-super-secure-secret-key
# For production, generate a secure secret with: openssl rand -base64 32

# 🤖 AI Services
OPENAI_API_KEY=your-openai-api-key

# 📱 SMS Services (Optional - Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# 🌐 Public Base URL
NEXT_PUBLIC_BASE_URL=https://your-production-url.com
```

## 🔄 Local Deployment

To run the application locally:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Start the application**
   ```bash
   npm run start
   ```

The application will be available at `http://localhost:3000`.

## ☁️ Vercel Deployment (Recommended)

Vercel is the recommended platform for deploying Next.js applications:

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

3. **Deploy from the command line** (if using Vercel CLI)
   ```bash
   vercel
   ```

   Or connect your GitHub repository in the Vercel dashboard for automatic deployments.

4. **Configure environment variables** in the Vercel dashboard under Project Settings > Environment Variables.

   Recommended variables (copy from `.env.example`):

   | Name | Environment | Example |
   |------|-------------|---------|
   | MONGODB_URI | All | mongodb+srv://... |
   | NEXTAUTH_URL | Production | https://your-domain.com |
   | NEXTAUTH_URL | Preview | https://\${VERCEL_URL} |
   | NEXTAUTH_SECRET | All | use a secure random string |
   | OPENAI_API_KEY | All | sk-... |
   | TWILIO_ACCOUNT_SID | All/Optional | AC... |
   | TWILIO_AUTH_TOKEN | All/Optional | ... |
   | TWILIO_PHONE_NUMBER | All/Optional | +1... |
   | NEXT_PUBLIC_BASE_URL | Production | https://your-domain.com |

   Notes:
   - Set NEXTAUTH_URL per environment (Production: your domain, Preview: https://\${VERCEL_URL})
   - Ensure MONGODB_URI allows connections from Vercel IPs (Atlas allows all by default if 0.0.0.0/0)

5. **Set up MongoDB integration** in the Vercel dashboard.

6. **Configure deployment settings**
   - Node.js: 18.x or higher
   - Enable Edge/Serverless default (no custom server needed)
   - Add your custom domain(s) and set primary domain

7. **Set up preview deployments** (optional)
   - In your Vercel project settings, configure preview deployments for branches
   - This allows testing changes before merging to production

## 🐳 Docker Deployment

You can also deploy using Docker:

1. **Create a Dockerfile** in the project root:
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   WORKDIR /app
   
   # Copy package files
   COPY package.json package-lock.json* ./
   
   # Install dependencies
   RUN npm ci
   
   # Build the application
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   
   # Set environment variables
   ENV NEXT_TELEMETRY_DISABLED 1
   
   # Build application
   RUN npm run build
   
   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1
   
   # Create a non-root user
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   # Set the correct permissions
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   
   EXPOSE 3000
   
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. **Create a docker-compose.yml file** for easier deployment:
   ```yaml
   version: '3'
   
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       env_file:
         - .env.local
       restart: always
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   ```

3. **Build and run** the Docker container:
   ```bash
   docker-compose up -d
   ```

## 🌩️ AWS Deployment

To deploy on AWS, you can use AWS Amplify, Elastic Beanstalk, or EC2:

### AWS Amplify

1. **Connect your repository** to AWS Amplify.
2. **Configure environment variables** in the Amplify console.
3. **Deploy your application** using the Amplify build settings:

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```

### AWS Elastic Beanstalk

1. **Package your application**:
   ```bash
   zip -r deployment.zip . -x "node_modules/*" ".git/*" ".next/*"
   ```

2. **Create an Elastic Beanstalk environment** with the Node.js platform.

3. **Upload your deployment package** to the Elastic Beanstalk environment.

4. **Configure environment variables** in the Elastic Beanstalk console.

## 🔌 Production Considerations

### Performance Optimization

1. **Enable caching** for static assets and API responses where appropriate.
2. **Configure Content Delivery Network (CDN)** for improved global performance.
3. **Implement database indexing** for frequently queried fields.

### Monitoring

1. **Set up logging** with a service like Datadog, New Relic, or AWS CloudWatch.
2. **Configure alerts** for unusual patterns or errors.
3. **Implement health checks** to monitor the application status.

### Security

1. **Enable HTTPS** for all traffic.
2. **Set up Web Application Firewall (WAF)** to protect against common attacks.
3. **Implement rate limiting** for API endpoints to prevent abuse.
4. **Regular security audits** and dependency updates.
5. **Follow the security guidelines** in the [security.md](./security.md) document.

### Scaling

1. **Configure auto-scaling** based on traffic patterns.
2. **Optimize database queries** for high load.
3. **Implement server-side caching** for expensive operations.

## 🌐 Internationalization

1. **Verify all supported languages** are properly configured.
2. **Test the application** in each supported locale.
3. **Ensure all translations** are complete and accurate.

## 🔄 CI/CD Pipeline (GitHub Actions)

Here's a sample GitHub Actions workflow for continuous integration and deployment:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📋 Post-Deployment Checklist

- [ ] Verify all environment variables are correctly configured
- [ ] Check all API endpoints are functioning correctly
- [ ] Test authentication flows (register, login, logout)
- [ ] Verify internationalization is working for all supported languages
- [ ] Test the symptom checker functionality
- [ ] Verify video consultation features
- [ ] Test SMS functionality if configured
- [ ] Check admin and provider dashboards
- [ ] Verify database connections and data persistence
- [ ] Perform basic security checks (HTTPS, authentication, etc.)
- [ ] Monitor application logs for any errors or warnings

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify MongoDB connection string is correct
   - Check network connectivity and firewall settings
   - Verify IP allowlist in MongoDB Atlas

2. **Authentication Problems**
   - Check NEXTAUTH_URL and NEXTAUTH_SECRET environment variables
   - Verify callback URLs are correctly configured

3. **API Integration Issues**
   - Validate API keys for OpenAI and Twilio
   - Check API request/response logs for errors

4. **Socket.io Connection Problems**
   - Verify WebSocket connections are allowed in your hosting environment
   - Check for CORS issues in the browser console

### Getting Help

If you encounter issues not covered in this guide, please:
1. Check the [GitHub repository issues](https://github.com/yourusername/ai-healthcare/issues)
2. Review the developer documentation
3. Contact the development team through the appropriate channels
   ```

2. **Build the Docker image**
   ```bash
   docker build -t ai-healthcare .
   ```

3. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env.local ai-healthcare
   ```

## 🚀 Railway Deployment

Railway is a platform that makes it easy to deploy full-stack applications:

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Install Railway CLI** (optional)
   ```bash
   npm install -g @railway/cli
   ```

3. **Login to Railway** (if using CLI)
   ```bash
   railway login
   ```

4. **Initialize your project** (if using CLI)
   ```bash
   railway init
   ```

5. **Add a MongoDB database** from the Railway dashboard

6. **Configure environment variables** in the Railway dashboard

7. **Deploy your application**
   ```bash
   railway up
   ```

## 🌐 Custom Server Deployment

For deployment on a custom server (e.g., AWS EC2, DigitalOcean Droplet):

1. **Set up a server** with Node.js 18+ installed

2. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-healthcare.git
   cd ai-healthcare
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create the .env.local file** with your production environment variables

5. **Build the application**
   ```bash
   npm run build
   ```

6. **Set up a process manager** like PM2
   ```bash
   npm install -g pm2
   pm2 start npm --name "ai-healthcare" -- start
   ```

7. **Set up Nginx** as a reverse proxy
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

8. **Set up SSL** using Let's Encrypt

## 🔄 Continuous Integration/Deployment

### GitHub Actions

Create a file at `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚨 Common Deployment Issues

### MongoDB Connection Issues

- Ensure your IP address is whitelisted in MongoDB Atlas
- Check that your connection string is correctly formatted
- Verify that the database user has the correct permissions

### Authentication Problems

- Make sure `NEXTAUTH_URL` matches your actual deployment URL
- Ensure `NEXTAUTH_SECRET` is set properly
- Check that the authentication provider configurations are correct

### Socket.IO Issues

- Verify that your proxy (if using one) supports WebSocket connections
- Ensure proper CORS configuration for WebSocket connections
- Check that the Socket.IO client and server versions are compatible

### OpenAI API Issues

- Verify that your API key is valid and has sufficient credits
- Check usage limits and rate limiting
- Ensure proper error handling for API failures

## 🌡️ Health Monitoring

Once deployed, set up monitoring for your application:

1. **Set up uptime monitoring** with services like UptimeRobot or Pingdom
2. **Configure error tracking** with Sentry or LogRocket
3. **Set up performance monitoring** with New Relic or Datadog
4. **Implement logging** with a service like Logtail or Papertrail

## 🔐 Security Considerations

1. **Enable HTTPS** for all traffic
2. **Set secure headers** including CSP, HSTS, and XSS Protection
3. **Implement rate limiting** to prevent abuse
4. **Regular security updates** for all dependencies
5. **Secure database access** with proper authentication and network rules

## 🎛️ Scaling Considerations

As your user base grows, consider:

1. **Database scaling** - Implement MongoDB sharding or replica sets
2. **Horizontal scaling** - Deploy multiple instances behind a load balancer
3. **Content Delivery Network** - Use a CDN for static assets
4. **Caching strategies** - Implement Redis for session storage and caching
5. **Microservices architecture** - Split high-demand features into separate services

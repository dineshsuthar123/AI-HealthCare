# 👨‍💻 AI-HealthCare Developer Guide

This guide provides detailed information for developers working on the AI-HealthCare platform.

## 📚 Tech Stack Overview

AI-HealthCare is built on the following technologies:

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI components
- **State Management**: React Context API, React Hooks
- **API**: Next.js App Router API Routes
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: OpenAI API
- **Real-time Communication**: Socket.IO, WebRTC (Simple Peer)
- **SMS Integration**: Twilio API
- **Internationalization**: next-intl
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel (recommended)

## 🚀 Getting Started

### Setting Up Your Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-healthcare.git
   cd ai-healthcare
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the project root with the following variables:
   
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/ai-healthcare
   
   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-development-secret-key
   
   # OpenAI
   OPENAI_API_KEY=your-openai-api-key
   
   # Twilio (Optional)
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
ai-healthcare/
├── src/                        # Source code
│   ├── app/                    # Next.js 15 App Router
│   │   ├── [locale]/           # Internationalized routes
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── layout.tsx      # Root layout for localized routes
│   │   │   ├── dashboard/      # Patient dashboard
│   │   │   ├── provider/       # Provider dashboard
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── auth/           # Authentication pages
│   │   │   ├── consultations/  # Consultations pages
│   │   │   ├── symptom-checker/# Symptom checker
│   │   │   └── sms-support/    # SMS support page
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication API
│   │   │   ├── consultations/  # Consultations API
│   │   │   ├── symptom-check/  # Symptom checker API
│   │   │   ├── sms/            # SMS API
│   │   │   ├── socket/         # Socket.IO API
│   │   │   ├── provider/       # Provider API
│   │   │   └── admin/          # Admin API
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # UI components
│   │   ├── layout/             # Layout components
│   │   ├── providers/          # Context providers
│   │   └── consultations/      # Consultation components
│   ├── lib/                    # Utility libraries
│   │   ├── ai/                 # AI service integrations
│   │   ├── sms/                # SMS service integrations
│   │   ├── socket/             # Socket.IO server
│   │   ├── auth.ts             # Authentication configuration
│   │   ├── mongodb.ts          # Database connection
│   │   └── utils.ts            # Utility functions
│   ├── models/                 # Database models
│   ├── types/                  # TypeScript type definitions
│   ├── i18n.ts                 # i18n configuration
│   ├── middleware.ts           # Next.js middleware
│   └── navigation.ts           # Navigation configuration
├── messages/                   # Translation files
├── public/                     # Static assets
├── __tests__/                  # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
├── docs/                       # Documentation
├── .env.local.example          # Example environment variables
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── next.config.ts              # Next.js configuration
└── jest.config.js              # Jest configuration
```

## 🧩 Core Components

### Authentication System

Authentication is managed by NextAuth.js with MongoDB adapter:

- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/app/api/auth/register/route.ts` - Custom registration API

### User Roles and Authorization

The platform supports three user roles:

1. **Patient** - Regular users who can use symptom checker, book consultations
2. **Provider** - Healthcare providers who can conduct consultations
3. **Admin** - System administrators with full access

Role-based access control is implemented in:
- `src/models/User.ts` - User model with role field
- `src/lib/auth.ts` - Session management with user role
- `src/middleware.ts` - Route protection based on user role

### Internationalization

The application supports multiple languages using next-intl:

- `src/i18n.ts` - i18n configuration
- `src/middleware.ts` - Locale handling in middleware
- `messages/` - Translation files for each supported language

To add a new language:
1. Create a new translation file in `messages/`
2. Add the locale to the supported locales in `src/i18n.ts`
3. Add the locale to the middleware matcher in `src/middleware.ts`

### AI Symptom Checker

The symptom checker uses OpenAI's API:

- `src/lib/ai/symptom-analyzer.ts` - AI integration for symptom analysis
- `src/app/api/symptom-check/route.ts` - API endpoint for symptom checking
- `src/app/[locale]/symptom-checker/page.tsx` - Frontend interface

### Telemedicine System

Video consultations are implemented using WebRTC and Socket.IO:

- `src/lib/socket/socket-server.ts` - Socket.IO server setup
- `src/app/api/socket/route.ts` - Socket.IO API endpoint
- `src/components/consultations/video-call.tsx` - WebRTC video call component
- `src/app/[locale]/consultations/room/[id]/page.tsx` - Consultation room page

### SMS Integration

SMS functionality is provided through Twilio:

- `src/lib/sms/twilio.ts` - Twilio integration
- `src/app/api/sms/route.ts` - SMS API endpoint
- `src/app/[locale]/sms-support/page.tsx` - SMS support interface

## 🧪 Testing Strategy

### Unit Testing

Unit tests focus on testing individual components and functions in isolation:

- UI components (Button, Card, Input, etc.)
- Utility functions
- Model validations

Run unit tests with:
```bash
npm run test:unit
```

### Integration Testing

Integration tests verify that different parts of the application work together:

- API endpoints
- Database interactions
- Authentication flows

Run integration tests with:
```bash
npm run test:integration
```

### End-to-End Testing

E2E tests simulate real user journeys through the application:

- User registration and login
- Symptom checking flow
- Consultation booking and joining

Run E2E tests with:
```bash
npm run test:e2e
```

## 🚀 Development Workflow

### Feature Development Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement the feature** following coding standards

3. **Write tests** for your implementation

4. **Run tests locally**
   ```bash
   npm test
   ```

5. **Submit a pull request** for review

### Code Style and Standards

- Follow the TypeScript style guide
- Use functional components with hooks
- Implement proper error handling
- Write meaningful comments for complex logic
- Ensure accessibility compliance (WCAG 2.1)
- Test all internationalized content

### Performance Considerations

- Implement proper data fetching strategies (SSR, ISR, CSR)
- Optimize images and assets
- Implement code splitting and lazy loading
- Use memoization for expensive computations
- Monitor and optimize database queries

## 🔧 Common Development Tasks

### Adding a New API Endpoint

1. Create a new file in `src/app/api/your-feature/route.ts`
2. Implement the handler functions (GET, POST, etc.)
3. Add proper error handling and validation
4. Document the API in `docs/api.md`
5. Write tests for the endpoint

### Creating a New Page

1. Create a new directory in `src/app/[locale]/your-page/`
2. Add a `page.tsx` file with your page component
3. Update navigation links if needed
4. Add translations for all supported languages
5. Ensure the page is responsive and accessible

### Adding a New Component

1. Create a new file in the appropriate components directory
2. Implement the component with proper TypeScript typing
3. Ensure the component is accessible and responsive
4. Write unit tests for the component
5. Document the component usage

### Implementing a New Model

1. Create a new file in `src/models/`
2. Define the schema with proper validation
3. Create TypeScript interfaces in `src/types/`
4. Implement model methods if needed
5. Write tests for model validation and methods

## 🐛 Debugging and Troubleshooting

### Common Issues

#### MongoDB Connection Problems

- Check your connection string in `.env.local`
- Ensure MongoDB is running if using a local instance
- Verify network connectivity to MongoDB Atlas

#### Authentication Issues

- Check NextAuth configuration in `src/lib/auth.ts`
- Verify session callback is correctly handling user data
- Check environment variables for NextAuth

#### WebRTC/Socket.IO Problems

- Ensure WebRTC is supported in the browser
- Check Socket.IO connection in browser console
- Verify CORS configuration for Socket.IO

### Debugging Tools

- Use React DevTools for component debugging
- Use the browser's Network tab for API requests
- Check server logs for backend issues
- Use `console.log` or `debugger` statements strategically

## 📚 API Documentation

Refer to the complete [API Documentation](./api.md) for details on all available endpoints.

## 🚀 Deployment Process

Refer to the [Deployment Guide](./deployment.md) for detailed deployment instructions.

# Copilot Instructions for AI-Powered Digital Health Platform

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an AI-powered digital health platform designed to serve underserved communities. The platform provides healthcare triage, symptom checking, multilingual support, SMS integration, telemedicine services, and data analytics.

## Technology Stack
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, App Router
- **Backend**: Next.js API routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**: OpenAI GPT models, TensorFlow.js for client-side inference
- **Authentication**: NextAuth.js
- **SMS Integration**: Twilio API
- **Internationalization**: next-intl for multilingual support
- **Charts/Analytics**: Chart.js or Recharts
- **Styling**: Tailwind CSS with custom components

## Code Guidelines
1. Use TypeScript strictly with proper type definitions
2. Follow Next.js 15 App Router conventions
3. Implement responsive design with mobile-first approach
4. Use server components where possible for better performance
5. Implement proper error handling and loading states
6. Follow accessibility best practices (WCAG 2.1)
7. Use semantic HTML and proper ARIA labels
8. Implement proper SEO with metadata API

## AI/Health Features
- Symptom checker with risk assessment
- Multilingual chatbot support
- Health information triage
- Emergency alert system
- Telemedicine appointment scheduling
- Health analytics dashboard
- SMS-based health support

## Security & Privacy
- Implement HIPAA-compliant data handling
- Use encryption for sensitive health data
- Implement proper authentication and authorization
- Follow GDPR compliance for international users
- Secure API endpoints with rate limiting

## Performance
- Optimize for low-bandwidth scenarios
- Implement proper caching strategies
- Use image optimization and lazy loading
- Minimize bundle size for better mobile experience
- Implement PWA features for offline functionality

## Testing
- Write unit tests for critical health logic
- Implement integration tests for API endpoints
- Test multilingual functionality thoroughly
- Test SMS integration end-to-end
- Validate AI model responses for accuracy

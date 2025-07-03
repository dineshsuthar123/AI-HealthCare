import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from './mongodb';
import { User } from '@/models/User';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

if (process.env.MONGODB_URI) {
  client = new MongoClient(process.env.MONGODB_URI);
  clientPromise = client.connect().catch(err => {
    console.warn('MongoDB connection failed:', err.message);
    // Return a mock promise that resolves to a client that won't work
    // This prevents the app from crashing during development
    return client!;
  });
} else {
  console.warn('MONGODB_URI is not defined in environment variables.');
  // Create a mock client to prevent unhandled promise rejections
  client = new MongoClient('mongodb://localhost:27017/mock-db');
  clientPromise = Promise.resolve(client);
}

export const authOptions: NextAuthOptions = {
  adapter: process.env.MONGODB_URI ? (MongoDBAdapter(clientPromise) as import('next-auth/adapters').Adapter) : undefined, // Type assertion to fix compatibility issues
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        type UserType = {
          role: string;
          isVerified: boolean;
        };
        const typedUser = user as UserType;
        token.role = typedUser.role;
        token.isVerified = typedUser.isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.isVerified = token.isVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

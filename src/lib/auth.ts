import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { Adapter } from 'next-auth/adapters';
import { MongoClient } from 'mongodb';
import connectDB from './mongodb';
import User from '../models/User';
import { getServerSession } from 'next-auth';

// Extend the standard next-auth types
declare module "next-auth" {
    interface Session {
        user: {
            id?: string;
            name?: string;
            email?: string;
            image?: string;
            role?: string;
        }
    }

    interface User {
        id: string;
        name: string | null;
        email: string;
        role: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string | null;
    }
}

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();
export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise) as Adapter,
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

                await connectDB();
                // Use a type assertion to help TypeScript understand the model
                const user = await User.findOne({ email: credentials.email }).exec();

                if (!user || !user.password) {
                    return null;
                }

                // Use import with async import() to avoid the require() lint error
                const bcryptModule = await import('bcryptjs');
                const isPasswordValid = await bcryptModule.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
                session.user.role = token.role || undefined;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
};

export async function getSession() {
    return await getServerSession(authOptions);
}
import mongoose from 'mongoose';

// Define proper types for the cached mongoose connection
interface CachedConnection {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Mongoose> | null;
}

// Define the global type
declare global {
    var mongoose: { conn: mongoose.Connection | null; promise: Promise<mongoose.Mongoose> | null } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    );
}

// Initialize cached connection
const cached: CachedConnection = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
    global.mongoose = cached;
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectDB;
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

const MONGODB_URI = process.env.MONGODB_URI;

async function dbConnect() {
  try {
    if (mongoose.connections[0].readyState) {
      return mongoose.connections[0];
    }

    await mongoose.connect(MONGODB_URI);
    return mongoose.connections[0];
  } catch (error) {
    throw error;
  }
}

export default dbConnect; 

import { NextAuthOptions } from "next-auth";
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/dbConnect';
import User from '@/app/api/models/User';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET as string,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        walletAddress: { label: "Wallet Address", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email && !credentials?.walletAddress) {
          throw new Error('Please provide either email/password or wallet address');
        }

        await dbConnect();

        let user;
        if (credentials.walletAddress) {
          // Handle wallet-based authentication
          user = await User.findOne({ walletAddress: credentials.walletAddress });
          if (!user) {
            throw new Error('No user found with this wallet address');
          }
        } else {
          // Handle email/password authentication
          user = await User.findOne({ email: credentials.email });
          if (!user || !user.password) {
            throw new Error('No user found with this email');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.profileImage,
          walletAddress: user.walletAddress
        };
      }
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/signup',
    error: '/signup',
  },
};


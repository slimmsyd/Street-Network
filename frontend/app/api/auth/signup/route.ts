import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/app/api/models/User';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    // Add debug logging to trace the connection
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI?.substring(0, 20) + '...' // Log partial URI for safety
    });

    await dbConnect();
    const body = await request.json();
    const { email, name, password, walletAddress } = body;
    
    // Validate that at least one authentication method is provided
    if (!email && !walletAddress) {
      return NextResponse.json({ 
        success: false, 
        message: 'Either email or wallet address is required' 
      }, { status: 400 });
    }

    // Check if user already exists with either email or wallet
    const existingUser = await User.findOne({
      $or: [
        { email: email || null },
        { walletAddress: walletAddress || null }
      ]
    });

    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'User already exists' 
      }, { status: 400 });
    }

    // Hash password if provided
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create new user
    const user = await User.create({
      email: email || null,
      walletAddress: walletAddress || null,
      name: name || null,
      password: hashedPassword,
      familyRole: 'pending', // This will be updated in the role selection step
    });
    
    console.log("User created:", user);

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        familyRole: user.familyRole
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to create user' 
    }, { status: 500 });
  }
} 
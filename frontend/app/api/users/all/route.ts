import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/app/api/models/User';

export async function GET() {
  try {
    console.log('Starting /api/users/all fetch...');
    await connectToDatabase();
    console.log('Database connected successfully');
    
    // Fetch all users with their family connections populated
    const users = await User.find({})
      .populate({
        path: 'familyConnections.relatedUserId',
        model: 'User',
        select: 'name email profileImage familyRole'
      })
      .select('name email profileImage familyRole familyConnections gender occupation location birthDay maritalStatus bio');

    console.log('Users query completed. Number of users found:', users?.length || 0);
    console.log('First user sample:', users?.[0] ? JSON.stringify(users[0], null, 2) : 'No users');

    if (!users) {
      console.log('No users found in database');
      return NextResponse.json({
        success: false,
        error: 'No users found'
      }, { status: 404 });
    }

    const mappedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      familyRole: user.familyRole,
      gender: user.gender,
      occupation: user.occupation,
      location: user.location,
      birthDay: user.birthDay,
      maritalStatus: user.maritalStatus,
      bio: user.bio,
      familyConnections: user.familyConnections
    }));

    console.log('Successfully mapped users. Number of mapped users:', mappedUsers.length);
    console.log('First mapped user sample:', JSON.stringify(mappedUsers[0], null, 2));

    return NextResponse.json({
      success: true,
      users: mappedUsers
    });
  } catch (error) {
    console.error('Detailed error in /api/users/all:', {
      error: error instanceof Error ? error.message : 'Server Error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    }, { status: 500 });
  }
} 
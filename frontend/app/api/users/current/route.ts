import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/app/api/models/User';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // TODO: Replace this with actual session-based authentication
    // For now, using hardcoded email for development
    const email = req.nextUrl.searchParams.get('email');
    
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        occupation: user.occupation,
        phoneNumber: user.phoneNumber,
        birthDay: user.birthDay,
        maritalStatus: user.maritalStatus,
        location: user.location,
        bio: user.bio,
        interests: user.interests,
        milestones: user.milestones,
        familyRole: user.familyRole,
        contributions: user.contributions,
        workspaces: user.workspaces,
        primaryWorkspaceId: user.primaryWorkspaceId
      }
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 
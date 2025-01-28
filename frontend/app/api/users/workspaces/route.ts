import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/app/api/models/User';
import Workspace from '@/app/api/models/Workspace';
import { NextRequest } from 'next/server';
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // For now, using hardcoded email. Later this should use session/auth
    const email = req.nextUrl.searchParams.get('email');

    console.log("loggin the email", email);
    const user = await User.findOne({ email: email })
      .populate({
        path: 'workspaces.workspaceId',
        model: Workspace,
        select: 'name'
      });
      console.log("loggin the user", user);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workspaces: user.workspaces,
      primaryWorkspaceId: user.primaryWorkspaceId
    });
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 
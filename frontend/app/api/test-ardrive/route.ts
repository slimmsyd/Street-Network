import { NextResponse } from 'next/server';
import { runUploadTest } from '../../../lib/ardriveUtils';

export async function GET() {
  try {
    const result = await runUploadTest();
    return NextResponse.json({
      success: true,
      message: 'ArDrive upload test completed successfully',
      result
    });
  } catch (error) {
    console.error('ArDrive test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    }, { status: 500 });
  }
} 
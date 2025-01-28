import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';
import { uploadMilestoneToArDrive } from '../../../../lib/ardriveUtils';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import Arweave from 'arweave';
import { MongoClient, ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

interface UpdateQuery {
  name?: any;
  occupation?: any;
  email?: any;
  phoneNumber?: any;
  birthDay?: any;
  maritalStatus?: any;
  location?: any;
  bio?: any;
  familyRole?: any;
  interests?: any;
  contributions?: any;
  settings?: any;
  profileImage?: any;
  milestones?: Array<{
    _id: string;
    date: string;
    title: string;
    description: string;
  }>;
}

interface Milestone {
  date: string;
  title: string;
  description: string;
  _id?: string;
  arweave_tx_id?: string;  // Optional since it might not exist for new milestones
}

// Initialize MongoDB client
const client = new MongoClient(process.env.MONGODB_URI!);

async function connectToDatabase() {
  if (!client.connect()) {
    await client.connect();
  }
  const db = client.db("lineage");
  return { db, client };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(params.id) });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const data = await request.json();

    // Remove any fields that are empty strings or null
    Object.keys(data).forEach(key => {
      if (data[key] === "" || data[key] === null) {
        delete data[key];
      }
    });

    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(params.id) },
        { $set: data }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch the updated user
    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 
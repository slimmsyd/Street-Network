const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '../.env' });

// Import the User model
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const createTestUser = async () => {
  try {
    // Create test user data
    const userData = {
      // General Section
      name: "Sydney Sanders",
      profileImage: "default.jpg",
      occupation: "Family Computer engineer",

      // Contact Information
      email: "sydney@example.com",
      phoneNumber: "44444444",

      // Personal Details
      birthDay: new Date('1990-01-01'),
      maritalStatus: "single",
      location: "Charleston, SC",

      // About Me
      bio: "I'm passionate about preserving our family's history and creating lasting memories together.",

      // Interests
      interests: [
        "Photography",
        "Genealogy",
        "Family Reunions",
        "Cooking",
        "Storytelling"
      ],

      // Family Milestones
      milestones: [
        {
          date: "2023",
          title: "Started Family Tree Project",
          description: "Initiated digital family archive"
        },
        {
          date: "2022",
          title: "Family Reunion Host",
          description: "Organized annual gathering"
        },
        {
          date: "2021",
          title: "Heritage Documentation",
          description: "Began collecting family stories"
        }
      ],

      // Family Role & Contributions
      familyRole: "Family Historian",
      contributions: [
        "Added 50+ family photos",
        "Documented 10 family stories",
        "Organized 3 family events"
      ],

      // System and Security
      password: "password123",
      role: "user",
      settings: {
        notifications: true,
        privacy: "family-only"
      }
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log('User already exists');
      return;
    }

    // Create new user
    const user = await User.create(userData);
    console.log('Test user created successfully:', user);

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

// Run the function
createTestUser(); 
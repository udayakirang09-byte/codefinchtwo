import { db } from "./db.js";
import { users, mentors, students, bookings, reviews, achievements, teacherQualifications, teacherSubjects, successStories, qualifications, specializations, subjects } from "../shared/schema.js";
import { inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

async function insertDropdownData() {
  console.log("🎓 Inserting master qualifications dropdown data...");
  await db.insert(qualifications).values([
    {
      name: "Bachelor of Science in Computer Science",
      description: "Undergraduate degree in Computer Science",
      category: "undergraduate", 
      displayOrder: 1,
      isActive: true
    },
    {
      name: "Bachelor of Engineering in Software Engineering",
      description: "Undergraduate degree in Software Engineering",
      category: "undergraduate",
      displayOrder: 2,
      isActive: true
    },
    {
      name: "Master of Science in Computer Science",
      description: "Graduate degree in Computer Science",
      category: "graduate",
      displayOrder: 3,
      isActive: true
    },
    {
      name: "Master of Engineering in Software Engineering", 
      description: "Graduate degree in Software Engineering",
      category: "graduate",
      displayOrder: 4,
      isActive: true
    },
    {
      name: "PhD in Computer Science",
      description: "Doctoral degree in Computer Science",
      category: "doctorate",
      displayOrder: 5,
      isActive: true
    },
    {
      name: "Associate Degree in Programming",
      description: "2-year programming degree",
      category: "associate",
      displayOrder: 6,
      isActive: true
    },
    {
      name: "Bootcamp Certificate",
      description: "Programming bootcamp completion certificate",
      category: "certificate",
      displayOrder: 7,
      isActive: true
    },
    {
      name: "Self-Taught",
      description: "Self-taught programming experience",
      category: "experience",
      displayOrder: 8,
      isActive: true
    }
  ]).onConflictDoNothing();

  console.log("🎯 Inserting specializations dropdown data...");
  await db.insert(specializations).values([
    {
      name: "Frontend Development",
      description: "User interface and client-side development",
      category: "web",
      displayOrder: 1,
      isActive: true
    },
    {
      name: "Backend Development", 
      description: "Server-side and database development",
      category: "web",
      displayOrder: 2,
      isActive: true
    },
    {
      name: "Full Stack Development",
      description: "Both frontend and backend development",
      category: "web",
      displayOrder: 3,
      isActive: true
    },
    {
      name: "Mobile App Development",
      description: "iOS and Android app development",
      category: "mobile",
      displayOrder: 4,
      isActive: true
    },
    {
      name: "Data Science",
      description: "Data analysis and machine learning",
      category: "data",
      displayOrder: 5,
      isActive: true
    },
    {
      name: "DevOps",
      description: "Development operations and infrastructure",
      category: "infrastructure",
      displayOrder: 6,
      isActive: true
    },
    {
      name: "Game Development",
      description: "Video game programming",
      category: "games",
      displayOrder: 7,
      isActive: true
    },
    {
      name: "Cybersecurity",
      description: "Security and ethical hacking",
      category: "security",
      displayOrder: 8,
      isActive: true
    },
    {
      name: "AI/Machine Learning",
      description: "Artificial Intelligence and ML development",
      category: "ai",
      displayOrder: 9,
      isActive: true
    }
  ]).onConflictDoNothing();

  console.log("📚 Inserting subjects dropdown data...");
  await db.insert(subjects).values([
    {
      name: "JavaScript",
      description: "Modern JavaScript programming language",
      category: "programming-language",
      displayOrder: 1,
      isActive: true
    },
    {
      name: "Python",
      description: "Python programming language",
      category: "programming-language", 
      displayOrder: 2,
      isActive: true
    },
    {
      name: "React",
      description: "React frontend framework",
      category: "framework",
      displayOrder: 3,
      isActive: true
    },
    {
      name: "Node.js",
      description: "Node.js backend runtime",
      category: "framework",
      displayOrder: 4,
      isActive: true
    },
    {
      name: "Java",
      description: "Java programming language",
      category: "programming-language",
      displayOrder: 5,
      isActive: true
    },
    {
      name: "C++",
      description: "C++ programming language",
      category: "programming-language",
      displayOrder: 6,
      isActive: true
    },
    {
      name: "HTML/CSS",
      description: "Web markup and styling",
      category: "web-basics",
      displayOrder: 7,
      isActive: true
    },
    {
      name: "TypeScript",
      description: "TypeScript programming language",
      category: "programming-language",
      displayOrder: 8,
      isActive: true
    },
    {
      name: "Vue.js",
      description: "Vue.js frontend framework",
      category: "framework",
      displayOrder: 9,
      isActive: true
    },
    {
      name: "Angular",
      description: "Angular frontend framework",
      category: "framework",
      displayOrder: 10,
      isActive: true
    },
    {
      name: "Express.js",
      description: "Express.js web framework",
      category: "framework",
      displayOrder: 11,
      isActive: true
    },
    {
      name: "Django",
      description: "Django Python web framework",
      category: "framework",
      displayOrder: 12,
      isActive: true
    },
    {
      name: "Flask",
      description: "Flask Python microframework",
      category: "framework",
      displayOrder: 13,
      isActive: true
    },
    {
      name: "Spring Boot",
      description: "Spring Boot Java framework",
      category: "framework",
      displayOrder: 14,
      isActive: true
    },
    {
      name: "SQL",
      description: "Database query language",
      category: "database",
      displayOrder: 15,
      isActive: true
    },
    {
      name: "MongoDB",
      description: "NoSQL database",
      category: "database",
      displayOrder: 16,
      isActive: true
    },
    {
      name: "Git",
      description: "Version control system",
      category: "tools",
      displayOrder: 17,
      isActive: true
    },
    {
      name: "AWS",
      description: "Amazon Web Services cloud platform",
      category: "cloud",
      displayOrder: 18,
      isActive: true
    }
  ]).onConflictDoNothing();
}

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Hash the default password for all accounts
    const defaultPassword = "Hello111";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    console.log("🔐 Generated password hash for all accounts");

    // Check if specific test accounts already exist to avoid duplicates
    const testAccounts = await db.select().from(users).where(
      inArray(users.email, ['teacher@codeconnect.com', 'udayakirang99@gmail.com', 'admin@codeconnect.com', 'testteacher@apptest.com', 'teststudent@apptest.com'])
    );
    
    if (testAccounts.length === 5) {
      console.log("✅ All test accounts already exist, skipping user data seed");
      console.log("🔐 Found test accounts:", testAccounts.map((u: any) => `${u.email} (${u.role})`));
      
      // Still insert dropdown data if missing
      await insertDropdownData();
      return;
    } else if (testAccounts.length > 0) {
      console.log(`⚠️ Only ${testAccounts.length}/5 test accounts exist, will create missing accounts`);
      console.log("🔐 Existing test accounts:", testAccounts.map((u: any) => `${u.email} (${u.role})`));
    } else {
      console.log("📝 No test accounts found, creating all production data");
    }

    // Create complete production dataset (21 users total)
    console.log("📝 Creating complete production dataset...");
    const existingEmails = new Set(testAccounts.map((u: any) => u.email));
    
    const usersToInsert = [
      // Core test accounts
      {
        id: randomUUID(),
        email: "teacher@codeconnect.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Smith",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "udayakirang99@gmail.com", 
        password: hashedPassword,
        firstName: "Udaya",
        lastName: "Kiran",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "admin@codeconnect.com",
        password: hashedPassword, 
        firstName: "Admin",
        lastName: "User",
        role: "admin"
      },
      // Replit test accounts
      {
        id: randomUUID(),
        email: "testteacher@apptest.com",
        password: hashedPassword,
        firstName: "test",
        lastName: "teacher",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "teststudent@apptest.com",
        password: hashedPassword,
        firstName: "test",
        lastName: "student",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      // Additional mentors (4 more to reach 5 total)
      {
        id: randomUUID(),
        email: "sarah.chen@codeconnect.com",
        password: hashedPassword,
        firstName: "Sarah",
        lastName: "Chen",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "mike.johnson@codeconnect.com",
        password: hashedPassword,
        firstName: "Mike",
        lastName: "Johnson",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "elena.rodriguez@codeconnect.com",
        password: hashedPassword,
        firstName: "Elena",
        lastName: "Rodriguez",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "david.kim@codeconnect.com",
        password: hashedPassword,
        firstName: "David",
        lastName: "Kim",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      // Additional students (4 more to reach 5 total)
      {
        id: randomUUID(),
        email: "emma.wilson@gmail.com",
        password: hashedPassword,
        firstName: "Emma",
        lastName: "Wilson",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "alex.taylor@gmail.com",
        password: hashedPassword,
        firstName: "Alex",
        lastName: "Taylor",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "maya.patel@gmail.com",
        password: hashedPassword,
        firstName: "Maya",
        lastName: "Patel",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "lucas.brown@gmail.com",
        password: hashedPassword,
        firstName: "Lucas",
        lastName: "Brown",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
      },
      // Additional users for complete dataset (8 more to reach 19 total)
      {
        id: randomUUID(),
        email: "sophia.garcia@codeconnect.com",
        password: hashedPassword,
        firstName: "Sophia",
        lastName: "Garcia",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "ethan.davis@gmail.com",
        password: hashedPassword,
        firstName: "Ethan",
        lastName: "Davis",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "olivia.martinez@gmail.com",
        password: hashedPassword,
        firstName: "Olivia",
        lastName: "Martinez",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "liam.anderson@gmail.com",
        password: hashedPassword,
        firstName: "Liam",
        lastName: "Anderson",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "ava.thomas@gmail.com",
        password: hashedPassword,
        firstName: "Ava",
        lastName: "Thomas",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "noah.jackson@gmail.com",
        password: hashedPassword,
        firstName: "Noah",
        lastName: "Jackson",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "isabella.white@gmail.com",
        password: hashedPassword,
        firstName: "Isabella",
        lastName: "White",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "mason.harris@gmail.com",
        password: hashedPassword,
        firstName: "Mason",
        lastName: "Harris",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "mia.clark@gmail.com",
        password: hashedPassword,
        firstName: "Mia",
        lastName: "Clark",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face"
      }
    ].filter(user => !existingEmails.has(user.email));

    let insertedUsers = [];
    if (usersToInsert.length > 0) {
      console.log("📝 Creating missing accounts:", usersToInsert.map((u: any) => u.email));
      insertedUsers = await db.insert(users).values(usersToInsert).returning();
    } else {
      console.log("📝 No new users to create");
    }
    
    // Combine existing and newly inserted users
    const allUsers = [...testAccounts, ...insertedUsers];
    console.log(`📊 Total users created: ${allUsers.length}`);

    // Find mentor users (should be 5 total)
    const mentorUsers = allUsers.filter((u: any) => u.role === "mentor");
    const studentUsers = allUsers.filter((u: any) => u.role === "student");
    
    console.log(`🔍 Found ${mentorUsers.length} mentors and ${studentUsers.length} students`);

    if (mentorUsers.length < 5 || studentUsers.length < 5) {
      throw new Error(`Insufficient users: need 5 mentors (got ${mentorUsers.length}) and 5 students (got ${studentUsers.length})`);
    }

    // Insert all 5 mentors
    console.log("👨‍🏫 Inserting 5 mentors...");
    const mentorData = [
      {
        id: randomUUID(),
        userId: mentorUsers[0].id, // teacher@codeconnect.com
        title: "Senior JavaScript Developer & Mentor",
        description: "Experienced software developer with 8+ years in the industry. Specializes in JavaScript, React, and Node.js. Passionate about teaching programming fundamentals and helping students build real-world projects.",
        specialties: ["JavaScript", "React", "Node.js", "Web Development", "Programming Fundamentals"],
        experience: 8,
        hourlyRate: "45.00",
        availableSlots: [
          { day: "Monday", times: ["09:00", "14:00"] },
          { day: "Wednesday", times: ["10:00"] },
          { day: "Friday", times: ["15:00"] }
        ]
      },
      {
        id: randomUUID(),
        userId: mentorUsers[1].id, // sarah.chen@codeconnect.com
        title: "Frontend React Specialist",
        description: "React expert with 6 years of experience in building modern web applications. Specializes in component architecture, state management, and performance optimization.",
        specialties: ["React", "TypeScript", "Redux", "CSS-in-JS", "Testing"],
        experience: 6,
        hourlyRate: "40.00",
        availableSlots: [
          { day: "Tuesday", times: ["10:00", "15:00"] },
          { day: "Thursday", times: ["09:00"] },
          { day: "Saturday", times: ["11:00"] }
        ]
      },
      {
        id: randomUUID(),
        userId: mentorUsers[2].id, // mike.johnson@codeconnect.com
        title: "Full-Stack Python Developer",
        description: "Full-stack developer with expertise in Python, Django, and modern JavaScript frameworks. Passionate about teaching clean code principles and software architecture.",
        specialties: ["Python", "Django", "PostgreSQL", "Docker", "API Design"],
        experience: 7,
        hourlyRate: "50.00",
        availableSlots: [
          { day: "Monday", times: ["11:00"] },
          { day: "Wednesday", times: ["14:00", "16:00"] },
          { day: "Friday", times: ["09:00"] }
        ]
      },
      {
        id: randomUUID(),
        userId: mentorUsers[3].id, // elena.rodriguez@codeconnect.com
        title: "Mobile App Development Expert",
        description: "Mobile development specialist with experience in React Native and Flutter. Helps students build cross-platform mobile applications from scratch.",
        specialties: ["React Native", "Flutter", "Mobile UX", "API Integration", "App Store Deployment"],
        experience: 5,
        hourlyRate: "42.00",
        availableSlots: [
          { day: "Tuesday", times: ["13:00"] },
          { day: "Thursday", times: ["10:00", "15:00"] },
          { day: "Sunday", times: ["14:00"] }
        ]
      },
      {
        id: randomUUID(),
        userId: mentorUsers[4].id, // david.kim@codeconnect.com
        title: "Data Science & AI Mentor",
        description: "Data scientist with 9 years of experience in machine learning and AI. Teaches practical data science skills and helps students build AI-powered applications.",
        specialties: ["Python", "Machine Learning", "Data Analysis", "TensorFlow", "Jupyter"],
        experience: 9,
        hourlyRate: "55.00",
        availableSlots: [
          { day: "Wednesday", times: ["09:00"] },
          { day: "Friday", times: ["11:00", "16:00"] },
          { day: "Saturday", times: ["10:00"] }
        ]
      }
    ];

    const insertedMentors = await db.insert(mentors).values(mentorData).returning();

    // Insert all 5 students
    console.log("👨‍🎓 Inserting 5 students...");
    const studentData = [
      {
        id: randomUUID(),
        userId: studentUsers[0].id, // udayakirang99@gmail.com
        age: 16,
        interests: ["JavaScript", "Web Development", "Game Development"],
        skillLevel: "beginner",
        parentEmail: "parent@example.com"
      },
      {
        id: randomUUID(),
        userId: studentUsers[1].id, // emma.wilson@gmail.com
        age: 15,
        interests: ["React", "Frontend Design", "UI/UX"],
        skillLevel: "beginner",
        parentEmail: "parent.wilson@gmail.com"
      },
      {
        id: randomUUID(),
        userId: studentUsers[2].id, // alex.taylor@gmail.com
        age: 17,
        interests: ["Python", "Data Science", "Machine Learning"],
        skillLevel: "intermediate",
        parentEmail: "parent.taylor@gmail.com"
      },
      {
        id: randomUUID(),
        userId: studentUsers[3].id, // maya.patel@gmail.com
        age: 16,
        interests: ["Mobile Development", "React Native", "App Design"],
        skillLevel: "beginner",
        parentEmail: "parent.patel@gmail.com"
      },
      {
        id: randomUUID(),
        userId: studentUsers[4].id, // lucas.brown@gmail.com
        age: 18,
        interests: ["Full Stack", "Node.js", "Database Design"],
        skillLevel: "intermediate",
        parentEmail: "parent.brown@gmail.com"
      }
    ];

    const insertedStudents = await db.insert(students).values(studentData).returning();

    const mentor = insertedMentors[0];
    const student = insertedStudents[0];

    // Insert bookings
    console.log("📅 Inserting bookings...");
    const insertedBookings = await db.insert(bookings).values([
      {
        id: randomUUID(),
        studentId: student.id,
        mentorId: mentor.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 60,
        status: "scheduled",
        notes: "Introduction to JavaScript fundamentals"
      },
      {
        id: randomUUID(),
        studentId: student.id,
        mentorId: mentor.id,
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 1000), // Last week
        duration: 60,
        status: "completed",
        notes: "Completed lesson on variables and functions"
      }
    ]).returning();

    // Insert review
    console.log("⭐ Inserting reviews...");
    await db.insert(reviews).values([
      {
        id: randomUUID(),
        bookingId: insertedBookings[1].id, // For completed booking
        studentId: student.id,
        mentorId: mentor.id,
        rating: 5,
        comment: "Excellent teacher! Very patient and explains concepts clearly. I finally understand JavaScript fundamentals thanks to this session."
      }
    ]);

    // Insert achievements
    console.log("🏆 Inserting achievements...");
    await db.insert(achievements).values([
      {
        id: randomUUID(),
        studentId: student.id,
        title: "First Steps",
        description: "Completed your first coding lesson",
        badgeIcon: "🎯"
      },
      {
        id: randomUUID(),
        studentId: student.id,
        title: "JavaScript Basics",
        description: "Mastered JavaScript variables and functions",
        badgeIcon: "📚"
      }
    ]);

    // Insert teacher qualifications
    console.log("🎓 Inserting teacher qualifications...");
    await db.insert(teacherQualifications).values([
      {
        id: randomUUID(),
        mentorId: mentor.id,
        qualification: "Bachelor of Science in Computer Science",
        specialization: "Software Engineering",
        score: "First Class Honors",
        priority: 1
      },
      {
        id: randomUUID(),
        mentorId: mentor.id,
        qualification: "Certified JavaScript Developer",
        specialization: "Frontend Development", 
        score: "Professional Level",
        priority: 2
      }
    ]);

    // Insert teacher subjects
    console.log("📖 Inserting teacher subjects...");
    await db.insert(teacherSubjects).values([
      {
        id: randomUUID(),
        mentorId: mentor.id,
        subject: "JavaScript Programming",
        experience: "5 years",
        priority: 1
      },
      {
        id: randomUUID(),
        mentorId: mentor.id,
        subject: "React Development",
        experience: "4 years", 
        priority: 2
      },
      {
        id: randomUUID(),
        mentorId: mentor.id,
        subject: "Node.js Backend",
        experience: "3 years",
        priority: 3
      }
    ]);

    // Insert success stories
    console.log("🌟 Inserting success stories...");
    await db.insert(successStories).values([
      {
        id: randomUUID(),
        studentName: "Sarah M.",
        mentorName: "teacher@codeconnect.com",
        studentAge: 16,
        programmingLanguage: "JavaScript",
        achievementTitle: "Built First Web Application",
        story: "After struggling with programming concepts for months, I finally found my breakthrough with CodeConnect. My mentor was incredibly patient and helped me understand JavaScript fundamentals step by step. Now I am confident in building my own web applications and even started a personal project!",
        imageUrl: "/images/stories/sarah-success.jpg",
        featured: true
      },
      {
        id: randomUUID(),
        studentName: "Alex K.",
        mentorName: "teacher@codeconnect.com",
        studentAge: 17,
        programmingLanguage: "React",
        achievementTitle: "Created Interactive Portfolio",
        story: "The personalized mentoring approach at CodeConnect made all the difference in my learning journey. I went from knowing basic HTML to building complex React applications. My mentor helped me create an interactive portfolio that got me noticed by several tech companies.",
        imageUrl: "/images/stories/alex-success.jpg",
        featured: true
      }
    ]);

    // Insert master dropdown data for teacher signup form
    console.log("🎓 Inserting master qualifications dropdown data...");
    await db.insert(qualifications).values([
      {
        name: "Bachelor of Science in Computer Science",
        description: "Undergraduate degree in Computer Science",
        category: "undergraduate", 
        displayOrder: 1,
        isActive: true
      },
      {
        name: "Bachelor of Engineering in Software Engineering",
        description: "Undergraduate degree in Software Engineering",
        category: "undergraduate",
        displayOrder: 2,
        isActive: true
      },
      {
        name: "Master of Science in Computer Science",
        description: "Graduate degree in Computer Science",
        category: "graduate",
        displayOrder: 3,
        isActive: true
      },
      {
        name: "Master of Engineering in Software Engineering", 
        description: "Graduate degree in Software Engineering",
        category: "graduate",
        displayOrder: 4,
        isActive: true
      },
      {
        name: "PhD in Computer Science",
        description: "Doctoral degree in Computer Science",
        category: "doctorate",
        displayOrder: 5,
        isActive: true
      },
      {
        name: "Associate Degree in Programming",
        description: "2-year programming degree",
        category: "associate",
        displayOrder: 6,
        isActive: true
      },
      {
        name: "Bootcamp Certificate",
        description: "Programming bootcamp completion certificate",
        category: "certificate",
        displayOrder: 7,
        isActive: true
      },
      {
        name: "Self-Taught",
        description: "Self-taught programming experience",
        category: "experience",
        displayOrder: 8,
        isActive: true
      }
    ]).onConflictDoNothing();

    console.log("🎯 Inserting specializations dropdown data...");
    await db.insert(specializations).values([
      {
        name: "Frontend Development",
        description: "User interface and client-side development",
        category: "web",
        displayOrder: 1,
        isActive: true
      },
      {
        name: "Backend Development", 
        description: "Server-side and database development",
        category: "web",
        displayOrder: 2,
        isActive: true
      },
      {
        name: "Full Stack Development",
        description: "Both frontend and backend development",
        category: "web",
        displayOrder: 3,
        isActive: true
      },
      {
        name: "Mobile App Development",
        description: "iOS and Android app development",
        category: "mobile",
        displayOrder: 4,
        isActive: true
      },
      {
        name: "Data Science",
        description: "Data analysis and machine learning",
        category: "data",
        displayOrder: 5,
        isActive: true
      },
      {
        name: "DevOps",
        description: "Development operations and infrastructure",
        category: "infrastructure",
        displayOrder: 6,
        isActive: true
      },
      {
        name: "Game Development",
        description: "Video game programming",
        category: "games",
        displayOrder: 7,
        isActive: true
      },
      {
        name: "Cybersecurity",
        description: "Security and ethical hacking",
        category: "security",
        displayOrder: 8,
        isActive: true
      },
      {
        name: "AI/Machine Learning",
        description: "Artificial Intelligence and ML development",
        category: "ai",
        displayOrder: 9,
        isActive: true
      }
    ]).onConflictDoNothing();

    console.log("📚 Inserting subjects dropdown data...");
    await db.insert(subjects).values([
      {
        name: "JavaScript",
        description: "Modern JavaScript programming language",
        category: "programming-language",
        displayOrder: 1,
        isActive: true
      },
      {
        name: "Python",
        description: "Python programming language",
        category: "programming-language", 
        displayOrder: 2,
        isActive: true
      },
      {
        name: "React",
        description: "React frontend framework",
        category: "framework",
        displayOrder: 3,
        isActive: true
      },
      {
        name: "Node.js",
        description: "Node.js backend runtime",
        category: "framework",
        displayOrder: 4,
        isActive: true
      },
      {
        name: "Java",
        description: "Java programming language",
        category: "programming-language",
        displayOrder: 5,
        isActive: true
      },
      {
        name: "C++",
        description: "C++ programming language",
        category: "programming-language",
        displayOrder: 6,
        isActive: true
      },
      {
        name: "HTML/CSS",
        description: "Web markup and styling",
        category: "web-basics",
        displayOrder: 7,
        isActive: true
      },
      {
        name: "TypeScript",
        description: "TypeScript programming language",
        category: "programming-language",
        displayOrder: 8,
        isActive: true
      },
      {
        name: "Vue.js",
        description: "Vue.js frontend framework",
        category: "framework",
        displayOrder: 9,
        isActive: true
      },
      {
        name: "Angular",
        description: "Angular frontend framework",
        category: "framework",
        displayOrder: 10,
        isActive: true
      },
      {
        name: "Express.js",
        description: "Express.js web framework",
        category: "framework",
        displayOrder: 11,
        isActive: true
      },
      {
        name: "Django",
        description: "Django Python web framework",
        category: "framework",
        displayOrder: 12,
        isActive: true
      },
      {
        name: "Flask",
        description: "Flask Python microframework",
        category: "framework",
        displayOrder: 13,
        isActive: true
      },
      {
        name: "Spring Boot",
        description: "Spring Boot Java framework",
        category: "framework",
        displayOrder: 14,
        isActive: true
      },
      {
        name: "SQL",
        description: "Database query language",
        category: "database",
        displayOrder: 15,
        isActive: true
      },
      {
        name: "MongoDB",
        description: "NoSQL database",
        category: "database",
        displayOrder: 16,
        isActive: true
      },
      {
        name: "Git",
        description: "Version control system",
        category: "tools",
        displayOrder: 17,
        isActive: true
      },
      {
        name: "AWS",
        description: "Amazon Web Services cloud platform",
        category: "cloud",
        displayOrder: 18,
        isActive: true
      }
    ]).onConflictDoNothing();

    console.log("✅ Database seeding completed successfully!");
    console.log("📊 Production dataset created:");
    console.log("   - 21 users total");
    console.log("   - 7 mentors with specialties");
    console.log("   - 6 students with interests");
    console.log("   - Complete relational data");
    console.log("🔐 Test accounts available:");
    console.log("   - teacher@codeconnect.com / Hello111 (mentor)");
    console.log("   - testteacher@apptest.com / Hello111 (mentor - Replit sync)");
    console.log("   - udayakirang99@gmail.com / Hello111 (student)");
    console.log("   - teststudent@apptest.com / Hello111 (student - Replit sync)");
    console.log("   - admin@codeconnect.com / Hello111 (admin)");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seeding process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding process failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
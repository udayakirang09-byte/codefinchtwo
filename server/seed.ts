import { db } from "./db.js";
import { users, mentors, students, bookings, reviews, achievements, teacherQualifications, teacherSubjects, successStories } from "../shared/schema.js";
import { inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Check if specific test accounts already exist to avoid duplicates
    const testAccounts = await db.select().from(users).where(
      inArray(users.email, ['teacher@codeconnect.com', 'udayakirang99@gmail.com', 'admin@codeconnect.com'])
    );
    
    if (testAccounts.length === 3) {
      console.log("✅ All test accounts already exist, skipping seed");
      console.log("🔐 Found test accounts:", testAccounts.map((u: any) => `${u.email} (${u.role})`));
      return;
    } else if (testAccounts.length > 0) {
      console.log(`⚠️ Only ${testAccounts.length}/3 test accounts exist, will create missing accounts`);
      console.log("🔐 Existing test accounts:", testAccounts.map((u: any) => `${u.email} (${u.role})`));
    } else {
      console.log("📝 No test accounts found, creating all production data");
    }

    // Create complete production dataset (19 users total)
    console.log("📝 Creating complete production dataset...");
    const existingEmails = new Set(testAccounts.map((u: any) => u.email));
    
    const usersToInsert = [
      // Core test accounts
      {
        id: randomUUID(),
        email: "teacher@codeconnect.com",
        password: "Hello111",
        firstName: "John",
        lastName: "Smith",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "udayakirang99@gmail.com", 
        password: "Hello111",
        firstName: "Udaya",
        lastName: "Kiran",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "admin@codeconnect.com",
        password: "Hello111", 
        firstName: "Admin",
        lastName: "User",
        role: "admin"
      },
      // Additional mentors (4 more to reach 5 total)
      {
        id: randomUUID(),
        email: "sarah.chen@codeconnect.com",
        password: "Hello111",
        firstName: "Sarah",
        lastName: "Chen",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "mike.johnson@codeconnect.com",
        password: "Hello111",
        firstName: "Mike",
        lastName: "Johnson",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "elena.rodriguez@codeconnect.com",
        password: "Hello111",
        firstName: "Elena",
        lastName: "Rodriguez",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "david.kim@codeconnect.com",
        password: "Hello111",
        firstName: "David",
        lastName: "Kim",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      // Additional students (4 more to reach 5 total)
      {
        id: randomUUID(),
        email: "emma.wilson@gmail.com",
        password: "Hello111",
        firstName: "Emma",
        lastName: "Wilson",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "alex.taylor@gmail.com",
        password: "Hello111",
        firstName: "Alex",
        lastName: "Taylor",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "maya.patel@gmail.com",
        password: "Hello111",
        firstName: "Maya",
        lastName: "Patel",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "lucas.brown@gmail.com",
        password: "Hello111",
        firstName: "Lucas",
        lastName: "Brown",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
      },
      // Additional users for complete dataset (8 more to reach 19 total)
      {
        id: randomUUID(),
        email: "sophia.garcia@codeconnect.com",
        password: "Hello111",
        firstName: "Sophia",
        lastName: "Garcia",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "ethan.davis@gmail.com",
        password: "Hello111",
        firstName: "Ethan",
        lastName: "Davis",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "olivia.martinez@gmail.com",
        password: "Hello111",
        firstName: "Olivia",
        lastName: "Martinez",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "liam.anderson@gmail.com",
        password: "Hello111",
        firstName: "Liam",
        lastName: "Anderson",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "ava.thomas@gmail.com",
        password: "Hello111",
        firstName: "Ava",
        lastName: "Thomas",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "noah.jackson@gmail.com",
        password: "Hello111",
        firstName: "Noah",
        lastName: "Jackson",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "isabella.white@gmail.com",
        password: "Hello111",
        firstName: "Isabella",
        lastName: "White",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "mason.harris@gmail.com",
        password: "Hello111",
        firstName: "Mason",
        lastName: "Harris",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      {
        id: randomUUID(),
        email: "mia.clark@gmail.com",
        password: "Hello111",
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

    console.log("✅ Database seeding completed successfully!");
    console.log("📊 Production dataset created:");
    console.log("   - 19 users total");
    console.log("   - 5 mentors with specialties");
    console.log("   - 5 students with interests");
    console.log("   - Complete relational data");
    console.log("🔐 Test accounts available:");
    console.log("   - teacher@codeconnect.com / Hello111 (mentor)");
    console.log("   - udayakirang99@gmail.com / Hello111 (student)");
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
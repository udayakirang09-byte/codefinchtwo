import { db } from "./db.js";
import { users, mentors, students, bookings, reviews, achievements, teacherQualifications, teacherSubjects, successStories } from "../shared/schema.js";
import { inArray } from "drizzle-orm";

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

    // Insert only missing users
    console.log("📝 Inserting missing users...");
    const existingEmails = new Set(testAccounts.map((u: any) => u.email));
    
    const usersToInsert = [
      {
        email: "teacher@codeconnect.com",
        password: "Hello111",
        firstName: "John",
        lastName: "Smith",
        role: "mentor",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        email: "udayakirang99@gmail.com", 
        password: "Hello111",
        firstName: "Udaya",
        lastName: "Kiran",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      {
        email: "admin@codeconnect.com",
        password: "Hello111", 
        firstName: "Admin",
        lastName: "User",
        role: "admin"
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

    const teacherUser = allUsers.find((u: any) => u.email === "teacher@codeconnect.com");
    const studentUser = allUsers.find((u: any) => u.email === "udayakirang99@gmail.com");

    if (!teacherUser || !studentUser) {
      throw new Error("Failed to create required users");
    }

    // Insert mentor
    console.log("👨‍🏫 Inserting mentor...");
    const insertedMentors = await db.insert(mentors).values([
      {
        userId: teacherUser.id,
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
      }
    ]).returning();

    // Insert student
    console.log("👨‍🎓 Inserting student...");
    const insertedStudents = await db.insert(students).values([
      {
        userId: studentUser.id,
        age: 16,
        interests: ["JavaScript", "Web Development", "Game Development"],
        skillLevel: "beginner",
        parentEmail: "parent@example.com"
      }
    ]).returning();

    const mentor = insertedMentors[0];
    const student = insertedStudents[0];

    // Insert bookings
    console.log("📅 Inserting bookings...");
    const insertedBookings = await db.insert(bookings).values([
      {
        studentId: student.id,
        mentorId: mentor.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 60,
        status: "scheduled",
        notes: "Introduction to JavaScript fundamentals"
      },
      {
        studentId: student.id,
        mentorId: mentor.id,
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        duration: 60,
        status: "completed",
        notes: "Completed lesson on variables and functions"
      }
    ]).returning();

    // Insert review
    console.log("⭐ Inserting reviews...");
    await db.insert(reviews).values([
      {
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
        studentId: student.id,
        title: "First Steps",
        description: "Completed your first coding lesson",
        badgeIcon: "🎯"
      },
      {
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
        mentorId: mentor.id,
        qualification: "Bachelor of Science in Computer Science",
        specialization: "Software Engineering",
        score: "First Class Honors",
        priority: 1
      },
      {
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
        mentorId: mentor.id,
        subject: "JavaScript Programming",
        experience: "5 years",
        priority: 1
      },
      {
        mentorId: mentor.id,
        subject: "React Development",
        experience: "4 years", 
        priority: 2
      },
      {
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
    console.log("🔐 Test accounts created:");
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
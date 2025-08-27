import { storage } from "../server/storage";

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create sample users
    const users = [];
    
    // Create teachers
    for (let i = 1; i <= 6; i++) {
      const user = await storage.createUser({
        email: `teacher${i}@codeconnect.com`,
        firstName: ["Sarah", "Mike", "Emma", "Jake", "Lisa", "Alex"][i-1],
        lastName: ["Johnson", "Chen", "Davis", "Wilson", "Brown", "Garcia"][i-1],
        role: "mentor",
        profileImageUrl: null,
      });
      users.push(user);
    }

    // Create students
    for (let i = 1; i <= 3; i++) {
      const user = await storage.createUser({
        email: `student${i}@example.com`,
        firstName: ["Alex", "Maya", "Liam"][i-1],
        lastName: ["Blue", "Johnson", "Smith"][i-1],
        role: "student",
        profileImageUrl: null,
      });
      users.push(user);
    }

    // Create mentors
    const mentorData = [
      {
        userId: users[0].id,
        title: "Python & AI Specialist",
        description: "I'm passionate about teaching kids the fundamentals of Python programming and introducing them to the exciting world of artificial intelligence. With 5 years of experience, I make complex concepts fun and easy to understand.",
        specialties: ["Python", "AI/ML", "Data Science"],
        experience: 5,
        hourlyRate: "45.00",
        isActive: true,
        availableSlots: [
          { day: "Monday", times: ["16:00", "17:00", "18:00"] },
          { day: "Wednesday", times: ["16:00", "17:00", "18:00"] },
          { day: "Saturday", times: ["10:00", "11:00", "14:00"] }
        ]
      },
      {
        userId: users[1].id,
        title: "Web Development Mentor",
        description: "I help kids build their first websites using HTML, CSS, and JavaScript. My teaching style focuses on hands-on projects that students can proudly share with friends and family.",
        specialties: ["JavaScript", "HTML/CSS", "Web Design"],
        experience: 4,
        hourlyRate: "40.00",
        isActive: true,
        availableSlots: [
          { day: "Tuesday", times: ["15:00", "16:00", "17:00"] },
          { day: "Thursday", times: ["15:00", "16:00", "17:00"] },
          { day: "Sunday", times: ["10:00", "11:00", "12:00"] }
        ]
      },
      {
        userId: users[2].id,
        title: "Scratch Programming Expert",
        description: "I specialize in teaching young beginners how to code using Scratch. Through interactive games and animations, students learn programming concepts in a fun, visual way.",
        specialties: ["Scratch", "Block Programming", "Game Development"],
        experience: 6,
        hourlyRate: "35.00",
        isActive: true,
        availableSlots: [
          { day: "Monday", times: ["15:00", "16:00"] },
          { day: "Wednesday", times: ["15:00", "16:00"] },
          { day: "Friday", times: ["15:00", "16:00", "17:00"] }
        ]
      },
      {
        userId: users[3].id,
        title: "Full-Stack Developer",
        description: "I teach comprehensive web development, from frontend design to backend development. Perfect for teens ready to build real applications and understand how the web works.",
        specialties: ["JavaScript", "React", "Node.js", "Databases"],
        experience: 7,
        hourlyRate: "55.00",
        isActive: true,
        availableSlots: [
          { day: "Tuesday", times: ["17:00", "18:00", "19:00"] },
          { day: "Thursday", times: ["17:00", "18:00", "19:00"] },
          { day: "Saturday", times: ["14:00", "15:00", "16:00"] }
        ]
      },
      {
        userId: users[4].id,
        title: "Mobile App Development",
        description: "I guide students through creating their first mobile apps. We cover app design principles and basic programming concepts using beginner-friendly tools and languages.",
        specialties: ["App Development", "UI/UX Design", "Swift"],
        experience: 4,
        hourlyRate: "50.00",
        isActive: true,
        availableSlots: [
          { day: "Wednesday", times: ["16:00", "17:00"] },
          { day: "Friday", times: ["16:00", "17:00", "18:00"] },
          { day: "Sunday", times: ["13:00", "14:00", "15:00"] }
        ]
      },
      {
        userId: users[5].id,
        title: "Game Development Specialist",
        description: "I teach kids how to create their own video games using various platforms and programming languages. Students learn both the technical and creative aspects of game development.",
        specialties: ["Game Development", "Unity", "C#", "Python"],
        experience: 5,
        hourlyRate: "48.00",
        isActive: true,
        availableSlots: [
          { day: "Monday", times: ["17:00", "18:00"] },
          { day: "Tuesday", times: ["17:00", "18:00"] },
          { day: "Saturday", times: ["11:00", "12:00", "13:00"] }
        ]
      }
    ];

    const mentors = [];
    for (const data of mentorData) {
      const mentor = await storage.createMentor(data);
      mentors.push(mentor);
    }

    // Create students
    const studentUsers = users.slice(6);
    const students = [];
    
    for (let i = 0; i < studentUsers.length; i++) {
      const student = await storage.createStudent({
        userId: studentUsers[i].id,
        age: [12, 10, 14][i],
        interests: [["Python", "AI"], ["Games", "Scratch"], ["Web Development", "JavaScript"]][i],
        skillLevel: ["intermediate", "beginner", "intermediate"][i],
        parentEmail: [`parent${i+1}@example.com`][0] || `parent${i+1}@example.com`
      });
      students.push(student);
    }

    // Create some sample bookings
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(16, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(15, 0, 0, 0);

    const bookingData = [
      {
        studentId: students[0].id,
        mentorId: mentors[0].id,
        scheduledAt: tomorrow,
        duration: 60,
        notes: "First Python lesson, excited to learn!"
      },
      {
        studentId: students[1].id,
        mentorId: mentors[2].id,
        scheduledAt: nextWeek,
        duration: 60,
        notes: "Want to create my first game in Scratch"
      }
    ];

    const createdBookings = [];
    for (const booking of bookingData) {
      const createdBooking = await storage.createBooking(booking);
      createdBookings.push(createdBooking);
    }

    // Create some sample reviews using actual booking IDs
    if (createdBookings.length > 0) {
      await storage.createReview({
        bookingId: createdBookings[0].id,
        studentId: students[0].id,
        mentorId: mentors[0].id,
        rating: 5,
        comment: "Sarah is an amazing teacher! She made Python so easy to understand."
      });

      if (createdBookings.length > 1) {
        await storage.createReview({
          bookingId: createdBookings[1].id,
          studentId: students[1].id,
          mentorId: mentors[2].id,
          rating: 5,
          comment: "Emma helped me create my first game! It was so much fun."
        });
      }
    }

    console.log("Database seeding completed successfully!");
    console.log(`Created ${users.length} users, ${mentors.length} mentors, ${students.length} students`);
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase();
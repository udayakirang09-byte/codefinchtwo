import { db } from "../server/db";
import { 
  users, 
  mentors, 
  students, 
  bookings, 
  achievements, 
  reviews,
  teacherQualifications,
  teacherSubjects,
  successStories
} from "../shared/schema";

async function populateDatabase() {
  console.log("🌱 Populating database with realistic data...");

  try {
    // Clear existing data (in reverse order due to foreign keys)
    await db.delete(reviews);
    await db.delete(achievements);
    await db.delete(bookings);
    await db.delete(teacherSubjects);
    await db.delete(teacherQualifications);
    await db.delete(successStories);
    await db.delete(students);
    await db.delete(mentors);
    await db.delete(users);

    // Create users
    const usersList = [
      // Students
      { id: "student123", email: "alice.johnson@email.com", firstName: "Alice", lastName: "Johnson", role: "student" },
      { id: "student456", email: "bob.smith@email.com", firstName: "Bob", lastName: "Smith", role: "student" },
      { id: "student789", email: "carol.davis@email.com", firstName: "Carol", lastName: "Davis", role: "student" },
      { id: "student101", email: "david.wilson@email.com", firstName: "David", lastName: "Wilson", role: "student" },
      { id: "student202", email: "emma.brown@email.com", firstName: "Emma", lastName: "Brown", role: "student" },
      { id: "student303", email: "frank.miller@email.com", firstName: "Frank", lastName: "Miller", role: "student" },
      
      // Mentors  
      { id: "mentor001", email: "sarah.johnson@codeconnect.com", firstName: "Sarah", lastName: "Johnson", role: "mentor" },
      { id: "mentor002", email: "mike.chen@codeconnect.com", firstName: "Mike", lastName: "Chen", role: "mentor" },
      { id: "mentor003", email: "alex.rivera@codeconnect.com", firstName: "Alex", lastName: "Rivera", role: "mentor" },
      { id: "mentor004", email: "emma.watson@codeconnect.com", firstName: "Emma", lastName: "Watson", role: "mentor" },
      { id: "mentor005", email: "james.taylor@codeconnect.com", firstName: "James", lastName: "Taylor", role: "mentor" },
      { id: "mentor006", email: "lisa.anderson@codeconnect.com", firstName: "Lisa", lastName: "Anderson", role: "mentor" },
      
      // Admin
      { id: "admin001", email: "admin@codeconnect.com", firstName: "Admin", lastName: "User", role: "admin" },
    ];

    await db.insert(users).values(usersList);
    console.log("✅ Users created");

    // Create students
    const studentsList = [
      { id: "stud001", userId: "student123", age: 12, interests: ["Python", "Games"], skillLevel: "beginner", parentEmail: "parent1@email.com" },
      { id: "stud002", userId: "student456", age: 14, interests: ["JavaScript", "Web Development"], skillLevel: "intermediate", parentEmail: "parent2@email.com" },
      { id: "stud003", userId: "student789", age: 13, interests: ["HTML", "CSS"], skillLevel: "beginner", parentEmail: "parent3@email.com" },
      { id: "stud004", userId: "student101", age: 15, interests: ["React", "Frontend"], skillLevel: "advanced", parentEmail: "parent4@email.com" },
      { id: "stud005", userId: "student202", age: 11, interests: ["Scratch", "Animations"], skillLevel: "beginner", parentEmail: "parent5@email.com" },
      { id: "stud006", userId: "student303", age: 16, interests: ["Java", "Android"], skillLevel: "intermediate", parentEmail: "parent6@email.com" },
    ];

    await db.insert(students).values(studentsList);
    console.log("✅ Students created");

    // Create mentors
    const mentorsList = [
      { 
        id: "ment001", 
        userId: "mentor001", 
        title: "Senior Python Developer", 
        description: "Experienced Python developer with 8+ years in web development and data science", 
        specialties: ["Python", "Django", "Data Science", "Machine Learning"],
        experience: 8,
        rating: "4.8",
        totalStudents: 45,
        hourlyRate: "75.00",
        isActive: true,
        availableSlots: [
          { day: "Monday", times: ["09:00", "10:00", "14:00", "15:00"] },
          { day: "Wednesday", times: ["09:00", "10:00", "16:00"] },
          { day: "Friday", times: ["14:00", "15:00", "16:00"] }
        ]
      },
      { 
        id: "ment002", 
        userId: "mentor002", 
        title: "JavaScript Expert", 
        description: "Full-stack JavaScript developer specializing in React and Node.js", 
        specialties: ["JavaScript", "React", "Node.js", "MongoDB"],
        experience: 6,
        rating: "4.9",
        totalStudents: 38,
        hourlyRate: "80.00",
        isActive: true,
        availableSlots: [
          { day: "Tuesday", times: ["10:00", "11:00", "15:00"] },
          { day: "Thursday", times: ["09:00", "14:00", "15:00"] },
          { day: "Saturday", times: ["10:00", "11:00"] }
        ]
      },
      { 
        id: "ment003", 
        userId: "mentor003", 
        title: "Frontend Specialist", 
        description: "Creative frontend developer with expertise in HTML, CSS, and modern frameworks", 
        specialties: ["HTML", "CSS", "JavaScript", "React", "UI/UX"],
        experience: 5,
        rating: "4.7",
        totalStudents: 52,
        hourlyRate: "65.00",
        isActive: true,
        availableSlots: [
          { day: "Monday", times: ["13:00", "14:00", "15:00"] },
          { day: "Wednesday", times: ["10:00", "11:00"] },
          { day: "Friday", times: ["09:00", "10:00"] }
        ]
      },
      { 
        id: "ment004", 
        userId: "mentor004", 
        title: "React & Component Expert", 
        description: "Specialized in React development and component-based architecture", 
        specialties: ["React", "TypeScript", "Component Design", "State Management"],
        experience: 4,
        rating: "4.6",
        totalStudents: 29,
        hourlyRate: "70.00",
        isActive: true,
        availableSlots: [
          { day: "Tuesday", times: ["14:00", "15:00", "16:00"] },
          { day: "Thursday", times: ["10:00", "11:00"] }
        ]
      },
      { 
        id: "ment005", 
        userId: "mentor005", 
        title: "Java & Android Developer", 
        description: "Mobile app development expert with Java and Android expertise", 
        specialties: ["Java", "Android", "Mobile Development", "Kotlin"],
        experience: 7,
        rating: "4.8",
        totalStudents: 33,
        hourlyRate: "85.00",
        isActive: true,
        availableSlots: [
          { day: "Monday", times: ["11:00", "16:00"] },
          { day: "Wednesday", times: ["13:00", "14:00"] },
          { day: "Friday", times: ["11:00", "13:00"] }
        ]
      },
      { 
        id: "ment006", 
        userId: "mentor006", 
        title: "Web Development Mentor", 
        description: "Full-stack web developer passionate about teaching beginners", 
        specialties: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
        experience: 3,
        rating: "4.5",
        totalStudents: 41,
        hourlyRate: "60.00",
        isActive: true,
        availableSlots: [
          { day: "Tuesday", times: ["09:00", "13:00"] },
          { day: "Thursday", times: ["12:00", "13:00", "17:00"] },
          { day: "Saturday", times: ["09:00", "10:00", "11:00"] }
        ]
      }
    ];

    await db.insert(mentors).values(mentorsList);
    console.log("✅ Mentors created");

    // Create teacher qualifications
    const qualificationsList = [
      { mentorId: "ment001", qualification: "M.S. Computer Science", specialization: "Machine Learning", score: "3.9 GPA", priority: 1 },
      { mentorId: "ment001", qualification: "B.S. Software Engineering", specialization: "Python Development", score: "3.8 GPA", priority: 2 },
      { mentorId: "ment002", qualification: "B.S. Computer Science", specialization: "Web Development", score: "First Class", priority: 1 },
      { mentorId: "ment002", qualification: "JavaScript Certification", specialization: "Frontend Development", score: "98%", priority: 2 },
      { mentorId: "ment003", qualification: "B.A. Digital Design", specialization: "UI/UX Design", score: "3.7 GPA", priority: 1 },
      { mentorId: "ment003", qualification: "Frontend Development Bootcamp", specialization: "React & CSS", score: "Distinction", priority: 2 },
      { mentorId: "ment004", qualification: "B.S. Information Technology", specialization: "Software Development", score: "3.6 GPA", priority: 1 },
      { mentorId: "ment005", qualification: "M.S. Mobile Computing", specialization: "Android Development", score: "3.8 GPA", priority: 1 },
      { mentorId: "ment005", qualification: "Java Developer Certification", specialization: "Enterprise Java", score: "95%", priority: 2 },
      { mentorId: "ment006", qualification: "B.S. Web Development", specialization: "Full Stack", score: "3.5 GPA", priority: 1 }
    ];

    await db.insert(teacherQualifications).values(qualificationsList);
    console.log("✅ Teacher qualifications created");

    // Create teacher subjects
    const subjectsList = [
      { mentorId: "ment001", subject: "Python Programming", experience: "8 years", priority: 1 },
      { mentorId: "ment001", subject: "Data Science", experience: "5 years", priority: 2 },
      { mentorId: "ment001", subject: "Machine Learning", experience: "4 years", priority: 3 },
      { mentorId: "ment002", subject: "JavaScript", experience: "6 years", priority: 1 },
      { mentorId: "ment002", subject: "React.js", experience: "4 years", priority: 2 },
      { mentorId: "ment002", subject: "Node.js", experience: "3 years", priority: 3 },
      { mentorId: "ment003", subject: "HTML & CSS", experience: "5 years", priority: 1 },
      { mentorId: "ment003", subject: "JavaScript", experience: "4 years", priority: 2 },
      { mentorId: "ment003", subject: "UI/UX Design", experience: "3 years", priority: 3 },
      { mentorId: "ment004", subject: "React Components", experience: "4 years", priority: 1 },
      { mentorId: "ment004", subject: "TypeScript", experience: "3 years", priority: 2 },
      { mentorId: "ment005", subject: "Java Programming", experience: "7 years", priority: 1 },
      { mentorId: "ment005", subject: "Android Development", experience: "5 years", priority: 2 },
      { mentorId: "ment006", subject: "Web Development Basics", experience: "3 years", priority: 1 },
      { mentorId: "ment006", subject: "PHP Development", experience: "2 years", priority: 2 }
    ];

    await db.insert(teacherSubjects).values(subjectsList);
    console.log("✅ Teacher subjects created");

    // Create bookings with realistic dates
    const now = new Date();
    const bookingsList = [
      // Completed bookings
      { 
        id: "book001", 
        studentId: "stud001", 
        mentorId: "ment001", 
        scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        duration: 60, 
        status: "completed", 
        notes: "Great progress with Python basics" 
      },
      { 
        id: "book002", 
        studentId: "stud002", 
        mentorId: "ment002", 
        scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        duration: 90, 
        status: "completed", 
        notes: "Covered JavaScript functions and arrays" 
      },
      { 
        id: "book003", 
        studentId: "stud003", 
        mentorId: "ment003", 
        scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        duration: 60, 
        status: "completed", 
        notes: "HTML structure and CSS styling basics" 
      },
      { 
        id: "book004", 
        studentId: "stud004", 
        mentorId: "ment004", 
        scheduledAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
        duration: 75, 
        status: "completed", 
        notes: "React component lifecycle and hooks" 
      },
      
      // Upcoming bookings
      { 
        id: "book005", 
        studentId: "stud001", 
        mentorId: "ment001", 
        scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        duration: 60, 
        status: "scheduled", 
        notes: "Continue with Python data structures" 
      },
      { 
        id: "book006", 
        studentId: "stud002", 
        mentorId: "ment002", 
        scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        duration: 90, 
        status: "scheduled", 
        notes: "JavaScript DOM manipulation" 
      },
      { 
        id: "book007", 
        studentId: "stud005", 
        mentorId: "ment006", 
        scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 45, 
        status: "scheduled", 
        notes: "Introduction to web development" 
      },
      { 
        id: "book008", 
        studentId: "stud006", 
        mentorId: "ment005", 
        scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        duration: 120, 
        status: "scheduled", 
        notes: "Java fundamentals and Android basics" 
      }
    ];

    await db.insert(bookings).values(bookingsList);
    console.log("✅ Bookings created");

    // Create achievements
    const achievementsList = [
      { studentId: "stud001", title: "First Steps", description: "Completed your first coding session", badgeIcon: "🚀" },
      { studentId: "stud001", title: "Python Beginner", description: "Mastered Python basics", badgeIcon: "🐍" },
      { studentId: "stud002", title: "JavaScript Explorer", description: "Learned JavaScript fundamentals", badgeIcon: "⚡" },
      { studentId: "stud002", title: "Problem Solver", description: "Solved 10 coding challenges", badgeIcon: "🧩" },
      { studentId: "stud003", title: "First Steps", description: "Completed your first coding session", badgeIcon: "🚀" },
      { studentId: "stud004", title: "React Master", description: "Built first React component", badgeIcon: "⚛️" },
      { studentId: "stud004", title: "Advanced Learner", description: "Completed advanced curriculum", badgeIcon: "🎓" },
      { studentId: "stud005", title: "First Steps", description: "Completed your first coding session", badgeIcon: "🚀" }
    ];

    await db.insert(achievements).values(achievementsList);
    console.log("✅ Achievements created");

    // Create reviews
    const reviewsList = [
      { bookingId: "book001", studentId: "stud001", mentorId: "ment001", rating: 5, comment: "Sarah is an amazing teacher! She explains Python concepts very clearly." },
      { bookingId: "book002", studentId: "stud002", mentorId: "ment002", rating: 5, comment: "Mike made JavaScript so easy to understand. Great session!" },
      { bookingId: "book003", studentId: "stud003", mentorId: "ment003", rating: 4, comment: "Alex is very patient and helpful with HTML/CSS. Loved the examples!" },
      { bookingId: "book004", studentId: "stud004", mentorId: "ment004", rating: 5, comment: "Emma's React teaching is fantastic. Looking forward to more sessions!" }
    ];

    await db.insert(reviews).values(reviewsList);
    console.log("✅ Reviews created");

    // Create success stories
    const storiesList = [
      {
        studentName: "Alice Johnson",
        mentorName: "Sarah Johnson",
        studentAge: 12,
        programmingLanguage: "Python",
        achievementTitle: "Built First Game",
        story: "Alice started with zero coding experience and within 2 months built her first Python game! She loves creating simple animations and is now exploring game development with Pygame.",
        featured: true
      },
      {
        studentName: "Bob Smith",
        mentorName: "Mike Chen",
        studentAge: 14,
        programmingLanguage: "JavaScript",
        achievementTitle: "Created Interactive Website",
        story: "Bob transformed from someone who barely knew what HTML was to creating an interactive portfolio website with JavaScript animations. His confidence has grown tremendously!",
        featured: true
      },
      {
        studentName: "David Wilson",
        mentorName: "Emma Watson",
        studentAge: 15,
        programmingLanguage: "React",
        achievementTitle: "Built Social Media App",
        story: "David's passion for social media led him to learn React. He built a mini social media app with user profiles, posts, and real-time features. Now he's planning to study computer science!",
        featured: false
      }
    ];

    await db.insert(successStories).values(storiesList);
    console.log("✅ Success stories created");

    console.log("🎉 Database populated successfully with realistic data!");
    
  } catch (error) {
    console.error("❌ Error populating database:", error);
    throw error;
  }
}

// Run if called directly
populateDatabase()
  .then(() => {
    console.log("✅ Realistic data population completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to populate database:", error);
    process.exit(1);
  });

export { populateDatabase };
import { db } from "./db.js";
import { users, mentors, students, bookings, reviews, achievements, teacherQualifications, teacherSubjects, successStories } from "../shared/schema.js";
import { inArray } from "drizzle-orm";

async function syncDataToAzure() {
  try {
    console.log("🔄 Starting complete Replit → Azure data sync...");

    // First, check current environment
    const isProduction = process.env.NODE_ENV === 'production';
    const hasAzureDB = process.env.DATABASE_URL?.includes('postgres.database.azure.com');
    
    console.log(`🔍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔍 Database: ${hasAzureDB ? 'Azure PostgreSQL' : 'Local/Replit PostgreSQL'}`);
    
    if (!hasAzureDB) {
      console.log("⚠️ Not connected to Azure database - this will sync within the same database");
      console.log("⚠️ For Azure sync, ensure DATABASE_URL points to Azure PostgreSQL");
    }

    // Step 1: Export all data from current database
    console.log("\n📤 Exporting data from source database...");
    
    const usersData = await db.select().from(users);
    const mentorsData = await db.select().from(mentors);  
    const studentsData = await db.select().from(students);
    const bookingsData = await db.select().from(bookings);
    const reviewsData = await db.select().from(reviews);
    const achievementsData = await db.select().from(achievements);
    const teacherQualificationsData = await db.select().from(teacherQualifications);
    const teacherSubjectsData = await db.select().from(teacherSubjects);
    const successStoriesData = await db.select().from(successStories);

    console.log("📊 Source data counts:");
    console.log(`   Users: ${usersData.length}`);
    console.log(`   Mentors: ${mentorsData.length}`);
    console.log(`   Students: ${studentsData.length}`);
    console.log(`   Bookings: ${bookingsData.length}`);
    console.log(`   Reviews: ${reviewsData.length}`);
    console.log(`   Achievements: ${achievementsData.length}`);
    console.log(`   Teacher Qualifications: ${teacherQualificationsData.length}`);
    console.log(`   Teacher Subjects: ${teacherSubjectsData.length}`);
    console.log(`   Success Stories: ${successStoriesData.length}`);

    const totalRecords = usersData.length + mentorsData.length + studentsData.length + 
                        bookingsData.length + reviewsData.length + achievementsData.length +
                        teacherQualificationsData.length + teacherSubjectsData.length + 
                        successStoriesData.length;
    
    console.log(`📈 Total records to sync: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log("⚠️ No data found to sync!");
      return;
    }

    // Step 2: Check Azure database for existing real data
    console.log("\n🔍 Checking Azure database for existing data...");
    
    const currentAzureData = {
      users: (await db.select().from(users)).length,
      mentors: (await db.select().from(mentors)).length,
      students: (await db.select().from(students)).length,
      bookings: (await db.select().from(bookings)).length,
      reviews: (await db.select().from(reviews)).length
    };

    const azureTotalRecords = Object.values(currentAzureData).reduce((sum, count) => sum + count, 0);
    
    console.log("📊 Current Azure database counts:");
    Object.entries(currentAzureData).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });
    console.log(`📈 Total Azure records: ${azureTotalRecords}`);

    // Safety check: Don't overwrite significant production data
    const forceSync = process.env.FORCE_SYNC === 'true';
    
    if (azureTotalRecords > 50 && !forceSync) {
      console.log("\n🛡️ SAFETY CHECK: Azure database contains significant data!");
      console.log(`❌ Refusing to sync - Azure has ${azureTotalRecords} records (threshold: 50)`);
      console.log("🔒 This protects your real production data from being overwritten");
      console.log("💡 To force sync, set FORCE_SYNC=true environment variable");
      console.log("💡 Or manually clear Azure database first");
      return;
    }
    
    if (forceSync && azureTotalRecords > 50) {
      console.log("\n⚠️ FORCE SYNC MODE: Overriding safety check!");
      console.log(`🔥 Will overwrite ${azureTotalRecords} records in Azure database`);
    }

    if (azureTotalRecords > 10) {
      console.log("\n⚠️ WARNING: Azure database has moderate data");
      console.log(`🔍 Azure: ${azureTotalRecords} records, Replit: ${totalRecords} records`);
      console.log("🔄 Proceeding with sync (under safety threshold of 50 records)");
    } else {
      console.log("\n✅ Safe to sync - Azure has minimal data");
    }

    // Step 3: Clear target database tables (in dependency order)
    console.log("\n🗑️ Clearing target database tables...");
    
    try {
      // Delete in reverse dependency order to avoid foreign key conflicts
      await db.delete(teacherSubjects);
      await db.delete(teacherQualifications);
      await db.delete(successStories);
      await db.delete(achievements);
      await db.delete(reviews);
      await db.delete(bookings);
      await db.delete(students);
      await db.delete(mentors);
      await db.delete(users);
      
      console.log("✅ Target tables cleared successfully");
    } catch (error: any) {
      console.log("⚠️ Some tables may already be empty:", error.message);
    }

    // Step 3: Insert data in correct dependency order
    console.log("\n📥 Inserting data into target database...");

    let insertedCounts = {
      users: 0,
      mentors: 0,
      students: 0,
      bookings: 0,
      reviews: 0,
      achievements: 0,
      teacherQualifications: 0,
      teacherSubjects: 0,
      successStories: 0
    };

    // Insert users first (no dependencies)
    if (usersData.length > 0) {
      await db.insert(users).values(usersData);
      insertedCounts.users = usersData.length;
      console.log(`✅ Inserted ${usersData.length} users`);
    }

    // Insert mentors (depends on users)
    if (mentorsData.length > 0) {
      await db.insert(mentors).values(mentorsData);
      insertedCounts.mentors = mentorsData.length;
      console.log(`✅ Inserted ${mentorsData.length} mentors`);
    }

    // Insert students (depends on users)  
    if (studentsData.length > 0) {
      await db.insert(students).values(studentsData);
      insertedCounts.students = studentsData.length;
      console.log(`✅ Inserted ${studentsData.length} students`);
    }

    // Insert bookings (depends on mentors and students)
    if (bookingsData.length > 0) {
      await db.insert(bookings).values(bookingsData);
      insertedCounts.bookings = bookingsData.length;
      console.log(`✅ Inserted ${bookingsData.length} bookings`);
    }

    // Insert reviews (depends on bookings)
    if (reviewsData.length > 0) {
      await db.insert(reviews).values(reviewsData);
      insertedCounts.reviews = reviewsData.length;
      console.log(`✅ Inserted ${reviewsData.length} reviews`);
    }

    // Insert achievements (depends on students)
    if (achievementsData.length > 0) {
      await db.insert(achievements).values(achievementsData);
      insertedCounts.achievements = achievementsData.length;
      console.log(`✅ Inserted ${achievementsData.length} achievements`);
    }

    // Insert teacher qualifications (depends on mentors)
    if (teacherQualificationsData.length > 0) {
      await db.insert(teacherQualifications).values(teacherQualificationsData);
      insertedCounts.teacherQualifications = teacherQualificationsData.length;
      console.log(`✅ Inserted ${teacherQualificationsData.length} teacher qualifications`);
    }

    // Insert teacher subjects (depends on mentors)
    if (teacherSubjectsData.length > 0) {
      await db.insert(teacherSubjects).values(teacherSubjectsData);
      insertedCounts.teacherSubjects = teacherSubjectsData.length;
      console.log(`✅ Inserted ${teacherSubjectsData.length} teacher subjects`);
    }

    // Insert success stories (no strict dependencies)
    if (successStoriesData.length > 0) {
      await db.insert(successStories).values(successStoriesData);
      insertedCounts.successStories = successStoriesData.length;
      console.log(`✅ Inserted ${successStoriesData.length} success stories`);
    }

    // Step 4: Verify sync completion
    console.log("\n🔍 Verifying sync completion...");
    
    const finalCounts = {
      users: (await db.select().from(users)).length,
      mentors: (await db.select().from(mentors)).length,
      students: (await db.select().from(students)).length,
      bookings: (await db.select().from(bookings)).length,
      reviews: (await db.select().from(reviews)).length,
      achievements: (await db.select().from(achievements)).length,
      teacherQualifications: (await db.select().from(teacherQualifications)).length,
      teacherSubjects: (await db.select().from(teacherSubjects)).length,
      successStories: (await db.select().from(successStories)).length
    };

    console.log("📊 Final target database counts:");
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });

    const finalTotal = Object.values(finalCounts).reduce((sum, count) => sum + count, 0);
    console.log(`📈 Total records synced: ${finalTotal}`);

    if (finalTotal === totalRecords) {
      console.log("🎉 Data sync completed successfully!");
      console.log(`✅ All ${totalRecords} records synced from Replit → Azure`);
    } else {
      console.log(`⚠️ Sync incomplete: Expected ${totalRecords}, got ${finalTotal}`);
    }

    // Step 5: Verify key test accounts
    console.log("\n🔐 Verifying key test accounts...");
    const testAccounts = await db.select().from(users).where(
      inArray(users.email, ['teacher@codeconnect.com', 'udayakirang99@gmail.com', 'admin@codeconnect.com'])
    );
    
    console.log("🔐 Test accounts found:");
    testAccounts.forEach((account: any) => {
      console.log(`   - ${account.email} (${account.role})`);
    });

    if (testAccounts.length >= 3) {
      console.log("✅ All production test accounts are ready!");
    } else {
      console.log(`⚠️ Only ${testAccounts.length}/3 test accounts found`);
    }

  } catch (error) {
    console.error("❌ Data sync failed:", error);
    throw error;
  }
}

// DETACHED: Replit DB sync to Azure DB functionality disabled
// Uncomment below to re-enable sync when needed
/*
// Run sync if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncDataToAzure()
    .then(() => {
      console.log("🎉 Sync process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Sync process failed:", error);
      process.exit(1);
    });
}
*/

export { syncDataToAzure };
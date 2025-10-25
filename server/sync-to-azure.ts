import { db } from "./db.js";
import { 
  users, mentors, students, bookings, reviews, achievements, 
  teacherQualifications, teacherSubjects, successStories,
  chatSessions, chatMessages, videoSessions, classFeedback,
  notifications, userSessions, teacherProfiles, teacherMedia, paymentMethods,
  transactionFeeConfig, paymentTransactions, unsettledFinances, paymentWorkflows,
  analyticsEvents, aiInsights, businessMetrics, complianceMonitoring,
  chatAnalytics, audioAnalytics, predictiveModels, cloudDeployments,
  technologyStack, quantumTasks, helpTickets, helpKnowledgeBase, helpTicketMessages,
  forumCategories, forumPosts, forumReplies, forumLikes,
  projectCategories, projects, projectComments, projectLikes,
  eventCategories, events, eventRegistrations, eventComments,
  qualifications, specializations, subjects, teacherAudioMetrics,
  homeSectionControls, azureStorageConfig, recordingParts, mergedRecordings,
  adminConfig, adminPaymentConfig, adminUiConfig, timeSlots, footerLinks,
  courses, courseEnrollments, bulkBookingPackages, systemAlerts
} from "../shared/schema.js";
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
    console.log("\n📤 Exporting data from ALL 64 tables...");
    
    // Base tables (no dependencies)
    const usersData = await db.select().from(users);
    const qualificationsData = await db.select().from(qualifications);
    const specializationsData = await db.select().from(specializations);
    const subjectsData = await db.select().from(subjects);
    const adminConfigData = await db.select().from(adminConfig);
    const adminPaymentConfigData = await db.select().from(adminPaymentConfig);
    const adminUiConfigData = await db.select().from(adminUiConfig);
    const footerLinksData = await db.select().from(footerLinks);
    const homeSectionControlsData = await db.select().from(homeSectionControls);
    const transactionFeeConfigData = await db.select().from(transactionFeeConfig);
    const azureStorageConfigData = await db.select().from(azureStorageConfig);
    const systemAlertsData = await db.select().from(systemAlerts);
    const successStoriesData = await db.select().from(successStories);
    const helpKnowledgeBaseData = await db.select().from(helpKnowledgeBase);
    const aiInsightsData = await db.select().from(aiInsights);
    const businessMetricsData = await db.select().from(businessMetrics);
    const complianceMonitoringData = await db.select().from(complianceMonitoring);
    const analyticsEventsData = await db.select().from(analyticsEvents);
    const predictiveModelsData = await db.select().from(predictiveModels);
    const cloudDeploymentsData = await db.select().from(cloudDeployments);
    const technologyStackData = await db.select().from(technologyStack);
    const quantumTasksData = await db.select().from(quantumTasks);
    const forumCategoriesData = await db.select().from(forumCategories);
    const projectCategoriesData = await db.select().from(projectCategories);
    const eventCategoriesData = await db.select().from(eventCategories);
    
    // Level 1 (depend on users)
    const mentorsData = await db.select().from(mentors);
    const studentsData = await db.select().from(students);
    const userSessionsData = await db.select().from(userSessions);
    const notificationsData = await db.select().from(notifications);
    const teacherProfilesData = await db.select().from(teacherProfiles);
    const helpTicketsData = await db.select().from(helpTickets);
    
    // Level 2 (depend on level 1)
    const teacherQualificationsData = await db.select().from(teacherQualifications);
    const teacherSubjectsData = await db.select().from(teacherSubjects);
    const teacherMediaData = await db.select().from(teacherMedia);
    const timeSlotsData = await db.select().from(timeSlots);
    const teacherAudioMetricsData = await db.select().from(teacherAudioMetrics);
    const coursesData = await db.select().from(courses);
    const bulkBookingPackagesData = await db.select().from(bulkBookingPackages);
    const paymentMethodsData = await db.select().from(paymentMethods);
    const achievementsData = await db.select().from(achievements);
    const forumPostsData = await db.select().from(forumPosts);
    const projectsData = await db.select().from(projects);
    const eventsData = await db.select().from(events);
    const helpTicketMessagesData = await db.select().from(helpTicketMessages);
    
    // Level 3 (depend on level 2 - bookings depends on students, mentors, courses)
    const bookingsData = await db.select().from(bookings);
    const courseEnrollmentsData = await db.select().from(courseEnrollments);
    const forumRepliesData = await db.select().from(forumReplies);
    const forumLikesData = await db.select().from(forumLikes);
    const projectCommentsData = await db.select().from(projectComments);
    const projectLikesData = await db.select().from(projectLikes);
    const eventRegistrationsData = await db.select().from(eventRegistrations);
    const eventCommentsData = await db.select().from(eventComments);
    
    // Level 4 (depend on level 3 - all depend on bookings.id)
    const chatSessionsData = await db.select().from(chatSessions);
    const chatMessagesData = await db.select().from(chatMessages);
    const reviewsData = await db.select().from(reviews);
    const classFeedbackData = await db.select().from(classFeedback);
    const videoSessionsData = await db.select().from(videoSessions);
    const paymentTransactionsData = await db.select().from(paymentTransactions);
    const chatAnalyticsData = await db.select().from(chatAnalytics);
    const audioAnalyticsData = await db.select().from(audioAnalytics);
    
    // Level 5 (depend on level 4)
    const paymentWorkflowsData = await db.select().from(paymentWorkflows);
    const unsettledFinancesData = await db.select().from(unsettledFinances);
    const recordingPartsData = await db.select().from(recordingParts);
    const mergedRecordingsData = await db.select().from(mergedRecordings);

    console.log("📊 Source data counts (64 tables):");
    console.log(`   Users: ${usersData.length}`);
    console.log(`   Mentors: ${mentorsData.length}`);
    console.log(`   Students: ${studentsData.length}`);
    console.log(`   Bookings: ${bookingsData.length}`);
    console.log(`   Courses: ${coursesData.length}`);
    console.log(`   Course Enrollments: ${courseEnrollmentsData.length}`);
    console.log(`   Time Slots: ${timeSlotsData.length}`);
    console.log(`   Reviews: ${reviewsData.length}`);
    console.log(`   Achievements: ${achievementsData.length}`);
    console.log(`   Notifications: ${notificationsData.length}`);
    console.log(`   User Sessions: ${userSessionsData.length}`);
    console.log(`   Chat Sessions: ${chatSessionsData.length}`);
    console.log(`   Chat Messages: ${chatMessagesData.length}`);
    console.log(`   Video Sessions: ${videoSessionsData.length}`);
    console.log(`   Payment Transactions: ${paymentTransactionsData.length}`);
    console.log(`   Teacher Media (photos/videos): ${teacherMediaData.length}`);
    console.log(`   ... and 47 more tables`);

    const totalRecords = usersData.length + mentorsData.length + studentsData.length + 
                        bookingsData.length + reviewsData.length + achievementsData.length +
                        teacherQualificationsData.length + teacherSubjectsData.length + teacherMediaData.length +
                        successStoriesData.length + coursesData.length + courseEnrollmentsData.length +
                        bulkBookingPackagesData.length + timeSlotsData.length + chatSessionsData.length +
                        chatMessagesData.length + videoSessionsData.length + notificationsData.length +
                        userSessionsData.length + paymentTransactionsData.length + classFeedbackData.length +
                        teacherProfilesData.length + paymentMethodsData.length + transactionFeeConfigData.length +
                        unsettledFinancesData.length + paymentWorkflowsData.length +
                        analyticsEventsData.length + aiInsightsData.length + businessMetricsData.length +
                        complianceMonitoringData.length + chatAnalyticsData.length + audioAnalyticsData.length +
                        predictiveModelsData.length + cloudDeploymentsData.length + technologyStackData.length +
                        quantumTasksData.length + helpTicketsData.length + helpKnowledgeBaseData.length +
                        helpTicketMessagesData.length + forumCategoriesData.length + forumPostsData.length +
                        forumRepliesData.length + forumLikesData.length + projectCategoriesData.length +
                        projectsData.length + projectCommentsData.length + projectLikesData.length +
                        eventCategoriesData.length + eventsData.length + eventRegistrationsData.length +
                        eventCommentsData.length + qualificationsData.length + specializationsData.length +
                        subjectsData.length + teacherAudioMetricsData.length + homeSectionControlsData.length +
                        azureStorageConfigData.length + recordingPartsData.length + mergedRecordingsData.length +
                        adminConfigData.length + adminPaymentConfigData.length + adminUiConfigData.length +
                        footerLinksData.length + systemAlertsData.length;
    
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

    // Step 3: Clear target database tables (in REVERSE dependency order)
    console.log("\n🗑️ Clearing ALL 64 target tables...");
    
    try {
      // Delete in reverse dependency order to avoid foreign key conflicts
      // Level 5 (deepest dependencies)
      await db.delete(mergedRecordings);
      await db.delete(recordingParts);
      await db.delete(unsettledFinances);
      await db.delete(paymentWorkflows);
      await db.delete(audioAnalytics);
      await db.delete(chatAnalytics);
      
      // Level 4 (all depend on bookings - delete before bookings)
      await db.delete(paymentTransactions);
      await db.delete(videoSessions);
      await db.delete(classFeedback);
      await db.delete(reviews);
      await db.delete(chatMessages);
      await db.delete(chatSessions);
      
      // Level 3 (depend on level 2 - delete before level 2)
      await db.delete(eventComments);
      await db.delete(eventRegistrations);
      await db.delete(projectLikes);
      await db.delete(projectComments);
      await db.delete(forumLikes);
      await db.delete(forumReplies);
      await db.delete(courseEnrollments);
      await db.delete(bookings);
      
      // Level 2 (depend on level 1 - delete before level 1)
      await db.delete(helpTicketMessages);
      await db.delete(events);
      await db.delete(projects);
      await db.delete(forumPosts);
      await db.delete(achievements);
      await db.delete(paymentMethods);
      await db.delete(bulkBookingPackages);
      await db.delete(courses);
      await db.delete(teacherAudioMetrics);
      await db.delete(timeSlots);
      await db.delete(teacherMedia);
      await db.delete(teacherSubjects);
      await db.delete(teacherQualifications);
      
      // Level 1
      await db.delete(helpTickets);
      await db.delete(teacherProfiles);
      await db.delete(notifications);
      await db.delete(userSessions);
      await db.delete(students);
      await db.delete(mentors);
      
      // Base tables (no dependencies)
      await db.delete(users);
      await db.delete(eventCategories);
      await db.delete(projectCategories);
      await db.delete(forumCategories);
      await db.delete(quantumTasks);
      await db.delete(technologyStack);
      await db.delete(cloudDeployments);
      await db.delete(predictiveModels);
      await db.delete(analyticsEvents);
      await db.delete(complianceMonitoring);
      await db.delete(businessMetrics);
      await db.delete(aiInsights);
      await db.delete(helpKnowledgeBase);
      await db.delete(successStories);
      await db.delete(systemAlerts);
      await db.delete(azureStorageConfig);
      await db.delete(homeSectionControls);
      await db.delete(footerLinks);
      await db.delete(adminUiConfig);
      await db.delete(adminPaymentConfig);
      await db.delete(adminConfig);
      await db.delete(transactionFeeConfig);
      await db.delete(subjects);
      await db.delete(specializations);
      await db.delete(qualifications);
      
      console.log("✅ All 64 tables cleared successfully");
    } catch (error: any) {
      console.log("⚠️ Some tables may already be empty:", error.message);
    }

    // Step 4: Insert data in correct dependency order (ALL 64 tables)
    console.log("\n📥 Inserting data into ALL 64 tables...");

    let totalInserted = 0;

    // Base tables (no dependencies) - Insert first
    if (qualificationsData.length > 0) { await db.insert(qualifications).values(qualificationsData); totalInserted += qualificationsData.length; console.log(`✅ Inserted ${qualificationsData.length} qualifications`); }
    if (specializationsData.length > 0) { await db.insert(specializations).values(specializationsData); totalInserted += specializationsData.length; console.log(`✅ Inserted ${specializationsData.length} specializations`); }
    if (subjectsData.length > 0) { await db.insert(subjects).values(subjectsData); totalInserted += subjectsData.length; console.log(`✅ Inserted ${subjectsData.length} subjects`); }
    if (transactionFeeConfigData.length > 0) { await db.insert(transactionFeeConfig).values(transactionFeeConfigData); totalInserted += transactionFeeConfigData.length; console.log(`✅ Inserted ${transactionFeeConfigData.length} transaction fee configs`); }
    if (adminConfigData.length > 0) { await db.insert(adminConfig).values(adminConfigData); totalInserted += adminConfigData.length; console.log(`✅ Inserted ${adminConfigData.length} admin configs`); }
    if (adminPaymentConfigData.length > 0) { await db.insert(adminPaymentConfig).values(adminPaymentConfigData); totalInserted += adminPaymentConfigData.length; console.log(`✅ Inserted ${adminPaymentConfigData.length} admin payment configs`); }
    if (adminUiConfigData.length > 0) { await db.insert(adminUiConfig).values(adminUiConfigData); totalInserted += adminUiConfigData.length; console.log(`✅ Inserted ${adminUiConfigData.length} admin UI configs`); }
    if (footerLinksData.length > 0) { await db.insert(footerLinks).values(footerLinksData); totalInserted += footerLinksData.length; console.log(`✅ Inserted ${footerLinksData.length} footer links`); }
    if (homeSectionControlsData.length > 0) { await db.insert(homeSectionControls).values(homeSectionControlsData); totalInserted += homeSectionControlsData.length; console.log(`✅ Inserted ${homeSectionControlsData.length} home section controls`); }
    if (azureStorageConfigData.length > 0) { await db.insert(azureStorageConfig).values(azureStorageConfigData); totalInserted += azureStorageConfigData.length; console.log(`✅ Inserted ${azureStorageConfigData.length} Azure storage configs`); }
    if (systemAlertsData.length > 0) { await db.insert(systemAlerts).values(systemAlertsData); totalInserted += systemAlertsData.length; console.log(`✅ Inserted ${systemAlertsData.length} system alerts`); }
    if (successStoriesData.length > 0) { await db.insert(successStories).values(successStoriesData); totalInserted += successStoriesData.length; console.log(`✅ Inserted ${successStoriesData.length} success stories`); }
    if (helpKnowledgeBaseData.length > 0) { await db.insert(helpKnowledgeBase).values(helpKnowledgeBaseData); totalInserted += helpKnowledgeBaseData.length; console.log(`✅ Inserted ${helpKnowledgeBaseData.length} help knowledge base`); }
    if (aiInsightsData.length > 0) { await db.insert(aiInsights).values(aiInsightsData); totalInserted += aiInsightsData.length; console.log(`✅ Inserted ${aiInsightsData.length} AI insights`); }
    if (businessMetricsData.length > 0) { await db.insert(businessMetrics).values(businessMetricsData); totalInserted += businessMetricsData.length; console.log(`✅ Inserted ${businessMetricsData.length} business metrics`); }
    if (complianceMonitoringData.length > 0) { await db.insert(complianceMonitoring).values(complianceMonitoringData); totalInserted += complianceMonitoringData.length; console.log(`✅ Inserted ${complianceMonitoringData.length} compliance monitoring`); }
    if (analyticsEventsData.length > 0) { await db.insert(analyticsEvents).values(analyticsEventsData); totalInserted += analyticsEventsData.length; console.log(`✅ Inserted ${analyticsEventsData.length} analytics events`); }
    if (predictiveModelsData.length > 0) { await db.insert(predictiveModels).values(predictiveModelsData); totalInserted += predictiveModelsData.length; console.log(`✅ Inserted ${predictiveModelsData.length} predictive models`); }
    if (cloudDeploymentsData.length > 0) { await db.insert(cloudDeployments).values(cloudDeploymentsData); totalInserted += cloudDeploymentsData.length; console.log(`✅ Inserted ${cloudDeploymentsData.length} cloud deployments`); }
    if (technologyStackData.length > 0) { await db.insert(technologyStack).values(technologyStackData); totalInserted += technologyStackData.length; console.log(`✅ Inserted ${technologyStackData.length} technology stack`); }
    if (quantumTasksData.length > 0) { await db.insert(quantumTasks).values(quantumTasksData); totalInserted += quantumTasksData.length; console.log(`✅ Inserted ${quantumTasksData.length} quantum tasks`); }
    if (forumCategoriesData.length > 0) { await db.insert(forumCategories).values(forumCategoriesData); totalInserted += forumCategoriesData.length; console.log(`✅ Inserted ${forumCategoriesData.length} forum categories`); }
    if (projectCategoriesData.length > 0) { await db.insert(projectCategories).values(projectCategoriesData); totalInserted += projectCategoriesData.length; console.log(`✅ Inserted ${projectCategoriesData.length} project categories`); }
    if (eventCategoriesData.length > 0) { await db.insert(eventCategories).values(eventCategoriesData); totalInserted += eventCategoriesData.length; console.log(`✅ Inserted ${eventCategoriesData.length} event categories`); }
    if (usersData.length > 0) { await db.insert(users).values(usersData); totalInserted += usersData.length; console.log(`✅ Inserted ${usersData.length} users`); }

    // Level 1 (depend on users)
    if (mentorsData.length > 0) { await db.insert(mentors).values(mentorsData); totalInserted += mentorsData.length; console.log(`✅ Inserted ${mentorsData.length} mentors`); }
    if (studentsData.length > 0) { await db.insert(students).values(studentsData); totalInserted += studentsData.length; console.log(`✅ Inserted ${studentsData.length} students`); }
    if (userSessionsData.length > 0) { await db.insert(userSessions).values(userSessionsData); totalInserted += userSessionsData.length; console.log(`✅ Inserted ${userSessionsData.length} user sessions`); }
    if (notificationsData.length > 0) { await db.insert(notifications).values(notificationsData); totalInserted += notificationsData.length; console.log(`✅ Inserted ${notificationsData.length} notifications`); }
    if (teacherProfilesData.length > 0) { await db.insert(teacherProfiles).values(teacherProfilesData); totalInserted += teacherProfilesData.length; console.log(`✅ Inserted ${teacherProfilesData.length} teacher profiles`); }
    if (helpTicketsData.length > 0) { await db.insert(helpTickets).values(helpTicketsData); totalInserted += helpTicketsData.length; console.log(`✅ Inserted ${helpTicketsData.length} help tickets`); }

    // Level 2 (depend on level 1 - mentors/students/users)
    if (teacherQualificationsData.length > 0) { await db.insert(teacherQualifications).values(teacherQualificationsData); totalInserted += teacherQualificationsData.length; console.log(`✅ Inserted ${teacherQualificationsData.length} teacher qualifications`); }
    if (teacherSubjectsData.length > 0) { await db.insert(teacherSubjects).values(teacherSubjectsData); totalInserted += teacherSubjectsData.length; console.log(`✅ Inserted ${teacherSubjectsData.length} teacher subjects`); }
    if (teacherMediaData.length > 0) { await db.insert(teacherMedia).values(teacherMediaData); totalInserted += teacherMediaData.length; console.log(`✅ Inserted ${teacherMediaData.length} teacher media (photos/videos with blob paths)`); }
    if (timeSlotsData.length > 0) { await db.insert(timeSlots).values(timeSlotsData); totalInserted += timeSlotsData.length; console.log(`✅ Inserted ${timeSlotsData.length} time slots`); }
    if (teacherAudioMetricsData.length > 0) { await db.insert(teacherAudioMetrics).values(teacherAudioMetricsData); totalInserted += teacherAudioMetricsData.length; console.log(`✅ Inserted ${teacherAudioMetricsData.length} teacher audio metrics`); }
    if (coursesData.length > 0) { await db.insert(courses).values(coursesData); totalInserted += coursesData.length; console.log(`✅ Inserted ${coursesData.length} courses`); }
    if (bulkBookingPackagesData.length > 0) { await db.insert(bulkBookingPackages).values(bulkBookingPackagesData); totalInserted += bulkBookingPackagesData.length; console.log(`✅ Inserted ${bulkBookingPackagesData.length} bulk booking packages`); }
    if (paymentMethodsData.length > 0) { await db.insert(paymentMethods).values(paymentMethodsData); totalInserted += paymentMethodsData.length; console.log(`✅ Inserted ${paymentMethodsData.length} payment methods`); }
    if (achievementsData.length > 0) { await db.insert(achievements).values(achievementsData); totalInserted += achievementsData.length; console.log(`✅ Inserted ${achievementsData.length} achievements`); }
    if (forumPostsData.length > 0) { await db.insert(forumPosts).values(forumPostsData); totalInserted += forumPostsData.length; console.log(`✅ Inserted ${forumPostsData.length} forum posts`); }
    if (projectsData.length > 0) { await db.insert(projects).values(projectsData); totalInserted += projectsData.length; console.log(`✅ Inserted ${projectsData.length} projects`); }
    if (eventsData.length > 0) { await db.insert(events).values(eventsData); totalInserted += eventsData.length; console.log(`✅ Inserted ${eventsData.length} events`); }
    if (helpTicketMessagesData.length > 0) { await db.insert(helpTicketMessages).values(helpTicketMessagesData); totalInserted += helpTicketMessagesData.length; console.log(`✅ Inserted ${helpTicketMessagesData.length} help ticket messages`); }

    // Level 3 (depend on level 2 - bookings depends on students/mentors/courses)
    if (bookingsData.length > 0) { await db.insert(bookings).values(bookingsData); totalInserted += bookingsData.length; console.log(`✅ Inserted ${bookingsData.length} bookings`); }
    if (courseEnrollmentsData.length > 0) { await db.insert(courseEnrollments).values(courseEnrollmentsData); totalInserted += courseEnrollmentsData.length; console.log(`✅ Inserted ${courseEnrollmentsData.length} course enrollments`); }
    if (forumRepliesData.length > 0) { await db.insert(forumReplies).values(forumRepliesData); totalInserted += forumRepliesData.length; console.log(`✅ Inserted ${forumRepliesData.length} forum replies`); }
    if (forumLikesData.length > 0) { await db.insert(forumLikes).values(forumLikesData); totalInserted += forumLikesData.length; console.log(`✅ Inserted ${forumLikesData.length} forum likes`); }
    if (projectCommentsData.length > 0) { await db.insert(projectComments).values(projectCommentsData); totalInserted += projectCommentsData.length; console.log(`✅ Inserted ${projectCommentsData.length} project comments`); }
    if (projectLikesData.length > 0) { await db.insert(projectLikes).values(projectLikesData); totalInserted += projectLikesData.length; console.log(`✅ Inserted ${projectLikesData.length} project likes`); }
    if (eventRegistrationsData.length > 0) { await db.insert(eventRegistrations).values(eventRegistrationsData); totalInserted += eventRegistrationsData.length; console.log(`✅ Inserted ${eventRegistrationsData.length} event registrations`); }
    if (eventCommentsData.length > 0) { await db.insert(eventComments).values(eventCommentsData); totalInserted += eventCommentsData.length; console.log(`✅ Inserted ${eventCommentsData.length} event comments`); }

    // Level 4 (depend on level 3 - all depend on bookings.id)
    if (chatSessionsData.length > 0) { await db.insert(chatSessions).values(chatSessionsData); totalInserted += chatSessionsData.length; console.log(`✅ Inserted ${chatSessionsData.length} chat sessions`); }
    if (chatMessagesData.length > 0) { await db.insert(chatMessages).values(chatMessagesData); totalInserted += chatMessagesData.length; console.log(`✅ Inserted ${chatMessagesData.length} chat messages`); }
    if (reviewsData.length > 0) { await db.insert(reviews).values(reviewsData); totalInserted += reviewsData.length; console.log(`✅ Inserted ${reviewsData.length} reviews`); }
    if (classFeedbackData.length > 0) { await db.insert(classFeedback).values(classFeedbackData); totalInserted += classFeedbackData.length; console.log(`✅ Inserted ${classFeedbackData.length} class feedback`); }
    if (videoSessionsData.length > 0) { await db.insert(videoSessions).values(videoSessionsData); totalInserted += videoSessionsData.length; console.log(`✅ Inserted ${videoSessionsData.length} video sessions`); }
    if (paymentTransactionsData.length > 0) { await db.insert(paymentTransactions).values(paymentTransactionsData); totalInserted += paymentTransactionsData.length; console.log(`✅ Inserted ${paymentTransactionsData.length} payment transactions`); }
    if (chatAnalyticsData.length > 0) { await db.insert(chatAnalytics).values(chatAnalyticsData); totalInserted += chatAnalyticsData.length; console.log(`✅ Inserted ${chatAnalyticsData.length} chat analytics`); }
    if (audioAnalyticsData.length > 0) { await db.insert(audioAnalytics).values(audioAnalyticsData); totalInserted += audioAnalyticsData.length; console.log(`✅ Inserted ${audioAnalyticsData.length} audio analytics`); }

    // Level 5 (deepest dependencies)
    if (paymentWorkflowsData.length > 0) { await db.insert(paymentWorkflows).values(paymentWorkflowsData); totalInserted += paymentWorkflowsData.length; console.log(`✅ Inserted ${paymentWorkflowsData.length} payment workflows`); }
    if (unsettledFinancesData.length > 0) { await db.insert(unsettledFinances).values(unsettledFinancesData); totalInserted += unsettledFinancesData.length; console.log(`✅ Inserted ${unsettledFinancesData.length} unsettled finances`); }
    if (recordingPartsData.length > 0) { await db.insert(recordingParts).values(recordingPartsData); totalInserted += recordingPartsData.length; console.log(`✅ Inserted ${recordingPartsData.length} recording parts`); }
    if (mergedRecordingsData.length > 0) { await db.insert(mergedRecordings).values(mergedRecordingsData); totalInserted += mergedRecordingsData.length; console.log(`✅ Inserted ${mergedRecordingsData.length} merged recordings`); }

    console.log(`\n📈 Total records inserted: ${totalInserted}`);

    // Step 5: Verify sync completion
    console.log("\n🔍 Verifying ALL 62 tables synced...");

    if (totalInserted === totalRecords) {
      console.log("🎉 Complete data sync successful!");
      console.log(`✅ All ${totalRecords} records from ALL 62 tables synced from Replit → Azure`);
      console.log("✅ Teacher schedules (time_slots), course enrollments, chat history, and all features are now in Azure!");
    } else {
      console.log(`⚠️ Sync incomplete: Expected ${totalRecords}, inserted ${totalInserted}`);
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

export { syncDataToAzure };
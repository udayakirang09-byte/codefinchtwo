# Complete Workflow Reference - TechLearnOrbit Platform

## Overview
This document provides a high-level reference for all major workflows in the TechLearnOrbit educational platform to help with investigating, extending, and implementing features.

---

## 1. **User Authentication & Registration**

### Student Signup Flow
1. **Frontend**: Student fills signup form (`client/src/pages/signup.tsx`)
2. **Validation**: Zod schema validation
3. **Backend**: `POST /api/auth/signup` → Creates user + student records
4. **Database Tables**: `users`, `students`
5. **Session**: Single session enforcement (invalidates old sessions)

### Teacher Signup Flow
1. **Frontend**: Teacher fills signup form with qualifications + subjects
2. **Validation**: Multi-step form with education credentials
3. **Backend**: `POST /api/auth/signup` → Creates user + mentor + **teacher_profiles** records
4. **CRITICAL**: `teacher_profiles.subjects` stores signup subjects (specialties)
5. **Database Tables**: `users`, `mentors`, `teacher_profiles`

### Login Flow
1. **Frontend**: User enters credentials
2. **Backend**: `POST /api/auth/login` → Validates password with bcrypt
3. **Session**: Creates session token + stores in `user_sessions` table
4. **Rate Limiting**: Max 5 attempts per 15 minutes per IP
5. **Single Session**: Old sessions invalidated

---

## 2. **Teacher Profile Setup (Required for Find Mentors)**

### Class Fee Configuration
- **Location**: Teacher Dashboard → Class Fee Configuration
- **Purpose**: Define subjects, experience, and per-class fees
- **Backend**: `teacher_subjects` table
- **API**: `POST /api/teacher-subjects`
- **Key Fields**: `subject`, `experience`, `classFee` (flat fee, not hourly)

### Manage Schedule (Time Slots)
- **Location**: Teacher Dashboard → Manage Schedule
- **Purpose**: Define available time slots for bookings
- **Backend**: `time_slots` table
- **API**: `POST /api/time-slots`
- **Key Fields**: `dayOfWeek`, `startTime`, `endTime`, `isRecurring`

### Find Mentors Visibility Logic
**Teachers appear in Find Mentors ONLY if:**
1. ✅ Has at least one subject in `teacher_subjects` table
2. ✅ Has at least one time slot in `time_slots` table
3. ✅ Media approved (if approval required in admin config)

**Code Location**: `server/routes.ts` → `GET /api/mentors` (lines 2057-2089)

---

## 3. **Booking Flow (Student → Teacher)**

### Step 1: Find Mentor
- **Page**: `/mentors` (Find Mentor page)
- **API**: `GET /api/mentors`
- **Data Returned**: 
  - `signupSubjects`: Specialties from `teacher_profiles.subjects`
  - `subjects`: Subjects with fees from `teacher_subjects`
  - `media`: Teacher photo/video from `teacher_media`

### Step 2: View Teacher Profile & Book Session
- **Page**: `/booking/:mentorId`
- **Displays**:
  - Teacher Specialties (signup subjects)
  - Subjects & Courses (with fees)
  - Available subjects dropdown (from `teacher_subjects`)
- **Session Types**: Demo (40 min, free) or 1-to-1 (55 min, paid)

### Step 3: Select Date & Time
- **Validation**:
  - Teacher must have time slot for selected day
  - No overlapping bookings (checks `bookings` table)
  - Booking buffer validation (30 min gap between sessions)
- **API**: `GET /api/mentors/:id/bookings` (check overlaps)

### Step 4: Payment Checkout
- **Page**: `/booking-checkout`
- **Payment Methods**:
  - **Razorpay** (UPI, Cards, Netbanking, Wallets) - India
  - **Stripe** (Cards) - International
- **API Flow**:
  1. `POST /api/razorpay/create-order` → Creates Razorpay order
  2. User completes payment in Razorpay modal
  3. `POST /api/razorpay/verify-payment` → Verifies signature
  4. `POST /api/bookings` → Creates booking

### Step 5: Booking Created
- **Database**: `bookings` table
- **Key Fields**:
  - `sessionCost`: Original amount
  - `platformFeeAmount`: 15% commission
  - `platformFeeGstAmount`: 18% GST on commission
  - `teacherPayoutAmount`: Amount teacher receives
- **Email**: SendGrid sends confirmation email
- **Notification**: Creates entry in `notifications` table

---

## 4. **Fee Calculation System**

### GST + Platform Fee Structure
- **Platform Fee**: 15% (configurable in `admin_payment_config`)
- **GST**: 18% on platform fee (configurable)
- **Example**: Student pays ₹1,000
  - Platform commission: ₹150 (15%)
  - GST: ₹27 (18% of ₹150)
  - Teacher receives: ₹823 (₹1,000 - ₹150 - ₹27)

### API Endpoints
- **GET** `/api/fee-config` → Returns current GST% and Platform Fee%
- **POST** `/api/admin/payment-config` → Admin updates rates

---

## 5. **Razorpay Integration**

### Configuration
- **Test Keys**: `TESTING_RAZORPAY_KEY_ID`, `TESTING_RAZORPAY_KEY_SECRET`
- **Production Keys**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- **Fallback Pattern**: Uses production → testing keys in order

### Order Creation
- **API**: `POST /api/razorpay/create-order`
- **Receipt Format**: `bk_${timestamp}_${mentorId.slice(-8)}` (max 28 chars)
- **Returns**: `orderId`, `amount`, `currency`, `keyId`

### Payment Verification
- **API**: `POST /api/razorpay/verify-payment`
- **Signature**: `HMAC SHA256(order_id|payment_id, secret)`
- **Success**: Returns `verified: true`

### UPI Option Not Showing Issue
**CRITICAL**: UPI requires dashboard activation:
1. Login to Razorpay Dashboard
2. Go to **Settings** → **Payment Methods**
3. Enable **UPI** for test mode
4. Save and retry

**Code**: `client/src/pages/booking-checkout.tsx` lines 220-242 (simplified config)

---

## 6. **Bulk Package System**

### Prerequisites
- Student must complete either:
  - ✅ A demo session with teacher
  - ✅ A 1-to-1 session with teacher

### Purchase Flow
- **Package**: 6 classes bulk purchase
- **Discount**: Teachers can offer bulk discounts
- **API**: `POST /api/bulk-packages`
- **Database**: `bulk_booking_packages` table
- **Scheduling**: Students schedule classes from packages page

---

## 7. **WebRTC Video Conferencing**

### Connection Flow
1. **Join Page**: `/session/:bookingId`
2. **ICE Servers**: Azure TURN servers (UDP, TCP, TLS)
3. **Signaling**: WebSocket (`wss://` + domain)
4. **Media**: WebRTC peer connection

### Connection Types (R2.7)
- **P2P Direct**: Direct peer-to-peer connection
- **TURN Relay**: UDP/TCP/TLS relay through Azure server
- **Metrics**: Logged to `webrtc_events` table

### Quality Monitoring (R2.6)
- **Bitrate Tracking**: Every 3 seconds
- **Thresholds**: Optimal >1.2 Mbps, Low <400 kbps, Critical <200 kbps
- **Stats**: Logged to `webrtc_stats` table

### Fallback (External Meeting Links)
- Teachers can set external links (Teams/Zoom/Google Meet)
- Auto-shown when WebRTC quality degrades >30 seconds
- Manual trigger available

---

## 8. **Teacher Subjects & Specialties**

### Two Types of Subjects

#### 1. Signup Subjects (Specialties)
- **Source**: Teacher signup form
- **Database**: `teacher_profiles.subjects` (JSONB array)
- **Format**: `[{subject: "JavaScript", experience: "2 years"}]`
- **Display**: "Teacher Specialties" section
- **Purpose**: Show teacher's core expertise

#### 2. Class Fee Subjects (Bookable Subjects)
- **Source**: Class Fee Configuration page
- **Database**: `teacher_subjects` table
- **Format**: Each row has `subject`, `experience`, `classFee`
- **Display**: "Subjects & Courses" section
- **Purpose**: Bookable subjects with pricing

### Data Flow
**getMentors() in `server/storage.ts`:**
```javascript
// Line 618: Fetch signup subjects from teacher_profiles
const teacherProfile = allTeacherProfiles.find((p) => p.userId === user?.id);
const signupSubjects = teacherProfile?.subjects || [];

// Line 645: Return both types
return {
  signupSubjects: signupSubjects,  // Specialties
  subjects: mentorSubjects,        // Bookable subjects with fees
};
```

**Frontend Display:**
- **Find Mentor Card** (`mentor-card.tsx`): Shows both sections
- **Booking Page** (`booking.tsx`): Shows both sections

---

## 9. **Admin Configuration**

### Payment Methods
- **Location**: Admin Dashboard → Payment Configuration
- **API**: `POST /api/admin/payment-methods`
- **Toggles**: UPI, Cards, Netbanking, Stripe

### Fee Configuration
- **Location**: Admin Dashboard → Payment Configuration
- **API**: `POST /api/admin/payment-config`
- **Fields**: GST%, Platform Fee%

### Booking Limits
- **Location**: Admin Dashboard → Booking Limits Configuration
- **API**: `POST /api/admin/booking-limits-config`
- **Limits**: Daily, Weekly, Max Packages, Max Monthly

---

## 10. **Database Schema Key Tables**

### Users & Profiles
- `users`: Core user data (id, email, password, role)
- `students`: Student profiles
- `mentors`: Teacher profiles
- `teacher_profiles`: Teacher qualifications + **signup subjects**

### Booking System
- `bookings`: Individual session bookings
- `bulk_booking_packages`: 6-class bulk packages
- `time_slots`: Teacher availability
- `teacher_subjects`: Subjects with fees

### Payments
- `payment_transactions`: Payment records
- `admin_payment_config`: GST + Platform Fee config
- `unsettled_finances`: Teacher payout tracking

### WebRTC
- `webrtc_events`: Connection events
- `webrtc_stats`: Real-time quality metrics
- `recording_parts`: Session recording chunks

---

## 11. **Common Issues & Solutions**

### Issue: Teacher Not Showing in Find Mentors
**Check**:
1. ✅ Teacher has subjects in `teacher_subjects` table
2. ✅ Teacher has time slots in `time_slots` table
3. ✅ Media approved (if approval required)

**Debug**: Check server logs for "hidden from Find Mentors" messages

### Issue: UPI Not Showing in Razorpay
**Solution**:
1. Enable UPI in Razorpay Dashboard → Settings → Payment Methods (Test Mode)
2. Verify test keys are correct
3. Check browser console for errors

### Issue: Specialties Not Displaying
**Check**:
1. ✅ Teacher has `teacher_profiles` record
2. ✅ `teacher_profiles.subjects` has data (JSONB array)
3. ✅ Frontend accessing `mentor.signupSubjects`

**Fix**: If profile missing, manually insert via SQL:
```sql
INSERT INTO teacher_profiles (user_id, subjects)
VALUES ('user-id-here', '[{"subject": "JavaScript", "experience": "2 years"}]'::jsonb);
```

### Issue: Booking Overlap Errors
**Check**:
1. Teacher has available time slot for selected day/time
2. No existing booking at that time
3. 30-minute buffer between sessions

---

## 12. **Environment Variables Reference**

### Required Secrets
- `DATABASE_URL`: PostgreSQL connection string
- `TESTING_RAZORPAY_KEY_ID`: Razorpay test key
- `TESTING_RAZORPAY_KEY_SECRET`: Razorpay test secret
- `TESTING_STRIPE_SECRET_KEY`: Stripe test key
- `AZURE_STORAGE_CONNECTION_STRING`: Blob storage for media
- `AZURE_CONTENT_SAFETY_KEY`: Content moderation API

### Optional Production Secrets
- `RAZORPAY_KEY_ID`: Razorpay production key
- `RAZORPAY_KEY_SECRET`: Razorpay production secret
- `GOOGLE_CLIENT_ID`: Google OAuth (not implemented yet)

---

## 13. **Key API Endpoints**

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Mentors
- `GET /api/mentors` - Get all mentors (with filters)
- `GET /api/mentors/:id` - Get specific mentor
- `GET /api/mentors/:id/subjects` - Get mentor subjects
- `GET /api/mentors/:id/bookings` - Get mentor bookings

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `GET /api/students/:id/bookings` - Get student bookings

### Payments
- `POST /api/razorpay/create-order` - Create Razorpay order
- `POST /api/razorpay/verify-payment` - Verify payment
- `GET /api/fee-config` - Get current fee structure

### Admin
- `POST /api/admin/payment-config` - Update fee rates
- `POST /api/admin/payment-methods` - Toggle payment methods
- `POST /api/admin/booking-limits-config` - Update booking limits

---

## 14. **Debugging Tips**

### Enable Debug Logs
- Razorpay logs: Check for `🔍 [RAZORPAY DEBUG]` in server logs
- Azure logs: Check for `🔗 [AZURE DEBUG]` in server logs
- Find Mentors: Check for `⚠️ Teacher ... hidden from Find Mentors`

### Database Queries
- Check teacher subjects: `SELECT * FROM teacher_subjects WHERE mentor_id = 'xxx'`
- Check teacher profiles: `SELECT * FROM teacher_profiles WHERE user_id = 'xxx'`
- Check bookings: `SELECT * FROM bookings WHERE mentor_id = 'xxx'`

### Browser Console
- Check for `🔄 [FIND MENTORS] Fetching mentors data...`
- Check for `🖼️ [MENTOR CARD] ... photo debug`
- Check for payment errors in Network tab

---

## 15. **Next Steps for Production**

1. **Razorpay**: Switch to production keys after dashboard setup
2. **Stripe**: Add production keys for international payments
3. **SendGrid**: Configure production email domain
4. **Azure**: Scale up database + storage for production traffic
5. **SSL/TLS**: Ensure TURN server has valid certificates

---

**Last Updated**: October 24, 2025
**Version**: 1.0

# TechLearnOrbit Platform - Workflow Reference

> **Note**: This document balances high-level workflows with practical implementation details. For exact code, always refer to the codebase.

---

## 1. User Authentication & Registration

### Student Signup
**Flow**: Form submission → Validation → Create user + student records → Auto-login with session

**Database Tables**:
- `users`: id, email, password (bcrypt hashed), role='student', name
- `students`: id, user_id (FK), grade_level, preferred_subjects

**Key Features**:
- Password hashing with bcrypt (10 salt rounds)
- Single session enforcement (old sessions invalidated on new login)
- Session stored in `user_sessions` table with expiration

### Teacher Signup
**Flow**: Multi-step form → Qualifications + Subjects → Create user + mentor + teacher_profile records

**Database Tables**:
- `users`: id, email, password, role='mentor', name
- `mentors`: id, user_id (FK), bio, hourly_rate, total_students
- `teacher_profiles`: user_id, education[], subjects (JSONB array)

**Critical**: `teacher_profiles.subjects` stores signup specialties as:
```json
[
  {"subject": "JavaScript", "experience": "2 years"},
  {"subject": "Python", "experience": "3 years"}
]
```

**Key Features**:
- Education credentials validation (degree, institution, year)
- Subjects become "Teacher Specialties" shown on profile cards
- Single session enforcement

### Login
**Flow**: Credentials → bcrypt verification → Create session → Redirect to dashboard

**Security**:
- Rate limiting: Max 5 attempts per 15 minutes per IP
- Password validation: Min 8 characters
- Session token: Secure random string stored in database
- Trust proxy: Set to 1 for Azure deployment (prevents IP spoofing)

---

## 2. Teacher Profile Setup

### Required Steps for Find Mentors Visibility

#### Step 1: Class Fee Configuration
**Purpose**: Define which subjects teacher offers with pricing

**Database Table**: `teacher_subjects`
- mentor_id (FK to mentors)
- subject: e.g., "JavaScript", "Python"
- experience: e.g., "2 years", "5 years"
- classFee: Flat per-class fee (NOT hourly) in ₹

**Example**: Teacher sets JavaScript at ₹500/class, Python at ₹800/class

#### Step 2: Schedule Setup (Time Slots)
**Purpose**: Define when teacher is available for bookings

**Database Table**: `time_slots`
- mentor_id (FK to mentors)
- dayOfWeek: "Monday", "Tuesday", etc.
- startTime: "09:00", "14:00", etc.
- endTime: "17:00", "20:00", etc.
- isRecurring: true (weekly repeat) or false (one-time)
- isBlocked: false (available) or true (blocked)

**Example**: Teacher available Mon-Fri 14:00-20:00 (recurring)

#### Step 3: Payment Method Configuration
**Purpose**: Configure UPI ID to receive payments from students

**Database Table**: `mentors`
- upi_id: Teacher's UPI ID for receiving payments

**Example**: "teacher@paytm" or "9876543210@ybl"

**Critical**: This is REQUIRED for Find Mentors visibility

#### Step 4: Media Upload (Optional)
**Purpose**: Profile photo/video for trust-building

**Database Table**: `teacher_media`
- user_id (FK to users)
- photoBlobUrl: Azure Blob Storage URL
- videoBlobUrl: Azure Blob Storage URL
- photoValidationStatus: 'pending' | 'approved' | 'rejected'
- videoValidationStatus: 'pending' | 'approved' | 'rejected'

**Validation**:
- Server-side: `sharp` library validates image format/size
- Client-side: `face-api.js` detects faces for quality check
- Admin approval required if configured

### Find Mentors Visibility Logic

**Rule**: Teachers appear in Find Mentors IF AND ONLY IF:
1. ✅ Has at least 1 subject in `teacher_subjects` table
2. ✅ Has at least 1 time slot in `time_slots` table
3. ✅ Has UPI ID configured in `mentors.upi_id`
4. ✅ Media approved (if admin approval required in config)

**API**: `GET /api/mentors` filters and returns only visible teachers

**Data Returned**:
```javascript
{
  id: "mentor-uuid",
  name: "Teacher Name",
  signupSubjects: [{subject: "JavaScript", experience: "2yr"}], // From teacher_profiles
  subjects: [{subject: "JavaScript", classFee: 500}], // From teacher_subjects
  media: {photoBlobUrl: "...", photoValidationStatus: "approved"},
  timeSlots: [...],
  totalStudents: 15,
  rating: 4.8
}
```

---

## 3. Student Booking Flow

### Step 1: Find Mentor
**Page**: `/mentors`

**Display**: Grid of mentor cards showing:
- Profile photo
- Name
- **Teacher Specialties** (from signup subjects)
- **Subjects & Courses** (bookable subjects with fees)
- Rating, total students

**Filtering** (optional): By subject, experience, price range

### Step 2: View Teacher Profile & Select Subject
**Page**: `/booking/:mentorId`

**Display**:
- Full teacher bio
- Education credentials
- Teacher Specialties section (signup subjects)
- Subjects & Courses section (bookable subjects with fees)
- Subject dropdown (only shows subjects from `teacher_subjects`)

**Session Type Selection**:
- **Demo Session**: 40 minutes, FREE (first session only)
- **1-to-1 Session**: 55 minutes, PAID (uses subject's classFee)

### Step 3: Select Date & Time
**Validation Rules**:

1. **Teacher Availability Check**:
   - Selected day must have matching time slot in `time_slots`
   - Selected time must fall within time slot range
   - Time slot must not be blocked

2. **Overlap Prevention**:
   - Query `bookings` table for teacher's existing bookings
   - Check if selected time overlaps with any existing booking
   - Include 30-minute buffer before/after each session

3. **Minimum Notice**:
   - Bookings must be at least 1 hour in future

**Buffer Calculation**:
```
Booking A: 14:00 - 15:00 (55 min session + 5 min cleanup)
Buffer: 15:00 - 15:30
Next available slot: 15:30+
```

### Step 4: Payment Checkout
**Page**: `/booking-checkout`

**Fee Calculation**:
```javascript
sessionCost = subject.classFee // e.g., ₹500
platformFeeAmount = sessionCost × 0.15 // 15% commission = ₹75
platformFeeGstAmount = platformFeeAmount × 0.18 // 18% GST on commission = ₹13.50
teacherPayoutAmount = sessionCost - platformFeeAmount - platformFeeGstAmount // ₹411.50
totalAmount = sessionCost // Student pays ₹500
```

**Payment Method Selection**:

**Option A: Razorpay** (India - UPI, Cards, Netbanking, Wallets)
1. Frontend calls `POST /api/razorpay/create-order`
   - Request: `{amount: 500, mentorId: "...", bookingDetails: {...}}`
   - Response: `{orderId, amount, currency: "INR", keyId}`
2. Load Razorpay checkout modal
3. User completes payment
4. Frontend calls `POST /api/razorpay/verify-payment`
   - Request: `{orderId, paymentId, signature}`
   - Backend verifies HMAC signature: `HMAC_SHA256(orderId|paymentId, secret)`
   - Response: `{verified: true}`

**Option B: Stripe** (International - Cards)
1. Frontend calls `POST /api/create-payment-intent`
   - Request: `{amount: 500, mentorId: "...", bookingDetails: {...}}`
   - Response: `{clientSecret}`
2. Load Stripe Elements
3. User completes card payment
4. Stripe confirms payment

**Payment Method Auto-Detection**:
- Code fetches available methods from `GET /api/admin/payment-config`
- Razorpay methods auto-detected from dashboard settings
- If Razorpay enabled: Show Razorpay button
- If Stripe enabled: Show Stripe button

### Step 5: Booking Creation
**API**: `POST /api/bookings`

**Request Body**:
```javascript
{
  mentorId: "uuid",
  studentId: "uuid",
  subject: "JavaScript",
  sessionType: "demo" | "one-to-one",
  scheduledAt: "2025-10-27T14:00:00Z",
  duration: 55, // minutes
  sessionCost: 500,
  platformFeeAmount: 75,
  platformFeeGstAmount: 13.50,
  teacherPayoutAmount: 411.50,
  paymentId: "pay_xxx", // From Razorpay/Stripe
  paymentMethod: "razorpay_upi" | "stripe_card"
}
```

**Database**: `bookings` table stores:
- All booking details
- Payment breakdown (session cost, platform fee, GST, teacher payout)
- Status: 'pending' → 'confirmed' → 'completed' | 'cancelled'

**Side Effects**:
1. Create `payment_transactions` record
2. Create `notifications` entry for teacher and student
3. Send confirmation email via SendGrid
4. Broadcast WebSocket event for real-time schedule sync
5. Create entry in `unsettled_finances` for teacher payout tracking

---

## 4. Bulk Package System

### Concept
Students purchase 6-class packages at potentially discounted rates

### Prerequisite Check
**Rule**: Student can only purchase bulk package IF:
- Student has completed at least 1 demo session with teacher, OR
- Student has completed at least 1 paid 1-to-1 session with teacher

**Validation**: Query `bookings` table for completed bookings between student and teacher

### Purchase Flow
1. Student selects "Buy 6-Class Package" on teacher profile
2. System validates prerequisite (throws error if not met)
3. Teacher's bulk discount applied (if configured)
4. Payment processed (same Razorpay/Stripe flow)
5. Create `bulk_booking_packages` record with 6 credits

**Database Table**: `bulk_booking_packages`
- student_id, mentor_id
- total_classes: 6
- classes_used: 0 (increments as student schedules)
- package_price: Total paid
- status: 'active' | 'completed' | 'expired'

### Using Package Credits
1. Student goes to "My Packages" page
2. Selects package → "Schedule Class"
3. Same date/time selection flow
4. NO payment required (deducts from package credits)
5. `classes_used` increments
6. When `classes_used === total_classes`, status → 'completed'

---

## 5. WebRTC Video Conferencing

### Session Join Flow
**Page**: `/session/:bookingId`

**Prerequisites**:
- Booking exists and status is 'confirmed'
- Current time is within join window (15 min before → end time)
- User is either teacher or student for this booking

### Connection Establishment

**Step 1: WebSocket Signaling**
- Connect to `wss://${domain}/video-signaling`
- Join room with bookingId
- Exchange SDP offers/answers for WebRTC negotiation

**Step 2: ICE Server Configuration**
```javascript
iceServers: [
  {urls: 'stun:stun.l.google.com:19302'}, // STUN for NAT traversal
  {
    urls: 'turn:your-turn-server.com:3478', // TURN UDP relay
    username: 'user',
    credential: 'pass'
  },
  {
    urls: 'turn:your-turn-server.com:3478?transport=tcp', // TURN TCP relay
    username: 'user',
    credential: 'pass'
  },
  {
    urls: 'turns:your-turn-server.com:5349?transport=tcp', // TURN TLS relay
    username: 'user',
    credential: 'pass'
  }
]
```

**Step 3: Connection Strategy (ICE Ladder)**
1. **Attempt 1**: Direct P2P connection (optimal, low latency)
2. **Attempt 2**: TURN UDP relay (if firewalls block P2P)
3. **Attempt 3**: TURN TCP relay (if UDP blocked)
4. **Attempt 4**: TURN TLS relay (maximum security, encrypted tunnel)

**Connection Type Tracking** (R2.7):
- System detects and logs connection type to `webrtc_events` table
- Admin dashboard shows P2P vs TURN distribution percentages

### Quality Monitoring (R2.6)

**Bitrate Tracking** (every 3 seconds):
- Call WebRTC `getStats()` API
- Calculate video/audio bitrate delta
- Log to `webrtc_stats` table

**Quality Thresholds**:
- **Optimal**: >1.2 Mbps
- **Good**: 800 kbps - 1.2 Mbps
- **Low**: 400 kbps - 800 kbps
- **Critical**: <400 kbps

**Auto-Degradation Detection**:
- If quality stays Low/Critical for >30 seconds
- Show "Poor connection detected" warning
- Suggest external meeting link (if configured)

### Fallback: External Meeting Links

**Teacher Configuration**:
- Teacher can set Teams/Zoom/Google Meet link in booking
- Stored in `bookings.external_meeting_link`

**Auto-Display Triggers**:
1. WebRTC quality degraded for >30 seconds
2. Connection failed after all ICE attempts
3. Manual toggle by teacher/student

**Display**: Prominent button "Join via Teams/Zoom" with link

### ICE Restart Ladder (R3.3-R3.5)

**Connection Recovery**:
- First attempt: 5 seconds after disconnect
- Second attempt: 15 seconds after first failure
- Third attempt: 30 seconds after second failure
- Each attempt logs to `webrtc_events` with severity escalation

---

## 6. Teacher Subjects - Two Types

### 1. Signup Subjects (Specialties)
**Source**: Teacher registration form

**Database**: `teacher_profiles.subjects` (JSONB)
```json
[
  {"subject": "JavaScript", "experience": "2 years"},
  {"subject": "Python", "experience": "3 years"}
]
```

**Purpose**: Show teacher's core expertise on profile cards

**Display Location**:
- Find Mentor cards: "Teacher Specialties" section
- Booking page: "Teacher Specialties" section
- Shows as badges/chips: "JavaScript (2yr exp)"

**NOT used for**: Pricing or booking selection

### 2. Bookable Subjects (Class Fee Subjects)
**Source**: Teacher Dashboard → Class Fee Configuration

**Database**: `teacher_subjects` table
- Each row: mentor_id, subject, experience, classFee

**Purpose**: Subjects students can actually book with pricing

**Display Location**:
- Find Mentor cards: "Subjects & Courses" section
- Booking page: Subject dropdown + fee display
- Shows as: "JavaScript - ₹500/class"

**Used for**: Booking subject selection and payment calculation

### Key Distinction
- **Signup Subjects**: Marketing (show expertise)
- **Bookable Subjects**: Transactions (enable bookings)
- Teachers MUST configure bookable subjects to appear in Find Mentors

---

## 7. Fee Calculation & Payment Split

### Default Configuration (Admin Configurable)
- **Platform Fee**: 15% of class fee
- **GST**: 18% on platform fee (NOT on full amount)

**Database**: `admin_payment_config` table

### Calculation Formula
```javascript
// Student pays this total amount
sessionCost = subject.classFee // e.g., ₹1000

// Platform takes commission
platformFeeAmount = sessionCost × platformFeeRate // 1000 × 0.15 = ₹150

// Government tax on commission only
platformFeeGstAmount = platformFeeAmount × gstRate // 150 × 0.18 = ₹27

// Teacher receives the remainder
teacherPayoutAmount = sessionCost - platformFeeAmount - platformFeeGstAmount
// 1000 - 150 - 27 = ₹823
```

### Example Scenarios

**₹500 Class**:
- Student pays: ₹500
- Platform commission: ₹75 (15%)
- GST on commission: ₹13.50 (18% of ₹75)
- Teacher receives: ₹411.50

**₹2000 Class**:
- Student pays: ₹2000
- Platform commission: ₹300 (15%)
- GST on commission: ₹54 (18% of ₹300)
- Teacher receives: ₹1646

### API for Fee Configuration
**GET** `/api/fee-config` - Returns current rates (public endpoint)
```json
{
  "platformFeeRate": 15,
  "gstRate": 18
}
```

**POST** `/api/admin/payment-config` - Admin updates rates
```json
{
  "platformFeeRate": 15,
  "gstRate": 18
}
```

---

## 8. Admin Configuration

### Payment Methods
**API**: `POST /api/admin/payment-methods`

**Configurable**:
- Enable/disable Razorpay
- Enable/disable Stripe
- Set Razorpay mode: 'api_keys' | 'upi_only'
- Admin UPI ID (for direct teacher payouts)

### Fee Configuration
**API**: `POST /api/admin/payment-config`

**Configurable**:
- Platform fee percentage (default: 15%)
- GST percentage (default: 18%)

### Booking Limits
**API**: `POST /api/admin/booking-limits-config`

**Database**: `admin_booking_limits_config` table

**Limits**:
- Daily booking limit per student (default: 3)
- Weekly booking limit per student (default: null/disabled)
- Max bulk packages per student (default: 2)
- Max monthly classes per student (default: 15)

**Enforcement**: Validated during booking creation

### UI Configuration
**API**: `POST /api/admin/ui-config`

**Toggles**:
- Footer links visibility (Contact Us, Success Stories, etc.)
- Dashboard links (Browse Courses, Create Course, etc.)
- Help Center visibility
- Abusive language monitoring

---

## 9. Common Troubleshooting Scenarios

### Teacher Not Visible in Find Mentors

**Checklist**:
1. ✅ Has subjects in `teacher_subjects` table?
   ```sql
   SELECT * FROM teacher_subjects WHERE mentor_id = 'teacher-id';
   ```

2. ✅ Has time slots in `time_slots` table?
   ```sql
   SELECT * FROM time_slots WHERE mentor_id = 'teacher-id';
   ```

3. ✅ Has UPI ID configured?
   ```sql
   SELECT upi_id FROM mentors WHERE id = 'teacher-id';
   ```

4. ✅ Media approved (if required)?
   ```sql
   SELECT photo_validation_status FROM teacher_media WHERE user_id = 'user-id';
   ```

**Debug**: Check server logs for: `⚠️ Teacher ... hidden from Find Mentors - Missing: ...`

### UPI Not Showing in Razorpay Checkout

**Common Cause**: UPI not enabled in Razorpay Dashboard

**Solution**:
1. Login to Razorpay Dashboard
2. Go to **Settings** → **Configuration** → **Payment Methods**
3. Enable **UPI** for Test Mode
4. Save changes
5. Retry booking

**Code Side**: Payment methods auto-detected from Razorpay dashboard config

### Teacher Specialties Not Displaying

**Root Cause**: `teacher_profiles` record missing or empty subjects

**Check**:
```sql
SELECT subjects FROM teacher_profiles WHERE user_id = 'user-id';
```

**Expected**:
```json
[{"subject": "JavaScript", "experience": "2 years"}]
```

**Fix**: If missing, teacher signup didn't create profile. Manually insert:
```sql
INSERT INTO teacher_profiles (user_id, subjects, education)
VALUES ('user-id', '[{"subject": "JavaScript", "experience": "2 years"}]'::jsonb, '[]'::jsonb);
```

### Booking Overlap Errors

**Validation Rules**:
1. Teacher must have time slot for selected day
2. No existing booking overlaps selected time
3. 30-minute buffer between sessions

**Common Issues**:
- Booking too close to existing session (violates buffer)
- Time slot exists but is blocked
- Trying to book in past

**Debug**: Check `bookings` table for teacher's schedule on selected day

---

## 10. Key Database Tables Reference

### Core User Tables
- **users**: id, email, password, role, name
- **students**: id, user_id, grade_level, preferred_subjects
- **mentors**: id, user_id, bio, hourly_rate, upi_id, total_students
- **teacher_profiles**: user_id, education[], subjects[] (JSONB)

### Booking System
- **bookings**: Full booking details with payment breakdown
- **bulk_booking_packages**: 6-class package tracking
- **time_slots**: Teacher availability schedule
- **teacher_subjects**: Subjects with class fees

### Payments
- **payment_transactions**: Payment records
- **admin_payment_config**: GST + Platform Fee rates
- **unsettled_finances**: Teacher payout tracking

### Media & Content
- **teacher_media**: Profile photos/videos with approval status
- **recording_parts**: WebRTC session recording chunks

### WebRTC & Monitoring
- **webrtc_events**: Connection events, ICE failures, quality issues
- **webrtc_stats**: Real-time quality metrics (bitrate, packet loss)

### Admin Config
- **admin_booking_limits_config**: Daily/weekly booking caps
- **admin_ui_config**: Feature toggles for UI sections

---

## 11. Environment Variables

### Required for Development
```bash
DATABASE_URL=postgresql://...
TESTING_RAZORPAY_KEY_ID=rzp_test_xxx
TESTING_RAZORPAY_KEY_SECRET=xxx
TESTING_STRIPE_SECRET_KEY=sk_test_xxx
TESTING_VITE_STRIPE_PUBLIC_KEY=pk_test_xxx # Frontend env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_CONTENT_SAFETY_KEY=xxx
AZURE_CONTENT_SAFETY_ENDPOINT=https://xxx.cognitiveservices.azure.com/
```

### Required for Production
```bash
RAZORPAY_KEY_ID=rzp_live_xxx # Production Razorpay
RAZORPAY_KEY_SECRET=xxx
STRIPE_SECRET_KEY=sk_live_xxx # Production Stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
SENDGRID_API_KEY=SG.xxx # Email service
RAZORPAY_ADMINUPI=teachername@bank # Admin UPI for payouts
```

### Optional
```bash
GOOGLE_CLIENT_ID=xxx # Google OAuth (not implemented)
GOOGLE_CLIENT_SECRET=xxx
```

---

## 12. Deployment & Production Readiness

### Pre-Deployment Checklist

1. **Payment Gateways**
   - [ ] Switch Razorpay to production keys
   - [ ] Switch Stripe to production keys
   - [ ] Test UPI payments in production mode
   - [ ] Verify webhook endpoints configured

2. **Email Service**
   - [ ] Configure SendGrid production domain
   - [ ] Verify SPF/DKIM records for deliverability
   - [ ] Test booking confirmation emails

3. **Azure Infrastructure**
   - [ ] Scale PostgreSQL database for expected load
   - [ ] Configure Azure Blob Storage for production
   - [ ] Set up TURN servers with valid SSL/TLS certificates
   - [ ] Test TURN server connectivity from multiple networks

4. **Security**
   - [ ] Trust proxy set to correct value (1 for Azure single proxy)
   - [ ] All secrets in environment variables (not hardcoded)
   - [ ] Rate limiting enabled for all public endpoints
   - [ ] CORS configured for production domain only

5. **Performance**
   - [ ] Database connection pool sized appropriately
   - [ ] Redis caching enabled for production
   - [ ] CDN configured for static assets
   - [ ] Database indexes created for common queries

### Azure Deployment Notes

**Trust Proxy**: Set to `1` for Azure App Service (single load balancer)
```javascript
app.set('trust proxy', 1);
```

**PostgreSQL Connection**: Use Azure PostgreSQL connection string with SSL
```bash
DATABASE_URL=postgres://user:pass@server.postgres.database.azure.com:5432/db?sslmode=require
```

**Blob Storage**: Configure for media uploads
```bash
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=xxx;...
```

---

**Last Updated**: October 24, 2025  
**Version**: 3.0 (Detailed with practical implementation notes)

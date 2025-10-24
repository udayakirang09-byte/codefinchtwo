# TechLearnOrbit Platform - High-Level Workflow Reference

> **Important**: This document contains only high-level workflows. For implementation details, always refer to the code as the source of truth.

---

## 1. User Authentication

### Signup
- **Students**: Register with basic info → Account created
- **Teachers**: Register with qualifications + teaching subjects (specialties) → Account + teacher profile created

### Login
- User authenticates → Single session enforced (old sessions invalidated)
- Rate limiting prevents brute force attacks

---

## 2. Teacher Profile Setup

Teachers must complete these steps to appear in "Find Mentors":

1. **Class Fee Configuration**: Define subjects they teach with per-class fees
2. **Schedule Setup**: Create time slots showing when they're available
3. **Media Upload** (optional): Upload profile photo/video for approval

**Visibility Rule**: Teachers appear in Find Mentors ONLY if they have both subjects AND time slots configured.

---

## 3. Student Booking Flow

**High-Level Journey**: Find Mentor → View Profile → Select Subject → Choose Date/Time → Payment → Booking Created

### Key Business Rules
- **Session Types**: Demo (free, 40 min) or 1-to-1 (paid, 55 min)
- **Prerequisite Check**: Bulk packages require prior demo or 1-to-1 completion
- **Overlap Validation**: No double-booking, 30-min buffer between sessions
- **Fee Structure**: Student pays total → Platform deducts 15% commission + 18% GST on commission → Teacher receives remainder

### Payment Methods
- **India**: Razorpay (UPI, Cards, Netbanking, Wallets)
- **International**: Stripe (Cards)

---

## 4. Bulk Package System

**Concept**: Students can purchase 6-class packages at discounted rates

**Prerequisite**: Student must have completed at least one demo or 1-to-1 session with the teacher first

**Flow**: Purchase package → Schedule classes individually from package → Classes booked

---

## 5. WebRTC Video Sessions

**High-Level Flow**: Join session → WebRTC connection established → Video call

### Connection Strategy
1. **Primary**: Direct P2P connection
2. **Fallback 1**: TURN relay (UDP → TCP → TLS)
3. **Fallback 2**: External meeting link (Teams/Zoom/Google Meet) shown if WebRTC quality degrades

### Quality Monitoring
- Real-time bitrate tracking
- Automatic fallback when quality drops
- Connection stats logged for analytics

---

## 6. Teacher Subjects (Two Types)

### 1. Signup Subjects (Specialties)
- **When**: Entered during teacher registration
- **Purpose**: Show teacher's core expertise
- **Display**: "Teacher Specialties" section on cards/profiles

### 2. Bookable Subjects (Class Fees)
- **When**: Configured in Teacher Dashboard
- **Purpose**: Subjects with pricing that students can book
- **Display**: "Subjects & Courses" section with fees

**Key Concept**: Signup subjects show expertise; bookable subjects enable transactions.

---

## 7. Fee Calculation System

**Default Configuration**:
- Platform Fee: 15% of class fee
- GST: 18% on platform fee

**Example**: Student pays ₹1,000
- Platform commission: ₹150 (15%)
- GST on commission: ₹27 (18% of ₹150)
- Teacher receives: ₹823

**Admin Control**: Rates are configurable via Admin Dashboard

---

## 8. Admin Configuration

Admins can configure:
- **Payment Methods**: Enable/disable UPI, Cards, Stripe
- **Fee Rates**: Adjust GST% and Platform Fee%
- **Booking Limits**: Set daily/weekly caps, max packages, max monthly classes
- **UI Features**: Toggle visibility of platform sections

---

## 9. Common Troubleshooting Scenarios

### Teacher Not Visible in Find Mentors
**Check**: Does teacher have both subjects AND time slots configured?

### UPI Not Showing in Razorpay
**Solution**: Enable UPI in Razorpay Dashboard → Settings → Payment Methods (Test Mode)

### Teacher Specialties Not Displaying
**Check**: Does teacher have profile created during signup? Look for teacher_profiles record.

### Booking Overlaps Rejected
**Reason**: System enforces 30-minute buffer between sessions to prevent teacher overload

---

## 10. Key Environment Secrets

### Required for Development
- `DATABASE_URL`: PostgreSQL connection
- `TESTING_RAZORPAY_KEY_ID` + `TESTING_RAZORPAY_KEY_SECRET`: Payment testing
- `TESTING_STRIPE_SECRET_KEY`: Card payment testing
- `AZURE_STORAGE_CONNECTION_STRING`: Media storage
- `AZURE_CONTENT_SAFETY_KEY`: Content moderation

### Required for Production
- Production payment keys (Razorpay, Stripe)
- SendGrid email credentials
- Azure TURN server credentials for WebRTC

---

## 11. Deployment Considerations

**Pre-Production Checklist**:
1. Switch all payment gateways to production keys
2. Configure production email domain (SendGrid)
3. Scale Azure database + storage for expected traffic
4. Ensure TURN servers have valid SSL/TLS certificates
5. Test WebRTC connections from multiple networks

---

**Last Updated**: October 24, 2025  
**Version**: 2.0 (High-Level Only)

> **Remember**: For implementation details (API endpoints, database schema, code locations), always refer to the codebase itself.

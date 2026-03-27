# property-lead-management-api
Backend API for a real estate platform that powers a lead pipeline for property buyers and agents.

## Setup & Local Development

1. Install dependencies:
   npm install --legacy-peer-deps

2. Set up Environment Variables:
   Create a .env file in the root directory:
   Add the following variables in it
   PORT, DATABASE_URL, JWT_SECRET,
   GEMINI_API_KEY (https://aistudio.google.com/app/apikey)

3. Database Setup (Migrations & Seeding):
   npx prisma migrate dev
   npx prisma db seed

4. Start the development server:
   npm run dev

5. Running tests:
   npm test

## Design Decisions
Used Prisma Transactions for Data Integrity
I chose to use a Prisma $transaction specifically for the transition logic when a lead is moved to the "Booked" state. This ensures that updating the lead's status and automatically marking the associated property as "Booked" occur simultaneously. If either database operation fails for any reason, the entire transaction rolls back, completely preventing critical data inconsistencies (such as having a booked lead on an available property) without writing complex manual rollback logic.

## Future Improvements
Password Hashing: To keep the seed script and reviewer setup simple as per the assignment boundaries, user passwords are currently plain text. In a real application, I would strictly enforce password hashing using bcrypt or argon2.
Role-Based Access Control (RBAC) & Data Isolation: Currently, the JWT middleware verifies authentication, but any Agent can view or transition any lead. I would add authorization middleware to ensure Agents can only view and modify leads assigned specifically to them, while Admins retain global access.
Rate Limiting & Logging: I would add express-rate-limit to prevent brute-force attacks on the auth endpoints, and implement a professional logger like winston or morgan instead of standard console logs for better API traceability.
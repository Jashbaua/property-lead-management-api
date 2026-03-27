# property-lead-management-api
Backend API for a real estate platform that powers a lead pipeline for property buyers and agents.

## Setup & Local Development

1. Install dependencies:
   npm install

2. Set up Environment Variables:
   Create a .env file in the root directory:
   Add the following variables in it
   PORT, DATABASE_URL, JWT_SECRET

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
If I had more time, I would implement robust Role-Based Access Control (RBAC) and Data Isolation. Currently, the JWT middleware verifies authentication, but any Agent can view or transition any lead. In a real-world scenario, I would add authorization middleware to ensure Agents can only view and modify leads assigned specifically to them, while Admins retain global access.
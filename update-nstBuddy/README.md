# NST Buddy - Full Stack Application

## Overview
NST Buddy is a question browser application with:
- **Semester 2 & 3**: Questions fetched from Google Sheets (existing functionality)
- **Semester 4**: Questions stored in PostgreSQL database with admin management
- **Notice Board**: Dynamic notices displayed on home page
- **Admin Portal**: Secure interface to manage questions and notices

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL (Neon)

## Project Structure
```
update-nstBuddy/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   └── server.js       # Express server
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json
│   └── .env                # Backend environment variables
├── src/                    # Frontend
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── package.json
└── .env                   # Frontend environment variables
```

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start backend server
npm run dev
```

The backend server will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to root directory
cd ..

# Install dependencies (if not already installed)
npm install

# Start frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Create Initial Admin User

Before you can access the admin portal, you need to create an admin user. Use this API endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nstbuddy.com",
    "uniqueKey": "your-secure-key-here",
    "name": "Admin User"
  }'
```

**Important**: After creating the admin user, you should remove or protect the `/api/auth/setup-admin` endpoint in production.

## Usage

### For Students

1. **Home Page**: View active notices and navigate to semester assignments
2. **Semester 2 & 3**: Browse questions from Google Sheets (existing functionality)
3. **Semester 4**: Browse questions from database with same UI/UX

### For Admins

1. **Login**: Navigate to `/admin/login`
   - Enter your email and unique key
   
2. **Manage Questions**:
   - Add new questions with: Question Name, Subject, Topic, Link
   - Edit existing questions
   - Delete questions
   
3. **Manage Notices**:
   - Create notices with title, content, priority (low/normal/high)
   - Set expiration dates (optional)
   - Edit or delete notices

## API Endpoints

### Questions
- `GET /api/questions` - Get all questions (with filters)
- `POST /api/questions` - Create question (admin only)
- `PUT /api/questions/:id` - Update question (admin only)
- `DELETE /api/questions/:id` - Delete question (admin only)

### Notices
- `GET /api/notices` - Get active notices
- `GET /api/notices/all` - Get all notices (admin only)
- `POST /api/notices` - Create notice (admin only)
- `PUT /api/notices/:id` - Update notice (admin only)
- `DELETE /api/notices/:id` - Delete notice (admin only)

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify` - Verify admin token
- `POST /api/auth/setup-admin` - Create admin user (setup only)

## Environment Variables

### Backend (.env)
```
DATABASE_URL=your_postgresql_connection_string
PORT=5000
ADMIN_SECRET_KEY=your_secret_key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Database Schema

### Question
- id (String, CUID)
- questionName (String)
- subject (String)
- topic (String)
- link (String)
- semester (Int, default: 4)
- createdAt (DateTime)
- updatedAt (DateTime)

### Notice
- id (String, CUID)
- title (String)
- content (String)
- priority (String: low/normal/high)
- isActive (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
- expiresAt (DateTime, optional)

### Admin
- id (String, CUID)
- email (String, unique)
- uniqueKey (String, hashed)
- name (String)
- createdAt (DateTime)
- updatedAt (DateTime)

## Development

### Run Backend in Watch Mode
```bash
cd backend
npm run dev
```

### Run Frontend in Development Mode
```bash
npm run dev
```

### View Database with Prisma Studio
```bash
cd backend
npx prisma studio
```

## Production Deployment

1. **Backend**:
   - Set production environment variables
   - Run `npm run build` if needed
   - Deploy to your hosting service (Heroku, Railway, etc.)
   
2. **Frontend**:
   - Update `VITE_API_URL` to production backend URL
   - Run `npm run build`
   - Deploy to Netlify, Vercel, or your preferred hosting

3. **Database**:
   - Already using Neon PostgreSQL (production-ready)
   - Run migrations: `npx prisma migrate deploy`

## Security Notes

- Admin unique keys are hashed with bcrypt
- Authentication uses simple token-based auth (consider JWT for production)
- CORS is enabled for development (configure for production)
- Remove `/api/auth/setup-admin` endpoint after initial setup

## Support

For issues or questions, contact the development team.

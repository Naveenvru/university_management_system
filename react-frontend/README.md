# University Management System - React Frontend

This is the React.js frontend for the University Management System. It provides role-based dashboards for Admin, Faculty, and Students.

## Features

### Admin Dashboard
- Manage Students (CRUD operations)
- Manage Faculty (CRUD operations)
- Manage Departments
- Manage Courses
- Manage Enrollments
- Manage Attendance Records
- Manage Grades

### Faculty Dashboard
- View and Mark Attendance
- Add and Update Grades
- View Course Information

### Student Dashboard
- View Personal Profile
- View Attendance Records
- View Grades
- View Course Enrollments

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://localhost:5000`

## Installation

1. Navigate to the react-frontend directory:
```bash
cd react-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (already created) and configure:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Login Credentials

### Admin
- Email: admin@university.edu
- Password: password123
- Role: Admin

### Faculty
- Email: faculty1@university.edu
- Password: password123
- Role: Faculty

### Student
- Email: student1@university.edu
- Password: password123
- Role: Student

## API Endpoints Used

The frontend connects to the following backend API endpoints:

- `/api/users/` - User management
- `/api/students/` - Student management
- `/api/faculty/` - Faculty management
- `/api/departments/` - Department management
- `/api/courses/` - Course management
- `/api/enrollments/` - Enrollment management
- `/api/attendance/` - Attendance management
- `/api/grades/` - Grade management

## Technologies Used

- **React 18** - UI library
- **React Router DOM v6** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Context API** - State management
- **CSS-in-JS** - Inline styling

## Features Implemented

✅ Login with role-based authentication
✅ Protected routes based on user role
✅ Admin CRUD operations for all entities
✅ Faculty attendance and grade management
✅ Student view of attendance and grades
✅ Responsive navigation
✅ Error handling
✅ Loading states
✅ Session management with localStorage

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Notes

- The application uses localStorage to persist user session
- All API calls include error handling
- The UI is kept simple and functional as requested
- Perfect layout with proper spacing and organization
- No external CSS libraries used

## Troubleshooting

1. **API Connection Error**: Ensure backend server is running on port 5000
2. **Login Issues**: Check if backend database has test users
3. **CORS Errors**: Ensure Flask-CORS is enabled in backend

## License

MIT

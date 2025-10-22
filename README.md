# University Management System

A full-stack web application for managing university operations - students, faculty, courses, attendance, and grades. Built with Flask and React.

## What This Does

This system handles everything a university needs: student enrollment, course management, attendance tracking, and an automated grading system that calculates final grades based on internal assessments and exams.

The grading system works like this:
- Faculty enters IA marks (30), assignment marks (20), and external exam marks (100)
- System automatically calculates the final internal marks (50) and converts external marks to a 50-point scale
- Total comes out of 100 with letter grades assigned automatically

## Built With

**Backend:**
- Flask (Python web framework)
- MySQL database
- Raw SQL queries (no ORM, so you can see exactly what's happening)

**Frontend:**
- React with hooks
- React Router for navigation
- Axios for API calls
- Plain CSS (no Bootstrap or other frameworks)

## How to Run This

### Backend Setup

First, make sure you have Python 3.8+ and MySQL installed.

1. Install Python packages:
```bash

### Prerequisites

- Python 3.8+
- MySQL 8.0+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/university-management-system.git
cd university-management-system
```

2. Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

3. Set up MySQL database
```bash
# Login to MySQL and create database
mysql -u root -p
CREATE DATABASE university_system;
exit;

# Import schema
mysql -u root -p university_system < database-schema.sql
```

4. Configure database connection

Create `backend/config.py`:
```python
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'your_password'
MYSQL_DB = 'university_system'
MYSQL_HOST = 'localhost'
SECRET_KEY = 'your-secret-key'
```

5. Run the backend server
```bash
cd backend
pip install -r requirements.txt
```

2. Set up your MySQL database:
```sql
mysql -u root -p
CREATE DATABASE university_system;
```

3. Import the database schema:
```bash
mysql -u root -p university_system < database-schema.sql
```

4. Create a config file at `backend/config.py`:
```python
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'your_mysql_password'
MYSQL_DB = 'university_system'
MYSQL_HOST = 'localhost'
SECRET_KEY = 'put-any-random-string-here'
```

5. Start the Flask server:
```bash
cd backend
python app.py
```

The API will be running at http://localhost:5000

### Frontend Setup

You'll need Node.js installed for this.

1. Install the packages:
```bash
cd react-frontend
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at http://localhost:3000

## Test It Out

Once both servers are running, you can login with these credentials:

**Faculty Account:**
- Email: faculty1@university.edu
- Password: password123

**Student Account:**
- Email: student1@university.edu  
- Password: password123

**Admin Account:**
- Email: admin@university.edu
- Password: password123

## Features

### For Faculty
- Mark attendance for your courses
- Enter grades (the system handles all the calculations)
- View all your students
- Update attendance and grades anytime

### For Students  
- See all your courses
- Check your attendance records
- View your grades with the full breakdown
- Enroll in new courses

### For Admins
- Add/edit/delete students and faculty
- Manage all attendance and grade records
- View everything happening in the system

## The Grading System

This was the trickiest part. Here's how it works:

Faculty enters three things:
- IA marks out of 30
- Assignment marks out of 20  
- External exam marks out of 100

The system then:
1. Adds IA + Assignment to get Final IA (out of 50)
2. Converts external marks from 100 scale to 50 scale
3. Adds them together for a total out of 100
4. Assigns a letter grade automatically

Grade cutoffs:
- A+ (90-100), A (85-89), A- (80-84)
- B+ (75-79), B (70-74), B- (65-69)
- C+ (60-64), C (55-59), C- (50-54)
- D (45-49), F (below 45)

Everything calculates automatically - faculty just enters the raw scores.

## API Routes

The backend has RESTful endpoints for everything:

**Grades:** `/api/grades/` (POST, GET, PUT, DELETE)  
**Students:** `/api/students/` (POST, GET, PUT, DELETE)  
**Faculty:** `/api/faculty/` (POST, GET, PUT, DELETE)  
**Courses:** `/api/courses/` (GET)  
**Departments:** `/api/departments/` (GET)  
**Enrollments:** `/api/enrollments/` (POST, GET, PUT, DELETE)  
**Attendance:** `/api/attendance/` (POST, GET, PUT, DELETE)  
**Users:** `/api/users/` (for authentication)

All grade calculations happen in the backend, so the frontend just sends the raw marks and gets back the computed totals and letter grades.

## Database

The system uses 8 main tables:
- users (login credentials)
- students and faculty (profile info)
- departments and courses (academic structure)
- enrollments (who's taking what)
- attendance (daily records)
- grades (with all the calculated fields)

All queries are raw SQL - no ORM. This makes it easier to understand what's actually happening in the database.

## Notes

- Used raw SQL instead of an ORM to better understand database operations
- Calculations are done server-side for consistency
- Frontend is just React with hooks, no complicated state management
- Authentication is simple localStorage-based (good enough for a project, not production)

## Issues?

If something's not working, check:
1. Is MySQL running?
2. Did you create the database and import the schema?
3. Is the config.py file set up correctly?
4. Are both backend and frontend servers running?

Feel free to open an issue if you run into problems.

---

Built as a college project to learn Flask, React, and MySQL integration.

This is an educational project. Feel free to fork and modify.

## License

MIT License - Feel free to use for educational purposes.

## Author

Created as a college mini-project to demonstrate SQL and Flask skills.

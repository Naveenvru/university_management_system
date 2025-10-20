# University Management System - Backend

## About
This is a Flask-based REST API for managing university operations. The project uses raw SQL queries to interact with MySQL database instead of using ORM, making it a good learning project for understanding SQL.

## What it does
- Manages users (students, faculty, admins)
- Handles department information
- Tracks student enrollments in courses
- Records daily attendance
- Manages grades and results
- Generates reports and statistics

## Built with
- Flask for the web framework
- MySQL for database
- SQLAlchemy (just for database connection, not ORM)
- All queries written in raw SQL

## How to set it up

### What you need
- Python 3.8 or newer
- MySQL 8.0 installed and running
- Basic knowledge of command line

### Setting up the database

First, create the database in MySQL:
```bash
mysql -u root -p
```

Then run the schema file (database-schema.sql) to create all the tables. You can either source it from MySQL command line or copy paste the SQL into MySQL Workbench.

### Installing dependencies

Navigate to the backend folder and install Python packages:
```powershell
cd backend
pip install -r requirements.txt
```

If you want to use a virtual environment (recommended):
```powershell
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```

### Configuration

Open config.py and update your MySQL credentials:
```python
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'your_password_here'
MYSQL_DB = 'university_system'
```

### Running the server

Just run:
```powershell
python app.py
```

The API will start at http://localhost:5000

You can test if it's working by visiting http://localhost:5000/api/health

## API Endpoints

The API is organized into different modules. Here are the main endpoints:

**Users** - `/api/users/`
- Create, read, update, delete user accounts
- Search users by name or email
- Handles authentication info

**Students** - `/api/students/`
- Manage student records
- Get student profiles with all their info (uses JOIN queries)
- Find students with low attendance

**Departments** - `/api/departments/`
- CRUD operations for departments
- Get department statistics

**Faculty** - `/api/faculty/`
- Manage faculty members
- Link faculty to departments

**Courses** - `/api/courses/`
- Create and manage courses
- Assign faculty to courses

**Enrollments** - `/api/enrollments/`
- Enroll students in courses
- Track enrollment status
- Calculate attendance percentages

**Attendance** - `/api/attendance/`
- Mark daily attendance
- Bulk mark attendance for whole class
- Get attendance summaries

**Grades** - `/api/grades/`
- Record student grades
- Generate grade distribution statistics

For detailed endpoint documentation, check API_TESTING_GUIDE.md

## Examples of API usage

### Creating a new user
```bash
curl -X POST http://localhost:5000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "password123",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Getting all students
```bash
curl http://localhost:5000/api/students/
```

### Getting a student profile
```bash
curl http://localhost:5000/api/students/1/profile
```

## How the SQL queries work

All database operations use raw SQL queries. Here are some examples:

### Simple INSERT
```python
query = text("""
    INSERT INTO students 
    (user_id, enrollment_number, department_id, semester)
    VALUES 
    (:user_id, :enrollment_number, :department_id, :semester)
""")
db.session.execute(query, data)
```

### SELECT with JOIN
```python
query = text("""
    SELECT 
        s.student_id,
        s.enrollment_number,
        u.first_name,
        u.last_name,
        d.department_name
    FROM students s
    JOIN users u ON s.user_id = u.user_id
    JOIN departments d ON s.department_id = d.department_id
""")
```

### UPDATE
```python
query = text("""
    UPDATE students 
    SET semester = :semester, cgpa = :cgpa
    WHERE student_id = :id
""")
```

### Queries with aggregation
```python
query = text("""
    SELECT 
        s.student_id,
        COUNT(e.enrollment_id) as total_courses,
        AVG(e.attendance_percentage) as avg_attendance
    FROM students s
    LEFT JOIN enrollments e ON s.student_id = e.student_id
    GROUP BY s.student_id
""")
```

## Database structure

The database has 8 main tables:

1. users - stores login info and basic details for everyone
2. departments - university departments like CS, EE, etc
3. students - student-specific info, linked to users table
4. faculty - teacher info, also linked to users
5. courses - all courses offered
6. enrollments - tracks which student is in which course
7. attendance - daily attendance records
8. grades - final grades for each enrollment

Tables are connected using foreign keys. For example, students table links to users table through user_id, and to departments through department_id.

## Common issues and fixes

**"Access denied" error**
- Check if your MySQL password is correct in config.py
- Make sure MySQL service is running

**"Unknown database" error**
- You need to run database-schema.sql first to create the database

**"Module not found" error**
- Make sure you installed all requirements: pip install -r requirements.txt
- Check if virtual environment is activated

**Port already in use**
- Some other app is using port 5000
- Change the port in app.py or stop the other application

## Testing

You can test the API using:
- Postman (import the endpoints and try creating/reading data)
- curl commands from terminal
- Browser for GET requests (just open http://localhost:5000/api/users/)

Sample test workflow:
1. Create a user
2. Create a department
3. Create a student (needs user_id and department_id from above)
4. Enroll student in a course
5. Mark attendance
6. Add grades

## What makes this project good for learning

- All SQL queries are written manually, no ORM magic
- Uses JOINs to connect multiple tables
- Has aggregation queries (COUNT, AVG, GROUP BY)
- Implements proper REST API structure
- Uses parameterized queries to prevent SQL injection
- Good database design with foreign keys and relationships

## Ideas for improvement

If you want to extend this project:
- Add user authentication with JWT tokens
- Create a frontend with React or Vue
- Add role-based permissions (students can only see their own data)
- Generate PDF report cards
- Send email notifications
- Add data export to Excel

## Notes

This is an educational project to learn SQL and Flask. In real production apps, you might want to use an ORM for better security and easier maintenance. But for learning how SQL works, writing raw queries is really helpful.

The project is configured to log all SQL queries in the terminal when you run the server, so you can see exactly what's being executed.

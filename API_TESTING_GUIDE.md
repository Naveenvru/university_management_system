# University Management System - API Testing Guide

## 🎯 Testing Attendance and Enrollments APIs

### ✅ Your Flask Server is Running at: http://localhost:5000

---

## 📋 ENROLLMENTS API (`/api/enrollments/`)

### Available Endpoints:

#### 1. GET All Enrollments
```
URL: http://localhost:5000/api/enrollments/
Method: GET
Description: Retrieves all enrollment records with student and course details
```

**SQL Query Executed:**
```sql
SELECT e.*, 
       s.enrollment_number, s.semester,
       u.first_name, u.last_name, u.email,
       c.course_code, c.course_name, c.credits
FROM enrollments e
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN courses c ON e.course_id = c.course_id
LIMIT 20 OFFSET 0
```

**Expected Output:**
```json
{
  "enrollments": [
    {
      "enrollment_id": 1,
      "student_id": 1,
      "course_id": 1,
      "enrollment_number": "CS2024001",
      "first_name": "Alice",
      "last_name": "Smith",
      "course_code": "CS101",
      "course_name": "Introduction to Programming",
      "status": "enrolled",
      "attendance_percentage": 0.00
    }
  ],
  "total": 8,
  "page": 1,
  "per_page": 20
}
```

---

#### 2. GET Enrollments by Student
```
URL: http://localhost:5000/api/enrollments/?student_id=1
Method: GET
Description: Get all courses enrolled by specific student
```

**SQL Query Executed:**
```sql
SELECT e.*, s.enrollment_number, u.first_name, u.last_name, c.course_code, c.course_name
FROM enrollments e
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN courses c ON e.course_id = c.course_id
WHERE e.student_id = 1
```

---

#### 3. GET Enrollments by Course
```
URL: http://localhost:5000/api/enrollments/?course_id=1
Method: GET
Description: Get all students enrolled in specific course
```

---

#### 4. GET Single Enrollment
```
URL: http://localhost:5000/api/enrollments/1
Method: GET
Description: Get details of specific enrollment
```

**SQL Query Executed:**
```sql
SELECT e.*, s.enrollment_number, u.first_name, u.last_name, c.course_code, c.course_name
FROM enrollments e
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN courses c ON e.course_id = c.course_id
WHERE e.enrollment_id = 1
```

---

#### 5. CREATE New Enrollment
```
URL: http://localhost:5000/api/enrollments/
Method: POST
Content-Type: application/json
```

**Request Body:**
```json
{
  "student_id": 2,
  "course_id": 3,
  "status": "enrolled"
}
```

**SQL Query Executed:**
```sql
INSERT INTO enrollments 
(student_id, course_id, enrollment_date, status, classes_attended, classes_held, attendance_percentage)
VALUES (2, 3, NOW(), 'enrolled', 0, 0, 0.00)
```

---

#### 6. UPDATE Enrollment
```
URL: http://localhost:5000/api/enrollments/1
Method: PUT
Content-Type: application/json
```

**Request Body:**
```json
{
  "classes_attended": 8,
  "classes_held": 10,
  "attendance_percentage": 80.00
}
```

**SQL Query Executed:**
```sql
UPDATE enrollments 
SET classes_attended = 8, classes_held = 10, attendance_percentage = 80.00
WHERE enrollment_id = 1
```

---

#### 7. DELETE Enrollment
```
URL: http://localhost:5000/api/enrollments/1
Method: DELETE
```

**SQL Query Executed:**
```sql
DELETE FROM enrollments WHERE enrollment_id = 1
```

---

## 📅 ATTENDANCE API (`/api/attendance/`)

### Available Endpoints:

#### 1. GET All Attendance Records
```
URL: http://localhost:5000/api/attendance/?limit=10
Method: GET
Description: Get attendance records with pagination
```

**SQL Query Executed:**
```sql
SELECT a.*, 
       s.enrollment_number,
       u.first_name, u.last_name,
       c.course_code, c.course_name
FROM attendance a
INNER JOIN enrollments e ON a.enrollment_id = e.enrollment_id
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN courses c ON e.course_id = c.course_id
LIMIT 10 OFFSET 0
```

**Expected Output:**
```json
{
  "attendance": [
    {
      "attendance_id": 1,
      "enrollment_id": 1,
      "attendance_date": "2024-09-01",
      "status": "present",
      "marked_by": 1,
      "enrollment_number": "CS2024001",
      "first_name": "Alice",
      "last_name": "Smith",
      "course_code": "CS101"
    }
  ],
  "total": 80
}
```

---

#### 2. GET Attendance by Enrollment
```
URL: http://localhost:5000/api/attendance/?enrollment_id=1
Method: GET
Description: Get all attendance records for specific enrollment
```

**SQL Query Executed:**
```sql
SELECT * FROM attendance WHERE enrollment_id = 1
```

---

#### 3. GET Attendance by Status
```
URL: http://localhost:5000/api/attendance/?status=present
Method: GET
Description: Filter attendance by status (present, absent, late, excused)
```

**SQL Query Executed:**
```sql
SELECT a.*, s.enrollment_number, u.first_name, u.last_name, c.course_code
FROM attendance a
INNER JOIN enrollments e ON a.enrollment_id = e.enrollment_id
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN courses c ON e.course_id = c.course_id
WHERE a.status = 'present'
```

---

#### 4. GET Single Attendance Record
```
URL: http://localhost:5000/api/attendance/1
Method: GET
```

**SQL Query Executed:**
```sql
SELECT a.*, s.enrollment_number, u.first_name, u.last_name, c.course_code
FROM attendance a
INNER JOIN enrollments e ON a.enrollment_id = e.enrollment_id
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN courses c ON e.course_id = c.course_id
WHERE a.attendance_id = 1
```

---

#### 5. CREATE Attendance Record
```
URL: http://localhost:5000/api/attendance/
Method: POST
Content-Type: application/json
```

**Request Body:**
```json
{
  "enrollment_id": 1,
  "attendance_date": "2024-09-20",
  "status": "present",
  "marked_by": 1,
  "notes": "Regular class"
}
```

**SQL Query Executed:**
```sql
INSERT INTO attendance 
(enrollment_id, attendance_date, status, marked_by, notes, created_at)
VALUES (1, '2024-09-20', 'present', 1, 'Regular class', NOW())
```

---

#### 6. UPDATE Attendance Record
```
URL: http://localhost:5000/api/attendance/5
Method: PUT
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "late",
  "notes": "Arrived 15 minutes late"
}
```

**SQL Query Executed:**
```sql
UPDATE attendance 
SET status = 'late', notes = 'Arrived 15 minutes late'
WHERE attendance_id = 5
```

---

#### 7. DELETE Attendance Record
```
URL: http://localhost:5000/api/attendance/1
Method: DELETE
```

**SQL Query Executed:**
```sql
DELETE FROM attendance WHERE attendance_id = 1
```

---

#### 8. GET Attendance Summary
```
URL: http://localhost:5000/api/attendance/summary
Method: GET
Description: Get aggregated attendance statistics
```

**SQL Query Executed:**
```sql
SELECT 
    COUNT(*) as total_records,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_count,
    ROUND(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as present_percentage
FROM attendance
```

**Expected Output:**
```json
{
  "summary": {
    "total_records": 80,
    "present_count": 54,
    "absent_count": 26,
    "late_count": 0,
    "excused_count": 0,
    "present_percentage": 67.50
  }
}
```

---

## 🧪 How to Test

### Option 1: Use Browser
Open these URLs in your browser:
- http://localhost:5000/api/enrollments/
- http://localhost:5000/api/attendance/?limit=10
- http://localhost:5000/api/attendance/summary

### Option 2: Use PowerShell
```powershell
# Test Enrollments
Invoke-RestMethod -Uri "http://localhost:5000/api/enrollments/" -Method GET | ConvertTo-Json -Depth 5

# Test Attendance
Invoke-RestMethod -Uri "http://localhost:5000/api/attendance/?limit=10" -Method GET | ConvertTo-Json -Depth 5

# Test Summary
Invoke-RestMethod -Uri "http://localhost:5000/api/attendance/summary" -Method GET | ConvertTo-Json -Depth 5
```

### Option 3: Use the Web Interface
Open: http://localhost:5000

---

## 📊 Watch SQL Queries in Real-Time

Check your Flask terminal where you'll see all SQL queries being executed with:
- The exact SQL query
- Parameters being used
- Query execution time
- Results returned

---

## ✅ Current Database Status

- **Users**: 9 (1 admin, 3 faculty, 5 students)
- **Departments**: 3 (CS, EE, ME)
- **Students**: 5
- **Courses**: 5
- **Enrollments**: 8
- **Attendance Records**: 80
- **Grades**: 8

---

## 🎓 Perfect for College Project Demo!

All queries use **raw SQL** (no ORM), which is exactly what you need to demonstrate:
- JOIN operations
- INSERT statements
- UPDATE with dynamic SET
- DELETE with validation
- Complex SELECT with filters
- Aggregation functions (COUNT, SUM, CASE WHEN)
- Pagination (LIMIT, OFFSET)

---

**Happy Testing! 🚀**

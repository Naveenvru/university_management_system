# Quick Start Guide - University Management System

## ✅ What We Built

A complete Flask backend using **RAW SQL QUERIES** for all database operations:
- ✅ 8 Database tables with relationships
- ✅ 8 API route files with full CRUD operations  
- ✅ Raw SQL: INSERT, SELECT, UPDATE, DELETE, JOIN, GROUP BY, HAVING
- ✅ RESTful API endpoints
- ✅ HTML interface to test APIs

## 🚀 Quick Setup (3 Steps)

### Step 1: Setup Database
```sql
-- Open MySQL and run:
mysql -u root -p
source database-schema.sql
```

### Step 2: Install Python Dependencies
```powershell
cd backend
pip install -r requirements.txt
```

### Step 3: Configure & Run
1. Edit `backend/config.py` - Set your MySQL password
2. Run the application:
```powershell
python app.py
```

3. Open browser: http://localhost:5000

## 📝 Testing the API

### Test 1: Create a User
```powershell
curl -X POST http://localhost:5000/api/users/ `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john@university.edu",
    "password": "pass123",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Test 2: Create a Department
```powershell
curl -X POST http://localhost:5000/api/departments/ `
  -H "Content-Type: application/json" `
  -d '{
    "department_code": "CSE",
    "department_name": "Computer Science"
  }'
```

### Test 3: Create a Student
```powershell
curl -X POST http://localhost:5000/api/students/ `
  -H "Content-Type: application/json" `
  -d '{
    "user_id": 1,
    "enrollment_number": "2024CSE001",
    "department_id": 1,
    "batch": "2024-2028",
    "admission_date": "2024-08-01"
  }'
```

### Test 4: Get All Students (with JOIN)
```powershell
curl http://localhost:5000/api/students/
```

### Test 5: Get Student Profile (Complex JOIN)
```powershell
curl http://localhost:5000/api/students/1/profile
```

## 🎯 For Your College Project Presentation

### Show These Features:

1. **Raw SQL INSERT**
   - Open `backend/routes/students.py`
   - Show lines 33-40 (INSERT query)

2. **Raw SQL SELECT with JOIN**
   - Show lines 105-125 (SELECT with INNER JOIN)

3. **Raw SQL UPDATE**
   - Show lines 265-273 (UPDATE query)

4. **Raw SQL DELETE**
   - Show lines 289-291 (DELETE query)

5. **Complex JOIN with Aggregation**
   - Show lines 322-343 (Multiple JOINs + GROUP BY)

6. **Advanced Query with HAVING**
   - Show lines 369-390 (Low attendance query)

### Demo Flow:

1. Start the application
2. Show the homepage (http://localhost:5000)
3. Open Postman/curl
4. Create user → department → student → course → enrollment
5. Mark attendance
6. Add grades
7. Show complex queries (student profile, low attendance, grade distribution)

## 📊 SQL Query Types Used

| Query Type | Example Endpoint | File |
|------------|------------------|------|
| INSERT | POST /api/users/ | users.py |
| SELECT | GET /api/users/ | users.py |
| SELECT with JOIN | GET /api/students/ | students.py |
| UPDATE | PUT /api/users/<id> | users.py |
| DELETE | DELETE /api/users/<id> | users.py |
| Complex JOIN | GET /api/students/<id>/profile | students.py |
| GROUP BY + HAVING | GET /api/students/low-attendance | students.py |
| Aggregation | GET /api/grades/statistics/distribution | grades.py |

## 🔧 Troubleshooting

**Error: "Unknown database"**
```sql
-- Run database-schema.sql first
mysql -u root -p < database-schema.sql
```

**Error: "Module not found"**
```powershell
pip install -r requirements.txt
```

**Error: "Access denied"**
```python
# Edit backend/config.py
MYSQL_PASSWORD = 'your_actual_password'
```

## 📁 Project Structure
```
university-management-system/
├── database-schema.sql          # MySQL schema
├── backend/
│   ├── app.py                  # Main Flask app
│   ├── config.py               # Database config
│   ├── models.py               # SQLAlchemy models
│   ├── requirements.txt        # Dependencies
│   ├── README.md              # Full documentation
│   ├── QUICKSTART.md          # This file
│   ├── routes/                # API routes (RAW SQL)
│   │   ├── users.py
│   │   ├── departments.py
│   │   ├── students.py
│   │   ├── faculty.py
│   │   ├── courses.py
│   │   ├── enrollments.py
│   │   ├── attendance.py
│   │   └── grades.py
│   └── templates/
│       └── index.html         # Web interface
```

## ✨ Key Highlights for Presentation

1. ✅ **No ORM magic** - Every query is visible and understandable
2. ✅ **Real SQL** - Uses actual SELECT, INSERT, UPDATE, DELETE
3. ✅ **Complex JOINs** - Multiple table joins for data retrieval
4. ✅ **Parameterized Queries** - Protection against SQL injection
5. ✅ **Transaction Management** - Commit/Rollback on errors
6. ✅ **RESTful Design** - Industry-standard API patterns
7. ✅ **Complete CRUD** - Full Create, Read, Update, Delete operations
8. ✅ **Production-Ready** - Error handling, validation, pagination

## 📚 Next Steps

1. ✅ Test all CRUD operations
2. ✅ Populate database with sample data
3. ✅ Test complex queries (JOINs, aggregations)
4. ✅ Prepare presentation slides
5. ✅ Practice demo flow

## 🎓 Good Luck with Your Project!

For detailed API documentation, see `README.md`.

---
**Created for College Mini Project - Fall 2024**

# University Management System

A Flask-based REST API for managing university operations including students, faculty, courses, enrollments, attendance, and grades.

## Overview

This project demonstrates a complete backend API using Flask and MySQL with raw SQL queries. Built as an educational project to understand database operations and REST API design.

## Features

- User management (students, faculty, admin)
- Department management
- Student enrollment system
- Course management
- Attendance tracking
- Grade management
- Complex SQL queries with JOINs and aggregations

## Tech Stack

- **Backend**: Flask 3.0
- **Database**: MySQL 8.0
- **Language**: Python 3.13
- **SQL**: Raw SQL queries (no ORM)

## Quick Start

### Prerequisites

- Python 3.8+
- MySQL 8.0+
- pip

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/university-management-system.git
cd university-management-system
```

2. Create and activate virtual environment
```bash
python -m venv .venv
.venv\Scripts\Activate  # Windows
source .venv/bin/activate  # Linux/Mac
```

3. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

4. Set up database
```bash
# Create database using MySQL
mysql -u root -p < database-schema.sql
```

5. Configure database connection

Create `backend/config.py` (copy from config.example.py):
```python
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'your_password'
MYSQL_DB = 'university_system'
```

6. Run the application
```bash
python backend/app.py
```

Server will start at `http://localhost:5000`

## API Documentation

See [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) for complete API documentation.

### Quick Test
```bash
curl http://localhost:5000/api/health
```

## Project Structure

```
university-management-system/
├── backend/
│   ├── routes/              # API endpoints
│   ├── app.py              # Main application
│   ├── config.py           # Configuration
│   └── requirements.txt    # Dependencies
├── database-schema.sql     # Database schema
├── API_TESTING_GUIDE.md   # API documentation
└── README.md              # This file
```

## Database Schema

8 main tables:
- users
- departments
- students
- faculty
- courses
- enrollments
- attendance
- grades

## Contributing

This is an educational project. Feel free to fork and modify.

## License

MIT License - Feel free to use for educational purposes.

## Author

Created as a college mini-project to demonstrate SQL and Flask skills.

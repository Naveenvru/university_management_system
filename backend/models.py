from database import db
from datetime import datetime
from sqlalchemy import Enum

class User(db.Model):
    """User authentication table"""
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(Enum('admin', 'faculty', 'student', name='user_role'), nullable=False, index=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(15))
    date_of_birth = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    student = db.relationship('Student', backref='user', uselist=False, cascade='all, delete-orphan')
    faculty = db.relationship('Faculty', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'email': self.email,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.email}>'


class Department(db.Model):
    """Department information table"""
    __tablename__ = 'departments'
    
    department_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    department_code = db.Column(db.String(10), unique=True, nullable=False, index=True)
    department_name = db.Column(db.String(100), nullable=False)
    head_of_department = db.Column(db.Integer, db.ForeignKey('faculty.faculty_id', ondelete='SET NULL'))
    contact_email = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    students = db.relationship('Student', backref='department', lazy='dynamic')
    faculty_members = db.relationship('Faculty', backref='department', 
                                     foreign_keys='Faculty.department_id', lazy='dynamic')
    courses = db.relationship('Course', backref='department', lazy='dynamic')
    head = db.relationship('Faculty', foreign_keys=[head_of_department], post_update=True)
    
    def to_dict(self):
        return {
            'department_id': self.department_id,
            'department_code': self.department_code,
            'department_name': self.department_name,
            'head_of_department': self.head_of_department,
            'contact_email': self.contact_email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }
    
    def __repr__(self):
        return f'<Department {self.department_code}>'


class Student(db.Model):
    """Student information table"""
    __tablename__ = 'students'
    
    student_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), 
                       unique=True, nullable=False, index=True)
    enrollment_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), 
                             nullable=False, index=True)
    semester = db.Column(db.Integer, nullable=False, default=1)
    batch = db.Column(db.String(10), nullable=False, comment='2024-2028')
    admission_date = db.Column(db.Date, nullable=False)
    cgpa = db.Column(db.Numeric(4, 2), default=0.00)
    status = db.Column(Enum('active', 'inactive', 'graduated', name='student_status'), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    enrollments = db.relationship('Enrollment', backref='student', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'student_id': self.student_id,
            'user_id': self.user_id,
            'enrollment_number': self.enrollment_number,
            'department_id': self.department_id,
            'semester': self.semester,
            'batch': self.batch,
            'admission_date': self.admission_date.isoformat() if self.admission_date else None,
            'cgpa': float(self.cgpa) if self.cgpa else 0.00,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Student {self.enrollment_number}>'


class Faculty(db.Model):
    """Faculty information table"""
    __tablename__ = 'faculty'
    
    faculty_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), 
                       unique=True, nullable=False, index=True)
    employee_id = db.Column(db.String(20), unique=True, nullable=False, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), 
                             nullable=False, index=True)
    designation = db.Column(Enum('professor', 'associate_professor', 'assistant_professor', 
                                 'lecturer', name='faculty_designation'), nullable=False)
    qualification = db.Column(db.String(200), nullable=False)
    joining_date = db.Column(db.Date, nullable=False)
    status = db.Column(Enum('active', 'on_leave', 'retired', name='faculty_status'), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    courses = db.relationship('Course', backref='faculty', lazy='dynamic')
    attendance_marked = db.relationship('Attendance', backref='marked_by_faculty', lazy='dynamic')
    
    def to_dict(self):
        return {
            'faculty_id': self.faculty_id,
            'user_id': self.user_id,
            'employee_id': self.employee_id,
            'department_id': self.department_id,
            'designation': self.designation,
            'qualification': self.qualification,
            'joining_date': self.joining_date.isoformat() if self.joining_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Faculty {self.employee_id}>'


class Course(db.Model):
    """Course offerings table"""
    __tablename__ = 'courses'
    
    course_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    course_code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    course_name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), 
                             nullable=False, index=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.faculty_id'), 
                          nullable=False, index=True)
    semester = db.Column(db.String(20), nullable=False, index=True, comment='Fall 2024, Spring 2025')
    credits = db.Column(db.Integer, nullable=False, default=3)
    max_students = db.Column(db.Integer, default=60)
    total_classes = db.Column(db.Integer, default=45)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    enrollments = db.relationship('Enrollment', backref='course', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'course_id': self.course_id,
            'course_code': self.course_code,
            'course_name': self.course_name,
            'department_id': self.department_id,
            'faculty_id': self.faculty_id,
            'semester': self.semester,
            'credits': self.credits,
            'max_students': self.max_students,
            'total_classes': self.total_classes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Course {self.course_code}>'


class Enrollment(db.Model):
    """Student course enrollments table"""
    __tablename__ = 'enrollments'
    
    enrollment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id', ondelete='CASCADE'), 
                          nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id', ondelete='CASCADE'), 
                         nullable=False, index=True)
    enrollment_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(Enum('enrolled', 'completed', 'dropped', 'withdrawn', 
                           name='enrollment_status'), default='enrolled', index=True)
    classes_attended = db.Column(db.Integer, default=0)
    classes_held = db.Column(db.Integer, default=0)
    attendance_percentage = db.Column(db.Numeric(5, 2), default=0.00)
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('student_id', 'course_id', name='unique_enrollment'),
    )
    
    # Relationships
    attendance_records = db.relationship('Attendance', backref='enrollment', lazy='dynamic', 
                                        cascade='all, delete-orphan')
    grade = db.relationship('Grade', backref='enrollment', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'enrollment_id': self.enrollment_id,
            'student_id': self.student_id,
            'course_id': self.course_id,
            'enrollment_date': self.enrollment_date.isoformat() if self.enrollment_date else None,
            'status': self.status,
            'classes_attended': self.classes_attended,
            'classes_held': self.classes_held,
            'attendance_percentage': float(self.attendance_percentage) if self.attendance_percentage else 0.00
        }
    
    def __repr__(self):
        return f'<Enrollment {self.enrollment_id}>'


class Attendance(db.Model):
    """Daily attendance records table"""
    __tablename__ = 'attendance'
    
    attendance_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollments.enrollment_id', ondelete='CASCADE'), 
                             nullable=False, index=True)
    attendance_date = db.Column(db.Date, nullable=False, index=True)
    status = db.Column(Enum('present', 'absent', 'late', 'excused', 
                           name='attendance_status'), nullable=False, index=True)
    marked_by = db.Column(db.Integer, db.ForeignKey('faculty.faculty_id'), 
                         nullable=False, comment='Faculty ID')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('enrollment_id', 'attendance_date', name='unique_attendance'),
    )
    
    def to_dict(self):
        return {
            'attendance_id': self.attendance_id,
            'enrollment_id': self.enrollment_id,
            'attendance_date': self.attendance_date.isoformat() if self.attendance_date else None,
            'status': self.status,
            'marked_by': self.marked_by,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Attendance {self.attendance_id}>'


class Grade(db.Model):
    """Final grades table"""
    __tablename__ = 'grades'
    
    grade_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollments.enrollment_id', ondelete='CASCADE'), 
                             unique=True, nullable=False, index=True)
    internal_marks = db.Column(db.Numeric(6, 2), default=0.00)
    midterm_marks = db.Column(db.Numeric(6, 2), default=0.00)
    final_marks = db.Column(db.Numeric(6, 2), default=0.00)
    total_marks = db.Column(db.Numeric(6, 2), default=0.00)
    percentage = db.Column(db.Numeric(5, 2), default=0.00)
    letter_grade = db.Column(db.String(5), index=True)
    
    def to_dict(self):
        return {
            'grade_id': self.grade_id,
            'enrollment_id': self.enrollment_id,
            'internal_marks': float(self.internal_marks) if self.internal_marks else 0.00,
            'midterm_marks': float(self.midterm_marks) if self.midterm_marks else 0.00,
            'final_marks': float(self.final_marks) if self.final_marks else 0.00,
            'total_marks': float(self.total_marks) if self.total_marks else 0.00,
            'percentage': float(self.percentage) if self.percentage else 0.00,
            'letter_grade': self.letter_grade
        }
    
    def __repr__(self):
        return f'<Grade {self.grade_id}>'

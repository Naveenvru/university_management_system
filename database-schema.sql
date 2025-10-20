
DROP DATABASE IF EXISTS university_system;
CREATE DATABASE university_system;
USE university_system;

-- departments
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_code VARCHAR(10) UNIQUE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    head_of_department INT NULL,
    contact_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_department_code (department_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Department information';

--users
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty', 'student') NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User authentication';

--students
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    enrollment_number VARCHAR(20) UNIQUE NOT NULL,
    department_id INT NOT NULL,
    semester INT NOT NULL DEFAULT 1,
    batch VARCHAR(10) NOT NULL COMMENT '2024-2028',
    admission_date DATE NOT NULL,
    cgpa DECIMAL(4,2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    
    INDEX idx_enrollment_number (enrollment_number),
    INDEX idx_department_id (department_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student information';

--faculty
CREATE TABLE faculty (
    faculty_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    department_id INT NOT NULL,
    designation ENUM('professor', 'associate_professor', 'assistant_professor', 'lecturer') NOT NULL,
    qualification VARCHAR(200) NOT NULL,
    joining_date DATE NOT NULL,
    status ENUM('active', 'on_leave', 'retired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_department_id (department_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Faculty information';

-- Add foreign key for head_of_department
ALTER TABLE departments 
ADD CONSTRAINT fk_hod 
FOREIGN KEY (head_of_department) REFERENCES faculty(faculty_id) ON DELETE SET NULL;

--courses
CREATE TABLE courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    faculty_id INT NOT NULL,
    semester VARCHAR(20) NOT NULL COMMENT 'Fall 2024, Spring 2025',
    credits INT NOT NULL DEFAULT 3,
    max_students INT DEFAULT 60,
    total_classes INT DEFAULT 45,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    
    INDEX idx_course_code (course_code),
    INDEX idx_faculty_id (faculty_id),
    INDEX idx_semester (semester),
    INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Course offerings';

--enrollments
CREATE TABLE enrollments (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enrolled', 'completed', 'dropped', 'withdrawn') DEFAULT 'enrolled',
    classes_attended INT DEFAULT 0,
    classes_held INT DEFAULT 0,
    attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student course enrollments - attendance summary only';

--attendence
CREATE TABLE attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    marked_by INT NOT NULL COMMENT 'Faculty ID',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES faculty(faculty_id),
    
    UNIQUE KEY unique_attendance (enrollment_id, attendance_date),
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Daily attendance records - student_id and course_id derived from enrollment_id';

--grades
CREATE TABLE grades (
    grade_id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT UNIQUE NOT NULL,
    internal_marks DECIMAL(6,2) DEFAULT 0.00,
    midterm_marks DECIMAL(6,2) DEFAULT 0.00,
    final_marks DECIMAL(6,2) DEFAULT 0.00,
    total_marks DECIMAL(6,2) DEFAULT 0.00,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    letter_grade VARCHAR(5),
    
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_letter_grade (letter_grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Final grades - student_id and course_id derived from enrollment_id';


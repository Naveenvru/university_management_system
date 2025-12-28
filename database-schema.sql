
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

-- users
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

-- students
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

-- faculty
CREATE TABLE faculty (
    faculty_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    department_id INT NOT NULL,
    designation ENUM('professor', 'associate_professor', 'assistant_professor', 'lecturer') NOT NULL,
    qualification VARCHAR(200) NOT NULL,
    joining_date DATE NOT NULL,
    status ENUM('active', 'on_leave', 'retired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    
    INDEX idx_department_id (department_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Faculty information';

-- Add foreign key for head_of_department
ALTER TABLE departments 
ADD CONSTRAINT fk_hod 
FOREIGN KEY (head_of_department) REFERENCES faculty(faculty_id) ON DELETE SET NULL;

-- courses
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

-- enrollments (COMPOSITE PRIMARY KEY)
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enrolled', 'completed', 'dropped', 'withdrawn') DEFAULT 'enrolled',
    classes_attended INT DEFAULT 0,
    classes_held INT DEFAULT 0,
    attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Composite Primary Key
    PRIMARY KEY (student_id, course_id),
    
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student course enrollments - composite key (student_id, course_id)';

-- attendance (COMPOSITE PRIMARY KEY)
CREATE TABLE attendance (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    marked_by INT NOT NULL COMMENT 'Faculty ID',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite Primary Key
    PRIMARY KEY (student_id, course_id, attendance_date),
    
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES faculty(faculty_id),
    
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student attendance records - composite key (student_id, course_id, attendance_date)';

-- grades (COMPOSITE PRIMARY KEY)
-- Grading System: Internal1 (0-50) + Internal2 (0-50) averaged = 50 marks, External (0-50) = 50 marks, Total = 100 marks
CREATE TABLE grades (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    internal1_marks DECIMAL(6,2) DEFAULT 0.00 COMMENT 'First internal exam marks out of 50',
    internal2_marks DECIMAL(6,2) DEFAULT 0.00 COMMENT 'Second internal exam marks out of 50',
    external_marks DECIMAL(6,2) DEFAULT 0.00 COMMENT 'External/Final exam marks out of 50',
    total_marks DECIMAL(6,2) DEFAULT 0.00 COMMENT 'Total out of 100: (internal1+internal2)/2 + external',
    percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Same as total_marks (already out of 100)',
    letter_grade VARCHAR(5),
    
    -- Composite Primary Key
    PRIMARY KEY (student_id, course_id),
    
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_letter_grade (letter_grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Final grades - composite key (student_id, course_id). Total = Avg of 2 internals (50) + External (50) = 100';


-- ============================================================
-- SAMPLE DATA INSERTION
-- ============================================================

-- Insert Departments
INSERT INTO departments (department_code, department_name, contact_email, is_active) VALUES
('CSE', 'Computer Science and Engineering', 'cse@university.edu', TRUE),
('ECE', 'Electronics and Communication Engineering', 'ece@university.edu', TRUE),
('ME', 'Mechanical Engineering', 'me@university.edu', TRUE),
('CE', 'Civil Engineering', 'ce@university.edu', TRUE),
('EEE', 'Electrical and Electronics Engineering', 'eee@university.edu', TRUE);

-- Insert Admin User
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, date_of_birth, is_active) VALUES
('admin@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'admin', 'System', 'Administrator', '1234567890', '1980-01-01', TRUE);

-- Insert Faculty Users
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, date_of_birth, is_active) VALUES
('dr.smith@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'faculty', 'John', 'Smith', '9876543210', '1975-05-15', TRUE),
('dr.johnson@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'faculty', 'Emily', 'Johnson', '9876543211', '1978-08-20', TRUE),
('dr.williams@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'faculty', 'Robert', 'Williams', '9876543212', '1980-03-10', TRUE),
('dr.brown@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'faculty', 'Sarah', 'Brown', '9876543213', '1982-11-25', TRUE),
('dr.davis@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'faculty', 'Michael', 'Davis', '9876543214', '1977-07-30', TRUE);

-- Insert Faculty
INSERT INTO faculty (user_id, department_id, designation, qualification, joining_date, status) VALUES
(2, 1, 'professor', 'PhD in Computer Science', '2010-08-01', 'active'),
(3, 2, 'associate_professor', 'PhD in Electronics', '2012-07-15', 'active'),
(4, 3, 'assistant_professor', 'PhD in Mechanical Engineering', '2015-06-01', 'active'),
(5, 4, 'lecturer', 'M.Tech in Civil Engineering', '2018-08-01', 'active'),
(6, 5, 'associate_professor', 'PhD in Electrical Engineering', '2013-09-01', 'active');

-- Update head of department
UPDATE departments SET head_of_department = 1 WHERE department_id = 1;
UPDATE departments SET head_of_department = 2 WHERE department_id = 2;
UPDATE departments SET head_of_department = 3 WHERE department_id = 3;
UPDATE departments SET head_of_department = 4 WHERE department_id = 4;
UPDATE departments SET head_of_department = 5 WHERE department_id = 5;

-- Insert Student Users
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, date_of_birth, is_active) VALUES
('alice.wilson@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'student', 'Alice', 'Wilson', '8765432101', '2003-04-12', TRUE),
('bob.martinez@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'student', 'Bob', 'Martinez', '8765432102', '2003-06-20', TRUE),
('carol.garcia@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'student', 'Carol', 'Garcia', '8765432103', '2003-09-15', TRUE),
('david.lopez@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'student', 'David', 'Lopez', '8765432104', '2003-02-28', TRUE),
('emma.taylor@university.edu', 'scrypt:32768:8:1$bZ5k3l9mW2tP7qRx$a8f9c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6', 'student', 'Emma', 'Taylor', '8765432105', '2003-12-05', TRUE);

-- Insert Students
INSERT INTO students (user_id, enrollment_number, department_id, semester, batch, admission_date, cgpa, status) VALUES
(7, '2024CSE001', 1, 3, '2024-2028', '2024-08-01', 8.50, 'active'),
(8, '2024ECE001', 2, 3, '2024-2028', '2024-08-01', 7.80, 'active'),
(9, '2024ME001', 3, 3, '2024-2028', '2024-08-01', 8.20, 'active'),
(10, '2024CE001', 4, 3, '2024-2028', '2024-08-01', 7.50, 'active'),
(11, '2024EEE001', 5, 3, '2024-2028', '2024-08-01', 8.90, 'active');

-- Insert Courses
INSERT INTO courses (course_code, course_name, department_id, faculty_id, semester, credits, max_students, total_classes) VALUES
('CS101', 'Introduction to Programming', 1, 1, 'Fall 2024', 4, 60, 45),
('CS102', 'Data Structures', 1, 1, 'Fall 2024', 4, 60, 45),
('EC101', 'Basic Electronics', 2, 2, 'Fall 2024', 3, 50, 40),
('ME101', 'Engineering Mechanics', 3, 3, 'Fall 2024', 3, 50, 40),
('CE101', 'Engineering Drawing', 4, 4, 'Fall 2024', 3, 50, 40),
('EE101', 'Electrical Circuits', 5, 5, 'Fall 2024', 4, 60, 45);

-- Insert Enrollments (using composite key: student_id, course_id)
INSERT INTO enrollments (student_id, course_id, enrollment_date, status, classes_attended, classes_held, attendance_percentage) VALUES
(1, 1, '2024-08-05', 'enrolled', 38, 45, 84.44),
(1, 2, '2024-08-05', 'enrolled', 40, 45, 88.89),
(2, 3, '2024-08-05', 'enrolled', 35, 40, 87.50),
(3, 4, '2024-08-05', 'enrolled', 36, 40, 90.00),
(4, 5, '2024-08-05', 'enrolled', 32, 40, 80.00),
(5, 6, '2024-08-05', 'enrolled', 42, 45, 93.33);

-- Insert Attendance Records (using composite key: student_id, course_id, attendance_date)
INSERT INTO attendance (student_id, course_id, attendance_date, status, marked_by, notes) VALUES
(1, 1, '2024-10-01', 'present', 1, NULL),
(1, 1, '2024-10-02', 'present', 1, NULL),
(1, 1, '2024-10-03', 'absent', 1, 'Medical leave'),
(1, 2, '2024-10-01', 'present', 1, NULL),
(1, 2, '2024-10-02', 'late', 1, 'Arrived 10 minutes late'),
(2, 3, '2024-10-01', 'present', 2, NULL),
(2, 3, '2024-10-02', 'present', 2, NULL),
(3, 4, '2024-10-01', 'present', 3, NULL),
(3, 4, '2024-10-02', 'present', 3, NULL),
(4, 5, '2024-10-01', 'present', 4, NULL),
(5, 6, '2024-10-01', 'present', 5, NULL),
(5, 6, '2024-10-02', 'present', 5, NULL);

-- Insert Grades (using composite key: student_id, course_id)
INSERT INTO grades (student_id, course_id, internal_marks, midterm_marks, final_marks, total_marks, percentage, letter_grade) VALUES
(1, 1, 18.50, 22.00, 45.00, 85.50, 85.50, 'A'),
(1, 2, 19.00, 23.50, 47.00, 89.50, 89.50, 'A+'),
(2, 3, 16.00, 20.00, 42.00, 78.00, 78.00, 'B+'),
(3, 4, 17.50, 21.00, 44.00, 82.50, 82.50, 'A'),
(4, 5, 15.00, 18.50, 40.00, 73.50, 73.50, 'B'),
(5, 6, 19.50, 24.00, 48.00, 91.50, 91.50, 'A+');


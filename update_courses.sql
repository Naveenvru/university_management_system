-- Add department-specific courses (7 courses per department)
USE university_system;

-- Clear existing courses to rebuild with department structure
DELETE FROM enrollments;
DELETE FROM grades;
DELETE FROM attendance;
DELETE FROM courses;

-- Computer Science Department Courses (7 courses)
INSERT INTO courses (course_code, course_name, department_id, credits, semester, description) VALUES
('CS101', 'Introduction to Programming', 1, 4, 1, 'Fundamentals of programming using Python'),
('CS102', 'Data Structures', 1, 4, 2, 'Linear and non-linear data structures'),
('CS103', 'Database Management Systems', 1, 4, 3, 'Relational databases and SQL'),
('CS104', 'Web Development', 1, 3, 4, 'HTML, CSS, JavaScript, React'),
('CS105', 'Operating Systems', 1, 4, 5, 'Process management and scheduling'),
('CS106', 'Computer Networks', 1, 4, 6, 'Network protocols and architecture'),
('CS107', 'Software Engineering', 1, 3, 7, 'Software development lifecycle');

-- Electrical Engineering Department Courses (7 courses)
INSERT INTO courses (course_code, course_name, department_id, credits, semester, description) VALUES
('EE101', 'Circuit Analysis', 2, 4, 1, 'Basic electrical circuits and analysis'),
('EE102', 'Digital Electronics', 2, 4, 2, 'Logic gates and digital systems'),
('EE103', 'Signals and Systems', 2, 4, 3, 'Signal processing fundamentals'),
('EE104', 'Power Systems', 2, 4, 4, 'Generation and distribution of power'),
('EE105', 'Control Systems', 2, 4, 5, 'Feedback control theory'),
('EE106', 'Microprocessors', 2, 3, 6, '8085 and 8086 microprocessors'),
('EE107', 'Embedded Systems', 2, 3, 7, 'ARM and embedded programming');

-- Mechanical Engineering Department Courses (7 courses)
INSERT INTO courses (course_code, course_name, department_id, credits, semester, description) VALUES
('ME101', 'Engineering Mechanics', 3, 4, 1, 'Statics and dynamics'),
('ME102', 'Thermodynamics', 3, 4, 2, 'Heat and energy transfer'),
('ME103', 'Fluid Mechanics', 3, 4, 3, 'Fluid flow and properties'),
('ME104', 'Machine Design', 3, 4, 4, 'Design of machine elements'),
('ME105', 'Manufacturing Processes', 3, 3, 5, 'Machining and forming'),
('ME106', 'Heat Transfer', 3, 4, 6, 'Conduction and convection'),
('ME107', 'Robotics', 3, 3, 7, 'Robotics and automation');

-- Update students table to include department_id
ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id INT;

-- Assign departments to existing students
UPDATE students SET department_id = 1 WHERE student_id IN (1, 2, 3);
UPDATE students SET department_id = 2 WHERE student_id IN (4, 5);

-- Add faculty_courses junction table for faculty-course mapping
CREATE TABLE IF NOT EXISTS faculty_courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_id INT NOT NULL,
    course_id INT NOT NULL,
    academic_year VARCHAR(10) DEFAULT '2024-2025',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_faculty_course (faculty_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Faculty course assignments';

-- Assign courses to faculty (1-2 courses per faculty)
INSERT INTO faculty_courses (faculty_id, course_id) VALUES
(1, 1),  -- Faculty 1 teaches CS101
(1, 2),  -- Faculty 1 teaches CS102
(2, 8),  -- Faculty 2 teaches EE101
(2, 9),  -- Faculty 2 teaches EE102
(3, 15), -- Faculty 3 teaches ME101
(3, 16); -- Faculty 3 teaches ME102

SELECT 'Database updated with department-specific courses!' as message;

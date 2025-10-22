import pymysql
import os

# Connect to MySQL
connection = pymysql.connect(
    host='localhost',
    user='root',
    password='Naveen@7259',
    database='university_system'
)

try:
    with connection.cursor() as cursor:
        print("Clearing existing course data...")
        cursor.execute("DELETE FROM enrollments")
        cursor.execute("DELETE FROM grades")
        cursor.execute("DELETE FROM attendance")
        cursor.execute("DELETE FROM courses")
        
        print("Adding Computer Science courses...")
        # Assign faculty_id 1 to all CS courses initially
        cs_courses = [
            ('CS101', 'Introduction to Programming', 1, 1, 'Fall 2024', 4),
            ('CS102', 'Data Structures', 1, 1, 'Spring 2025', 4),
            ('CS103', 'Database Management Systems', 1, 1, 'Fall 2024', 4),
            ('CS104', 'Web Development', 1, 1, 'Spring 2025', 3),
            ('CS105', 'Operating Systems', 1, 1, 'Fall 2024', 4),
            ('CS106', 'Computer Networks', 1, 1, 'Spring 2025', 4),
            ('CS107', 'Software Engineering', 1, 1, 'Fall 2024', 3)
        ]
        
        print("Adding Electrical Engineering courses...")
        # Assign faculty_id 2 to all EE courses initially
        ee_courses = [
            ('EE101', 'Circuit Analysis', 2, 2, 'Fall 2024', 4),
            ('EE102', 'Digital Electronics', 2, 2, 'Spring 2025', 4),
            ('EE103', 'Signals and Systems', 2, 2, 'Fall 2024', 4),
            ('EE104', 'Power Systems', 2, 2, 'Spring 2025', 4),
            ('EE105', 'Control Systems', 2, 2, 'Fall 2024', 4),
            ('EE106', 'Microprocessors', 2, 2, 'Spring 2025', 3),
            ('EE107', 'Embedded Systems', 2, 2, 'Fall 2024', 3)
        ]
        
        print("Adding Mechanical Engineering courses...")
        # Assign faculty_id 3 to all ME courses initially
        me_courses = [
            ('ME101', 'Engineering Mechanics', 3, 3, 'Fall 2024', 4),
            ('ME102', 'Thermodynamics', 3, 3, 'Spring 2025', 4),
            ('ME103', 'Fluid Mechanics', 3, 3, 'Fall 2024', 4),
            ('ME104', 'Machine Design', 3, 3, 'Spring 2025', 4),
            ('ME105', 'Manufacturing Processes', 3, 3, 'Fall 2024', 3),
            ('ME106', 'Heat Transfer', 3, 3, 'Spring 2025', 4),
            ('ME107', 'Robotics', 3, 3, 'Fall 2024', 3)
        ]
        
        all_courses = cs_courses + ee_courses + me_courses
        
        for course in all_courses:
            cursor.execute(
                "INSERT INTO courses (course_code, course_name, department_id, faculty_id, semester, credits) VALUES (%s, %s, %s, %s, %s, %s)",
                course
            )
        
        print("Creating faculty_courses table...")
        cursor.execute("""
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        print("Assigning courses to faculty...")
        cursor.execute("DELETE FROM faculty_courses")
        
        # Get the course IDs that were just created
        cursor.execute("SELECT course_id, course_code FROM courses WHERE course_code LIKE 'CS%' OR course_code LIKE 'EE%' OR course_code LIKE 'ME%' ORDER BY course_code")
        course_mapping = {row[1]: row[0] for row in cursor.fetchall()}
        
        # Use actual course IDs from the database
        faculty_assignments = [
            (1, course_mapping.get('CS101')), (1, course_mapping.get('CS102')),   # Faculty 1 teaches CS101, CS102
            (2, course_mapping.get('EE101')), (2, course_mapping.get('EE102')),   # Faculty 2 teaches EE101, EE102
            (3, course_mapping.get('ME101')), (3, course_mapping.get('ME102'))    # Faculty 3 teaches ME101, ME102
        ]
        
        # Filter out any None values
        faculty_assignments = [fa for fa in faculty_assignments if fa[1] is not None]
        
        for assignment in faculty_assignments:
            cursor.execute(
                "INSERT INTO faculty_courses (faculty_id, course_id) VALUES (%s, %s)",
                assignment
            )
        
        # Update students table to add department_id if not exists
        print("Updating students table...")
        try:
            cursor.execute("ALTER TABLE students ADD COLUMN department_id INT")
        except:
            pass  # Column might already exist
        
        # Assign departments to students
        cursor.execute("UPDATE students SET department_id = 1 WHERE student_id IN (1, 2, 3)")
        cursor.execute("UPDATE students SET department_id = 2 WHERE student_id IN (4, 5)")
        
        connection.commit()
        print("\n✅ Database updated successfully!")
        print(f"   - Added {len(all_courses)} courses (7 per department)")
        print(f"   - Assigned {len(faculty_assignments)} course-faculty mappings")
        print("   - Updated student department assignments")
        
except Exception as e:
    print(f"❌ Error: {e}")
    connection.rollback()
finally:
    connection.close()

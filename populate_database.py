import sys
sys.path.append('backend')
from database import db
from sqlalchemy import text
from app import app
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def clear_existing_data():
    """Clear existing enrollments, attendance, grades, courses, faculty, students data"""
    print("Clearing existing data...")
    with app.app_context():
        db.session.execute(text("DELETE FROM attendance"))
        db.session.execute(text("DELETE FROM grades"))
        db.session.execute(text("DELETE FROM enrollments"))
        db.session.execute(text("DELETE FROM courses"))
        db.session.execute(text("DELETE FROM faculty"))
        db.session.execute(text("DELETE FROM students"))
        db.session.execute(text("DELETE FROM users WHERE role != 'admin'"))
        db.session.commit()
        print("✓ Existing data cleared")

def create_students():
    """Create 15 students for each department"""
    print("\nCreating students...")
    
    departments = {
        1: ('CSE', 'Computer Science and Engineering'),
        2: ('ECE', 'Electronics and Communication Engineering'),
        3: ('ME', 'Mechanical Engineering'),
        4: ('CE', 'Civil Engineering'),
        5: ('EEE', 'Electrical and Electronics Engineering')
    }
    
    first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 
                   'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph',
                   'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy',
                   'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
                   'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna',
                   'Joshua', 'Michelle', 'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy',
                   'George', 'Melissa', 'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca',
                   'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen',
                   'Gary', 'Amy', 'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna',
                   'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Emma']
    
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
                  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
                  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
                  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
                  'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans',
                  'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
                  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez',
                  'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard']
    
    with app.app_context():
        name_index = 0
        for dept_id, (dept_code, dept_name) in departments.items():
            for i in range(1, 16):  # 15 students per department
                enrollment_num = f"2024{dept_code}{i:03d}"
                first_name = first_names[name_index % len(first_names)]
                last_name = last_names[name_index % len(last_names)]
                email = f"{first_name.lower()}.{last_name.lower()}.{dept_code.lower()}{i}@university.edu"
                
                # Create user
                user_query = text("""
                    INSERT INTO users (email, password_hash, role, first_name, last_name, phone, date_of_birth, is_active)
                    VALUES (:email, :password_hash, 'student', :first_name, :last_name, :phone, :dob, TRUE)
                """)
                
                db.session.execute(user_query, {
                    'email': email,
                    'password_hash': generate_password_hash('password123'),
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': f'98765{name_index:05d}',
                    'dob': f'200{random.randint(3, 5)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}'
                })
                
                # Get user_id
                user_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
                
                # Create student
                student_query = text("""
                    INSERT INTO students (user_id, enrollment_number, department_id, batch, admission_date)
                    VALUES (:user_id, :enrollment_number, :department_id, '2024-2028', '2024-08-01')
                """)
                
                db.session.execute(student_query, {
                    'user_id': user_id,
                    'enrollment_number': enrollment_num,
                    'department_id': dept_id
                })
                
                name_index += 1
            
            print(f"✓ Created 15 students for {dept_name}")
        
        db.session.commit()
        print(f"✓ Total students created: 75")

def create_faculty():
    """Create 3 faculty members for each department"""
    print("\nCreating faculty...")
    
    departments = {
        1: ('CSE', 'Computer Science and Engineering'),
        2: ('ECE', 'Electronics and Communication Engineering'),
        3: ('ME', 'Mechanical Engineering'),
        4: ('CE', 'Civil Engineering'),
        5: ('EEE', 'Electrical and Electronics Engineering')
    }
    
    faculty_first_names = ['Dr. John', 'Dr. Emily', 'Dr. Robert', 'Dr. Sarah', 'Dr. Michael',
                          'Dr. Jennifer', 'Dr. David', 'Dr. Lisa', 'Dr. James', 'Dr. Patricia',
                          'Dr. Daniel', 'Dr. Karen', 'Dr. Thomas', 'Dr. Nancy', 'Dr. Richard']
    
    designations = ['professor', 'associate_professor', 'assistant_professor']
    
    with app.app_context():
        faculty_index = 0
        for dept_id, (dept_code, dept_name) in departments.items():
            for i in range(3):  # 3 faculty per department
                first_name = faculty_first_names[faculty_index]
                last_name = f"{dept_code}Faculty{i+1}"
                email = f"faculty.{dept_code.lower()}{i+1}@university.edu"
                
                # Create user
                user_query = text("""
                    INSERT INTO users (email, password_hash, role, first_name, last_name, phone, date_of_birth, is_active)
                    VALUES (:email, :password_hash, 'faculty', :first_name, :last_name, :phone, :dob, TRUE)
                """)
                
                db.session.execute(user_query, {
                    'email': email,
                    'password_hash': generate_password_hash('password123'),
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': f'87654{faculty_index:05d}',
                    'dob': f'19{random.randint(70, 85)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}'
                })
                
                # Get user_id
                user_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
                
                # Create faculty
                faculty_query = text("""
                    INSERT INTO faculty (user_id, department_id, designation, qualification, joining_date, status)
                    VALUES (:user_id, :department_id, :designation, :qualification, :joining_date, 'active')
                """)
                
                db.session.execute(faculty_query, {
                    'user_id': user_id,
                    'department_id': dept_id,
                    'designation': designations[i],
                    'qualification': 'PhD in ' + dept_name.split(' and ')[0],
                    'joining_date': f'20{random.randint(10, 20)}-{random.randint(1, 12):02d}-01'
                })
                
                faculty_index += 1
            
            print(f"✓ Created 3 faculty for {dept_name}")
        
        db.session.commit()
        print(f"✓ Total faculty created: 15")

def create_courses():
    """Create 8 courses for each department"""
    print("\nCreating courses...")
    
    courses_data = {
        1: [  # CSE
            ('CS101', 'Introduction to Programming', 4),
            ('CS102', 'Data Structures', 4),
            ('CS103', 'Database Management Systems', 4),
            ('CS104', 'Computer Networks', 3),
            ('CS105', 'Operating Systems', 4),
            ('CS106', 'Software Engineering', 3),
            ('CS107', 'Web Technologies', 3),
            ('CS108', 'Machine Learning', 4)
        ],
        2: [  # ECE
            ('EC101', 'Basic Electronics', 4),
            ('EC102', 'Digital Electronics', 4),
            ('EC103', 'Analog Communication', 3),
            ('EC104', 'Digital Communication', 3),
            ('EC105', 'Microprocessors', 4),
            ('EC106', 'Signal Processing', 4),
            ('EC107', 'VLSI Design', 3),
            ('EC108', 'Embedded Systems', 4)
        ],
        3: [  # ME
            ('ME101', 'Engineering Mechanics', 4),
            ('ME102', 'Thermodynamics', 4),
            ('ME103', 'Fluid Mechanics', 4),
            ('ME104', 'Manufacturing Technology', 3),
            ('ME105', 'Machine Design', 4),
            ('ME106', 'Heat Transfer', 3),
            ('ME107', 'CAD/CAM', 3),
            ('ME108', 'Automobile Engineering', 3)
        ],
        4: [  # CE
            ('CE101', 'Engineering Drawing', 3),
            ('CE102', 'Surveying', 4),
            ('CE103', 'Building Materials', 3),
            ('CE104', 'Structural Analysis', 4),
            ('CE105', 'Concrete Technology', 4),
            ('CE106', 'Geotechnical Engineering', 4),
            ('CE107', 'Transportation Engineering', 3),
            ('CE108', 'Environmental Engineering', 3)
        ],
        5: [  # EEE
            ('EE101', 'Electrical Circuits', 4),
            ('EE102', 'Power Systems', 4),
            ('EE103', 'Control Systems', 4),
            ('EE104', 'Electrical Machines', 4),
            ('EE105', 'Power Electronics', 3),
            ('EE106', 'Renewable Energy Systems', 3),
            ('EE107', 'Instrumentation', 3),
            ('EE108', 'High Voltage Engineering', 4)
        ]
    }
    
    with app.app_context():
        course_faculty_map = {}  # Will store course_id -> faculty_id mapping
        
        for dept_id, courses in courses_data.items():
            # Get faculty for this department
            faculty_result = db.session.execute(text("""
                SELECT f.faculty_id FROM faculty f WHERE f.department_id = :dept_id
            """), {'dept_id': dept_id}).fetchall()
            
            faculty_ids = [f[0] for f in faculty_result]
            faculty_course_count = {fid: 0 for fid in faculty_ids}
            
            for course_code, course_name, credits in courses:
                # Assign faculty (each faculty gets 1-2 courses)
                available_faculty = [fid for fid, count in faculty_course_count.items() if count < 2]
                if not available_faculty:
                    available_faculty = faculty_ids  # Reset if all have 2
                
                assigned_faculty = random.choice(available_faculty)
                faculty_course_count[assigned_faculty] += 1
                
                # Create course
                course_query = text("""
                    INSERT INTO courses (course_code, course_name, credits, department_id, semester, faculty_id)
                    VALUES (:course_code, :course_name, :credits, :dept_id, 'Fall 2024', :faculty_id)
                """)
                
                db.session.execute(course_query, {
                    'course_code': course_code,
                    'course_name': course_name,
                    'credits': credits,
                    'dept_id': dept_id,
                    'faculty_id': assigned_faculty
                })
                
                course_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
                course_faculty_map[course_id] = assigned_faculty
            
            dept_name = ['CSE', 'ECE', 'ME', 'CE', 'EEE'][dept_id - 1]
            print(f"✓ Created 8 courses for {dept_name} with faculty assignments")
        
        db.session.commit()
        print(f"✓ Total courses created: 40")
        return course_faculty_map

def create_enrollments(course_faculty_map):
    """Enroll each student in 6 courses from their department"""
    print("\nCreating enrollments...")
    
    with app.app_context():
        departments = [1, 2, 3, 4, 5]
        total_enrollments = 0
        
        for dept_id in departments:
            # Get all students from this department
            students = db.session.execute(text("""
                SELECT s.student_id FROM students s WHERE s.department_id = :dept_id
            """), {'dept_id': dept_id}).fetchall()
            
            # Get all courses from this department
            courses = db.session.execute(text("""
                SELECT c.course_id FROM courses c WHERE c.department_id = :dept_id
            """), {'dept_id': dept_id}).fetchall()
            
            course_ids = [c[0] for c in courses]
            
            for student in students:
                student_id = student[0]
                
                # Randomly select 6 courses for this student
                selected_courses = random.sample(course_ids, 6)
                
                for course_id in selected_courses:
                    enrollment_query = text("""
                        INSERT INTO enrollments (student_id, course_id, enrollment_date, status, 
                                                attendance_percentage)
                        VALUES (:student_id, :course_id, '2024-08-15', 'enrolled', 0.00)
                    """)
                    
                    db.session.execute(enrollment_query, {
                        'student_id': student_id,
                        'course_id': course_id
                    })
                    
                    total_enrollments += 1
            
            dept_name = ['CSE', 'ECE', 'ME', 'CE', 'EEE'][dept_id - 1]
            print(f"✓ Enrolled 15 students in 6 courses each for {dept_name} (90 enrollments)")
        
        db.session.commit()
        print(f"✓ Total enrollments created: {total_enrollments}")

def main():
    print("="*80)
    print("POPULATING DATABASE WITH COMPREHENSIVE DATA")
    print("="*80)
    
    clear_existing_data()
    create_students()
    create_faculty()
    course_faculty_map = create_courses()
    create_enrollments(course_faculty_map)
    
    print("\n" + "="*80)
    print("DATABASE POPULATION COMPLETED SUCCESSFULLY!")
    print("="*80)
    print("\nSummary:")
    print("- 75 students (15 per department)")
    print("- 15 faculty members (3 per department)")
    print("- 40 courses (8 per department)")
    print("- 450 enrollments (each student enrolled in 6 courses)")
    print("- Each faculty member teaches 1-2 courses")
    print("\nAll accounts use password: password123")
    print("="*80)

if __name__ == "__main__":
    main()

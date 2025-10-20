from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text
from datetime import datetime

bp = Blueprint('students', __name__, url_prefix='/api/students')

# CREATE - Add new student using RAW SQL INSERT
@bp.route('/', methods=['POST'])
def create_student():
    """Create a new student using INSERT query"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'enrollment_number', 'department_id', 'batch', 'admission_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if enrollment number already exists using SELECT
        check_query = text("SELECT student_id FROM students WHERE enrollment_number = :enrollment_number")
        existing = db.session.execute(check_query, {'enrollment_number': data['enrollment_number']}).fetchone()
        if existing:
            return jsonify({'error': 'Enrollment number already exists'}), 400
        
        # Check if user_id already linked using SELECT
        check_user_query = text("SELECT student_id FROM students WHERE user_id = :user_id")
        existing_user = db.session.execute(check_user_query, {'user_id': data['user_id']}).fetchone()
        if existing_user:
            return jsonify({'error': 'User already linked to a student'}), 400
        
        # RAW SQL INSERT QUERY
        insert_query = text("""
            INSERT INTO students 
            (user_id, enrollment_number, department_id, semester, batch, admission_date, cgpa, status, created_at)
            VALUES 
            (:user_id, :enrollment_number, :department_id, :semester, :batch, :admission_date, :cgpa, :status, NOW())
        """)
        
        result = db.session.execute(insert_query, {
            'user_id': data['user_id'],
            'enrollment_number': data['enrollment_number'],
            'department_id': data['department_id'],
            'semester': data.get('semester', 1),
            'batch': data['batch'],
            'admission_date': data['admission_date'],
            'cgpa': data.get('cgpa', 0.00),
            'status': data.get('status', 'active')
        })
        
        db.session.commit()
        
        # Get the inserted student using SELECT
        select_query = text("SELECT * FROM students WHERE student_id = :id")
        student = db.session.execute(select_query, {'id': result.lastrowid}).fetchone()
        
        return jsonify({
            'message': 'Student created successfully',
            'student': dict(student._mapping)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Get all students using RAW SQL with JOINs
@bp.route('/', methods=['GET'])
def get_students():
    """Get all students using SELECT with JOIN"""
    try:
        department_id = request.args.get('department_id', type=int)
        status = request.args.get('status')
        semester = request.args.get('semester', type=int)
        batch = request.args.get('batch')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        offset = (page - 1) * per_page
        
        # Build WHERE clause dynamically
        conditions = []
        params = {'limit': per_page, 'offset': offset}
        
        if department_id:
            conditions.append("s.department_id = :department_id")
            params['department_id'] = department_id
        if status:
            conditions.append("s.status = :status")
            params['status'] = status
        if semester:
            conditions.append("s.semester = :semester")
            params['semester'] = semester
        if batch:
            conditions.append("s.batch = :batch")
            params['batch'] = batch
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        # RAW SQL SELECT with INNER JOIN
        query = text(f"""
            SELECT 
                s.student_id,
                s.user_id,
                s.enrollment_number,
                s.semester,
                s.batch,
                s.admission_date,
                s.cgpa,
                s.status,
                s.created_at,
                u.first_name,
                u.last_name,
                u.email,
                d.department_name,
                d.department_code
            FROM students s
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN departments d ON s.department_id = d.department_id
            {where_clause}
            ORDER BY s.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        # Count total records
        count_query = text(f"""
            SELECT COUNT(*) as total 
            FROM students s 
            {where_clause}
        """)
        
        students = db.session.execute(query, params).fetchall()
        total = db.session.execute(count_query, {k: v for k, v in params.items() if k not in ['limit', 'offset']}).scalar()
        
        return jsonify({
            'students': [dict(row._mapping) for row in students],
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page if total > 0 else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# READ - Get single student by ID using RAW SQL
@bp.route('/<int:student_id>', methods=['GET'])
def get_student(student_id):
    """Get a single student by ID using SELECT with JOIN"""
    try:
        query = text("""
            SELECT 
                s.student_id,
                s.user_id,
                s.enrollment_number,
                s.department_id,
                s.semester,
                s.batch,
                s.admission_date,
                s.cgpa,
                s.status,
                s.created_at,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.date_of_birth,
                d.department_name,
                d.department_code
            FROM students s
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN departments d ON s.department_id = d.department_id
            WHERE s.student_id = :student_id
        """)
        
        student = db.session.execute(query, {'student_id': student_id}).fetchone()
        
        if not student:
            return jsonify({'error': 'Student not found'}), 404
            
        return jsonify({'student': dict(student._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# READ - Get student by enrollment number using RAW SQL
@bp.route('/enrollment/<string:enrollment_number>', methods=['GET'])
def get_student_by_enrollment(enrollment_number):
    """Get a student by enrollment number using SELECT"""
    try:
        query = text("""
            SELECT 
                s.*,
                u.first_name,
                u.last_name,
                u.email,
                d.department_name
            FROM students s
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN departments d ON s.department_id = d.department_id
            WHERE s.enrollment_number = :enrollment_number
        """)
        
        student = db.session.execute(query, {'enrollment_number': enrollment_number}).fetchone()
        
        if not student:
            return jsonify({'error': 'Student not found'}), 404
            
        return jsonify({'student': dict(student._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE - Update student using RAW SQL
@bp.route('/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    """Update a student using UPDATE query"""
    try:
        data = request.get_json()
        
        # Build UPDATE query dynamically
        set_clauses = []
        params = {'student_id': student_id}
        
        if 'enrollment_number' in data:
            # Check if enrollment number already exists for another student
            check_query = text("""
                SELECT student_id FROM students 
                WHERE enrollment_number = :enrollment_number AND student_id != :student_id
            """)
            existing = db.session.execute(check_query, {
                'enrollment_number': data['enrollment_number'],
                'student_id': student_id
            }).fetchone()
            if existing:
                return jsonify({'error': 'Enrollment number already exists'}), 400
            
            set_clauses.append("enrollment_number = :enrollment_number")
            params['enrollment_number'] = data['enrollment_number']
            
        if 'department_id' in data:
            set_clauses.append("department_id = :department_id")
            params['department_id'] = data['department_id']
        if 'semester' in data:
            set_clauses.append("semester = :semester")
            params['semester'] = data['semester']
        if 'batch' in data:
            set_clauses.append("batch = :batch")
            params['batch'] = data['batch']
        if 'admission_date' in data:
            set_clauses.append("admission_date = :admission_date")
            params['admission_date'] = data['admission_date']
        if 'cgpa' in data:
            set_clauses.append("cgpa = :cgpa")
            params['cgpa'] = data['cgpa']
        if 'status' in data:
            set_clauses.append("status = :status")
            params['status'] = data['status']
        
        if not set_clauses:
            return jsonify({'error': 'No fields to update'}), 400
        
        # RAW SQL UPDATE
        update_query = text(f"""
            UPDATE students 
            SET {', '.join(set_clauses)}
            WHERE student_id = :student_id
        """)
        
        result = db.session.execute(update_query, params)
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'Student not found'}), 404
        
        # Get updated student
        select_query = text("SELECT * FROM students WHERE student_id = :student_id")
        student = db.session.execute(select_query, {'student_id': student_id}).fetchone()
        
        return jsonify({
            'message': 'Student updated successfully',
            'student': dict(student._mapping)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE - Delete student using RAW SQL
@bp.route('/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Delete a student using DELETE query"""
    try:
        # RAW SQL DELETE
        delete_query = text("""
            DELETE FROM students 
            WHERE student_id = :student_id
        """)
        
        result = db.session.execute(delete_query, {'student_id': student_id})
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'Student not found'}), 404
        
        return jsonify({'message': 'Student deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# PROFILE - Get student profile with user details using COMPLEX JOIN
@bp.route('/<int:student_id>/profile', methods=['GET'])
def get_student_profile(student_id):
    """Get complete student profile using complex SELECT with multiple JOINs"""
    try:
        # Complex query with multiple JOINs and aggregation
        query = text("""
            SELECT 
                s.student_id,
                s.enrollment_number,
                s.semester,
                s.batch,
                s.admission_date,
                s.cgpa,
                s.status,
                u.email,
                u.first_name,
                u.last_name,
                u.phone,
                u.date_of_birth,
                d.department_id,
                d.department_name,
                d.department_code,
                d.contact_email as dept_contact,
                COUNT(DISTINCT e.enrollment_id) as total_enrollments,
                AVG(e.attendance_percentage) as avg_attendance
            FROM students s
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN departments d ON s.department_id = d.department_id
            LEFT JOIN enrollments e ON s.student_id = e.student_id
            WHERE s.student_id = :student_id
            GROUP BY s.student_id, s.enrollment_number, s.semester, s.batch, s.admission_date,
                     s.cgpa, s.status, u.email, u.first_name, u.last_name, u.phone, u.date_of_birth,
                     d.department_id, d.department_name, d.department_code, d.contact_email
        """)
        
        profile = db.session.execute(query, {'student_id': student_id}).fetchone()
        
        if not profile:
            return jsonify({'error': 'Student not found'}), 404
        
        return jsonify({'profile': dict(profile._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ADVANCED QUERY - Students with low attendance
@bp.route('/low-attendance', methods=['GET'])
def students_with_low_attendance():
    """Get students with attendance below threshold using complex SELECT"""
    try:
        threshold = request.args.get('threshold', 75, type=float)
        
        query = text("""
            SELECT 
                s.student_id,
                s.enrollment_number,
                u.first_name,
                u.last_name,
                d.department_name,
                AVG(e.attendance_percentage) as avg_attendance,
                COUNT(e.enrollment_id) as total_courses
            FROM students s
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN departments d ON s.department_id = d.department_id
            INNER JOIN enrollments e ON s.student_id = e.student_id
            WHERE s.status = 'active'
            GROUP BY s.student_id, s.enrollment_number, u.first_name, u.last_name, d.department_name
            HAVING AVG(e.attendance_percentage) < :threshold
            ORDER BY avg_attendance ASC
        """)
        
        students = db.session.execute(query, {'threshold': threshold}).fetchall()
        
        return jsonify({
            'students': [dict(row._mapping) for row in students],
            'threshold': threshold,
            'count': len(students)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

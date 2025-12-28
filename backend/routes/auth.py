from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text
from werkzeug.security import check_password_hash

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST'])
def login():
    """Authenticate user with email, password, and role"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')
        
        if not email or not password or not role:
            return jsonify({'error': 'Email, password, and role are required'}), 400
        
        # Query user by email and role
        query = text("""
            SELECT user_id, email, password_hash, role, first_name, last_name, is_active
            FROM users
            WHERE email = :email AND role = :role
        """)
        
        user = db.session.execute(query, {'email': email, 'role': role}).fetchone()
        
        if not user:
            return jsonify({'error': 'Invalid credentials or role'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is inactive'}), 401
        
        # Verify password
        if not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Return user data (without password hash)
        user_data = {
            'user_id': user.user_id,
            'email': user.email,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name
        }
        
        # Add student_id or faculty_id based on role
        if user.role == 'student':
            student_query = text("SELECT student_id, department_id FROM students WHERE user_id = :user_id")
            student = db.session.execute(student_query, {'user_id': user.user_id}).fetchone()
            if student:
                user_data['student_id'] = student.student_id
                user_data['department_id'] = student.department_id
        elif user.role == 'faculty':
            faculty_query = text("SELECT faculty_id, department_id FROM faculty WHERE user_id = :user_id")
            faculty = db.session.execute(faculty_query, {'user_id': user.user_id}).fetchone()
            if faculty:
                user_data['faculty_id'] = faculty.faculty_id
                user_data['department_id'] = faculty.department_id
        
        return jsonify({
            'message': 'Login successful',
            'user': user_data
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

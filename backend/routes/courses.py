from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text

bp = Blueprint('courses', __name__, url_prefix='/api/courses')

# CREATE
@bp.route('/', methods=['POST'])
def create_course():
    try:
        data = request.get_json()
        
        insert_query = text("""
            INSERT INTO courses 
            (course_code, course_name, department_id, faculty_id, semester, credits, max_students, total_classes, created_at)
            VALUES 
            (:course_code, :course_name, :department_id, :faculty_id, :semester, :credits, :max_students, :total_classes, NOW())
        """)
        
        result = db.session.execute(insert_query, {
            'course_code': data['course_code'],
            'course_name': data['course_name'],
            'department_id': data['department_id'],
            'faculty_id': data['faculty_id'],
            'semester': data['semester'],
            'credits': data.get('credits', 3),
            'max_students': data.get('max_students', 60),
            'total_classes': data.get('total_classes', 45)
        })
        
        db.session.commit()
        
        select_query = text("SELECT * FROM courses WHERE course_id = :id")
        course = db.session.execute(select_query, {'id': result.lastrowid}).fetchone()
        
        return jsonify({
            'message': 'Course created successfully',
            'course': dict(course._mapping)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Get all
@bp.route('/', methods=['GET'])
def get_courses():
    try:
        query = text("""
            SELECT 
                c.*,
                d.department_name,
                f.employee_id,
                u.first_name as faculty_first_name,
                u.last_name as faculty_last_name
            FROM courses c
            INNER JOIN departments d ON c.department_id = d.department_id
            INNER JOIN faculty f ON c.faculty_id = f.faculty_id
            INNER JOIN users u ON f.user_id = u.user_id
            ORDER BY c.course_code
        """)
        
        courses = db.session.execute(query).fetchall()
        
        return jsonify({
            'courses': [dict(row._mapping) for row in courses]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# READ - Get by ID
@bp.route('/<int:course_id>', methods=['GET'])
def get_course(course_id):
    try:
        query = text("SELECT * FROM courses WHERE course_id = :id")
        course = db.session.execute(query, {'id': course_id}).fetchone()
        
        if not course:
            return jsonify({'error': 'Course not found'}), 404
            
        return jsonify({'course': dict(course._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE
@bp.route('/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    try:
        data = request.get_json()
        
        set_clauses = []
        params = {'course_id': course_id}
        
        if 'course_name' in data:
            set_clauses.append("course_name = :course_name")
            params['course_name'] = data['course_name']
        if 'faculty_id' in data:
            set_clauses.append("faculty_id = :faculty_id")
            params['faculty_id'] = data['faculty_id']
        if 'credits' in data:
            set_clauses.append("credits = :credits")
            params['credits'] = data['credits']
        
        if not set_clauses:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_query = text(f"""
            UPDATE courses 
            SET {', '.join(set_clauses)}
            WHERE course_id = :course_id
        """)
        
        db.session.execute(update_query, params)
        db.session.commit()
        
        return jsonify({'message': 'Course updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE
@bp.route('/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    try:
        delete_query = text("DELETE FROM courses WHERE course_id = :id")
        result = db.session.execute(delete_query, {'id': course_id})
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'Course not found'}), 404
        
        return jsonify({'message': 'Course deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

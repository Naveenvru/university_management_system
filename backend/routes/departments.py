from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text

bp = Blueprint('departments', __name__, url_prefix='/api/departments')

# CREATE
@bp.route('/', methods=['POST'])
def create_department():
    try:
        data = request.get_json()
        
        insert_query = text("""
            INSERT INTO departments 
            (department_code, department_name, head_of_department, contact_email, is_active, created_at)
            VALUES 
            (:department_code, :department_name, :head_of_department, :contact_email, :is_active, NOW())
        """)
        
        result = db.session.execute(insert_query, {
            'department_code': data['department_code'],
            'department_name': data['department_name'],
            'head_of_department': data.get('head_of_department'),
            'contact_email': data.get('contact_email'),
            'is_active': data.get('is_active', True)
        })
        
        db.session.commit()
        
        select_query = text("SELECT * FROM departments WHERE department_id = :id")
        dept = db.session.execute(select_query, {'id': result.lastrowid}).fetchone()
        
        return jsonify({
            'message': 'Department created successfully',
            'department': dict(dept._mapping)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Get all
@bp.route('/', methods=['GET'])
def get_departments():
    try:
        query = text("SELECT * FROM departments ORDER BY department_name")
        departments = db.session.execute(query).fetchall()
        
        return jsonify({
            'departments': [dict(row._mapping) for row in departments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# READ - Get by ID
@bp.route('/<int:department_id>', methods=['GET'])
def get_department(department_id):
    try:
        query = text("SELECT * FROM departments WHERE department_id = :id")
        dept = db.session.execute(query, {'id': department_id}).fetchone()
        
        if not dept:
            return jsonify({'error': 'Department not found'}), 404
            
        return jsonify({'department': dict(dept._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE
@bp.route('/<int:department_id>', methods=['PUT'])
def update_department(department_id):
    try:
        data = request.get_json()
        
        set_clauses = []
        params = {'department_id': department_id}
        
        if 'department_name' in data:
            set_clauses.append("department_name = :department_name")
            params['department_name'] = data['department_name']
        if 'head_of_department' in data:
            set_clauses.append("head_of_department = :head_of_department")
            params['head_of_department'] = data['head_of_department']
        if 'contact_email' in data:
            set_clauses.append("contact_email = :contact_email")
            params['contact_email'] = data['contact_email']
        
        if not set_clauses:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_query = text(f"""
            UPDATE departments 
            SET {', '.join(set_clauses)}
            WHERE department_id = :department_id
        """)
        
        db.session.execute(update_query, params)
        db.session.commit()
        
        return jsonify({'message': 'Department updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE
@bp.route('/<int:department_id>', methods=['DELETE'])
def delete_department(department_id):
    try:
        delete_query = text("DELETE FROM departments WHERE department_id = :id")
        result = db.session.execute(delete_query, {'id': department_id})
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'Department not found'}), 404
        
        return jsonify({'message': 'Department deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# STATISTICS
@bp.route('/<int:department_id>/stats', methods=['GET'])
def get_department_stats(department_id):
    try:
        query = text("""
            SELECT 
                d.department_id,
                d.department_name,
                COUNT(DISTINCT s.student_id) as total_students,
                COUNT(DISTINCT f.faculty_id) as total_faculty,
                COUNT(DISTINCT c.course_id) as total_courses
            FROM departments d
            LEFT JOIN students s ON d.department_id = s.department_id
            LEFT JOIN faculty f ON d.department_id = f.department_id
            LEFT JOIN courses c ON d.department_id = c.department_id
            WHERE d.department_id = :id
            GROUP BY d.department_id, d.department_name
        """)
        
        stats = db.session.execute(query, {'id': department_id}).fetchone()
        
        if not stats:
            return jsonify({'error': 'Department not found'}), 404
        
        return jsonify({'stats': dict(stats._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

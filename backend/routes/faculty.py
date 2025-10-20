from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text

bp = Blueprint('faculty', __name__, url_prefix='/api/faculty')

# CREATE
@bp.route('/', methods=['POST'])
def create_faculty():
    try:
        data = request.get_json()
        
        insert_query = text("""
            INSERT INTO faculty 
            (user_id, employee_id, department_id, designation, qualification, joining_date, status, created_at)
            VALUES 
            (:user_id, :employee_id, :department_id, :designation, :qualification, :joining_date, :status, NOW())
        """)
        
        result = db.session.execute(insert_query, {
            'user_id': data['user_id'],
            'employee_id': data['employee_id'],
            'department_id': data['department_id'],
            'designation': data['designation'],
            'qualification': data['qualification'],
            'joining_date': data['joining_date'],
            'status': data.get('status', 'active')
        })
        
        db.session.commit()
        
        select_query = text("SELECT * FROM faculty WHERE faculty_id = :id")
        faculty = db.session.execute(select_query, {'id': result.lastrowid}).fetchone()
        
        return jsonify({
            'message': 'Faculty created successfully',
            'faculty': dict(faculty._mapping)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Get all
@bp.route('/', methods=['GET'])
def get_faculty():
    try:
        query = text("""
            SELECT 
                f.*,
                u.first_name,
                u.last_name,
                u.email,
                d.department_name
            FROM faculty f
            INNER JOIN users u ON f.user_id = u.user_id
            INNER JOIN departments d ON f.department_id = d.department_id
            ORDER BY f.created_at DESC
        """)
        
        faculty = db.session.execute(query).fetchall()
        
        return jsonify({
            'faculty': [dict(row._mapping) for row in faculty]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# READ - Get by ID
@bp.route('/<int:faculty_id>', methods=['GET'])
def get_single_faculty(faculty_id):
    try:
        query = text("""
            SELECT f.*, u.first_name, u.last_name, u.email, d.department_name
            FROM faculty f
            INNER JOIN users u ON f.user_id = u.user_id
            INNER JOIN departments d ON f.department_id = d.department_id
            WHERE f.faculty_id = :id
        """)
        
        faculty = db.session.execute(query, {'id': faculty_id}).fetchone()
        
        if not faculty:
            return jsonify({'error': 'Faculty not found'}), 404
            
        return jsonify({'faculty': dict(faculty._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE
@bp.route('/<int:faculty_id>', methods=['PUT'])
def update_faculty(faculty_id):
    try:
        data = request.get_json()
        
        set_clauses = []
        params = {'faculty_id': faculty_id}
        
        if 'designation' in data:
            set_clauses.append("designation = :designation")
            params['designation'] = data['designation']
        if 'qualification' in data:
            set_clauses.append("qualification = :qualification")
            params['qualification'] = data['qualification']
        if 'status' in data:
            set_clauses.append("status = :status")
            params['status'] = data['status']
        
        if not set_clauses:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_query = text(f"""
            UPDATE faculty 
            SET {', '.join(set_clauses)}
            WHERE faculty_id = :faculty_id
        """)
        
        db.session.execute(update_query, params)
        db.session.commit()
        
        return jsonify({'message': 'Faculty updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE
@bp.route('/<int:faculty_id>', methods=['DELETE'])
def delete_faculty(faculty_id):
    try:
        delete_query = text("DELETE FROM faculty WHERE faculty_id = :id")
        result = db.session.execute(delete_query, {'id': faculty_id})
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'Faculty not found'}), 404
        
        return jsonify({'message': 'Faculty deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text

bp = Blueprint('enrollments', __name__, url_prefix='/api/enrollments')

# CREATE
@bp.route('/', methods=['POST'])
def create_enrollment():
    try:
        data = request.get_json()
        
        insert_query = text("""
            INSERT INTO enrollments 
            (student_id, course_id, enrollment_date, status, classes_attended, classes_held, attendance_percentage)
            VALUES 
            (:student_id, :course_id, NOW(), :status, :classes_attended, :classes_held, :attendance_percentage)
        """)
        
        result = db.session.execute(insert_query, {
            'student_id': data['student_id'],
            'course_id': data['course_id'],
            'status': data.get('status', 'enrolled'),
            'classes_attended': data.get('classes_attended', 0),
            'classes_held': data.get('classes_held', 0),
            'attendance_percentage': data.get('attendance_percentage', 0.00)
        })
        
        db.session.commit()
        
        select_query = text("SELECT * FROM enrollments WHERE enrollment_id = :id")
        enrollment = db.session.execute(select_query, {'id': result.lastrowid}).fetchone()
        
        return jsonify({
            'message': 'Enrollment created successfully',
            'enrollment': dict(enrollment._mapping)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Get all
@bp.route('/', methods=['GET'])
def get_enrollments():
    try:
        student_id = request.args.get('student_id', type=int)
        course_id = request.args.get('course_id', type=int)
        
        conditions = []
        params = {}
        
        if student_id:
            conditions.append("e.student_id = :student_id")
            params['student_id'] = student_id
        if course_id:
            conditions.append("e.course_id = :course_id")
            params['course_id'] = course_id
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        query = text(f"""
            SELECT 
                e.*,
                s.enrollment_number,
                u.first_name as student_first_name,
                u.last_name as student_last_name,
                c.course_code,
                c.course_name
            FROM enrollments e
            INNER JOIN students s ON e.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN courses c ON e.course_id = c.course_id
            {where_clause}
            ORDER BY e.enrollment_date DESC
        """)
        
        enrollments = db.session.execute(query, params).fetchall()
        
        return jsonify({
            'enrollments': [dict(row._mapping) for row in enrollments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# READ - Get by ID
@bp.route('/<int:enrollment_id>', methods=['GET'])
def get_enrollment(enrollment_id):
    try:
        query = text("SELECT * FROM enrollments WHERE enrollment_id = :id")
        enrollment = db.session.execute(query, {'id': enrollment_id}).fetchone()
        
        if not enrollment:
            return jsonify({'error': 'Enrollment not found'}), 404
            
        return jsonify({'enrollment': dict(enrollment._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE
@bp.route('/<int:enrollment_id>', methods=['PUT'])
def update_enrollment(enrollment_id):
    try:
        data = request.get_json()
        
        set_clauses = []
        params = {'enrollment_id': enrollment_id}
        
        if 'status' in data:
            set_clauses.append("status = :status")
            params['status'] = data['status']
        if 'classes_attended' in data:
            set_clauses.append("classes_attended = :classes_attended")
            params['classes_attended'] = data['classes_attended']
        if 'classes_held' in data:
            set_clauses.append("classes_held = :classes_held")
            params['classes_held'] = data['classes_held']
        
        # Auto-calculate attendance percentage
        if 'classes_attended' in data or 'classes_held' in data:
            # Get current values if not provided
            current_query = text("SELECT classes_attended, classes_held FROM enrollments WHERE enrollment_id = :id")
            current = db.session.execute(current_query, {'id': enrollment_id}).fetchone()
            
            attended = data.get('classes_attended', current.classes_attended)
            held = data.get('classes_held', current.classes_held)
            
            if held > 0:
                percentage = (attended / held) * 100
            else:
                percentage = 0.00
            
            set_clauses.append("attendance_percentage = :attendance_percentage")
            params['attendance_percentage'] = percentage
        
        if not set_clauses:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_query = text(f"""
            UPDATE enrollments 
            SET {', '.join(set_clauses)}
            WHERE enrollment_id = :enrollment_id
        """)
        
        db.session.execute(update_query, params)
        db.session.commit()
        
        return jsonify({'message': 'Enrollment updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE
@bp.route('/<int:enrollment_id>', methods=['DELETE'])
def delete_enrollment(enrollment_id):
    try:
        delete_query = text("DELETE FROM enrollments WHERE enrollment_id = :id")
        result = db.session.execute(delete_query, {'id': enrollment_id})
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'Enrollment not found'}), 404
        
        return jsonify({'message': 'Enrollment deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

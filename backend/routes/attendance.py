from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text

bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')

# CREATE
@bp.route('/', methods=['POST'])
def create_attendance():
    try:
        data = request.get_json()
        
        insert_query = text("""
            INSERT INTO attendance 
            (enrollment_id, attendance_date, status, marked_by, notes, created_at)
            VALUES 
            (:enrollment_id, :attendance_date, :status, :marked_by, :notes, NOW())
        """)
        
        result = db.session.execute(insert_query, {
            'enrollment_id': data['enrollment_id'],
            'attendance_date': data['attendance_date'],
            'status': data['status'],
            'marked_by': data['marked_by'],
            'notes': data.get('notes')
        })
        
        db.session.commit()
        
        select_query = text("SELECT * FROM attendance WHERE attendance_id = :id")
        attendance = db.session.execute(select_query, {'id': result.lastrowid}).fetchone()
        
        return jsonify({
            'message': 'Attendance marked successfully',
            'attendance': dict(attendance._mapping)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Get all
@bp.route('/', methods=['GET'])
def get_attendance():
    try:
        enrollment_id = request.args.get('enrollment_id', type=int)
        status = request.args.get('status')
        
        conditions = []
        params = {}
        
        if enrollment_id:
            conditions.append("a.enrollment_id = :enrollment_id")
            params['enrollment_id'] = enrollment_id
        if status:
            conditions.append("a.status = :status")
            params['status'] = status
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        query = text(f"""
            SELECT 
                a.*,
                s.enrollment_number,
                u.first_name as student_first_name,
                u.last_name as student_last_name,
                c.course_code,
                c.course_name
            FROM attendance a
            INNER JOIN enrollments e ON a.enrollment_id = e.enrollment_id
            INNER JOIN students s ON e.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN courses c ON e.course_id = c.course_id
            {where_clause}
            ORDER BY a.attendance_date DESC
        """)
        
        attendance = db.session.execute(query, params).fetchall()
        
        return jsonify({
            'attendance': [dict(row._mapping) for row in attendance]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# READ - Get by ID
@bp.route('/<int:attendance_id>', methods=['GET'])
def get_single_attendance(attendance_id):
    try:
        query = text("SELECT * FROM attendance WHERE attendance_id = :id")
        attendance = db.session.execute(query, {'id': attendance_id}).fetchone()
        
        if not attendance:
            return jsonify({'error': 'Attendance not found'}), 404
            
        return jsonify({'attendance': dict(attendance._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE
@bp.route('/<int:attendance_id>', methods=['PUT'])
def update_attendance(attendance_id):
    try:
        data = request.get_json()
        
        set_clauses = []
        params = {'attendance_id': attendance_id}
        
        if 'status' in data:
            set_clauses.append("status = :status")
            params['status'] = data['status']
        if 'notes' in data:
            set_clauses.append("notes = :notes")
            params['notes'] = data['notes']
        
        if not set_clauses:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_query = text(f"""
            UPDATE attendance 
            SET {', '.join(set_clauses)}
            WHERE attendance_id = :attendance_id
        """)
        
        db.session.execute(update_query, params)
        db.session.commit()
        
        return jsonify({'message': 'Attendance updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE
@bp.route('/<int:attendance_id>', methods=['DELETE'])
def delete_attendance(attendance_id):
    try:
        delete_query = text("DELETE FROM attendance WHERE attendance_id = :id")
        result = db.session.execute(delete_query, {'id': attendance_id})
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'Attendance not found'}), 404
        
        return jsonify({'message': 'Attendance deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# STATISTICS - Get attendance summary
@bp.route('/enrollment/<int:enrollment_id>/summary', methods=['GET'])
def get_attendance_summary(enrollment_id):
    try:
        query = text("""
            SELECT 
                COUNT(*) as total_classes,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused
            FROM attendance
            WHERE enrollment_id = :enrollment_id
        """)
        
        summary = db.session.execute(query, {'enrollment_id': enrollment_id}).fetchone()
        
        total = summary.total_classes or 0
        present = summary.present or 0
        percentage = (present / total * 100) if total > 0 else 0
        
        return jsonify({
            'summary': {
                'enrollment_id': enrollment_id,
                'total_classes': total,
                'present': present,
                'absent': summary.absent or 0,
                'late': summary.late or 0,
                'excused': summary.excused or 0,
                'attendance_percentage': round(percentage, 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

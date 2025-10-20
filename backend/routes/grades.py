from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text

bp = Blueprint('grades', __name__, url_prefix='/api/grades')

# CREATE
@bp.route('/', methods=['POST'])
def create_grade():
    try:
        data = request.get_json()
        
        internal = data.get('internal_marks', 0.00)
        midterm = data.get('midterm_marks', 0.00)
        final = data.get('final_marks', 0.00)
        total = internal + midterm + final
        
        max_marks = 100
        percentage = (total / max_marks) * 100 if max_marks > 0 else 0
        letter_grade = calculate_letter_grade(percentage)
        
        insert_query = text("""
            INSERT INTO grades 
            (enrollment_id, internal_marks, midterm_marks, final_marks, total_marks, percentage, letter_grade)
            VALUES 
            (:enrollment_id, :internal_marks, :midterm_marks, :final_marks, :total_marks, :percentage, :letter_grade)
        """)
        
        result = db.session.execute(insert_query, {
            'enrollment_id': data['enrollment_id'],
            'internal_marks': internal,
            'midterm_marks': midterm,
            'final_marks': final,
            'total_marks': total,
            'percentage': percentage,
            'letter_grade': letter_grade
        })
        
        db.session.commit()
        
        select_query = text("SELECT * FROM grades WHERE grade_id = :id")
        grade = db.session.execute(select_query, {'id': result.lastrowid}).fetchone()
        
        return jsonify({
            'message': 'Grade created successfully',
            'grade': dict(grade._mapping)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Get all
@bp.route('/', methods=['GET'])
def get_grades():
    try:
        query = text("""
            SELECT 
                g.*,
                s.enrollment_number,
                u.first_name as student_first_name,
                u.last_name as student_last_name,
                c.course_code,
                c.course_name
            FROM grades g
            INNER JOIN enrollments e ON g.enrollment_id = e.enrollment_id
            INNER JOIN students s ON e.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN courses c ON e.course_id = c.course_id
            ORDER BY g.percentage DESC
        """)
        
        grades = db.session.execute(query).fetchall()
        
        return jsonify({
            'grades': [dict(row._mapping) for row in grades]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# READ - Get by ID
@bp.route('/<int:grade_id>', methods=['GET'])
def get_grade(grade_id):
    try:
        query = text("SELECT * FROM grades WHERE grade_id = :id")
        grade = db.session.execute(query, {'id': grade_id}).fetchone()
        
        if not grade:
            return jsonify({'error': 'Grade not found'}), 404
            
        return jsonify({'grade': dict(grade._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE
@bp.route('/<int:grade_id>', methods=['PUT'])
def update_grade(grade_id):
    try:
        data = request.get_json()
        
        # Get current grade
        current_query = text("SELECT * FROM grades WHERE grade_id = :id")
        current = db.session.execute(current_query, {'id': grade_id}).fetchone()
        
        if not current:
            return jsonify({'error': 'Grade not found'}), 404
        
        # Calculate new totals
        internal = data.get('internal_marks', current.internal_marks)
        midterm = data.get('midterm_marks', current.midterm_marks)
        final = data.get('final_marks', current.final_marks)
        total = internal + midterm + final
        
        max_marks = 100
        percentage = (total / max_marks) * 100 if max_marks > 0 else 0
        letter_grade = calculate_letter_grade(percentage)
        
        update_query = text("""
            UPDATE grades 
            SET internal_marks = :internal_marks,
                midterm_marks = :midterm_marks,
                final_marks = :final_marks,
                total_marks = :total_marks,
                percentage = :percentage,
                letter_grade = :letter_grade
            WHERE grade_id = :grade_id
        """)
        
        db.session.execute(update_query, {
            'grade_id': grade_id,
            'internal_marks': internal,
            'midterm_marks': midterm,
            'final_marks': final,
            'total_marks': total,
            'percentage': percentage,
            'letter_grade': letter_grade
        })
        
        db.session.commit()
        
        return jsonify({'message': 'Grade updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE
@bp.route('/<int:grade_id>', methods=['DELETE'])
def delete_grade(grade_id):
    try:
        delete_query = text("DELETE FROM grades WHERE grade_id = :id")
        result = db.session.execute(delete_query, {'id': grade_id})
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'Grade not found'}), 404
        
        return jsonify({'message': 'Grade deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# STATISTICS - Grade distribution
@bp.route('/statistics/distribution', methods=['GET'])
def get_grade_distribution():
    try:
        query = text("""
            SELECT 
                letter_grade,
                COUNT(*) as count
            FROM grades
            GROUP BY letter_grade
            ORDER BY 
                CASE letter_grade
                    WHEN 'A+' THEN 1
                    WHEN 'A' THEN 2
                    WHEN 'A-' THEN 3
                    WHEN 'B+' THEN 4
                    WHEN 'B' THEN 5
                    WHEN 'B-' THEN 6
                    WHEN 'C+' THEN 7
                    WHEN 'C' THEN 8
                    WHEN 'C-' THEN 9
                    WHEN 'D' THEN 10
                    WHEN 'F' THEN 11
                    ELSE 12
                END
        """)
        
        distribution = db.session.execute(query).fetchall()
        
        result = {row.letter_grade: row.count for row in distribution}
        
        return jsonify({
            'distribution': result,
            'total': sum(result.values())
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# HELPER FUNCTION
def calculate_letter_grade(percentage):
    """Calculate letter grade based on percentage"""
    if percentage >= 90:
        return 'A+'
    elif percentage >= 85:
        return 'A'
    elif percentage >= 80:
        return 'A-'
    elif percentage >= 75:
        return 'B+'
    elif percentage >= 70:
        return 'B'
    elif percentage >= 65:
        return 'B-'
    elif percentage >= 60:
        return 'C+'
    elif percentage >= 55:
        return 'C'
    elif percentage >= 50:
        return 'C-'
    elif percentage >= 45:
        return 'D'
    else:
        return 'F'

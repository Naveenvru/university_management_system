from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text

bp = Blueprint('grades', __name__, url_prefix='/api/grades')

# CREATE
@bp.route('/', methods=['POST'])
def create_grade():
    try:
        data = request.get_json()
        
        # Get IA and Assignment marks
        ia_marks = data.get('ia_marks')  # out of 30
        assignment_marks = data.get('assignment_marks')  # out of 20
        external_marks = data.get('external_marks')  # out of 100
        
        # Calculate Final IA (IA + Assignment = max 50)
        final_ia_marks = None
        if ia_marks is not None and assignment_marks is not None:
            final_ia_marks = float(ia_marks) + float(assignment_marks)  # Direct addition (30 + 20 = 50)
        
        # Convert external marks from 100 to 50
        external_marks_50 = None
        if external_marks is not None:
            external_marks_50 = float(external_marks) / 2
        
        # Calculate total marks (out of 100)
        total_marks = 0
        if final_ia_marks is not None:
            total_marks += final_ia_marks
        if external_marks_50 is not None:
            total_marks += external_marks_50
        
        # Calculate percentage
        percentage = total_marks if total_marks > 0 else 0
        
        # Calculate letter grade
        letter_grade = calculate_letter_grade(percentage) if total_marks > 0 else None
        
        # Debug logging
        print(f"DEBUG CREATE - IA: {ia_marks}, Assignment: {assignment_marks}, External(input): {external_marks}")
        print(f"DEBUG CREATE - Final IA: {final_ia_marks}, External(stored): {external_marks_50}")
        print(f"DEBUG CREATE - Total: {total_marks}, Percentage: {percentage}, Grade: {letter_grade}")
        
        insert_query = text("""
            INSERT INTO grades 
            (enrollment_id, ia_marks, assignment_marks, final_ia_marks, external_marks, total_marks, percentage, letter_grade)
            VALUES 
            (:enrollment_id, :ia_marks, :assignment_marks, :final_ia_marks, :external_marks, :total_marks, :percentage, :letter_grade)
        """)
        
        result = db.session.execute(insert_query, {
            'enrollment_id': data['enrollment_id'],
            'ia_marks': ia_marks,
            'assignment_marks': assignment_marks,
            'final_ia_marks': final_ia_marks,
            'external_marks': external_marks_50,
            'total_marks': total_marks,
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
                e.student_id,
                e.course_id,
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
        
        # Get IA and Assignment marks
        ia_marks = data.get('ia_marks', current.ia_marks)  # out of 30
        assignment_marks = data.get('assignment_marks', current.assignment_marks)  # out of 20
        external_marks_input = data.get('external_marks')  # This will be out of 100 from frontend
        
        # Calculate Final IA (IA + Assignment = max 50)
        final_ia_marks = None
        if ia_marks is not None and assignment_marks is not None:
            final_ia_marks = float(ia_marks) + float(assignment_marks)  # Direct addition (30 + 20 = 50)
        
        # Convert external marks from 100 to 50 (only if provided in update)
        external_marks_50 = current.external_marks  # Keep existing if not updated
        if external_marks_input is not None:
            external_marks_50 = float(external_marks_input) / 2
        
        # Calculate total marks (out of 100)
        total_marks = 0
        if final_ia_marks is not None:
            total_marks += final_ia_marks
        if external_marks_50 is not None:
            total_marks += external_marks_50
        
        # Calculate percentage
        percentage = total_marks if total_marks > 0 else 0
        
        # Calculate letter grade
        letter_grade = calculate_letter_grade(percentage) if total_marks > 0 else None
        
        # Debug logging
        print(f"DEBUG UPDATE - IA: {ia_marks}, Assignment: {assignment_marks}, External(input): {external_marks_input}")
        print(f"DEBUG UPDATE - Final IA: {final_ia_marks}, External(stored): {external_marks_50}")
        print(f"DEBUG UPDATE - Total: {total_marks}, Percentage: {percentage}, Grade: {letter_grade}")
        
        update_query = text("""
            UPDATE grades 
            SET ia_marks = :ia_marks,
                assignment_marks = :assignment_marks,
                final_ia_marks = :final_ia_marks,
                external_marks = :external_marks,
                total_marks = :total_marks,
                percentage = :percentage,
                letter_grade = :letter_grade
            WHERE grade_id = :grade_id
        """)
        
        db.session.execute(update_query, {
            'grade_id': grade_id,
            'ia_marks': ia_marks,
            'assignment_marks': assignment_marks,
            'final_ia_marks': final_ia_marks,
            'external_marks': external_marks_50,
            'total_marks': total_marks,
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

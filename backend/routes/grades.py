from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text

bp = Blueprint('grades', __name__, url_prefix='/api/grades')

# CREATE
@bp.route('/', methods=['POST'])
def create_grade():
    try:
        data = request.get_json()
        
        # Get marks with new schema (internal1, internal2, external) - all out of 50
        internal1_marks = data.get('internal1_marks', 0.00)
        internal2_marks = data.get('internal2_marks', 0.00)
        external_marks = data.get('external_marks', 0.00)
        
        # Calculate average of two internals (out of 50)
        internal_average = (float(internal1_marks) + float(internal2_marks)) / 2
        
        # Calculate total marks (out of 100): average of internals + external
        total_marks = internal_average + float(external_marks)
        
        # Calculate percentage (already out of 100, so total_marks IS the percentage)
        percentage = total_marks if total_marks > 0 else 0
        
        # Calculate letter grade based on percentage
        letter_grade = calculate_letter_grade(percentage) if total_marks > 0 else None
        
        # Debug logging
        print(f"DEBUG CREATE - Internal1: {internal1_marks}, Internal2: {internal2_marks}, External: {external_marks}")
        print(f"DEBUG CREATE - Internal Avg: {internal_average:.2f}, Total: {total_marks:.2f}/100, Percentage: {percentage:.2f}%, Grade: {letter_grade}")
        
        insert_query = text("""
            INSERT INTO grades 
            (student_id, course_id, internal1_marks, internal2_marks, external_marks, total_marks, percentage, letter_grade)
            VALUES 
            (:student_id, :course_id, :internal1_marks, :internal2_marks, :external_marks, :total_marks, :percentage, :letter_grade)
        """)
        
        result = db.session.execute(insert_query, {
            'student_id': data['student_id'],
            'course_id': data['course_id'],
            'internal1_marks': internal1_marks,
            'internal2_marks': internal2_marks,
            'external_marks': external_marks,
            'total_marks': total_marks,
            'percentage': percentage,
            'letter_grade': letter_grade
        })
        
        db.session.commit()
        
        # Composite key - fetch by student_id and course_id
        select_query = text("SELECT * FROM grades WHERE student_id = :student_id AND course_id = :course_id")
        grade = db.session.execute(select_query, {
            'student_id': data['student_id'],
            'course_id': data['course_id']
        }).fetchone()
        
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
        student_id = request.args.get('student_id', type=int)
        course_id = request.args.get('course_id', type=int)
        
        conditions = []
        params = {}
        
        if student_id:
            conditions.append("g.student_id = :student_id")
            params['student_id'] = student_id
        if course_id:
            conditions.append("g.course_id = :course_id")
            params['course_id'] = course_id
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        query = text(f"""
            SELECT 
                g.*,
                s.enrollment_number,
                u.first_name as student_first_name,
                u.last_name as student_last_name,
                c.course_code,
                c.course_name
            FROM grades g
            INNER JOIN students s ON g.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            INNER JOIN courses c ON g.course_id = c.course_id
            {where_clause}
            ORDER BY g.percentage DESC
        """)
        
        grades = db.session.execute(query, params).fetchall()
        
        return jsonify({
            'grades': [dict(row._mapping) for row in grades]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# READ - Get by composite key (student_id, course_id)
@bp.route('/<int:student_id>/<int:course_id>', methods=['GET'])
def get_grade(student_id, course_id):
    try:
        query = text("SELECT * FROM grades WHERE student_id = :student_id AND course_id = :course_id")
        grade = db.session.execute(query, {
            'student_id': student_id,
            'course_id': course_id
        }).fetchone()
        
        if not grade:
            return jsonify({'error': 'Grade not found'}), 404
            
        return jsonify({'grade': dict(grade._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE
@bp.route('/<int:student_id>/<int:course_id>', methods=['PUT'])
def update_grade(student_id, course_id):
    try:
        data = request.get_json()
        
        # Get current grade
        current_query = text("SELECT * FROM grades WHERE student_id = :student_id AND course_id = :course_id")
        current = db.session.execute(current_query, {
            'student_id': student_id,
            'course_id': course_id
        }).fetchone()
        
        if not current:
            return jsonify({'error': 'Grade not found'}), 404
        
        # Get marks with new schema (internal1, internal2, external)
        internal1_marks = data.get('internal1_marks', current.internal1_marks)
        internal2_marks = data.get('internal2_marks', current.internal2_marks)
        external_marks = data.get('external_marks', current.external_marks)
        
        # Calculate average of two internals (out of 50)
        internal_average = 0
        if internal1_marks is not None and internal2_marks is not None:
            internal_average = (float(internal1_marks) + float(internal2_marks)) / 2
        
        # Calculate total marks (out of 100): average of internals + external
        total_marks = internal_average
        if external_marks is not None:
            total_marks += float(external_marks)
        
        # Calculate percentage (already out of 100, so total_marks IS the percentage)
        percentage = total_marks if total_marks > 0 else 0
        
        # Calculate letter grade
        letter_grade = calculate_letter_grade(percentage) if total_marks > 0 else None
        
        # Debug logging
        print(f"DEBUG UPDATE - Internal1: {internal1_marks}, Internal2: {internal2_marks}, External: {external_marks}")
        print(f"DEBUG UPDATE - Internal Avg: {internal_average:.2f}, Total: {total_marks:.2f}/100, Percentage: {percentage:.2f}%, Grade: {letter_grade}")
        
        update_query = text("""
            UPDATE grades 
            SET internal1_marks = :internal1_marks,
                internal2_marks = :internal2_marks,
                external_marks = :external_marks,
                total_marks = :total_marks,
                percentage = :percentage,
                letter_grade = :letter_grade
            WHERE student_id = :student_id AND course_id = :course_id
        """)
        
        db.session.execute(update_query, {
            'student_id': student_id,
            'course_id': course_id,
            'internal1_marks': internal1_marks,
            'internal2_marks': internal2_marks,
            'external_marks': external_marks,
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
@bp.route('/<int:student_id>/<int:course_id>', methods=['DELETE'])
def delete_grade(student_id, course_id):
    try:
        delete_query = text("DELETE FROM grades WHERE student_id = :student_id AND course_id = :course_id")
        result = db.session.execute(delete_query, {
            'student_id': student_id,
            'course_id': course_id
        })
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

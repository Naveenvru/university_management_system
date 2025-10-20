from flask import Flask, render_template, jsonify
from config import Config
from database import db

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize database with app
db.init_app(app)

# Import routes
from routes import users, departments, students, faculty, courses, enrollments, attendance, grades

# Register blueprints
app.register_blueprint(users.bp)
app.register_blueprint(departments.bp)
app.register_blueprint(students.bp)
app.register_blueprint(faculty.bp)
app.register_blueprint(courses.bp)
app.register_blueprint(enrollments.bp)
app.register_blueprint(attendance.bp)
app.register_blueprint(grades.bp)

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/api/health')
def health_check():
    """API health check"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'message': 'University Management System API is running'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

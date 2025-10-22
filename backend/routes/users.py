from flask import Blueprint, request, jsonify
from database import db
from sqlalchemy import text
from werkzeug.security import generate_password_hash

bp = Blueprint('users', __name__, url_prefix='/api/users')

# CREATE - Add new user using RAW SQL
@bp.route('/', methods=['POST'])
def create_user():
    """Create a new user using INSERT query"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'role', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if email already exists using SELECT
        check_query = text("SELECT user_id FROM users WHERE email = :email")
        existing = db.session.execute(check_query, {'email': data['email']}).fetchone()
        if existing:
            return jsonify({'error': 'Email already exists'}), 400
        
        # RAW SQL INSERT QUERY
        insert_query = text("""
            INSERT INTO users 
            (email, password_hash, role, first_name, last_name, phone, date_of_birth, is_active, created_at)
            VALUES 
            (:email, :password_hash, :role, :first_name, :last_name, :phone, :date_of_birth, :is_active, NOW())
        """)
        
        result = db.session.execute(insert_query, {
            'email': data['email'],
            'password_hash': generate_password_hash(data['password']),
            'role': data['role'],
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'phone': data.get('phone'),
            'date_of_birth': data.get('date_of_birth'),
            'is_active': data.get('is_active', True)
        })
        
        db.session.commit()
        
        # Get the inserted user using SELECT
        select_query = text("SELECT user_id, email, role, first_name, last_name, phone, date_of_birth, is_active, created_at FROM users WHERE user_id = :id")
        user = db.session.execute(select_query, {'id': result.lastrowid}).fetchone()
        
        return jsonify({
            'message': 'User created successfully',
            'user': dict(user._mapping)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Get all users using RAW SQL
@bp.route('/', methods=['GET'])
def get_users():
    """Get all users using SELECT with optional filtering"""
    try:
        print("=== GET /api/users/ called ===")
        role = request.args.get('role')
        is_active = request.args.get('is_active')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        offset = (page - 1) * per_page
        
        print(f"Params: role={role}, is_active={is_active}, page={page}, per_page={per_page}")
        
        # Build WHERE clause
        conditions = []
        params = {'limit': per_page, 'offset': offset}
        
        if role:
            conditions.append("role = :role")
            params['role'] = role
        if is_active is not None:
            conditions.append("is_active = :is_active")
            params['is_active'] = is_active.lower() == 'true'
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        # RAW SQL SELECT
        query = text(f"""
            SELECT user_id, email, role, first_name, last_name, phone, date_of_birth, is_active, created_at
            FROM users
            {where_clause}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        count_query = text(f"""
            SELECT COUNT(*) as total 
            FROM users
            {where_clause}
        """)
        
        print(f"Executing query with params: {params}")
        users = db.session.execute(query, params).fetchall()
        print(f"Fetched {len(users)} users")
        
        total = db.session.execute(count_query, {k: v for k, v in params.items() if k not in ['limit', 'offset']}).scalar()
        print(f"Total count: {total}")
        
        result = {
            'users': [dict(row._mapping) for row in users],
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page if total > 0 else 0
        }
        print(f"Returning result with {len(result['users'])} users")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"ERROR in get_users: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# READ - Get single user by ID using RAW SQL
@bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get a single user by ID using SELECT"""
    try:
        query = text("""
            SELECT user_id, email, role, first_name, last_name, phone, date_of_birth, is_active, created_at
            FROM users
            WHERE user_id = :user_id
        """)
        
        user = db.session.execute(query, {'user_id': user_id}).fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': dict(user._mapping)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 404


# UPDATE - Update user using RAW SQL
@bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update a user using UPDATE query"""
    try:
        data = request.get_json()
        
        # Build UPDATE query dynamically
        set_clauses = []
        params = {'user_id': user_id}
        
        if 'email' in data:
            # Check if email is already taken
            check_query = text("""
                SELECT user_id FROM users 
                WHERE email = :email AND user_id != :user_id
            """)
            existing = db.session.execute(check_query, {
                'email': data['email'],
                'user_id': user_id
            }).fetchone()
            if existing:
                return jsonify({'error': 'Email already exists'}), 400
            set_clauses.append("email = :email")
            params['email'] = data['email']
        
        if 'password' in data:
            set_clauses.append("password_hash = :password_hash")
            params['password_hash'] = generate_password_hash(data['password'])
        
        if 'role' in data:
            set_clauses.append("role = :role")
            params['role'] = data['role']
        if 'first_name' in data:
            set_clauses.append("first_name = :first_name")
            params['first_name'] = data['first_name']
        if 'last_name' in data:
            set_clauses.append("last_name = :last_name")
            params['last_name'] = data['last_name']
        if 'phone' in data:
            set_clauses.append("phone = :phone")
            params['phone'] = data['phone']
        if 'date_of_birth' in data:
            set_clauses.append("date_of_birth = :date_of_birth")
            params['date_of_birth'] = data['date_of_birth']
        if 'is_active' in data:
            set_clauses.append("is_active = :is_active")
            params['is_active'] = data['is_active']
        
        if not set_clauses:
            return jsonify({'error': 'No fields to update'}), 400
        
        # RAW SQL UPDATE
        update_query = text(f"""
            UPDATE users 
            SET {', '.join(set_clauses)}
            WHERE user_id = :user_id
        """)
        
        result = db.session.execute(update_query, params)
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'User not found'}), 404
        
        # Get updated user
        select_query = text("SELECT user_id, email, role, first_name, last_name, phone, date_of_birth, is_active, created_at FROM users WHERE user_id = :user_id")
        user = db.session.execute(select_query, {'user_id': user_id}).fetchone()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': dict(user._mapping)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE - Delete user using RAW SQL
@bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user using DELETE query"""
    try:
        # RAW SQL DELETE
        delete_query = text("""
            DELETE FROM users 
            WHERE user_id = :user_id
        """)
        
        result = db.session.execute(delete_query, {'user_id': user_id})
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# SEARCH - Search users by name or email using LIKE
@bp.route('/search', methods=['GET'])
def search_users():
    """Search users by name or email using LIKE operator"""
    try:
        query_string = request.args.get('q', '')
        
        if not query_string:
            return jsonify({'users': []}), 200
        
        # RAW SQL with LIKE for search
        search_query = text("""
            SELECT user_id, email, role, first_name, last_name, phone, is_active
            FROM users
            WHERE email LIKE :search 
               OR first_name LIKE :search 
               OR last_name LIKE :search
            LIMIT 20
        """)
        
        users = db.session.execute(search_query, {'search': f'%{query_string}%'}).fetchall()
        
        return jsonify({'users': [dict(row._mapping) for row in users]}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

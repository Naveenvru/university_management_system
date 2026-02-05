import datetime
from functools import wraps

import jwt
from flask import current_app, jsonify, request


def generate_access_token(user_id, role, expires_in_seconds):
    """Generate JWT access token."""
    now = datetime.datetime.utcnow()
    payload = {
        'sub': user_id,
        'role': role,
        'iat': now,
        'exp': now + datetime.timedelta(seconds=expires_in_seconds),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def decode_access_token(token):
    """Decode and validate JWT access token."""
    return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])


def token_required(allowed_roles=None):
    """Decorator to protect routes with bearer token auth."""

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Authorization token is missing'}), 401

            token = auth_header.split(' ', 1)[1].strip()
            if not token:
                return jsonify({'error': 'Authorization token is missing'}), 401

            try:
                payload = decode_access_token(token)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token has expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401

            request.user = {
                'user_id': payload.get('sub'),
                'role': payload.get('role'),
            }

            if allowed_roles and request.user['role'] not in allowed_roles:
                return jsonify({'error': 'Forbidden: insufficient permissions'}), 403

            return view_func(*args, **kwargs)

        return wrapper

    return decorator

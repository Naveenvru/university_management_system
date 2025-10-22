import os
from urllib.parse import quote_plus

# Get password first - TEMPORARY: Hardcoded for development
# TODO: Change back to environment variable before pushing to GitHub
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or 'Naveen@7259'
MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
MYSQL_PORT = int(os.environ.get('MYSQL_PORT') or 3306)
MYSQL_DB = os.environ.get('MYSQL_DB') or 'university_system'

class Config:
    """Flask configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database configuration
    MYSQL_HOST = MYSQL_HOST
    MYSQL_PORT = MYSQL_PORT
    MYSQL_USER = MYSQL_USER
    MYSQL_PASSWORD = MYSQL_PASSWORD
    MYSQL_DB = MYSQL_DB
    
    # SQLAlchemy configuration - Build URI using the module-level variables
    SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{MYSQL_USER}:{quote_plus(MYSQL_PASSWORD)}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = True  # Log SQL queries (disable in production)
    
    # Pagination
    ITEMS_PER_PAGE = 20
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour

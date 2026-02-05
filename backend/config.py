import os
from urllib.parse import quote_plus


class Config:
    """Flask configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

    # Database configuration
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT') or 3306)
    MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or 'YOUR_MYSQL_PASSWORD_HERE'
    MYSQL_DB = os.environ.get('MYSQL_DB') or 'university_system'

    # SQLAlchemy configuration
    SQLALCHEMY_DATABASE_URI = (
        f'mysql+pymysql://{MYSQL_USER}:{quote_plus(MYSQL_PASSWORD)}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.environ.get('SQLALCHEMY_ECHO', 'false').lower() == 'true'

    # Token configuration
    ACCESS_TOKEN_EXPIRES_SECONDS = int(os.environ.get('ACCESS_TOKEN_EXPIRES_SECONDS') or 3600)

    # Pagination
    ITEMS_PER_PAGE = 20

    # Session configuration
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour

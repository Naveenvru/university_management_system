from werkzeug.security import generate_password_hash
import mysql.connector
import os

# Database connection
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': os.environ.get('MYSQL_PASSWORD', 'Naveen@7259'),
    'database': 'university_system'
}

# Generate password hash for "password123"
password = "password123"
password_hash = generate_password_hash(password)

print(f"Generated password hash for '{password}':")
print(password_hash)

# Update admin password
try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    update_query = "UPDATE users SET password_hash = %s WHERE email = 'admin@university.edu' AND role = 'admin'"
    cursor.execute(update_query, (password_hash,))
    conn.commit()
    
    print(f"\n✅ Admin password updated successfully!")
    print(f"Rows affected: {cursor.rowcount}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")

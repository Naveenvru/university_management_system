#!/usr/bin/env python3
"""
Migration script to update grades table from old schema to new schema.

OLD SCHEMA (150-point system):
- internal_marks (0-50)
- midterm_marks (0-50)
- final_marks (0-50)
- total = internal + midterm + final (0-150)
- percentage = (total/150)*100

NEW SCHEMA (100-point system):
- internal1_marks (0-50)
- internal2_marks (0-50)
- external_marks (0-50)
- total = (internal1 + internal2)/2 + external (0-100)
- percentage = total (already out of 100)

This script will:
1. Rename columns: internal_marks -> internal1_marks, midterm_marks -> internal2_marks, final_marks -> external_marks
2. Recalculate total_marks and percentage for existing records
3. Update letter grades based on new percentage
"""

import mysql.connector
import sys

# Import database config
try:
    from backend.config import DB_CONFIG
except ImportError:
    print("ERROR: Could not import DB_CONFIG from backend.config")
    print("Make sure backend/config.py exists with DB_CONFIG dictionary")
    sys.exit(1)


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


def migrate_grades():
    """Migrate grades table from old schema to new schema"""
    try:
        # Connect to database
        print("Connecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Check if old schema exists
        cursor.execute("SHOW COLUMNS FROM grades LIKE 'internal_marks'")
        if not cursor.fetchone():
            print("INFO: grades table already uses new schema (no 'internal_marks' column found)")
            print("Migration not needed. Exiting.")
            cursor.close()
            conn.close()
            return
        
        print("Old schema detected. Starting migration...")
        
        # Step 1: Create backup of grades table
        print("\nStep 1: Creating backup table 'grades_backup_old_schema'...")
        cursor.execute("DROP TABLE IF EXISTS grades_backup_old_schema")
        cursor.execute("CREATE TABLE grades_backup_old_schema AS SELECT * FROM grades")
        backup_count = cursor.rowcount
        print(f"✓ Backup created with {backup_count} records")
        
        # Step 2: Fetch all existing grades
        print("\nStep 2: Fetching existing grades...")
        cursor.execute("SELECT student_id, course_id, internal_marks, midterm_marks, final_marks FROM grades")
        existing_grades = cursor.fetchall()
        print(f"✓ Found {len(existing_grades)} grade records")
        
        # Step 3: Rename columns
        print("\nStep 3: Renaming columns...")
        cursor.execute("ALTER TABLE grades CHANGE COLUMN internal_marks internal1_marks DECIMAL(6,2) DEFAULT 0.00")
        print("✓ Renamed internal_marks -> internal1_marks")
        
        cursor.execute("ALTER TABLE grades CHANGE COLUMN midterm_marks internal2_marks DECIMAL(6,2) DEFAULT 0.00")
        print("✓ Renamed midterm_marks -> internal2_marks")
        
        cursor.execute("ALTER TABLE grades CHANGE COLUMN final_marks external_marks DECIMAL(6,2) DEFAULT 0.00")
        print("✓ Renamed final_marks -> external_marks")
        
        # Step 4: Recalculate totals and percentages
        print("\nStep 4: Recalculating totals and percentages...")
        updated_count = 0
        for grade in existing_grades:
            internal1 = float(grade['internal_marks'] or 0)
            internal2 = float(grade['midterm_marks'] or 0)
            external = float(grade['final_marks'] or 0)
            
            # Calculate new total: average of internals + external
            internal_avg = (internal1 + internal2) / 2
            total_marks = internal_avg + external
            percentage = total_marks  # Already out of 100
            letter_grade = calculate_letter_grade(percentage)
            
            # Update record
            update_query = """
                UPDATE grades 
                SET total_marks = %s,
                    percentage = %s,
                    letter_grade = %s
                WHERE student_id = %s AND course_id = %s
            """
            cursor.execute(update_query, (
                total_marks,
                percentage,
                letter_grade,
                grade['student_id'],
                grade['course_id']
            ))
            updated_count += 1
        
        conn.commit()
        print(f"✓ Updated {updated_count} records with new calculations")
        
        # Step 5: Verify migration
        print("\nStep 5: Verifying migration...")
        cursor.execute("SELECT COUNT(*) as count FROM grades")
        new_count = cursor.fetchone()['count']
        
        if new_count == len(existing_grades):
            print(f"✓ Verification successful: {new_count} records in new schema")
        else:
            print(f"⚠ WARNING: Record count mismatch! Old: {len(existing_grades)}, New: {new_count}")
        
        # Display sample of migrated data
        print("\nSample of migrated data (first 5 records):")
        cursor.execute("""
            SELECT student_id, course_id, internal1_marks, internal2_marks, external_marks, 
                   total_marks, percentage, letter_grade 
            FROM grades 
            LIMIT 5
        """)
        samples = cursor.fetchall()
        
        print("\n{:<12} {:<10} {:<11} {:<11} {:<11} {:<11} {:<11} {:<6}".format(
            "Student ID", "Course ID", "Internal1", "Internal2", "External", "Total", "Percent", "Grade"
        ))
        print("-" * 90)
        
        for sample in samples:
            print("{:<12} {:<10} {:<11} {:<11} {:<11} {:<11} {:<11} {:<6}".format(
                sample['student_id'],
                sample['course_id'],
                f"{sample['internal1_marks']:.2f}",
                f"{sample['internal2_marks']:.2f}",
                f"{sample['external_marks']:.2f}",
                f"{sample['total_marks']:.2f}",
                f"{sample['percentage']:.2f}%",
                sample['letter_grade'] or 'N/A'
            ))
        
        print("\n" + "="*90)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*90)
        print("\nNOTE: Original data backed up in 'grades_backup_old_schema' table")
        print("You can drop this backup table once you've verified everything works correctly:")
        print("  DROP TABLE grades_backup_old_schema;")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"\n❌ DATABASE ERROR: {err}")
        print("Migration failed. Database changes may be partially applied.")
        print("Check the backup table 'grades_backup_old_schema' if it exists.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print("="*90)
    print("GRADES TABLE MIGRATION SCRIPT")
    print("From: 150-point system (internal + midterm + final)")
    print("To:   100-point system (avg of 2 internals + external)")
    print("="*90)
    
    response = input("\nThis will modify your grades table. Continue? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("Migration cancelled.")
        sys.exit(0)
    
    migrate_grades()

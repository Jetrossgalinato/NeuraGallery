import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

# Load environment variables
load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "admin")
POSTGRES_DB = os.getenv("POSTGRES_DB", "neuradb")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

DATABASE_URL = f"dbname={POSTGRES_DB} user={POSTGRES_USER} password={POSTGRES_PASSWORD} host={POSTGRES_HOST} port={POSTGRES_PORT}"

def init_database():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            hashed_password VARCHAR(200) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            filename VARCHAR(255) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()

@contextmanager
def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()

def create_user(username: str, email: str, hashed_password: str):
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, hashed_password) VALUES (%s, %s, %s) RETURNING id",
            (username, email, hashed_password)
        )
        user_id = cur.fetchone()["id"]
        conn.commit()
        cur.close()
        return user_id

def get_user_by_username(username: str):
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()
        return user

def get_user_by_email(email: str):
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        return user

def create_image(user_id: int, filename: str, original_filename: str, file_path: str, file_size: int, mime_type: str):
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO images (user_id, filename, original_filename, file_path, file_size, mime_type) 
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (user_id, filename, original_filename, file_path, file_size, mime_type)
        )
        image_id = cur.fetchone()["id"]
        conn.commit()
        cur.close()
        return image_id

def get_user_images(user_id: int):
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM images WHERE user_id = %s ORDER BY uploaded_at DESC", (user_id,))
        images = cur.fetchall()
        cur.close()
        return images

def delete_image(image_id: int, user_id: int):
    """Delete a single image from the database if it belongs to the user"""
    with get_db_connection() as conn:
        cur = conn.cursor()
        
        # First check if image exists and belongs to user
        cur.execute("SELECT file_path FROM images WHERE id = %s AND user_id = %s", (image_id, user_id))
        image = cur.fetchone()
        
        if not image:
            return False, "Image not found or access denied"
            
        # Delete the image from database
        cur.execute("DELETE FROM images WHERE id = %s AND user_id = %s", (image_id, user_id))
        conn.commit()
        
        # Return the file path so we can delete the physical file
        return True, image["file_path"]

def delete_multiple_images(image_ids: list, user_id: int):
    """Delete multiple images from the database if they belong to the user"""
    if not image_ids:
        return [], "No images specified for deletion"
        
    with get_db_connection() as conn:
        cur = conn.cursor()
        
        # Get all file paths for images that exist and belong to the user
        placeholders = ','.join(['%s'] * len(image_ids))
        cur.execute(
            f"SELECT id, file_path FROM images WHERE id IN ({placeholders}) AND user_id = %s",
            [*image_ids, user_id]
        )
        images = cur.fetchall()
        
        if not images:
            return [], "No matching images found or access denied"
            
        # Extract IDs and file paths
        found_ids = [img["id"] for img in images]
        file_paths = [img["file_path"] for img in images]
        
        # Delete the images from database
        placeholders = ','.join(['%s'] * len(found_ids))
        cur.execute(
            f"DELETE FROM images WHERE id IN ({placeholders}) AND user_id = %s",
            [*found_ids, user_id]
        )
        conn.commit()
        
        # Return the file paths so we can delete the physical files
        return file_paths, f"Successfully deleted {len(file_paths)} images"

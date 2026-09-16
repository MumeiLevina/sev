#!/usr/bin/env python3
"""
Kinetic Tech — Cloud Database Setup & Migration Tool
────────────────────────────────────────────────────
Usage:
    python deploy/database/setup_db.py [DATABASE_URL]

Features:
1. Connects to any remote PostgreSQL database (Supabase, Neon, Render, VPS).
2. Executes table creation, indexes, and schema definitions.
3. Automatically migrates local users from .local_users_db.json to PostgreSQL.
4. Verifies connection health and queries stats.
"""

import sys
import os
import json
import uuid
from datetime import datetime, timezone

# Add subtitle-service/api to python path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
API_DIR = os.path.join(ROOT_DIR, 'subtitle-service', 'api')
sys.path.insert(0, API_DIR)

# Resolve DATABASE_URL
db_url = None
if len(sys.argv) > 1 and sys.argv[1].startswith('postgres'):
    db_url = sys.argv[1]
elif os.getenv('DATABASE_URL'):
    db_url = os.getenv('DATABASE_URL')
else:
    # Try reading from subtitle-service/.env
    env_file = os.path.join(ROOT_DIR, 'subtitle-service', '.env')
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('DATABASE_URL=') and not line.startswith('#'):
                    db_url = line.split('=', 1)[1].strip().strip('"').strip("'")
                    break

if not db_url:
    print("\n⚠️ [Error] No DATABASE_URL provided!")
    print("Usage: python deploy/database/setup_db.py \"postgresql://user:password@host:5432/dbname\"")
    print("Or set DATABASE_URL in your environment or in subtitle-service/.env\n")
    sys.exit(1)

# Mask password for display
safe_url = db_url
if '@' in safe_url and ':' in safe_url:
    try:
        parts = safe_url.split('@')
        creds = parts[0].split('//')
        user = creds[1].split(':')[0]
        safe_url = f"{creds[0]}//{user}:****@{parts[1]}"
    except Exception:
        pass

print("═══════════════════════════════════════════════════════════")
print("🚀 KINETIC TECH — POSTGRESQL DATABASE INITIALIZER")
print("═══════════════════════════════════════════════════════════")
print(f"Target Database: {safe_url}\n")

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    from models import Base, User, RefreshToken, TranscriptionJob, UsageLog, Transaction
    from auth import hash_password
except ImportError as e:
    print(f"❌ Missing Python dependencies: {e}")
    print("Please install requirements: pip install sqlalchemy psycopg2-binary passlib bcrypt\n")
    sys.exit(1)

print("1. Connecting to PostgreSQL engine...")
try:
    engine = create_engine(db_url, pool_pre_ping=True)
    with engine.connect() as conn:
        version = conn.execute(text("SELECT version();")).scalar()
        print(f"   ✓ Connection established successfully!")
        print(f"   ✓ PostgreSQL Version: {version.split(',')[0]}\n")
except Exception as e:
    print(f"❌ Connection failed: {e}\n")
    sys.exit(1)

print("2. Creating Tables & Indexes from SQLAlchemy Models...")
try:
    Base.metadata.create_all(bind=engine)
    print("   ✓ Tables verified/created: users, refresh_tokens, transcription_jobs, usage_logs, transactions\n")
except Exception as e:
    print(f"⚠️ Notice during create_all: {e}")

print("3. Syncing Local User Accounts to PostgreSQL...")
local_db_path = os.path.join(ROOT_DIR, '.local_users_db.json')
synced_count = 0

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    if os.path.exists(local_db_path):
        with open(local_db_path, 'r', encoding='utf-8') as f:
            local_users = json.load(f)

        for email_key, acc_data in local_users.items():
            email = email_key.strip().lower()
            existing = db.query(User).filter(User.email.ilike(email)).first()
            user_info = acc_data.get('user', {})

            if not existing:
                # Create user in PostgreSQL
                new_user = User(
                    email=email,
                    display_name=user_info.get('display_name') or email.split('@')[0],
                    password_hash=hash_password('123456'), # Default fallback password
                    quota_used_seconds=user_info.get('quota_used_seconds', 0),
                    quota_limit_seconds=user_info.get('quota_limit_seconds', 3600),
                    created_at=datetime.now(timezone.utc)
                )
                db.add(new_user)
                synced_count += 1
                print(f"   ✓ Migrated local user: {email}")
            else:
                print(f"   • User already exists in DB: {email}")

        db.commit()
    else:
        print("   • No local .local_users_db.json file found to migrate.")
except Exception as e:
    db.rollback()
    print(f"⚠️ Error during user sync: {e}")
finally:
    total_users = db.query(User).count()
    db.close()

print(f"\n═══════════════════════════════════════════════════════════")
print(f"🎉 DATABASE SETUP COMPLETE!")
print(f"   - Migrated users: {synced_count}")
print(f"   - Total users in database: {total_users}")
print(f"═══════════════════════════════════════════════════════════\n")

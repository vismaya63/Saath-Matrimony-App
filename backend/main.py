
import sqlite3
import hashlib
import secrets
import hmac
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

app = FastAPI(title="Saath Matrimony API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = "saath_accounts.db"


@contextmanager
def db_connection():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with db_connection() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE REFERENCES users(id),
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                gender TEXT NOT NULL,
                location TEXT NOT NULL,
                bio TEXT NOT NULL DEFAULT '',
                interests TEXT NOT NULL DEFAULT '',
                photo_url TEXT NOT NULL DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS swipes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_profile INTEGER NOT NULL REFERENCES profiles(id),
                to_profile INTEGER NOT NULL REFERENCES profiles(id),
                liked INTEGER NOT NULL,
                UNIQUE(from_profile, to_profile)
            );
        """)

        # Example profiles for discovery.
        # These are demo profiles, not real registered users.
        count = db.execute(
            "SELECT COUNT(*) FROM profiles"
        ).fetchone()[0]

        if count == 0:
            demo_profiles = [
                ("Ananya", 25, "Woman", "Kochi",
                 "Software engineer who loves travelling.",
                 "Travel, Music, Reading", ""),
                ("Arjun", 27, "Man", "Thiruvananthapuram",
                 "Enjoys technology, nature and photography.",
                 "Coding, Nature, Photography", ""),
                ("Meera", 24, "Woman", "Kannur",
                 "A cheerful person who enjoys books and music.",
                 "Books, Music, Cooking", ""),
                ("Rahul", 28, "Man", "Kozhikode",
                 "Looking for a meaningful connection.",
                 "Travel, Movies, Fitness", ""),
                ("Diya", 26, "Woman", "Thrissur",
                 "Loves art, food and exploring new places.",
                 "Art, Food, Travel", ""),
            ]

            db.executemany("""
                INSERT INTO profiles
                (name, age, gender, location, bio, interests, photo_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, demo_profiles)


init_db()


class RegisterData(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class ProfileData(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    age: int = Field(ge=18, le=100)
    gender: str = Field(min_length=1, max_length=30)
    location: str = Field(min_length=2, max_length=100)
    bio: str = Field(default="", max_length=500)
    interests: str = Field(default="", max_length=300)
    photo_url: str = Field(default="", max_length=1000)


class SwipeData(BaseModel):
    profile_id: int
    liked: bool


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode(), salt=salt, n=2**14, r=8, p=1
    )
    return salt.hex() + ":" + digest.hex()


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split(":")
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.scrypt(
            password.encode(), salt=salt, n=2**14, r=8, p=1
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def get_current_user(
    authorization: str | None = Header(default=None),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Please log in")

    token = authorization[7:].strip()

    with db_connection() as db:
        user = db.execute("""
            SELECT users.id, users.email
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
        """, (token,)).fetchone()

    if not user:
        raise HTTPException(401, "Session expired. Please log in again")

    return dict(user)


def current_profile_id(user=Depends(get_current_user)):
    with db_connection() as db:
        profile = db.execute(
            "SELECT id FROM profiles WHERE user_id = ?",
            (user["id"],)
        ).fetchone()

    return profile["id"] if profile else None


@app.get("/")
def home():
    return {"message": "Saath API is running"}


@app.post("/api/register")
def register(data: RegisterData):
    email = str(data.email).lower().strip()
    password_hash = hash_password(data.password)

    try:
        with db_connection() as db:
            cursor = db.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (email, password_hash)
            )
            user_id = cursor.lastrowid
            token = secrets.token_urlsafe(32)
            db.execute(
                "INSERT INTO sessions (token, user_id) VALUES (?, ?)",
                (token, user_id)
            )
    except sqlite3.IntegrityError:
        raise HTTPException(
            409, "This email is already registered. Please log in."
        )

    return {"token": token, "email": email}


@app.post("/api/login")
def login(data: RegisterData):
    email = str(data.email).lower().strip()

    with db_connection() as db:
        user = db.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()

        if not user or not verify_password(
            data.password, user["password_hash"]
        ):
            raise HTTPException(401, "Incorrect email or password")

        token = secrets.token_urlsafe(32)
        db.execute(
            "INSERT INTO sessions (token, user_id) VALUES (?, ?)",
            (token, user["id"])
        )

    return {"token": token, "email": email}


@app.post("/api/logout")
def logout(user=Depends(get_current_user),
           authorization: str | None = Header(default=None)):
    token = authorization[7:].strip()

    with db_connection() as db:
        db.execute("DELETE FROM sessions WHERE token = ?", (token,))

    return {"message": "Logged out"}


@app.get("/api/me")
def me(user=Depends(get_current_user)):
    with db_connection() as db:
        profile = db.execute(
            "SELECT * FROM profiles WHERE user_id = ?",
            (user["id"],)
        ).fetchone()

    return {
        "email": user["email"],
        "profile": dict(profile) if profile else None
    }


@app.post("/api/profiles")
def create_profile(
    data: ProfileData,
    user=Depends(get_current_user)
):
    with db_connection() as db:
        existing = db.execute(
            "SELECT id FROM profiles WHERE user_id = ?",
            (user["id"],)
        ).fetchone()

        if existing:
            raise HTTPException(
                409, "You already have a profile. Edit your existing one."
            )

        cursor = db.execute("""
            INSERT INTO profiles
            (user_id, name, age, gender, location, bio, interests, photo_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user["id"], data.name, data.age, data.gender,
            data.location, data.bio, data.interests, data.photo_url
        ))

        profile = db.execute(
            "SELECT * FROM profiles WHERE id = ?",
            (cursor.lastrowid,)
        ).fetchone()

    return dict(profile)


@app.put("/api/profiles/me")
def update_profile(
    data: ProfileData,
    user=Depends(get_current_user)
):
    with db_connection() as db:
        existing = db.execute(
            "SELECT id FROM profiles WHERE user_id = ?",
            (user["id"],)
        ).fetchone()

        if not existing:
            raise HTTPException(404, "Create your profile first")

        db.execute("""
            UPDATE profiles
            SET name=?, age=?, gender=?, location=?, bio=?,
                interests=?, photo_url=?
            WHERE user_id=?
        """, (
            data.name, data.age, data.gender, data.location,
            data.bio, data.interests, data.photo_url, user["id"]
        ))

        profile = db.execute(
            "SELECT * FROM profiles WHERE user_id = ?",
            (user["id"],)
        ).fetchone()

    return dict(profile)


@app.get("/api/profiles")
def discover_profiles(
    user=Depends(get_current_user),
    my_profile_id=Depends(current_profile_id)
):
    with db_connection() as db:
        if my_profile_id is None:
            raise HTTPException(400, "Create your profile first")

        profiles = db.execute("""
            SELECT * FROM profiles
            WHERE id != ?
              AND id NOT IN (
                SELECT to_profile FROM swipes WHERE from_profile = ?
              )
            ORDER BY id DESC
        """, (my_profile_id, my_profile_id)).fetchall()

    return [dict(profile) for profile in profiles]


@app.post("/api/swipes")
def swipe(
    data: SwipeData,
    user=Depends(get_current_user),
    my_profile_id=Depends(current_profile_id)
):
    if my_profile_id is None:
        raise HTTPException(400, "Create your profile first")

    if data.profile_id == my_profile_id:
        raise HTTPException(400, "You cannot like your own profile")

    with db_connection() as db:
        target = db.execute(
            "SELECT id FROM profiles WHERE id = ?",
            (data.profile_id,)
        ).fetchone()

        if not target:
            raise HTTPException(404, "Profile not found")

        try:
            db.execute("""
                INSERT INTO swipes (from_profile, to_profile, liked)
                VALUES (?, ?, ?)
            """, (my_profile_id, data.profile_id, int(data.liked)))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "You already swiped on this profile")

        mutual = False
        if data.liked:
            mutual = db.execute("""
                SELECT 1 FROM swipes
                WHERE from_profile = ? AND to_profile = ? AND liked = 1
            """, (data.profile_id, my_profile_id)).fetchone() is not None

    return {"matched": mutual, "message": "It's a match!" if mutual else "Swipe saved"}


@app.get("/api/matches")
def matches(
    user=Depends(get_current_user),
    my_profile_id=Depends(current_profile_id)
):
    if my_profile_id is None:
        raise HTTPException(400, "Create your profile first")

    with db_connection() as db:
        result = db.execute("""
            SELECT p.*
            FROM profiles p
            JOIN swipes s1
              ON s1.to_profile = p.id
             AND s1.from_profile = ?
             AND s1.liked = 1
            JOIN swipes s2
              ON s2.from_profile = p.id
             AND s2.to_profile = ?
             AND s2.liked = 1
        """, (my_profile_id, my_profile_id)).fetchall()

    return [dict(profile) for profile in result]

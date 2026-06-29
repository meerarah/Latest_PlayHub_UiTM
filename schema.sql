-- schema.sql
-- SQLite Schema for PlayHub Application

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Firebase UID
    fullname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'Student', -- 'Student' or 'Admin'
    matrixId TEXT,
    course TEXT,
    profileImageUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Courts Table
CREATE TABLE IF NOT EXISTS courts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sport TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    image TEXT
);

-- 3. Sport Events / Bookings Table
-- Consolidates sports events and court bookings as per current architecture
CREATE TABLE IF NOT EXISTS Sport_event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sportname TEXT NOT NULL,
    venue TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    time TEXT NOT NULL, -- HH:mm
    maxplayers INTEGER,
    difficultylevel TEXT DEFAULT 'Beginner',
    adminid TEXT,
    type TEXT NOT NULL, -- 'full_court', 'shared_session', 'event'
    proofUrl TEXT, -- URL to payment/booking proof
    slot INTEGER, -- Start hour
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adminid) REFERENCES users(id)
);

-- 4. Registrations Table
CREATE TABLE IF NOT EXISTS Registration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sportid INTEGER NOT NULL,
    studentid TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed'
    completedAt DATETIME,
    FOREIGN KEY (sportid) REFERENCES Sport_event(id) ON DELETE CASCADE,
    FOREIGN KEY (studentid) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Badges Table
CREATE TABLE IF NOT EXISTS Badge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    badgename TEXT NOT NULL,
    image_icon TEXT,
    description TEXT,
    type TEXT -- 'achievement', 'social', 'loyalty'
);

-- 6. Student Badges (Many-to-Many)
CREATE TABLE IF NOT EXISTS Student_Badge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentid TEXT NOT NULL,
    badgeid INTEGER NOT NULL,
    awardedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentid) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badgeid) REFERENCES Badge(id) ON DELETE CASCADE,
    UNIQUE(studentid, badgeid) -- Prevents duplicate badges
);

-- 7. Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    studentid TEXT NOT NULL,
    sportid INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentid) REFERENCES users(id),
    FOREIGN KEY (sportid) REFERENCES Sport_event(id)
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info', -- 'booking', 'event', 'info'
    isRead BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

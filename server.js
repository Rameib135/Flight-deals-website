const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// יצירת מסד הנתונים
let db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// יצירת טבלאות אם לא קיימות
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS favorites (
        user_id TEXT,
        text TEXT,
        imgSrc TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// פונקציה ליצירת מזהה ייחודי
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

// מסך כניסה
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT id FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) {
            res.json({ success: false });
        } else if (row) {
            const userId = row.id;
            res.cookie('userId', userId, { maxAge: 86400000 }); // עוגייה בתוקף ל-24 שעות
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    });
});

// רישום משתמש חדש
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const userId = generateUniqueId();
    db.run(`INSERT INTO users (id, username, password) VALUES (?, ?, ?)`, [userId, username, password], function(err) {
        if (err) {
            res.json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});

// קבלת נתוני המועדפים
app.get('/favorites', (req, res) => {
    const userId = req.cookies.userId;
    if (userId) {
        db.all(`SELECT text, imgSrc FROM favorites WHERE user_id = ?`, [userId], (err, rows) => {
            if (err) {
                res.json({ favorites: [] });
            } else {
                res.json({ favorites: rows });
            }
        });
    } else {
        res.json({ favorites: [] });
    }
});

// שמירת שינויים במועדפים
app.post('/favorites', (req, res) => {
    const userId = req.cookies.userId;
    if (userId) {
        db.run(`DELETE FROM favorites WHERE user_id = ?`, [userId], function(err) {
            if (err) {
                res.json({ success: false });
            } else {
                const stmt = db.prepare(`INSERT INTO favorites (user_id, text, imgSrc) VALUES (?, ?, ?)`);
                for (const favorite of req.body.favorites) {
                    stmt.run([userId, favorite.text, favorite.imgSrc]);
                }
                stmt.finalize();
                res.json({ success: true });
            }
        });
    } else {
        res.json({ success: false });
    }
});

// מחיקת כל המועדפים
app.delete('/favorites', (req, res) => {
    const userId = req.cookies.userId;
    if (userId) {
        db.run(`DELETE FROM favorites WHERE user_id = ?`, [userId], function(err) {
            if (err) {
                res.json({ success: false });
            } else {
                res.json({ success: true });
            }
        });
    } else {
        res.json({ success: false });
    }
});

app.listen(4008, () => {
    console.log('Server is running on port 4008');
});

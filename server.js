import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());

// Helper to filter bookings older than 24 hours
const cleanExpiredBookings = (bookings) => {
  const now = new Date();
  return bookings.filter(b => {
    try {
      // Combine date (YYYY-MM-DD) and end time (HH:MM)
      const endDateTime = new Date(`${b.date}T${b.endTime}`);
      const diffMs = now.getTime() - endDateTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Keep booking if finished less than 24 hours ago, OR if it finishes in the future
      return diffHours <= 24;
    } catch (e) {
      console.error('Error parsing booking date:', b, e);
      return true; // Keep if error to avoid accidental data loss
    }
  });
};

// Helper to read database
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const initialData = {
      masseuses: [
        { id: 'm1', nickname: 'พี่นก', status: 'active' },
        { id: 'm2', nickname: 'พี่บี', status: 'active' },
        { id: 'm3', nickname: 'พี่ฝน', status: 'active' },
        { id: 'm4', nickname: 'พี่แก้ว', status: 'active' }
      ],
      services: [
        { id: 's1', name: 'นวดไทย', type: 'thai-massage', duration: 60, price: 350 },
        { id: 's2', name: 'นวดอโรมา', type: 'oil-massage', duration: 90, price: 600 },
        { id: 's3', name: 'นวดเท้า', type: 'foot-massage', duration: 60, price: 300 },
        { id: 's4', name: 'นวดประคบสมุนไพร (Herbal Compress)', type: 'thai-massage', duration: 90, price: 500 },
        { id: 's5', name: 'นวดคอบ่าไหล่ (Neck & Shoulder)', type: 'other-massage', duration: 60, price: 250 }
      ],
      users: [
        { username: 'admin', password: 'password123', displayName: 'เจ้าของร้าน (คุณมนต์)', role: 'admin' },
        { username: 'staff1', password: '123456', displayName: 'พนักงานหน้าร้าน (ฟ้า)', role: 'user' },
        { username: 'staff2', password: '123456', displayName: 'แคชเชียร์ (ตั้ม)', role: 'user' }
      ],
      bookings: [],
      durations: [
        { id: 'd30', name: '30 นาที', minutes: 30 },
        { id: 'd60', name: '60 นาที', minutes: 60 },
        { id: 'd90', name: '90 นาที', minutes: 90 },
        { id: 'd120', name: '120 นาที', minutes: 120 },
        { id: 'd180', name: '180 นาที', minutes: 180 }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }
  
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  
  // Clean up bookings older than 24 hours
  if (data.bookings) {
    const cleanedBookings = cleanExpiredBookings(data.bookings);
    if (cleanedBookings.length !== data.bookings.length) {
      data.bookings = cleanedBookings;
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[Auto-Cleanup] Removed ${data.bookings.length - cleanedBookings.length} bookings older than 24 hours.`);
    }
  }
  
  return data;
};

// Helper to write database
const writeDB = (data) => {
  // Always clean up bookings older than 24 hours before writing
  if (data.bookings) {
    data.bookings = cleanExpiredBookings(data.bookings);
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// Get entire database
app.get('/api/db', (req, res) => {
  try {
    const db = readDB();
    res.json(db);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read database', details: error.message });
  }
});

// Update entire database
app.post('/api/db', (req, res) => {
  try {
    const data = req.body;
    writeDB(data);
    res.json({ success: true, db: readDB() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update database', details: error.message });
  }
});

// Serve static files from Vite's dist folder (production build)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all non-API GET requests to index.html (for React Router support)
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

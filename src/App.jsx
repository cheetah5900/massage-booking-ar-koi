import React, { useState, useEffect } from 'react';
import { 
  Flower2, 
  LogOut, 
  User, 
  Plus, 
  Clock, 
  Users, 
  Sparkles, 
  Calendar, 
  AlertTriangle,
  Lock,
  ChevronRight,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { 
  INITIAL_MASSEUSES, 
  INITIAL_SERVICES, 
  INITIAL_USERS, 
  getInitialBookings 
} from './mockData';
import Timetable from './components/Timetable';
import ManageModal from './components/ManageModal';
import BookingModal from './components/BookingModal';
import AdminPanel from './components/AdminPanel';
import SearchableSelect from './components/SearchableSelect';

// Half-hour slot options (10:00 - 22:00)
const START_TIME_OPTIONS = [];
for (let h = 10; h <= 22; h++) {
  const hourStr = String(h).padStart(2, '0');
  START_TIME_OPTIONS.push(`${hourStr}:00`);
  if (h < 22) {
    START_TIME_OPTIONS.push(`${hourStr}:30`);
  }
}

export default function App() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data states
  const [masseuses, setMasseuses] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [durations, setDurations] = useState([]);

  // Scheduling states (Strictly today)
  const bookingDate = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(bookingDate);
  const [activeTab, setActiveTab] = useState('timetable-only'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [manageModalType, setManageModalType] = useState(null); // 'masseuse' | 'service' | 'duration' | null
  const [selectedBooking, setSelectedBooking] = useState(null); // Booking object for details modal

  // Booking Form State (Single customer, no names)
  const [bookingServiceId, setBookingServiceId] = useState('');
  const [bookingMasseuseId, setBookingMasseuseId] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('10:00');
  const [bookingDuration, setBookingDuration] = useState(60);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // --- INITIALIZATION (API Backend) ---
  useEffect(() => {
    const initData = async () => {
      try {
        const res = await fetch('/api/db');
        const db = await res.json();
        
        if (db.masseuses) setMasseuses(db.masseuses);
        if (db.services) setServices(db.services);
        if (db.bookings) setBookings(db.bookings);
        if (db.users) setStaffUsers(db.users);
        if (db.durations) setDurations(db.durations);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    };

    initData();

    // Session persistence for active logged-in user in localStorage
    const storedCurrentUser = localStorage.getItem('spa_current_user');
    if (storedCurrentUser) {
      setCurrentUser(JSON.parse(storedCurrentUser));
    }
  }, []);

  // Set defaults for single booking form once options are loaded
  useEffect(() => {
    if (services.length > 0 && bookingServiceId === '') {
      setBookingServiceId(services[0].id);
      setBookingDuration(services[0].duration);
    }
    if (masseuses.length > 0 && bookingMasseuseId === '') {
      const activeM = masseuses.find(m => m.status === 'active');
      if (activeM) setBookingMasseuseId(activeM.id);
    }
  }, [services, masseuses]);

  // Centralized Save helper
  const saveToBackend = async (newData) => {
    try {
      const payload = {
        masseuses: newData.masseuses !== undefined ? newData.masseuses : masseuses,
        services: newData.services !== undefined ? newData.services : services,
        bookings: newData.bookings !== undefined ? newData.bookings : bookings,
        users: newData.staffUsers !== undefined ? newData.staffUsers : staffUsers,
        durations: newData.durations !== undefined ? newData.durations : durations
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        // Sync states
        if (result.db.masseuses) setMasseuses(result.db.masseuses);
        if (result.db.services) setServices(result.db.services);
        if (result.db.bookings) setBookings(result.db.bookings);
        if (result.db.users) setStaffUsers(result.db.users);
        if (result.db.durations) setDurations(result.db.durations);

        // Update current logged-in user profile if it changed
        if (currentUser) {
          const updatedSelf = result.db.users.find(u => u.username === currentUser.username);
          if (updatedSelf) {
            setCurrentUser(updatedSelf);
            localStorage.setItem('spa_current_user', JSON.stringify(updatedSelf));
          }
        }
      }
    } catch (err) {
      console.error("Failed to save to backend:", err);
    }
  };

  const saveMasseuses = (data) => {
    setMasseuses(data);
    saveToBackend({ masseuses: data });
  };

  const saveServices = (data) => {
    setServices(data);
    saveToBackend({ services: data });
  };

  const saveBookings = (data) => {
    setBookings(data);
    saveToBackend({ bookings: data });
  };

  const saveStaffUsers = (data) => {
    setStaffUsers(data);
    saveToBackend({ staffUsers: data });
  };

  const saveDurations = (data) => {
    setDurations(data);
    saveToBackend({ durations: data });
  };

  // Check conflicts before deleting items
  const handleDeleteCheck = (itemId, type) => {
    const getServiceName = (serviceId) => {
      const s = services.find(srv => srv.id === serviceId);
      return s ? s.name : 'บริการสปา';
    };

    if (type === 'masseuse') {
      const activeUses = bookings.filter(b => b.masseuseId === itemId && b.status !== 'completed');
      if (activeUses.length > 0) {
        const clientList = activeUses.map(b => `- ${getServiceName(b.serviceId)} (เวลา ${b.startTime} - ${b.endTime})`).join('\n');
        return `ไม่สามารถลบหมอนวดได้ เนื่องจากถูกใช้งานจริงในคิวจองที่กำลังรอดำเนินการดังนี้:\n${clientList}\n\nกรุณาเปลี่ยนหรือลบคิวงานดังกล่าวออกก่อนครับ`;
      }
    } else if (type === 'service') {
      const activeUses = bookings.filter(b => b.serviceId === itemId && b.status !== 'completed');
      if (activeUses.length > 0) {
        const clientList = activeUses.map(b => `- คิวเวลา ${b.startTime} - ${b.endTime}`).join('\n');
        return `ไม่สามารถลบบริการนี้ได้ เนื่องจากถูกใช้งานจริงในคิวจองที่กำลังรอดำเนินการดังนี้:\n${clientList}\n\nกรุณาเปลี่ยนหรือลบคิวงานดังกล่าวออกก่อนครับ`;
      }
    } else if (type === 'duration') {
      const durationObj = durations.find(d => d.id === itemId);
      if (durationObj) {
        const activeUses = bookings.filter(b => b.duration === durationObj.minutes && b.status !== 'completed');
        if (activeUses.length > 0) {
          const clientList = activeUses.map(b => `- ${getServiceName(b.serviceId)} (เวลา ${b.startTime} - ${b.endTime})`).join('\n');
          return `ไม่สามารถลบระยะเวลานี้ได้ เนื่องจากถูกใช้งานจริงในคิวจองที่กำลังรอดำเนินการดังนี้:\n${clientList}\n\nกรุณาเปลี่ยนหรือลบคิวงานดังกล่าวออกก่อนครับ`;
        }
      }
    }
    return null;
  };

  // --- ACTIONS ---

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    const user = staffUsers.find(
      u => u.username === loginUsername && u.password === loginPassword
    );

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('spa_current_user', JSON.stringify(user));
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('spa_current_user');
    setActiveTab('timetable-only');
  };

  // Handle service change in booking form
  const handleServiceChange = (serviceId) => {
    setBookingServiceId(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setBookingDuration(service.duration);
    }
  };

  // Conflict Check
  const checkMasseuseConflict = (masseuseId, date, startTime, duration, ignoreBookingId = null) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + duration;

    const dateBookings = bookings.filter(b => b.date === date && b.masseuseId === masseuseId && b.id !== ignoreBookingId && b.status !== 'cancelled');

    for (let booking of dateBookings) {
      const [bStartH, bStartM] = booking.startTime.split(':').map(Number);
      const bStartMinutes = bStartH * 60 + bStartM;
      const bEndMinutes = bStartMinutes + booking.duration;

      // Overlap condition
      if (startMinutes < bEndMinutes && bStartMinutes < endMinutes) {
        return booking;
      }
    }
    return null;
  };

  // Submit Booking Form
  const handleBookQueue = (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!bookingServiceId) {
      setBookingError('กรุณาเลือกประเภทบริการ');
      return;
    }
    if (!bookingMasseuseId) {
      setBookingError('กรุณาเลือกหมอนวด');
      return;
    }

    // Check operating hours (10:00 - 24:00)
    const [sh, sm] = bookingStartTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = startMin + bookingDuration;
    if (startMin < 10 * 60 || endMin > 24 * 60) {
      setBookingError('เวลาให้บริการต้องอยู่ระหว่าง 10:00 - 24:00');
      return;
    }

    // Check conflict
    const conflict = checkMasseuseConflict(bookingMasseuseId, bookingDate, bookingStartTime, bookingDuration);
    if (conflict) {
      const masseuse = masseuses.find(m => m.id === bookingMasseuseId);
      setBookingError(
        `คิวทับซ้อน: ${masseuse ? masseuse.nickname : 'หมอนวด'} มีคิวให้บริการแล้วในช่วง ${conflict.startTime} - ${conflict.endTime}`
      );
      return;
    }

    // Add booking
    const [h, m] = bookingStartTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + bookingDuration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const service = services.find(s => s.id === bookingServiceId);

    const newBooking = {
      id: `b${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      masseuseId: bookingMasseuseId,
      serviceId: bookingServiceId,
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: endTimeStr,
      duration: bookingDuration,
      price: service ? service.price : 0,
      status: 'active'
    };

    const updated = [...bookings, newBooking];
    saveBookings(updated);

    setBookingSuccess('จองคิวนวดสำเร็จ!');
    setSelectedDate(bookingDate);

    setTimeout(() => setBookingSuccess(''), 4000);
  };

  // Update Booking properties from modal
  const handleUpdateBooking = (updatedBooking) => {
    // Validate conflict on update
    const conflict = checkMasseuseConflict(
      updatedBooking.masseuseId, 
      updatedBooking.date, 
      updatedBooking.startTime, 
      updatedBooking.duration,
      updatedBooking.id
    );

    if (conflict) {
      const masseuse = masseuses.find(m => m.id === updatedBooking.masseuseId);
      alert(
        `ไม่สามารถบันทึกได้เนื่องจากคิวทับซ้อน: ${masseuse ? masseuse.nickname : 'หมอนวด'} ติดคิวในช่วง ${conflict.startTime} - ${conflict.endTime}`
      );
      return;
    }

    const updated = bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b);
    saveBookings(updated);
    setSelectedBooking(null);
  };

  // Cancel/Delete Booking from modal
  const handleDeleteBooking = (id) => {
    const updated = bookings.filter(b => b.id !== id);
    saveBookings(updated);
  };

  // --- RENDER LOGIN IF NOT LOGGED IN ---
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle, #fbfaf8 0%, #ede6db 100%)',
        padding: '1.5rem'
      }}>
        <div className="spa-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-gold-light)',
              color: 'var(--color-gold)',
              marginBottom: '1rem'
            }}>
              <Flower2 size={32} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.8rem', fontWeight: 800 }}>จิรภัทร์</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              ระบบจัดการคิวพนักงาน (Staff Portal)
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loginError && (
              <div style={{
                color: 'var(--color-coral)',
                backgroundColor: 'var(--color-coral-light)',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {loginError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">ชื่อผู้ใช้ (Username)</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="เช่น admin, staff1"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">รหัสผ่าน (Password)</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="ป้อนรหัสผ่าน"
                className="form-input"
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>
              เข้าสู่ระบบ <ChevronRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            <div>บัญชีทดสอบระบบ:</div>
            <div style={{ marginTop: '4px' }}>
              <strong>Admin:</strong> admin / password123 <br />
              <strong>Staff:</strong> staff1 / 123456
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics for display
  const activeToday = bookings.filter(b => b.date === bookingDate && b.status === 'active').length;
  const completedToday = bookings.filter(b => b.date === bookingDate && b.status === 'completed').length;

  return (
    <div className="app-container">
      
      {/* HEADER */}
      <header className="app-header">
        <div className="header-inner">
  <div className="logo-section">
          <div className="logo-icon">
            <Flower2 size={24} />
          </div>
          <div>
            <h1 className="logo-text">จิรภัทร์</h1>
            <div className="logo-subtitle">Queue Management</div>
          </div>
        </div>

        <div className="header-actions">
          
          {/* Desktop Only Actions */}
          <div className="desktop-only-header-actions">
            {currentUser.role === 'admin' && (
              <nav className="tab-nav">
                <button 
                  className={`tab-btn ${activeTab === 'timetable-only' ? 'active' : ''}`}
                  onClick={() => setActiveTab('timetable-only')}
                >
                  <Clock size={14} /> ดูตารางคิว
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  <Calendar size={14} /> ตารางลงคิว
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                >
                  <Users size={14} /> จัดการระบบผู้ใช้
                </button>
              </nav>
            )}

            {/* Header Stats Badges */}
            <div className="header-stats" style={{ display: 'flex', gap: '8px', marginRight: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', backgroundColor: 'var(--color-gold-light)', color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-gold)', borderRadius: '50%' }}></span> คิวค้าง: {activeToday}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', backgroundColor: 'var(--color-sage-light)', color: 'var(--color-sage)', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-sage)', borderRadius: '50%' }}></span> เสร็จ: {completedToday}
              </span>
            </div>

            {/* User Dropdown Profile section */}
            <div className="user-selector-wrapper">
              <User size={14} color="var(--text-secondary)" />
              <div className="user-info">
                <span className="user-name">{currentUser.displayName}</span>
                <span className={`user-role-badge ${currentUser.role}`}>{currentUser.role}</span>
              </div>
              <button 
                className="btn-icon" 
                onClick={handleLogout} 
                title="ออกจากระบบ"
                style={{ marginLeft: '4px' }}
              >
                <LogOut size={14} color="var(--color-coral)" />
              </button>
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-hamburger-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="เมนูนำทาง"
          >
            <Menu size={22} />
          </button>

        </div>
        </div>
      </header>

      {/* DASHBOARD LAYOUT */}
      {activeTab === 'admin' && currentUser.role === 'admin' ? (
        /* ADMIN CONFIG PANEL */
        <main className="right-panel">
          <div className="panel-title-area">
            <div>
              <h2 className="panel-title">ควบคุมและจัดการพนักงาน</h2>
              <p className="panel-subtitle">แก้ไขชื่อเจ้าของ, เปลี่ยนรหัสผ่าน, เพิ่มบัญชีผู้ใช้</p>
            </div>
          </div>
          <AdminPanel 
            staffUsers={staffUsers} 
            onUpdateStaffUsers={saveStaffUsers} 
            currentUser={currentUser}
          />
        </main>
      ) : activeTab === 'timetable-only' ? (
        /* VIEW TIMETABLE ONLY */
        <main className="dashboard-grid">
          <div className="spa-card" style={{ padding: '1.25rem' }}>
            <Timetable 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              bookings={bookings}
              masseuses={masseuses}
              services={services}
              onBookingClick={setSelectedBooking}
            />
          </div>
        </main>
      ) : (
        /* QUEUE MANAGEMENT & TIMETABLE */
        <main className="dashboard-grid">
          
          {/* HORIZONTAL BOOKING FORM */}
          <div className="spa-card" style={{ padding: '0.75rem 1.25rem' }}>
            {bookingError && (
              <div style={{
                color: 'var(--color-coral)',
                backgroundColor: 'var(--color-coral-light)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '0.75rem'
              }}>
                {bookingError}
              </div>
            )}

            {bookingSuccess && (
              <div style={{
                color: 'var(--color-sage)',
                backgroundColor: 'var(--color-sage-light)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '0.75rem'
              }}>
                {bookingSuccess}
              </div>
            )}

            <form onSubmit={handleBookQueue} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', width: '100%' }}>
              {/* 1. Service Selection */}
              <div style={{ flex: '2', minWidth: '220px' }}>
                <div className="form-label-wrapper" style={{ marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>เลือกประเภทบริการ</label>
                  {currentUser.role === 'admin' && (
                    <button type="button" className="btn-manage-inline" style={{ fontSize: '0.65rem' }} onClick={() => setManageModalType('service')}>จัดการ</button>
                  )}
                </div>
                <SearchableSelect
                  options={services.map(s => ({ id: s.id, name: s.name }))}
                  value={bookingServiceId}
                  onChange={handleServiceChange}
                  placeholder="ค้นหาบริการ..."
                />
              </div>

              {/* 2. Masseuse Selection */}
              <div style={{ flex: '1.5', minWidth: '180px' }}>
                <div className="form-label-wrapper" style={{ marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>เลือกหมอนวด</label>
                  {currentUser.role === 'admin' && (
                    <button type="button" className="btn-manage-inline" style={{ fontSize: '0.65rem' }} onClick={() => setManageModalType('masseuse')}>จัดการ</button>
                  )}
                </div>
                <SearchableSelect
                  options={masseuses.filter(m => m.status === 'active').map(m => ({ id: m.id, name: m.nickname }))}
                  value={bookingMasseuseId}
                  onChange={setBookingMasseuseId}
                  placeholder="ค้นหาชื่อหมอนวด..."
                  emptyMessage="ไม่มีหมอนวดพร้อมให้บริการ"
                />
              </div>

              {/* 3. Start Time Selection */}
              <div style={{ flex: '1', minWidth: '110px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>เวลาเริ่ม</label>
                <select
                  value={bookingStartTime}
                  onChange={(e) => setBookingStartTime(e.target.value)}
                  className="form-select"
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                  required
                >
                  {START_TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* 4. Duration Selection */}
              <div style={{ flex: '1', minWidth: '110px' }}>
                <div className="form-label-wrapper" style={{ marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>เวลา (นาที)</label>
                  {currentUser.role === 'admin' && (
                    <button type="button" className="btn-manage-inline" style={{ fontSize: '0.65rem' }} onClick={() => setManageModalType('duration')}>จัดการ</button>
                  )}
                </div>
                <select
                  value={bookingDuration}
                  onChange={(e) => setBookingDuration(Number(e.target.value))}
                  className="form-select"
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                >
                  {durations.map(d => (
                    <option key={d.id} value={d.minutes}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* 5. Submit Button */}
              <div style={{ flex: '1', minWidth: '160px' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <Plus size={16} /> ลงทะเบียนจองคิว
                </button>
              </div>
            </form>
          </div>

          {/* TIMETABLE SECTION */}
          <div className="spa-card" style={{ padding: '1.25rem' }}>
            <Timetable 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              bookings={bookings}
              masseuses={masseuses}
              services={services}
              onBookingClick={setSelectedBooking}
            />
          </div>
        </main>
      )}

      {/* --- DIALOG MODALS --- */}
      
      {/* 1. Masseuse / Service / Duration Resource Manager Modals */}
      <ManageModal
        isOpen={manageModalType !== null}
        onClose={() => setManageModalType(null)}
        type={manageModalType}
        items={
          manageModalType === 'masseuse' 
            ? masseuses 
            : manageModalType === 'service' 
              ? services 
              : durations
        }
        onSave={
          manageModalType === 'masseuse' 
            ? saveMasseuses 
            : manageModalType === 'service' 
              ? saveServices 
              : saveDurations
        }
        onDeleteCheck={handleDeleteCheck}
        bookings={bookings}
      />

      {/* 2. Detail & Edit Booking Modal */}
      <BookingModal
        isOpen={selectedBooking !== null}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        masseuses={masseuses}
        services={services}
        onUpdate={handleUpdateBooking}
        onDelete={handleDeleteBooking}
      />

    
      {/* Mobile Side Drawer Overlay Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>เมนูควบคุม</span>
              <button className="btn-close" onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            {currentUser && currentUser.role === 'admin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ตารางและการจัดการ</span>
                <button 
                  className={`mobile-tab-btn ${activeTab === 'timetable-only' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('timetable-only'); setMobileMenuOpen(false); }}
                >
                  <Clock size={16} /> ดูตารางคิว
                </button>
                <button 
                  className={`mobile-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('schedule'); setMobileMenuOpen(false); }}
                >
                  <Calendar size={16} /> ตารางลงคิว
                </button>
                <button 
                  className={`mobile-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                >
                  <Users size={16} /> จัดการระบบผู้ใช้
                </button>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>สรุปสถานะประจำวัน</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--color-gold-light)', color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  คิวค้าง: {activeToday}
                </span>
                <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--color-sage-light)', color: 'var(--color-sage)', display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  เสร็จ: {completedToday}
                </span>
              </div>
            </div>

            {/* User Account Info & Logout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ผู้ลงชื่อเข้าใช้</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="var(--text-secondary)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentUser ? currentUser.displayName : ''}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentUser ? currentUser.role : ''}</span>
                  </div>
                </div>
                <button 
                  className="btn-danger" 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <LogOut size={12} /> ออก
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
</div>
  );
}

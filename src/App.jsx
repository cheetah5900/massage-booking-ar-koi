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
  const [currentUser, setCurrentUser] = useState({ role: 'admin', displayName: 'ผู้ดูแลระบบ' });

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
      window.Swal.fire({
        icon: 'error',
        title: 'อยู่นอกเวลาทำการ',
        text: 'เวลาให้บริการต้องอยู่ระหว่าง 10:00 - 24:00',
        confirmButtonColor: 'var(--color-gold)'
      });
      return;
    }

    // Check conflict
    const conflict = checkMasseuseConflict(bookingMasseuseId, bookingDate, bookingStartTime, bookingDuration);
    if (conflict) {
      const masseuse = masseuses.find(m => m.id === bookingMasseuseId);
      window.Swal.fire({
        icon: 'error',
        title: 'คิวทับซ้อน',
        text: `คิวทับซ้อน: ${masseuse ? masseuse.nickname : 'หมอนวด'} มีคิวให้บริการแล้วในช่วง ${conflict.startTime} - ${conflict.endTime}`,
        confirmButtonColor: 'var(--color-gold)'
      });
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
    window.Swal.fire({
      icon: 'success',
      title: 'จองคิวนวดสำเร็จ!',
      text: 'คิวได้รับการบันทึกลงตารางแล้ว',
      confirmButtonColor: 'var(--color-gold)'
    });
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
      window.Swal.fire({
        icon: 'error',
        title: 'คิวทับซ้อน',
        text: `ไม่สามารถบันทึกได้เนื่องจากคิวทับซ้อน: ${masseuse ? masseuse.nickname : 'หมอนวด'} ติดคิวในช่วง ${conflict.startTime} - ${conflict.endTime}`,
        confirmButtonColor: 'var(--color-gold)'
      });
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
        </div>
      </header>

      {/* DASHBOARD LAYOUT */}
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

    
    </div>
  );
}

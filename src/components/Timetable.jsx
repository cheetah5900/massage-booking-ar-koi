import React from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

export default function Timetable({ 
  selectedDate, 
  onDateChange, 
  bookings, 
  masseuses, 
  services,
  onBookingClick 
}) {
  // Operating hours configuration (10:00 - 01:00 next day)
  // Total 15 hours = 30 half-hour slots
  const START_HOUR = 10;
  const COLUMN_WIDTH = 45; // width of each 30-min slot in pixels

  // Generate array of 30 half-hour time slots
  const timeSlots = [];
  for (let h = 10; h <= 24; h++) {
    let displayHour = h;
    if (h >= 24) displayHour = h - 24;
    const hourStr = String(displayHour).padStart(2, '0');
    
    timeSlots.push(`${hourStr}:00`);
    if (h < 24) {
      timeSlots.push(`${hourStr}:30`);
    }
  }

  // Filter active masseuses
  const activeMasseuses = masseuses.filter(m => m.status === 'active');

  // Filter bookings for the selected date
  const dateBookings = bookings.filter(b => b.date === selectedDate);

  // Format date display (Thai language)
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalTimelineWidth = timeSlots.length * COLUMN_WIDTH;

  return (
    <div className="timetable-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Date Title Header (Strictly Today) */}
      <div className="timetable-header" style={{ marginBottom: '1rem', justifyContent: 'flex-start' }}>
        <div className="timetable-date-title" style={{ display: 'flex', alignItems: 'center' }}>
          <span>ตารางการทำงานและสถานะคิว</span>
        </div>
      </div>

      {/* Gantt Chart Scroll Wrapper */}
      <div 
        className="timetable-horizontal-scroll"
        style={{ 
          overflowX: 'auto', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ minWidth: `${60 + totalTimelineWidth}px`, width: 'max-content' }}>
          
          {/* 1. Time Slots Header Row */}
          <div 
            style={{ 
              display: 'flex', 
              borderBottom: '1px solid var(--border-color)', 
              backgroundColor: 'var(--bg-secondary)', 
              height: '42px', 
              alignItems: 'center' 
            }}
          >
            <div 
              style={{ 
                width: '60px', 
                minWidth: '60px', 
                textAlign: 'center', 
                fontWeight: 700, 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)', 
                borderRight: '1px solid var(--border-color)', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'var(--bg-secondary)', 
                zIndex: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              หมอนวด
            </div>
            {timeSlots.map(slot => (
              <div 
                key={slot} 
                style={{ 
                  width: `${COLUMN_WIDTH}px`, 
                  minWidth: `${COLUMN_WIDTH}px`, 
                  textAlign: 'center', 
                  fontSize: '0.62rem', 
                  fontWeight: 700, 
                  color: 'var(--text-secondary)',
                  borderRight: '1px dashed rgba(0, 0, 0, 0.05)'
                }}
              >
                {slot}
              </div>
            ))}
          </div>

          {/* 2. Masseuse Rows */}
          {activeMasseuses.map((m) => {
            const masseuseBookings = dateBookings.filter(b => b.masseuseId === m.id);

            return (
              <div 
                key={m.id} 
                style={{ 
                  display: 'flex', 
                  height: '68px', 
                  borderBottom: '1px solid var(--border-color)', 
                  alignItems: 'center', 
                  position: 'relative' 
                }}
              >
                {/* Sticky Left Column: Nickname */}
                <div 
                  style={{ 
                    width: '60px', 
                    minWidth: '60px', 
                    fontWeight: 700, 
                    fontSize: '0.8rem', 
                    color: 'var(--text-primary)', 
                    borderRight: '1px solid var(--border-color)', 
                    position: 'sticky', 
                    left: 0, 
                    backgroundColor: 'var(--bg-card)', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    zIndex: 10,
                    boxShadow: '4px 0 8px rgba(15, 23, 42, 0.02)'
                  }}
                >
                  {m.nickname}
                </div>

                {/* Relative Scrollable Timeline Segment */}
                <div 
                  style={{ 
                    position: 'relative', 
                    height: '100%', 
                    width: `${totalTimelineWidth}px`,
                    background: 'linear-gradient(to right, var(--border-color) 1px, transparent 1px)', 
                    backgroundSize: `${COLUMN_WIDTH}px 100%`
                  }}
                >
                  {masseuseBookings.map(booking => {
                    const service = services.find(s => s.id === booking.serviceId);
                    const serviceName = service ? service.name : 'บริการสปา';
                    const shortServiceName = serviceName.includes('(') 
                      ? serviceName.substring(0, serviceName.indexOf('(')).trim() 
                      : serviceName;

                    const isCompleted = booking.status === 'completed';
                    
                    // Convert startTime (HH:MM) to minutes
                    const [sh, sm] = booking.startTime.split(':').map(Number);
                    const startMin = sh * 60 + sm;
                    const baseMin = START_HOUR * 60;
                    const diffMin = startMin - baseMin;
                    
                    // Position calculations
                    const left = (diffMin / 30) * COLUMN_WIDTH;
                    const width = (booking.duration / 30) * COLUMN_WIDTH;

                    const serviceType = service ? service.type : 'other-massage';

                    return (
                      <div
                        key={booking.id}
                        className={`booking-card ${isCompleted ? 'completed' : serviceType}`}
                        style={{
                          position: 'absolute',
                          left: `${left + 4}px`,
                          width: `${width - 8}px`,
                          right: 'auto', // override CSS width stretches
                          top: '11px',
                          height: '46px',
                          margin: 0,
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '9999px', // ensure pill shape
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        onClick={() => onBookingClick(booking)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', lineHeight: 1.1, padding: '0 4px', width: '100%' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {shortServiceName} {isCompleted && <CheckCircle2 size={10} style={{ flexShrink: 0 }} />}
                          </span>
                          <span style={{ fontSize: '0.6rem', opacity: 0.9, whiteSpace: 'nowrap' }}>
                            {booking.startTime}-{booking.endTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Chronological Bookings List Summary */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          ลำดับคิวงานบริการวันนี้ (เรียงตามเวลา)
        </h4>
        {dateBookings.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
            ไม่มีคิวงานลงทะเบียนในวันนี้
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem' }}>เวลา</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem' }}>หมอนวด</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem' }}>บริการ</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem' }}>ระยะเวลา</th>
                </tr>
              </thead>
              <tbody>
                {dateBookings
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((b) => {
                    const masseuse = masseuses.find(m => m.id === b.masseuseId);
                    const service = services.find(s => s.id === b.serviceId);
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-gold)' }}>{b.startTime}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>{masseuse ? masseuse.nickname : 'ไม่ระบุ'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{service ? service.name : 'บริการสปา'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{b.duration} นาที</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

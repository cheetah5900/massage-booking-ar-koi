import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MiniCalendar({ value, onChange }) {
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Get total days in the month
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  // Get starting day of the month (0 = Sunday, 1 = Monday...)
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Adjust month
  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  // Handle Date Selection
  const handleSelectDay = (day) => {
    const selected = new Date(year, month, day);
    // Format to YYYY-MM-DD local timezone
    const offset = selected.getTimezoneOffset();
    const localSelected = new Date(selected.getTime() - (offset * 60 * 1000));
    const dateString = localSelected.toISOString().split('T')[0];
    onChange(dateString);
  };

  // Generate calendar cells
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const gridCells = [...blanks, ...days];

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const selectedDayNum = value && new Date(value).getMonth() === month && new Date(value).getFullYear() === year
    ? new Date(value).getDate()
    : null;

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '0.75rem',
      boxShadow: 'var(--shadow-sm)',
      width: '100%'
    }}>
      {/* Month Navigator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem'
      }}>
        <button 
          type="button" 
          className="btn-icon" 
          onClick={() => changeMonth(-1)}
          style={{ padding: '2px' }}
        >
          <ChevronLeft size={16} />
        </button>
        
        <span style={{ 
          fontSize: '0.85rem', 
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)'
        }}>
          {thaiMonths[month]} {year + 543}
        </span>
        
        <button 
          type="button" 
          className="btn-icon" 
          onClick={() => changeMonth(1)}
          style={{ padding: '2px' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days of Week Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        textAlign: 'center',
        marginBottom: '4px'
      }}>
        {daysOfWeek.map((day, idx) => (
          <span key={day} style={{ 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            color: idx === 0 ? 'var(--color-coral)' : 'var(--text-secondary)'
          }}>
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px'
      }}>
        {gridCells.map((cell, idx) => {
          if (cell === null) {
            return <div key={`blank-${idx}`} />;
          }

          const isSelected = cell === selectedDayNum;
          
          return (
            <button
              key={`day-${cell}`}
              type="button"
              onClick={() => handleSelectDay(cell)}
              style={{
                border: 'none',
                background: isSelected ? 'var(--color-gold)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text-primary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.75rem',
                height: '26px',
                width: '100%',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {cell}
            </button>
          );
        })}
      </div>
    </div>
  );
}

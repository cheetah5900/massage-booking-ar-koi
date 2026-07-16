import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder = "ค้นหา...", emptyMessage = "ไม่พบข้อมูล" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef(null);

  const selectedOption = options.find(opt => opt.id === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="searchable-select-container" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <div 
        className="form-input search-select-trigger" 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '0.75rem 1rem',
          backgroundColor: '#fff'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'inherit' : 'var(--text-muted)' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="search-select-dropdown" style={{
          position: 'absolute',
          top: '105%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-md)',
          zIndex: 150,
          maxHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn var(--transition-fast)'
        }}>
          {/* Search Input bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="พิมพ์เพื่อค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                border: 'none',
                background: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}
              autoFocus
            />
          </div>

          {/* Options list */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
            {filteredOptions.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <div
                  key={opt.id}
                  className="search-select-option"
                  onClick={() => handleSelect(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    backgroundColor: isSelected ? 'var(--color-gold-light)' : 'transparent',
                    color: isSelected ? 'var(--color-gold)' : 'var(--text-primary)',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{opt.name}</span>
                  {isSelected && <Check size={14} color="var(--color-gold)" />}
                </div>
              );
            })}
            
            {filteredOptions.length === 0 && (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem'
              }}>
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

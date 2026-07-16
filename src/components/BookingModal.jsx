import React from 'react';
import { X, Calendar, Clock, Trash2, Sparkles } from 'lucide-react';

export default function BookingModal({ isOpen, onClose, booking, masseuses, services, onDelete }) {
  if (!isOpen || !booking) return null;

  const currentMasseuse = masseuses.find(m => m.id === booking.masseuseId);
  const currentService = services.find(s => s.id === booking.serviceId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">รายละเอียดคิวจอง</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Read-only info */}
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="stat-icon-box" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentService ? currentService.name : 'คิวนวดสปา'}
                </div>
                <span className="user-role-badge active" style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.65rem' }}>
                  คิวจองประจำวัน
                </span>
              </div>
            </div>

            <div className="spa-card" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>หมอนวด:</span>
                <span style={{ fontWeight: 700 }}>{currentMasseuse ? currentMasseuse.nickname : 'ไม่ระบุ'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                  <Clock size={14} /> ช่วงเวลา:
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-gold)' }}>
                  {booking.startTime} - {booking.endTime} ({booking.duration} นาที)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
          <button 
            className="btn-danger" 
            style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
            onClick={() => {
              window.Swal.fire({
                title: 'ยืนยันการลบคิว',
                text: 'คุณต้องการลบคิวจองนี้ใช่หรือไม่?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: 'var(--color-coral)',
                cancelButtonColor: 'var(--text-muted)',
                confirmButtonText: 'ลบคิว',
                cancelButtonText: 'ยกเลิก'
              }).then((result) => {
                if (result.isConfirmed) {
                  onDelete(booking.id);
                  onClose();
                  window.Swal.fire({
                    title: 'ลบสำเร็จ',
                    text: 'คิวจองได้รับการลบเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonColor: 'var(--color-gold)'
                  });
                }
              });
            }}
          >
            <Trash2 size={15} /> ลบคิวจองนี้
          </button>
          
          <button className="btn-secondary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}

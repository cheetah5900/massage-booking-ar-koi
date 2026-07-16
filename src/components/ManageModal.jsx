import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Users, Sparkles, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ManageModal({ isOpen, onClose, type, items, onSave, onDeleteCheck, bookings = [] }) {
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newFormData, setNewFormData] = useState({
    nickname: '',
    status: 'active',
    name: '',
    type: 'thai-massage',
    duration: 60,
    price: 350,
    minutes: 60
  });

  if (!isOpen) return null;

  const isMasseuse = type === 'masseuse';
  const isDuration = type === 'duration';
  const isService = type === 'service';

  // Helper to check if an item is currently in use in active queues
  const checkItemInUse = (itemId) => {
    if (isMasseuse) {
      return bookings.some(b => b.masseuseId === itemId && b.status !== 'completed');
    }
    if (isService) {
      return bookings.some(b => b.serviceId === itemId && b.status !== 'completed');
    }
    if (isDuration) {
      const durationObj = items.find(d => d.id === itemId);
      return durationObj ? bookings.some(b => b.duration === durationObj.minutes && b.status !== 'completed') : false;
    }
    return false;
  };

  // Handle Input Changes for Add Form
  const handleNewChange = (e) => {
    const { name, value } = e.target;
    setNewFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'price' || name === 'minutes' ? Number(value) : value
    }));
  };

  // Handle Input Changes for Edit Form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'price' || name === 'minutes' ? Number(value) : value
    }));
  };

  // Add Item
  const handleAddItem = (e) => {
    e.preventDefault();
    
    let newItem = null;
    const timestampId = Date.now();

    if (isMasseuse) {
      if (!newFormData.nickname.trim()) return;
      newItem = {
        id: `m${timestampId}`,
        nickname: newFormData.nickname.trim(),
        status: newFormData.status
      };
    } else if (isService) {
      if (!newFormData.name.trim()) return;
      newItem = {
        id: `s${timestampId}`,
        name: newFormData.name.trim(),
        type: 'thai-massage', // default type
        duration: newFormData.duration,
        price: newFormData.price
      };
    } else if (isDuration) {
      if (!newFormData.minutes || newFormData.minutes <= 0) return;
      newItem = {
        id: `d${newFormData.minutes}-${timestampId}`,
        name: `${newFormData.minutes} นาที`,
        minutes: newFormData.minutes
      };
    }

    if (newItem) {
      onSave([...items, newItem]);
      
      // Reset Add Form
      setNewFormData({
        nickname: '',
        status: 'active',
        name: '',
        type: 'thai-massage',
        duration: 60,
        price: 350,
        minutes: 60
      });
    }
  };

  // Delete Item with conflict checks
  const handleDeleteItem = (id) => {
    if (onDeleteCheck) {
      const conflictMsg = onDeleteCheck(id, type);
      if (conflictMsg) {
        alert(conflictMsg);
        return;
      }
    }

    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบรายการนี้?`)) {
      onSave(items.filter(item => item.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  // Start Editing
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditFormData({ ...item });
  };

  // Save Edit
  const saveEdit = () => {
    if (isMasseuse) {
      if (!editFormData.nickname.trim()) return;
    } else if (isService) {
      if (!editFormData.name.trim()) return;
    } else if (isDuration) {
      if (!editFormData.minutes || editFormData.minutes <= 0) return;
      editFormData.name = `${editFormData.minutes} นาที`;
    }

    onSave(items.map(item => item.id === editingId ? { ...editFormData } : item));
    setEditingId(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '850px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            {isMasseuse && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--color-gold)" /> จัดการข้อมูลหมอนวด
              </span>
            )}
            {isService && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--color-gold)" /> จัดการประเภทการนวด/บริการ
              </span>
            )}
            {isDuration && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--color-gold)" /> จัดการช่วงเวลาให้บริการ
              </span>
            )}
          </h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Body: Split Columns */}
        <div className="modal-body" style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
          <div className="manage-modal-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
            
            {/* LEFT COLUMN: ADD NEW ITEM */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>เพิ่มรายการใหม่</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>กรอกรายละเอียดเพื่อบันทึกลงระบบ</p>
              </div>

              <form onSubmit={handleAddItem} className="spa-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderStyle: 'solid', borderWidth: '1px' }}>
                {isMasseuse && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">ชื่อหมอนวด (ชื่อเล่น)</label>
                      <input
                        type="text"
                        name="nickname"
                        value={newFormData.nickname}
                        onChange={handleNewChange}
                        placeholder="เช่น พี่นก"
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">สถานะเริ่มต้น</label>
                      <select
                        name="status"
                        value={newFormData.status}
                        onChange={handleNewChange}
                        className="form-select"
                      >
                        <option value="active">พร้อมทำงาน</option>
                        <option value="inactive">ไม่พร้อมทำงาน</option>
                      </select>
                    </div>
                  </div>
                )}

                {isService && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">ชื่อบริการ</label>
                      <input
                        type="text"
                        name="name"
                        value={newFormData.name}
                        onChange={handleNewChange}
                        placeholder="เช่น ขัดผิวอโรมา"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                )}

                {isDuration && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ระยะเวลานวดที่ต้องการเพิ่ม (นาที)</label>
                    <input
                      type="number"
                      name="minutes"
                      value={newFormData.minutes}
                      onChange={handleNewChange}
                      placeholder="เช่น 150"
                      className="form-input"
                      min="1"
                      required
                    />
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Plus size={16} /> บันทึกข้อมูลใหม่
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: CURRENT ITEMS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>รายการเดิมที่มีอยู่</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>แก้ไขชื่อ ราคา หรือตรวจสถานะการใช้งานระบบ</p>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)' }}>
                  ทั้งหมด {items.length} รายการ
                </span>
              </div>

              <div className="manage-list" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item) => {
                  const inUse = checkItemInUse(item.id);

                  return (
                    <div key={item.id} className="manage-item" style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                      {editingId === item.id ? (
                        // Edit Row Form
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          {isMasseuse && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                name="nickname"
                                value={editFormData.nickname}
                                onChange={handleEditChange}
                                className="form-input"
                                placeholder="ชื่อหมอนวด"
                                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                              />
                              <select
                                name="status"
                                value={editFormData.status}
                                onChange={handleEditChange}
                                className="form-select"
                                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '120px' }}
                              >
                                <option value="active">พร้อมทำงาน</option>
                                <option value="inactive">หยุดงาน</option>
                              </select>
                            </div>
                          )}

                          {isService && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <input
                                type="text"
                                name="name"
                                value={editFormData.name}
                                onChange={handleEditChange}
                                className="form-input"
                                placeholder="ชื่อบริการ"
                                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                              />
                            </div>
                          )}

                          {isDuration && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="number"
                                name="minutes"
                                value={editFormData.minutes}
                                onChange={handleEditChange}
                                className="form-input"
                                placeholder="นาที"
                                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '120px' }}
                                min="1"
                              />
                              <span style={{ fontSize: '0.85rem' }}>นาที</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                            <button className="btn-icon" onClick={saveEdit} title="บันทึก" style={{ padding: '4px' }}>
                              <Check size={16} color="var(--color-sage)" />
                            </button>
                            <button className="btn-icon" onClick={() => setEditingId(null)} title="ยกเลิก" style={{ padding: '4px' }}>
                              <X size={16} color="var(--color-coral)" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Default Item Row
                        <>
                          <div className="manage-item-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="manage-item-name" style={{ fontWeight: 600 }}>
                                {isMasseuse ? item.nickname : item.name}
                              </span>
                              
                              {/* In-Use Indicators */}
                              {inUse ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  color: 'var(--text-secondary)',
                                  backgroundColor: 'var(--bg-secondary)',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}>
                                  <AlertCircle size={10} /> ใช้งานอยู่
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  color: '#0d9488',
                                  backgroundColor: '#ccfbf1',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}>
                                  <CheckCircle2 size={10} /> ว่าง (ลบได้)
                                </span>
                              )}
                            </div>
                            <span className="manage-item-sub" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                              {isMasseuse && `สถานะ: ${item.status === 'active' ? 'พร้อมทำงาน' : 'หยุดปฏิบัติงาน'}`}
                              {isService && `ข้อมูลประเภทการนวด/บริการ`}
                              {isDuration && `ตัวเลือกระยะเวลานวดสำหรับหน้าจอง`}
                            </span>
                          </div>
                          <div className="manage-item-actions" style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn-icon" onClick={() => startEdit(item)} title="แก้ไข">
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className={`btn-icon delete ${inUse ? 'disabled' : ''}`} 
                              onClick={() => handleDeleteItem(item.id)} 
                              title={inUse ? "ไม่สามารถลบได้เนื่องจากมีคิวจองที่ใช้อยู่" : "ลบรายการ"}
                              style={{
                                opacity: inUse ? 0.35 : 1,
                                cursor: inUse ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    ไม่มีข้อมูลในระบบ กรุณาป้อนข้อมูลฝั่งซ้ายเพื่อบันทึกรายการ
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
          <button className="btn-secondary" onClick={onClose}>ปิดหน้าต่างจัดการ</button>
        </div>
      </div>
    </div>
  );
}

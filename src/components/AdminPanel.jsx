import React, { useState } from 'react';
import { UserPlus, ShieldAlert, Key, UserCheck, Trash2 } from 'lucide-react';

export default function AdminPanel({ staffUsers, onUpdateStaffUsers, currentUser }) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  const [editingUsername, setEditingUsername] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('user');

  const [message, setMessage] = useState('');

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Check if user already exists
    if (staffUsers.some(u => u.username === newUsername)) {
      setMessage('มีชื่อผู้ใช้นี้ในระบบอยู่แล้ว');
      return;
    }

    const newUser = {
      username: newUsername.trim(),
      password: newPassword.trim(),
      displayName: newUsername.trim(),
      role: newRole
    };

    onUpdateStaffUsers([...staffUsers, newUser]);
    setNewUsername('');
    setNewPassword('');
    setNewRole('user');
    setMessage('เพิ่มบัญชีผู้ใช้สำเร็จ');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteUser = (username) => {
    if (username === 'admin') {
      alert('ไม่สามารถลบผู้ดูแลระบบหลัก (admin) ได้');
      return;
    }
    if (username === currentUser.username) {
      alert('ไม่สามารถลบบัญชีที่คุณกำลังใช้งานอยู่ได้');
      return;
    }

    if (confirm(`คุณต้องการลบบัญชีผู้ใช้ ${username} ใช่หรือไม่?`)) {
      onUpdateStaffUsers(staffUsers.filter(u => u.username !== username));
      setMessage('ลบบัญชีผู้ใช้สำเร็จ');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const startEdit = (user) => {
    setEditingUsername(user.username);
    setEditPassword(''); // Keep empty, only change if type new password
    setEditRole(user.role);
  };

  const handleSaveEdit = (username) => {
    onUpdateStaffUsers(staffUsers.map(user => {
      if (user.username === username) {
        return {
          ...user,
          displayName: user.displayName || user.username,
          role: editRole,
          // Only update password if a new one is typed
          password: editPassword.trim() !== '' ? editPassword.trim() : user.password
        };
      }
      return user;
    }));

    setEditingUsername(null);
    setMessage('อัปเดตข้อมูลผู้ใช้สำเร็จ');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {message && (
        <div style={{
          backgroundColor: 'var(--color-sage-light)',
          color: 'var(--color-sage)',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* User management list */}
        <div className="spa-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <UserCheck size={20} color="var(--color-gold)" />
            <h3 style={{ fontSize: '1.15rem' }}>รายชื่อผู้ใช้ระบบ (พนักงาน/ผู้บริหาร)</h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="user-table">
              <thead>
                <tr>
                  <th>ชื่อผู้ใช้ (Username)</th>
                  <th>ระดับสิทธิ์ (Role)</th>
                  <th>รหัสผ่าน (Password)</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {staffUsers.map(user => {
                  const isSelf = user.username === currentUser.username;
                  const isEditing = editingUsername === user.username;

                  return (
                    <tr key={user.username}>
                      <td data-label="ชื่อผู้ใช้" style={{ fontWeight: 600 }}>
                        {user.username} {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--color-gold)' }}>(คุณ)</span>}
                      </td>
                      
                      <td data-label="ระดับสิทธิ์">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="form-select"
                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                            disabled={user.username === 'admin'}
                          >
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                          </select>
                        ) : (
                          <span className={`user-role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      
                      <td data-label="รหัสผ่าน">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="เว้นว่างหากไม่เปลี่ยน"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          />
                        ) : (
                          <span style={{ fontFamily: 'monospace' }}>••••••••</span>
                        )}
                      </td>
                      
                      <td data-label="การจัดการ">
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn-primary" 
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => handleSaveEdit(user.username)}
                            >
                              บันทึก
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => setEditingUsername(null)}
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                              onClick={() => startEdit(user)}
                            >
                              <Key size={12} /> เปลี่ยนรหัส/แก้ไข
                            </button>
                            {user.username !== 'admin' && !isSelf && (
                              <button 
                                className="btn-icon delete" 
                                onClick={() => handleDeleteUser(user.username)}
                                title="ลบผู้ใช้"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Account Panel */}
        <div className="spa-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <UserPlus size={20} color="var(--color-gold)" />
            <h3 style={{ fontSize: '1.15rem' }}>เพิ่มบัญชีผู้ใช้พนักงาน</h3>
          </div>

          <form onSubmit={handleAddUser}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">ชื่อผู้ใช้ (Username)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="เช่น staff3"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">รหัสผ่านเริ่มต้น (Password)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="เช่น 123456"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ระดับสิทธิ์ (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="form-select"
                >
                  <option value="user">User (ลงคิว, ดูตาราง)</option>
                  <option value="admin">Admin (ผู้จัดการร้าน, ดูแลระบบ)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary">
              <UserPlus size={16} /> สร้างบัญชีผู้ใช้
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

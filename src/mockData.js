export const INITIAL_MASSEUSES = [
  { id: 'm1', nickname: 'พี่นก', status: 'active' },
  { id: 'm2', nickname: 'พี่บี', status: 'active' },
  { id: 'm3', nickname: 'พี่ฝน', status: 'active' },
  { id: 'm4', nickname: 'พี่แก้ว', status: 'active' }
];

export const INITIAL_SERVICES = [
  { id: 's1', name: 'นวดไทย (Traditional Thai)', type: 'thai-massage', duration: 60, price: 350 },
  { id: 's2', name: 'นวดอโรมา (Aromatherapy Oil)', type: 'oil-massage', duration: 90, price: 600 },
  { id: 's3', name: 'นวดเท้า (Foot Massage)', type: 'foot-massage', duration: 60, price: 300 },
  { id: 's4', name: 'นวดประคบสมุนไพร (Herbal Compress)', type: 'thai-massage', duration: 90, price: 500 },
  { id: 's5', name: 'นวดคอบ่าไหล่ (Neck & Shoulder)', type: 'other-massage', duration: 60, price: 250 }
];

export const INITIAL_USERS = [
  { username: 'admin', password: 'password123', displayName: 'เจ้าของร้าน (คุณมนต์)', role: 'admin' },
  { username: 'staff1', password: '123456', displayName: 'พนักงานหน้าร้าน (ฟ้า)', role: 'user' },
  { username: 'staff2', password: '123456', displayName: 'แคชเชียร์ (ตั้ม)', role: 'user' }
];

export const getInitialBookings = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  return [
    {
      id: 'b1',
      masseuseId: 'm1',
      serviceId: 's1',
      date: todayStr,
      startTime: '10:00',
      endTime: '11:00',
      duration: 60,
      price: 350,
      status: 'active'
    },
    {
      id: 'b2',
      masseuseId: 'm2',
      serviceId: 's3',
      date: todayStr,
      startTime: '11:30',
      endTime: '12:30',
      duration: 60,
      price: 300,
      status: 'active'
    },
    {
      id: 'b3',
      masseuseId: 'm3',
      serviceId: 's2',
      date: todayStr,
      startTime: '14:00',
      endTime: '15:30',
      duration: 90,
      price: 600,
      status: 'active'
    },
    {
      id: 'b4',
      masseuseId: 'm1',
      serviceId: 's4',
      date: todayStr,
      startTime: '16:00',
      endTime: '17:30',
      duration: 90,
      price: 500,
      status: 'completed'
    },
    {
      id: 'b5',
      masseuseId: 'm4',
      serviceId: 's2',
      date: todayStr,
      startTime: '18:00',
      endTime: '19:30',
      duration: 90,
      price: 600,
      status: 'active'
    }
  ];
};

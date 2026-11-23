export const areas = [
  { id: 'sylhet', name: 'Sylhet', bn: 'সিলেট', river: 'Surma', threshold: 5 },
  { id: 'chattogram', name: 'Chattogram', bn: 'চট্টগ্রাম', river: 'Karnaphuli', threshold: 5.5 },
  { id: 'sunamganj', name: 'Sunamganj', bn: 'সুনামগঞ্জ', river: 'Surma', threshold: 4.5 },
];

// Area order matches areas. Each reading is [river metres, 24-hour rain mm].
export const timeline = [
  { time: '08:00', readings: [[4.71, 76], [4.62, 55], [3.7, 38]] },
  { time: '08:15', readings: [[5.18, 103], [4.92, 74], [3.92, 49]] },
  { time: '08:30', readings: [[5.61, 121], [5.69, 102], [4.17, 65]] },
  { time: '08:45', readings: [[5.82, 135], [5.88, 113], [4.31, 81]] },
];

export const households = [
  { id: 'rahima', name: 'Rahima', area: 'sylhet', size: 4, channel: 'Voice call' },
  { id: 'jamal', name: 'Jamal', area: 'sylhet', size: 5, channel: 'SMS' },
  { id: 'salma', name: 'Salma', area: 'sylhet', size: 3, channel: 'WhatsApp' },
  { id: 'mina', name: 'Mina', area: 'chattogram', size: 3, channel: 'SMS' },
  { id: 'karim', name: 'Karim', area: 'chattogram', size: 6, channel: 'Voice call' },
];

export const shelters = [
  { id: 'school-a', name: 'Sylhet School Shelter', bn: 'সিলেট স্কুল আশ্রয়কেন্দ্র', area: 'sylhet', distance: 1.2, occupancy: 32, capacity: 50 },
  { id: 'school-b', name: 'Sylhet Community Hall', bn: 'সিলেট কমিউনিটি হল', area: 'sylhet', distance: 2.4, occupancy: 18, capacity: 50 },
  { id: 'school-c', name: 'Chattogram Civic Shelter', bn: 'চট্টগ্রাম নাগরিক আশ্রয়কেন্দ্র', area: 'chattogram', distance: 1.5, occupancy: 22, capacity: 50 },
];

export const replayDataSource = {
  read(tick) {
    const { readings } = timeline[tick];
    const previous = timeline[Math.max(0, tick - 1)].readings;
    return readings.map(([level, rain], index) => ({
      area: areas[index],
      level,
      rain,
      previousLevel: previous[index][0],
    }));
  },
};

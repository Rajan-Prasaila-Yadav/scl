export const INITIAL_FEES = [
  { id: 1, name: 'Tuition Fee', amount: 4500, frequency: 'Monthly', description: 'Standard tuition fee for regular academic modules', classIds: [1, 2, 3], status: 'active' },
  { id: 2, name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly', description: 'Charges for computing laboratory and resource materials', classIds: [1, 3], status: 'active' },
  { id: 3, name: 'Term Exam Fee', amount: 1200, frequency: 'One-Time', description: 'Examination sheet printing and administrative costs', classIds: [1, 2, 3], status: 'active' },
  { id: 4, name: 'Graduation Certificate Fee', amount: 1500, frequency: 'One-Time', description: 'Certificate embossing and graduation ceremony fee', classIds: [3], status: 'active' },
  { id: 5, name: 'Library Resource Fee', amount: 150, frequency: 'Weekly', description: 'Weekly access fee for online journals and library catalog', classIds: [1, 2], status: 'active' }
]

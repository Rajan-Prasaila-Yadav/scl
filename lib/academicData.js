export const STORAGE_KEYS = {
  subjects: 'educore.subjects',
  classes: 'educore.classes',
  students: 'educore.students',
  staff: 'educore.staff',
  roles: 'educore.roles',
  parents: 'educore.parents',
  timetable: 'educore.timetable',
  events: 'educore.events',
  periods: 'educore.periods',
  books: 'educore.books',
  borrowings: 'educore.borrowings',
  vehicles: 'educore.vehicles',
  routes: 'educore.routes',
  transportAssignments: 'educore.transport_assignments',
}

export const SUBJECT_CATEGORIES = ['Compulsory', 'Optional']

export const INITIAL_ROLES = [
  { id:1, name:'Senior Teacher', code:'ROLE-TEACH-SR', type:'teaching', description:'Experienced educator with full academic privileges', permissions:{Students:['view','export'],Parents:['view'],Staff:['view'],Classes:['view','edit','export','assign'],Subjects:['view','edit','export','assign'],Timetable:['view','edit','export'],Examinations:['view','create','edit','export','approve'],Attendance:['view','create','edit','export'],Library:['view','export'],Reports:['view','export']}, users:5, status:'active', createdAt:'2026-04-22', updatedAt:'2026-05-09', constraints:['own_campus','assigned_classes'] },
  { id:2, name:'Junior Teacher', code:'ROLE-TEACH-JR', type:'teaching', description:'Basic teaching access for assigned classes only', permissions:{Students:['view'],Classes:['view'],Subjects:['view'],Attendance:['view','create','edit'],Examinations:['view','create'],Timetable:['view'],Library:['view']}, users:0, status:'active', createdAt:'2026-04-24', updatedAt:'2026-05-07', constraints:['own_campus','assigned_classes'] },
  { id:3, name:'Exam Coordinator', code:'ROLE-TEACH-EC', type:'teaching', description:'Manages exam schedules, results and report cards', permissions:{Students:['view','export'],Examinations:['view','create','edit','delete','export','approve'],Attendance:['view','export'],Reports:['view','export'],Classes:['view'],Subjects:['view']}, users:0, status:'active', createdAt:'2026-04-25', updatedAt:'2026-05-05', constraints:['own_campus'] },
  { id:4, name:'Class Teacher', code:'ROLE-TEACH-CT', type:'teaching', description:'Homeroom teacher with parent communication privileges', permissions:{Students:['view','edit','export'],Parents:['view','export'],Attendance:['view','create','edit','export'],Classes:['view','edit'],Examinations:['view','create'],Announcements:['view','create']}, users:0, status:'active', createdAt:'2026-04-26', updatedAt:'2026-05-04', constraints:['own_campus','assigned_classes'] },
  { id:5, name:'Librarian', code:'ROLE-NT-LIB', type:'non-teaching', description:'Manages library catalog, issues and returns', permissions:{Library:['view','create','edit','delete','export'],Students:['view'],Staff:['view'],Reports:['view']}, users:0, status:'active', createdAt:'2026-04-28', updatedAt:'2026-05-02', constraints:['own_campus'] },
  { id:6, name:'Accountant', code:'ROLE-NT-ACC', type:'non-teaching', description:'Handles fee collection, receipts and payroll processing', permissions:{Fees:['view','create','edit','export','approve'],Reports:['view','export'],Students:['view'],Staff:['view']}, users:0, status:'active', createdAt:'2026-04-28', updatedAt:'2026-04-28', constraints:['own_campus'] },
  { id:7, name:'Transport Manager', code:'ROLE-NT-TRN', type:'non-teaching', description:'Manages routes, vehicles and driver assignments', permissions:{Transport:['view','create','edit','delete','export'],Students:['view'],Staff:['view']}, users:0, status:'blocked', createdAt:'2026-04-20', updatedAt:'2026-04-29', constraints:[] },
  { id:8, name:'Hostel Warden', code:'ROLE-NT-HST', type:'non-teaching', description:'Hostel room allocation and student supervision', permissions:{Hostel:['view','create','edit','export'],Students:['view'],Attendance:['view','create']}, users:0, status:'active', createdAt:'2026-04-22', updatedAt:'2026-05-01', constraints:['own_campus'] },
  { id:9, name:'Sports Coordinator', code:'ROLE-TEACH-SP', type:'teaching', description:'Manages sports activities, events and teams', permissions:{Students:['view'],Classes:['view'],Attendance:['view','create'],Announcements:['view','create']}, users:0, status:'active', createdAt:'2026-04-30', updatedAt:'2026-05-03', constraints:['own_campus'] },
  { id:10, name:'Reception Desk', code:'ROLE-NT-REC', type:'non-teaching', description:'Front desk inquiries, visitor management', permissions:{Students:['view'],Parents:['view'],Staff:['view'],Announcements:['view']}, users:0, status:'active', createdAt:'2026-05-01', updatedAt:'2026-05-06', constraints:['own_campus'] },
]

export const INITIAL_SUBJECTS = [
  {
    id: 1,
    name: 'English',
    code: 'SUB-ENG',
    category: 'Compulsory',
    publication: 'Oxford University Press',
    bookName: 'New Pathways English',
    bookCode: 'OX-NP-08',
    status: 'active',
  },
  {
    id: 2,
    name: 'Mathematics',
    code: 'SUB-MAT',
    category: 'Compulsory',
    publication: 'NCERT',
    bookName: 'Mathematics Textbook',
    bookCode: 'NCERT-MATH-08',
    status: 'active',
  },
  {
    id: 3,
    name: 'Science',
    code: 'SUB-SCI',
    category: 'Compulsory',
    publication: 'NCERT',
    bookName: 'Science Textbook',
    bookCode: 'NCERT-SCI-08',
    status: 'active',
  },
  {
    id: 4,
    name: 'Social Studies',
    code: 'SUB-SST',
    category: 'Compulsory',
    publication: 'Orient BlackSwan',
    bookName: 'Social Studies Today',
    bookCode: '',
    status: 'active',
  },
  {
    id: 5,
    name: 'Hindi',
    code: 'SUB-HIN',
    category: 'Compulsory',
    publication: 'NCERT',
    bookName: 'Vasant',
    bookCode: 'NCERT-HIN-08',
    status: 'active',
  },
  {
    id: 6,
    name: 'Computer Science',
    code: 'SUB-CS',
    category: 'Optional',
    publication: '',
    bookName: '',
    bookCode: '',
    status: 'active',
  },
]

export const INITIAL_STAFF = [
  {
    id: 1,
    name: 'Rakesh Sharma',
    employeeId: 'EMP-204',
    department: 'Mathematics',
    role: 'Senior Teacher',
    userType: 'teaching',
    status: 'active',
    email: 'rakesh.sharma@educore.edu',
    phone: '9845123650',
    dob: '1984-06-15',
    joiningDate: '2020-07-01',
    qualification: 'M.Sc. Mathematics, B.Ed',
    experience: '12',
    institution: 'Delhi University',
    address: 'Flat 402, Green Avenue, New Delhi, India, 110001',
    nationalIdNo: 'NID-8845-9201',
    baseSalary: 6000,
    additions: [
      { label: 'Dearness Allowance', type: 'addition', valType: 'percent', value: 10 },
      { label: 'Home Rent Allowance', type: 'addition', valType: 'fixed', value: 300 }
    ],
    deductions: [
      { label: 'Provident Fund', type: 'deduction', valType: 'percent', value: 8 },
      { label: 'Professional Tax', type: 'deduction', valType: 'fixed', value: 150 }
    ],
    documents: {
      citizenship: { name: 'Rakesh Sharma Citizenship.pdf', type: 'application/pdf', size: 128450 },
      ppPhoto: { name: 'Rakesh Sharma PP size photo.jpg', type: 'image/jpeg', size: 85200 }
    },
    salaryHistory: [
      { id: 101, slipNo: 'SLIP-SAL-2026-081', month: 'April 2026', baseSalary: 6000, netSalary: 6270, paymentDate: '30/04/2026', paidBy: 'Super Admin', paymentMode: 'Bank Transfer', status: 'paid', additions: [{ label: 'Dearness Allowance', type: 'addition', valType: 'percent', value: 10 }, { label: 'Home Rent Allowance', type: 'addition', valType: 'fixed', value: 300 }], deductions: [{ label: 'Provident Fund', type: 'deduction', valType: 'percent', value: 8 }, { label: 'Professional Tax', type: 'deduction', valType: 'fixed', value: 150 }] },
      { id: 102, slipNo: 'SLIP-SAL-2026-112', month: 'May 2026', baseSalary: 6000, netSalary: 6270, paymentDate: '31/05/2026', paidBy: 'Super Admin', paymentMode: 'Bank Transfer', status: 'paid', additions: [{ label: 'Dearness Allowance', type: 'addition', valType: 'percent', value: 10 }, { label: 'Home Rent Allowance', type: 'addition', valType: 'fixed', value: 300 }], deductions: [{ label: 'Provident Fund', type: 'deduction', valType: 'percent', value: 8 }, { label: 'Professional Tax', type: 'deduction', valType: 'fixed', value: 150 }] },
      { id: 103, slipNo: 'SLIP-SAL-2026-215', month: 'June 2026', baseSalary: 6000, netSalary: 6270, paymentDate: '—', paidBy: '—', paymentMode: '—', status: 'pending', additions: [{ label: 'Dearness Allowance', type: 'addition', valType: 'percent', value: 10 }, { label: 'Home Rent Allowance', type: 'addition', valType: 'fixed', value: 300 }], deductions: [{ label: 'Provident Fund', type: 'deduction', valType: 'percent', value: 8 }, { label: 'Professional Tax', type: 'deduction', valType: 'fixed', value: 150 }] }
    ]
  },
  {
    id: 2,
    name: 'Aditi Verma',
    employeeId: 'EMP-188',
    department: 'Science',
    role: 'Senior Teacher',
    userType: 'teaching',
    status: 'active',
    email: 'aditi.verma@educore.edu',
    phone: '9845123651',
    dob: '1988-11-20',
    joiningDate: '2019-09-15',
    qualification: 'Ph.D. in Physics',
    experience: '15',
    institution: 'IISc Bangalore',
    address: 'House No 12, Park Street, Kolkata, India, 700016',
    nationalIdNo: 'NID-8845-9202',
    baseSalary: 6500,
    additions: [
      { label: 'Research Allowance', type: 'addition', valType: 'fixed', value: 500 }
    ],
    deductions: [
      { label: 'Provident Fund', type: 'deduction', valType: 'percent', value: 8 }
    ],
    documents: {
      citizenship: { name: 'Aditi Verma Citizenship.pdf', type: 'application/pdf', size: 104500 }
    },
    salaryHistory: [
      { id: 201, slipNo: 'SLIP-SAL-2026-083', month: 'April 2026', baseSalary: 6500, netSalary: 6480, paymentDate: '30/04/2026', paidBy: 'Super Admin', paymentMode: 'Bank Transfer', status: 'paid', additions: [{ label: 'Research Allowance', type: 'addition', valType: 'fixed', value: 500 }], deductions: [{ label: 'Provident Fund', type: 'deduction', valType: 'percent', value: 8 }] },
      { id: 202, slipNo: 'SLIP-SAL-2026-121', month: 'May 2026', baseSalary: 6500, netSalary: 6480, paymentDate: '31/05/2026', paidBy: 'Super Admin', paymentMode: 'Bank Transfer', status: 'paid', additions: [{ label: 'Research Allowance', type: 'addition', valType: 'fixed', value: 500 }], deductions: [{ label: 'Provident Fund', type: 'deduction', valType: 'percent', value: 8 }] },
      { id: 203, slipNo: 'SLIP-SAL-2026-218', month: 'June 2026', baseSalary: 6500, netSalary: 6480, paymentDate: '—', paidBy: '—', paymentMode: '—', status: 'pending', additions: [{ label: 'Research Allowance', type: 'addition', valType: 'fixed', value: 500 }], deductions: [{ label: 'Provident Fund', type: 'deduction', valType: 'percent', value: 8 }] }
    ]
  },
  {
    id: 3,
    name: 'Neha Joshi',
    employeeId: 'EMP-223',
    department: 'English',
    role: 'Class Teacher',
    userType: 'teaching',
    status: 'active',
    email: 'neha.joshi@educore.edu',
    phone: '9845123652',
    dob: '1992-02-28',
    joiningDate: '2021-06-01',
    qualification: 'M.A. English Literature',
    experience: '8',
    institution: 'JNU New Delhi',
    address: '154 Lane, Vasant Vihar, New Delhi, India, 110057',
    nationalIdNo: 'NID-8845-9203',
    baseSalary: 5200,
    additions: [],
    deductions: [],
    documents: {},
    salaryHistory: [
      { id: 301, slipNo: 'SLIP-SAL-2026-085', month: 'April 2026', baseSalary: 5200, netSalary: 5200, paymentDate: '28/04/2026', paidBy: 'Super Admin', paymentMode: 'Cash', status: 'paid', additions: [], deductions: [] },
      { id: 302, slipNo: 'SLIP-SAL-2026-125', month: 'May 2026', baseSalary: 5200, netSalary: 5200, paymentDate: '29/05/2026', paidBy: 'Super Admin', paymentMode: 'Cash', status: 'paid', additions: [], deductions: [] },
      { id: 303, slipNo: 'SLIP-SAL-2026-220', month: 'June 2026', baseSalary: 5200, netSalary: 5200, paymentDate: '—', paidBy: '—', paymentMode: '—', status: 'pending', additions: [], deductions: [] }
    ]
  },
  {
    id: 4,
    name: 'Rajiv Kumar',
    employeeId: 'EMP-245',
    department: 'Hindi',
    role: 'Class Teacher',
    userType: 'teaching',
    status: 'active',
    email: 'rajiv.kumar@educore.edu',
    phone: '9845123653',
    dob: '1990-04-12',
    joiningDate: '2022-08-01',
    qualification: 'B.Ed, M.A. Hindi',
    experience: '6',
    institution: 'BHU Varanasi',
    address: 'Sector 5, Rajendra Nagar, Patna, India, 800016',
    nationalIdNo: 'NID-8845-9204',
    baseSalary: 4800,
    additions: [],
    deductions: [],
    documents: {},
    salaryHistory: [
      { id: 401, slipNo: 'SLIP-SAL-2026-087', month: 'April 2026', baseSalary: 4800, netSalary: 4800, paymentDate: '28/04/2026', paidBy: 'Super Admin', paymentMode: 'Cash', status: 'paid', additions: [], deductions: [] },
      { id: 402, slipNo: 'SLIP-SAL-2026-127', month: 'May 2026', baseSalary: 4800, netSalary: 4800, paymentDate: '—', paidBy: '—', paymentMode: '—', status: 'pending', additions: [], deductions: [] },
      { id: 403, slipNo: 'SLIP-SAL-2026-224', month: 'June 2026', baseSalary: 4800, netSalary: 4800, paymentDate: '—', paidBy: '—', paymentMode: '—', status: 'pending', additions: [], deductions: [] }
    ]
  },
  {
    id: 5,
    name: 'Priya Singh',
    employeeId: 'EMP-267',
    department: 'Social Studies',
    role: 'Senior Teacher',
    userType: 'teaching',
    status: 'active',
    email: 'priya.singh@educore.edu',
    phone: '9845123654',
    dob: '1986-09-08',
    joiningDate: '2023-01-10',
    qualification: 'M.A. History',
    experience: '10',
    institution: 'Mumbai University',
    address: '22 Bandra Reclamation, Mumbai, India, 400050',
    nationalIdNo: 'NID-8845-9205',
    baseSalary: 5400,
    additions: [],
    deductions: [],
    documents: {},
    salaryHistory: [
      { id: 501, slipNo: 'SLIP-SAL-2026-089', month: 'April 2026', baseSalary: 5400, netSalary: 5400, paymentDate: '30/04/2026', paidBy: 'Super Admin', paymentMode: 'Bank Transfer', status: 'paid', additions: [], deductions: [] },
      { id: 502, slipNo: 'SLIP-SAL-2026-129', month: 'May 2026', baseSalary: 5400, netSalary: 5400, paymentDate: '31/05/2026', paidBy: 'Super Admin', paymentMode: 'Bank Transfer', status: 'paid', additions: [], deductions: [] },
      { id: 503, slipNo: 'SLIP-SAL-2026-228', month: 'June 2026', baseSalary: 5400, netSalary: 5400, paymentDate: '—', paidBy: '—', paymentMode: '—', status: 'pending', additions: [], deductions: [] }
    ]
  }
]

export const STAFF = INITIAL_STAFF

export const INITIAL_STUDENTS = [
  {
    id: 1,
    name: 'Aarav Mehta',
    admissionNo: 'ADM-1001',
    classId: 1,
    rollNo: 1,
    gender: 'Male',
    guardianName: 'Suresh Mehta',
    contact: '9876543210',
    status: 'active',
    email: 'aarav.mehta@gmail.com',
    phone: '9876543210',
    dob: '2012-05-14',
    documents: {
      citizenship: { name: 'Aarav Mehta Citizenship.pdf', type: 'application/pdf', size: 104857 },
      ppSizeImage: { name: 'Aarav Mehta PP size image.png', type: 'image/png', size: 45200 }
    },
    payments: [
      {
        id: 1,
        invoiceNo: 'SLIP-2026-081',
        amount: 6350,
        amountPaid: 6350,
        month: 'April 2026',
        status: 'paid',
        paymentDate: '08/04/2026 09:15:30',
        paidBy: 'Suresh Mehta',
        payerRelation: 'Father',
        paymentMode: 'Cash',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Term Exam Fee', amount: 1200, frequency: 'One-Time' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 2,
        invoiceNo: 'SLIP-2026-112',
        amount: 5150,
        amountPaid: 5150,
        month: 'May 2026',
        status: 'paid',
        paymentDate: '12/05/2026 14:20:45',
        paidBy: 'Suresh Mehta',
        payerRelation: 'Father',
        paymentMode: 'Online',
        onlineApp: 'E-Sewa',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 3,
        invoiceNo: 'SLIP-2026-215',
        amount: 5150,
        amountPaid: 0,
        month: 'June 2026',
        status: 'pending',
        paymentDate: '—',
        paidBy: '—',
        payerRelation: '—',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      }
    ],
    exams: [
      {
        id: 1,
        year: '2026',
        examName: 'Mid-Term Evaluation',
        date: '15/03/2026',
        subjects: [
          { subjectName: 'English', marksObtained: 88, maxMarks: 100, grade: 'A' },
          { subjectName: 'Mathematics', marksObtained: 94, maxMarks: 100, grade: 'A+' },
          { subjectName: 'Science', marksObtained: 81, maxMarks: 100, grade: 'A' },
          { subjectName: 'Social Studies', marksObtained: 85, maxMarks: 100, grade: 'A' },
          { subjectName: 'Hindi', marksObtained: 80, maxMarks: 100, grade: 'A' },
          { subjectName: 'Computer Science', marksObtained: 95, maxMarks: 100, grade: 'A+' }
        ],
        remarks: 'Good analytical skills and active class participation.'
      }
    ]
  },
  {
    id: 2,
    name: 'Ishita Rao',
    admissionNo: 'ADM-1002',
    classId: 1,
    rollNo: 2,
    gender: 'Female',
    guardianName: 'Priya Rao',
    contact: '9876543211',
    status: 'active',
    email: 'ishita.rao@yahoo.com',
    phone: '9876543211',
    dob: '2012-09-21',
    documents: {
      dobCert: { name: 'Ishita Rao Date of Birth Certificate.pdf', type: 'application/pdf', size: 89400 }
    },
    payments: [
      {
        id: 4,
        invoiceNo: 'SLIP-2026-083',
        amount: 6350,
        amountPaid: 6350,
        month: 'April 2026',
        status: 'paid',
        paymentDate: '05/04/2026 11:10:05',
        paidBy: 'Priya Rao',
        payerRelation: 'Mother',
        paymentMode: 'Online',
        onlineApp: 'Khalti',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Term Exam Fee', amount: 1200, frequency: 'One-Time' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 5,
        invoiceNo: 'SLIP-2026-121',
        amount: 5150,
        amountPaid: 5150,
        month: 'May 2026',
        status: 'paid',
        paymentDate: '09/05/2026 10:45:12',
        paidBy: 'Priya Rao',
        payerRelation: 'Mother',
        paymentMode: 'Cash',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 6,
        invoiceNo: 'SLIP-2026-218',
        amount: 5150,
        amountPaid: 0,
        month: 'June 2026',
        status: 'overdue',
        paymentDate: '—',
        paidBy: '—',
        payerRelation: '—',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      }
    ],
    exams: [
      {
        id: 1,
        year: '2026',
        examName: 'Mid-Term Evaluation',
        date: '15/03/2026',
        subjects: [
          { subjectName: 'English', marksObtained: 92, maxMarks: 100, grade: 'A+' },
          { subjectName: 'Mathematics', marksObtained: 89, maxMarks: 100, grade: 'A' },
          { subjectName: 'Science', marksObtained: 87, maxMarks: 100, grade: 'A' },
          { subjectName: 'Social Studies', marksObtained: 91, maxMarks: 100, grade: 'A+' },
          { subjectName: 'Hindi', marksObtained: 85, maxMarks: 100, grade: 'A' }
        ],
        remarks: 'Outstanding dedication and very active learner.'
      }
    ]
  },
  {
    id: 3,
    name: 'Kabir Sethi',
    admissionNo: 'ADM-1003',
    classId: 1,
    rollNo: 3,
    gender: 'Male',
    guardianName: 'Anil Sethi',
    contact: '9876543212',
    status: 'active',
    email: 'kabir.sethi@gmail.com',
    phone: '9876543212',
    dob: '2012-02-08',
    documents: {},
    payments: [
      {
        id: 7,
        invoiceNo: 'SLIP-2026-085',
        amount: 6350,
        amountPaid: 6350,
        month: 'April 2026',
        status: 'paid',
        paymentDate: '06/04/2026 09:30:15',
        paidBy: 'Anil Sethi',
        payerRelation: 'Father',
        paymentMode: 'Online',
        onlineApp: 'Bank Transfer',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Term Exam Fee', amount: 1200, frequency: 'One-Time' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 8,
        invoiceNo: 'SLIP-2026-125',
        amount: 5150,
        amountPaid: 5150,
        month: 'May 2026',
        status: 'paid',
        paymentDate: '10/05/2026 11:20:45',
        paidBy: 'Anil Sethi',
        payerRelation: 'Father',
        paymentMode: 'Cash',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 9,
        invoiceNo: 'SLIP-2026-220',
        amount: 5150,
        amountPaid: 0,
        month: 'June 2026',
        status: 'pending',
        paymentDate: '—',
        paidBy: '—',
        payerRelation: '—',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      }
    ],
    exams: []
  },
  {
    id: 4,
    name: 'Meera Nair',
    admissionNo: 'ADM-1004',
    classId: 2,
    rollNo: 1,
    gender: 'Female',
    guardianName: 'Lakshmi Nair',
    contact: '9876543213',
    status: 'active',
    email: 'meera.nair@outlook.com',
    phone: '9876543213',
    dob: '2011-11-30',
    documents: {
      academicCert: { name: 'Meera Nair Academic certificate.pdf', type: 'application/pdf', size: 125400 }
    },
    payments: [
      {
        id: 10,
        invoiceNo: 'SLIP-2026-090',
        amount: 5850,
        amountPaid: 5850,
        month: 'April 2026',
        status: 'paid',
        paymentDate: '10/04/2026 15:30:22',
        paidBy: 'Lakshmi Nair',
        payerRelation: 'Mother',
        paymentMode: 'Cash',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Term Exam Fee', amount: 1200, frequency: 'One-Time' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 11,
        invoiceNo: 'SLIP-2026-130',
        amount: 4650,
        amountPaid: 0,
        month: 'May 2026',
        status: 'overdue',
        paymentDate: '—',
        paidBy: '—',
        payerRelation: '—',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 12,
        invoiceNo: 'SLIP-2026-224',
        amount: 4650,
        amountPaid: 0,
        month: 'June 2026',
        status: 'pending',
        paymentDate: '—',
        paidBy: '—',
        payerRelation: '—',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      }
    ],
    exams: []
  },
  {
    id: 5,
    name: 'Vihaan Kapoor',
    admissionNo: 'ADM-1005',
    classId: 2,
    rollNo: 2,
    gender: 'Male',
    guardianName: 'Raj Kapoor',
    contact: '9876543214',
    status: 'active',
    email: 'vihaan.k@gmail.com',
    phone: '9876543214',
    dob: '2011-04-12',
    documents: {},
    payments: [
      {
        id: 13,
        invoiceNo: 'SLIP-2026-095',
        amount: 5850,
        amountPaid: 5850,
        month: 'April 2026',
        status: 'paid',
        paymentDate: '11/04/2026 14:15:30',
        paidBy: 'Raj Kapoor',
        payerRelation: 'Father',
        paymentMode: 'Online',
        onlineApp: 'E-Sewa',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Term Exam Fee', amount: 1200, frequency: 'One-Time' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 14,
        invoiceNo: 'SLIP-2026-135',
        amount: 4650,
        amountPaid: 4650,
        month: 'May 2026',
        status: 'paid',
        paymentDate: '15/05/2026 10:20:12',
        paidBy: 'Raj Kapoor',
        payerRelation: 'Father',
        paymentMode: 'Cash',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      },
      {
        id: 15,
        invoiceNo: 'SLIP-2026-228',
        amount: 4650,
        amountPaid: 0,
        month: 'June 2026',
        status: 'overdue',
        paymentDate: '—',
        paidBy: '—',
        payerRelation: '—',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Library Resource Fee', amount: 150, frequency: 'Weekly' }
        ]
      }
    ],
    exams: []
  },
  {
    id: 6,
    name: 'Sara Khan',
    admissionNo: 'ADM-1006',
    classId: 3,
    rollNo: 1,
    gender: 'Female',
    guardianName: 'Asif Khan',
    contact: '9876543215',
    status: 'active',
    email: 'sara.khan@gmail.com',
    phone: '9876543215',
    dob: '2010-08-04',
    documents: {
      citizenship: { name: 'Sara Khan Citizenship.jpg', type: 'image/jpeg', size: 231000 }
    },
    payments: [
      {
        id: 16,
        invoiceNo: 'SLIP-2026-092',
        amount: 7700,
        amountPaid: 7700,
        month: 'April 2026',
        status: 'paid',
        paymentDate: '11/04/2026 09:20:10',
        paidBy: 'Asif Khan',
        payerRelation: 'Father',
        paymentMode: 'Cash',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
          { name: 'Term Exam Fee', amount: 1200, frequency: 'One-Time' },
          { name: 'Graduation Certificate Fee', amount: 1500, frequency: 'One-Time' }
        ]
      },
      {
        id: 17,
        invoiceNo: 'SLIP-2026-140',
        amount: 5000,
        amountPaid: 5000,
        month: 'May 2026',
        status: 'paid',
        paymentDate: '14/05/2026 16:30:20',
        paidBy: 'Asif Khan',
        payerRelation: 'Father',
        paymentMode: 'Online',
        onlineApp: 'Khalti',
        receivedBy: 'Super Admin',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' }
        ]
      },
      {
        id: 18,
        invoiceNo: 'SLIP-2026-232',
        amount: 5000,
        amountPaid: 0,
        month: 'June 2026',
        status: 'pending',
        paymentDate: '—',
        paidBy: '—',
        payerRelation: '—',
        feesBreakdown: [
          { name: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
          { name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' }
        ]
      }
    ],
    exams: []
  }
]

// Legacy alias so any old import of STUDENTS still works
export const STUDENTS = INITIAL_STUDENTS

export const INITIAL_CLASSES = [
  {
    id: 1,
    name: 'Class 8',
    section: 'A',
    classCode: 'CLS-8A',
    description: 'Grade 8 A focuses on primary high-school foundational courses and extracurricular skills.',
    room: 'B-201',
    capacity: 40,
    classTeacherId: 3,
    monitorId: 1,
    subjectIds: [1, 2, 3, 4, 5, 6],
    subjectTeacherMap: { "1": 3, "2": 1, "3": 2, "4": 5, "5": 4, "6": 1 },
    status: 'active',
  },
  {
    id: 2,
    name: 'Class 9',
    section: 'A',
    classCode: 'CLS-9A',
    description: 'Grade 9 A is preparing students for secondary level standards with an advanced curriculum.',
    room: 'B-302',
    capacity: 42,
    classTeacherId: 2,
    monitorId: 4,
    subjectIds: [1, 2, 3, 4, 5],
    subjectTeacherMap: { "1": 3, "2": 1, "3": 2, "4": 5, "5": 4 },
    status: 'active',
  },
  {
    id: 3,
    name: 'Class 10',
    section: 'B',
    classCode: 'CLS-10B',
    description: 'Grade 10 B is a senior secondary class focusing on public board examinations preparation.',
    room: 'C-104',
    capacity: 38,
    classTeacherId: 1,
    monitorId: 6,
    subjectIds: [1, 2, 3, 4, 6],
    subjectTeacherMap: { "1": 3, "2": 1, "3": 2, "4": 5, "6": 1 },
    status: 'active',
  },
]

export { readList as readStoredList, readObject as readStoredObject, writeValue as writeStoredList } from './storage.js'

let lastId = 0
export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const words = crypto.getRandomValues(new Uint32Array(2))
    return (words[0] & 0x1fffff) * 4294967296 + words[1] || makeId()
  }
  lastId = Math.max(Date.now() * 1000, lastId + 1)
  return lastId
}

export function makeSubjectCode(name) {
  const letters = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 3))
    .join('-')
    .slice(0, 12)

  return `SUB-${letters || Date.now().toString(36).toUpperCase().slice(-4)}`
}

export function makeAdmissionNo() {
  const num = makeId().toString(36).toUpperCase()
  return `ADM-${num}`
}

export function numberToWords(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Zero rupees only';
  if (!Number.isFinite(Number(num))) return 'Zero rupees only';
  const minorUnits = Math.round((Math.abs(Number(num)) + Number.EPSILON) * 100);
  const fraction = minorUnits % 100;
  if (fraction) {
    const wholeWords = numberToWords(Math.floor(minorUnits / 100)).replace(' only', '');
    const fractionWords = numberToWords(fraction).replace(' rupees only', '').toLowerCase();
    return `${Number(num) < 0 ? 'Negative ' : ''}${wholeWords} and ${fractionWords} paisa only`;
  }
  let value = Math.round(Number(num));
  if (value < 0) return 'Negative ' + numberToWords(Math.abs(value));
  if (value === 0) return 'Zero rupees only';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const scales = ['', 'thousand', 'million', 'billion'];

  function convertLessThanThousand(n) {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  let words = '';
  let scaleIndex = 0;
  while (value > 0) {
    const chunk = value % 1000;
    if (chunk !== 0) {
      const chunkStr = convertLessThanThousand(chunk);
      const scaleStr = scales[scaleIndex] ? ' ' + scales[scaleIndex] : '';
      words = chunkStr + scaleStr + (words ? ' ' + words : '');
    }
    value = Math.floor(value / 1000);
    scaleIndex++;
  }

  words = words.trim();
  if (!words) return 'Zero rupees only';
  return (words.charAt(0).toUpperCase() + words.slice(1)) + ' rupees only';
}


export const INITIAL_PARENTS = [
  {
    id: 1,
    parentId: 'PRN-101',
    name: 'Suresh Mehta',
    phone: '9876543210',
    email: 'suresh.mehta@gmail.com',
    occupation: 'Business Analyst',
    relationship: 'Father',
    status: 'active',
    studentIds: [1],
    permanentAddress: {
      district: 'Lalitpur',
      country: 'Nepal',
      city: 'Kathmandu',
      zip: '44600',
      state: 'Bagmati',
      street: 'Green Lane House 23',
      wardNo: '4',
      municipalityType: 'Municipality'
    },
    temporaryAddress: {
      district: 'Lalitpur',
      country: 'Nepal',
      city: 'Kathmandu',
      zip: '44600',
      state: 'Bagmati',
      street: 'Green Lane House 23',
      wardNo: '4',
      municipalityType: 'Municipality'
    },
    sameAsPermanent: true
  },
  {
    id: 2,
    parentId: 'PRN-102',
    name: 'Priya Rao',
    phone: '9876543211',
    email: 'priya.rao@yahoo.com',
    occupation: 'Teacher',
    relationship: 'Mother',
    status: 'active',
    studentIds: [2],
    permanentAddress: {
      district: 'Kathmandu',
      country: 'Nepal',
      city: 'Kirtipur',
      zip: '44618',
      state: 'Bagmati',
      street: 'New Bazar 12',
      wardNo: '2',
      municipalityType: 'Municipality'
    },
    temporaryAddress: {
      district: 'Kathmandu',
      country: 'Nepal',
      city: 'Kirtipur',
      zip: '44618',
      state: 'Bagmati',
      street: 'New Bazar 12',
      wardNo: '2',
      municipalityType: 'Municipality'
    },
    sameAsPermanent: true
  },
  {
    id: 3,
    parentId: 'PRN-103',
    name: 'Anil Sethi',
    phone: '9876543212',
    email: 'anil.sethi@gmail.com',
    occupation: 'Software Engineer',
    relationship: 'Father',
    status: 'active',
    studentIds: [3],
    permanentAddress: {
      district: 'Bhaktapur',
      country: 'Nepal',
      city: 'Bhaktapur',
      zip: '44800',
      state: 'Bagmati',
      street: 'Durbar Square 5',
      wardNo: '1',
      municipalityType: 'Municipality'
    },
    temporaryAddress: {
      district: 'Bhaktapur',
      country: 'Nepal',
      city: 'Bhaktapur',
      zip: '44800',
      state: 'Bagmati',
      street: 'Durbar Square 5',
      wardNo: '1',
      municipalityType: 'Municipality'
    },
    sameAsPermanent: true
  }
]

export const INITIAL_PERIODS = [
  { id: 1, name: 'Period 1', type: 'Academic', startTime: '09:00', endTime: '09:45' },
  { id: 2, name: 'Period 2', type: 'Academic', startTime: '09:45', endTime: '10:30' },
  { id: 3, name: 'Short Break', type: 'Break', startTime: '10:30', endTime: '10:45' },
  { id: 4, name: 'Period 3', type: 'Academic', startTime: '10:45', endTime: '11:30' },
  { id: 5, name: 'Period 4', type: 'Academic', startTime: '11:30', endTime: '12:15' },
  { id: 6, name: 'Lunch Break', type: 'Break', startTime: '12:15', endTime: '13:00' },
  { id: 7, name: 'Period 5', type: 'Academic', startTime: '13:00', endTime: '13:45' },
  { id: 8, name: 'Period 6', type: 'Academic', startTime: '13:45', endTime: '14:30' }
]

export const INITIAL_TIMETABLE = [
  // Class 8 - A (classId: 1)
  { id: 1, classId: 1, day: 'Monday', periodId: 1, subjectId: 1, teacherId: 3, room: 'B-201' },
  { id: 2, classId: 1, day: 'Monday', periodId: 2, subjectId: 2, teacherId: 1, room: 'B-201' },
  { id: 3, classId: 1, day: 'Monday', periodId: 4, subjectId: 3, teacherId: 2, room: 'B-201' },
  { id: 4, classId: 1, day: 'Monday', periodId: 5, subjectId: 4, teacherId: 5, room: 'B-201' },
  { id: 5, classId: 1, day: 'Monday', periodId: 7, subjectId: 5, teacherId: 4, room: 'B-201' },
  { id: 6, classId: 1, day: 'Monday', periodId: 8, subjectId: 6, teacherId: 1, room: 'B-201' },

  { id: 7, classId: 1, day: 'Tuesday', periodId: 1, subjectId: 1, teacherId: 3, room: 'B-201' },
  { id: 8, classId: 1, day: 'Tuesday', periodId: 2, subjectId: 2, teacherId: 1, room: 'B-201' },
  { id: 9, classId: 1, day: 'Tuesday', periodId: 4, subjectId: 4, teacherId: 5, room: 'B-201' },
  { id: 10, classId: 1, day: 'Tuesday', periodId: 5, subjectId: 3, teacherId: 2, room: 'B-201' },

  { id: 11, classId: 1, day: 'Wednesday', periodId: 1, subjectId: 1, teacherId: 3, room: 'B-201' },
  { id: 12, classId: 1, day: 'Wednesday', periodId: 2, subjectId: 5, teacherId: 4, room: 'B-201' },
  { id: 13, classId: 1, day: 'Wednesday', periodId: 4, subjectId: 3, teacherId: 2, room: 'B-201' },

  // Class 9 - A (classId: 2)
  { id: 14, classId: 2, day: 'Monday', periodId: 1, subjectId: 2, teacherId: 1, room: 'B-302' },
  { id: 15, classId: 2, day: 'Monday', periodId: 2, subjectId: 1, teacherId: 3, room: 'B-302' },
  { id: 16, classId: 2, day: 'Monday', periodId: 4, subjectId: 3, teacherId: 2, room: 'B-302' },
  { id: 17, classId: 2, day: 'Monday', periodId: 5, subjectId: 4, teacherId: 5, room: 'B-302' },

  // Class 10 - B (classId: 3)
  { id: 18, classId: 3, day: 'Monday', periodId: 1, subjectId: 3, teacherId: 2, room: 'C-104' },
  { id: 19, classId: 3, day: 'Monday', periodId: 2, subjectId: 4, teacherId: 5, room: 'C-104' },
  { id: 20, classId: 3, day: 'Monday', periodId: 4, subjectId: 1, teacherId: 3, room: 'C-104' },
  { id: 21, classId: 3, day: 'Monday', periodId: 5, subjectId: 2, teacherId: 1, room: 'C-104' }
]

export const INITIAL_EVENTS = [
  {
    id: 1,
    title: 'Science & Technology Exhibition 2026',
    description: 'Annual science fair displaying research experiments and innovations by Classes 8, 9, and 10. Highlights include robotics, solar energy models, and chemical reaction demonstrations. All parents and local schools are invited to attend.',
    category: 'Event',
    date: '2026-06-25',
    startTime: '10:00',
    endTime: '15:00',
    targetAudience: 'All',
    postedBy: 'Super Admin',
    likes: 12,
    comments: [
      { id: 1, user: 'Aditi Verma', role: 'Senior Teacher', text: 'The science department has completed lab setup! Looking forward to seeing the projects.', date: '19/06/2026 14:30' },
      { id: 2, user: 'Suresh Mehta', role: 'Parent', text: 'Aarav is very excited to showcase his working water filter system.', date: '20/06/2026 09:12' }
    ],
    color: 'purple'
  },
  {
    id: 2,
    title: 'Summer Vacation Break Announcement',
    description: 'This is to inform all staff, students, and parents that the school will remain closed for Summer Vacation starting from July 1st, 2026. Normal operations and academic classes will resume on August 5th, 2026.',
    category: 'Holiday',
    date: '2026-07-01',
    startTime: '08:00',
    endTime: '16:00',
    targetAudience: 'All',
    postedBy: 'Super Admin',
    likes: 34,
    comments: [
      { id: 1, user: 'Rajiv Kumar', role: 'Class Teacher', text: 'Wishing a happy and safe summer vacation to all students!', date: '20/06/2026 11:45' }
    ],
    color: 'green'
  },
  {
    id: 3,
    title: 'Mid-Term Examinations Final Datesheet',
    description: 'The finalized exam schedules and datesheets for Grade 8, 9, and 10 have been published. Examinations will begin on June 29th. Students can pick up study guides and past worksheets from the school library portal.',
    category: 'Exam Notice',
    date: '2026-06-29',
    startTime: '09:00',
    endTime: '12:00',
    targetAudience: 'Students',
    postedBy: 'Exam Coordinator',
    likes: 8,
    comments: [],
    color: 'red'
  },
  {
    id: 4,
    title: 'Inauguration of Advanced Computing Lab',
    description: 'We are proud to announce the opening of our new computing wing equipped with 40 high-performance workstations, graphics tablets, and VR development headsets. Classes will begin computer science laboratory modules here next week.',
    category: 'News',
    date: '2026-06-20',
    startTime: '11:00',
    endTime: '12:30',
    targetAudience: 'All',
    postedBy: 'Super Admin',
    likes: 19,
    comments: [
      { id: 1, user: 'Rakesh Sharma', role: 'Senior Teacher', text: 'This is an excellent upgrade for our coding curricula!', date: '20/06/2026 15:20' }
    ],
    color: 'blue'
  }
]

export const INITIAL_BOOKS = [
  { id: 1, title: 'To Kill a Mockingbird', author: 'Harper Lee', subject: 'English', isbn: '978-0446310789', publisher: 'Grand Central Publishing', quantity: 5, available: 4, status: 'active' },
  { id: 2, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', subject: 'Computer Science', isbn: '978-0262033848', publisher: 'MIT Press', quantity: 3, available: 3, status: 'active' },
  { id: 3, title: 'A Brief History of Time', author: 'Stephen Hawking', subject: 'Science', isbn: '978-0553380163', publisher: 'Bantam Books', quantity: 4, available: 3, status: 'active' },
  { id: 4, title: 'Concepts of Physics (Vol 1)', author: 'H.C. Verma', subject: 'Science', isbn: '978-8177091878', publisher: 'Bharti Bhawan', quantity: 10, available: 8, status: 'active' },
  { id: 5, title: 'RD Sharma Class 10 Mathematics', author: 'R.D. Sharma', subject: 'Mathematics', isbn: '978-9353193249', publisher: 'Dhanpat Rai Publications', quantity: 8, available: 8, status: 'active' },
  { id: 6, title: 'The Discovery of India', author: 'Jawaharlal Nehru', subject: 'Social Studies', isbn: '978-0143031031', publisher: 'Penguin Books', quantity: 2, available: 1, status: 'active' }
]

export const INITIAL_BORROWINGS = [
  { id: 1, bookId: 1, recipientType: 'Student', recipientId: '1', recipientName: 'Aarav Mehta', issueDate: '2026-06-10', dueDate: '2026-06-25', returnDate: '2026-06-24', status: 'returned', fineAmt: 0, finePaid: false },
  { id: 2, bookId: 3, recipientType: 'Student', recipientId: '2', recipientName: 'Diya Sharma', issueDate: '2026-07-05', dueDate: '2026-07-20', returnDate: '', status: 'issued', fineAmt: 0, finePaid: false },
  { id: 3, bookId: 4, recipientType: 'Staff', recipientId: '1', recipientName: 'Rakesh Sharma', issueDate: '2026-07-01', dueDate: '2026-07-15', returnDate: '', status: 'overdue', fineAmt: 40, finePaid: false },
  { id: 4, bookId: 6, recipientType: 'Student', recipientId: '3', recipientName: 'Kabir Tharu', issueDate: '2026-06-01', dueDate: '2026-06-15', returnDate: '', status: 'overdue', fineAmt: 340, finePaid: false }
]

export const INITIAL_VEHICLES = [
  { id: 1, vehicleNo: 'BUS-01', plateNo: 'DL 1PA 1234', capacity: 40, driverName: 'Satish Yadav', driverPhone: '9812345670', status: 'active' },
  { id: 2, vehicleNo: 'BUS-02', plateNo: 'DL 1PA 5678', capacity: 32, driverName: 'Manish Singh', driverPhone: '9812345671', status: 'active' },
  { id: 3, vehicleNo: 'VAN-01', plateNo: 'DL 1PC 9012', capacity: 12, driverName: 'Ramesh Sharma', driverPhone: '9812345672', status: 'maintenance' }
]

export const INITIAL_ROUTES = [
  { id: 1, routeName: 'Route A - Sector 12 & 15', origin: 'School Campus', destination: 'Sector 15 Crossing', stops: ['Campus Stop', 'Sector 12 Market', 'Metro Pillar 140', 'Sector 15 Crossing'], monthlyFee: 80 },
  { id: 2, routeName: 'Route B - Rohini Sector 3', origin: 'School Campus', destination: 'Rohini Metro Station', stops: ['Campus Stop', 'Outer Ring Road Stop', 'Avantika Crossing', 'Rohini Metro Station'], monthlyFee: 100 },
  { id: 3, routeName: 'Route C - Dwarka Subcity', origin: 'School Campus', destination: 'Dwarka Sector 10', stops: ['Campus Stop', 'Palam Crossing', 'Dwarka Sector 6', 'Dwarka Sector 10'], monthlyFee: 120 }
]

export const INITIAL_TRANSPORT_ASSIGNMENTS = [
  { id: 1, studentId: '1', studentName: 'Aarav Mehta', routeId: 1, stopName: 'Sector 12 Market' },
  { id: 2, studentId: '2', studentName: 'Diya Sharma', routeId: 2, stopName: 'Avantika Crossing' },
  { id: 3, studentId: '3', studentName: 'Kabir Tharu', routeId: 1, stopName: 'Metro Pillar 140' }
]



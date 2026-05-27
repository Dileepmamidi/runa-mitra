export const lender = {
  name: "రాములు గారు",
  village: "పెద్దపల్లి",
  phone: "+91 98765 43210",
  businessType: "Shopkeeper",
  mode: "Regular"
};

export const borrowers = [
  {
    id: "b1",
    name: "మల్లేశ్",
    fatherName: "లక్ష్మయ్య",
    phone: "9876543210",
    whatsapp: "9876543210",
    address: "గంగారం వీధి, పెద్దపల్లి",
    village: "పెద్దపల్లి",
    occupation: "Farmer",
    photo: "మ",
    pendingAmount: 64000,
    dueDate: "2026-05-28",
    status: "Upcoming",
    trustScore: 78,
    riskLevel: "Low",
    totalLoans: 3,
    clearedLoans: 2,
    nomineePhone: "9012345678",
    guarantorPhone: "9090909090",
    familyContactPhone: "9000090000",
    nominee: "సీతమ్మ",
    guarantor: "రాజయ్య",
    aadhaarLast4: "4321",
    aadhaarStatus: "Verified",
    notes: "పంట తర్వాత చెల్లిస్తానని చెప్పారు."
  },
  {
    id: "b2",
    name: "సరోజ",
    fatherName: "నర్సయ్య",
    phone: "9123456780",
    whatsapp: "9123456780",
    address: "మార్కెట్ రోడ్, జంగాం",
    village: "జంగాం",
    occupation: "Shopkeeper",
    photo: "స",
    pendingAmount: 28000,
    dueDate: "2026-05-26",
    status: "Due Today",
    trustScore: 69,
    riskLevel: "Medium",
    totalLoans: 2,
    clearedLoans: 1,
    nomineePhone: "9123409876",
    guarantorPhone: "",
    familyContactPhone: "9123498765",
    nominee: "అనిల్",
    guarantor: "",
    aadhaarLast4: "9088",
    aadhaarStatus: "Pending",
    notes: "ప్రతి నెల 5వ తేదీ చెల్లించే అలవాటు."
  },
  {
    id: "b3",
    name: "శ్రీను",
    fatherName: "పోచయ్య",
    phone: "9988776655",
    whatsapp: "9988776655",
    address: "బస్ స్టాండ్ దగ్గర, నల్గొండ",
    village: "నల్గొండ",
    occupation: "Daily wage",
    photo: "శ్రీ",
    pendingAmount: 18500,
    dueDate: "2026-05-20",
    status: "Overdue",
    trustScore: 42,
    riskLevel: "High",
    totalLoans: 1,
    clearedLoans: 0,
    nomineePhone: "9988700112",
    guarantorPhone: "9988700334",
    familyContactPhone: "9988700556",
    nominee: "లక్ష్మి",
    guarantor: "మధు",
    aadhaarLast4: "",
    aadhaarStatus: "Not verified",
    notes: "వారం రోజులు సమయం అడిగారు."
  }
];

export const loans = [
  {
    id: "l1",
    borrowerId: "b1",
    borrowerName: "మల్లేశ్",
    principal: 50000,
    interestRate: 24,
    interestType: "Simple",
    cycle: "monthly",
    repaymentType: "Seasonal",
    securityType: "Trust only",
    date: "2026-01-15",
    dueDate: "2026-05-28",
    paid: 12000,
    balance: 64000,
    status: "Active"
  },
  {
    id: "l2",
    borrowerId: "b2",
    borrowerName: "సరోజ",
    principal: 25000,
    interestRate: 18,
    interestType: "Simple",
    cycle: "monthly",
    repaymentType: "Monthly",
    securityType: "Trust only",
    date: "2026-03-01",
    dueDate: "2026-05-26",
    paid: 5000,
    balance: 28000,
    status: "Due Today"
  },
  {
    id: "l3",
    borrowerId: "b3",
    borrowerName: "శ్రీను",
    principal: 18000,
    interestRate: 30,
    interestType: "Compound",
    cycle: "monthly",
    repaymentType: "Flexible",
    securityType: "Guarantor",
    date: "2026-02-10",
    dueDate: "2026-05-20",
    paid: 3000,
    balance: 18500,
    status: "Overdue"
  }
];

export const payments = [
  { id: "p1", borrowerName: "మల్లేశ్", amount: 7000, date: "2026-05-15", method: "Cash", type: "Interest-only" },
  { id: "p2", borrowerName: "సరోజ", amount: 5000, date: "2026-05-05", method: "UPI", type: "Partial" },
  { id: "p3", borrowerName: "మల్లేశ్", amount: 5000, date: "2026-04-12", method: "Cash", type: "Partial" }
];

export const reminders = [
  { id: "r1", borrowerName: "సరోజ", dueDate: "2026-05-26", amount: 28000, status: "Due Today" },
  { id: "r2", borrowerName: "మల్లేశ్", dueDate: "2026-05-28", amount: 64000, status: "Upcoming" },
  { id: "r3", borrowerName: "శ్రీను", dueDate: "2026-05-20", amount: 18500, status: "Overdue" }
];

export const monthlyCollections = [
  { label: "Jan", value: 32000 },
  { label: "Feb", value: 22000 },
  { label: "Mar", value: 46000 },
  { label: "Apr", value: 38000 },
  { label: "May", value: 56000 }
];

export const occupationInsights = [
  { label: "Farmers", value: 72, note: "Seasonal payments after crop sales" },
  { label: "Employees", value: 88, note: "Monthly salary pattern" },
  { label: "Daily wage", value: 46, note: "Irregular smaller payments" },
  { label: "Shopkeepers", value: 76, note: "Market-day collections" }
];

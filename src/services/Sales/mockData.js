// Mock Clients
export const clients = [
  {
    id: "1",
    name: "Acme Corporation",
    email: "contact@acme.com",
    phone: "(555) 123-4567",
    address: "123 Business Ave, Suite 100, Tech City, TC 12345",
    status: "active",
    createdAt: "2024-01-15T08:00:00Z"
  },
  {
    id: "2",
    name: "TechStart Solutions",
    email: "info@techstart.com",
    phone: "(555) 987-6543",
    address: "456 Innovation Dr, Enterprise Park, EP 67890",
    status: "active",
    createdAt: "2024-01-20T09:30:00Z"
  },
  {
    id: "3",
    name: "Global Industries Ltd",
    email: "sales@globalind.com",
    phone: "(555) 456-7890",
    address: "789 Corporate Blvd, Business District, BD 34567",
    status: "active",
    createdAt: "2024-02-01T10:15:00Z"
  },
  {
    id: "4",
    name: "NextGen Innovations",
    email: "hello@nextgen.com",
    phone: "(555) 888-1234",
    address: "321 Future Way, Silicon Hills, SH 54321",
    status: "active",
    createdAt: "2024-02-05T11:00:00Z"
  },
  {
    id: "5",
    name: "EcoTech Systems",
    email: "support@ecotech.com",
    phone: "(555) 333-1212",
    address: "100 Green Ln, Eco Park, EC 00123",
    status: "inactive",
    createdAt: "2024-01-25T08:45:00Z"
  }
]

// Mock Products
export const products = [
  {
    id: "1",
    name: "Enterprise Software License",
    description: "Annual license for enterprise software suite",
    sku: "SFT-001",
    price: 999.99,
    cost: 299.99,
    quantity: 100,
    category: "Software",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z"
  },
  {
    id: "2",
    name: "Cloud Storage Plan",
    description: "1TB cloud storage subscription (annual)",
    sku: "CLD-002",
    price: 299.99,
    cost: 89.99,
    quantity: 500,
    category: "Services",
    status: "active",
    createdAt: "2024-01-12T09:00:00Z"
  },
  {
    id: "3",
    name: "Professional Consultation",
    description: "4-hour professional consultation session",
    sku: "CNS-003",
    price: 599.99,
    cost: 200.0,
    quantity: 50,
    category: "Services",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "4",
    name: "AI Development Package",
    description: "Custom AI solution development per client specs",
    sku: "AI-004",
    price: 4999.99,
    cost: 2500.0,
    quantity: 25,
    category: "Development",
    status: "active",
    createdAt: "2024-01-22T12:00:00Z"
  },
  {
    id: "5",
    name: "IT Security Audit",
    description: "Full-scale IT infrastructure security analysis",
    sku: "SEC-005",
    price: 999.99,
    cost: 299.99,
    quantity: 30,
    category: "Security",
    status: "active",
    createdAt: "2024-01-28T09:30:00Z"
  }
]

// Mock Quotes
export const quotes = [
  {
    id: "1",
    quoteNumber: "Q-2024001",
    clientId: "1",
    clientName: "Acme Corporation",
    items: [
      {
        id: "1",
        productId: "1",
        productName: "Enterprise Software License",
        quantity: 2,
        unitPrice: 999.99,
        discount: 10,
        tax: 8,
        total: 1871.98
      },
      {
        id: "2",
        productId: "2",
        productName: "Cloud Storage Plan",
        quantity: 1,
        unitPrice: 299.99,
        discount: 0,
        tax: 8,
        total: 323.99
      }
    ],
    subtotal: 2299.97,
    discount: 10,
    tax: 8,
    total: 2195.97,
    notes: "Annual software license and cloud storage bundle",
    terms: "Net 30, Valid for 30 days",
    status: "sent",
    createdAt: "2024-02-15T14:30:00Z",
    validUntil: "2024-03-15T14:30:00Z"
  },
  {
    id: "2",
    quoteNumber: "Q-2024002",
    clientId: "2",
    clientName: "TechStart Solutions",
    items: [
      {
        id: "3",
        productId: "3",
        productName: "Professional Consultation",
        quantity: 3,
        unitPrice: 599.99,
        discount: 15,
        tax: 8,
        total: 1631.97
      }
    ],
    subtotal: 1799.97,
    discount: 15,
    tax: 8,
    total: 1631.97,
    notes: "Quarterly consultation package",
    terms: "Net 15, Valid for 15 days",
    status: "accepted",
    createdAt: "2024-02-18T09:45:00Z",
    validUntil: "2024-03-04T09:45:00Z"
  },
  {
    id: "3",
    quoteNumber: "Q-2024003",
    clientId: "4",
    clientName: "NextGen Innovations",
    items: [
      {
        id: "4",
        productId: "4",
        productName: "AI Development Package",
        quantity: 1,
        unitPrice: 4999.99,
        discount: 5,
        tax: 10,
        total: 5249.99
      }
    ],
    subtotal: 4999.99,
    discount: 5,
    tax: 10,
    total: 5249.99,
    notes: "Initial AI system consultation and proposal",
    terms: "Net 45, Valid for 30 days",
    status: "sent",
    createdAt: "2024-02-22T10:00:00Z",
    validUntil: "2024-03-23T10:00:00Z"
  }
]

// Mock Orders
export const orders = [
  {
    id: "1",
    orderNumber: "ORD-2024001",
    quoteId: "2",
    clientId: "2",
    clientName: "TechStart Solutions",
    items: [
      {
        id: "1",
        productId: "3",
        productName: "Professional Consultation",
        quantity: 3,
        unitPrice: 599.99,
        discount: 15,
        tax: 8,
        total: 1631.97
      }
    ],
    subtotal: 1799.97,
    discount: 15,
    tax: 8,
    total: 1631.97,
    notes: "Converted from Quote Q-2024002",
    status: "completed",
    createdAt: "2024-02-19T10:00:00Z",
    completedAt: "2024-02-20T15:30:00Z"
  },
  {
    id: "2",
    orderNumber: "ORD-2024002",
    quoteId: "3",
    clientId: "4",
    clientName: "NextGen Innovations",
    items: [
      {
        id: "2",
        productId: "4",
        productName: "AI Development Package",
        quantity: 1,
        unitPrice: 4999.99,
        discount: 5,
        tax: 10,
        total: 5249.99
      }
    ],
    subtotal: 4999.99,
    discount: 5,
    tax: 10,
    total: 5249.99,
    notes: "Accepted quote Q-2024003",
    status: "in-process",
    createdAt: "2024-02-24T11:00:00Z",
    completedAt: "2025-02-20T15:30:00Z"
  }
]

// Mock Invoices
export const invoices = [
  {
    id: "1",
    invoiceNumber: "INV-2024001",
    orderId: "1",
    orderNumber: "ORD-2024001",
    clientId: "2",
    clientName: "TechStart Solutions",
    items: [
      {
        id: "1",
        productId: "3",
        productName: "Professional Consultation",
        quantity: 3,
        unitPrice: 599.99,
        discount: 15,
        tax: 8,
        total: 1631.97
      }
    ],
    subtotal: 1799.97,
    discount: 15,
    tax: 8,
    total: 1631.97,
    amountPaid: 800.0,
    amountDue: 831.97,
    notes: "First payment received",
    status: "partial",
    createdAt: "2024-02-20T16:00:00Z",
    dueDate: "2024-03-21T16:00:00Z",
    payments: [
      {
        id: "1",
        amount: 800.0,
        method: "credit-card",
        date: "2024-02-25T10:30:00Z",
        notes: "Initial payment"
      }
    ]
  },
  {
    id: "2",
    invoiceNumber: "INV-2024002",
    orderId: "2",
    orderNumber: "ORD-2024002",
    clientId: "4",
    clientName: "NextGen Innovations",
    items: [
      {
        id: "2",
        productId: "4",
        productName: "AI Development Package",
        quantity: 1,
        unitPrice: 4999.99,
        discount: 5,
        tax: 10,
        total: 5249.99
      }
    ],
    subtotal: 4999.99,
    discount: 5,
    tax: 10,
    total: 5249.99,
    amountPaid: 0,
    amountDue: 5249.99,
    notes: "Pending payment",
    status: "unpaid",
    createdAt: "2024-02-25T14:00:00Z",
    dueDate: "2024-03-25T14:00:00Z",
    payments: [
      {
        id: "1",
        amount: 800.0,
        method: "credit-card",
        date: "2024-02-25T10:30:00Z",
        notes: "Initial payment"
      }
    ]
  }
]

// Mock Report Data
export const salesSummaryData = [
  {
    period: "2024-01",
    totalSales: 15000,
    totalOrders: 8,
    totalInvoices: 8,
    conversionRate: 75
  },
  {
    period: "2024-02",
    totalSales: 22000,
    totalOrders: 12,
    totalInvoices: 11,
    conversionRate: 80
  }
]

export const employeePerformanceData = [
  {
    employeeId: "1",
    employeeName: "John Smith",
    quotesCreated: 15,
    quotesAccepted: 12,
    ordersCompleted: 10,
    totalRevenue: 25000
  },
  {
    employeeId: "2",
    employeeName: "Sarah Johnson",
    quotesCreated: 18,
    quotesAccepted: 15,
    ordersCompleted: 14,
    totalRevenue: 32000
  }
]

export const clientSpendingData = [
  {
    clientId: "1",
    clientName: "Acme Corporation",
    totalSpent: 15000,
    orderCount: 5,
    averageOrderValue: 3000
  },
  {
    clientId: "2",
    clientName: "TechStart Solutions",
    totalSpent: 22000,
    orderCount: 7,
    averageOrderValue: 3142.86
  }
]

export const productSalesData = [
  {
    productId: "1",
    productName: "Enterprise Software License",
    unitsSold: 12,
    revenue: 11999.88,
    profit: 8399.92
  },
  {
    productId: "2",
    productName: "Cloud Storage Plan",
    unitsSold: 25,
    revenue: 7499.75,
    profit: 5249.83
  }
]

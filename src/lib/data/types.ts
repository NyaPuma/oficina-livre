/** DTOs serializáveis usados entre a camada de dados e os componentes React. */

export type CustomerDTO = {
  id: number;
  name: string;
  nif: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  notes: string | null;
  hasConsent: boolean;
  vehicles: Array<{
    id: number;
    plate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    mileage: number;
  }>;
  workOrders?: Array<{ id: number; number: string; status: string; createdAt: string }>;
  quotes?: Array<{ id: number; number: string; status: string; createdAt: string }>;
};

export type WorkOrderDTO = {
  id: number;
  number: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  odometer: number | null;
  complaint: string | null;
  diagnosis: string | null;
  customer: { id: number; name: string };
  vehicle: { id: number; plate: string; brand: string | null; model: string | null };
  assignee: { id: number; name: string } | null;
  site: { id: number; name: string } | null;
  lines: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPriceCents: number;
    vatRateBps: number;
    discountCents: number;
    stockDeducted: boolean;
  }>;
  photos: Array<{ id: number; filename: string; caption: string | null; phase: string }>;
};

export type QuoteDTO = {
  id: number;
  number: string;
  status: string;
  createdAt: string;
  validUntil: string | null;
  notes: string | null;
  approvedAt: string | null;
  approvalToken: string | null;
  signatureName: string | null;
  signedAt: string | null;
  customer: { id: number; name: string; email: string | null; nif: string | null; phone: string | null };
  vehicle: { id: number; plate: string; brand: string | null; model: string | null; year: number | null };
  lines: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPriceCents: number;
    vatRateBps: number;
    discountCents: number;
  }>;
};

export type DashboardDTO = {
  userName: string;
  userRole: string;
  setupPending: boolean;
  openOrders: number;
  pendingQuotes: number;
  lowStock: Array<{ id: number; code: string; description: string; stockQty: number; minStock: number }>;
  customers: number;
  appointments: number;
  openInvoices: number;
  recentOrders: WorkOrderDTO[];
};

export type AppointmentDTO = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: string;
  source: string;
  ramp: string | null;
  notes: string | null;
  customer: { id: number; name: string; phone: string | null; email: string | null };
  vehicle: { plate: string } | null;
  technician: { name: string } | null;
  site: { name: string } | null;
  contactPhone: string | null;
  contactEmail: string | null;
  createdAt: string;
};

export type InvoiceDTO = {
  id: number;
  number: string;
  status: string;
  issuedAt: string;
  dueAt: string | null;
  customerName: string;
  customerNif: string | null;
  customerAddress: string | null;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  paidCents: number;
  atcud: string | null;
  documentHash: string | null;
  certifiedNumber: string | null;
  lines: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPriceCents: number;
    vatRateBps: number;
    discountCents: number;
  }>;
  payments: Array<{ id: number; amountCents: number; method: string; reference: string | null; paidAt: string }>;
};

export type OfflineOrder = {
  id: number;
  number: string;
  status: string;
  odometer: number | null;
  diagnosis: string | null;
  complaint: string | null;
  customerName: string;
  plate: string;
  createdAt: string;
  photoCount: number;
};

export type SyncOp =
  | { type: "status"; workOrderId: number; status: string }
  | { type: "diagnosis"; workOrderId: number; diagnosis: string; odometer: number | null }
  | { type: "photo"; workOrderId: number; dataUrl: string; caption: string | null; phase: string };

export type QueuedOp = { id: number; op: SyncOp };

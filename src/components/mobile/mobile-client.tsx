"use client";

import { Cloud, CloudOff, RefreshCw, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Card } from "@/components/ui";
import { useOfflineOrders } from "@/components/mobile/use-offline";
import { STATUS_LABELS } from "@/lib/format";
import type { OfflineOrder } from "@/lib/offline/types";

function OfflineBanner({
  online,
  pending,
  syncing,
  message,
  refresh,
  flush,
}: {
  online: boolean;
  pending: number;
  syncing: boolean;
  message: string | null;
  refresh: () => Promise<void>;
  flush: () => Promise<void>;
}) {
  return (
    <div className={`mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs ${online ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
      <div className="flex items-center gap-2">
        {online ? <Cloud size={15} /> : <CloudOff size={15} />}
        <span className="font-medium">{online ? "Online" : "Offline"}</span>
        <span className="opacity-70">· {pending} por sincronizar</span>
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => void flush()} disabled={syncing || pending === 0} className="rounded-lg border border-current/20 px-2 py-1 font-medium disabled:opacity-40">
          {syncing ? "A sincronizar…" : "Sincronizar"}
        </button>
        <button type="button" onClick={() => void refresh()} className="rounded-lg border border-current/20 p-1.5" title="Atualizar">
          <RefreshCw size={13} />
        </button>
      </div>
      {message ? <p className="w-full text-[0.68rem] opacity-80">{message}</p> : null}
    </div>
  );
}

export function MobileHomeClient({ initialOrders }: { initialOrders: OfflineOrder[] }) {
  const offline = useOfflineOrders(initialOrders);
  const open = offline.orders.filter((o) => !["entregue", "cancelada"].includes(o.status));

  return (
    <>
      <OfflineBanner {...offline} />
      <p className="eyebrow">Hoje na oficina</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">As minhas reparações</h1>
      <p className="mt-1 text-sm text-slate-500">{open.length} ordens abertas · dados disponíveis offline</p>

      <div className="mt-5">
        {open.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">Sem ordens atribuídas.</Card>
        ) : (
          <div className="space-y-3">
            {open.map((order) => (
              <Link key={order.id} href={`/movel/ordens/${order.id}`} className="panel panel-hover flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{order.number}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">{order.plate}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{order.customerName}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge dot tone="blue">{STATUS_LABELS[order.status] ?? order.status}</Badge>
                  <Wrench size={14} className="text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function MobileOrdersClient({ initialOrders }: { initialOrders: OfflineOrder[] }) {
  const offline = useOfflineOrders(initialOrders);
  return (
    <>
      <OfflineBanner {...offline} />
      <h1 className="text-xl font-semibold tracking-tight text-ink">Ordens de serviço</h1>
      <p className="mt-1 text-sm text-slate-500">Disponíveis mesmo sem ligação</p>
      <div className="mt-5 space-y-3">
        {offline.orders.map((order) => (
          <Link key={order.id} href={`/movel/ordens/${order.id}`} className="panel panel-hover flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{order.number}</p>
              <p className="mt-0.5 text-xs text-slate-500">{order.customerName} · {order.plate}</p>
            </div>
            <Badge dot tone={order.status === "entregue" ? "green" : "blue"}>{STATUS_LABELS[order.status] ?? order.status}</Badge>
          </Link>
        ))}
      </div>
    </>
  );
}

export function MobileOrderClient({ order }: { order: OfflineOrder }) {
  const offline = useOfflineOrders([order]);
  const [status, setStatus] = useState(order.status);
  const [diagnosis, setDiagnosis] = useState(order.diagnosis ?? "");
  const [odometer, setOdometer] = useState(order.odometer?.toString() ?? "");
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  async function saveStatus() {
    await offline.queue(
      { type: "status", workOrderId: order.id, status },
      { status },
    );
  }

  async function saveDiagnosis() {
    await offline.queue(
      { type: "diagnosis", workOrderId: order.id, diagnosis, odometer: odometer ? Number(odometer) : null },
      { diagnosis, odometer: odometer ? Number(odometer) : null },
    );
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      await offline.queue({
        type: "photo",
        workOrderId: order.id,
        dataUrl,
        caption: file.name,
        phase: "diagnostico",
      });
      setPhotoMessage("Foto guardada para sincronização.");
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <OfflineBanner {...offline} />
      <Link href="/movel/ordens" className="text-sm text-slate-500">← Ordens</Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{order.number}</h1>
        <Badge dot tone="blue">{STATUS_LABELS[status] ?? status}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-600">{order.plate} · {order.customerName}</p>

      <Card className="mt-5 p-4">
        <h2 className="font-semibold text-ink">Estado da reparação</h2>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input mt-3">
          {["recebida", "diagnostico", "aguarda_peca", "em_reparacao", "pronta", "entregue"].map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button type="button" onClick={() => void saveStatus()} className="btn-primary w-full mt-3">Guardar estado</button>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="font-semibold text-ink">Diagnóstico</h2>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="eyebrow mb-2 block normal-case tracking-normal">Quilómetros</span>
            <input value={odometer} onChange={(e) => setOdometer(e.target.value)} type="number" min={0} className="field-input" />
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block normal-case tracking-normal">Observações</span>
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={4} className="field-input" />
          </label>
          <button type="button" onClick={() => void saveDiagnosis()} className="btn-secondary w-full">Guardar diagnóstico</button>
        </div>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="font-semibold text-ink">Adicionar foto</h2>
        <input type="file" accept="image/*" className="mt-3 block text-sm" onChange={(e) => void handlePhoto(e.target.files?.[0])} />
        {photoMessage ? <p className="mt-2 text-xs text-emerald-600">{photoMessage}</p> : null}
        <p className="mt-2 text-xs text-slate-400">A foto fica guardada no dispositivo até ser sincronizada.</p>
      </Card>

      <Link href={`/ordens/${order.id}`} className="mt-4 block rounded-lg border border-line bg-white px-4 py-3 text-center text-sm font-medium text-slate-700">Abrir vista completa →</Link>
    </>
  );
}

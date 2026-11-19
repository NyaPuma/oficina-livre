"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cacheOrders,
  clearQueuedOp,
  enqueueOp,
  readCachedOrders,
  readQueue,
  updateCachedOrder,
} from "@/lib/offline/db";
import type { OfflineOrder, SyncOp } from "@/lib/offline/types";

export function useOfflineOrders(initial: OfflineOrder[]) {
  const [orders, setOrders] = useState<OfflineOrder[]>(initial);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    setOnline(isOnline);

    if (!isOnline) {
      const cached = await readCachedOrders().catch(() => []);
      if (cached.length) setOrders(cached);
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch("/api/mobile/work-orders");
      if (response.ok) {
        const data = (await response.json()) as { orders: OfflineOrder[] };
        await cacheOrders(data.orders);
        setOrders(data.orders);
      }
    } catch {
      setMessage("Sem ligação — a mostrar dados guardados no dispositivo.");
    } finally {
      setSyncing(false);
    }
  }, []);

  const flush = useCallback(async () => {
    const queued = await readQueue().catch(() => []);
    setPending(queued.length);
    if (queued.length === 0 || !(typeof navigator !== "undefined" && navigator.onLine)) return;

    setSyncing(true);
    try {
      const response = await fetch("/api/mobile/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queued.map((item) => item.op)),
      });
      const data = (await response.json()) as { results?: Array<{ ok: boolean }> };
      const results = data.results ?? [];
      for (let i = 0; i < queued.length; i += 1) {
        if (results[i]?.ok !== false) await clearQueuedOp(queued[i].id);
      }
      const remaining = await readQueue();
      setPending(remaining.length);
      if (remaining.length === 0) setMessage("Tudo sincronizado.");
    } catch {
      setMessage("Não foi possível sincronizar. Tentaremos novamente.");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await refresh();
      await flush();
    };
    void initialize();
    const onOnline = () => {
      void initialize();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh, flush]);

  const queue = useCallback(
    async (op: SyncOp, optimistic?: Partial<OfflineOrder>) => {
      await enqueueOp(op);
      if (optimistic) {
        const updated = orders.map((order) =>
          order.id === op.workOrderId ? { ...order, ...optimistic } : order,
        );
        setOrders(updated);
        await updateCachedOrder({ ...orders.find((o) => o.id === op.workOrderId)!, ...optimistic }).catch(() => {});
      }
      setPending((current) => current + 1);
      if (typeof navigator !== "undefined" && navigator.onLine) await flush();
      else setMessage("Guardado no dispositivo. Sincroniza quando houver ligação.");
    },
    [orders, flush],
  );

  return { orders, online, pending, syncing, message, queue, refresh, flush };
}

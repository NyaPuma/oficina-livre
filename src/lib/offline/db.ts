import { openDB } from "idb";
import type { OfflineOrder, QueuedOp, SyncOp } from "./types";

const DB_NAME = "oficina-livre-offline";
const DB_VERSION = 2;

function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("orders")) {
        database.createObjectStore("orders", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("queue")) {
        database.createObjectStore("queue", { autoIncrement: true });
      }
    },
  });
}

export async function cacheOrders(orders: OfflineOrder[]): Promise<void> {
  const database = await db();
  const tx = database.transaction("orders", "readwrite");
  await tx.store.clear();
  for (const order of orders) await tx.store.put(order);
  await tx.done;
}

export async function readCachedOrders(): Promise<OfflineOrder[]> {
  const database = await db();
  const orders = (await database.getAll("orders")) as OfflineOrder[];
  return orders.sort((a, b) => b.id - a.id);
}

export async function enqueueOp(op: SyncOp): Promise<void> {
  const database = await db();
  await database.add("queue", { op });
}

export async function readQueue(): Promise<QueuedOp[]> {
  const database = await db();
  const [values, keys] = await Promise.all([
    database.getAll("queue") as Promise<Array<{ op: SyncOp }>>,
    database.getAllKeys("queue"),
  ]);
  return values.map((value, index) => ({ id: Number(keys[index]), op: value.op }));
}

export async function clearQueuedOp(id: number): Promise<void> {
  const database = await db();
  await database.delete("queue", id);
}

export async function updateCachedOrder(order: OfflineOrder): Promise<void> {
  const database = await db();
  await database.put("orders", order);
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";


const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await getCurrentUser())) return new Response("Não autorizado", { status: 401 });

  const { name } = await params;
  if (!/^[0-9a-f-]{36}\.[a-z]+$/i.test(name)) return new Response("Inválido", { status: 400 });
  const extension = name.split(".").at(-1)?.toLowerCase() ?? "";
  const contentType = contentTypes[extension];
  if (!contentType) return new Response("Tipo inválido", { status: 400 });

  try {
    const file = await readFile(path.join(process.cwd(), "data", "uploads", name));
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}

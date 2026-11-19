import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return new Response("Não autorizado", { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Envie um ficheiro CSV." }, { status: 400 });
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) return Response.json({ error: "CSV sem dados." }, { status: 400 });

  if (rows.length > 1001) return Response.json({ error: "Máximo de 1000 clientes por importação." }, { status: 400 });

  const headers = rows[0].map((h) => h.toLowerCase());
  const nameIndex = headers.indexOf("name") >= 0 ? headers.indexOf("name") : headers.indexOf("nome");
  if (nameIndex < 0) return Response.json({ error: "Coluna 'nome' obrigatória." }, { status: 400 });

  const get = (row: string[], key: string) => {
    const index = headers.indexOf(key);
    return index >= 0 ? row[index] || null : null;
  };

  let imported = 0;
  for (const row of rows.slice(1)) {
    const name = row[nameIndex];
    if (!name) continue;
    await db.insert(customers).values({
      name,
      nif: get(row, "nif"),
      phone: get(row, "phone") ?? get(row, "telemovel"),
      email: get(row, "email"),
      city: get(row, "city") ?? get(row, "localidade"),
    });
    imported += 1;
  }

  return Response.json({ imported });
}

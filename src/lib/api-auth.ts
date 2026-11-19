/** Autenticação da API pública via cabeçalho `x-api-key` (ou query `api_key`). */
export function isValidApiKey(request: Request): boolean {
  const expected = process.env.API_KEY;
  if (!expected) return false;
  const provided =
    request.headers.get("x-api-key") ?? new URL(request.url).searchParams.get("api_key") ?? "";
  return provided === expected;
}

export function apiUnauthorized(): Response {
  return new Response(JSON.stringify({ error: "API key inválida ou não configurada." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

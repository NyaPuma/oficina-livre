# Plano de testes end-to-end (Playwright)

## Objetivo

Validar os fluxos críticos da oficina **através da interface real**, incluindo páginas públicas, sessão, permissões, PDFs e API. Complementa os testes unitários (`npm test`).

## Stack

- **Playwright** (`@playwright/test`, Apache-2.0) com Chromium headless
- Servidor de testes: `npm run build && npm run start -- -p 3100` (arrancado automaticamente pelo Playwright; o build de produção evita a compilação lenta do `next dev`)
- Base de dados: a mesma configurada em `DATABASE_URL`; é necessário ter feito `npm run db:push` e `npm run db:seed`
- Utilizador de teste: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (defaults em `tests/helpers.ts`)

## Como executar

```bash
npx playwright install chromium      # primeira vez
npm run db:push && npm run db:seed   # garantir dados base
npm run test:e2e                     # todos os cenários
npm run test:e2e:ui                  # modo interativo
npx playwright test tests/auth.spec.ts   # um ficheiro
```

Para CI, a variável `CI=1` ativa 1 retry e o reporter do GitHub. Existe um workflow em
`.github/workflows/e2e.yml` que arranca PostgreSQL, aplica as migrações e corre a suíte em cada push a `main`.

## Cenários cobertos

| Ficheiro | Fluxo |
|---|---|
| `tests/auth.spec.ts` | Redirecionamento de visitantes, login e logout |
| `tests/customers.spec.ts` | Criar cliente e adicionar viatura com matrícula válida |
| `tests/quotes.spec.ts` | Criar orçamento, gerar link de aprovação, assinar em página pública |
| `tests/work-orders.spec.ts` | Criar OS, assistente inteligente, mudar estado, descarregar PDF |
| `tests/invoicing.spec.ts` | Emitir fatura a partir de OS, registar pagamento, gerar recibo |
| `tests/appointments.spec.ts` | Reserva online pública e marcação criada pelo rececionista |
| `tests/diagnostic.spec.ts` | Criar diagnóstico, partilhar link e confirmar receção pelo cliente |
| `tests/mobile.spec.ts` | Modo mecânico, cache IndexedDB e controlos offline |
| `tests/stock.spec.ts` | Pesquisa de peças / leitura de código |
| `tests/api.spec.ts` | Autenticação da API v1, segredo do cron e exportação JSON |
| `tests/knowledge.spec.ts` | Biblioteca técnica (sintomas/OBD) e consulta de segurança NHTSA |

## Convenções

- Cada teste cria dados com sufixo temporal (`suffix()` em `tests/helpers.ts`) para evitar colisões.
- Os testes **não limpam a base de dados** — usam dados únicos e novos registos.
- Usamos `input[name="..."]` em vez de texto visível sempre que o formulário não tem `<label for>`, para maior estabilidade.
- PDFs são validados por `Content-Type: application/pdf`, não pelo conteúdo binário.
- O modo `workers: 1` evita corridas sobre stocks e sessões partilhadas.

## Limitações conhecidas

- O rate limiting em memória pode acumular tentativas entre correções; reiniciar o servidor de testes se um teste de login falhar por limite.
- Integrações externas (Stripe/SIBS/Moloni/assinatura/IA) são testadas apenas no modo não configurado: a aplicação deve identificar o modo demonstração e não submeter nada.
-Produção com vários workers exige Redis e testes de concorrência específicos.

## Evolução sugerida

1. Container PostgreSQL efémero por execução (limpeza total entre runs).
2. Testes visuais (screenshots) com Playwright Snapshots para o novo design.
3. Teste de concorrência: duas sessões a descontar stock da mesma peça.
4. Job de acessibilidade com `@axe-core/playwright`.

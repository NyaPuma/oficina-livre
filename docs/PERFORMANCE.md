# Carga e desempenho

## Gerar volume de teste

```bash
STRESS_SCALE=1 npm run db:seed:stress   # 2 000 clientes, 6 000 OS, 4 000 faturas…
STRESS_SCALE=3 npm run db:seed:stress   # 3x esse volume
npm run db:clean:stress                 # remove tudo com prefixo STRESS-/ST-
```

Os dados de stress são identificáveis por prefixos, pelo que podem ser removidos sem afetar dados reais.

## Medir

Com a aplicação a correr:

```bash
npm run bench
```

O script autentica-se como administrador e mede 3 respostas por rota (painel, clientes com pesquisa, ordens, relatórios, faturação, stock, agenda e exportação).

## Resultados obtidos (escala 1x, ~45 000 registos)

| Rota | 3 medições (ms) |
|---|---|
| `/` | 209 / 256 / 210 |
| `/clientes?q=STRESS` | 446 / 357 / 78 |
| `/ordens` | 101 / 102 / 79 |
| `/relatorios` | 66 / 63 / 53 |
| `/faturacao` | 102 / 82 / 97 |
| `/stock` | 100 / 134 / 82 |
| `/agenda` | 555 / 212 / 208 |
| `/api/export/dados` | 626 / 463 / 600 |

## Correções aplicadas

1. **Relatórios reescritos com agregação SQL** (`src/lib/data/reports.ts`). Antes carregavam todas as faturas, ordens, linhas, pagamentos e contas para a memória do servidor; agora usam `SUM`, `COUNT`, `GROUP BY` e um `UNION ALL` para o fluxo de caixa.
2. **Índices de desempenho** (`scripts/perf-indexes.sql`, aplicados por `npm run db:indexes` no lançador e no CI):
   - `pg_trgm` + índices GIN em `customers.name`, `customers.nif`, `parts.code` e `parts.description` (pesquisas `ILIKE %...%`);
   - índices em `work_orders.created_at`, `work_orders(status, created_at)`, `quotes.created_at`, `invoices.issued_at`, `work_order_lines.part_id`, `payments.paid_at` e `appointments(status, starts_at)`.
3. **Exportações limitadas** a 10 000 registos por tabela (`/api/export/dados` e `/api/export/saft`) para evitar respostas gigantes.

## Possíveis melhorias futuras

- Paginação real (cursor/offset) nas listas de clientes, ordens e faturas.
- Rate limiting e cache de relatórios por período.
- Mover agregações pesadas para jobs assíncronos se o volume ultrapassar milhões de linhas.

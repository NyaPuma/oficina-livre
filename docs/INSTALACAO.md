# Guia de instalação — Oficina Livre

## Desenvolvimento local (Docker)

1. **Clonar e instalar dependências**

   ```bash
   git clone https://github.com/NyaPuma/oficina-livre.git
   cd oficina-livre
   npm install
   ```

2. **Criar o ficheiro de ambiente**

   ```bash
   cp .env.example .env
   openssl rand -base64 32   # copiar o resultado para SESSION_SECRET no .env
   ```

3. **Arrancar o PostgreSQL**

   ```bash
   docker compose up -d
   docker compose ps        # esperar pelo estado "healthy"
   ```

4. **Criar as tabelas**

   ```bash
   npm run db:push
   ```

   Se o comando pedir confirmação de forma interativa, use o SQL já gerado:

   ```bash
   docker exec -i oficina-livre-db psql -U oficina -d oficina_livre < drizzle/0000_*.sql
   ```

5. **Dados iniciais**

   ```bash
   npm run db:seed
   ```

   Cria: utilizador `admin@oficinalivre.local` / `admin123`, 5 serviços padrão,
   um fornecedor, 3 peças e um cliente com viatura de demonstração.

6. **Configuração adicional da Fase 2**

   - Defina `COMPANY_NIF` no `.env` com o NIF da oficina (usado na exportação XML).
   - Configure `SMTP_*` para envio de lembretes e documentos por email.
   - Partilhe o link público de reservas: `http://localhost:3000/agendar`.
   - Nos orçamentos, use **Preparar aprovação digital** para obter o link público de assinatura.

7. **Fase 3 (opcional)**

   - Defina `API_KEY` para ativar a API pública (`/api/v1/clientes`, `/api/v1/ordens`, `/api/v1/faturas`);
     as credenciais vão no cabeçalho `x-api-key`.
   - `VEHICLE_LOOKUP_URL` e `VEHICLE_LOOKUP_TOKEN` ativam a consulta externa de matrículas;
     sem configuração, a aplicação valida apenas o formato da matrícula portuguesa.
   - Modo mecânico: `/movel` (instalável como PWA através do menu do browser).
   - Diagnóstico digital: abra uma OS → **Diagnóstico digital para o cliente**.
   - Backups/exportação: `/api/export/dados`; importação CSV de clientes: `POST /api/import/clientes`.
   - TecDoc: configure `TECDOC_API_URL`, `TECDOC_API_KEY` e `TECDOC_DATA_SUPPLIER` com as credenciais da sua licença. O gateway deve responder a `POST /parts/search` e `POST /vehicles/identify`. Sem configuração, `/tecdoc` apresenta um catálogo local de demonstração.

9. **Ativar integrações externas (credenciais necessárias)**

   | Integração | Variáveis | Como ativar |
   |---|---|---|
   | Stripe | `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Criar um produto/Checkout Session na conta Stripe e registar `https://<dominio>/api/webhooks/payments/stripe` como endpoint de webhook com o evento `checkout.session.completed`. |
   | SIBS (MB WAY / Multibanco) | `PAYMENT_PROVIDER=sibs`, `SIBS_API_URL`, `SIBS_API_KEY`, `SIBS_WEBHOOK_SECRET` | Contratar o serviço e configurar o callback `https://<dominio>/api/webhooks/payments/sibs`. |
   | Assinatura qualificada | `QSIGN_API_URL`, `QSIGN_API_KEY`, `QSIGN_WEBHOOK_SECRET` | Contratar um prestador de confiança com certificado qualificado; o adaptador envia o PDF e recebe o resultado em `POST /api/webhooks/signature`. |
   | SAF-T certificado | `AT_COMPANY_NIF`, `AT_SOFTWARE_CERTIFICATE_NUMBER`, `AT_PRODUCT_ID`, `AT_PRODUCT_VERSION`, `AT_VENDOR_NIF` | Obter da AT o número de certificado de software para esta aplicação e validar a ordem dos campos dos hashes com o contabilista. Sem isto, o ficheiro não é certificado. |

   Sem estas credenciais, os botões continuam visíveis mas a interface identifica claramente o modo demonstração
   e não são processados pagamentos, assinaturas qualificadas ou submissões à AT.

10. **Lembretes e cópias de segurança**

   - Defina `CRON_SECRET` no `.env` e agende uma chamada diária:
     `curl -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/cron/reminders`
   - Backup: `npm run db:backup` (cria `backups/oficina-*.sql.gz`).
   - Restore: `npm run db:restore backups/oficina-XXXX.sql.gz`.
   - O modo mecânico guarda dados no IndexedDB do navegador; a fila é enviada para `/api/mobile/sync` quando volta a haver rede.

## Segurança

A aplicação envia cabeçalhos `Content-Security-Policy` com nonce por pedido, HSTS, `X-Frame-Options`,
`Referrer-Policy` e `Permissions-Policy`. O `proxy.ts` apenas redireciona; a autorização real é feita em cada
Server Action e rota. Em produção com várias instâncias, substitua o rate limiting em memória por Redis.

8. **Arrancar a aplicação**

   ```bash
   npm run dev
   ```

   Abrir http://localhost:3000.

## Produção (notas)

- Definir `SESSION_SECRET` forte e único.
- Usar `npm run build && npm start` (ou um contentor/serviço com `NODE_ENV=production`).
- Trocar a palavra-passe do utilizador inicial.
- Configurar `SMTP_*` no `.env` para envio de PDFs por email.
- Fazer cópias de segurança regulares da base de dados e de `data/uploads`.
- Terminar atrás de HTTPS (o cookie de sessão é `secure` em produção).
- Validar com o contabilista as taxas de IVA antes de faturação real.

## Resolução de problemas

| Sintoma | Solução |
|---|---|
| `SESSION_SECRET não configurado` | Copiar `.env.example` para `.env` e gerar um valor com `openssl rand -base64 32`. |
| `ECONNREFUSED` ao arrancar | O PostgreSQL ainda não está pronto; esperar pelo healthcheck. |
| PDF com erro 500 | Confirmar que `serverExternalPackages: ["pdfkit"]` está no `next.config.ts`. |
| `db:push` pede confirmação | Usar o ficheiro SQL em `drizzle/` com `psql`, como indicado acima. |

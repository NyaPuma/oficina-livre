# Oficina Livre

> Sistema livre e open-source (licença **MIT**) para gestão de oficinas automóveis, em português e preparado para a realidade portuguesa.

- **Repositório:** https://github.com/NyaPuma/oficina-livre
- **Licença:** [MIT](LICENSE)
- **Estado:** Fases 1, 2 e 3 implementadas e a funcionar

## O que já faz

**Fase 1 — gestão da oficina**
- Autenticação com utilizadores e 3 perfis (administrador, gestor, mecânico)
- Clientes e viaturas, com histórico de intervenções e registo de consentimento RGPD
- Orçamentos com serviços/peças, IVA por linha, estados e PDF
- Ordens de serviço digitais com checklist de receção, fotos, intervenções, desconto automático de stock e PDF
- Stock de peças com stock mínimo, serviços padrão e ajustes manuais
- Utilizadores, auditoria de ações e painel com indicadores
- Envio de documentos por email (SMTP opcional)

**Fase 2 — operação completa**
- Agenda de rampas/técnicos com deteção de sobreposições e reservas públicas em `/agendar`
- Lembretes por WhatsApp (link wa.me, sem custo de API) e por email
- Aprovação digital de orçamentos através de link público com assinatura registada
- Faturas emitidas a partir de OS/orçamentos, recibos e exportação XML tipo SAF-T
- Pagamentos (multibanco, MB WAY, cartão, transferência, dinheiro) e contas a pagar
- Fluxo de caixa e relatórios: faturação, ticket médio, conversão, top serviços/clientes

**Fase 3 — mobilidade, diagnóstico e integrações**
- Modo mecânico otimizado para telemóvel em `/movel`, instalável como PWA (`manifest.webmanifest`)
- Diagnóstico digital com itens, estados (OK/Atenção/Falha), fotos e link público de confirmação pelo cliente
- Consulta de matrículas com validação local e fornecedor externo opcional (`VEHICLE_LOOKUP_URL`)
- Multi-loja: locais/filiais e associação a OS, marcações e faturas
- API pública v1 (`/api/v1/*`) com chave `x-api-key`, exportação JSON completa e importação CSV de clientes
- Integração TecDoc/TecRMI em `/tecdoc`: pesquisa de peças por descrição/código OE e importação para o stock, com fornecedor configurável e catálogo de demonstração quando não há licença
- Adaptadores de pagamento (Stripe/SIBS) e assinatura qualificada (serviço externo) com webhooks assinados HMAC
- SAF-T com campos de certificação da AT configuráveis e hashes SHA-1/Base64 (validar sempre com o contabilista)
- Segurança: CSP com nonce por pedido, cabeçalhos HSTS/frame-ancestors, rate limiting, validação de parâmetros de URL e DAL `server-only`
- Modo mecânico offline-first: cache IndexedDB, fila de operações e sincronização ao voltar a haver rede
- Job de lembretes diários (`/api/cron/reminders`), backups/restore e documentação de contribuição
- Rate limiting com Redis opcional, DAL com DTOs e adaptador de faturação certificada (Moloni) com ATCUD/QR
- Assistente de oficina (sugestões por queixa/histórico, resumo de diagnóstico e revisão estimada) com LLM opcional
- Vistas por papel (mecânico/gestor/admin), leitura de códigos de barras e reposição de stock por consumo
- APIs públicas úteis: validação NIF/VIES, decodificação VIN (NHTSA), moradas (OpenStreetMap), feriados (Nager.Date) e tempo (Open-Meteo) — todas com fallback local
- Biblioteca técnica: artigos de sintomas/causas/diagnóstico/correcção, códigos OBD-II e consulta de recalls/queixas NHTSA por viatura

> ⚠️ A exportação SAF-T é simplificada e **não é certificada pela AT**. Validar com o contabilista.
> ⚠️ O TecDoc é um serviço comercial: sem `TECDOC_API_URL` e credenciais válidas, `/tecdoc` usa um
> catálogo **local de demonstração** (identificado na interface). Não são dados reais do TecDoc.
>
> ⚠️ **Estado das integrações**: os adaptadores estão implementados, mas **não estão ativados** sem
> credenciais. Sem `PAYMENT_PROVIDER`+credenciais, os pagamentos são demonstrativos; sem
> `QSIGN_API_URL`+credenciais, a "assinatura qualificada" é apenas um registo de demonstração;
> sem `AT_SOFTWARE_CERTIFICATE_NUMBER` emitido pela AT, o XML **não é um SAF-T certificado**.
> Consulte [docs/INSTALACAO.md](docs/INSTALACAO.md) para a lista exata do que é necessário.

## Stack (todas as licenças MIT ou compatíveis)

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de dados | PostgreSQL 16 + Drizzle ORM |
| Autenticação | bcryptjs + JOSE (JWT em cookie httpOnly) |
| Validação | Zod |
| PDF | PDFKit |
| Ícones | Lucide React |
| Email | Nodemailer |
| Testes | Vitest |

## Instalação

### 1. Pré-requisitos
- Node.js 20+ e npm
- Docker (ou um PostgreSQL próprio)

### 2. Configurar

```bash
git clone https://github.com/NyaPuma/oficina-livre.git
cd oficina-livre
npm install
cp .env.example .env
```

No `.env`, altere **`SESSION_SECRET`** para um valor aleatório:

```bash
openssl rand -base64 32
```

### 3. Base de dados

```bash
docker compose up -d
npm run db:push        # primeira instalação (ou: psql < drizzle/0000_*.sql)
npm run db:seed        # cria utilizador + dados de exemplo
```

> Nota: `db:push` pode pedir confirmação interativa. Em alternativa, aplique o ficheiro
> SQL gerado em `drizzle/` diretamente com `psql`.

**Utilizador inicial:** `admin@oficinalivre.local` / `admin123` (alterar em produção).

### 4. Arrancar

```bash
npm run dev      # http://localhost:3000
# ou
npm run build && npm start
```

## Comandos úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm test` | Testes unitários |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação TypeScript |
| `npm run db:generate` | Gerar migração SQL após alterar o esquema |
| `npm run db:seed` | Repopular dados de exemplo |

## Documentação

| Documento | Conteúdo |
|---|---|
| [Pesquisa de necessidades](docs/PESQUISA.md) | Tudo o que uma oficina pode precisar, fontes e requisitos legais PT |
| [Roadmap](docs/ROADMAP.md) | Fases de implementação |
| [Modelo de dados](docs/MODELO-DADOS.md) | Entidades e relações |
| [Guia de instalação](docs/INSTALACAO.md) | Passo a passo detalhado |
| [Melhorias pesquisadas](docs/MELHORIAS.md) | Tendências 2026, lacunas e plano priorizado com fontes |
| [Plano de testes E2E](docs/PLANO-TESTES-E2E.md) | Estratégia Playwright e cenários cobertos |
| [APIs externas](docs/APIS-EXTERNAS.md) | Serviços integrados, limites e atribuições, incluindo apoio ao diagnóstico |

## Princípios

1. **Software livre de verdade** — dependências MIT/BSD/Apache-2.0 apenas.
2. **Simples de usar** — o utilizador é um mecânico, não um informático.
3. **Auto-hospedável** — a oficina é dona dos seus dados.
4. **Em português** — €, datas pt-PT, NIF, matrículas.
5. **Seguro por defeito** — palavras-passe hashed, JWT em cookie httpOnly, permissões e auditoria.
6. **Interface com identidade própria** — paleta tinta/âmbar, marca SVG, painéis, tabelas e botões consistentes, modo mecânico e páginas públicas com o mesmo adn visual.

> ⚠️ A informação fiscal/legal na documentação é indicativa. Valide sempre com um contabilista
> antes de aplicar regras de IVA ou faturação em produção.

## Licença

Distribuído sob a licença MIT. Consulte o ficheiro [LICENSE](LICENSE).

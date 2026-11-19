# Oficina Livre

> Sistema livre e open-source (licença **MIT**) para gestão de oficinas automóveis, em português e preparado para a realidade portuguesa.

- **Repositório:** https://github.com/NyaPuma/oficina-livre
- **Licença:** [MIT](LICENSE)
- **Estado:** Fases 1 e 2 implementadas e a funcionar

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

> ⚠️ A exportação SAF-T é simplificada e **não é certificada pela AT**. Validar com o contabilista.

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

## Princípios

1. **Software livre de verdade** — dependências MIT/BSD/Apache-2.0 apenas.
2. **Simples de usar** — o utilizador é um mecânico, não um informático.
3. **Auto-hospedável** — a oficina é dona dos seus dados.
4. **Em português** — €, datas pt-PT, NIF, matrículas.
5. **Seguro por defeito** — palavras-passe hashed, JWT em cookie httpOnly, permissões e auditoria.

> ⚠️ A informação fiscal/legal na documentação é indicativa. Valide sempre com um contabilista
> antes de aplicar regras de IVA ou faturação em produção.

## Licença

Distribuído sob a licença MIT. Consulte o ficheiro [LICENSE](LICENSE).

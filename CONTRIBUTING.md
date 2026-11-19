# Contribuir para o Oficina Livre

Obrigado pelo interesse! Este projeto é MIT e aberto a contribuições.

## Começar

```bash
git clone https://github.com/NyaPuma/oficina-livre.git
cd oficina-livre
npm install
cp .env.example .env
# gerar SESSION_SECRET: openssl rand -base64 32
docker compose up -d
npm run db:push
npm run db:seed
npm run dev
```

Utilizador de demonstração: `admin@oficinalivre.local` / `admin123`.

## Antes de abrir um PR

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Convenções

- **Língua:** português (pt-PT) na interface, documentação e mensagens de erro.
- **Valores monetários:** centimos (`integer`) na base de dados; `src/lib/format.ts` para formatação.
- **Dados do utilizador:** sempre validar com Zod em Server Actions e rotas.
- **Autorização:** `requireUser()` / `requireRole()` dentro de cada ação sensível; `proxy.ts` apenas redireciona.
- **Dependências:** apenas licenças MIT/BSD/Apache-2.0. Não adicionar serviços pagos como dependência obrigatória.
- **UI:** usar os componentes de `src/components/ui.tsx` e as classes `btn-primary`, `btn-secondary`, `field-input`, `panel`.

## Alterações ao esquema

```bash
npm run db:generate      # gera SQL em drizzle/
# aplicar: ver docs/INSTALACAO.md
```

## Segurança

Se encontrar uma vulnerabilidade, **não abra uma issue pública**. Comunique-a em privado ao mantenedor.

## Roadmap e pesquisa

- [Roadmap](docs/ROADMAP.md)
- [Pesquisa de necessidades](docs/PESQUISA.md)
- [Melhorias 2026](docs/MELHORIAS.md)

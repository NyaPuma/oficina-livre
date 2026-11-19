# Início rápido

## 1. Lançar tudo com um comando

```bash
npm install
npm run launch
```

O lançador (`scripts/launch.mjs`) faz automaticamente:

1. Cria o `.env` a partir do `.env.example` (se não existir).
2. Gera `SESSION_SECRET`, `API_KEY` e `CRON_SECRET` aleatórios.
3. Arranca o PostgreSQL com Docker Compose (se disponível).
4. Aplica as migrações e cria os dados iniciais.
5. Compila e arranca a aplicação em `http://localhost:3000`.

Para preparar apenas o ambiente sem arrancar o servidor:

```bash
npm run setup
```

Utilizador inicial: **admin@oficinalivre.local** / **admin123** (altere em produção).

## 2. Configurar APIs e tokens no navegador

Com a sessão de administrador iniciada, abra **`/configurar`** (menu *Sistema → Configuração*) ou clique no aviso da página inicial.

O assistente permite preencher, sem editar ficheiros à mão:

- Identificação da oficina (NIF, coordenadas, URL pública)
- Stripe / SIBS (pagamentos)
- Moloni e certificado AT (faturação certificada)
- Assinatura qualificada
- TecDoc e TecRMI (licenças TecAlliance)
- Assistente LLM (OpenAI-compatible)
- Chave da API pública, segredo do cron e SMTP

Pontos importantes:

- Os valores são guardados em **`.env.local`**, que está no `.gitignore`.
- Os campos já configurados aparecem com ✅; deixe em branco para manter o valor atual.
- O botão 🔑 gera chaves aleatórias para `API_KEY` e `CRON_SECRET`.
- Em desenvolvimento o Next reinicia sozinho ao alterar o `.env.local`; em produção use o botão **Reiniciar** (ou reinicie o container/serviço).

> ⚠️ As integrações continuam a funcionar em modo demonstração até introduzir credenciais válidas. O programa não emite faturas fiscalmente válidas nem assinaturas qualificadas sem licença.

## 3. Verificar que está tudo bem

```bash
npm run typecheck
npm test
npm run test:e2e
```

Consulte também [INSTALACAO.md](INSTALACAO.md) para detalhes de produção e [APIS-EXTERNAS.md](APIS-EXTERNAS.md) para limites/atribuições das APIs.

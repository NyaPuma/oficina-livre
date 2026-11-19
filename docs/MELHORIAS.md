# Melhorias para o Oficina Livre — pesquisa 2026

> Investigação realizada a 19 de novembro de 2026. Fontes no final.
> Critérios: impacto no negócio da oficina, esforço de implementação e risco (legal/segurança).

---

## 1. O que a pesquisa diz que as oficinas modernas precisam

As tendências de 2026 convergentes entre vários guias do setor:

1. **Gestão na nuvem / multi-local** — acesso por dispositivo, permissões por perfil e cópias de segurança.
2. **Fichas de trabalho digitais** — queixa, inspeção, peças, mão-de-obra, estado e histórico em tempo real.
3. **Marcações online** — o cliente reserva sozinho; a oficina planeia técnicos e rampas.
4. **Stock inteligente** — baixas automáticas, stock mínimo, artigos de rotação lenta, reposição.
5. **Orcamentos, faturas e pagamentos digitais** — com aprovação e comunicação claras.
6. **Comunicação proativa** — recordatórios, atualizações de estado, diagnóstico digital.
7. **Decisões baseadas em dados** — KPIs, receita por técnico, conversão de orçamentos.
8. **Mobile-first e offline-first** — o técnico trabalha em áreas com má ligação; a app tem de funcionar sem rede e sincronizar depois.

---

## 2. Análise de lacunas no Oficina Livre (estado atual)

| Área | Já temos | Falta / risco |
|---|---|---|
| Operação | OS digitais, fotos, checklist, stock, agenda, orçamentos, multi-loja básica | Classificação de trabalhos/modelos de serviço por tipo de viatura; leitura de código de barras; tempo real por técnico |
| Fiscalidade (PT) | Faturas, recibos, IVA por linha, exportação SAF-T simplificada | **ATCUD, QR code, cadeia de hashes entre documentos, numeração por série comunicada à AT e comunicação e-Fatura** — obrigatório em Portugal |
| Segurança | Sessão JWT em cookie httpOnly, `requireUser`/`requireRole` nas ações, validação Zod, webhooks HMAC, Next 16.4.6 (patched) | **Rate limiting**, cabeçalhos de segurança/CSP, validação explícita de `params`/`searchParams`, DAL `server-only`, proteção extra dos endpoints públicos (reserva/aprovação/diagnóstico) |
| Mobile | Modo mecânico com PWA | **Offline-first**: hoje exige ligação; sem cache local nem fila de sincronização |
| Comunicação | Email, links WhatsApp, aprovação/assinatura por link | Lembretes automáticos agendados (cron/jobs), statuses push, follow-up de orçamentos pendentes |
| Dados/IA | Relatórios e KPIs | Previsão de manutenção, sugestão de peças por matrícula, resumo automático de diagnóstico |
| Projeto | MIT, docs, migrações, 21 testes | `CONTRIBUTING.md`, templates de issue, Docker de produção, script de backup/restore, demo anónima |

---

## 3. Plano priorizado

### P0 — Fazer primeiro (risco legal e segurança)

1. **Faturação certificada por integração, não por reimplementação**
   - A pesquisa é clara: em Portugal o programa de faturação tem de estar **certificado pela AT** (DL 28/2019), com assinatura em cadeia, numeração por série comunicada à AT, **ATCUD + QR code** e SAF-T (PT) válido.
   - Recomendação prática dos guias: **integrar com um programa certificado existente** (Moloni, PHC, Primavera) por API, em vez de certificar o nosso próprio módulo. O sistema de gestão continua a tratar da operação; o parceiro certificado emite o documento e devolve número/ATCUD/hash, que guardamos na fatura.
   - Ações concretas: adicionar colunas `atcud`, `documentHash`, `certifiedNumber` em `invoices`; adaptador `src/lib/fiscal-provider.ts` (Moloni primeiro); botão "Emitir fatura certificada"; manter o PDF atual como orçamento/OS.
   - Alternativa a curto prazo: deixar de emitir "faturas" não certificadas e passar a emitir **recibos/documentos de serviço** com aviso fiscal claro, até existir integração certificada.

2. **Segurança do Next.js 16**
   - Manter Next atualizado (já estamos em 16.4.6, acima do 16.4.5 recomendado contra as advertiseências de 3/11/2026).
   - `proxy.ts` **nunca** é autorização única — confirmámos que todas as ações e rotas sensíveis voltam a verificar sessão/perfil. Reforçar com DAL `import "server-only"`.
   - Rate limiting em: login, reserva online, aprovação/assinatura pública, exportações e webhooks.
   - Cabeçalhos: `Content-Security-Policy` (com nonce), `Strict-Transport-Security`, `X-Frame-Options` / `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`.
   - Validar `params` e `searchParams` com Zod (hoje validamos sobretudo `formData`).
   - Nunca expor segredos em `NEXT_PUBLIC_*` nem em props de componentes cliente (já cumprido).

### P1 — Alto valor, esforço médio

3. **Modo mecânico offline-first**
   - Cache local (IndexedDB) das OS atribuídas, checklist, histórico e fotos; fila de operações para sincronizar quando voltar a haver rede.
   - Indicador de estado "offline / por sincronizar / sincronizado".
   - Isto é apontado como o aspeto mais difícil e mais importante de sistemas de campo: o técnico não pode depender de sinal no subsolo ou na oficina.

4. **Automatizações e lembretes**
   - Job diário: marcações de amanhã → WhatsApp/email; orçamentos enviados há >3 dias → follow-up; revisões por quilometragem → lembrete.
   - Registo de envios e preferências do cliente (RGPD).

5. **Stock inteligente e códigos de barras**
   - Leitura por câmara (BarcodeDetector API) no modo mecânico; reposição sugerida por consumo médio dos últimos 90 dias; artigos parados.

### P2 — Diferenciação

6. **IA assistiva (com salvaguardas)**
   - Sugerir peças/serviços a partir da queixa e histórico da matrícula; resumir notas de diagnóstico; prever revisão por padrão de quilometragem.
   - Nunca usar IA para decidir preços fiscais ou substituir o diagnóstico do mecânico; deixar sempre confirmação humana.

7. **Experiência por papel**
   - Vista do rececionista (agenda/aprovações) vs. mecânico (OS/fotos) vs. gestor (KPIs/financeiro) — o painel já é comum; especializar por `role`.

8. **Comunidade e operação do projeto**
   - `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, templates de issue/PR, `CHANGELOG.md`.
   - Docker multi-stage para produção, `docker compose.prod.yml`, script `backup`/`restore`, dados de demonstração anonimizados.

---

## 4. Quick wins que posso implementar já (sem credenciais externas)

- Cabeçalhos de segurança no `next.config.ts` + nonce CSP no `proxy.ts`.
- Rate limiting em memória/Redis para login, reserva online e endpoints públicos.
- Validação Zod de `params`/`searchParams` nas rotas dinâmicas.
- DAL `src/lib/data/*.ts` com `import "server-only"` e DTOs.
- Lembretes diários (página `/api/cron/reminders` protegida por token) sem prestador externo: gera links WhatsApp + emails.
- `CONTRIBUTING.md`, `CHANGELOG.md`, templates GitHub e scripts de backup/restore.
- Módulo offline-first do modo mecânico (maior trabalho, mas autocontido).

---

## 5. Fontes consultadas

**Tendências do setor**
- Automotive Workshop System Trends 2026 — https://blog.autodots.io/automotive-workshop-system-trends-2026/
- Upcoming Garage Technology Trends 2026 — https://blog.autodots.io/upcoming-garage-technology-trends-2026/
- Best Garage Management Software 2026 (guia de funcionalidades) — https://www.carsu.com/en/blog/best-garage-management-software-complete-guide
- Workshop Management Software guide 2026 — https://www.autoshopdigital.com/blog/software-for-garages/
- Guia de software para garagens 2026 — https://www.winmotorcloud.com/en/garage-management-software-guide-2026/

**Mobile / campo**
- Mobile Field Service Management Software (offline-first) — https://scand.com/company/blog/mobile-field-service-management-software/
- Top 10 Mobile Mechanic Software 2026 — https://worldmetrics.org/best/mobile-mechanic-software/
- Field Service Mobile Apps 2026 — https://fieldcamp.ai/blog/best-field-service-mobile-apps/

**Segurança Next.js**
- Next.js Security Checklist 2026 — https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2026-authentication-api-protection-and-best-practices
- Next.js Security Best Practices 2026 — https://www.authgear.com/post/nextjs-security-best-practices/
- Guia oficial de segurança de dados — https://nextjs.org/docs/app/guides/data-security
- Next.js 16 Best Practices — https://www.codingeagles.dev/blog/nextjs-16-best-practices-2026

**Fiscalidade Portugal**
- Faturação Eletrónica em Portugal: requisitos 2026 (ATCUD, SAF-T, integração com certificado) — https://solucoesamedida.pt/faturacao-eletronica-portugal-software/
- Obrigações SAF-T 2026 — https://iuriswatch.eu/blog/pt/fatura-eletronica-saft-obrigacoes-2026
- Portal das Finanças — SAF-T (PT) — https://info.portaldasfinancas.gov.pt/pt/apoio_ao_contribuinte/Negocios/Faturacao/SAF_T_PT/Paginas/default.aspx
- Guia SAF-T PT 2026 — https://livegest.pt/guias/saft-pt
- SAF-T e ATCUD em Portugal 2026 — https://arhivix.com/pt/blog/portugal-saft-atcud-guia-conformidade-2026

---

## 6. Nota importante

As recomendações fiscais são indicativas e mudam por portaria. Antes de qualquer alteração que afete faturas, validar sempre com um contabilista certificado e com o Portal das Finanças.

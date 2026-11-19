# Roadmap — Oficina Livre

> Planeamento inicial. A ordem das fases será revista com base no feedback do utilizador.

## Fase 0 — Fundação ✅
- [x] Nome e identidade do projeto
- [x] Repositório público no GitHub
- [x] Licença MIT
- [x] Pesquisa de necessidades (PESQUISA.md)
- [x] Modelo de dados inicial
- [x] Escolha final da stack (Next.js + PostgreSQL)
- [x] Estrutura do projeto e migrações

## Fase 1 — MVP ✅ (essencial para abrir a oficina)
| Funcionalidade | Prioridade |
|---|---|
| Autenticação e utilizadores (administrador, rececionista, mecânico) | Alta |
| Clientes e veículos (matrícula, VIN, quilometragem) | Alta |
| Orçamentos (mão-de-obra + peças, IVA configurável) | Alta |
| Ordem de Serviço digital com fotos e checklist de entrada | Alta |
| Stock de peças com baixa automática e stock mínimo | Alta |
| PDF de OS/orçamento + envio por email | Alta |
| Histórico por viatura | Alta |
| Logs de auditoria (quem alterou o quê) | Média |

## Fase 2 — Operação completa ✅
- [x] Agenda de rampas/técnicos com deteção de sobreposições e reservas online (`/agendar`)
- [x] Lembretes por WhatsApp (link wa.me) e email
- [x] Faturação a partir de OS/orçamento + recibos + exportação XML tipo SAF-T
- [x] Pagamentos, contas a pagar, fluxo de caixa
- [x] Relatórios e KPIs
- [x] Aprovação digital de orçamentos via link público

> ⚠️ A exportação SAF-T é simplificada e **não é certificada pela AT**. Requer validação contabilística
> antes de qualquer entrega à Autoridade Tributária.

## Fase 3 — Crescimento
- App/interface mobile para o mecânico
- Diagnóstico digital (fotos/vídeos partilhados com cliente)
- Integrações opcionais: matrículas/VIN, TecDoc, pagamentos, assinatura
- Multi-loja / multi-rampa
- API pública e importação/exportação de dados

## Fase 4 — Conformidade e escala
- RGPD: exportação e apagamento de dados, registo de consentimento
- Livro de reclamações
- Registo de resíduos (óleos, pneus, baterias)
- Internacionalização (mais idiomas, moedas e regras fiscais)

## Princípios de entrega
- Cada fase termina com código a correr, documentado e com testes.
- Nenhuma dependência que impeça a licença MIT.
- Nenhum dado da oficina trancado em serviço externo obrigatório.

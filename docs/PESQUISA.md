# Pesquisa: o que uma oficina automóvel pode precisar

> Investigação realizada a 19 de novembro de 2026 para definir o âmbito do **Oficina Livre**.
> Fontes consultadas no final do documento. A informação legal é indicativa e deve ser
> validada com um contabilista / consultor jurídico antes de ser implementada na aplicação.

---

## 1. Resumo executivo

Uma oficina automóvel moderna precisa de um único sistema que cubra **todo o ciclo de vida do serviço**:

```
Cliente → Veículo → Orçamento → Marcação/Agenda → Receção → Ordem de Serviço
→ Peças + Mão-de-obra → Stock → Faturação/Pagamento → Histórico + Fidelização
```

Os pontos criticamente citados por todas as soluções comerciais pesquisadas são:
**ordens de serviço digitais, orçamentos, agenda, stock de peças, faturação, histórico por viatura e comunicação com o cliente**. Em Portugal juntam-se as obrigações de **faturação eletrónica/AT, IVA, RGPD e registos de atividade (ASAE)**.

---

## 2. Necessidades funcionais

### 2.1 Clientes e veículos (CRM)
- Ficha de cliente: nome, contactos, NIF, morada, Email/telemóvel, consentimento RGPD.
- Ficha de veículo: matrícula, VIN, marca, modelo, ano, motor, quilometragem, combustível.
- Identificação rápida por **matrícula ou VIN** (integração futura com fontes de dados de veículos).
- **Histórico completo por viatura**: todas as intervenções, peças, quilometragens e fotos.
- Segmentação / etiquetas (cliente frequente, frota, seguradora, autorizada).

### 2.2 Orçamentos e aprovação
- Criação rápida de orçamentos com mão-de-obra + peças, descontos e taxas de IVA.
- Envio por **email ou WhatsApp** e **aprovação digital** do cliente.
- Conversão automática de orçamento aprovado em ordem de reparação.
- Modelos de serviços padrão (revisão, pastilhas, óleo, alinhamento) com tempos e preços.

### 2.3 Agenda e marcações
- Calendário de rampas / técnicos com prevenção de sobreposições.
- **Reservas online** através de link público da oficina.
- Quadros de trabalho (Kanban): *por fazer → em reparação → à espera de peças → pronto → entregue*.
- Lembretes automáticos de marcação e de revisões (SMS/WhatsApp/email).

### 2.4 Ordem de Serviço (OS) / Ordem de Reparação
- OS digital com: cliente, viatura, quilometragem, queixa do cliente, diagnóstico, fotos, checklist de entrada.
- Anexar **fotos e vídeos** do estado da viatura (importante para disputas e para o diagnóstico digital).
- **Checklist de receção** (níveis, pneus, luzes, danos existentes, objetos pessoais).
- Atribuição de técnico, tempo estimado e tempo real.
- Controlo de **garantia** da reparação.
- Emissão de OS em **PDF** e envio ao cliente.

### 2.5 Stock, peças e fornecedores
- Catálogo de peças com código, descrição, preço de compra, preço de venda e fornecedor.
- **Baixa automática de stock** ao lançar peça na OS.
- Alertas de stock mínimo / reposição automática.
- Gestão de encomendas e prazos de entrega ("peça encomendada, entrega estimada").
- Catálogos externos (ex.: TecDoc / TecRMI) para tempos e referências — são serviços comerciais, não substituíveis por MIT; deixar como integração opcional.

### 2.6 Financeiro e faturação
- Faturas e recibos gerados a partir da OS, sem duplicar trabalho.
- **Faturação eletrónica certificada pela AT** (Portugal) / integração com Moloni ou semelhante.
- Cálculo de IVA por linha (taxa normal / reduzida — ver §3.1).
- **Contas a pagar e a receber**, fluxo de caixa diário/mensal, controlo de inadimplência.
- Pagamentos: multibanco, MB WAY, cartão, transferência, dinheiro.
- Relatórios: faturação por período, ticket médio, serviços mais executados, peças mais vendidas, rentabilidade por OS/técnico.

### 2.7 Comunicação e fidelização
- Notificações por **WhatsApp/email**: orçamento enviado, aprovação, peça chegou, viatura pronta.
- **Diagnóstico digital**: partilhar fotos/vídeo e explicação com o cliente para justificar a intervenção.
- App ou interface **mobile para o mecânico** atualizar o estado no local, com fotos.
- Pedido de avaliação (estrelas) no final do serviço.
- Lembretes de manutenção preventiva / revisão.

### 2.8 Equipa e permissões
- Utilizadores individuais com palavra-passe própria (não partilhar credenciais — RGPD).
- Papéis: administrador, gestor/rececionista, mecânico, contabilidade (leitura).
- Registo de quem alterou o quê (audit trail) — útil para disputas e RGPD.
- Horários, folhas de obra, comissões / produtividade por técnico.

### 2.9 Gestão e indicadores (KPIs)
- Nº de OS abertas, OS prontas, tempo médio de reparação.
- Faturação do dia/mês, meta mensal, ticket médio.
- Taxa de conversão de orçamentos, taxa de recompra, margem por peça/serviço.

---

## 3. Requisitos legais e regulatórios (Portugal)

| Tema | O que a pesquisa indicou | Implicação para o software |
|---|---|---|
| **Faturação** | Fatura deve ser emitida no prazo de **5 dias úteis** a contar da conclusão do serviço (art. 36.º, n.º 1 do CIVA, segundo a OCC). | Gerar fatura automaticamente ao concluir OS; alertar se pendente. |
| **IVA** | A mão-de-obra de reparação pode beneficiar de **taxa reduzida (13% em Portugal continental)**, enquanto peças podem ir à taxa normal. Aplicar a taxa errada corrói margens e pode gerar inspeções. | Taxa de IVA configurável **por linha** (peça vs. mão-de-obra) e relatório de conferência. ⚠️ Validar com contabilista. |
| **Faturação eletrónica / AT** | A faturação eletrónica tornou-se um imperativo para oficinas portuguesas; faturas certificadas pela AT. | Arquitetura preparada para integração via API/SAFT; **não** emitir números de fatura inválidos. |
| **RGPD / LOPD** | A oficina trata nome, contactos, matrícula ligada ao titular, NIF, histórico, pagamentos. Obrigações: aviso de privacidade, consentimento, não ceder dados, segurança mínima, atender pedidos de acesso/retificação/apagamento, registar atividades de tratamento. | Aviso de privacidade no formulário de cliente; consentimento datado; exportação e apagamento de dados; registo de auditoria; permissões por utilizador. |
| **Prazo de conservação** | Dados de faturação conservados cerca de **10 anos** (legislação fiscal). | Política de retenção configurável; não apagar faturas. |
| **Licenciamento da atividade** | Abertura/alteração de atividade no âmbito do RJACSR (DL 10/2015, alterado por DL 102/2017, DL 9/2021, Lei 15/2018); requisitos específicos para GPL/GNC. | Fora do âmbito do software, mas o projeto deve avisar o utilizador sobre a obrigação. |
| **Livro de reclamações** | Exigência habitual em estabelecimentos de comércio e serviços em Portugal. | Prever registo de reclamações / link para o livro eletrónico. ⚠️ Confirmar aplicação concreta à oficina. |
| **Resíduos e ambiente** | Óleos usados, pneus e baterias têm regras de recolha e registo. | Módulo opcional de registo de resíduos/entregas a operador autorizado. |

---

## 4. Requisitos não funcionais

- **Multiplataforma:** web responsiva (telemóvel, tablet, PC); idealmente sem instalação.
- **Usabilidade:** linguagem simples, fluxos com poucos cliques, sem formação longa.
- **Segurança:** autenticação, autorização por papel, encriptação de passwords, HTTPS, auditoria.
- **Fiabilidade:** cópias de segurança automáticas, restauro testado.
- **Desempenho:** a oficina não pode parar; interface rápida mesmo com muitos registos.
- **Internacionalização:** português (pt-PT) como idioma inicial; moeda EUR; formatos de data PT.
- **Auto-hospedagem e ports:** instalação simples (Docker / binário), dados pertencem à oficina.
- **Licenças:** apenas dependências MIT ou compatíveis (ver §5).

---

## 5. Ferramentas e licenças (critério MIT)

Todas as tecnologias abaixo permitem que o produto final seja licenciado sob **MIT**:

| Categoria | Opções | Licença |
|---|---|---|
| Linguagem | TypeScript, JavaScript, Python, Go | Apache-2.0 / MIT / BSD / BSD-3 |
| Runtime | Node.js | MIT |
| Frontend | React, Next.js, Vue, Astro | MIT |
| Styling | Tailwind CSS, CSS puro | MIT |
| Backend | NestJS, Fastify, Express, Django, Laravel | MIT / BSD-3 / MIT |
| Base de dados | PostgreSQL, SQLite | PostgreSQL License / domínio público |
| ORM | Prisma, Drizzle, SQLAlchemy | Apache-2.0 / MIT / BSD |
| Testes | Vitest, Jest, Playwright | MIT / Apache-2.0 |
| Build/Dev | Vite, Docker ( engine ), GitHub Actions | MIT / Apache-2.0 (gratuito para uso ) |
| PDF | PDFKit, Puppeteer | MIT / Apache-2.0 |
| Agenda/Jobs | BullMQ | MIT |

**Serviços comerciais a evitar como dependência obrigatória** (por não serem MIT / serem pagos):
TecDoc/TecRMI, GateSign/assinatura certificada, AT direto sem biblioteca livre, API de matrículas paga, WhatsApp Business API (oficial, com custos). Devem ser **integrações opcionais**.

**Projetos open-source existentes para inspirar (verificar licença individual antes de copiar código):**
- **GarageBuddy** — ASP.NET Core MVC, registos de serviços e peças.
- **CarCare** — sistema self-hosted para reparação (Next.js).
- **LubeLogger** — registo de manutenção e combustível (self-hosted).
- **OpenAuto** — gestão de oficina com repair orders, scheduling e analytics.
- **Carstio** — clientes, carros, estimativas, ordens, pagamentos e PDFs.
- Tópico GitHub `garage-management-system` — vários exemplos Node/React/MySQL.

> Nota: "open-source" não garante MIT. Antes de reutilizar código, confirmar o ficheiro de licença de cada repositório.

---

## 6. Roadmap sugerido (visão geral)

1. **MVP (Fase 1):** clientes + viaturas + orçamentos + OS + stock simples + PDF + utilizadores/permissões.
2. **Fase 2:** agenda/reservas online, WhatsApp/email, faturação (SAFT/AT), financeiro, relatórios.
3. **Fase 3:** app mobile do mecânico, diagnóstico digital com fotos, integrações (matrículas, TecDoc, pagamentos), multi-loja.
4. **Fase 4:** RGPD avançado (exportação/apagamento), resíduos, livro de reclamações, localização adicional.

Detalhes em [ROADMAP.md](ROADMAP.md).

---

## 7. Fontes consultadas

**Soluções comerciais portuguesas (funcionalidades e fluxos):**
- GarageFlow — https://garageflow.pt/software-gestao-oficinas
- Carbob — https://www.carbob.pt/
- Gesgarage — https://www.gesgarage.pt
- MaisEmpresa — https://oficina.maisempresa.pt
- Megorix — https://megorix.com/pt/industries/auto-repair
- Wüst Software — https://wustsoftware.com.br/pt-pt/software-gestao-oficina-automovel
- OficinaPlus — https://oficinaplus.pt

**Legal / fiscal / RGPD:**
- Ordem dos Contabilistas Certificados — faturas de reparação de viaturas: https://www.occ.pt/pt-pt/noticias/faturas-de-reparacao-de-viaturas
- OCC — IVA em reparação em oficina própria: https://www.occ.pt/pt-pt/noticias/iva-faturacao-de-reparacao-em-oficina-propria
- OCC — regras de localização e serviços de reparação: https://www.occ.pt/pt-pt/noticias/iva-regras-de-localizacao-e-servicos-de-reparacao
- ASAE — FTF Oficinas Auto (RJACSR): https://www.asae.gov.pt/ficheiros-externos-2018/ftf-oficinas-auto-pdf.aspx
- TallerOS — RGPD para oficinas mecânicas: https://talleros.pro/pt/blog/lopd-rgpd-taller-mecanico
- Mekavo — IVA correto em oficinas: https://mekavo.com/pt/garage/blog/oficina-iva-correto-margem-lucro-perdida

**Open-source e stacks:**
- GarageBuddy — https://github.com/dimitar-grigorov/GarageBuddy
- Tópico GitHub garage-management-system — https://github.com/topics/garage-management-system
- OpenAuto — https://openauto.tech
- Carstio — https://carstio.com
- LubeLogger — https://lubelogger.com
- Comparação de frameworks full-stack 2026 (Vercel): https://vercel.com/i/full-stack-framework

---

## 8. Próximos passos

1. Validar prioridades com o utilizador (qual oMVP mais útil?).
2. Escolher a stack definitiva (recomendação inicial: **TypeScript + Next.js/React + PostgreSQL/SQLite + Drizzle/Prisma**, tudo MIT/compatível).
3. Desenhar o modelo de dados (já esboçado em [MODELO-DADOS.md](MODELO-DADOS.md)).
4. Implementar o MVP com testes e documentação desde o primeiro commit.

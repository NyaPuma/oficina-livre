# APIs externas integradas

> Pesquisa realizada a 19 de novembro de 2026. Todas as integrações são **opcionais ou gratuitas** e falham de forma graciosa: se o serviço não responder, a aplicação continua a funcionar com dados locais.

## 1. NIF / VIES — validação de clientes

- **Local:** algoritmo do dígito de controlo português (`src/lib/external/nif.ts`), sem API.
- **Opcional:** [VATcomply](https://vatcomply.com/) (open-source, sem chave) como wrapper do VIES europeu → `https://api.vatcomply.com/vat?vat_number=PT...`.
- **UI:** botão de escudo no campo NIF do formulário de cliente.
- **Nota:** o VIES confirma registo, não a atividade comercial; o resultado é informativo.

## 2. VIN — NHTSA vPIC (EUA)

- Endpoint público e gratuito: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json`.
- Devolve marca, modelo e ano. **Cobertura americana**: viaturas europeias podem devolver campos vazios.
- Fallback local: ano inferido pela 10.ª posição do VIN (norma SAE).
- **UI:** botão no campo VIN do formulário de viatura, pré-preenchendo marca/modelo/ano.

## 3. Geocodificação — Nominatim / OpenStreetMap

- Endpoint: `https://nominatim.openstreetmap.org/search` com `User-Agent` válido.
- Limite do serviço público: **1 pedido/segundo**; para volume alto, self-host.
- Dados sob **ODbL** — atribuição obrigatória: **© OpenStreetMap contributors**.
- **UI:** "Pesquisar morada" no formulário de cliente preenche morada, código postal e localidade.

## 4. Feriados — Nager.Date

- Endpoint: `https://date.nager.at/api/v3/PublicHolidays/{ano}/PT`, gratuito e sem chave.
- Cache em memória de 24 h (`src/lib/external/holidays.ts`).
- **UI:** próximos feriados na agenda, para ajudar a planear marcações.

## 5. Tempo — Open-Meteo

- Endpoint: `https://api.open-meteo.com/v1/forecast`, gratuito e sem chave para uso não comercial (até ~10 000 chamadas/dia).
- Cache de 30 min; coordenadas configuráveis em `WORKSHOP_LAT` / `WORKSHOP_LON`.
- Atribuição: **Weather data by Open-Meteo.com**.
- **UI:** temperatura e precipitação no modo mecânico.

## 6. Apoio ao diagnóstico — biblioteca local + NHTSA

- **Base local** (`src/lib/knowledge/repairs.ts`): artigos próprios com sintomas, causas prováveis, passos de diagnóstico, correcção e avisos de segurança, além dos códigos OBD-II mais comuns. Não contém cópias de manuais do fabricante e funciona sem Internet.
- **NHTSA recalls** — `https://api.nhtsa.gov/recalls/recallsByVehicle?make=...&model=...&modelYear=...`, gratuito e sem chave. Devolve campanhas, componente, resumo e remédio.
- **NHTSA complaints (ODI)** — `https://api.nhtsa.gov/complaints/complaintsByVehicle?...`, queixas reais de proprietários (limitadas às 10 mais recentes na interface), com indicadores de acidente/incêndio.
- Cache de 24 h por marca/modelo/ano e fallback vazio se o serviço falhar.
- **Aviso:** os dados NHTSA são dos EUA; na Europa/Portugal devem ser confirmados com a marca e com o Portal das Finanças/IMT quando aplicável.

## 7. Já existentes (com credenciais opcionais)

| Serviço | Finalidade | Configuração |
|---|---|---|
| TecDoc/TecRMI | Peças e identificação de veículos | `TECDOC_API_URL`, `TECDOC_API_KEY` |
| Stripe / SIBS | Pagamentos | `PAYMENT_PROVIDER`, `STRIPE_*` / `SIBS_*` |
| Moloni | Faturação certificada | `FISCAL_PROVIDER=moloni`, `MOLONI_*` |
| Provedor LLM | Assistente inteligente | `AI_API_URL`, `AI_API_KEY`, `AI_MODEL` |
| Serviço de assinatura | Assinatura qualificada | `QSIGN_*` |

## Princípios

- Nenhuma destas APIs é dependência obrigatória: há sempre fallback local.
- Nunca expor chaves em `NEXT_PUBLIC_*` nem em componentes cliente.
- Respeitar limites de uso e atribuições de licença dos dados (ODbL, Open-Meteo).
- Chamadas com `AbortSignal.timeout` e `try/catch` para não bloquear a interface.

## Fontes da pesquisa

- VATcomply / VIES — https://www.vatcomply.com/
- Nominatim usage policy — https://operations.osmfoundation.org/policies/nominatim/
- Nager.Date — https://date.nager.at/
- NHTSA vPIC — https://vpic.nhtsa.dot.gov/
- Open-Meteo — https://open-meteo.com/
- NHTSA Vehicle Safety API — https://api.nhtsa.gov/ (recalls e complaints)
- Open Labor Project (referência de API de DTCs — paga, não usada) — https://openlaborproject.com/docs/api

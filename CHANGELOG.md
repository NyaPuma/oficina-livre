# Changelog

Todas as alterações relevantes são documentadas aqui.

## 0.8.0

### Adicionado
- Biblioteca técnica local com sintomas, causas, diagnóstico, correcção e avisos de segurança
- Pesquisa por código OBD-II com causas prováveis e primeiras verificações
- Consulta de recalls e queixas NHTSA por marca/modelo/ano, integrada na ordem de serviço

## 0.7.0

### Adicionado
- Validação de NIF (algoritmo local + VIES via VATcomply) no formulário de clientes
- Decodificação de VIN via NHTSA vPIC no formulário de viaturas
- Pesquisa de moradas com OpenStreetMap/Nominatim
- Feriados portugueses (Nager.Date) na agenda e tempo atual (Open-Meteo) no modo mecânico

## 0.6.0

### Adicionado
- Assistente de oficina com sugestões, resumo de diagnóstico e previsão de revisão
- Painel e menu adaptados ao perfil do utilizador
- Leitura de códigos de barras e reposição de stock por consumo

## 0.5.0

### Adicionado
- Rate limiting com Redis opcional e fallback em memória
- Camada de dados `src/lib/data/` com DTOs serializáveis
- Adaptador de faturação certificada (Moloni) com ATCUD, hash e QR code
- Modo mecânico offline-first, job de lembretes e documentação de contribuição
- CSP com nonce, cabeçalhos de segurança e validação de parâmetros de URL

## 0.4.0

### Adicionado
- Modo mecânico mobile com PWA e identidade visual própria
- Diagnóstico digital com partilha pública
- Consulta de matrícula/VIN e catálogo TecDoc (adaptador configurável)
- Multi-loja, API pública v1, exportação JSON e importação CSV
- Adaptadores de pagamento (Stripe/SIBS), assinatura qualificada e SAF-T com campos AT

## 0.3.0

### Adicionado
- Agenda com reservas online e lembretes WhatsApp/email
- Faturação, recibos, pagamentos, contas a pagar, fluxo de caixa e relatórios

## 0.2.0

### Adicionado
- MVP: autenticação, clientes/viaturas, orçamentos, ordens de serviço, stock, utilizadores e auditoria

## 0.1.0

### Adicionado
- Nome, repositório público, licença MIT e pesquisa de necessidades

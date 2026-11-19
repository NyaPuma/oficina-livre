# Modelo de dados inicial

> Esboço conceptual — vai evoluir quando a stack for escolhida.
> Convenção: `id` = chave primária; `*_id` = chave estrangeira; `created_at` / `updated_at` em todas as entidades principais.

## Entidades e relações

```
User (utilizador)
 └─< AuditLog

Customer (cliente)
 ├─< Vehicle
 ├─< Quote
 ├─< WorkOrder
 └─< ConsentRecord (RGPD)

Vehicle (viatura)
 ├─ customer_id → Customer
 ├─ plate (matrícula), vin, brand, model, year, fuel, mileage
 └─< WorkOrder
 └─< InspectionPhoto

Supplier (fornecedor)
 └─< Part

Part (peça)
 ├─ supplier_id → Supplier
 ├─ code, description, cost_price, sale_price, stock_qty, min_stock
 └─< WorkOrderLine

ServiceTemplate (serviço padrão)
 ├─ name, description, standard_hours, sale_price, vat_rate
 └─< WorkOrderLine

Quote (orçamento)
 ├─ customer_id, vehicle_id
 ├─ number, status (rascunho/enviado/aprovado/rejeitado), valid_until
 ├─ approved_at, approval_token/signature
 └─< QuoteLine (descrição, qtd, preço, IVA, tipo: peça/serviço)

WorkOrder (ordem de serviço / reparação)
 ├─ customer_id, vehicle_id, assignee_id → User
 ├─ number, status (recebida, diagnóstico, aguardando peça, em reparação, pronta, entregue, faturada)
 ├─ odometer, complaint, diagnosis, checklist JSON, warranty_until
 ├─ quote_id → Quote (opcional)
 ├─< WorkOrderLine (part_id ou service_template_id, qtd, preço, IVA, desconto)
 ├─< InspectionPhoto (ficheiro, descrição, fase: entrada/diagnóstico/final)
 ├─< Appointment
 └─< Invoice

Appointment (marcação/agenda)
 ├─ work_order_id? / vehicle_id, technician_id → User
 ├─ starts_at, ends_at, ramp, source (interna/online)

Invoice (fatura)
 ├─ work_order_id → Customer via WorkOrder
 ├─ number, issued_at, due_at, status, total, vat_total, payment_status
 └─< InvoiceLine (cópia dos dados da OS + imposto)

Payment (pagamento)
 └─ invoice_id, method, amount, paid_at, reference

Expense / AccountPayable (contas a pagar)
 └─ supplier_id?, description, amount, due_at, paid_at

AuditLog
 └─ user_id, action, entity, entity_id, timestamp, old/new values (JSON)

ConsentRecord (RGPD)
 └─ customer_id, type (privacidade/comercial), granted_at, revoked_at, document_version
```

## Notas de desenho

- **Nunca apagar faturas**: apenas anular (estado) para manter integridade fiscal.
- **Linhas copiadas**: a fatura guarda uma cópia da descrição/preço/IVA da OS, mesmo que a peça mude de preço depois.
- **IVA por linha**: cada linha regista a taxa aplicada (ex.: 23% peça, 13% mão-de-obra — confirmar com contabilista).
- **Checklist e fotos**: guardar como JSON + ficheiros no sistema de ficheiros/bucket com referência na BD, nunca diretamente na coluna.
- **Auditoria**: registar criação/alteração de entidades sensíveis (OS, fatura, dados de cliente).
- **RGPD**: exportação completa do cliente e apagamento lógico (anonimização) quando permitido por lei.

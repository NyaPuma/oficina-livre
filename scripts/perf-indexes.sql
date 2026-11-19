-- Índices de desempenho para listas, pesquisas e relatórios.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS customers_name_trgm_idx ON customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS customers_nif_trgm_idx ON customers USING gin (nif gin_trgm_ops);
CREATE INDEX IF NOT EXISTS parts_code_trgm_idx ON parts USING gin (code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS parts_description_trgm_idx ON parts USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS work_orders_created_idx ON work_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS work_orders_status_created_idx ON work_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS work_order_lines_part_idx ON work_order_lines (part_id);
CREATE INDEX IF NOT EXISTS quotes_created_idx ON quotes (created_at DESC);
CREATE INDEX IF NOT EXISTS invoices_issued_idx ON invoices (issued_at DESC);
CREATE INDEX IF NOT EXISTS payments_paid_idx ON payments (paid_at DESC);
CREATE INDEX IF NOT EXISTS appointments_status_starts_idx ON appointments (status, starts_at);

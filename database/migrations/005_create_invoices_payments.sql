-- ============================================================
-- Migration 005
-- Invoices & Payments
-- ShriRam Solar Business Management System
-- ============================================================

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,

    invoice_number VARCHAR(30) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,

    service_job_id BIGINT,

    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,

    due_date DATE,

    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,

    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    pending_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

    notes TEXT,

    created_by BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_invoice_service_job
        FOREIGN KEY (service_job_id)
        REFERENCES service_jobs(id),

    CONSTRAINT fk_invoice_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT chk_invoice_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_invoice_discount
        CHECK (discount_amount >= 0),

    CONSTRAINT chk_invoice_tax
        CHECK (tax_amount >= 0),

    CONSTRAINT chk_invoice_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_invoice_paid
        CHECK (paid_amount >= 0),

    CONSTRAINT chk_invoice_pending
        CHECK (pending_amount >= 0),

    CONSTRAINT chk_invoice_status
        CHECK (
            status IN (
                'DRAFT',
                'ISSUED',
                'PARTIALLY_PAID',
                'PAID',
                'OVERDUE',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_invoices_customer_id
    ON invoices(customer_id);

CREATE INDEX idx_invoices_service_job_id
    ON invoices(service_job_id);

CREATE INDEX idx_invoices_invoice_date
    ON invoices(invoice_date);

CREATE INDEX idx_invoices_due_date
    ON invoices(due_date);

CREATE INDEX idx_invoices_status
    ON invoices(status);


-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,

    payment_number VARCHAR(30) NOT NULL UNIQUE,

    invoice_id BIGINT NOT NULL,

    customer_id BIGINT NOT NULL,

    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

    amount NUMERIC(12,2) NOT NULL,

    payment_method VARCHAR(30) NOT NULL,

    transaction_reference VARCHAR(100),

    notes TEXT,

    received_by BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(id),

    CONSTRAINT fk_payment_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_payment_received_by
        FOREIGN KEY (received_by)
        REFERENCES users(id),

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0),

    CONSTRAINT chk_payment_method
        CHECK (
            payment_method IN (
                'CASH',
                'UPI',
                'BANK_TRANSFER',
                'CARD',
                'CHEQUE',
                'OTHER'
            )
        )
);

CREATE INDEX idx_payments_invoice_id
    ON payments(invoice_id);

CREATE INDEX idx_payments_customer_id
    ON payments(customer_id);

CREATE INDEX idx_payments_payment_date
    ON payments(payment_date);

CREATE INDEX idx_payments_payment_method
    ON payments(payment_method);
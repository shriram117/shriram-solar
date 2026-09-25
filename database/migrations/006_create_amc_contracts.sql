-- ============================================================
-- 006_create_amc_contracts.sql
-- ShriRam Solar - AMC Contracts
-- ============================================================

CREATE TABLE IF NOT EXISTS amc_contracts (
    id BIGSERIAL PRIMARY KEY,

    amc_number VARCHAR(30) UNIQUE NOT NULL,

    customer_id BIGINT NOT NULL,
    solar_system_id BIGINT NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    contract_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    visit_frequency VARCHAR(30) NOT NULL DEFAULT 'QUARTERLY',

    total_visits INTEGER NOT NULL DEFAULT 4,
    used_visits INTEGER NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    terms_conditions TEXT,
    notes TEXT,

    created_by BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_amc_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_amc_solar_system
        FOREIGN KEY (solar_system_id)
        REFERENCES solar_systems(id),

    CONSTRAINT fk_amc_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT chk_amc_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_amc_amount
        CHECK (contract_amount >= 0),

    CONSTRAINT chk_amc_total_visits
        CHECK (total_visits >= 0),

    CONSTRAINT chk_amc_used_visits
        CHECK (
            used_visits >= 0
            AND used_visits <= total_visits
        ),

    CONSTRAINT chk_amc_frequency
        CHECK (
            visit_frequency IN (
                'MONTHLY',
                'QUARTERLY',
                'HALF_YEARLY',
                'YEARLY',
                'CUSTOM'
            )
        ),

    CONSTRAINT chk_amc_status
        CHECK (
            status IN (
                'DRAFT',
                'ACTIVE',
                'EXPIRING',
                'EXPIRED',
                'CANCELLED'
            )
        )
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_amc_customer_id
    ON amc_contracts(customer_id);

CREATE INDEX IF NOT EXISTS idx_amc_solar_system_id
    ON amc_contracts(solar_system_id);

CREATE INDEX IF NOT EXISTS idx_amc_status
    ON amc_contracts(status);

CREATE INDEX IF NOT EXISTS idx_amc_start_date
    ON amc_contracts(start_date);

CREATE INDEX IF NOT EXISTS idx_amc_end_date
    ON amc_contracts(end_date);

CREATE INDEX IF NOT EXISTS idx_amc_customer_status
    ON amc_contracts(customer_id, status);
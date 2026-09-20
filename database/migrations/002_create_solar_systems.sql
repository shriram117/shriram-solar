-- ============================================================
-- Migration 002
-- Solar Systems
-- ============================================================

CREATE TABLE solar_systems (
    id BIGSERIAL PRIMARY KEY,

    system_code VARCHAR(30) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,

    system_capacity_kw NUMERIC(10,2) NOT NULL,

    panel_brand VARCHAR(100),
    panel_model VARCHAR(100),
    panel_quantity INTEGER,

    inverter_brand VARCHAR(100),
    inverter_model VARCHAR(100),
    inverter_capacity_kw NUMERIC(10,2),

    installation_date DATE,

    installer_technician_id BIGINT,

    panel_warranty_years NUMERIC(5,2),
    inverter_warranty_years NUMERIC(5,2),

    net_metering_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    subsidy_status VARCHAR(30) NOT NULL DEFAULT 'NOT_APPLIED',

    system_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_solar_system_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_solar_system_technician
        FOREIGN KEY (installer_technician_id)
        REFERENCES technicians(id),

    CONSTRAINT chk_system_capacity
        CHECK (system_capacity_kw > 0),

    CONSTRAINT chk_panel_quantity
        CHECK (
            panel_quantity IS NULL
            OR panel_quantity > 0
        ),

    CONSTRAINT chk_inverter_capacity
        CHECK (
            inverter_capacity_kw IS NULL
            OR inverter_capacity_kw > 0
        ),

    CONSTRAINT chk_net_metering_status
        CHECK (
            net_metering_status IN (
                'PENDING',
                'APPLIED',
                'APPROVED',
                'INSTALLED',
                'NOT_REQUIRED'
            )
        ),

    CONSTRAINT chk_subsidy_status
        CHECK (
            subsidy_status IN (
                'NOT_APPLIED',
                'APPLIED',
                'APPROVED',
                'RECEIVED',
                'NOT_ELIGIBLE'
            )
        ),

    CONSTRAINT chk_system_status
        CHECK (
            system_status IN (
                'ACTIVE',
                'INACTIVE',
                'UNDER_MAINTENANCE',
                'DECOMMISSIONED'
            )
        )
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_solar_systems_customer_id
    ON solar_systems(customer_id);

CREATE INDEX idx_solar_systems_technician_id
    ON solar_systems(installer_technician_id);

CREATE INDEX idx_solar_systems_status
    ON solar_systems(system_status);

CREATE INDEX idx_solar_systems_installation_date
    ON solar_systems(installation_date);

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE solar_systems IS
    'Solar installation/system information linked to customers';

COMMENT ON COLUMN solar_systems.system_code IS
    'Unique business identifier for the solar system';

COMMENT ON COLUMN solar_systems.system_capacity_kw IS
    'Installed solar capacity in kilowatts';

COMMENT ON COLUMN solar_systems.net_metering_status IS
    'Current net metering application/installation status';

COMMENT ON COLUMN solar_systems.subsidy_status IS
    'Current solar subsidy status';

COMMENT ON COLUMN solar_systems.system_status IS
    'Current operational status of the solar system';
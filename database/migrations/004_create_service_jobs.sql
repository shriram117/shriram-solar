CREATE TABLE service_jobs (
    id BIGSERIAL PRIMARY KEY,

    job_code VARCHAR(30) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,

    solar_system_id BIGINT,

    technician_id BIGINT,

    service_type VARCHAR(50) NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',

    scheduled_date DATE,

    started_at TIMESTAMP,

    completed_at TIMESTAMP,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    problem_description TEXT,

    work_performed TEXT,

    technician_notes TEXT,

    customer_notes TEXT,

    service_charge NUMERIC(12,2) NOT NULL DEFAULT 0,

    created_by BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_service_job_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_service_job_solar_system
        FOREIGN KEY (solar_system_id)
        REFERENCES solar_systems(id),

    CONSTRAINT fk_service_job_technician
        FOREIGN KEY (technician_id)
        REFERENCES technicians(id),

    CONSTRAINT fk_service_job_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT chk_service_job_charge
        CHECK (service_charge >= 0),

    CONSTRAINT chk_service_job_priority
        CHECK (
            priority IN (
                'LOW',
                'NORMAL',
                'HIGH',
                'URGENT'
            )
        ),

    CONSTRAINT chk_service_job_status
        CHECK (
            status IN (
                'PENDING',
                'ASSIGNED',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_service_job_type
        CHECK (
            service_type IN (
                'INSTALLATION',
                'REPAIR',
                'PANEL_CLEANING',
                'INSPECTION',
                'AMC',
                'MAINTENANCE',
                'OTHER'
            )
        )
);

CREATE INDEX idx_service_jobs_customer_id
    ON service_jobs(customer_id);

CREATE INDEX idx_service_jobs_solar_system_id
    ON service_jobs(solar_system_id);

CREATE INDEX idx_service_jobs_technician_id
    ON service_jobs(technician_id);

CREATE INDEX idx_service_jobs_status
    ON service_jobs(status);

CREATE INDEX idx_service_jobs_scheduled_date
    ON service_jobs(scheduled_date);

CREATE INDEX idx_service_jobs_priority
    ON service_jobs(priority);
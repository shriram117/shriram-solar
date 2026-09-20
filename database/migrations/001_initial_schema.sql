-- ============================================================
-- ShriRam Solar Business
-- Migration 001 - Initial Schema
-- PostgreSQL 18
-- ============================================================

BEGIN;

-- ============================================================
-- ROLES
-- ============================================================

CREATE TABLE roles (
    id              SERIAL PRIMARY KEY,
    role_name       VARCHAR(50) NOT NULL UNIQUE,
    description     VARCHAR(255),
    status          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    role_id         INTEGER NOT NULL,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150),
    mobile          VARCHAR(20),
    status          BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
);

CREATE INDEX idx_users_role_id
    ON users(role_id);

CREATE INDEX idx_users_status
    ON users(status);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
    id                  BIGSERIAL PRIMARY KEY,
    customer_code       VARCHAR(30) NOT NULL UNIQUE,
    customer_name       VARCHAR(150) NOT NULL,
    mobile              VARCHAR(20) NOT NULL,
    alternate_mobile    VARCHAR(20),
    email               VARCHAR(150),

    address             TEXT,
    city                VARCHAR(100),
    district            VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),

    customer_type       VARCHAR(30) NOT NULL DEFAULT 'RESIDENTIAL',

    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    notes               TEXT,

    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_customer_type
        CHECK (customer_type IN (
            'RESIDENTIAL',
            'COMMERCIAL',
            'INDUSTRIAL',
            'GOVERNMENT'
        )),

    CONSTRAINT chk_customer_status
        CHECK (status IN (
            'ACTIVE',
            'INACTIVE'
        ))
);

CREATE INDEX idx_customers_mobile
    ON customers(mobile);

CREATE INDEX idx_customers_name
    ON customers(customer_name);

CREATE INDEX idx_customers_city
    ON customers(city);

-- ============================================================
-- LEADS
-- ============================================================

CREATE TABLE leads (
    id                  BIGSERIAL PRIMARY KEY,

    lead_code           VARCHAR(30) NOT NULL UNIQUE,

    customer_name       VARCHAR(150) NOT NULL,
    mobile              VARCHAR(20) NOT NULL,
    email               VARCHAR(150),

    city                VARCHAR(100),
    district            VARCHAR(100),

    service_type        VARCHAR(50) NOT NULL,

    requirement         TEXT,

    estimated_capacity  NUMERIC(10,2),

    source              VARCHAR(50) DEFAULT 'WEBSITE',

    status              VARCHAR(30) NOT NULL DEFAULT 'NEW',

    assigned_to         BIGINT,

    converted_customer_id BIGINT,

    follow_up_date      DATE,

    notes               TEXT,

    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_leads_assigned_user
        FOREIGN KEY (assigned_to)
        REFERENCES users(id),

    CONSTRAINT fk_leads_customer
        FOREIGN KEY (converted_customer_id)
        REFERENCES customers(id),

    CONSTRAINT chk_lead_status
        CHECK (status IN (
            'NEW',
            'CONTACTED',
            'FOLLOW_UP',
            'QUOTED',
            'CONVERTED',
            'LOST',
            'CANCELLED'
        ))
);

CREATE INDEX idx_leads_mobile
    ON leads(mobile);

CREATE INDEX idx_leads_status
    ON leads(status);

CREATE INDEX idx_leads_follow_up
    ON leads(follow_up_date);

CREATE INDEX idx_leads_created_at
    ON leads(created_at);

-- ============================================================
-- SERVICES
-- ============================================================

CREATE TABLE services (
    id                  SERIAL PRIMARY KEY,

    service_code        VARCHAR(30) NOT NULL UNIQUE,

    service_name        VARCHAR(100) NOT NULL,

    description         TEXT,

    service_category    VARCHAR(50) NOT NULL,

    base_price          NUMERIC(12,2) NOT NULL DEFAULT 0,

    duration_minutes    INTEGER,

    image_url           TEXT,

    status              BOOLEAN NOT NULL DEFAULT TRUE,

    display_order       INTEGER NOT NULL DEFAULT 0,

    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_service_category
        CHECK (service_category IN (
            'INSTALLATION',
            'CLEANING',
            'REPAIR',
            'INSPECTION',
            'AMC',
            'OTHER'
        )),

    CONSTRAINT chk_service_price
        CHECK (base_price >= 0)
);

CREATE INDEX idx_services_category
    ON services(service_category);

CREATE INDEX idx_services_status
    ON services(status);

-- ============================================================
-- TECHNICIANS
-- ============================================================

CREATE TABLE technicians (
    id                  BIGSERIAL PRIMARY KEY,

    technician_code     VARCHAR(30) NOT NULL UNIQUE,

    technician_name     VARCHAR(150) NOT NULL,

    mobile              VARCHAR(20) NOT NULL,

    alternate_mobile    VARCHAR(20),

    email               VARCHAR(150),

    address             TEXT,

    city                VARCHAR(100),

    specialization      VARCHAR(100),

    experience_years    NUMERIC(4,1),

    joining_date        DATE,

    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    notes               TEXT,

    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_technician_status
        CHECK (status IN (
            'ACTIVE',
            'INACTIVE',
            'ON_LEAVE'
        ))
);

CREATE INDEX idx_technicians_mobile
    ON technicians(mobile);

CREATE INDEX idx_technicians_status
    ON technicians(status);

-- ============================================================
-- SEED ROLES
-- ============================================================

INSERT INTO roles (
    role_name,
    description
)
VALUES
    ('SUPER_ADMIN', 'Full system access'),
    ('ADMIN', 'Business administration access'),
    ('STAFF', 'Operational staff access'),
    ('TECHNICIAN', 'Technician/job access');

COMMIT;
-- Feature Flags Manager — PostgreSQL 16
-- gen_random_uuid() встроен в PG13+, расширение не нужно

CREATE TABLE IF NOT EXISTS projects (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    project_key VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'developer',
    full_name     VARCHAR(255) NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS environments (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    env_key        VARCHAR(50)  NOT NULL,
    name           VARCHAR(100) NOT NULL,
    client_api_key VARCHAR(100) NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, env_key)
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    flag_key     VARCHAR(100) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    description  TEXT         NOT NULL DEFAULT '',
    is_permanent BOOLEAN      NOT NULL DEFAULT FALSE,
    archived_at  TIMESTAMPTZ  DEFAULT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, flag_key)
);

CREATE TABLE IF NOT EXISTS flag_states (
    id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id         UUID      NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    environment_id  UUID      NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    is_enabled      BOOLEAN   NOT NULL DEFAULT FALSE,
    targeting_rules JSONB     NOT NULL DEFAULT '[]'::jsonb,
    rollout_weight  SMALLINT  NOT NULL DEFAULT 100 CHECK (rollout_weight BETWEEN 0 AND 100),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(flag_id, environment_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id        UUID        REFERENCES feature_flags(id) ON DELETE SET NULL,
    actor_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
    environment_id UUID        REFERENCES environments(id) ON DELETE SET NULL,
    event_type     VARCHAR(50) NOT NULL,
    diff_payload   JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_project ON feature_flags(project_id);
CREATE INDEX IF NOT EXISTS idx_flag_states_flag       ON flag_states(flag_id);
CREATE INDEX IF NOT EXISTS idx_flag_states_env        ON flag_states(environment_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created   ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_flag      ON audit_events(flag_id);
CREATE INDEX IF NOT EXISTS idx_environments_apikey    ON environments(client_api_key);

-- SEED DATA
INSERT INTO projects (id, project_key, name, description)
VALUES ('00000000-0000-0000-0000-000000000001','ff-demo','Feature Flags Demo','Default demo project')
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, password_hash, role, full_name, is_active)
VALUES ('00000000-0000-0000-0000-000000000010','admin@ff.local',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','admin','Admin',true)
ON CONFLICT DO NOTHING;

INSERT INTO environments (id, project_id, env_key, name, client_api_key)
VALUES
    ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','development','Development','dev-key-001'),
    ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','staging','Staging','stg-key-001'),
    ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','production','Production','prod-key-001')
ON CONFLICT DO NOTHING;

INSERT INTO feature_flags (id, project_id, author_id, flag_key, name, description, is_permanent)
VALUES
    ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010',
     'stripe-checkout-v2','Stripe Checkout v2','Новый флоу оплаты через Stripe Elements',false),
    ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010',
     'zendesk-ai-bot','Zendesk AI Support Bot','Интеграция умного бота для первой линии поддержки',false),
    ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010',
     'datadog-rum','Datadog RUM','Real User Monitoring через Datadog Browser SDK',false)
ON CONFLICT DO NOTHING;

INSERT INTO flag_states (flag_id, environment_id, is_enabled, targeting_rules, rollout_weight)
VALUES
    ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000002',true,'[]'::jsonb,100),
    ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000003',true,'[]'::jsonb,100),
    ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000004',true,'[{"type":"percentage","value":10}]'::jsonb,10),
    ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000002',true,'[]'::jsonb,100),
    ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000003',true,'[]'::jsonb,100),
    ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000004',true,'[{"type":"user_group","value":"beta-testers"}]'::jsonb,100),
    ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000002',false,'[]'::jsonb,100),
    ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000003',true,'[{"type":"percentage","value":50}]'::jsonb,50),
    ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000004',true,'[{"type":"percentage","value":5}]'::jsonb,5)
ON CONFLICT DO NOTHING;

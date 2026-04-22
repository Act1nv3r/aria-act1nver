-- Migration: add CRM tables
-- Tables: oportunidades_cliente, actividades_cliente, perfiles_acumulados
-- Run: docker exec -i ariabyactinver-db-1 psql -U aria -d ariadb < migrations/add_crm_tables.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── perfiles_acumulados ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfiles_acumulados (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id                      UUID NOT NULL UNIQUE REFERENCES clientes(id),

    -- Datos demográficos
    nombre                          VARCHAR(120),
    edad                            INTEGER,
    genero                          VARCHAR(2),
    ocupacion                       VARCHAR(30),
    dependientes                    BOOLEAN,

    -- Contacto
    email                           VARCHAR(255),
    telefono                        VARCHAR(20),
    whatsapp                        VARCHAR(20),
    empresa                         VARCHAR(120),
    cargo                           VARCHAR(80),
    ciudad                          VARCHAR(80),

    -- Resumen financiero
    patrimonio_total                NUMERIC(18, 2),
    liquidez_total                  NUMERIC(18, 2),
    ahorro_mensual                  NUMERIC(18, 2),
    nivel_riqueza                   VARCHAR(20),
    grado_avance_retiro             NUMERIC(5, 2),
    tiene_seguro_vida               BOOLEAN,
    tiene_sgmm                      BOOLEAN,

    -- Metadata CRM
    tags                            JSONB DEFAULT '[]',
    notas_generales                 TEXT,
    salud_score                     INTEGER DEFAULT 20,

    -- Referencia al último diagnóstico
    ultimo_diagnostico_id           UUID REFERENCES diagnosticos(id),
    ultima_actualizacion_diagnostico TIMESTAMPTZ,

    -- Timestamps
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── oportunidades_cliente ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oportunidades_cliente (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id                  UUID NOT NULL REFERENCES clientes(id),
    asesor_id                   UUID NOT NULL REFERENCES asesores(id),
    diagnostico_id              UUID REFERENCES diagnosticos(id),

    -- Clasificación
    tipo                        VARCHAR(20) NOT NULL,
    categoria                   VARCHAR(30),
    prioridad                   VARCHAR(10) NOT NULL DEFAULT 'media',
    fuente                      VARCHAR(20) NOT NULL DEFAULT 'ai',

    -- Contenido
    titulo                      VARCHAR(200) NOT NULL,
    descripcion                 TEXT,
    producto_sugerido           VARCHAR(200),
    "señal_detectada"           VARCHAR(500),
    contexto_seguimiento        TEXT,
    accion_sugerida             TEXT,
    confianza                   NUMERIC(3, 2),

    -- Estado pipeline
    estado_tarea                VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    justificacion_descarte      TEXT,
    fecha_objetivo              DATE,
    fecha_inicio_proceso        TIMESTAMPTZ,
    fecha_completada            TIMESTAMPTZ,

    -- Audit trail
    historial_estados           JSONB DEFAULT '[]',

    -- Valor estimado
    valor_estimado_mxn          NUMERIC(18, 2),

    -- Timestamps
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_oportunidades_cliente_id_estado
    ON oportunidades_cliente(cliente_id, estado_tarea);

CREATE INDEX IF NOT EXISTS ix_oportunidades_cliente_cliente_id
    ON oportunidades_cliente(cliente_id);

-- ─── actividades_cliente ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS actividades_cliente (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id          UUID NOT NULL REFERENCES clientes(id),
    asesor_id           UUID NOT NULL REFERENCES asesores(id),

    -- Tipo y contenido
    tipo                VARCHAR(30) NOT NULL,
    titulo              VARCHAR(200) NOT NULL,
    descripcion         TEXT,
    resultado           VARCHAR(30),

    -- Referencias
    diagnostico_id      UUID REFERENCES diagnosticos(id),
    oportunidad_id      UUID REFERENCES oportunidades_cliente(id),

    -- Timing
    duracion_minutos    INTEGER,
    fecha_actividad     TIMESTAMPTZ NOT NULL,

    -- Metadata extra
    metadata_extra      JSONB,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_actividades_cliente_cliente_id
    ON actividades_cliente(cliente_id);

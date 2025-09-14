-- ==============================================================
-- Schema Export (PostgreSQL + TimescaleDB)
-- Database : ecc800
-- Host     : 10.251.150.222:5210
-- User     : apirak
-- Generated: 2025-09-12T08:37:56
-- NOTE     : Structure & settings only (no data)
-- ==============================================================

-- Ensure TimescaleDB extension exists
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- === pg_dump -s (schema only) ===
--
-- PostgreSQL database dump
--

\restrict xzcwInUytySHENfdMfnhpdJOFioILdVi4VbvupdsMcJlmI9BLMb14vWXyVrbXUO

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'ECC800 Enhanced Schema with Display Overrides - Minimal version compatible with existing data';


--
-- Name: timescaledb; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "timescaledb" WITH SCHEMA "public";


--
-- Name: EXTENSION "timescaledb"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "timescaledb" IS 'Enables scalable inserts and complex queries for time-series data (Community Edition)';


--
-- Name: create_monthly_partition("text", "date"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."create_monthly_partition"("table_name" "text", "start_date" "date") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
                    FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
    
    -- Create indexes on partition
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (time)',
                   'idx_' || partition_name || '_time', partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (equipment_id)',
                   'idx_' || partition_name || '_equipment', partition_name);
END;
$$;


--
-- Name: get_session_statistics(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."get_session_statistics"("p_session_id" character varying) RETURNS TABLE("metric_name" "text", "metric_value" "text", "metric_unit" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Total Duration'::TEXT as metric_name,
        COALESCE(duration_seconds::TEXT, '0') as metric_value,
        'seconds'::TEXT as metric_unit
    FROM enhanced_export_sessions 
    WHERE session_id = p_session_id
    
    UNION ALL
    
    SELECT 
        'Completed Steps'::TEXT,
        COALESCE(completed_steps::TEXT, '0'),
        'steps'::TEXT
    FROM enhanced_export_sessions 
    WHERE session_id = p_session_id
    
    UNION ALL
    
    SELECT 
        'File Size'::TEXT,
        COALESCE(file_size_bytes::TEXT, '0'),
        'bytes'::TEXT
    FROM enhanced_export_sessions 
    WHERE session_id = p_session_id;
END;
$$;


--
-- Name: get_sites_with_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."get_sites_with_data"() RETURNS TABLE("site_code" "text", "device_count" bigint, "metric_count" bigint, "last_update" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.v_sites_summary;
END;
$$;


--
-- Name: update_enhanced_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."update_enhanced_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: _compressed_hypertable_26; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_compressed_hypertable_26" (
);


--
-- Name: _compressed_hypertable_6; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_compressed_hypertable_6" (
);


--
-- Name: performance_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."performance_data" (
    "id" bigint NOT NULL,
    "site_code" character varying(10) DEFAULT 'dc'::character varying NOT NULL,
    "equipment_name" character varying(255) NOT NULL,
    "equipment_id" character varying(50) NOT NULL,
    "performance_data" character varying(500) NOT NULL,
    "statistical_period" character varying(50) NOT NULL,
    "statistical_start_time" timestamp without time zone NOT NULL,
    "value_text" character varying(100),
    "value_numeric" numeric(15,4),
    "unit" character varying(50),
    "data_type" character varying(20) DEFAULT 'performance_data'::character varying,
    "source_file" character varying(255),
    "import_timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "data_hash" character varying(32),
    "time" timestamp with time zone GENERATED ALWAYS AS ("statistical_start_time") STORED,
    "value" numeric(15,4) GENERATED ALWAYS AS ("value_numeric") STORED
);


--
-- Name: TABLE "performance_data"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."performance_data" IS 'Enhanced performance data with TimescaleDB hypertable and Thai logging support';


--
-- Name: _direct_view_22; Type: VIEW; Schema: _timescaledb_internal; Owner: -
--

CREATE VIEW "_timescaledb_internal"."_direct_view_22" AS
 SELECT "public"."time_bucket"('01:00:00'::interval, "statistical_start_time") AS "hour_bucket",
    "site_code",
    "equipment_name",
    "performance_data" AS "metric_key",
    "avg"("value") AS "avg_value",
    "min"("value") AS "min_value",
    "max"("value") AS "max_value",
    "count"(*) AS "count_records",
    "stddev"("value") AS "stddev_value"
   FROM "public"."performance_data"
  GROUP BY ("public"."time_bucket"('01:00:00'::interval, "statistical_start_time")), "site_code", "equipment_name", "performance_data";


--
-- Name: _materialized_hypertable_22; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_materialized_hypertable_22" (
    "hour_bucket" timestamp without time zone NOT NULL,
    "site_code" character varying(10),
    "equipment_name" character varying(255),
    "metric_key" character varying(500),
    "avg_value" numeric,
    "min_value" numeric,
    "max_value" numeric,
    "count_records" bigint,
    "stddev_value" numeric
);


--
-- Name: cagg_perf_5m_to_1h; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."cagg_perf_5m_to_1h" AS
 SELECT "hour_bucket",
    "site_code",
    "equipment_name",
    "metric_key",
    "avg_value",
    "min_value",
    "max_value",
    "count_records",
    "stddev_value"
   FROM "_timescaledb_internal"."_materialized_hypertable_22";


--
-- Name: _direct_view_23; Type: VIEW; Schema: _timescaledb_internal; Owner: -
--

CREATE VIEW "_timescaledb_internal"."_direct_view_23" AS
 SELECT "public"."time_bucket"('1 day'::interval, "hour_bucket") AS "day_bucket",
    "site_code",
    "equipment_name",
    "metric_key",
    "avg"("avg_value") AS "avg_value",
    "min"("min_value") AS "min_value",
    "max"("max_value") AS "max_value",
    "sum"("count_records") AS "total_records",
    "avg"("stddev_value") AS "avg_stddev"
   FROM "public"."cagg_perf_5m_to_1h"
  GROUP BY ("public"."time_bucket"('1 day'::interval, "hour_bucket")), "site_code", "equipment_name", "metric_key";


--
-- Name: fault_performance_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."fault_performance_data" (
    "id" integer NOT NULL,
    "site_code" character varying(10) DEFAULT 'dc'::character varying NOT NULL,
    "equipment_name" character varying(255) NOT NULL,
    "equipment_id" character varying(50) NOT NULL,
    "performance_data" character varying(500) NOT NULL,
    "statistical_period" character varying(50) NOT NULL,
    "statistical_start_time" timestamp without time zone NOT NULL,
    "value_text" character varying(100),
    "value_numeric" numeric(15,4),
    "unit" character varying(50),
    "data_type" character varying(20) DEFAULT 'fault_info'::character varying,
    "source_file" character varying(255),
    "import_timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "data_hash" character varying(64)
);


--
-- Name: TABLE "fault_performance_data"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."fault_performance_data" IS 'Performance data imported from ECC800 Fault Information exports';


--
-- Name: _direct_view_24; Type: VIEW; Schema: _timescaledb_internal; Owner: -
--

CREATE VIEW "_timescaledb_internal"."_direct_view_24" AS
 SELECT "public"."time_bucket"('01:00:00'::interval, "statistical_start_time") AS "hour_bucket",
    "site_code",
    "equipment_name",
    "performance_data" AS "metric_key",
    "count"(*) AS "fault_count",
    "count"(DISTINCT "equipment_name") AS "affected_equipment_count"
   FROM "public"."fault_performance_data"
  GROUP BY ("public"."time_bucket"('01:00:00'::interval, "statistical_start_time")), "site_code", "equipment_name", "performance_data";


--
-- Name: _materialized_hypertable_24; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_materialized_hypertable_24" (
    "hour_bucket" timestamp without time zone NOT NULL,
    "site_code" character varying(10),
    "equipment_name" character varying(255),
    "metric_key" character varying(500),
    "fault_count" bigint,
    "affected_equipment_count" bigint
);


--
-- Name: cagg_fault_hourly; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."cagg_fault_hourly" AS
 SELECT "hour_bucket",
    "site_code",
    "equipment_name",
    "metric_key",
    "fault_count",
    "affected_equipment_count"
   FROM "_timescaledb_internal"."_materialized_hypertable_24";


--
-- Name: _direct_view_25; Type: VIEW; Schema: _timescaledb_internal; Owner: -
--

CREATE VIEW "_timescaledb_internal"."_direct_view_25" AS
 SELECT "public"."time_bucket"('1 day'::interval, "hour_bucket") AS "day_bucket",
    "site_code",
    "equipment_name",
    "metric_key",
    "sum"("fault_count") AS "total_fault_count",
    "max"("affected_equipment_count") AS "max_affected_equipment"
   FROM "public"."cagg_fault_hourly"
  GROUP BY ("public"."time_bucket"('1 day'::interval, "hour_bucket")), "site_code", "equipment_name", "metric_key";


--
-- Name: _hyper_13_94_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_13_94_chunk" (
    CONSTRAINT "constraint_92" CHECK ((("statistical_start_time" >= '2025-09-04 00:00:00'::timestamp without time zone) AND ("statistical_start_time" < '2025-09-11 00:00:00'::timestamp without time zone)))
)
INHERITS ("public"."performance_data");


--
-- Name: _hyper_13_95_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_13_95_chunk" (
    CONSTRAINT "constraint_93" CHECK ((("statistical_start_time" >= '2025-08-28 00:00:00'::timestamp without time zone) AND ("statistical_start_time" < '2025-09-04 00:00:00'::timestamp without time zone)))
)
INHERITS ("public"."performance_data");


--
-- Name: _hyper_13_96_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_13_96_chunk" (
    CONSTRAINT "constraint_94" CHECK ((("statistical_start_time" >= '2025-09-11 00:00:00'::timestamp without time zone) AND ("statistical_start_time" < '2025-09-18 00:00:00'::timestamp without time zone)))
)
INHERITS ("public"."performance_data");


--
-- Name: _hyper_22_45_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_22_45_chunk" (
    CONSTRAINT "constraint_43" CHECK ((("hour_bucket" >= '2025-07-31 00:00:00'::timestamp without time zone) AND ("hour_bucket" < '2025-10-09 00:00:00'::timestamp without time zone)))
)
INHERITS ("_timescaledb_internal"."_materialized_hypertable_22");


--
-- Name: _materialized_hypertable_23; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_materialized_hypertable_23" (
    "day_bucket" timestamp without time zone NOT NULL,
    "site_code" character varying(10),
    "equipment_name" character varying(255),
    "metric_key" character varying(500),
    "avg_value" numeric,
    "min_value" numeric,
    "max_value" numeric,
    "total_records" numeric,
    "avg_stddev" numeric
);


--
-- Name: _hyper_23_46_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_23_46_chunk" (
    CONSTRAINT "constraint_44" CHECK ((("day_bucket" >= '2025-07-31 00:00:00'::timestamp without time zone) AND ("day_bucket" < '2025-10-09 00:00:00'::timestamp without time zone)))
)
INHERITS ("_timescaledb_internal"."_materialized_hypertable_23");


--
-- Name: _hyper_24_47_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_24_47_chunk" (
    CONSTRAINT "constraint_45" CHECK ((("hour_bucket" >= '2025-07-31 00:00:00'::timestamp without time zone) AND ("hour_bucket" < '2025-10-09 00:00:00'::timestamp without time zone)))
)
INHERITS ("_timescaledb_internal"."_materialized_hypertable_24");


--
-- Name: _materialized_hypertable_25; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_materialized_hypertable_25" (
    "day_bucket" timestamp without time zone NOT NULL,
    "site_code" character varying(10),
    "equipment_name" character varying(255),
    "metric_key" character varying(500),
    "total_fault_count" numeric,
    "max_affected_equipment" bigint
);


--
-- Name: _hyper_25_48_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_25_48_chunk" (
    CONSTRAINT "constraint_46" CHECK ((("day_bucket" >= '2025-07-31 00:00:00'::timestamp without time zone) AND ("day_bucket" < '2025-10-09 00:00:00'::timestamp without time zone)))
)
INHERITS ("_timescaledb_internal"."_materialized_hypertable_25");


--
-- Name: _hyper_5_100_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_5_100_chunk" (
    CONSTRAINT "constraint_97" CHECK ((("statistical_start_time" >= '2025-09-11 00:00:00'::timestamp without time zone) AND ("statistical_start_time" < '2025-09-18 00:00:00'::timestamp without time zone))),
    CONSTRAINT "constraint_98" CHECK ((("_timescaledb_functions"."get_partition_hash"("site_code") >= 1073741820) AND ("_timescaledb_functions"."get_partition_hash"("site_code") < 1342177275)))
)
INHERITS ("public"."fault_performance_data");


--
-- Name: _hyper_5_97_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_5_97_chunk" (
    CONSTRAINT "constraint_95" CHECK ((("statistical_start_time" >= '2025-09-04 00:00:00'::timestamp without time zone) AND ("statistical_start_time" < '2025-09-11 00:00:00'::timestamp without time zone))),
    CONSTRAINT "constraint_96" CHECK (("_timescaledb_functions"."get_partition_hash"("site_code") >= 1879048185))
)
INHERITS ("public"."fault_performance_data");


--
-- Name: _hyper_5_98_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_5_98_chunk" (
    CONSTRAINT "constraint_96" CHECK (("_timescaledb_functions"."get_partition_hash"("site_code") >= 1879048185)),
    CONSTRAINT "constraint_97" CHECK ((("statistical_start_time" >= '2025-09-11 00:00:00'::timestamp without time zone) AND ("statistical_start_time" < '2025-09-18 00:00:00'::timestamp without time zone)))
)
INHERITS ("public"."fault_performance_data");


--
-- Name: _hyper_5_99_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: -
--

CREATE TABLE "_timescaledb_internal"."_hyper_5_99_chunk" (
    CONSTRAINT "constraint_95" CHECK ((("statistical_start_time" >= '2025-09-04 00:00:00'::timestamp without time zone) AND ("statistical_start_time" < '2025-09-11 00:00:00'::timestamp without time zone))),
    CONSTRAINT "constraint_98" CHECK ((("_timescaledb_functions"."get_partition_hash"("site_code") >= 1073741820) AND ("_timescaledb_functions"."get_partition_hash"("site_code") < 1342177275)))
)
INHERITS ("public"."fault_performance_data");


--
-- Name: _partial_view_22; Type: VIEW; Schema: _timescaledb_internal; Owner: -
--

CREATE VIEW "_timescaledb_internal"."_partial_view_22" AS
 SELECT "public"."time_bucket"('01:00:00'::interval, "statistical_start_time") AS "hour_bucket",
    "site_code",
    "equipment_name",
    "performance_data" AS "metric_key",
    "avg"("value") AS "avg_value",
    "min"("value") AS "min_value",
    "max"("value") AS "max_value",
    "count"(*) AS "count_records",
    "stddev"("value") AS "stddev_value"
   FROM "public"."performance_data"
  GROUP BY ("public"."time_bucket"('01:00:00'::interval, "statistical_start_time")), "site_code", "equipment_name", "performance_data";


--
-- Name: _partial_view_23; Type: VIEW; Schema: _timescaledb_internal; Owner: -
--

CREATE VIEW "_timescaledb_internal"."_partial_view_23" AS
 SELECT "public"."time_bucket"('1 day'::interval, "hour_bucket") AS "day_bucket",
    "site_code",
    "equipment_name",
    "metric_key",
    "avg"("avg_value") AS "avg_value",
    "min"("min_value") AS "min_value",
    "max"("max_value") AS "max_value",
    "sum"("count_records") AS "total_records",
    "avg"("stddev_value") AS "avg_stddev"
   FROM "public"."cagg_perf_5m_to_1h"
  GROUP BY ("public"."time_bucket"('1 day'::interval, "hour_bucket")), "site_code", "equipment_name", "metric_key";


--
-- Name: _partial_view_24; Type: VIEW; Schema: _timescaledb_internal; Owner: -
--

CREATE VIEW "_timescaledb_internal"."_partial_view_24" AS
 SELECT "public"."time_bucket"('01:00:00'::interval, "statistical_start_time") AS "hour_bucket",
    "site_code",
    "equipment_name",
    "performance_data" AS "metric_key",
    "count"(*) AS "fault_count",
    "count"(DISTINCT "equipment_name") AS "affected_equipment_count"
   FROM "public"."fault_performance_data"
  GROUP BY ("public"."time_bucket"('01:00:00'::interval, "statistical_start_time")), "site_code", "equipment_name", "performance_data";


--
-- Name: _partial_view_25; Type: VIEW; Schema: _timescaledb_internal; Owner: -
--

CREATE VIEW "_timescaledb_internal"."_partial_view_25" AS
 SELECT "public"."time_bucket"('1 day'::interval, "hour_bucket") AS "day_bucket",
    "site_code",
    "equipment_name",
    "metric_key",
    "sum"("fault_count") AS "total_fault_count",
    "max"("affected_equipment_count") AS "max_affected_equipment"
   FROM "public"."cagg_fault_hourly"
  GROUP BY ("public"."time_bucket"('1 day'::interval, "hour_bucket")), "site_code", "equipment_name", "metric_key";


--
-- Name: cagg_fault_daily; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."cagg_fault_daily" AS
 SELECT "day_bucket",
    "site_code",
    "equipment_name",
    "metric_key",
    "total_fault_count",
    "max_affected_equipment"
   FROM "_timescaledb_internal"."_materialized_hypertable_25";


--
-- Name: cagg_perf_1h_to_1d; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."cagg_perf_1h_to_1d" AS
 SELECT "day_bucket",
    "site_code",
    "equipment_name",
    "metric_key",
    "avg_value",
    "min_value",
    "max_value",
    "total_records",
    "avg_stddev"
   FROM "_timescaledb_internal"."_materialized_hypertable_23";


--
-- Name: data_centers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."data_centers" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "location" character varying(255),
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "site_code" character varying(10),
    "ip_address" "inet",
    "is_active" boolean DEFAULT true
);


--
-- Name: data_centers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."data_centers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_centers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."data_centers_id_seq" OWNED BY "public"."data_centers"."id";


--
-- Name: data_import_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."data_import_logs" (
    "id" integer NOT NULL,
    "session_id" character varying(36),
    "data_center_id" integer,
    "site_code" character varying(10) NOT NULL,
    "csv_filename" character varying(255) NOT NULL,
    "file_path" "text" NOT NULL,
    "start_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "end_time" timestamp with time zone,
    "duration_seconds" integer,
    "status" character varying(20) DEFAULT 'RUNNING'::character varying NOT NULL,
    "total_records" integer DEFAULT 0,
    "imported_records" integer DEFAULT 0,
    "skipped_records" integer DEFAULT 0,
    "duplicate_records" integer DEFAULT 0,
    "error_records" integer DEFAULT 0,
    "error_message" "text",
    "statistical_period" character varying(50),
    "data_date_range_start" timestamp with time zone,
    "data_date_range_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_import_logs_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['RUNNING'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying])::"text"[])))
);


--
-- Name: TABLE "data_import_logs"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."data_import_logs" IS 'CSV import tracking with statistics and error handling';


--
-- Name: data_import_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."data_import_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_import_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."data_import_logs_id_seq" OWNED BY "public"."data_import_logs"."id";


--
-- Name: device_display_override; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."device_display_override" (
    "site_code" "text" NOT NULL,
    "equipment_id" "text" NOT NULL,
    "display_name_th" "text",
    "display_name_en" "text",
    "display_group" "text",
    "is_hidden" boolean DEFAULT false,
    "sort_index" integer DEFAULT 0,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: enhanced_export_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."enhanced_export_actions" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "action_type" character varying(50) NOT NULL,
    "action_description" "text",
    "target_url" character varying(500),
    "additional_data" "jsonb",
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "duration_ms" integer,
    "success" boolean DEFAULT true,
    "error_message" "text"
);


--
-- Name: TABLE "enhanced_export_actions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."enhanced_export_actions" IS 'Action-level logging for detailed debugging and analysis';


--
-- Name: enhanced_export_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."enhanced_export_actions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: enhanced_export_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."enhanced_export_actions_id_seq" OWNED BY "public"."enhanced_export_actions"."id";


--
-- Name: enhanced_export_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."enhanced_export_sessions" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "data_center_id" integer,
    "site_code" character varying(10) NOT NULL,
    "source_ip" "inet",
    "start_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "end_time" timestamp with time zone,
    "duration_seconds" integer,
    "status" character varying(20) DEFAULT 'RUNNING'::character varying NOT NULL,
    "exported_filename" character varying(255),
    "file_size_bytes" bigint,
    "file_checksum" character varying(64),
    "error_message" "text",
    "source_url" character varying(255),
    "username" character varying(50),
    "user_agent" character varying(255),
    "client_ip_address" "inet",
    "total_steps" integer DEFAULT 6,
    "completed_steps" integer DEFAULT 0,
    "pipeline_version" character varying(20) DEFAULT '1.0'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "export_type" character varying(50) DEFAULT 'full'::character varying,
    CONSTRAINT "enhanced_export_sessions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['RUNNING'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying])::"text"[])))
);


--
-- Name: TABLE "enhanced_export_sessions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."enhanced_export_sessions" IS 'Enhanced export sessions with multi-site support and detailed tracking';


--
-- Name: enhanced_export_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."enhanced_export_sessions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: enhanced_export_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."enhanced_export_sessions_id_seq" OWNED BY "public"."enhanced_export_sessions"."id";


--
-- Name: enhanced_export_step_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."enhanced_export_step_logs" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "step_number" integer NOT NULL,
    "step_name" character varying(100) NOT NULL,
    "step_description" "text",
    "start_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "end_time" timestamp with time zone,
    "duration_ms" integer,
    "status" character varying(20) DEFAULT 'RUNNING'::character varying NOT NULL,
    "error_message" "text",
    "additional_data" "jsonb",
    "memory_usage_mb" numeric(10,2),
    "cpu_usage_percent" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "description" "text",
    CONSTRAINT "enhanced_export_step_logs_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['RUNNING'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying, 'SKIPPED'::character varying])::"text"[])))
);


--
-- Name: TABLE "enhanced_export_step_logs"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."enhanced_export_step_logs" IS 'Detailed step-by-step logging with performance metrics';


--
-- Name: enhanced_export_step_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."enhanced_export_step_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: enhanced_export_step_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."enhanced_export_step_logs_id_seq" OWNED BY "public"."enhanced_export_step_logs"."id";


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."equipment" (
    "id" integer NOT NULL,
    "data_center_id" integer,
    "equipment_name" character varying(255) NOT NULL,
    "equipment_id" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "site_code" character varying(10)
);


--
-- Name: equipment_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."equipment_aliases" (
    "id" integer NOT NULL,
    "site_code" character varying(10) NOT NULL,
    "equipment_id" character varying(255),
    "original_name" character varying(255) NOT NULL,
    "alias_name" character varying(255) NOT NULL,
    "scope" "text" DEFAULT 'device'::"text" NOT NULL,
    "updated_by" character varying(100),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "equipment_aliases_scope_check" CHECK (("scope" = ANY (ARRAY['device'::"text", 'site'::"text", 'global'::"text"])))
);


--
-- Name: equipment_aliases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."equipment_aliases_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_aliases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."equipment_aliases_id_seq" OWNED BY "public"."equipment_aliases"."id";


--
-- Name: equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."equipment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."equipment_id_seq" OWNED BY "public"."equipment"."id";


--
-- Name: equipment_name_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."equipment_name_overrides" (
    "id" bigint NOT NULL,
    "site_code" "text" NOT NULL,
    "equipment_id" "text" NOT NULL,
    "original_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: equipment_name_overrides_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."equipment_name_overrides_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_name_overrides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."equipment_name_overrides_id_seq" OWNED BY "public"."equipment_name_overrides"."id";


--
-- Name: export_downloads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."export_downloads" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "filename" character varying(255) NOT NULL,
    "file_path" character varying(500),
    "file_size_bytes" bigint,
    "file_type" character varying(20),
    "download_start" timestamp with time zone,
    "download_end" timestamp with time zone,
    "download_duration_seconds" integer,
    "checksum" character varying(64),
    "status" character varying(20) DEFAULT 'STARTED'::character varying,
    CONSTRAINT "export_downloads_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['STARTED'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying])::"text"[])))
);


--
-- Name: TABLE "export_downloads"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."export_downloads" IS 'Track file download progress and status';


--
-- Name: export_downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."export_downloads_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: export_downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."export_downloads_id_seq" OWNED BY "public"."export_downloads"."id";


--
-- Name: export_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."export_interactions" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "interaction_type" character varying(50),
    "element_selector" character varying(500),
    "element_text" "text",
    "input_value" "text",
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "success" boolean DEFAULT true,
    "error_message" "text",
    "retry_count" integer DEFAULT 0
);


--
-- Name: TABLE "export_interactions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."export_interactions" IS 'Log every browser interaction (clicks, inputs, etc.)';


--
-- Name: export_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."export_interactions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: export_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."export_interactions_id_seq" OWNED BY "public"."export_interactions"."id";


--
-- Name: export_page_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."export_page_visits" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "page_url" character varying(500),
    "page_title" character varying(255),
    "frame_name" character varying(100),
    "action_type" character varying(50),
    "action_description" "text",
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "screenshot_path" character varying(255),
    "page_source_size" integer,
    "load_time_ms" integer
);


--
-- Name: TABLE "export_page_visits"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."export_page_visits" IS 'Track every page navigation and URL visited during export';


--
-- Name: export_page_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."export_page_visits_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: export_page_visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."export_page_visits_id_seq" OWNED BY "public"."export_page_visits"."id";


--
-- Name: export_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."export_performance" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "metric_name" character varying(50),
    "metric_value" numeric(10,2),
    "metric_unit" character varying(20),
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "additional_info" "text"
);


--
-- Name: TABLE "export_performance"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."export_performance" IS 'System and browser performance metrics';


--
-- Name: export_performance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."export_performance_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: export_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."export_performance_id_seq" OWNED BY "public"."export_performance"."id";


--
-- Name: export_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."export_sessions" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "start_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "end_time" timestamp with time zone,
    "duration_seconds" integer,
    "status" character varying(20) DEFAULT 'RUNNING'::character varying NOT NULL,
    "exported_filename" character varying(255),
    "file_size_bytes" bigint,
    "error_message" "text",
    "source_url" character varying(255) DEFAULT 'https://10.251.4.253'::character varying,
    "username" character varying(50) DEFAULT 'admin'::character varying,
    "user_agent" character varying(255),
    "ip_address" "inet",
    "total_steps" integer DEFAULT 6,
    "completed_steps" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "export_sessions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['RUNNING'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying])::"text"[])))
);


--
-- Name: TABLE "export_sessions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."export_sessions" IS 'Main export session tracking table';


--
-- Name: export_step_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."export_step_logs" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "step_number" integer NOT NULL,
    "step_name" character varying(100) NOT NULL,
    "step_description" "text",
    "start_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "end_time" timestamp with time zone,
    "duration_ms" integer,
    "status" character varying(20) DEFAULT 'RUNNING'::character varying NOT NULL,
    "error_message" "text",
    "additional_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "export_step_logs_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['RUNNING'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying, 'SKIPPED'::character varying])::"text"[])))
);


--
-- Name: TABLE "export_step_logs"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."export_step_logs" IS 'Detailed step-by-step logging for each export session';


--
-- Name: export_session_overview; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."export_session_overview" AS
 SELECT "s"."id",
    "s"."session_id",
    "s"."start_time",
    "s"."end_time",
    "s"."duration_seconds",
    "s"."status",
    "s"."exported_filename",
    "s"."file_size_bytes",
    "s"."completed_steps",
    "s"."total_steps",
    COALESCE("step_count"."total_steps_logged", (0)::bigint) AS "steps_logged",
    COALESCE("page_count"."total_pages_visited", (0)::bigint) AS "pages_visited",
    COALESCE("interaction_count"."total_interactions", (0)::bigint) AS "total_interactions",
    COALESCE("download_count"."total_downloads", (0)::bigint) AS "total_downloads"
   FROM (((("public"."export_sessions" "s"
     LEFT JOIN ( SELECT "export_step_logs"."session_id",
            "count"(*) AS "total_steps_logged"
           FROM "public"."export_step_logs"
          GROUP BY "export_step_logs"."session_id") "step_count" ON ((("s"."session_id")::"text" = ("step_count"."session_id")::"text")))
     LEFT JOIN ( SELECT "export_page_visits"."session_id",
            "count"(*) AS "total_pages_visited"
           FROM "public"."export_page_visits"
          GROUP BY "export_page_visits"."session_id") "page_count" ON ((("s"."session_id")::"text" = ("page_count"."session_id")::"text")))
     LEFT JOIN ( SELECT "export_interactions"."session_id",
            "count"(*) AS "total_interactions"
           FROM "public"."export_interactions"
          GROUP BY "export_interactions"."session_id") "interaction_count" ON ((("s"."session_id")::"text" = ("interaction_count"."session_id")::"text")))
     LEFT JOIN ( SELECT "export_downloads"."session_id",
            "count"(*) AS "total_downloads"
           FROM "public"."export_downloads"
          GROUP BY "export_downloads"."session_id") "download_count" ON ((("s"."session_id")::"text" = ("download_count"."session_id")::"text")))
  ORDER BY "s"."start_time" DESC;


--
-- Name: export_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."export_sessions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: export_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."export_sessions_id_seq" OWNED BY "public"."export_sessions"."id";


--
-- Name: export_step_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."export_step_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: export_step_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."export_step_logs_id_seq" OWNED BY "public"."export_step_logs"."id";


--
-- Name: export_web_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."export_web_log" (
    "id" integer NOT NULL,
    "export_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "duration_seconds" integer,
    "status" character varying(20) NOT NULL,
    "exported_filename" character varying(255),
    "file_size_bytes" bigint,
    "error_message" "text",
    "export_method" character varying(50) DEFAULT 'web_automation'::character varying,
    "source_url" character varying(255) DEFAULT 'https://10.251.4.253'::character varying,
    "username" character varying(50) DEFAULT 'admin'::character varying,
    "user_agent" character varying(255),
    "ip_address" "inet",
    "session_id" character varying(100),
    "steps_completed" integer DEFAULT 0,
    "total_steps" integer DEFAULT 6,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "export_web_log_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['SUCCESS'::character varying, 'FAILED'::character varying, 'RUNNING'::character varying])::"text"[])))
);


--
-- Name: TABLE "export_web_log"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."export_web_log" IS 'Log table for ECC800 web export operations';


--
-- Name: COLUMN "export_web_log"."export_date"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."export_web_log"."export_date" IS 'Date when export was initiated';


--
-- Name: COLUMN "export_web_log"."duration_seconds"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."export_web_log"."duration_seconds" IS 'Total time taken for export in seconds';


--
-- Name: COLUMN "export_web_log"."exported_filename"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."export_web_log"."exported_filename" IS 'Name of the downloaded .tgz file';


--
-- Name: COLUMN "export_web_log"."file_size_bytes"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."export_web_log"."file_size_bytes" IS 'Size of downloaded file in bytes';


--
-- Name: COLUMN "export_web_log"."steps_completed"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."export_web_log"."steps_completed" IS 'Number of export steps completed (max 6)';


--
-- Name: export_web_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."export_web_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: export_web_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."export_web_log_id_seq" OWNED BY "public"."export_web_log"."id";


--
-- Name: fault_data_import_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."fault_data_import_logs" (
    "id" integer NOT NULL,
    "site_code" character varying(10) DEFAULT 'dc'::character varying NOT NULL,
    "import_session_id" character varying(100) NOT NULL,
    "source_file" character varying(255) NOT NULL,
    "file_type" character varying(50) NOT NULL,
    "file_size" bigint,
    "file_hash" character varying(64),
    "records_processed" integer DEFAULT 0,
    "records_inserted" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "records_skipped" integer DEFAULT 0,
    "processing_start_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "processing_end_time" timestamp with time zone,
    "status" character varying(20) DEFAULT 'processing'::character varying,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE "fault_data_import_logs"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."fault_data_import_logs" IS 'Import log tracking for fault info performance data';


--
-- Name: fault_data_import_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."fault_data_import_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fault_data_import_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."fault_data_import_logs_id_seq" OWNED BY "public"."fault_data_import_logs"."id";


--
-- Name: fault_equipment_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."fault_equipment_master" (
    "id" integer NOT NULL,
    "equipment_name" character varying(255) NOT NULL,
    "equipment_id" character varying(50) NOT NULL,
    "equipment_type" character varying(100),
    "site_code" character varying(10) DEFAULT 'dc'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE "fault_equipment_master"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."fault_equipment_master" IS 'Master list of equipment from fault info exports';


--
-- Name: fault_equipment_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."fault_equipment_master_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fault_equipment_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."fault_equipment_master_id_seq" OWNED BY "public"."fault_equipment_master"."id";


--
-- Name: fault_performance_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."fault_performance_data_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fault_performance_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."fault_performance_data_id_seq" OWNED BY "public"."fault_performance_data"."id";


--
-- Name: metric_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."metric_aliases" (
    "id" integer NOT NULL,
    "site_code" character varying(10),
    "metric_key" character varying(255) NOT NULL,
    "original_name" character varying(255) NOT NULL,
    "alias_name" character varying(255) NOT NULL,
    "scope" "text" DEFAULT 'global'::"text" NOT NULL,
    "updated_by" character varying(100),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "metric_aliases_scope_check" CHECK (("scope" = ANY (ARRAY['device'::"text", 'site'::"text", 'global'::"text"])))
);


--
-- Name: metric_aliases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."metric_aliases_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metric_aliases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."metric_aliases_id_seq" OWNED BY "public"."metric_aliases"."id";


--
-- Name: metric_display_override_device; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."metric_display_override_device" (
    "site_code" "text" NOT NULL,
    "equipment_id" "text" NOT NULL,
    "metric_name" "text" NOT NULL,
    "display_name_th" "text",
    "display_name_en" "text",
    "unit_canonical" "text",
    "category" "text",
    "decimals" integer DEFAULT 2,
    "is_hidden" boolean DEFAULT false,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: metric_display_override_site; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."metric_display_override_site" (
    "site_code" "text" NOT NULL,
    "metric_name" "text" NOT NULL,
    "display_name_th" "text",
    "display_name_en" "text",
    "unit_canonical" "text",
    "category" "text",
    "decimals" integer DEFAULT 2,
    "is_hidden" boolean DEFAULT false,
    "updated_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: performance_data_old; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."performance_data_old" (
    "id" bigint NOT NULL,
    "time" timestamp with time zone NOT NULL,
    "equipment_id" integer,
    "metric_id" integer,
    "value" numeric NOT NULL,
    "statistical_period" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "site_code" character varying(10),
    "import_session_id" character varying(36),
    "unit" character varying(20)
)
PARTITION BY RANGE ("time");


--
-- Name: performance_data_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."performance_data_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: performance_data_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."performance_data_id_seq1" OWNED BY "public"."performance_data_old"."id";


--
-- Name: performance_data_2025_08; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."performance_data_2025_08" (
    "id" bigint DEFAULT "nextval"('"public"."performance_data_id_seq1"'::"regclass") NOT NULL,
    "time" timestamp with time zone NOT NULL,
    "equipment_id" integer,
    "metric_id" integer,
    "value" numeric NOT NULL,
    "statistical_period" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "site_code" character varying(10),
    "import_session_id" character varying(36),
    "unit" character varying(20)
);


--
-- Name: performance_data_2025_09; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."performance_data_2025_09" (
    "id" bigint DEFAULT "nextval"('"public"."performance_data_id_seq1"'::"regclass") NOT NULL,
    "time" timestamp with time zone NOT NULL,
    "equipment_id" integer,
    "metric_id" integer,
    "value" numeric NOT NULL,
    "statistical_period" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "site_code" character varying(10),
    "import_session_id" character varying(36),
    "unit" character varying(20)
);


--
-- Name: performance_data_2025_10; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."performance_data_2025_10" (
    "id" bigint DEFAULT "nextval"('"public"."performance_data_id_seq1"'::"regclass") NOT NULL,
    "time" timestamp with time zone NOT NULL,
    "equipment_id" integer,
    "metric_id" integer,
    "value" numeric NOT NULL,
    "statistical_period" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "site_code" character varying(10),
    "import_session_id" character varying(36),
    "unit" character varying(20)
);


--
-- Name: performance_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."performance_data_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: performance_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."performance_data_id_seq" OWNED BY "public"."performance_data"."id";


--
-- Name: performance_data_import_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."performance_data_import_logs" (
    "id" integer NOT NULL,
    "site_code" character varying(10) DEFAULT 'dc'::character varying NOT NULL,
    "import_session_id" character varying(100) NOT NULL,
    "source_file" character varying(255) NOT NULL,
    "file_type" character varying(50) NOT NULL,
    "file_size" bigint,
    "file_hash" character varying(64),
    "records_processed" integer DEFAULT 0,
    "records_inserted" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "records_skipped" integer DEFAULT 0,
    "processing_start_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "processing_end_time" timestamp with time zone,
    "status" character varying(20) DEFAULT 'processing'::character varying,
    "processing_duration" integer,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE "performance_data_import_logs"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."performance_data_import_logs" IS 'Import log tracking with Thai language support';


--
-- Name: performance_data_import_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."performance_data_import_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: performance_data_import_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."performance_data_import_logs_id_seq" OWNED BY "public"."performance_data_import_logs"."id";


--
-- Name: performance_equipment_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."performance_equipment_master" (
    "id" integer NOT NULL,
    "equipment_name" character varying(255) NOT NULL,
    "equipment_id" character varying(50) NOT NULL,
    "equipment_type" character varying(100),
    "site_code" character varying(10) DEFAULT 'dc'::character varying NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "external_id" character varying(100)
);


--
-- Name: TABLE "performance_equipment_master"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."performance_equipment_master" IS 'Master list of equipment for performance data';


--
-- Name: COLUMN "performance_equipment_master"."external_id"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."performance_equipment_master"."external_id" IS 'Original equipment_id from CSV file (NULL for generated IDs)';


--
-- Name: performance_equipment_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."performance_equipment_master_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: performance_equipment_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."performance_equipment_master_id_seq" OWNED BY "public"."performance_equipment_master"."id";


--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."performance_metrics" (
    "id" integer NOT NULL,
    "metric_name" character varying(255) NOT NULL,
    "description" "text",
    "unit" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: performance_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."performance_metrics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: performance_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."performance_metrics_id_seq" OWNED BY "public"."performance_metrics"."id";


--
-- Name: pipeline_performance_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."pipeline_performance_stats" (
    "id" integer NOT NULL,
    "session_id" character varying(36) NOT NULL,
    "data_center_id" integer,
    "site_code" character varying(10) NOT NULL,
    "total_export_duration_seconds" integer,
    "total_processing_duration_seconds" integer,
    "total_import_duration_seconds" integer,
    "total_pipeline_duration_seconds" integer,
    "exported_file_size_bytes" bigint,
    "total_csv_files_processed" integer,
    "total_records_imported" integer,
    "total_records_skipped" integer,
    "success_rate_percent" numeric(5,2),
    "peak_memory_usage_mb" numeric(10,2),
    "average_cpu_usage_percent" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE "pipeline_performance_stats"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."pipeline_performance_stats" IS 'Performance statistics for pipeline optimization';


--
-- Name: pipeline_performance_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."pipeline_performance_stats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pipeline_performance_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."pipeline_performance_stats_id_seq" OWNED BY "public"."pipeline_performance_stats"."id";


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."users" (
    "id" integer NOT NULL,
    "username" character varying(50) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "full_name" character varying(100),
    "role" character varying(20) DEFAULT 'viewer'::character varying NOT NULL,
    "site_access" "text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" character varying(255),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";


--
-- Name: v_datacenter_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_datacenter_stats" AS
 SELECT "dc"."id" AS "data_center_id",
    "dc"."name" AS "data_center_name",
    "count"(DISTINCT "e"."id") AS "total_equipment",
    "count"("pd"."id") AS "total_measurements",
    "min"("pd"."time") AS "earliest_data",
    "max"("pd"."time") AS "latest_data"
   FROM (("public"."data_centers" "dc"
     LEFT JOIN "public"."equipment" "e" ON (("dc"."id" = "e"."data_center_id")))
     LEFT JOIN "public"."performance_data_old" "pd" ON (("e"."id" = "pd"."equipment_id")))
  GROUP BY "dc"."id", "dc"."name"
  ORDER BY "dc"."name";


--
-- Name: v_devices_by_site; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_devices_by_site" AS
 SELECT DISTINCT "pd"."site_code",
    "pd"."equipment_id" AS "device_code",
    "pd"."equipment_name",
    COALESCE("ddo"."display_name_th", ("pd"."equipment_name")::"text") AS "equipment_name_th",
    COALESCE("ddo"."display_name_en", ("pd"."equipment_name")::"text") AS "equipment_name_en",
    COALESCE("ddo"."display_group", 'General'::"text") AS "display_group",
    COALESCE("ddo"."is_hidden", false) AS "is_hidden",
    COALESCE("ddo"."sort_index", 0) AS "sort_index",
    "count"(DISTINCT "pd"."performance_data") AS "metric_count",
    "max"("pd"."time") AS "last_update"
   FROM ("public"."performance_data" "pd"
     LEFT JOIN "public"."device_display_override" "ddo" ON ((("ddo"."site_code" = ("pd"."site_code")::"text") AND ("ddo"."equipment_id" = ("pd"."equipment_id")::"text"))))
  WHERE (COALESCE("ddo"."is_hidden", false) = false)
  GROUP BY "pd"."site_code", "pd"."equipment_id", "pd"."equipment_name", COALESCE("ddo"."display_name_th", ("pd"."equipment_name")::"text"), COALESCE("ddo"."display_name_en", ("pd"."equipment_name")::"text"), COALESCE("ddo"."display_group", 'General'::"text"), COALESCE("ddo"."is_hidden", false), COALESCE("ddo"."sort_index", 0)
  ORDER BY "pd"."site_code", COALESCE("ddo"."sort_index", 0), "pd"."equipment_name";


--
-- Name: v_equipment_classification; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_equipment_classification" AS
 SELECT "id",
    "equipment_name",
    "equipment_id",
    "equipment_type",
    "site_code",
    "description",
    "created_at",
    "updated_at",
        CASE
            WHEN ((("equipment_name")::"text" ~~ '%System%'::"text") OR (("equipment_name")::"text" ~~ '%ECC800%'::"text")) THEN 'System'::"text"
            WHEN ((("equipment_name")::"text" ~~ '%Cooling%'::"text") OR (("equipment_name")::"text" ~~ '%NetCol%'::"text")) THEN 'Cooling'::"text"
            WHEN ((("equipment_name")::"text" ~~ '%Power%'::"text") OR (("equipment_name")::"text" ~~ '%UPS%'::"text")) THEN 'Power'::"text"
            WHEN ((("equipment_name")::"text" ~~ '%Cabinet%'::"text") OR (("equipment_name")::"text" ~~ '%IT Cabinet%'::"text")) THEN 'Cabinet'::"text"
            WHEN ((("equipment_name")::"text" ~~ '%Sensor%'::"text") OR (("equipment_name")::"text" ~~ '%T/H%'::"text") OR (("equipment_name")::"text" ~~ '%Multi-Func%'::"text")) THEN 'Sensor'::"text"
            WHEN (("equipment_name")::"text" ~~ '%Net Cabinet%'::"text") THEN 'Network'::"text"
            ELSE 'Other'::"text"
        END AS "auto_equipment_type"
   FROM "public"."performance_equipment_master" "pem";


--
-- Name: v_equipment_display_names; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_equipment_display_names" AS
 SELECT DISTINCT "p"."site_code",
    "p"."equipment_id",
    "p"."equipment_name" AS "original_name",
    COALESCE("o"."display_name", ("p"."equipment_name")::"text") AS "display_name"
   FROM ("public"."performance_data" "p"
     LEFT JOIN "public"."equipment_name_overrides" "o" ON (((("p"."site_code")::"text" = "o"."site_code") AND (("p"."equipment_id")::"text" = "o"."equipment_id"))));


--
-- Name: v_equipment_resolved; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_equipment_resolved" AS
 WITH "equipment_base" AS (
         SELECT DISTINCT "performance_data"."site_code",
            "performance_data"."equipment_name" AS "original_name",
            "performance_data"."equipment_name" AS "equipment_id"
           FROM "public"."performance_data"
        UNION
         SELECT DISTINCT "fault_performance_data"."site_code",
            "fault_performance_data"."equipment_name" AS "original_name",
            "fault_performance_data"."equipment_name" AS "equipment_id"
           FROM "public"."fault_performance_data"
        ), "equipment_with_alias" AS (
         SELECT "eb"."site_code",
            "eb"."original_name",
            "eb"."equipment_id",
            COALESCE("ea"."alias_name", "eb"."original_name") AS "display_name",
            "ea"."alias_name",
            "ea"."scope" AS "alias_scope",
            "ea"."updated_by" AS "alias_updated_by",
            "ea"."updated_at" AS "alias_updated_at"
           FROM ("equipment_base" "eb"
             LEFT JOIN "public"."equipment_aliases" "ea" ON (((("eb"."site_code")::"text" = ("ea"."site_code")::"text") AND (("eb"."equipment_id")::"text" = ("ea"."equipment_id")::"text") AND ("ea"."scope" = ANY (ARRAY['device'::"text", 'site'::"text", 'global'::"text"])))))
        )
 SELECT "site_code",
    "equipment_id",
    "original_name",
    "display_name",
    "alias_name",
    "alias_scope",
    "alias_updated_by",
    "alias_updated_at",
        CASE
            WHEN ("alias_name" IS NOT NULL) THEN true
            ELSE false
        END AS "has_alias"
   FROM "equipment_with_alias";


--
-- Name: VIEW "v_equipment_resolved"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW "public"."v_equipment_resolved" IS 'Equipment names with alias resolution (preferred alias, fallback to original)';


--
-- Name: v_metric_resolved; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_metric_resolved" AS
 WITH "metric_base" AS (
         SELECT DISTINCT "performance_data"."site_code",
            "performance_data"."performance_data" AS "metric_key",
            "performance_data"."performance_data" AS "original_name"
           FROM "public"."performance_data"
        UNION
         SELECT DISTINCT "fault_performance_data"."site_code",
            "fault_performance_data"."performance_data" AS "metric_key",
            "fault_performance_data"."performance_data" AS "original_name"
           FROM "public"."fault_performance_data"
        ), "metric_with_alias" AS (
         SELECT "mb"."site_code",
            "mb"."metric_key",
            "mb"."original_name",
            COALESCE("ma"."alias_name", "mb"."original_name") AS "display_name",
            "ma"."alias_name",
            "ma"."scope" AS "alias_scope",
            "ma"."updated_by" AS "alias_updated_by",
            "ma"."updated_at" AS "alias_updated_at"
           FROM ("metric_base" "mb"
             LEFT JOIN "public"."metric_aliases" "ma" ON (((("mb"."site_code")::"text" = ("ma"."site_code")::"text") AND (("mb"."metric_key")::"text" = ("ma"."metric_key")::"text") AND ("ma"."scope" = ANY (ARRAY['device'::"text", 'site'::"text", 'global'::"text"])))))
        )
 SELECT "site_code",
    "metric_key",
    "original_name",
    "display_name",
    "alias_name",
    "alias_scope",
    "alias_updated_by",
    "alias_updated_at",
        CASE
            WHEN ("alias_name" IS NOT NULL) THEN true
            ELSE false
        END AS "has_alias"
   FROM "metric_with_alias";


--
-- Name: VIEW "v_metric_resolved"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW "public"."v_metric_resolved" IS 'Metric names with alias resolution (preferred alias, fallback to original)';


--
-- Name: v_equipment_latest_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_equipment_latest_status" AS
 WITH "latest_data" AS (
         SELECT "performance_data"."site_code",
            "performance_data"."equipment_name",
            "performance_data"."performance_data" AS "metric_key",
            "performance_data"."value",
            "performance_data"."statistical_start_time",
            "row_number"() OVER (PARTITION BY "performance_data"."site_code", "performance_data"."equipment_name", "performance_data"."performance_data" ORDER BY "performance_data"."statistical_start_time" DESC) AS "rn"
           FROM "public"."performance_data"
          WHERE ("performance_data"."statistical_start_time" >= ("now"() - '24:00:00'::interval))
        )
 SELECT "ld"."site_code",
    "ld"."equipment_name",
    "er"."display_name" AS "equipment_display_name",
    "ld"."metric_key",
    "mr"."display_name" AS "metric_display_name",
    "ld"."value" AS "latest_value",
    "ld"."statistical_start_time" AS "latest_timestamp",
        CASE
            WHEN ("ld"."statistical_start_time" >= ("now"() - '01:00:00'::interval)) THEN 'online'::"text"
            WHEN ("ld"."statistical_start_time" >= ("now"() - '06:00:00'::interval)) THEN 'warning'::"text"
            ELSE 'offline'::"text"
        END AS "status"
   FROM (("latest_data" "ld"
     LEFT JOIN "public"."v_equipment_resolved" "er" ON (((("ld"."site_code")::"text" = ("er"."site_code")::"text") AND (("ld"."equipment_name")::"text" = ("er"."equipment_id")::"text"))))
     LEFT JOIN "public"."v_metric_resolved" "mr" ON (((("ld"."site_code")::"text" = ("mr"."site_code")::"text") AND (("ld"."metric_key")::"text" = ("mr"."metric_key")::"text"))))
  WHERE ("ld"."rn" = 1);


--
-- Name: VIEW "v_equipment_latest_status"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW "public"."v_equipment_latest_status" IS 'Latest status and values for all equipment and metrics';


--
-- Name: v_equipment_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_equipment_summary" AS
 SELECT "site_code",
    "count"(DISTINCT "equipment_name") AS "total_equipment",
    "count"(DISTINCT
        CASE
            WHEN ("status" = 'online'::"text") THEN "equipment_name"
            ELSE NULL::character varying
        END) AS "online_equipment",
    "count"(DISTINCT
        CASE
            WHEN ("status" = 'warning'::"text") THEN "equipment_name"
            ELSE NULL::character varying
        END) AS "warning_equipment",
    "count"(DISTINCT
        CASE
            WHEN ("status" = 'offline'::"text") THEN "equipment_name"
            ELSE NULL::character varying
        END) AS "offline_equipment",
    "count"(DISTINCT "metric_key") AS "total_metrics",
    "max"("latest_timestamp") AS "latest_data_time",
    "min"("latest_timestamp") AS "oldest_data_time"
   FROM "public"."v_equipment_latest_status"
  GROUP BY "site_code";


--
-- Name: VIEW "v_equipment_summary"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW "public"."v_equipment_summary" IS 'Summary statistics for equipment status by site';


--
-- Name: v_export_session_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_export_session_summary" AS
 SELECT "es"."session_id",
    "dc"."name" AS "data_center_name",
    "es"."site_code",
    "es"."source_ip",
    "es"."start_time",
    "es"."end_time",
    "es"."duration_seconds",
    "es"."status",
    "es"."exported_filename",
    "es"."file_size_bytes",
    "es"."completed_steps",
    "es"."total_steps",
    "round"(((("es"."completed_steps")::numeric / ("es"."total_steps")::numeric) * (100)::numeric), 2) AS "completion_percentage"
   FROM ("public"."enhanced_export_sessions" "es"
     LEFT JOIN "public"."data_centers" "dc" ON (("es"."data_center_id" = "dc"."id")))
  ORDER BY "es"."start_time" DESC;


--
-- Name: v_fault_import_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_fault_import_statistics" AS
 SELECT "site_code",
    "file_type",
    "count"(*) AS "total_imports",
    "sum"("records_processed") AS "total_records_processed",
    "sum"("records_inserted") AS "total_records_inserted",
    "sum"("records_skipped") AS "total_records_skipped",
    "min"("processing_start_time") AS "first_import",
    "max"("processing_end_time") AS "last_import"
   FROM "public"."fault_data_import_logs"
  WHERE (("status")::"text" = 'completed'::"text")
  GROUP BY "site_code", "file_type"
  ORDER BY "site_code", "file_type";


--
-- Name: v_fault_performance_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_fault_performance_summary" AS
 SELECT "site_code",
    "equipment_name",
    "equipment_id",
    "performance_data",
    "statistical_period",
    "count"(*) AS "record_count",
    "min"("statistical_start_time") AS "earliest_data",
    "max"("statistical_start_time") AS "latest_data",
    "max"("import_timestamp") AS "last_imported"
   FROM "public"."fault_performance_data"
  GROUP BY "site_code", "equipment_name", "equipment_id", "performance_data", "statistical_period"
  ORDER BY "site_code", "equipment_name", "performance_data";


--
-- Name: v_import_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_import_statistics" AS
 SELECT "site_code",
    "csv_filename",
    "count"(*) AS "import_attempts",
    "sum"("imported_records") AS "total_imported",
    "sum"("skipped_records") AS "total_skipped",
    "sum"("duplicate_records") AS "total_duplicates",
    "sum"("error_records") AS "total_errors",
    "avg"("duration_seconds") AS "avg_duration_seconds",
    "max"("end_time") AS "last_import_time"
   FROM "public"."data_import_logs" "dil"
  WHERE (("status")::"text" = 'SUCCESS'::"text")
  GROUP BY "site_code", "csv_filename"
  ORDER BY "site_code", ("sum"("imported_records")) DESC;


--
-- Name: v_latest_performance_data; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_latest_performance_data" AS
 WITH "latest_data" AS (
         SELECT "performance_data_old"."equipment_id",
            "performance_data_old"."metric_id",
            "max"("performance_data_old"."time") AS "latest_time"
           FROM "public"."performance_data_old"
          GROUP BY "performance_data_old"."equipment_id", "performance_data_old"."metric_id"
        )
 SELECT "dc"."name" AS "data_center_name",
    "e"."equipment_name",
    "e"."equipment_id",
    "pm"."metric_name",
    "pd"."value",
    "pm"."unit",
    "pd"."time",
    "pd"."statistical_period"
   FROM (((("public"."performance_data_old" "pd"
     JOIN "latest_data" "ld" ON ((("pd"."equipment_id" = "ld"."equipment_id") AND ("pd"."metric_id" = "ld"."metric_id") AND ("pd"."time" = "ld"."latest_time"))))
     JOIN "public"."equipment" "e" ON (("pd"."equipment_id" = "e"."id")))
     JOIN "public"."performance_metrics" "pm" ON (("pd"."metric_id" = "pm"."id")))
     JOIN "public"."data_centers" "dc" ON (("e"."data_center_id" = "dc"."id")))
  ORDER BY "dc"."name", "e"."equipment_name", "pm"."metric_name";


--
-- Name: v_metrics_by_device; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_metrics_by_device" AS
 SELECT "pd"."site_code",
    "pd"."equipment_id" AS "device_code",
    "pd"."equipment_name",
    "pd"."performance_data" AS "metric_name",
    COALESCE("mdod"."display_name_th", "mdos"."display_name_th", ("pd"."performance_data")::"text") AS "metric_name_th",
    COALESCE("mdod"."display_name_en", "mdos"."display_name_en", ("pd"."performance_data")::"text") AS "metric_name_en",
    COALESCE("mdod"."unit_canonical", "mdos"."unit_canonical", ("pd"."unit")::"text") AS "unit",
    COALESCE("mdod"."category", "mdos"."category", 'General'::"text") AS "category",
    COALESCE("mdod"."decimals", "mdos"."decimals", 2) AS "decimals",
    COALESCE("mdod"."is_hidden", "mdos"."is_hidden", false) AS "is_hidden",
    "count"(*) AS "data_points",
    "max"("pd"."time") AS "last_update",
    "min"("pd"."time") AS "first_data"
   FROM (("public"."performance_data" "pd"
     LEFT JOIN "public"."metric_display_override_device" "mdod" ON ((("mdod"."site_code" = ("pd"."site_code")::"text") AND ("mdod"."equipment_id" = ("pd"."equipment_id")::"text") AND ("mdod"."metric_name" = ("pd"."performance_data")::"text"))))
     LEFT JOIN "public"."metric_display_override_site" "mdos" ON ((("mdos"."site_code" = ("pd"."site_code")::"text") AND ("mdos"."metric_name" = ("pd"."performance_data")::"text"))))
  WHERE (COALESCE("mdod"."is_hidden", "mdos"."is_hidden", false) = false)
  GROUP BY "pd"."site_code", "pd"."equipment_id", "pd"."equipment_name", "pd"."performance_data", COALESCE("mdod"."display_name_th", "mdos"."display_name_th", ("pd"."performance_data")::"text"), COALESCE("mdod"."display_name_en", "mdos"."display_name_en", ("pd"."performance_data")::"text"), COALESCE("mdod"."unit_canonical", "mdos"."unit_canonical", ("pd"."unit")::"text"), COALESCE("mdod"."category", "mdos"."category", 'General'::"text"), COALESCE("mdod"."decimals", "mdos"."decimals", 2), COALESCE("mdod"."is_hidden", "mdos"."is_hidden", false)
  ORDER BY "pd"."site_code", "pd"."equipment_id", COALESCE("mdod"."category", "mdos"."category", 'General'::"text"), COALESCE("mdod"."display_name_th", "mdos"."display_name_th", ("pd"."performance_data")::"text");


--
-- Name: v_performance_import_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_performance_import_statistics" AS
 SELECT "site_code",
    "file_type",
    "count"(*) AS "total_imports",
    "sum"("records_processed") AS "total_records_processed",
    "sum"("records_inserted") AS "total_records_inserted",
    "sum"("records_updated") AS "total_records_updated",
    "sum"("records_skipped") AS "total_records_skipped",
    "min"("processing_start_time") AS "first_import",
    "max"("processing_end_time") AS "last_import",
    "avg"("processing_duration") AS "avg_processing_time"
   FROM "public"."performance_data_import_logs"
  WHERE (("status")::"text" = 'completed'::"text")
  GROUP BY "site_code", "file_type"
  ORDER BY "site_code", "file_type";


--
-- Name: v_performance_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_performance_summary" AS
 SELECT "site_code",
    "equipment_name",
    "equipment_id",
    "performance_data",
    "statistical_period",
    "count"(*) AS "record_count",
    "min"("statistical_start_time") AS "earliest_data",
    "max"("statistical_start_time") AS "latest_data",
    "max"("import_timestamp") AS "last_imported",
    "avg"("value_numeric") AS "avg_value",
    "min"("value_numeric") AS "min_value",
    "max"("value_numeric") AS "max_value"
   FROM "public"."performance_data"
  WHERE ("value_numeric" IS NOT NULL)
  GROUP BY "site_code", "equipment_name", "equipment_id", "performance_data", "statistical_period"
  ORDER BY "site_code", "equipment_name", "performance_data";


--
-- Name: v_site_performance_comparison; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_site_performance_comparison" AS
 SELECT "site_code",
    "count"(*) AS "session_count",
    "avg"("total_pipeline_duration_seconds") AS "avg_pipeline_duration",
    "avg"("total_export_duration_seconds") AS "avg_export_duration",
    "avg"("total_import_duration_seconds") AS "avg_import_duration",
    "avg"("success_rate_percent") AS "avg_success_rate",
    "sum"("total_records_imported") AS "total_records_imported",
    "sum"("total_records_skipped") AS "total_records_skipped",
    "max"("created_at") AS "last_run_time"
   FROM "public"."pipeline_performance_stats" "pps"
  GROUP BY "site_code"
  ORDER BY "site_code";


--
-- Name: v_sites_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_sites_summary" AS
 SELECT "site_code",
    "count"(DISTINCT "equipment_name") AS "device_count",
    "count"(DISTINCT "performance_data") AS "metric_count",
    "max"("time") AS "last_update",
    "min"("time") AS "first_data"
   FROM "public"."performance_data"
  GROUP BY "site_code"
  ORDER BY "site_code";


--
-- Name: v_timeseries_data; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."v_timeseries_data" AS
 SELECT "pd"."time",
    "pd"."site_code",
    "pd"."equipment_id" AS "device_code",
    "pd"."equipment_name",
    COALESCE("ddo"."display_name_th", ("pd"."equipment_name")::"text") AS "device_name_th",
    COALESCE("ddo"."display_name_en", ("pd"."equipment_name")::"text") AS "device_name_en",
    "pd"."performance_data" AS "metric_name",
    COALESCE("mdod"."display_name_th", "mdos"."display_name_th", ("pd"."performance_data")::"text") AS "metric_name_th",
    COALESCE("mdod"."display_name_en", "mdos"."display_name_en", ("pd"."performance_data")::"text") AS "metric_name_en",
    COALESCE("mdod"."unit_canonical", "mdos"."unit_canonical", ("pd"."unit")::"text") AS "unit",
    COALESCE("mdod"."category", "mdos"."category", 'General'::"text") AS "category",
    COALESCE("mdod"."decimals", "mdos"."decimals", 2) AS "decimals",
    COALESCE("pd"."value", "pd"."value_numeric") AS "value",
    "pd"."statistical_period",
    "pd"."source_file"
   FROM ((("public"."performance_data" "pd"
     LEFT JOIN "public"."device_display_override" "ddo" ON ((("ddo"."site_code" = ("pd"."site_code")::"text") AND ("ddo"."equipment_id" = ("pd"."equipment_id")::"text"))))
     LEFT JOIN "public"."metric_display_override_device" "mdod" ON ((("mdod"."site_code" = ("pd"."site_code")::"text") AND ("mdod"."equipment_id" = ("pd"."equipment_id")::"text") AND ("mdod"."metric_name" = ("pd"."performance_data")::"text"))))
     LEFT JOIN "public"."metric_display_override_site" "mdos" ON ((("mdos"."site_code" = ("pd"."site_code")::"text") AND ("mdos"."metric_name" = ("pd"."performance_data")::"text"))))
  WHERE ((COALESCE("ddo"."is_hidden", false) = false) AND (COALESCE("mdod"."is_hidden", "mdos"."is_hidden", false) = false));


--
-- Name: performance_data_2025_08; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_old" ATTACH PARTITION "public"."performance_data_2025_08" FOR VALUES FROM ('2025-08-01 00:00:00+00') TO ('2025-09-01 00:00:00+00');


--
-- Name: performance_data_2025_09; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_old" ATTACH PARTITION "public"."performance_data_2025_09" FOR VALUES FROM ('2025-09-01 00:00:00+00') TO ('2025-10-01 00:00:00+00');


--
-- Name: performance_data_2025_10; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_old" ATTACH PARTITION "public"."performance_data_2025_10" FOR VALUES FROM ('2025-10-01 00:00:00+00') TO ('2025-11-01 00:00:00+00');


--
-- Name: _hyper_13_94_chunk id; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_94_chunk" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_data_id_seq"'::"regclass");


--
-- Name: _hyper_13_94_chunk site_code; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_94_chunk" ALTER COLUMN "site_code" SET DEFAULT 'dc'::character varying;


--
-- Name: _hyper_13_94_chunk data_type; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_94_chunk" ALTER COLUMN "data_type" SET DEFAULT 'performance_data'::character varying;


--
-- Name: _hyper_13_94_chunk import_timestamp; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_94_chunk" ALTER COLUMN "import_timestamp" SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: _hyper_13_95_chunk id; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_95_chunk" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_data_id_seq"'::"regclass");


--
-- Name: _hyper_13_95_chunk site_code; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_95_chunk" ALTER COLUMN "site_code" SET DEFAULT 'dc'::character varying;


--
-- Name: _hyper_13_95_chunk data_type; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_95_chunk" ALTER COLUMN "data_type" SET DEFAULT 'performance_data'::character varying;


--
-- Name: _hyper_13_95_chunk import_timestamp; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_95_chunk" ALTER COLUMN "import_timestamp" SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: _hyper_13_96_chunk id; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_96_chunk" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_data_id_seq"'::"regclass");


--
-- Name: _hyper_13_96_chunk site_code; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_96_chunk" ALTER COLUMN "site_code" SET DEFAULT 'dc'::character varying;


--
-- Name: _hyper_13_96_chunk data_type; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_96_chunk" ALTER COLUMN "data_type" SET DEFAULT 'performance_data'::character varying;


--
-- Name: _hyper_13_96_chunk import_timestamp; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_13_96_chunk" ALTER COLUMN "import_timestamp" SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: _hyper_5_100_chunk id; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_100_chunk" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fault_performance_data_id_seq"'::"regclass");


--
-- Name: _hyper_5_100_chunk site_code; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_100_chunk" ALTER COLUMN "site_code" SET DEFAULT 'dc'::character varying;


--
-- Name: _hyper_5_100_chunk data_type; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_100_chunk" ALTER COLUMN "data_type" SET DEFAULT 'fault_info'::character varying;


--
-- Name: _hyper_5_100_chunk import_timestamp; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_100_chunk" ALTER COLUMN "import_timestamp" SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: _hyper_5_97_chunk id; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_97_chunk" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fault_performance_data_id_seq"'::"regclass");


--
-- Name: _hyper_5_97_chunk site_code; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_97_chunk" ALTER COLUMN "site_code" SET DEFAULT 'dc'::character varying;


--
-- Name: _hyper_5_97_chunk data_type; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_97_chunk" ALTER COLUMN "data_type" SET DEFAULT 'fault_info'::character varying;


--
-- Name: _hyper_5_97_chunk import_timestamp; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_97_chunk" ALTER COLUMN "import_timestamp" SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: _hyper_5_98_chunk id; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_98_chunk" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fault_performance_data_id_seq"'::"regclass");


--
-- Name: _hyper_5_98_chunk site_code; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_98_chunk" ALTER COLUMN "site_code" SET DEFAULT 'dc'::character varying;


--
-- Name: _hyper_5_98_chunk data_type; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_98_chunk" ALTER COLUMN "data_type" SET DEFAULT 'fault_info'::character varying;


--
-- Name: _hyper_5_98_chunk import_timestamp; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_98_chunk" ALTER COLUMN "import_timestamp" SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: _hyper_5_99_chunk id; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_99_chunk" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fault_performance_data_id_seq"'::"regclass");


--
-- Name: _hyper_5_99_chunk site_code; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_99_chunk" ALTER COLUMN "site_code" SET DEFAULT 'dc'::character varying;


--
-- Name: _hyper_5_99_chunk data_type; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_99_chunk" ALTER COLUMN "data_type" SET DEFAULT 'fault_info'::character varying;


--
-- Name: _hyper_5_99_chunk import_timestamp; Type: DEFAULT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_99_chunk" ALTER COLUMN "import_timestamp" SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: data_centers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."data_centers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."data_centers_id_seq"'::"regclass");


--
-- Name: data_import_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."data_import_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."data_import_logs_id_seq"'::"regclass");


--
-- Name: enhanced_export_actions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_actions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."enhanced_export_actions_id_seq"'::"regclass");


--
-- Name: enhanced_export_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_sessions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."enhanced_export_sessions_id_seq"'::"regclass");


--
-- Name: enhanced_export_step_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_step_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."enhanced_export_step_logs_id_seq"'::"regclass");


--
-- Name: equipment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."equipment_id_seq"'::"regclass");


--
-- Name: equipment_aliases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment_aliases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."equipment_aliases_id_seq"'::"regclass");


--
-- Name: equipment_name_overrides id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment_name_overrides" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."equipment_name_overrides_id_seq"'::"regclass");


--
-- Name: export_downloads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_downloads" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."export_downloads_id_seq"'::"regclass");


--
-- Name: export_interactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_interactions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."export_interactions_id_seq"'::"regclass");


--
-- Name: export_page_visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_page_visits" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."export_page_visits_id_seq"'::"regclass");


--
-- Name: export_performance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_performance" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."export_performance_id_seq"'::"regclass");


--
-- Name: export_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_sessions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."export_sessions_id_seq"'::"regclass");


--
-- Name: export_step_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_step_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."export_step_logs_id_seq"'::"regclass");


--
-- Name: export_web_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_web_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."export_web_log_id_seq"'::"regclass");


--
-- Name: fault_data_import_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."fault_data_import_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fault_data_import_logs_id_seq"'::"regclass");


--
-- Name: fault_equipment_master id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."fault_equipment_master" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fault_equipment_master_id_seq"'::"regclass");


--
-- Name: fault_performance_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."fault_performance_data" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fault_performance_data_id_seq"'::"regclass");


--
-- Name: metric_aliases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."metric_aliases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."metric_aliases_id_seq"'::"regclass");


--
-- Name: performance_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_data_id_seq"'::"regclass");


--
-- Name: performance_data_import_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_import_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_data_import_logs_id_seq"'::"regclass");


--
-- Name: performance_data_old id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_old" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_data_id_seq1"'::"regclass");


--
-- Name: performance_equipment_master id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_equipment_master" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_equipment_master_id_seq"'::"regclass");


--
-- Name: performance_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_metrics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."performance_metrics_id_seq"'::"regclass");


--
-- Name: pipeline_performance_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pipeline_performance_stats" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pipeline_performance_stats_id_seq"'::"regclass");


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."users_id_seq"'::"regclass");


--
-- Name: _hyper_5_100_chunk 100_81_fault_performance_data_pk_composite; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_100_chunk"
    ADD CONSTRAINT "100_81_fault_performance_data_pk_composite" PRIMARY KEY ("site_code", "statistical_start_time", "id");


--
-- Name: _hyper_5_100_chunk 100_82_fault_performance_data_unique; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_100_chunk"
    ADD CONSTRAINT "100_82_fault_performance_data_unique" UNIQUE ("site_code", "equipment_name", "equipment_id", "performance_data", "statistical_start_time", "statistical_period");


--
-- Name: _hyper_5_97_chunk 97_75_fault_performance_data_pk_composite; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_97_chunk"
    ADD CONSTRAINT "97_75_fault_performance_data_pk_composite" PRIMARY KEY ("site_code", "statistical_start_time", "id");


--
-- Name: _hyper_5_97_chunk 97_76_fault_performance_data_unique; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_97_chunk"
    ADD CONSTRAINT "97_76_fault_performance_data_unique" UNIQUE ("site_code", "equipment_name", "equipment_id", "performance_data", "statistical_start_time", "statistical_period");


--
-- Name: _hyper_5_98_chunk 98_77_fault_performance_data_pk_composite; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_98_chunk"
    ADD CONSTRAINT "98_77_fault_performance_data_pk_composite" PRIMARY KEY ("site_code", "statistical_start_time", "id");


--
-- Name: _hyper_5_98_chunk 98_78_fault_performance_data_unique; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_98_chunk"
    ADD CONSTRAINT "98_78_fault_performance_data_unique" UNIQUE ("site_code", "equipment_name", "equipment_id", "performance_data", "statistical_start_time", "statistical_period");


--
-- Name: _hyper_5_99_chunk 99_79_fault_performance_data_pk_composite; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_99_chunk"
    ADD CONSTRAINT "99_79_fault_performance_data_pk_composite" PRIMARY KEY ("site_code", "statistical_start_time", "id");


--
-- Name: _hyper_5_99_chunk 99_80_fault_performance_data_unique; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: -
--

ALTER TABLE ONLY "_timescaledb_internal"."_hyper_5_99_chunk"
    ADD CONSTRAINT "99_80_fault_performance_data_unique" UNIQUE ("site_code", "equipment_name", "equipment_id", "performance_data", "statistical_start_time", "statistical_period");


--
-- Name: data_centers data_centers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."data_centers"
    ADD CONSTRAINT "data_centers_name_key" UNIQUE ("name");


--
-- Name: data_centers data_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."data_centers"
    ADD CONSTRAINT "data_centers_pkey" PRIMARY KEY ("id");


--
-- Name: data_import_logs data_import_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."data_import_logs"
    ADD CONSTRAINT "data_import_logs_pkey" PRIMARY KEY ("id");


--
-- Name: device_display_override device_display_override_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_display_override"
    ADD CONSTRAINT "device_display_override_pkey" PRIMARY KEY ("site_code", "equipment_id");


--
-- Name: enhanced_export_actions enhanced_export_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_actions"
    ADD CONSTRAINT "enhanced_export_actions_pkey" PRIMARY KEY ("id");


--
-- Name: enhanced_export_sessions enhanced_export_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_sessions"
    ADD CONSTRAINT "enhanced_export_sessions_pkey" PRIMARY KEY ("id");


--
-- Name: enhanced_export_sessions enhanced_export_sessions_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_sessions"
    ADD CONSTRAINT "enhanced_export_sessions_session_id_key" UNIQUE ("session_id");


--
-- Name: enhanced_export_step_logs enhanced_export_step_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_step_logs"
    ADD CONSTRAINT "enhanced_export_step_logs_pkey" PRIMARY KEY ("id");


--
-- Name: equipment_aliases equipment_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment_aliases"
    ADD CONSTRAINT "equipment_aliases_pkey" PRIMARY KEY ("id");


--
-- Name: equipment equipment_data_center_id_equipment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_data_center_id_equipment_id_key" UNIQUE ("data_center_id", "equipment_id");


--
-- Name: equipment_name_overrides equipment_name_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment_name_overrides"
    ADD CONSTRAINT "equipment_name_overrides_pkey" PRIMARY KEY ("id");


--
-- Name: equipment_name_overrides equipment_name_overrides_site_code_equipment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment_name_overrides"
    ADD CONSTRAINT "equipment_name_overrides_site_code_equipment_id_key" UNIQUE ("site_code", "equipment_id");


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_pkey" PRIMARY KEY ("id");


--
-- Name: export_downloads export_downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_downloads"
    ADD CONSTRAINT "export_downloads_pkey" PRIMARY KEY ("id");


--
-- Name: export_interactions export_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_interactions"
    ADD CONSTRAINT "export_interactions_pkey" PRIMARY KEY ("id");


--
-- Name: export_page_visits export_page_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_page_visits"
    ADD CONSTRAINT "export_page_visits_pkey" PRIMARY KEY ("id");


--
-- Name: export_performance export_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_performance"
    ADD CONSTRAINT "export_performance_pkey" PRIMARY KEY ("id");


--
-- Name: export_sessions export_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_sessions"
    ADD CONSTRAINT "export_sessions_pkey" PRIMARY KEY ("id");


--
-- Name: export_sessions export_sessions_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_sessions"
    ADD CONSTRAINT "export_sessions_session_id_key" UNIQUE ("session_id");


--
-- Name: export_step_logs export_step_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_step_logs"
    ADD CONSTRAINT "export_step_logs_pkey" PRIMARY KEY ("id");


--
-- Name: export_web_log export_web_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_web_log"
    ADD CONSTRAINT "export_web_log_pkey" PRIMARY KEY ("id");


--
-- Name: fault_data_import_logs fault_data_import_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."fault_data_import_logs"
    ADD CONSTRAINT "fault_data_import_logs_pkey" PRIMARY KEY ("id");


--
-- Name: fault_equipment_master fault_equipment_master_equipment_name_equipment_id_site_cod_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."fault_equipment_master"
    ADD CONSTRAINT "fault_equipment_master_equipment_name_equipment_id_site_cod_key" UNIQUE ("equipment_name", "equipment_id", "site_code");


--
-- Name: fault_equipment_master fault_equipment_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."fault_equipment_master"
    ADD CONSTRAINT "fault_equipment_master_pkey" PRIMARY KEY ("id");


--
-- Name: fault_performance_data fault_performance_data_pk_composite; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."fault_performance_data"
    ADD CONSTRAINT "fault_performance_data_pk_composite" PRIMARY KEY ("site_code", "statistical_start_time", "id");


--
-- Name: fault_performance_data fault_performance_data_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."fault_performance_data"
    ADD CONSTRAINT "fault_performance_data_unique" UNIQUE ("site_code", "equipment_name", "equipment_id", "performance_data", "statistical_start_time", "statistical_period");


--
-- Name: metric_aliases metric_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."metric_aliases"
    ADD CONSTRAINT "metric_aliases_pkey" PRIMARY KEY ("id");


--
-- Name: metric_display_override_device metric_display_override_device_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."metric_display_override_device"
    ADD CONSTRAINT "metric_display_override_device_pkey" PRIMARY KEY ("site_code", "equipment_id", "metric_name");


--
-- Name: metric_display_override_site metric_display_override_site_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."metric_display_override_site"
    ADD CONSTRAINT "metric_display_override_site_pkey" PRIMARY KEY ("site_code", "metric_name");


--
-- Name: performance_data_old performance_data_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_old"
    ADD CONSTRAINT "performance_data_pkey1" PRIMARY KEY ("id", "time");


--
-- Name: performance_data_2025_08 performance_data_2025_08_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_2025_08"
    ADD CONSTRAINT "performance_data_2025_08_pkey" PRIMARY KEY ("id", "time");


--
-- Name: performance_data_old performance_data_time_equipment_id_metric_id_statistical_p_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_old"
    ADD CONSTRAINT "performance_data_time_equipment_id_metric_id_statistical_p_key1" UNIQUE ("time", "equipment_id", "metric_id", "statistical_period");


--
-- Name: performance_data_2025_08 performance_data_2025_08_time_equipment_id_metric_id_statis_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_2025_08"
    ADD CONSTRAINT "performance_data_2025_08_time_equipment_id_metric_id_statis_key" UNIQUE ("time", "equipment_id", "metric_id", "statistical_period");


--
-- Name: performance_data_2025_09 performance_data_2025_09_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_2025_09"
    ADD CONSTRAINT "performance_data_2025_09_pkey" PRIMARY KEY ("id", "time");


--
-- Name: performance_data_2025_09 performance_data_2025_09_time_equipment_id_metric_id_statis_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_2025_09"
    ADD CONSTRAINT "performance_data_2025_09_time_equipment_id_metric_id_statis_key" UNIQUE ("time", "equipment_id", "metric_id", "statistical_period");


--
-- Name: performance_data_2025_10 performance_data_2025_10_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_2025_10"
    ADD CONSTRAINT "performance_data_2025_10_pkey" PRIMARY KEY ("id", "time");


--
-- Name: performance_data_2025_10 performance_data_2025_10_time_equipment_id_metric_id_statis_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_2025_10"
    ADD CONSTRAINT "performance_data_2025_10_time_equipment_id_metric_id_statis_key" UNIQUE ("time", "equipment_id", "metric_id", "statistical_period");


--
-- Name: performance_data_import_logs performance_data_import_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_data_import_logs"
    ADD CONSTRAINT "performance_data_import_logs_pkey" PRIMARY KEY ("id");


--
-- Name: performance_equipment_master performance_equipment_master_equipment_name_equipment_id_si_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_equipment_master"
    ADD CONSTRAINT "performance_equipment_master_equipment_name_equipment_id_si_key" UNIQUE ("equipment_name", "equipment_id", "site_code");


--
-- Name: performance_equipment_master performance_equipment_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_equipment_master"
    ADD CONSTRAINT "performance_equipment_master_pkey" PRIMARY KEY ("id");


--
-- Name: performance_metrics performance_metrics_metric_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_metric_name_key" UNIQUE ("metric_name");


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id");


--
-- Name: pipeline_performance_stats pipeline_performance_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pipeline_performance_stats"
    ADD CONSTRAINT "pipeline_performance_stats_pkey" PRIMARY KEY ("id");


--
-- Name: equipment_aliases uk_equipment_aliases_scope_site_equip_alias; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment_aliases"
    ADD CONSTRAINT "uk_equipment_aliases_scope_site_equip_alias" UNIQUE ("scope", "site_code", "equipment_id", "alias_name");


--
-- Name: metric_aliases uk_metric_aliases_scope_site_metric_alias; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."metric_aliases"
    ADD CONSTRAINT "uk_metric_aliases_scope_site_metric_alias" UNIQUE ("scope", "site_code", "metric_key", "alias_name");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");


--
-- Name: _hyper_13_94_chunk_idx_perf_data_type; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_idx_perf_data_type" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("performance_data", "statistical_period");


--
-- Name: _hyper_13_94_chunk_idx_perf_equipment; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_idx_perf_equipment" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("equipment_name", "equipment_id");


--
-- Name: _hyper_13_94_chunk_idx_perf_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_idx_perf_site_time" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("site_code", "statistical_start_time");


--
-- Name: _hyper_13_94_chunk_idx_perf_source_file; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_idx_perf_source_file" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("source_file", "import_timestamp");


--
-- Name: _hyper_13_94_chunk_idx_perf_upsert; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_idx_perf_upsert" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("site_code", "equipment_name", "equipment_id", "performance_data", "statistical_start_time", "statistical_period");


--
-- Name: _hyper_13_94_chunk_idx_perf_value_numeric; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_idx_perf_value_numeric" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("value_numeric") WHERE ("value_numeric" IS NOT NULL);


--
-- Name: _hyper_13_94_chunk_idx_performance_data_metric_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_idx_performance_data_metric_time" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("performance_data", "statistical_start_time");


--
-- Name: _hyper_13_94_chunk_idx_performance_data_site_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_idx_performance_data_site_equipment_time" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("site_code", "equipment_name", "statistical_start_time");


--
-- Name: _hyper_13_94_chunk_ix_performance_data_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_ix_performance_data_equipment_time" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("equipment_id", "statistical_start_time");


--
-- Name: _hyper_13_94_chunk_ix_performance_data_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_ix_performance_data_time" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("statistical_start_time");


--
-- Name: _hyper_13_94_chunk_performance_data_statistical_start_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_94_chunk_performance_data_statistical_start_time_idx" ON "_timescaledb_internal"."_hyper_13_94_chunk" USING "btree" ("statistical_start_time" DESC);


--
-- Name: _hyper_13_95_chunk_idx_perf_data_type; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_idx_perf_data_type" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("performance_data", "statistical_period");


--
-- Name: _hyper_13_95_chunk_idx_perf_equipment; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_idx_perf_equipment" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("equipment_name", "equipment_id");


--
-- Name: _hyper_13_95_chunk_idx_perf_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_idx_perf_site_time" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("site_code", "statistical_start_time");


--
-- Name: _hyper_13_95_chunk_idx_perf_source_file; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_idx_perf_source_file" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("source_file", "import_timestamp");


--
-- Name: _hyper_13_95_chunk_idx_perf_upsert; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_idx_perf_upsert" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("site_code", "equipment_name", "equipment_id", "performance_data", "statistical_start_time", "statistical_period");


--
-- Name: _hyper_13_95_chunk_idx_perf_value_numeric; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_idx_perf_value_numeric" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("value_numeric") WHERE ("value_numeric" IS NOT NULL);


--
-- Name: _hyper_13_95_chunk_idx_performance_data_metric_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_idx_performance_data_metric_time" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("performance_data", "statistical_start_time");


--
-- Name: _hyper_13_95_chunk_idx_performance_data_site_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_idx_performance_data_site_equipment_time" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("site_code", "equipment_name", "statistical_start_time");


--
-- Name: _hyper_13_95_chunk_ix_performance_data_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_ix_performance_data_equipment_time" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("equipment_id", "statistical_start_time");


--
-- Name: _hyper_13_95_chunk_ix_performance_data_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_ix_performance_data_time" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("statistical_start_time");


--
-- Name: _hyper_13_95_chunk_performance_data_statistical_start_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_95_chunk_performance_data_statistical_start_time_idx" ON "_timescaledb_internal"."_hyper_13_95_chunk" USING "btree" ("statistical_start_time" DESC);


--
-- Name: _hyper_13_96_chunk_idx_perf_data_type; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_idx_perf_data_type" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("performance_data", "statistical_period");


--
-- Name: _hyper_13_96_chunk_idx_perf_equipment; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_idx_perf_equipment" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("equipment_name", "equipment_id");


--
-- Name: _hyper_13_96_chunk_idx_perf_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_idx_perf_site_time" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("site_code", "statistical_start_time");


--
-- Name: _hyper_13_96_chunk_idx_perf_source_file; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_idx_perf_source_file" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("source_file", "import_timestamp");


--
-- Name: _hyper_13_96_chunk_idx_perf_upsert; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_idx_perf_upsert" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("site_code", "equipment_name", "equipment_id", "performance_data", "statistical_start_time", "statistical_period");


--
-- Name: _hyper_13_96_chunk_idx_perf_value_numeric; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_idx_perf_value_numeric" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("value_numeric") WHERE ("value_numeric" IS NOT NULL);


--
-- Name: _hyper_13_96_chunk_idx_performance_data_metric_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_idx_performance_data_metric_time" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("performance_data", "statistical_start_time");


--
-- Name: _hyper_13_96_chunk_idx_performance_data_site_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_idx_performance_data_site_equipment_time" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("site_code", "equipment_name", "statistical_start_time");


--
-- Name: _hyper_13_96_chunk_ix_performance_data_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_ix_performance_data_equipment_time" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("equipment_id", "statistical_start_time");


--
-- Name: _hyper_13_96_chunk_ix_performance_data_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_ix_performance_data_time" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("statistical_start_time");


--
-- Name: _hyper_13_96_chunk_performance_data_statistical_start_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_13_96_chunk_performance_data_statistical_start_time_idx" ON "_timescaledb_internal"."_hyper_13_96_chunk" USING "btree" ("statistical_start_time" DESC);


--
-- Name: _hyper_22_45_chunk__materialized_hypertable_22_equipment_name_h; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_22_45_chunk__materialized_hypertable_22_equipment_name_h" ON "_timescaledb_internal"."_hyper_22_45_chunk" USING "btree" ("equipment_name", "hour_bucket" DESC);


--
-- Name: _hyper_22_45_chunk__materialized_hypertable_22_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_22_45_chunk__materialized_hypertable_22_hour_bucket_idx" ON "_timescaledb_internal"."_hyper_22_45_chunk" USING "btree" ("hour_bucket" DESC);


--
-- Name: _hyper_22_45_chunk__materialized_hypertable_22_metric_key_hour_; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_22_45_chunk__materialized_hypertable_22_metric_key_hour_" ON "_timescaledb_internal"."_hyper_22_45_chunk" USING "btree" ("metric_key", "hour_bucket" DESC);


--
-- Name: _hyper_22_45_chunk__materialized_hypertable_22_site_code_hour_b; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_22_45_chunk__materialized_hypertable_22_site_code_hour_b" ON "_timescaledb_internal"."_hyper_22_45_chunk" USING "btree" ("site_code", "hour_bucket" DESC);


--
-- Name: _hyper_22_45_chunk_idx_cagg_perf_1h_site_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_22_45_chunk_idx_cagg_perf_1h_site_equipment_time" ON "_timescaledb_internal"."_hyper_22_45_chunk" USING "btree" ("site_code", "equipment_name", "hour_bucket");


--
-- Name: _hyper_23_46_chunk__materialized_hypertable_23_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_23_46_chunk__materialized_hypertable_23_day_bucket_idx" ON "_timescaledb_internal"."_hyper_23_46_chunk" USING "btree" ("day_bucket" DESC);


--
-- Name: _hyper_23_46_chunk__materialized_hypertable_23_equipment_name_d; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_23_46_chunk__materialized_hypertable_23_equipment_name_d" ON "_timescaledb_internal"."_hyper_23_46_chunk" USING "btree" ("equipment_name", "day_bucket" DESC);


--
-- Name: _hyper_23_46_chunk__materialized_hypertable_23_metric_key_day_b; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_23_46_chunk__materialized_hypertable_23_metric_key_day_b" ON "_timescaledb_internal"."_hyper_23_46_chunk" USING "btree" ("metric_key", "day_bucket" DESC);


--
-- Name: _hyper_23_46_chunk__materialized_hypertable_23_site_code_day_bu; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_23_46_chunk__materialized_hypertable_23_site_code_day_bu" ON "_timescaledb_internal"."_hyper_23_46_chunk" USING "btree" ("site_code", "day_bucket" DESC);


--
-- Name: _hyper_23_46_chunk_idx_cagg_perf_1d_site_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_23_46_chunk_idx_cagg_perf_1d_site_equipment_time" ON "_timescaledb_internal"."_hyper_23_46_chunk" USING "btree" ("site_code", "equipment_name", "day_bucket");


--
-- Name: _hyper_24_47_chunk__materialized_hypertable_24_equipment_name_h; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_24_47_chunk__materialized_hypertable_24_equipment_name_h" ON "_timescaledb_internal"."_hyper_24_47_chunk" USING "btree" ("equipment_name", "hour_bucket" DESC);


--
-- Name: _hyper_24_47_chunk__materialized_hypertable_24_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_24_47_chunk__materialized_hypertable_24_hour_bucket_idx" ON "_timescaledb_internal"."_hyper_24_47_chunk" USING "btree" ("hour_bucket" DESC);


--
-- Name: _hyper_24_47_chunk__materialized_hypertable_24_metric_key_hour_; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_24_47_chunk__materialized_hypertable_24_metric_key_hour_" ON "_timescaledb_internal"."_hyper_24_47_chunk" USING "btree" ("metric_key", "hour_bucket" DESC);


--
-- Name: _hyper_24_47_chunk__materialized_hypertable_24_site_code_hour_b; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_24_47_chunk__materialized_hypertable_24_site_code_hour_b" ON "_timescaledb_internal"."_hyper_24_47_chunk" USING "btree" ("site_code", "hour_bucket" DESC);


--
-- Name: _hyper_24_47_chunk_idx_cagg_fault_hourly_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_24_47_chunk_idx_cagg_fault_hourly_site_time" ON "_timescaledb_internal"."_hyper_24_47_chunk" USING "btree" ("site_code", "hour_bucket");


--
-- Name: _hyper_25_48_chunk__materialized_hypertable_25_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_25_48_chunk__materialized_hypertable_25_day_bucket_idx" ON "_timescaledb_internal"."_hyper_25_48_chunk" USING "btree" ("day_bucket" DESC);


--
-- Name: _hyper_25_48_chunk__materialized_hypertable_25_equipment_name_d; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_25_48_chunk__materialized_hypertable_25_equipment_name_d" ON "_timescaledb_internal"."_hyper_25_48_chunk" USING "btree" ("equipment_name", "day_bucket" DESC);


--
-- Name: _hyper_25_48_chunk__materialized_hypertable_25_metric_key_day_b; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_25_48_chunk__materialized_hypertable_25_metric_key_day_b" ON "_timescaledb_internal"."_hyper_25_48_chunk" USING "btree" ("metric_key", "day_bucket" DESC);


--
-- Name: _hyper_25_48_chunk__materialized_hypertable_25_site_code_day_bu; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_25_48_chunk__materialized_hypertable_25_site_code_day_bu" ON "_timescaledb_internal"."_hyper_25_48_chunk" USING "btree" ("site_code", "day_bucket" DESC);


--
-- Name: _hyper_25_48_chunk_idx_cagg_fault_daily_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_25_48_chunk_idx_cagg_fault_daily_site_time" ON "_timescaledb_internal"."_hyper_25_48_chunk" USING "btree" ("site_code", "day_bucket");


--
-- Name: _hyper_5_100_chunk_idx_fault_perf_data_type; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_perf_data_type" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("performance_data", "statistical_period");


--
-- Name: _hyper_5_100_chunk_idx_fault_perf_equipment; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_perf_equipment" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("equipment_name", "equipment_id");


--
-- Name: _hyper_5_100_chunk_idx_fault_perf_id; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_perf_id" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("id");


--
-- Name: _hyper_5_100_chunk_idx_fault_perf_name; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_perf_name" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("equipment_name");


--
-- Name: _hyper_5_100_chunk_idx_fault_perf_site_eq; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_perf_site_eq" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("site_code", "equipment_id");


--
-- Name: _hyper_5_100_chunk_idx_fault_perf_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_perf_site_time" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("site_code", "statistical_start_time");


--
-- Name: _hyper_5_100_chunk_idx_fault_perf_source_file; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_perf_source_file" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("source_file", "import_timestamp");


--
-- Name: _hyper_5_100_chunk_idx_fault_perf_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_perf_time" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("statistical_start_time" DESC);


--
-- Name: _hyper_5_100_chunk_idx_fault_performance_data_metric_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_performance_data_metric_time" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("performance_data", "statistical_start_time");


--
-- Name: _hyper_5_100_chunk_idx_fault_performance_data_site_equipment_ti; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_100_chunk_idx_fault_performance_data_site_equipment_ti" ON "_timescaledb_internal"."_hyper_5_100_chunk" USING "btree" ("site_code", "equipment_name", "statistical_start_time");


--
-- Name: _hyper_5_97_chunk_idx_fault_perf_data_type; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_perf_data_type" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("performance_data", "statistical_period");


--
-- Name: _hyper_5_97_chunk_idx_fault_perf_equipment; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_perf_equipment" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("equipment_name", "equipment_id");


--
-- Name: _hyper_5_97_chunk_idx_fault_perf_id; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_perf_id" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("id");


--
-- Name: _hyper_5_97_chunk_idx_fault_perf_name; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_perf_name" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("equipment_name");


--
-- Name: _hyper_5_97_chunk_idx_fault_perf_site_eq; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_perf_site_eq" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("site_code", "equipment_id");


--
-- Name: _hyper_5_97_chunk_idx_fault_perf_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_perf_site_time" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("site_code", "statistical_start_time");


--
-- Name: _hyper_5_97_chunk_idx_fault_perf_source_file; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_perf_source_file" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("source_file", "import_timestamp");


--
-- Name: _hyper_5_97_chunk_idx_fault_perf_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_perf_time" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("statistical_start_time" DESC);


--
-- Name: _hyper_5_97_chunk_idx_fault_performance_data_metric_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_performance_data_metric_time" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("performance_data", "statistical_start_time");


--
-- Name: _hyper_5_97_chunk_idx_fault_performance_data_site_equipment_tim; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_97_chunk_idx_fault_performance_data_site_equipment_tim" ON "_timescaledb_internal"."_hyper_5_97_chunk" USING "btree" ("site_code", "equipment_name", "statistical_start_time");


--
-- Name: _hyper_5_98_chunk_idx_fault_perf_data_type; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_perf_data_type" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("performance_data", "statistical_period");


--
-- Name: _hyper_5_98_chunk_idx_fault_perf_equipment; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_perf_equipment" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("equipment_name", "equipment_id");


--
-- Name: _hyper_5_98_chunk_idx_fault_perf_id; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_perf_id" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("id");


--
-- Name: _hyper_5_98_chunk_idx_fault_perf_name; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_perf_name" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("equipment_name");


--
-- Name: _hyper_5_98_chunk_idx_fault_perf_site_eq; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_perf_site_eq" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("site_code", "equipment_id");


--
-- Name: _hyper_5_98_chunk_idx_fault_perf_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_perf_site_time" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("site_code", "statistical_start_time");


--
-- Name: _hyper_5_98_chunk_idx_fault_perf_source_file; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_perf_source_file" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("source_file", "import_timestamp");


--
-- Name: _hyper_5_98_chunk_idx_fault_perf_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_perf_time" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("statistical_start_time" DESC);


--
-- Name: _hyper_5_98_chunk_idx_fault_performance_data_metric_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_performance_data_metric_time" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("performance_data", "statistical_start_time");


--
-- Name: _hyper_5_98_chunk_idx_fault_performance_data_site_equipment_tim; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_98_chunk_idx_fault_performance_data_site_equipment_tim" ON "_timescaledb_internal"."_hyper_5_98_chunk" USING "btree" ("site_code", "equipment_name", "statistical_start_time");


--
-- Name: _hyper_5_99_chunk_idx_fault_perf_data_type; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_perf_data_type" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("performance_data", "statistical_period");


--
-- Name: _hyper_5_99_chunk_idx_fault_perf_equipment; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_perf_equipment" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("equipment_name", "equipment_id");


--
-- Name: _hyper_5_99_chunk_idx_fault_perf_id; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_perf_id" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("id");


--
-- Name: _hyper_5_99_chunk_idx_fault_perf_name; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_perf_name" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("equipment_name");


--
-- Name: _hyper_5_99_chunk_idx_fault_perf_site_eq; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_perf_site_eq" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("site_code", "equipment_id");


--
-- Name: _hyper_5_99_chunk_idx_fault_perf_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_perf_site_time" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("site_code", "statistical_start_time");


--
-- Name: _hyper_5_99_chunk_idx_fault_perf_source_file; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_perf_source_file" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("source_file", "import_timestamp");


--
-- Name: _hyper_5_99_chunk_idx_fault_perf_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_perf_time" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("statistical_start_time" DESC);


--
-- Name: _hyper_5_99_chunk_idx_fault_performance_data_metric_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_performance_data_metric_time" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("performance_data", "statistical_start_time");


--
-- Name: _hyper_5_99_chunk_idx_fault_performance_data_site_equipment_tim; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_hyper_5_99_chunk_idx_fault_performance_data_site_equipment_tim" ON "_timescaledb_internal"."_hyper_5_99_chunk" USING "btree" ("site_code", "equipment_name", "statistical_start_time");


--
-- Name: _materialized_hypertable_22_equipment_name_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_22_equipment_name_hour_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_22" USING "btree" ("equipment_name", "hour_bucket" DESC);


--
-- Name: _materialized_hypertable_22_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_22_hour_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_22" USING "btree" ("hour_bucket" DESC);


--
-- Name: _materialized_hypertable_22_metric_key_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_22_metric_key_hour_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_22" USING "btree" ("metric_key", "hour_bucket" DESC);


--
-- Name: _materialized_hypertable_22_site_code_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_22_site_code_hour_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_22" USING "btree" ("site_code", "hour_bucket" DESC);


--
-- Name: _materialized_hypertable_23_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_23_day_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_23" USING "btree" ("day_bucket" DESC);


--
-- Name: _materialized_hypertable_23_equipment_name_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_23_equipment_name_day_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_23" USING "btree" ("equipment_name", "day_bucket" DESC);


--
-- Name: _materialized_hypertable_23_metric_key_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_23_metric_key_day_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_23" USING "btree" ("metric_key", "day_bucket" DESC);


--
-- Name: _materialized_hypertable_23_site_code_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_23_site_code_day_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_23" USING "btree" ("site_code", "day_bucket" DESC);


--
-- Name: _materialized_hypertable_24_equipment_name_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_24_equipment_name_hour_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_24" USING "btree" ("equipment_name", "hour_bucket" DESC);


--
-- Name: _materialized_hypertable_24_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_24_hour_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_24" USING "btree" ("hour_bucket" DESC);


--
-- Name: _materialized_hypertable_24_metric_key_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_24_metric_key_hour_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_24" USING "btree" ("metric_key", "hour_bucket" DESC);


--
-- Name: _materialized_hypertable_24_site_code_hour_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_24_site_code_hour_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_24" USING "btree" ("site_code", "hour_bucket" DESC);


--
-- Name: _materialized_hypertable_25_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_25_day_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_25" USING "btree" ("day_bucket" DESC);


--
-- Name: _materialized_hypertable_25_equipment_name_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_25_equipment_name_day_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_25" USING "btree" ("equipment_name", "day_bucket" DESC);


--
-- Name: _materialized_hypertable_25_metric_key_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_25_metric_key_day_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_25" USING "btree" ("metric_key", "day_bucket" DESC);


--
-- Name: _materialized_hypertable_25_site_code_day_bucket_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "_materialized_hypertable_25_site_code_day_bucket_idx" ON "_timescaledb_internal"."_materialized_hypertable_25" USING "btree" ("site_code", "day_bucket" DESC);


--
-- Name: idx_cagg_fault_daily_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "idx_cagg_fault_daily_site_time" ON "_timescaledb_internal"."_materialized_hypertable_25" USING "btree" ("site_code", "day_bucket");


--
-- Name: idx_cagg_fault_hourly_site_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "idx_cagg_fault_hourly_site_time" ON "_timescaledb_internal"."_materialized_hypertable_24" USING "btree" ("site_code", "hour_bucket");


--
-- Name: idx_cagg_perf_1d_site_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "idx_cagg_perf_1d_site_equipment_time" ON "_timescaledb_internal"."_materialized_hypertable_23" USING "btree" ("site_code", "equipment_name", "day_bucket");


--
-- Name: idx_cagg_perf_1h_site_equipment_time; Type: INDEX; Schema: _timescaledb_internal; Owner: -
--

CREATE INDEX "idx_cagg_perf_1h_site_equipment_time" ON "_timescaledb_internal"."_materialized_hypertable_22" USING "btree" ("site_code", "equipment_name", "hour_bucket");


--
-- Name: idx_ddo_site_equipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_ddo_site_equipment" ON "public"."device_display_override" USING "btree" ("site_code", "equipment_id");


--
-- Name: idx_enhanced_actions_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_enhanced_actions_session" ON "public"."enhanced_export_actions" USING "btree" ("session_id", "timestamp" DESC);


--
-- Name: idx_enhanced_actions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_enhanced_actions_type" ON "public"."enhanced_export_actions" USING "btree" ("action_type", "timestamp" DESC);


--
-- Name: idx_enhanced_export_sessions_datacenter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_enhanced_export_sessions_datacenter" ON "public"."enhanced_export_sessions" USING "btree" ("data_center_id", "start_time" DESC);


--
-- Name: idx_enhanced_export_sessions_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_enhanced_export_sessions_site" ON "public"."enhanced_export_sessions" USING "btree" ("site_code", "start_time" DESC);


--
-- Name: idx_enhanced_export_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_enhanced_export_sessions_status" ON "public"."enhanced_export_sessions" USING "btree" ("status", "start_time" DESC);


--
-- Name: idx_enhanced_step_logs_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_enhanced_step_logs_session" ON "public"."enhanced_export_step_logs" USING "btree" ("session_id", "step_number");


--
-- Name: idx_enhanced_step_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_enhanced_step_logs_status" ON "public"."enhanced_export_step_logs" USING "btree" ("status", "start_time" DESC);


--
-- Name: idx_equipment_aliases_site_equipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_equipment_aliases_site_equipment" ON "public"."equipment_aliases" USING "btree" ("site_code", "equipment_id");


--
-- Name: idx_equipment_datacenter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_equipment_datacenter" ON "public"."equipment" USING "btree" ("data_center_id");


--
-- Name: idx_equipment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_equipment_id" ON "public"."equipment" USING "btree" ("equipment_id");


--
-- Name: idx_equipment_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_equipment_name" ON "public"."equipment" USING "btree" ("equipment_name");


--
-- Name: idx_equipment_overrides_site_equipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_equipment_overrides_site_equipment" ON "public"."equipment_name_overrides" USING "btree" ("site_code", "equipment_id");


--
-- Name: idx_equipment_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_equipment_site" ON "public"."equipment" USING "btree" ("site_code", "data_center_id");


--
-- Name: idx_export_downloads_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_downloads_session_id" ON "public"."export_downloads" USING "btree" ("session_id");


--
-- Name: idx_export_interactions_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_interactions_session_id" ON "public"."export_interactions" USING "btree" ("session_id");


--
-- Name: idx_export_interactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_interactions_type" ON "public"."export_interactions" USING "btree" ("interaction_type");


--
-- Name: idx_export_log_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_log_date" ON "public"."export_web_log" USING "btree" ("export_date");


--
-- Name: idx_export_log_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_log_status" ON "public"."export_web_log" USING "btree" ("status");


--
-- Name: idx_export_page_visits_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_page_visits_session_id" ON "public"."export_page_visits" USING "btree" ("session_id");


--
-- Name: idx_export_page_visits_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_page_visits_timestamp" ON "public"."export_page_visits" USING "btree" ("timestamp");


--
-- Name: idx_export_performance_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_performance_session_id" ON "public"."export_performance" USING "btree" ("session_id");


--
-- Name: idx_export_sessions_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_sessions_session_id" ON "public"."export_sessions" USING "btree" ("session_id");


--
-- Name: idx_export_sessions_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_sessions_start_time" ON "public"."export_sessions" USING "btree" ("start_time");


--
-- Name: idx_export_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_sessions_status" ON "public"."export_sessions" USING "btree" ("status");


--
-- Name: idx_export_step_logs_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_step_logs_session_id" ON "public"."export_step_logs" USING "btree" ("session_id");


--
-- Name: idx_export_step_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_step_logs_status" ON "public"."export_step_logs" USING "btree" ("status");


--
-- Name: idx_export_step_logs_step_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_export_step_logs_step_number" ON "public"."export_step_logs" USING "btree" ("step_number");


--
-- Name: idx_fault_import_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_import_session" ON "public"."fault_data_import_logs" USING "btree" ("import_session_id", "status");


--
-- Name: idx_fault_perf_data_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_perf_data_type" ON "public"."fault_performance_data" USING "btree" ("performance_data", "statistical_period");


--
-- Name: idx_fault_perf_equipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_perf_equipment" ON "public"."fault_performance_data" USING "btree" ("equipment_name", "equipment_id");


--
-- Name: idx_fault_perf_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_perf_id" ON "public"."fault_performance_data" USING "btree" ("id");


--
-- Name: idx_fault_perf_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_perf_name" ON "public"."fault_performance_data" USING "btree" ("equipment_name");


--
-- Name: idx_fault_perf_site_eq; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_perf_site_eq" ON "public"."fault_performance_data" USING "btree" ("site_code", "equipment_id");


--
-- Name: idx_fault_perf_site_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_perf_site_time" ON "public"."fault_performance_data" USING "btree" ("site_code", "statistical_start_time");


--
-- Name: idx_fault_perf_source_file; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_perf_source_file" ON "public"."fault_performance_data" USING "btree" ("source_file", "import_timestamp");


--
-- Name: idx_fault_perf_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_perf_time" ON "public"."fault_performance_data" USING "btree" ("statistical_start_time" DESC);


--
-- Name: idx_fault_performance_data_metric_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_performance_data_metric_time" ON "public"."fault_performance_data" USING "btree" ("performance_data", "statistical_start_time");


--
-- Name: idx_fault_performance_data_site_equipment_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_fault_performance_data_site_equipment_time" ON "public"."fault_performance_data" USING "btree" ("site_code", "equipment_name", "statistical_start_time");


--
-- Name: idx_import_logs_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_import_logs_session" ON "public"."data_import_logs" USING "btree" ("session_id", "start_time" DESC);


--
-- Name: idx_import_logs_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_import_logs_site" ON "public"."data_import_logs" USING "btree" ("site_code", "start_time" DESC);


--
-- Name: idx_import_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_import_logs_status" ON "public"."data_import_logs" USING "btree" ("status", "start_time" DESC);


--
-- Name: idx_mdod_site_dev_met; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_mdod_site_dev_met" ON "public"."metric_display_override_device" USING "btree" ("site_code", "equipment_id", "metric_name");


--
-- Name: idx_mdos_site_metric; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_mdos_site_metric" ON "public"."metric_display_override_site" USING "btree" ("site_code", "metric_name");


--
-- Name: idx_metric_aliases_site_metric; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_metric_aliases_site_metric" ON "public"."metric_aliases" USING "btree" ("site_code", "metric_key");


--
-- Name: idx_perf_data_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_perf_data_type" ON "public"."performance_data" USING "btree" ("performance_data", "statistical_period");


--
-- Name: idx_perf_equipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_perf_equipment" ON "public"."performance_data" USING "btree" ("equipment_name", "equipment_id");


--
-- Name: idx_perf_import_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_perf_import_session" ON "public"."performance_data_import_logs" USING "btree" ("import_session_id", "status");


--
-- Name: idx_perf_site_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_perf_site_time" ON "public"."performance_data" USING "btree" ("site_code", "statistical_start_time");


--
-- Name: idx_perf_source_file; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_perf_source_file" ON "public"."performance_data" USING "btree" ("source_file", "import_timestamp");


--
-- Name: idx_perf_upsert; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_perf_upsert" ON "public"."performance_data" USING "btree" ("site_code", "equipment_name", "equipment_id", "performance_data", "statistical_start_time", "statistical_period");


--
-- Name: idx_perf_value_numeric; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_perf_value_numeric" ON "public"."performance_data" USING "btree" ("value_numeric") WHERE ("value_numeric" IS NOT NULL);


--
-- Name: idx_performance_data_2025_08_equipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_data_2025_08_equipment" ON "public"."performance_data_2025_08" USING "btree" ("equipment_id");


--
-- Name: idx_performance_data_2025_08_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_data_2025_08_time" ON "public"."performance_data_2025_08" USING "btree" ("time");


--
-- Name: idx_performance_data_2025_09_equipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_data_2025_09_equipment" ON "public"."performance_data_2025_09" USING "btree" ("equipment_id");


--
-- Name: idx_performance_data_2025_09_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_data_2025_09_time" ON "public"."performance_data_2025_09" USING "btree" ("time");


--
-- Name: idx_performance_data_2025_10_equipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_data_2025_10_equipment" ON "public"."performance_data_2025_10" USING "btree" ("equipment_id");


--
-- Name: idx_performance_data_2025_10_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_data_2025_10_time" ON "public"."performance_data_2025_10" USING "btree" ("time");


--
-- Name: idx_performance_data_metric_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_data_metric_time" ON "public"."performance_data" USING "btree" ("performance_data", "statistical_start_time");


--
-- Name: idx_performance_data_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_data_site" ON ONLY "public"."performance_data_old" USING "btree" ("site_code", "time" DESC);


--
-- Name: idx_performance_data_site_equipment_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_data_site_equipment_time" ON "public"."performance_data" USING "btree" ("site_code", "equipment_name", "statistical_start_time");


--
-- Name: idx_performance_stats_datacenter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_stats_datacenter" ON "public"."pipeline_performance_stats" USING "btree" ("data_center_id", "created_at" DESC);


--
-- Name: idx_performance_stats_site; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_performance_stats_site" ON "public"."pipeline_performance_stats" USING "btree" ("site_code", "created_at" DESC);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");


--
-- Name: ix_performance_data_equipment_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ix_performance_data_equipment_time" ON "public"."performance_data" USING "btree" ("equipment_id", "statistical_start_time");


--
-- Name: INDEX "ix_performance_data_equipment_time"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX "public"."ix_performance_data_equipment_time" IS 'Composite index for equipment-specific time queries';


--
-- Name: ix_performance_data_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ix_performance_data_time" ON "public"."performance_data" USING "btree" ("statistical_start_time");


--
-- Name: INDEX "ix_performance_data_time"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX "public"."ix_performance_data_time" IS 'Index for time-based performance queries';


--
-- Name: ix_performance_import_logs_hash_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ix_performance_import_logs_hash_time" ON "public"."performance_data_import_logs" USING "btree" ("file_hash", "processing_start_time") WHERE (("status")::"text" = 'completed'::"text");


--
-- Name: INDEX "ix_performance_import_logs_hash_time"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX "public"."ix_performance_import_logs_hash_time" IS 'Index for fast duplicate file detection within 30 days';


--
-- Name: performance_data_2025_08_site_code_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "performance_data_2025_08_site_code_time_idx" ON "public"."performance_data_2025_08" USING "btree" ("site_code", "time" DESC);


--
-- Name: performance_data_2025_09_site_code_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "performance_data_2025_09_site_code_time_idx" ON "public"."performance_data_2025_09" USING "btree" ("site_code", "time" DESC);


--
-- Name: performance_data_2025_10_site_code_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "performance_data_2025_10_site_code_time_idx" ON "public"."performance_data_2025_10" USING "btree" ("site_code", "time" DESC);


--
-- Name: performance_data_statistical_start_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "performance_data_statistical_start_time_idx" ON "public"."performance_data" USING "btree" ("statistical_start_time" DESC);


--
-- Name: uq_perf_equipment_site_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "uq_perf_equipment_site_id" ON "public"."performance_equipment_master" USING "btree" ("site_code", "equipment_id");


--
-- Name: performance_data_2025_08_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX "public"."performance_data_pkey1" ATTACH PARTITION "public"."performance_data_2025_08_pkey";


--
-- Name: performance_data_2025_08_site_code_time_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX "public"."idx_performance_data_site" ATTACH PARTITION "public"."performance_data_2025_08_site_code_time_idx";


--
-- Name: performance_data_2025_08_time_equipment_id_metric_id_statis_key; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX "public"."performance_data_time_equipment_id_metric_id_statistical_p_key1" ATTACH PARTITION "public"."performance_data_2025_08_time_equipment_id_metric_id_statis_key";


--
-- Name: performance_data_2025_09_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX "public"."performance_data_pkey1" ATTACH PARTITION "public"."performance_data_2025_09_pkey";


--
-- Name: performance_data_2025_09_site_code_time_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX "public"."idx_performance_data_site" ATTACH PARTITION "public"."performance_data_2025_09_site_code_time_idx";


--
-- Name: performance_data_2025_09_time_equipment_id_metric_id_statis_key; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX "public"."performance_data_time_equipment_id_metric_id_statistical_p_key1" ATTACH PARTITION "public"."performance_data_2025_09_time_equipment_id_metric_id_statis_key";


--
-- Name: performance_data_2025_10_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX "public"."performance_data_pkey1" ATTACH PARTITION "public"."performance_data_2025_10_pkey";


--
-- Name: performance_data_2025_10_site_code_time_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX "public"."idx_performance_data_site" ATTACH PARTITION "public"."performance_data_2025_10_site_code_time_idx";


--
-- Name: performance_data_2025_10_time_equipment_id_metric_id_statis_key; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX "public"."performance_data_time_equipment_id_metric_id_statistical_p_key1" ATTACH PARTITION "public"."performance_data_2025_10_time_equipment_id_metric_id_statis_key";


--
-- Name: _hyper_13_94_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_hyper_13_94_chunk" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('13');


--
-- Name: _hyper_13_95_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_hyper_13_95_chunk" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('13');


--
-- Name: _hyper_13_96_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_hyper_13_96_chunk" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('13');


--
-- Name: _hyper_22_45_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_hyper_22_45_chunk" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('22');


--
-- Name: _hyper_24_47_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_hyper_24_47_chunk" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('24');


--
-- Name: _hyper_5_100_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_hyper_5_100_chunk" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('5');


--
-- Name: _hyper_5_97_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_hyper_5_97_chunk" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('5');


--
-- Name: _hyper_5_98_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_hyper_5_98_chunk" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('5');


--
-- Name: _hyper_5_99_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_hyper_5_99_chunk" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('5');


--
-- Name: _materialized_hypertable_22 ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_materialized_hypertable_22" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('22');


--
-- Name: _materialized_hypertable_24 ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "_timescaledb_internal"."_materialized_hypertable_24" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('24');


--
-- Name: _compressed_hypertable_26 ts_insert_blocker; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_insert_blocker" BEFORE INSERT ON "_timescaledb_internal"."_compressed_hypertable_26" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."insert_blocker"();


--
-- Name: _compressed_hypertable_6 ts_insert_blocker; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_insert_blocker" BEFORE INSERT ON "_timescaledb_internal"."_compressed_hypertable_6" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."insert_blocker"();


--
-- Name: _materialized_hypertable_22 ts_insert_blocker; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_insert_blocker" BEFORE INSERT ON "_timescaledb_internal"."_materialized_hypertable_22" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."insert_blocker"();


--
-- Name: _materialized_hypertable_23 ts_insert_blocker; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_insert_blocker" BEFORE INSERT ON "_timescaledb_internal"."_materialized_hypertable_23" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."insert_blocker"();


--
-- Name: _materialized_hypertable_24 ts_insert_blocker; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_insert_blocker" BEFORE INSERT ON "_timescaledb_internal"."_materialized_hypertable_24" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."insert_blocker"();


--
-- Name: _materialized_hypertable_25 ts_insert_blocker; Type: TRIGGER; Schema: _timescaledb_internal; Owner: -
--

CREATE TRIGGER "ts_insert_blocker" BEFORE INSERT ON "_timescaledb_internal"."_materialized_hypertable_25" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."insert_blocker"();


--
-- Name: fault_performance_data ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."fault_performance_data" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('5');


--
-- Name: performance_data ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "ts_cagg_invalidation_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."performance_data" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."continuous_agg_invalidation_trigger"('13');


--
-- Name: fault_performance_data ts_insert_blocker; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "ts_insert_blocker" BEFORE INSERT ON "public"."fault_performance_data" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."insert_blocker"();


--
-- Name: performance_data ts_insert_blocker; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "ts_insert_blocker" BEFORE INSERT ON "public"."performance_data" FOR EACH ROW EXECUTE FUNCTION "_timescaledb_functions"."insert_blocker"();


--
-- Name: data_centers update_data_centers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "update_data_centers_updated_at" BEFORE UPDATE ON "public"."data_centers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: enhanced_export_sessions update_enhanced_export_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "update_enhanced_export_sessions_updated_at" BEFORE UPDATE ON "public"."enhanced_export_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_enhanced_updated_at_column"();


--
-- Name: equipment update_equipment_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "update_equipment_updated_at" BEFORE UPDATE ON "public"."equipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: export_sessions update_export_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "update_export_sessions_updated_at" BEFORE UPDATE ON "public"."export_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: performance_equipment_master update_performance_equipment_master_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "update_performance_equipment_master_updated_at" BEFORE UPDATE ON "public"."performance_equipment_master" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: data_import_logs data_import_logs_data_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."data_import_logs"
    ADD CONSTRAINT "data_import_logs_data_center_id_fkey" FOREIGN KEY ("data_center_id") REFERENCES "public"."data_centers"("id") ON DELETE CASCADE;


--
-- Name: data_import_logs data_import_logs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."data_import_logs"
    ADD CONSTRAINT "data_import_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."enhanced_export_sessions"("session_id") ON DELETE CASCADE;


--
-- Name: enhanced_export_actions enhanced_export_actions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_actions"
    ADD CONSTRAINT "enhanced_export_actions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."enhanced_export_sessions"("session_id") ON DELETE CASCADE;


--
-- Name: enhanced_export_sessions enhanced_export_sessions_data_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_sessions"
    ADD CONSTRAINT "enhanced_export_sessions_data_center_id_fkey" FOREIGN KEY ("data_center_id") REFERENCES "public"."data_centers"("id") ON DELETE CASCADE;


--
-- Name: enhanced_export_step_logs enhanced_export_step_logs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."enhanced_export_step_logs"
    ADD CONSTRAINT "enhanced_export_step_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."enhanced_export_sessions"("session_id") ON DELETE CASCADE;


--
-- Name: equipment equipment_data_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_data_center_id_fkey" FOREIGN KEY ("data_center_id") REFERENCES "public"."data_centers"("id") ON DELETE CASCADE;


--
-- Name: export_downloads export_downloads_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_downloads"
    ADD CONSTRAINT "export_downloads_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."export_sessions"("session_id") ON DELETE CASCADE;


--
-- Name: export_interactions export_interactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_interactions"
    ADD CONSTRAINT "export_interactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."export_sessions"("session_id") ON DELETE CASCADE;


--
-- Name: export_page_visits export_page_visits_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_page_visits"
    ADD CONSTRAINT "export_page_visits_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."export_sessions"("session_id") ON DELETE CASCADE;


--
-- Name: export_performance export_performance_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_performance"
    ADD CONSTRAINT "export_performance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."export_sessions"("session_id") ON DELETE CASCADE;


--
-- Name: export_step_logs export_step_logs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."export_step_logs"
    ADD CONSTRAINT "export_step_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."export_sessions"("session_id") ON DELETE CASCADE;


--
-- Name: performance_data_old performance_data_equipment_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE "public"."performance_data_old"
    ADD CONSTRAINT "performance_data_equipment_id_fkey1" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE CASCADE;


--
-- Name: performance_data_old performance_data_metric_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE "public"."performance_data_old"
    ADD CONSTRAINT "performance_data_metric_id_fkey1" FOREIGN KEY ("metric_id") REFERENCES "public"."performance_metrics"("id") ON DELETE CASCADE;


--
-- Name: pipeline_performance_stats pipeline_performance_stats_data_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pipeline_performance_stats"
    ADD CONSTRAINT "pipeline_performance_stats_data_center_id_fkey" FOREIGN KEY ("data_center_id") REFERENCES "public"."data_centers"("id") ON DELETE CASCADE;


--
-- Name: pipeline_performance_stats pipeline_performance_stats_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pipeline_performance_stats"
    ADD CONSTRAINT "pipeline_performance_stats_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."enhanced_export_sessions"("session_id") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict xzcwInUytySHENfdMfnhpdJOFioILdVi4VbvupdsMcJlmI9BLMb14vWXyVrbXUO


-- === end pg_dump -s ===

-- ================== TimescaleDB: Hypertable Settings ==================
-- Set chunk time interval for "_timescaledb_internal"."_materialized_hypertable_22"
SELECT set_chunk_time_interval("_timescaledb_internal"||'.'||"_materialized_hypertable_22", INTERVAL '6048000.0 seconds');
-- Set chunk time interval for "_timescaledb_internal"."_materialized_hypertable_23"
SELECT set_chunk_time_interval("_timescaledb_internal"||'.'||"_materialized_hypertable_23", INTERVAL '6048000.0 seconds');
-- Set chunk time interval for "_timescaledb_internal"."_materialized_hypertable_24"
SELECT set_chunk_time_interval("_timescaledb_internal"||'.'||"_materialized_hypertable_24", INTERVAL '6048000.0 seconds');
-- Set chunk time interval for "_timescaledb_internal"."_materialized_hypertable_25"
SELECT set_chunk_time_interval("_timescaledb_internal"||'.'||"_materialized_hypertable_25", INTERVAL '6048000.0 seconds');
-- Set chunk time interval for "public"."fault_performance_data"
SELECT set_chunk_time_interval("public"||'.'||"fault_performance_data", INTERVAL '604800.0 seconds');
-- Set chunk time interval for "public"."performance_data"
SELECT set_chunk_time_interval("public"||'.'||"performance_data", INTERVAL '604800.0 seconds');

-- ================== TimescaleDB: Policies via Background Jobs ==================
-- (No TimescaleDB background policies found)

-- Views and materialized hypertables for CAGGs should be included in the pg_dump -s section above.
-- If pg_dump was unavailable, please export view definitions separately as needed.

-- ================== End of Export ==================

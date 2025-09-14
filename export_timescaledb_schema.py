#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Export PostgreSQL + TimescaleDB schema-only (no data) including:
- Base schema (tables, views, functions, triggers, indexes) via pg_dump -s (if available)
- TimescaleDB hypertable settings: chunk interval, compression (on/off, orderby/segmentby)
- TimescaleDB policies: retention, compression, reorder
- Continuous aggregate refresh policies (add_continuous_aggregate_policy)
- CREATE EXTENSION timescaledb (if missing in pg_dump)

Requirements:
  pip install psycopg2-binary

Usage:
  export POSTGRES_HOST=...
  export POSTGRES_PORT=...
  export POSTGRES_DB=...
  export POSTGRES_USER=...
  export POSTGRES_PASSWORD=...
  python3 export_timescaledb_schema.py --outfile ecc800_schema_export.sql
"""

import argparse
import json
import os
import shlex
import subprocess
import sys
from datetime import datetime

import psycopg2
from psycopg2.extras import RealDictCursor

def env(name, default=None, required=False):
    v = os.environ.get(name, default)
    if required and (v is None or v == ""):
        sys.stderr.write(f"ERROR: missing env {name}\n")
        sys.exit(1)
    return v

def q_ident(name: str) -> str:
    """Quote identifier safely."""
    if name is None:
        return '""'
    # double quotes inside identifier should be doubled
    return '"' + name.replace('"', '""') + '"'

def q_qual(schema: str, name: str) -> str:
    return f"{q_ident(schema)}.{q_ident(name)}"

def run_pg_dump_schema(outfp, host, port, db, user):
    """Try pg_dump -s; return True if succeeded, False otherwise."""
    cmd = [
        "pg_dump",
        "-h", host,
        "-p", str(port),
        "-U", user,
        "-d", db,
        "-s",              # schema-only
        "--no-owner",
        "--no-privileges",
        "--quote-all-identifiers",
    ]
    # Inherit PGPASSWORD from env if present
    envp = os.environ.copy()
    try:
        proc = subprocess.run(
            cmd, env=envp, capture_output=True, text=True, check=False
        )
        if proc.returncode == 0:
            outfp.write("-- === pg_dump -s (schema only) ===\n")
            outfp.write(proc.stdout)
            outfp.write("\n-- === end pg_dump -s ===\n\n")
            return True
        else:
            sys.stderr.write(
                f"[WARN] pg_dump failed (code {proc.returncode}). stderr:\n{proc.stderr}\n"
            )
            outfp.write("-- NOTE: pg_dump -s failed; continuing with TimescaleDB-specific export.\n\n")
            return False
    except FileNotFoundError:
        sys.stderr.write("[WARN] pg_dump not found in PATH; skip base schema dump.\n")
        outfp.write("-- NOTE: pg_dump not found; continuing with TimescaleDB-specific export.\n\n")
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--outfile", default=f"schema_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql")
    args = parser.parse_args()

    host = env("POSTGRES_HOST", required=True)
    port = int(env("POSTGRES_PORT", "5432"))
    db   = env("POSTGRES_DB", required=True)
    user = env("POSTGRES_USER", required=True)
    pwd  = env("POSTGRES_PASSWORD", required=True)

    conn = psycopg2.connect(
        host=host, port=port, dbname=db, user=user, password=pwd
    )
    conn.autocommit = True

    with open(args.outfile, "w", encoding="utf-8") as out:
        out.write("-- ==============================================================\n")
        out.write("-- Schema Export (PostgreSQL + TimescaleDB)\n")
        out.write(f"-- Database : {db}\n")
        out.write(f"-- Host     : {host}:{port}\n")
        out.write(f"-- User     : {user}\n")
        out.write(f"-- Generated: {datetime.now().isoformat(timespec='seconds')}\n")
        out.write("-- NOTE     : Structure & settings only (no data)\n")
        out.write("-- ==============================================================\n\n")

        # Ensure CREATE EXTENSION timescaledb appears (pg_dump usually includes it, but add guard)
        out.write("-- Ensure TimescaleDB extension exists\n")
        out.write("CREATE EXTENSION IF NOT EXISTS timescaledb;\n\n")

        # 1) Base schema via pg_dump -s (if available)
        run_pg_dump_schema(out, host, port, db, user)

        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 2) Map hypertable_id -> (schema, table)
        cur.execute("""
            SELECT id, schema_name, table_name
            FROM _timescaledb_catalog.hypertable
            ORDER BY id;
        """)
        ht_map = {row["id"]: (row["schema_name"], row["table_name"]) for row in cur.fetchall()}

        # Helper: reloptions (to detect compression settings like compress_orderby/segmentby)
        def get_reloptions(schema, table):
            cur.execute("""
                SELECT c.reloptions
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = %s AND c.relname = %s;
            """, (schema, table))
            r = cur.fetchone()
            return r["reloptions"] if r and r["reloptions"] else []

        # 3) Hypertable info (chunk interval, compression enabled)
        out.write("-- ================== TimescaleDB: Hypertable Settings ==================\n")
        cur.execute("""
            SELECT
              h.schema_name    AS hypertable_schema,
              h.table_name     AS hypertable_name,
              d.interval_length AS chunk_interval     -- in microseconds (time dimension)
            FROM _timescaledb_catalog.hypertable h
            LEFT JOIN _timescaledb_catalog.dimension d
              ON d.hypertable_id = h.id AND d.interval_length IS NOT NULL
            ORDER BY h.schema_name, h.table_name;
        """)
        rows = cur.fetchall()
        if not rows:
            out.write("-- (No hypertables found)\n\n")
        for row in rows:
            sch = row["hypertable_schema"]; tbl = row["hypertable_name"]
            fq = q_qual(sch, tbl)
            chunk_us = row["chunk_interval"]

            # Chunk interval (convert microseconds -> INTERVAL text)
            if chunk_us is not None:
                seconds = int(chunk_us) / 1_000_000.0
                out.write(f"-- Set chunk time interval for {fq}\n")
                out.write(f"SELECT set_chunk_time_interval({q_ident(sch)}||'.'||{q_ident(tbl)}, INTERVAL '{seconds} seconds');\n")

            # Compression flags & settings from reloptions
            relopts = get_reloptions(sch, tbl)
            relmap = {}
            for opt in relopts:
                # opt like "timescaledb.compress_orderby=ts DESC, id"
                if "=" in opt:
                    k, v = opt.split("=", 1)
                    relmap[k] = v

            # Check if compression is enabled via reloptions
            compress_enabled = any(k.startswith("timescaledb.compress") for k in relmap)
            
            if compress_enabled:
                out.write(f"\n-- Enable and configure compression for {fq} (if not already)\n")
                # Always set compress=true if flagged
                out.write(f"ALTER TABLE {fq} SET (timescaledb.compress = 'true');\n")
                # Orderby
                orderby = relmap.get("timescaledb.compress_orderby")
                if orderby:
                    out.write(f"ALTER TABLE {fq} SET (timescaledb.compress_orderby = '{orderby}');\n")
                # Segmentby
                segmentby = relmap.get("timescaledb.compress_segmentby")
                if segmentby:
                    out.write(f"ALTER TABLE {fq} SET (timescaledb.compress_segmentby = '{segmentby}');\n")
                out.write("\n")

        out.write("\n")

        # 4) Policies (retention, compression, reorder, cagg refresh) from jobs
        out.write("-- ================== TimescaleDB: Policies via Background Jobs ==================\n")
        cur.execute("""
            SELECT job_id, proc_schema, proc_name, schedule_interval, config::text AS config
            FROM timescaledb_information.jobs
            WHERE proc_schema = 'timescaledb'
              AND proc_name IN ('policy_retention','policy_compression','policy_reorder','policy_refresh_continuous_aggregate')
            ORDER BY job_id;
        """)
        jobs = cur.fetchall()
        if not jobs:
            out.write("-- (No TimescaleDB background policies found)\n\n")

        def ht_name_from_id(hid):
            if hid in ht_map:
                return ht_map[hid]
            return (None, None)

        for j in jobs:
            proc = j["proc_name"]
            cfg = {}
            try:
                cfg = json.loads(j["config"])
            except Exception:
                # In some versions, config may already be JSON-ish text
                pass
            sched = j["schedule_interval"]

            if proc == "policy_retention":
                hid = cfg.get("hypertable_id")
                older_than = cfg.get("drop_after") or cfg.get("older_than")
                sch, tbl = ht_name_from_id(hid)
                if sch and tbl and older_than:
                    out.write(f"-- Retention Policy for {q_qual(sch, tbl)} (schedule {sched})\n")
                    out.write(f"SELECT add_retention_policy({q_ident(sch)}||'.'||{q_ident(tbl)}, INTERVAL '{older_than}');\n\n")
                else:
                    out.write(f"-- [WARN] Could not resolve retention policy details from job {j['job_id']}\n\n")

            elif proc == "policy_compression":
                hid = cfg.get("hypertable_id")
                compress_after = cfg.get("compress_after") or cfg.get("older_than")
                sch, tbl = ht_name_from_id(hid)
                if sch and tbl and compress_after:
                    out.write(f"-- Compression Policy for {q_qual(sch, tbl)} (schedule {sched})\n")
                    out.write(f"SELECT add_compression_policy({q_ident(sch)}||'.'||{q_ident(tbl)}, INTERVAL '{compress_after}');\n\n")
                else:
                    out.write(f"-- [WARN] Could not resolve compression policy details from job {j['job_id']}\n\n")

            elif proc == "policy_reorder":
                hid = cfg.get("hypertable_id")
                index_name = cfg.get("index_name")
                sch, tbl = ht_name_from_id(hid)
                if sch and tbl and index_name:
                    out.write(f"-- Reorder Policy for {q_qual(sch, tbl)} (schedule {sched})\n")
                    out.write(f"SELECT add_reorder_policy({q_ident(sch)}||'.'||{q_ident(tbl)}, {q_ident(index_name)});\n\n")
                else:
                    out.write(f"-- [WARN] Could not resolve reorder policy details from job {j['job_id']}\n\n")

            elif proc == "policy_refresh_continuous_aggregate":
                # For CAGG refresh policy, config uses mat_hypertable_id
                mat_hid = cfg.get("mat_hypertable_id")
                start_offset = cfg.get("start_offset")  # e.g., "30 days"
                end_offset   = cfg.get("end_offset")    # might be null or "NULL"
                # Need the *view* name (not materialized hypertable) to call add_continuous_aggregate_policy
                # We can find view from _timescaledb_catalog.continuous_agg
                cur.execute("""
                    SELECT cagg.view_schema, cagg.view_name
                    FROM _timescaledb_catalog.continuous_agg cagg
                    JOIN _timescaledb_catalog.hypertable h
                      ON cagg.mat_hypertable_id = h.id
                    WHERE cagg.mat_hypertable_id = %s
                    LIMIT 1;
                """, (mat_hid,))
                v = cur.fetchone()
                if v and start_offset:
                    vsch, vname = v["view_schema"], v["view_name"]
                    out.write(f"-- Continuous Aggregate Refresh Policy for {q_qual(vsch, vname)} (schedule {sched})\n")
                    # Build function call with named args to be explicit
                    if end_offset and str(end_offset).upper() != "NULL":
                        out.write(
                            f"SELECT add_continuous_aggregate_policy({q_ident(vsch)}||'.'||{q_ident(vname)}, "
                            f" start_offset => INTERVAL '{start_offset}', end_offset => INTERVAL '{end_offset}', "
                            f" schedule_interval => INTERVAL '{sched}');\n\n"
                        )
                    else:
                        out.write(
                            f"SELECT add_continuous_aggregate_policy({q_ident(vsch)}||'.'||{q_ident(vname)}, "
                            f" start_offset => INTERVAL '{start_offset}', "
                            f" schedule_interval => INTERVAL '{sched}');\n\n"
                        )
                else:
                    out.write(f"-- [WARN] Could not resolve CAGG policy details from job {j['job_id']}\n\n")

        # 5) Views already covered by pg_dump -s, but we can add a reminder
        out.write("-- Views and materialized hypertables for CAGGs should be included in the pg_dump -s section above.\n")
        out.write("-- If pg_dump was unavailable, please export view definitions separately as needed.\n\n")

        out.write("-- ================== End of Export ==================\n")

    print(f"✅ Export complete: {args.outfile}")

if __name__ == "__main__":
    main()

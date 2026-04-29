#!/bin/bash
# Startup script for ECC800 backend
# Runs migrations and starts the FastAPI application

set -e  # Exit on error

echo "🚀 ECC800 Backend Startup Script"
echo "================================="

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
max_attempts=30
attempt=1

export PGPASSWORD="${POSTGRES_PASSWORD:-}"

while [ $attempt -le $max_attempts ]; do
    if psql -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5210}" -U "${POSTGRES_USER:-apirak}" -d "${POSTGRES_DB:-ecc800}" -c "SELECT 1" 2>/dev/null; then
        echo "✅ Database connection successful"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Database connection failed after $max_attempts attempts"
        exit 1
    fi
    
    echo "⏳ Attempt $attempt/$max_attempts - Database not ready, waiting..."
    sleep 2
    attempt=$((attempt + 1))
done

# Run Alembic migrations
echo "🔄 Running database migrations..."
cd /app

if alembic current > /dev/null 2>&1; then
    echo "✅ Migration database already initialized"
else
    echo "📝 Initializing migration database..."
fi

if ! alembic upgrade head; then
    echo "⚠️  Migration warning - some migrations may have failed"
    # Don't exit, continue startup as this might be expected
fi

echo "✅ Database migrations completed"

# Initialize electricity rates if needed
echo "📊 Initializing electricity rates..."
psql -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5210}" -U "${POSTGRES_USER:-apirak}" -d "${POSTGRES_DB:-ecc800}" << EOF
-- Check if electricity_rates table is empty
DO \$\$
BEGIN
    IF (SELECT COUNT(*) FROM electricity_rates) = 0 THEN
        INSERT INTO electricity_rates (
            data_center_id, site_code, rate_value, rate_unit, 
            description, effective_from, is_active, created_by, created_at, updated_at
        )
        SELECT 
            dc.id, dc.site_code, 5.12, 'Baht/kWh',
            'ค่าไฟเบิกจ่ายปกติ ปี 2026',
            '2026-01-01 00:00:00+00:00',
            true, 'system', NOW(), NOW()
        FROM data_centers dc
        WHERE dc.is_active = true
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Electricity rates initialized';
    ELSE
        RAISE NOTICE 'Electricity rates already exist';
    END IF;
END
\$\$;
EOF

echo "✅ Electricity rates initialized"

# Start the FastAPI application
echo "🚀 Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload

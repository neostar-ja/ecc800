# Metrics page: device-first selector and display name behaviour

What changed
- The Metrics UI (`/ecc800/metrics`) now requires the user to select a site -> then equipment (device) -> then metric.
- The equipment selector shows the equipment display name (field `display_name`) when available. If `display_name` is not present, it falls back to `equipment_name` or `equipment_id`.
- The metric list is filtered to show only metrics that have data for the selected equipment. The frontend calls the backend `/metrics` endpoint with `site_code` and `equipment_id` to get device-scoped metrics.

Frontend files changed
- `ecc800/frontend/src/pages/MetricsPage.tsx`
  - Enforced device-first selection order.
  - Uses `display_name` / `equipment_name` when rendering equipment list.
  - Fetches metrics via `useMetrics(siteCode, equipmentId)` so metric list contains only metrics that have data for that device.

Backend expectations
- `/ecc800/api/sites/{site_code}/equipment` should return an array of equipment objects with at least:
  - `equipment_id` (string) - unique identifier used as the value in selectors
  - `display_name` (string, optional) - admin/override display name
  - `equipment_name` (string, optional) - original name discovered from data

- `/ecc800/api/metrics` should accept query parameters `site_code` and `equipment_id` and return either:
  - `{ metrics: string[] }` (current shape used by frontend), or
  - `Array<{ metric_name: string, display_name?: string, data_points?: number }>` — both shapes are supported by the UI normalization added.

Testing notes
1. Build: `cd ecc800/frontend && npm run build` — build completed successfully during changes.
2. Manual smoke tests (example):
   - GET https://<host>/ecc800/api/sites
   - GET https://<host>/ecc800/api/sites/DC/equipment
   - GET https://<host>/ecc800/api/metrics?site_code=DC&equipment_id=EQUIP123

If any of these endpoints return a different schema, update the backend route(s) to include `display_name` on equipment and to respect `equipment_id` filtering for `/metrics`.

Follow-ups / improvements
- Add a small integration test that ensures `/metrics` respects `equipment_id` filtering.
- Optionally refactor API base path usage to ensure consistent `api` prefix handling across the project.

Done by automated edit on: 2025-08-30

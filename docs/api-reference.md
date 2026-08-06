# API Reference

The Flask backend exposes REST endpoints for temperature ingestion, dashboard data, alerts, and health checks.

Base URL for local setup:

```text
http://localhost:5000
```

## Health Check

```text
GET /health
```

Returns backend and database health status.

## Create Temperature Reading

```text
POST /api/temperature
```

Request body:

```json
{
  "train_id": "TRAIN-101",
  "coach_id": "C1",
  "axle_id": "A1",
  "temperature": 76.5
}
```

The backend classifies status automatically.

## Latest Readings

```text
GET /api/temperature/latest
GET /api/temperature/latest?limit=20
```

Returns latest readings grouped by train, coach, and axle.

## History

```text
GET /api/temperature/history
GET /api/temperature/history?limit=100
GET /api/temperature/history?train_id=TRAIN-101&coach_id=C1&axle_id=A1
```

Returns historical temperature records.

## Alerts

```text
GET /api/alerts
GET /api/alerts?limit=50
```

Returns warning and critical readings.

## Analytics Summary

```text
GET /api/analytics/summary
```

Returns total counts, status counts, average temperature, maximum temperature, and recent trend data.

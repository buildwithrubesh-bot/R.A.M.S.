# Railway Axle Temperature Monitoring Backend

Flask API for ESP32 axle temperature ingestion, PostgreSQL storage, live dashboard data, alerts, and analytics.

## Setup

From this folder:

```powershell
cd software\dashboard\Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
```

Set your PostgreSQL values in `.env`, then initialize the table:

```powershell
python init_db.py
```

Run the API:

```powershell
python app.py
```

The API runs at `http://localhost:5000`.

## Main Endpoints

- `GET /health`
- `POST /api/temperature`
- `GET /api/temperature/latest`
- `GET /api/temperature/history`
- `GET /api/alerts`
- `GET /api/analytics/summary`

## POST Body

```json
{
  "train_id": "TRAIN-101",
  "coach_id": "C1",
  "axle_id": "A1",
  "temperature": 76.5
}
```

Status is classified automatically:

- `NORMAL`: less than 70 C
- `WARNING`: 70 C to 89.9 C
- `CRITICAL`: 90 C and above

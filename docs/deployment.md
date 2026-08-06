# Deployment And Setup

This guide is for running the R.A.M.S prototype locally and preparing the project repository.

## 1. Backend Environment

From the backend folder:

```powershell
cd software\dashboard\Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit .env:

```text
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=true
DB_HOST=localhost
DB_PORT=5050
DB_NAME=RAMS
DB_USER=postgres
DB_PASSWORD=your_postgres_password
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 2. Database Setup

Create the PostgreSQL database, then initialize tables:

```powershell
python init_db.py
```

The schema stores train, coach, axle, temperature, status, and timestamp data.

## 3. Run Backend

```powershell
python app.py
```

Check:

```text
http://localhost:5000/health
```

## 4. Run Frontend

Open:

```text
software/dashboard/Frontend/index.html
```

The frontend expects the Flask backend at http://localhost:5000.

## 5. Firmware Setup

Open the Flask API firmware sketch:

```text
firmware/esp32-max6675-flask-api/esp32-max6675-flask-api.ino
```

Update:

- WIFI_SSID
- WIFI_PASSWORD
- API_URL
- train, coach, and axle IDs

For Supabase prototype testing, use:

```text
firmware/esp32-max6675-supabase/esp32-max6675-supabase.ino
```

## 6. Repository Workflow

```powershell
git status
git add .
git commit -m "Update R.A.M.S project"
git push
```

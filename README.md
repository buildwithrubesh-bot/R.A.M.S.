# R.A.M.S - Real-Time Axle-Box Monitoring System

R.A.M.S is an IoT prototype for continuous railway axle-box temperature monitoring. It uses an embedded sensing node, MAX6675/MAX31855 thermocouple sensing, wireless data transmission, a Flask/PostgreSQL backend, and a browser dashboard for real-time visibility, alerts, and historical trend analysis.

## Repository Structure

```text
Rams-Github/
  firmware/
    esp32-max6675-flask-api/     # ESP32 firmware for Flask/PostgreSQL setup
    esp32-max6675-supabase/      # ESP32 firmware for Supabase prototype setup
  software/
    dashboard/
      Backend/                   # Flask API, database scripts, optional Node/Express backend
      Frontend/                  # Browser dashboard prototype
  hardware/
    pcb/                         # PCB draft and preview image
  docs/                          # Project documentation
```

## System Overview

R.A.M.S follows a layered IoT architecture:

- Sensing layer: K-Type thermocouple with MAX6675/MAX31855 interface.
- Processing layer: ESP32 prototype node, with STM32/LoRaWAN as a field-deployment direction.
- Communication layer: WiFi + HTTP REST for prototype/backend communication.
- Application layer: Supabase for prototype testing, PostgreSQL + Flask REST API for controlled deployment, and a web dashboard for monitoring.

## Features

- ESP32 firmware for MAX6675 thermocouple readings.
- Flask API for temperature ingestion, health checks, latest readings, history, alerts, and analytics.
- PostgreSQL schema for persistent temperature logs.
- Browser-based dashboard for monitoring axle status.
- Alert classification: NORMAL, WARNING, CRITICAL.
- Hardware PCB reference assets.

## Quick Start

### Firmware

Open one sketch in Arduino IDE:

```text
firmware/esp32-max6675-flask-api/esp32-max6675-flask-api.ino
firmware/esp32-max6675-supabase/esp32-max6675-supabase.ino
```

Update WiFi credentials and endpoint values before uploading to ESP32.

### Backend

```powershell
cd software\dashboard\Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
python init_db.py
python app.py
```

The Flask API runs on http://localhost:5000.

### Frontend

Open after starting the backend:

```text
software/dashboard/Frontend/index.html
```

## Documentation

- docs/project-overview.md
- docs/deployment.md
- docs/hardware-notes.md


import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg2 import DatabaseError

from db import get_cursor

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)


def classify_temperature(temperature):
    if temperature >= 90:
        return "CRITICAL"
    if temperature >= 70:
        return "WARNING"
    return "NORMAL"


def serialize_log(row):
    return {
        "id": row["id"],
        "timestamp": row["timestamp"].isoformat() if isinstance(row["timestamp"], datetime) else row["timestamp"],
        "train_id": row["train_id"],
        "coach_id": row["coach_id"],
        "axle_id": row["axle_id"],
        "temperature": float(row["temperature"]),
        "status": row["status"],
    }


def create_app():
    app = Flask(__name__)
    cors_value = os.getenv("CORS_ORIGINS") or os.getenv("CORS_ORIGIN") or "http://localhost:3000,http://127.0.0.1:3000"
    cors_origins = [
        origin.strip()
        for origin in cors_value.split(",")
        if origin.strip()
    ]
    CORS(app, resources={r"/*": {"origins": cors_origins}})

    @app.get("/")
    def index():
        return jsonify({
            "service": "Railway Axle Temperature Monitoring API",
            "status": "running",
            "endpoints": {
                "health": "/health",
                "create_log": "POST /api/temperature",
                "latest": "GET /api/temperature/latest",
                "history": "GET /api/temperature/history",
                "alerts": "GET /api/alerts",
                "analytics": "GET /api/analytics/summary",
            },
        })

    @app.get("/health")
    def health():
        try:
            with get_cursor() as cursor:
                cursor.execute("SELECT 1 AS ok;")
                cursor.fetchone()
            return jsonify({"status": "healthy", "database": "connected"})
        except DatabaseError as exc:
            return jsonify({"status": "degraded", "database": "error", "error": str(exc)}), 503

    @app.post("/api/temperature")
    def create_temperature_log():
        payload = request.get_json(silent=True) or {}
        required_fields = ["train_id", "coach_id", "axle_id", "temperature"]
        missing = [field for field in required_fields if field not in payload]

        if missing:
            return jsonify({"error": "Missing required fields", "missing": missing}), 400

        try:
            temperature = float(payload["temperature"])
        except (TypeError, ValueError):
            return jsonify({"error": "temperature must be a number"}), 400

        train_id = str(payload["train_id"]).strip()
        coach_id = str(payload["coach_id"]).strip()
        axle_id = str(payload["axle_id"]).strip()

        if not train_id or not coach_id or not axle_id:
            return jsonify({"error": "train_id, coach_id, and axle_id cannot be empty"}), 400

        status = classify_temperature(temperature)

        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO axle_temperature_logs
                    (train_id, coach_id, axle_id, temperature, status)
                VALUES
                    (%s, %s, %s, %s, %s)
                RETURNING id, timestamp, train_id, coach_id, axle_id, temperature, status;
                """,
                (train_id, coach_id, axle_id, temperature, status),
            )
            row = cursor.fetchone()

        return jsonify({"message": "Temperature log stored", "data": serialize_log(row)}), 201

    @app.get("/api/temperature/latest")
    def latest_temperature_logs():
        limit = min(int(request.args.get("limit", 50)), 200)
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT DISTINCT ON (train_id, coach_id, axle_id)
                    id, timestamp, train_id, coach_id, axle_id, temperature, status
                FROM axle_temperature_logs
                ORDER BY train_id, coach_id, axle_id, timestamp DESC;
                """
            )
            rows = cursor.fetchall()[:limit]

        rows.sort(key=lambda item: item["timestamp"], reverse=True)
        return jsonify({"data": [serialize_log(row) for row in rows]})

    @app.get("/api/temperature/history")
    def temperature_history():
        limit = min(int(request.args.get("limit", 100)), 500)
        train_id = request.args.get("train_id")
        coach_id = request.args.get("coach_id")
        axle_id = request.args.get("axle_id")

        where = []
        params = []
        if train_id:
            where.append("train_id = %s")
            params.append(train_id)
        if coach_id:
            where.append("coach_id = %s")
            params.append(coach_id)
        if axle_id:
            where.append("axle_id = %s")
            params.append(axle_id)

        query = """
            SELECT id, timestamp, train_id, coach_id, axle_id, temperature, status
            FROM axle_temperature_logs
        """
        if where:
            query += " WHERE " + " AND ".join(where)
        query += " ORDER BY timestamp DESC LIMIT %s;"
        params.append(limit)

        with get_cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()

        return jsonify({"data": [serialize_log(row) for row in rows]})

    @app.get("/api/alerts")
    def alerts():
        limit = min(int(request.args.get("limit", 50)), 200)
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, timestamp, train_id, coach_id, axle_id, temperature, status
                FROM axle_temperature_logs
                WHERE status IN ('WARNING', 'CRITICAL')
                ORDER BY timestamp DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

        return jsonify({"data": [serialize_log(row) for row in rows]})

    @app.get("/api/analytics/summary")
    def analytics_summary():
        with get_cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_logs,
                    COUNT(*) FILTER (WHERE status = 'NORMAL') AS normal_count,
                    COUNT(*) FILTER (WHERE status = 'WARNING') AS warning_count,
                    COUNT(*) FILTER (WHERE status = 'CRITICAL') AS critical_count,
                    ROUND(AVG(temperature), 2) AS average_temperature,
                    ROUND(MAX(temperature), 2) AS max_temperature
                FROM axle_temperature_logs;
                """
            )
            summary = cursor.fetchone()

            cursor.execute(
                """
                SELECT
                    date_trunc('minute', timestamp) AS minute,
                    ROUND(AVG(temperature), 2) AS average_temperature,
                    MAX(temperature) AS max_temperature,
                    COUNT(*) AS samples
                FROM axle_temperature_logs
                WHERE timestamp >= NOW() - INTERVAL '1 hour'
                GROUP BY minute
                ORDER BY minute ASC;
                """
            )
            trend_rows = cursor.fetchall()

        return jsonify({
            "summary": {
                "total_logs": int(summary["total_logs"] or 0),
                "normal_count": int(summary["normal_count"] or 0),
                "warning_count": int(summary["warning_count"] or 0),
                "critical_count": int(summary["critical_count"] or 0),
                "average_temperature": float(summary["average_temperature"] or 0),
                "max_temperature": float(summary["max_temperature"] or 0),
            },
            "trend": [
                {
                    "minute": row["minute"].isoformat(),
                    "average_temperature": float(row["average_temperature"]),
                    "max_temperature": float(row["max_temperature"]),
                    "samples": int(row["samples"]),
                }
                for row in trend_rows
            ],
        })

    @app.errorhandler(DatabaseError)
    def handle_database_error(exc):
        return jsonify({"error": "Database operation failed", "details": str(exc)}), 500

    return app


app = create_app()


if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(host=host, port=port, debug=debug)

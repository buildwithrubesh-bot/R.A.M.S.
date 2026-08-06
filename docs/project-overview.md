# Project Overview

R.A.M.S, or Real-Time Axle-Box Monitoring System, is a prototype safety and maintenance system for railway axle-box temperature monitoring.

## Problem

Traditional railway axle monitoring methods such as trackside hot axle box detectors and manual inspection do not provide continuous per-axle data during the full journey. A bearing can overheat between inspection points, creating safety risk.

## Proposed Solution

R.A.M.S uses an onboard IoT node to continuously monitor axle-box temperature and send readings to a backend system. The backend stores temperature history, classifies readings, and exposes dashboard data for operators or maintenance personnel.

## Architecture

- Sensing: K-Type thermocouple connected through MAX6675/MAX31855.
- Processing: ESP32 prototype firmware; STM32/LoRaWAN considered for field expansion.
- Communication: WiFi and HTTP REST API in the prototype.
- Backend: Supabase for prototype testing or Flask + PostgreSQL for controlled deployment.
- Dashboard: browser UI for current status, alerts, history, and analytics.

## Prototype Scope

This repository represents the prototype implementation. It includes firmware, dashboard software, backend APIs, database schema, and PCB design references. Mechanical mounting, railway-grade ruggedization, and integration with railway SCADA/signaling systems are future work.

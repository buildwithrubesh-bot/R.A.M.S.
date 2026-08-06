# ESP32 MAX6675 Flask API Firmware

This Arduino sketch reads axle-box temperature through a MAX6675 thermocouple module and sends JSON data to the Flask API.

Update before flashing:

- WIFI_SSID
- WIFI_PASSWORD
- API_URL
- TRAIN_ID
- COACH_ID
- AXLE_ID

The backend endpoint is:

```text
POST /api/temperature
```

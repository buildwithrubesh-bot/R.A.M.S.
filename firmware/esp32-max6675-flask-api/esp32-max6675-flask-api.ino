#include <WiFi.h>
#include <HTTPClient.h>
#include <max6675.h>

// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Flask backend API. Replace with your computer LAN IP.
const char* API_URL = "http://192.168.1.10:5000/api/temperature";

// Train/node identification
const char* TRAIN_ID = "TRAIN-101";
const char* COACH_ID = "C1";
const char* AXLE_ID = "A1";

// MAX6675 pin configuration
#define MAX6675_SCK 18
#define MAX6675_CS 5
#define MAX6675_SO 19

MAX6675 thermocouple(MAX6675_SCK, MAX6675_CS, MAX6675_SO);

const unsigned long SEND_INTERVAL_MS = 15000;
unsigned long lastSendTime = 0;

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

float getTemperature() {
  float temperature = thermocouple.readCelsius();

  if (isnan(temperature)) {
    Serial.println("MAX6675 read error");
    return -1;
  }

  return temperature;
}

void sendTemperature(float temperature) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"train_id\":\"" + String(TRAIN_ID) + "\",";
  payload += "\"coach_id\":\"" + String(COACH_ID) + "\",";
  payload += "\"axle_id\":\"" + String(AXLE_ID) + "\",";
  payload += "\"temperature\":" + String(temperature, 2);
  payload += "}";

  int httpCode = http.POST(payload);

  Serial.println("--------------------------------");
  Serial.print("Temperature : ");
  Serial.print(temperature);
  Serial.println(" C");
  Serial.print("HTTP Code   : ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("Response    : ");
    Serial.println(response);
  } else {
    Serial.print("Error       : ");
    Serial.println(http.errorToString(httpCode));
  }

  Serial.println("--------------------------------");
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  connectWiFi();
  Serial.println("MAX6675 initialized");
}

void loop() {
  unsigned long currentTime = millis();

  if (currentTime - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = currentTime;
    float temperature = getTemperature();

    if (temperature >= 0) {
      sendTemperature(temperature);
    }
  }
}

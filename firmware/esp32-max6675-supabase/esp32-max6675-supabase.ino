#include <WiFi.h>
#include <HTTPClient.h>
#include <max6675.h>

// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Supabase REST endpoint and API key
const char* SUPABASE_URL = "https://YOUR_PROJECT.supabase.co/rest/v1/axle_monitor";
const char* SUPABASE_API_KEY = "YOUR_SUPABASE_ANON_OR_SERVICE_KEY";

// MAX6675 pin configuration
int thermoSO = 19;
int thermoCS = 5;
int thermoSCK = 18;

MAX6675 thermocouple(thermoSCK, thermoCS, thermoSO);

String classifyTemperature(float temperature) {
  if (temperature < 60) {
    return "NORMAL";
  }

  if (temperature < 80) {
    return "WARNING";
  }

  return "CRITICAL";
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  delay(500);
}

void loop() {
  float temperature = thermocouple.readCelsius();
  String status = classifyTemperature(temperature);

  Serial.print("Temperature: ");
  Serial.println(temperature);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SUPABASE_URL);

    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_API_KEY);
    http.addHeader("Prefer", "return=minimal");

    String jsonData = "{\"temperature\":" + String(temperature, 2) +
                      ",\"status\":\"" + status + "\"}";

    int httpResponseCode = http.POST(jsonData);

    Serial.print("HTTP Response: ");
    Serial.println(httpResponseCode);

    http.end();
  }

  delay(15000);
}

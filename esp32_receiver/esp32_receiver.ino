#include <HardwareSerial.h>
#include <WiFi.h>
#include <HTTPClient.h>

HardwareSerial LoraSerial(1); // UART1
const char* ssid = "---";
const char* password = "---";
String googleScriptURL = "---";

void setup() {
  Serial.begin(115200);
  LoraSerial.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17
  WiFi.begin(ssid, password);
  Serial.println("A ligar ao WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi conectado.");
}

void loop() {
  if (LoraSerial.available()) {
    String msg = LoraSerial.readStringUntil('\n');
    Serial.println("Recebido: " + msg);

    if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      String url = googleScriptURL + "?data=" + msg;
      http.begin(url);
      int httpResponseCode = http.GET();
      Serial.println("HTTP response: " + String(httpResponseCode));
      http.end();
    }
  }
}


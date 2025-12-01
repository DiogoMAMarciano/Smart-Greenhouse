#include <SoftwareSerial.h>

SoftwareSerial LoraSerial(10, 11); // RX, TX

void setup() {
  Serial.begin(9600);
  LoraSerial.begin(9600);
  Serial.println("Arduino pronto. Insere valores.");
}

void loop() {
  String temp, hum;
  
  Serial.println("Qual a temperatura?");
  while (Serial.available() == 0) {}
  temp = Serial.readStringUntil('\n');

  Serial.println("Qual a humidade?");
  while (Serial.available() == 0) {}
  hum = Serial.readStringUntil('\n');

  String msg = "T:" + temp + ";H:" + hum;
  LoraSerial.println(msg);

  Serial.println("Enviado: " + msg);
  delay(1000); // esperar 1 segundo antes do próximo envio
}


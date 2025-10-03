#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ================== CONFIGURAÇÕES DE SEGURANÇA ==================
// ID único para os nossos canais MQTT. Deve ser o mesmo no site.
const char* UNIQUE_ID = "geladeira-secreta-123";
// ==============================================================

// --- Configurações do Servo Motor (Trava da Geladeira) ---
const int pinoServo = 13;
const int POSICAO_TRAVADO = 0;
const int POSICAO_DESTRAVADO = 90;
Servo travaServo;

// --- Configurações de Rede e MQTT ---
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
String client_id = "esp32-geladeira-" + String(random(0xffff), HEX);
char command_topic[100];

// --- Clientes de Rede ---
WiFiClient espClient;
PubSubClient client(espClient);

// --- Funções ---

// Função chamada quando uma mensagem chega do servidor MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) { message += (char)payload[i]; }
  Serial.printf("Mensagem recebida [%s]: %s\n", topic, message.c_str());

  JsonDocument doc;
  if (deserializeJson(doc, message)) { return; }

  const char* action = doc["action"];

  // Se a ação for "abrir", destrava a geladeira
  if (strcmp(action, "abrir") == 0) {
    Serial.println("Comando para ABRIR recebido!");
    travaServo.write(POSICAO_DESTRAVADO);

    // Espera 5 segundos e trava novamente
    delay(5000);
    travaServo.write(POSICAO_TRAVADO);
    Serial.println("Travando novamente.");
  }
}

// Função para reconectar ao servidor MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("A tentar ligação MQTT...");
    if (client.connect(client_id.c_str())) {
      Serial.println("ligado!");
      // Subscreve ao tópico de comandos
      client.subscribe(command_topic);
    } else {
      Serial.printf("falhou, rc=%d. A tentar novamente em 5 segundos\n", client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  travaServo.attach(pinoServo);
  travaServo.write(POSICAO_TRAVADO); // Garante que começa travado

  // Cria o nome do tópico de comando com o ID secreto
  sprintf(command_topic, "geladeira/command/%s", UNIQUE_ID);

  WiFiManager wm;
  // Apaga as credenciais salvas para forçar nova configuração de Wi-Fi
  // wm.resetSettings(); 
  if (!wm.autoConnect("Configurar Geladeira", "senha123")) {
    ESP.restart();
  }

  Serial.printf("\nLigado ao Wi-Fi! IP: %s\n", WiFi.localIP().toString().c_str());
  
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); // Essencial para manter a comunicação MQTT
  delay(10);
}


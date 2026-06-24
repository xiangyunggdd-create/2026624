// --- 硬體測試模式 (Hardware Test) ---
// 這段程式碼不讀取感測器，只會不斷閃爍 LED
// 用來確認您的 LED 接線方向是否正確

// 定義接腳
#define PIN_LED_R 9
#define PIN_LED_Y 10
#define PIN_LED_G 11

void setup() {
  // 設定接腳為輸出模式
  pinMode(PIN_LED_R, OUTPUT);
  pinMode(PIN_LED_Y, OUTPUT);
  pinMode(PIN_LED_G, OUTPUT);

  // 開啟 Serial 以便除錯 (雖然這段程式碼主要看燈)
  Serial.begin(9600);
  Serial.println("LED Test Start...");
}

void loop() {
  // 1. 紅燈亮 (其他滅)
  Serial.println("Red ON");
  digitalWrite(PIN_LED_R, HIGH);
  digitalWrite(PIN_LED_Y, LOW);
  digitalWrite(PIN_LED_G, LOW);
  delay(1000); // 等待 1 秒

  // 2. 黃燈亮 (其他滅)
  Serial.println("Yellow ON");
  digitalWrite(PIN_LED_R, LOW);
  digitalWrite(PIN_LED_Y, HIGH);
  digitalWrite(PIN_LED_G, LOW);
  delay(1000); // 等待 1 秒

  // 3. 綠燈亮 (其他滅)
  Serial.println("Green ON");
  digitalWrite(PIN_LED_R, LOW);
  digitalWrite(PIN_LED_Y, LOW);
  digitalWrite(PIN_LED_G, HIGH);
  delay(1000); // 等待 1 秒
}

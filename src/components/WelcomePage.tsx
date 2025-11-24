import { useEffect, useState } from "react";
import type { WelcomePageProps } from "../types";
import { DebugPanel } from "./DebugPanel";

export function WelcomePage({
  firstName,
  lastName,
  debugLogs,
  setDebugLogs,
  showDebug,
  setShowDebug,
  isTelegramEnvironment,
  messageApiUrl,
}: WelcomePageProps) {
  const [messageText, setMessageText] = useState("");
  const [messageStatus, setMessageStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [messageStatusText, setMessageStatusText] = useState<string | null>(
    null
  );

  useEffect(() => {
    const urlLog = `🔗 messageApiUrl: ${messageApiUrl}`;
    setDebugLogs((prev) => [...prev, urlLog]);
  }, [messageApiUrl, setDebugLogs]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setMessageStatus("sending");
    setMessageStatusText(null);

    try {
      const response = await fetch(messageApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: messageText.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка: ${response.status}`);
      }

      await response.json(); // Проверяем что ответ валидный
      setMessageStatus("sent");
      setMessageStatusText("Сообщение отправлено!");
      setMessageText("");
    } catch (error) {
      setMessageStatus("error");
      setMessageStatusText(
        error instanceof Error ? error.message : "Ошибка при отправке"
      );
    }
  };

  return (
    <main className="app">
      <div className="card welcome-card">
        <h1>
          Привет, {firstName} {lastName}!
        </h1>
        <p className="welcome-message">
          Регистрация успешно завершена. Ваши данные сохранены в базу данных.
        </p>
        <p
          className="welcome-hint"
          style={{
            fontSize: "0.9rem",
            color: "var(--tg-muted)",
            marginTop: "12px",
          }}
        >
          💡 Проверьте чат с ботом для подтверждения сохранения данных
        </p>
      </div>

      {/* Форма для отправки сообщения */}
      <div className="card" style={{ marginTop: "16px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>
          Отправить сообщение
        </h2>
        <form onSubmit={handleSendMessage}>
          <label className="field">
            <span>Текст сообщения</span>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Введите текст..."
              disabled={messageStatus === "sending"}
            />
          </label>
          <button
            type="submit"
            className="submit"
            disabled={!messageText.trim() || messageStatus === "sending"}
          >
            {messageStatus === "sending" ? "Отправляем..." : "Послать"}
          </button>
          {messageStatusText && (
            <p className={`status status-${messageStatus}`}>
              {messageStatusText}
            </p>
          )}
        </form>
      </div>

      {/* Панель отладки на странице приветствия */}
      {isTelegramEnvironment && (
        <DebugPanel
          debugLogs={debugLogs}
          setDebugLogs={setDebugLogs}
          showDebug={showDebug}
          setShowDebug={setShowDebug}
        />
      )}
    </main>
  );
}

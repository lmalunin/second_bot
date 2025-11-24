import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { TelegramWindow, FormValues } from "./types";
import { RegistrationForm } from "./components/RegistrationForm";
import { WelcomePage } from "./components/WelcomePage";
import "./App.scss";
import { decodeStartParam } from "./utils/startParam";

function App() {
  const telegramApp = (window as TelegramWindow).Telegram?.WebApp;
  const isTelegramEnvironment = Boolean(telegramApp);
  const urlParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );

  /*   const clientConfig = useMemo(
    () => decodeStartParam(telegramApp?.initDataUnsafe?.start_param ?? null),
    [telegramApp]
  ); */

  // Стабилизируем addDebugLog (добавьте это перед useMemo для clientConfig)
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message); // Для fallback в обычном браузере
  }, []); // Нет deps, так как timestamp динамичный, но setDebugLogs стабилен

  // Теперь чистый useMemo без side-effects
  const clientConfig = useMemo(() => {
    const rawStartParam = telegramApp?.initDataUnsafe?.start_param ?? null;
    const fallbackParam = urlParams.get("tgWebAppStartParam") ?? null;
    const paramToUse = rawStartParam || fallbackParam;
    return decodeStartParam(paramToUse);
  }, [telegramApp, urlParams]); // Добавили urlParams в deps

  // Отдельный useEffect для логов (сработает после рендера, когда telegramApp готов)
  useEffect(() => {
    if (telegramApp) {
      const rawStartParam = telegramApp.initDataUnsafe?.start_param ?? null;
      const fallbackParam = urlParams.get("tgWebAppStartParam") ?? null;
      addDebugLog(`🔍 Raw start_param: "${rawStartParam}" (initDataUnsafe)`);
      addDebugLog(
        `🔍 Fallback tgWebAppStartParam: "${fallbackParam}" (from URL)`
      );
      addDebugLog(`🔧 clientConfig: ${JSON.stringify(clientConfig)}`); // ← Дополнительный лог для проверки возврата
    }
  }, [telegramApp, urlParams, addDebugLog, clientConfig]); // clientConfig в deps, чтобы лог обновлялся при изменении

  const messageApiUrl = clientConfig.backend ?? "";

  // Проверяем URL параметры для страницы приветствия
  const isWelcomePage = urlParams.get("welcome") === "1";
  const welcomeFirstName = urlParams.get("firstName") || "";
  const welcomeLastName = urlParams.get("lastName") || "";

  const defaultValues = useMemo<FormValues>(() => {
    const user = telegramApp?.initDataUnsafe?.user;
    return {
      firstName: user?.first_name ?? "",
      lastName: user?.last_name ?? "",
    };
  }, [telegramApp]);

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues,
    mode: "onChange",
  });

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  // Панель отладки для просмотра логов в Telegram WebApp
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!telegramApp) {
      return;
    }
    telegramApp.ready();
    telegramApp.expand();

    const root = document.documentElement;
    const theme = telegramApp.themeParams;
    if (theme?.bg_color) root.style.setProperty("--tg-bg", theme.bg_color);
    if (theme?.text_color)
      root.style.setProperty("--tg-text", theme.text_color);
    if (theme?.hint_color)
      root.style.setProperty("--tg-muted", theme.hint_color);
    if (theme?.button_color)
      root.style.setProperty("--tg-accent", theme.button_color);
    if (theme?.button_text_color)
      root.style.setProperty("--tg-accent-text", theme.button_text_color);
  }, [telegramApp]);

  // Функция для добавления логов в панель отладки
  /*   const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    //console.log(message); // Также в консоль для обычных браузеров
  }; */

  const onSubmit = handleSubmit(async (values) => {
    setStatus("sending");
    setStatusMessage(null);
    // НЕ очищаем логи - они должны сохраняться при переходе на страницу приветствия

    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      timestamp: new Date().toISOString(),
    };

    try {
      if (telegramApp) {
        addDebugLog("✅ telegramApp доступен");
        addDebugLog(`📤 Подготовка данных: ${JSON.stringify(payload)}`);

        // Используем sendData() для отправки данных боту
        // ВАЖНО: sendData() работает только если WebApp открыт через Reply Keyboard
        const dataString = JSON.stringify(payload);
        addDebugLog(`📦 Данные сериализованы: ${dataString.length} символов`);
        addDebugLog(
          `🔍 sendData доступен: ${typeof telegramApp.sendData === "function"}`
        );

        try {
          // Используем sendData() для отправки данных боту
          // WebApp закроется автоматически после sendData()
          // Бот сохранит данные и отправит кнопку "Продолжить" для открытия страницы приветствия
          addDebugLog("🚀 Вызов sendData()...");
          addDebugLog(
            "⚠️ Внимание: WebApp закроется автоматически после sendData()"
          );
          addDebugLog("💡 Бот сохранит данные и отправит кнопку 'Продолжить'");

          // Отправляем данные через sendData()
          // WebApp закроется автоматически
          // Бот получит данные, сохранит в db.json и отправит кнопку "Продолжить"
          telegramApp.sendData(dataString);
          addDebugLog("✅ sendData() вызван успешно!");
          addDebugLog("💡 WebApp закроется, бот отправит кнопку 'Продолжить'");

          setStatus("sent");
          setStatusMessage(
            "Данные отправлены! WebApp закроется, затем нажмите кнопку 'Продолжить' в чате."
          );
        } catch (sendError) {
          const errorMsg = `❌ Ошибка при вызове sendData(): ${sendError}`;
          addDebugLog(errorMsg);
          console.error("Error calling sendData():", sendError);
          throw sendError;
        }
      } else {
        // Фолбэк для тестирования вне Telegram
        console.log("Form payload (not in Telegram):", payload);
        setStatus("sent");
        setStatusMessage(
          "Форма работает. Откройте её через Telegram, чтобы завершить регистрацию."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      setStatus("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Что-то пошло не так. Попробуйте снова."
      );
    }
  });

  // Если это страница приветствия из URL параметров (после сохранения в БД)
  // Бот открывает WebApp через кнопку "Продолжить" с параметрами
  if (isWelcomePage && welcomeFirstName && welcomeLastName) {
    return (
      <WelcomePage
        firstName={welcomeFirstName}
        lastName={welcomeLastName}
        debugLogs={debugLogs}
        setDebugLogs={setDebugLogs}
        showDebug={showDebug}
        setShowDebug={setShowDebug}
        isTelegramEnvironment={isTelegramEnvironment}
        messageApiUrl={messageApiUrl}
      />
    );
  }

  // Иначе показываем форму регистрации
  return (
    <RegistrationForm
      onSubmit={onSubmit}
      control={control}
      errors={errors}
      isValid={isValid}
      status={status}
      statusMessage={statusMessage}
      isTelegramEnvironment={isTelegramEnvironment}
      debugLogs={debugLogs}
      setDebugLogs={setDebugLogs}
      showDebug={showDebug}
      setShowDebug={setShowDebug}
    />
  );
}

export default App;

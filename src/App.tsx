import { useEffect, useMemo, useState } from "react";
import type { TelegramWebApp } from "./telegram";
import { Controller, useForm } from "react-hook-form";
import "./App.css";

type FormValues = {
  firstName: string;
  lastName: string;
};

const REGISTRATION_HINT =
  "Эти данные увидит только бот и сразу поздоровается с вами по имени.";

type TelegramWindow = Window &
  typeof globalThis & {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  };

function App() {
  const telegramApp = (window as TelegramWindow).Telegram?.WebApp;
  const isTelegramEnvironment = Boolean(telegramApp);

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

  const onSubmit = handleSubmit(async (values) => {
    setStatus("sending");
    setStatusMessage(null);

    const payload = {
      ...values,
      timestamp: new Date().toISOString(),
    };

    try {
      if (telegramApp) {
        telegramApp.sendData(JSON.stringify(payload));
        setStatus("sent");
        setStatusMessage("Данные отправлены боту. Окно скоро закроется.");

        setTimeout(() => {
          telegramApp.close();
        }, 400);
      } else {
        console.log("Form payload:", payload);
        setStatus("sent");
        setStatusMessage(
          "Форма работает. Откройте её через Telegram, чтобы завершить регистрацию."
        );
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setStatusMessage("Что-то пошло не так. Попробуйте снова.");
    }
  });

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Регистрация</p>
        <h1>Заполните форму</h1>
        <p className="intro">
          {REGISTRATION_HINT} Пожалуйста, укажите реальные имя и фамилию.
        </p>
      </header>

      <form className="card" onSubmit={onSubmit} noValidate>
        <Controller
          name="firstName"
          control={control}
          rules={{
            required: "Введите имя",
            minLength: {
              value: 2,
              message: "Имя должно быть длиннее 1 символа",
            },
          }}
          render={({ field }) => (
            <label className="field">
              <span>Имя</span>
              <input
                {...field}
                type="text"
                inputMode="text"
                placeholder="Иван"
                autoComplete="given-name"
              />
              {errors.firstName && (
                <small className="error">{errors.firstName.message}</small>
              )}
            </label>
          )}
        />

        <Controller
          name="lastName"
          control={control}
          rules={{
            required: "Введите фамилию",
            minLength: {
              value: 2,
              message: "Фамилия должна быть длиннее 1 символа",
            },
          }}
          render={({ field }) => (
            <label className="field">
              <span>Фамилия</span>
              <input
                {...field}
                type="text"
                inputMode="text"
                placeholder="Петров"
                autoComplete="family-name"
              />
              {errors.lastName && (
                <small className="error">{errors.lastName.message}</small>
              )}
            </label>
          )}
        />

        <button
          type="submit"
          className="submit"
          disabled={!isValid || status === "sending"}
        >
          {status === "sending" ? "Отправляем..." : "Отправить"}
        </button>
        {statusMessage && (
          <p className={`status status-${status}`}>{statusMessage}</p>
        )}
      </form>

      {!isTelegramEnvironment && (
        <div className="warning">
          <strong>Подсказка:</strong> откройте этого бота в Telegram и нажмите
          кнопку «Регистрация». Тогда бот получит данные и поприветствует вас.
        </div>
      )}
    </main>
  );
}

export default App;

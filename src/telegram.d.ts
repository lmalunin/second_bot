export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface TelegramWebApp {
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  colorScheme?: "light" | "dark";
  themeParams?: TelegramThemeParams;
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export {};


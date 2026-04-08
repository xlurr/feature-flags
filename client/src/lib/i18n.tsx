import { createContext, useContext, useState } from "react";

export type Lang = "ru" | "en";

const DICT_RAW = {
  ru: {
    dashboard:    "Дашборд",
    flags:        "Флаги",
    audit:        "Аудит",
    eval:         "Eval API",
    settings:     "Настройки",
    live:         "Онлайн",
    connecting:   "Подключение",
    logout:       "Выйти",
    theme:        "Сменить тему",
    totalFlags:   "Всего флагов",
    activeInProd: "Активны в Prod",
    auditEvents:  "Событий аудита",
    envStatus:    "Статус по окружениям",
    recentEvents: "Последние события",
    minutesAgo:   "мин назад",
    hoursAgo:     "ч назад",
    daysAgo:      "д назад",
    flagName:     "Название",
    flagKey:      "Ключ",
    targeting:    "Таргетинг",
    rollout:      "Rollout",
    status:       "Статус",
    createFlag:   "Создать флаг",
    deleteFlag:   "Удалить",
    noFlags:      "Флаги не найдены",
    searchFlags:  "Поиск флагов...",
    event:        "Событие",
    flag:         "Флаг",
    environment:  "Окружение",
    actor:        "Актор",
    change:       "Изменение",
    time:         "Время",
    last50:       "Последние 50 событий",
    evalTitle:    "Eval API",
    evalDesc:     "Используй этот endpoint для оценки флагов из любого сервиса:",
    response:     "Ответ",
    cacheStats:   "Cache Stats",
    hits:         "Хиты",
    misses:       "Промахи",
    hitRate:      "Hit Rate",
    entries:      "Записей",
    environments: "Окружения",
    envName:      "Название",
    envKey:       "Ключ",
    apiKey:       "API Key",
    copyKey:      "Скопировать",
    rotateKey:    "Сбросить",
  },
  en: {
    dashboard:    "Dashboard",
    flags:        "Feature Flags",
    audit:        "Audit Log",
    eval:         "Eval API",
    settings:     "Settings",
    live:         "Live",
    connecting:   "Connecting",
    logout:       "Logout",
    theme:        "Toggle theme",
    totalFlags:   "Total flags",
    activeInProd: "Active in Prod",
    auditEvents:  "Audit events",
    envStatus:    "Environment status",
    recentEvents: "Recent events",
    minutesAgo:   "min ago",
    hoursAgo:     "h ago",
    daysAgo:      "d ago",
    flagName:     "Name",
    flagKey:      "Key",
    targeting:    "Targeting",
    rollout:      "Rollout",
    status:       "Status",
    createFlag:   "Create flag",
    deleteFlag:   "Delete",
    noFlags:      "No flags found",
    searchFlags:  "Search flags...",
    event:        "Event",
    flag:         "Flag",
    environment:  "Environment",
    actor:        "Actor",
    change:       "Change",
    time:         "Time",
    last50:       "Last 50 events",
    evalTitle:    "Eval API",
    evalDesc:     "Use this endpoint to evaluate flags from any service:",
    response:     "Response",
    cacheStats:   "Cache Stats",
    hits:         "Hits",
    misses:       "Misses",
    hitRate:      "Hit Rate",
    entries:      "Entries",
    environments: "Environments",
    envName:      "Name",
    envKey:       "Key",
    apiKey:       "API Key",
    copyKey:      "Copy",
    rotateKey:    "Rotate",
  },
};

export type Translations = (typeof DICT_RAW)["ru"];
export const DICT: Record<Lang, Translations> = DICT_RAW;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

export const LangContext = createContext<LangContextValue>({
  lang: "ru",
  setLang: () => {},
  t: DICT_RAW.ru,
});

export function useLang() {
  return useContext(LangContext);
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const stored = (
    typeof localStorage !== "undefined" ? localStorage.getItem("ff-lang") : null
  ) as Lang | null;

  const [lang, setLangState] = useState<Lang>(stored ?? "ru");

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("ff-lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: DICT[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

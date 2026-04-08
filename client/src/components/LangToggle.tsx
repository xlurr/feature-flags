import { useLang } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="ff-lang-switch" role="group" aria-label="Language">
      <button
        className={`ff-lang-option${lang === "ru" ? " active" : ""}`}
        onClick={() => setLang("ru")}
        aria-pressed={lang === "ru"}
      >
        RU
      </button>
      <button
        className={`ff-lang-option${lang === "en" ? " active" : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}

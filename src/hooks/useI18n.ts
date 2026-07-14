import { useUserPreferences } from "../components/UserPreferencesProvider";
import { translations } from "../utils/translations";

export const useI18n = () => {
  const { preferences } = useUserPreferences();
  
  // Default to English if not explicitly set to Vietnamese
  const lang: "vi" | "en" = preferences.language === "vi" ? "vi" : "en";

  const t = (key: keyof typeof translations.vi) => {
    // Fallback to English if translation missing in requested language
    return (translations[lang] as any)[key] || (translations.en as any)[key] || key;
  };

  return { t, lang };
};

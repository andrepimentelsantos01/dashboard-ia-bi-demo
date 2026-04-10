import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  "pt-BR": {
    translation: {
      select: "Selecione",
      clear: "Limpar",
      start_date: "Data inicial",
      end_date: "Data final",
      from_date: "A partir de {{date}}",
      to_date: "Ate {{date}}"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;

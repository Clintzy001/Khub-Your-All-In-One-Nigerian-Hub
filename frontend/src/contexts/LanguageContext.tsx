import { createContext, useContext, useState, type ReactNode } from "react";

type Language = "en" | "ig" | "ha" | "yo";

const labels: Record<Language, string> = { en: "English", ig: "Igbo", ha: "Hausa", yo: "Yoruba" };

const translations: Record<string, Record<Language, string>> = {
  home: { en: "Home", ig: "Ụlọ", ha: "Gida", yo: "Ilé" },
  shop: { en: "Shop", ig: "Ụlọ ahịa", ha: "Shago", yo: "Ṣọ́ọ̀bù" },
  jobs: { en: "Jobs", ig: "Ọrụ", ha: "Ayyuka", yo: "Iṣẹ́" },
  service: { en: "Services", ig: "Ọrụ", ha: "Ayyuka", yo: "Iṣẹ́" },
  rentals: { en: "Rentals", ig: "Ire ụlọ", ha: "Haya", yo: "Iyálé" },
  logistics: { en: "Logistics", ig: "Njem", ha: "Sufuri", yo: "Gbígbé" },
  login: { en: "Login", ig: "Banye", ha: "Shiga", yo: "Wọlé" },
  register: { en: "Register", ig: "Debanye aha", ha: "Yi rajista", yo: "Forúkọ sílẹ̀" },
  cart: { en: "Cart", ig: "Igbe ahịa", ha: "Kwando", yo: "Kẹ̀kẹ́" },
  search: { en: "Search for products, jobs, rentals...", ig: "Chọọ ngwaahịa...", ha: "Nemo kayayyaki...", yo: "Ṣàwárí àwọn ọjà..." },
  addToCart: { en: "Add to Cart", ig: "Tinye n'igbe", ha: "Saka cikin kwando", yo: "Fi sí kẹ̀kẹ́" },
  checkout: { en: "Checkout", ig: "Kwụọ ụgwọ", ha: "Biya", yo: "Sanwó" },
  welcome: { en: "Welcome to Khub", ig: "Nnọọ na Khub", ha: "Barka da zuwa Khub", yo: "Ẹ kú àbọ̀ sí Khub" },
  tagline: { en: "Your No. 1 Business Hub in Nigeria", ig: "Ụlọ azụmaahịa gị nke mbụ", ha: "Cibiyar kasuwancinka ta farko", yo: "Ibùdó iṣẹ́ àkọ́kọ́ rẹ" },
  categories: { en: "Categories", ig: "Udi", ha: "Rukunoni", yo: "Ẹ̀ka" },
  allRightsReserved: { en: "All rights reserved", ig: "Ikike niile edebere", ha: "An kiyaye dukkan haƙƙoƙi", yo: "Gbogbo ẹ̀tọ́ ni a pa mọ́" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: { value: Language; label: string }[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en", setLanguage: () => {}, t: (k) => k,
  languages: Object.entries(labels).map(([value, label]) => ({ value: value as Language, label })),
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");
  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const languages = Object.entries(labels).map(([value, label]) => ({ value: value as Language, label }));

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

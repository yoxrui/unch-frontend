"use client";
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState("en");
    const [translations, setTranslations] = useState({});
    const [supportedLangs, setSupportedLangs] = useState({});
    const [loading, setLoading] = useState(true);

    
    useEffect(() => {
        fetch("/api/supported")
            .then((res) => res.json())
            .then((data) => {
                
                
                setSupportedLangs(data);

                
                const savedLang = localStorage.getItem("language");
                if (savedLang && data[savedLang]) {
                    setLanguage(savedLang);
                } else {
                    
                    if (data[browserLang]) {
                        setLanguage(browserLang);
                    }
                }
            })
            .catch((err) => console.error("Failed to load supported languages:", err));
    }, []);

    
    useEffect(() => {
        setLoading(true);
        fetch(`/api/languages/${language}`)
            .then((res) => res.json())
            .then((data) => {
                setTranslations(data);
                localStorage.setItem("language", language);
                setLoading(false);
            })
            .catch((err) => {
                console.error(`Failed to load translations for ${language}:`, err);
                setLoading(false);
            });
    }, [language]);

    const changeLanguage = (langCode) => {
        if (supportedLangs[langCode]) {
            setLanguage(langCode);
        }
    };

    
    const t = (key, params = {}) => {
        const keys = key.split(".");
        let value = translations;
        for (const k of keys) {
            value = value?.[k];
        }

        if (value === undefined) return key; 

        
        if (typeof value === 'string') {
            return value.replace(/\{\{(\w+)\}\}/g, (_, k) => {
                return params[k] !== undefined ? params[k] : `{{${k}}}`;
            });
        }

        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t, supportedLangs, loading }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);

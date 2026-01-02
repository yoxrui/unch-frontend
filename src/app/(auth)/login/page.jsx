"use client"

import { useEffect, useState } from "react";
import "./page.css";
import { useUser } from "../../../contexts/UserContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useRouter } from "next/navigation";
import LoginBackground from "./LoginBackground";

export default function Login() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isWaiting, setIsWaiting] = useState(false);
  const [externalLoginId, setExternalLoginId] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const {
    sonolusUser,
    session,
    isSessionValid,
    clearExpiredSession,
    isClient,
    sessionReady,
  } = useUser();

  useEffect(() => {
    if (!sessionReady) return;

    if (sonolusUser && isSessionValid()) {
      router.push("/dashboard");
    } else {
      setIsWaiting(false);
    }
  }, [sessionReady, sonolusUser, isSessionValid, router]);

  const sonolusServerUrl = process.env['NEXT_PUBLIC_SONOLUS_SERVER_URL'];
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'];

  const getHostFromUrl = (url) => {
    if (!url) return "unch.untitledcharts.com";
    if (url.includes("://")) {
      return url.split("://")[1];
    }
    return url;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsWaiting(true);
    setLoginError(null);

    try {
      const res = await fetch(`${apiUrl}/api/accounts/session/external/id/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error(`Failed to get external login ID: ${res.status}`);
      const { id } = await res.json();

      const host = getHostFromUrl(sonolusServerUrl);

      setExternalLoginId(id);

      window.open(`https://open.sonolus.com/external-login/${host}/sonolus/authenticate_external?id=${id}`, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error("Login Error:", e);
      setLoginError("Connection failed. Please check your internet or try again.");
      setIsWaiting(false);
    }
  };

  useEffect(() => {
    if (!isWaiting || !externalLoginId) return;


    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/accounts/session/external/get/?id=${externalLoginId}`);

        if (res.status === 202) {
          const { session_key } = await res.json();

          const fourMonthsInMs = 120 * 24 * 60 * 60 * 1000;
          const expiry = Date.now() + fourMonthsInMs;

          localStorage.setItem("session", session_key);
          localStorage.setItem("expiry", expiry.toString());

          window.dispatchEvent(new CustomEvent('authChange'));

          setIsWaiting(false);
          router.push("/dashboard");
        }
      } catch (e) {

      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWaiting, externalLoginId, apiUrl, router]);

  return (
    <main>
      <LoginBackground />
      <div className="login-container">
        <div className="login-box">
          <h1>UntitledCharts</h1>
          {loginError && (
            <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', textAlign: 'center', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
              {loginError}
            </div>
          )}
          {isWaiting ? (
            <div>
              <p>{t('login.waitingForAuth')}</p>
              {externalLoginId && (
                <div className="login-actions">
                  <button
                    onClick={() => {
                      const host = getHostFromUrl(sonolusServerUrl);
                      window.open(`https://open.sonolus.com/external-login/${host}/sonolus/authenticate_external?id=${externalLoginId}`, "_blank", "noopener,noreferrer");
                    }}
                    className="login-btn"
                  >
                    {t('login.openSonolusApp')} <img src="/sonolus-text.png" alt="Sonolus" style={{ height: '1.2em', verticalAlign: 'middle', margin: '0 5px' }} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="login-actions">
                <button type="submit" className="login-btn">
                  {t('login.loginVia')} <img src="/sonolus-text.png" alt="Sonolus" style={{ height: '1.2em', verticalAlign: 'middle', margin: '0 5px' }} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
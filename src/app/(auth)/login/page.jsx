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
      return url.split("://")[1].split('/')[0];
    }
    return url.split('/')[0];
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
      const authUrl = `https://open.sonolus.com/external-login/${host}/sonolus/authenticate_external?id=${id}`;
      console.log("Redirecting to:", authUrl);

      window.open(authUrl, '_blank');
    } catch (e) {
      console.error("Login Error:", e);
      setLoginError(t('login.connectionFailed', "Connection failed. Please check your internet or try again."));
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
      <div className="login-screen" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
        <div className="login-box glass-card animate-scale-in" style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 20px',
        }}>
          <h1 style={{
            textAlign: 'center',
            marginBottom: '32px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #f472b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800',
            fontSize: '2.5rem',
            letterSpacing: '-1px'
          }}>
            UntitledCharts
          </h1>

          {loginError && (
            <div style={{
              color: '#ef4444',
              marginBottom: '24px',
              fontSize: '14px',
              textAlign: 'center',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {loginError}
            </div>
          )}

          {isWaiting ? (
            <div style={{ textAlign: 'center' }}>
              <div className="loading-spinner" style={{ marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
              </div>
              <p style={{ color: '#94a3b8', marginBottom: '24px', fontWeight: '500' }}>{t('login.waitingForAuth')}</p>
              {externalLoginId && (
                <div className="login-actions">
                  <button
                    onClick={() => {
                      const host = getHostFromUrl(sonolusServerUrl);
                      window.open(`https://open.sonolus.com/external-login/${host}/sonolus/authenticate_external?id=${externalLoginId}`, "_blank", "noopener,noreferrer");
                    }}
                    className="login-btn"
                    style={{ width: '100%', padding: '14px', borderRadius: '16px', fontWeight: '600' }}
                  >
                    {t('login.openSonolusApp')} <img src="/sonolus-text.png" alt="Sonolus" style={{ height: '1.2em', verticalAlign: 'middle', margin: '0 5px' }} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="login-actions" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button type="submit" className="login-btn" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontWeight: '700', fontSize: '1rem', transition: 'all 0.3s ease' }}>
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
"use client";
import { Geist, Geist_Mono, Kanit } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import "./layout.css";
import NavLinks from "./NavLinks";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { UserProvider, useUser } from "../contexts/UserContext";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import BackgroundDecorations from '../components/background-decorations/BackgroundDecorations';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


import { Menu, X, Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

function HeaderContent() {
  const { isLoggedIn, sonolusUser, handleLogout } = useUser();
  const { t, language, changeLanguage, supportedLangs } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-profile-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const LangPicker = () => (
    <div className="header-control-item">
      <Globe size={20} />
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="header-lang-select"
      >
        {Object.entries(supportedLangs).map(([code, lang]) => (
          <option key={code} value={code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );

  const ThemeToggler = () => (
    <button onClick={toggleTheme} className="header-control-btn" title="Toggle Theme">
      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );

  return (
    <>
      <header className="site-header" style={{ display: mobileMenuOpen ? 'none' : 'block' }}>
        <div className="header-container">
          <div className="header-left">
            <Link href="/" className="logo-link">
              <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt={`${t('common.brandName')} Logo`} />
              <h2>{t('common.brandName')}</h2>
            </Link>
          </div>

          <div className="header-center desktop-only">
            <Suspense fallback={null}>
              <NavLinks user={sonolusUser} t={t} />
            </Suspense>
          </div>

          <div className="header-right desktop-only">
            <LangPicker />
            <ThemeToggler />

            {isLoggedIn && sonolusUser ? (
              <div className="user-profile-container">
                <div
                  className="user-profile"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="user-avatar">
                    <div
                      className="default-avatar"
                      style={{
                        backgroundColor: "#000020ff",
                        color: "#ffffffff"
                      }}
                    >
                      {sonolusUser.sonolus_username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <span className="user-name">{sonolusUser.sonolus_username}</span>
                  <span className="dropdown-arrow">▼</span>
                </div>
                {showDropdown && (
                  <div className="user-dropdown">
                    <button
                      className="dropdown-item logout-btn"
                      onClick={handleLogout}
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="login-link-btn">
                {t('nav.login')}
              </Link>
            )}
          </div>

          <div className="header-mobile-toggle mobile-only">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu animate-slide-down">
          <div className="mobile-menu-header">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="mobile-logo">
              <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt="UntitledCharts" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-close-btn"
              aria-label="Close Menu"
            >
              <X size={28} />
            </button>
          </div>

          <Suspense fallback={null}>
            <NavLinks user={sonolusUser} t={t} onNavClick={() => setMobileMenuOpen(false)} />
          </Suspense>
          <div className="mobile-menu-divider"></div>

          <div className="mobile-menu-controls">
            <div className="mobile-control-row">
              <span>{t('header.language', 'Language')}</span>
              <LangPicker />
            </div>
            <div className="mobile-control-row">
              <span>{t('header.theme', 'Theme')}</span>
              <ThemeToggler />
            </div>
          </div>

          <div className="mobile-menu-auth">
            {isLoggedIn && sonolusUser ? (
              <div className="mobile-user-profile">
                <div className="user-info">
                  <div className="user-avatar small">
                    {sonolusUser.sonolus_username.charAt(0).toUpperCase()}
                  </div>
                  <span>{sonolusUser.sonolus_username}</span>
                </div>
                <button onClick={handleLogout} className="mobile-logout-btn">
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <Link href="/login" className="mobile-login-btn">
                {t('nav.login')}
              </Link>
            )}
          </div>

          <div className="mobile-menu-footer">
            <p>Untitled Charts</p>
          </div>
        </div>
      )}
    </>
  );
}

function FooterContent() {
  const { language, changeLanguage, supportedLangs, t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-bg">
        <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt="Logo Background" className="footer-bg-logo" />
      </div>

      <div className="footer-content">
        <div className="footer-left">
          <img
            src="/miku-sitting.png"
            alt="Miku"
            className="footer-miku"
          />
          <h2 className="footer-brand">{t('common.brandName')}</h2>
          <div className="footer-sonolus-btn-container" style={{ marginTop: '12px' }}>
            <a
              className="px-4 py-2 button bg-black text-white inline-flex items-center"
              href="https://open.sonolus.com/untitledcharts.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                gap: '8px',
                background: '#000',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <svg fill="currentColor" aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-2.5a.5.5 0 0 1 1 0V14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h2.5a.5.5 0 0 1 0 1H6Zm5-.5c0-.28.22-.5.5-.5h5c.28 0 .5.22.5.5v5a.5.5 0 0 1-1 0V4.7l-4.15 4.15a.5.5 0 0 1-.7-.7L15.29 4H11.5a.5.5 0 0 1-.5-.5Z" fill="currentColor"></path>
              </svg>
              {t('footer.openInSonolus')}
            </a>
          </div>
        </div>

        <div className="footer-center">
          <div className="lang-picker">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="lang-select"
              suppressHydrationWarning
            >
              {Object.entries(supportedLangs).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="footer-right">
          <p className="follow-title">{t('footer.followUs')}</p>
          <div className="social-links">
            <a href="https://www.youtube.com/@UntitledCharts" target="_blank" rel="noopener noreferrer" title="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
            </a>
            <a href="https://www.tiktok.com/@untitledcharts" target="_blank" rel="noopener noreferrer" title="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
            </a>
            <a href="https://discord.gg/mH3xWPPdEY" target="_blank" rel="noopener noreferrer" title="Discord">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function RootLayoutInner({ children }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isLevelPage = pathname && typeof pathname === 'string' ? pathname.startsWith('/levels/') : false;

  return (
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased ${isLevelPage ? 'is-level-page' : ''}`}
    >
      <BackgroundDecorations />
      <HeaderContent />
      <main className="main-content">
        {children}
      </main>
      <FooterContent />
    </body>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ThemeProvider>
        <LanguageProvider>
          <UserProvider>
            <RootLayoutInner>{children}</RootLayoutInner>
          </UserProvider>
        </LanguageProvider>
      </ThemeProvider>
    </html>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import { isValidAdminToken } from '../utils/adminAuth';

const mobileNavLinks = [
  { to: '/?category=OGE-IST#catalog', label: 'ОГЭ История' },
  { to: '/?category=EGE-IST#catalog', label: 'ЕГЭ История' },
  { to: '/?category=EGE-SOC#catalog', label: 'ЕГЭ Обществознание' },
];

function isAdminSession(user) {
  if (user?.role === 'admin') return true;
  return typeof localStorage !== 'undefined' && isValidAdminToken(localStorage.getItem('adminToken'));
}

function openSupportChat() {
  window.dispatchEvent(new CustomEvent('open-support-chat'));
}

function ProfileMenuItems({ isAdmin, onClose, onLogout }) {
  if (isAdmin) {
    return (
      <>
        <Link
          to="/admin/dashboard"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={onClose}
        >
          Панель управления
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        >
          Выход
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        to="/purchases"
        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={onClose}
      >
        Мои покупки
      </Link>
      <button
        type="button"
        onClick={() => {
          onClose();
          openSupportChat();
        }}
        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
      >
        Поддержка
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
      >
        Выход
      </button>
    </>
  );
}

function MobileProfileMenuItems({ isAdmin, onClose, onLogout }) {
  const linkClass = 'text-sm font-medium text-accent-400';
  const buttonClass = 'text-left text-sm font-medium text-white/90';

  if (isAdmin) {
    return (
      <>
        <Link to="/admin/dashboard" onClick={onClose} className={linkClass}>
          Панель управления
        </Link>
        <button type="button" onClick={onLogout} className={buttonClass}>
          Выход
        </button>
      </>
    );
  }

  return (
    <>
      <Link to="/purchases" onClick={onClose} className={linkClass}>
        Мои покупки
      </Link>
      <button
        type="button"
        onClick={() => {
          onClose();
          openSupportChat();
        }}
        className={buttonClass}
      >
        Поддержка
      </button>
      <button type="button" onClick={onLogout} className={buttonClass}>
        Выход
      </button>
    </>
  );
}

export default function Header({ user, onAuthSuccess, forceOpenAuth = 0, authInitialMode = 'login' }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const openAuth = () => setIsAuthOpen(true);
  const isAdmin = isAdminSession(user);
  const showAccountMenu = Boolean(user) || isAdmin;

  useEffect(() => {
    if (forceOpenAuth > 0) {
      setIsAuthOpen(true);
    }
  }, [forceOpenAuth]);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [profileMenuOpen]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    setProfileMenuOpen(false);
    window.location.reload();
  };

  const closeMobileMenu = () => setIsMenuOpen(false);

  const closeProfileMenu = () => setProfileMenuOpen(false);

  const handleLogout = () => {
    closeMobileMenu();
    logout();
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 overflow-visible border-b border-primary/25 shadow-md"
        style={{
          backgroundImage: 'url(/header-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative flex h-28 w-full items-center justify-between gap-3 py-2 pl-1 pr-2 sm:pl-2 sm:pr-3 md:pr-0 lg:pl-3">
          <Link
            to="/"
            className="relative z-20 inline-flex shrink-0 items-center"
            onClick={closeMobileMenu}
          >
            <img
              src="/logo-full.png"
              alt="Династия"
              className="h-16 w-auto origin-left scale-[1.62] sm:scale-[1.78] md:scale-[1.9] lg:scale-[2.02]"
            />
          </Link>

          <nav className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 md:flex">
            <Link
              to="/?category=OGE-IST#catalog"
              className="flex h-40 w-[22rem] shrink-0 items-center justify-center transition-transform duration-200 hover:scale-105"
            >
              <img
                src="/btn-oge.png"
                alt="ОГЭ История"
                className="max-h-full max-w-full object-contain object-center"
              />
            </Link>
            <Link
              to="/?category=EGE-IST#catalog"
              className="flex h-40 w-[22rem] shrink-0 items-center justify-center transition-transform duration-200 hover:scale-105"
            >
              <img
                src="/btn-ege.png"
                alt="ЕГЭ История"
                className="max-h-full max-w-full object-contain object-center"
              />
            </Link>
            <Link
              to="/?category=EGE-SOC#catalog"
              className="flex h-40 w-[22rem] shrink-0 items-center justify-center transition-transform duration-200 hover:scale-105"
            >
              <img
                src="/btn-soc.png"
                alt="ЕГЭ Обществознание"
                className="max-h-full max-w-full object-contain object-center"
              />
            </Link>
          </nav>

          <div className="relative z-20 hidden shrink-0 md:flex" ref={profileMenuRef}>
            {showAccountMenu ? (
              <>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="hover:scale-105 transition-transform duration-200 focus:outline-none"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                >
                  <img src="/btn-profile.png" alt="Профиль" className="h-24 w-auto md:h-28" />
                </button>
                {profileMenuOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <ProfileMenuItems
                      isAdmin={isAdmin}
                      onClose={closeProfileMenu}
                      onLogout={logout}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={openAuth}
                className="hover:scale-105 transition-transform duration-200 focus:outline-none"
                aria-label="Профиль — войти"
              >
                <img src="/btn-profile.png" alt="Профиль" className="h-24 w-auto md:h-28" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="relative z-20 shrink-0 rounded-lg border border-primary/80 bg-white/70 px-3 py-2 text-primary backdrop-blur-sm md:hidden"
            aria-label="Открыть меню"
            aria-expanded={isMenuOpen}
          >
            ☰
          </button>
        </div>

        {isMenuOpen ? (
          <div className="border-t border-primary/20 bg-[#163754]/95 px-4 py-4 backdrop-blur-sm md:hidden">
            <nav className="flex flex-col gap-3">
              {mobileNavLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className="text-sm font-medium text-white hover:text-accent-400"
                >
                  {item.label}
                </Link>
              ))}
              {showAccountMenu ? (
                <MobileProfileMenuItems
                  isAdmin={isAdmin}
                  onClose={closeMobileMenu}
                  onLogout={handleLogout}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    openAuth();
                  }}
                  className="self-start transition-transform duration-200 hover:scale-105 focus:outline-none"
                >
                  <img src="/btn-profile.png" alt="Профиль" className="h-24 w-auto" />
                </button>
              )}
            </nav>
          </div>
        ) : null}
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={onAuthSuccess}
      />
    </>
  );
}

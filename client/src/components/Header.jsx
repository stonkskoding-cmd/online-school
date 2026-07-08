import { memo, useEffect, useRef, useState } from 'react';
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

function ProfileButton({ onClick, ariaExpanded, ariaLabel = 'Профиль' }) {
  return (
    <img
      src="/btn-profile.png"
      alt="Профиль"
      onClick={onClick}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaExpanded != null ? 'true' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{
        width: 'clamp(40px, 5vw, 80px)',
        height: 'clamp(40px, 5vw, 80px)',
        objectFit: 'contain',
        transition: 'transform 0.2s ease',
        filter: 'brightness(1.2) contrast(1.15) saturate(1.2)',
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.15)';
        e.target.style.filter = 'brightness(1.35) contrast(1.25) saturate(1.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.filter = 'brightness(1.2) contrast(1.15) saturate(1.2)';
      }}
    />
  );
}

function Header({ user, onAuthSuccess, forceOpenAuth = 0, authInitialMode = 'login' }) {
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
      <header className="sticky top-0 z-50 w-full border-b border-primary/25 bg-white shadow-sm">
        <div className="flex w-full items-center justify-between gap-2 px-2 py-2 sm:min-h-[72px] sm:px-4 md:min-h-[80px] md:gap-4 md:px-6 lg:px-8">
          <div className="flex shrink-0 items-center">
            <Link to="/" className="inline-flex items-center justify-start" onClick={closeMobileMenu}>
              <img
                src="/logo-full.png"
                alt="Династия"
                className="h-auto object-contain"
                style={{
                  maxWidth: 'clamp(120px, 18vw, 280px)',
                  minWidth: '120px',
                }}
              />
            </Link>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 px-2 md:flex md:gap-3 md:px-4 lg:gap-4">
            <Link
              to="/?category=OGE-IST#catalog"
              className="flex min-w-0 flex-1 items-center justify-center"
              onClick={closeMobileMenu}
            >
              <img
                src="/btn-oge.png"
                alt="ОГЭ История"
                className="h-8 w-auto max-w-[30%] object-contain sm:h-9 md:h-10 lg:h-11"
              />
            </Link>
            <Link
              to="/?category=EGE-IST#catalog"
              className="flex min-w-0 flex-1 items-center justify-center"
              onClick={closeMobileMenu}
            >
              <img
                src="/btn-ege.png"
                alt="ЕГЭ История"
                className="h-8 w-auto max-w-[30%] object-contain sm:h-9 md:h-10 lg:h-11"
              />
            </Link>
            <Link
              to="/?category=EGE-SOC#catalog"
              className="flex min-w-0 flex-1 items-center justify-center"
              onClick={closeMobileMenu}
            >
              <img
                src="/btn-soc.png"
                alt="ЕГЭ Обществознание"
                className="h-8 w-auto max-w-[30%] object-contain sm:h-9 md:h-10 lg:h-11"
              />
            </Link>
          </nav>

          <div className="relative hidden shrink-0 items-center md:flex" ref={profileMenuRef}>
            {showAccountMenu ? (
              <>
                <ProfileButton
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  ariaExpanded={profileMenuOpen}
                />
                {profileMenuOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-fade-in">
                    <ProfileMenuItems
                      isAdmin={isAdmin}
                      onClose={closeProfileMenu}
                      onLogout={logout}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <ProfileButton onClick={openAuth} ariaLabel="Профиль — войти" />
            )}
          </div>

          <div className="relative z-20 ml-auto flex shrink-0 items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="z-50 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-primary/80 bg-white/70 px-3 py-2 text-xl leading-none text-primary backdrop-blur-sm transition-transform duration-200 hover:scale-105"
              aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={isMenuOpen}
            >
              ☰
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="animate-slide-down border-t border-primary/20 bg-[#163754]/95 px-4 py-4 backdrop-blur-sm md:hidden">
            <nav className="flex flex-col gap-3">
              {mobileNavLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className="text-sm font-medium text-white transition hover:text-accent-400 sm:text-base"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-1 border-t border-white/15 pt-3">
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
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent-400 transition hover:text-accent-500 sm:text-base"
                  >
                    <img
                      src="/btn-profile.png"
                      alt=""
                      className="cursor-pointer"
                      style={{
                        width: '48px',
                        height: '48px',
                        transition: 'transform 0.2s ease',
                      }}
                      aria-hidden
                    />
                    Войти
                  </button>
                )}
              </div>
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

export default memo(Header);

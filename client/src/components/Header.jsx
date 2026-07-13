import { memo, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthModal from './AuthModal';
import { isValidAdminToken } from '../utils/adminAuth';

const navItems = [
  {
    to: '/?category=EGE-IST#catalog',
    label: 'ЕГЭ История',
    category: 'EGE-IST',
    src: '/btn-ege-istoriya.png',
  },
  {
    to: '/?category=EGE-SOC#catalog',
    label: 'ЕГЭ Обществознание',
    category: 'EGE-SOC',
    src: '/btn-ege-obschestvo.png',
  },
  {
    to: '/?category=OGE-IST#catalog',
    label: 'ОГЭ Обществознание',
    category: 'OGE-IST',
    src: '/btn-oge-obschestvo.png',
  },
];

function setNavButtonVisual(img, transform, filter) {
  if (!img) return;
  img.style.transform = transform;
  if (filter !== undefined) img.style.filter = filter;
}

function isAdminSession(user) {
  if (user?.role === 'admin') return true;
  return typeof localStorage !== 'undefined' && isValidAdminToken(localStorage.getItem('adminToken'));
}

function openSupportChat() {
  window.dispatchEvent(new CustomEvent('open-support-chat'));
}

function useActiveCategory() {
  const { search } = useLocation();
  return new URLSearchParams(search).get('category') ?? '';
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
      className="header-profile-btn h-auto cursor-pointer"
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
    />
  );
}

function DesktopNavButton({ item, isActive, onNavigate }) {
  const imgRef = useRef(null);

  useEffect(() => {
    setNavButtonVisual(
      imgRef.current,
      isActive ? 'scale(1.04)' : 'scale(1)',
      isActive
        ? 'drop-shadow(0 0 14px rgba(212,175,55,0.45))'
        : 'drop-shadow(0 4px 10px rgba(0,0,0,0.22))',
    );
  }, [isActive]);

  const hoverIn = () => {
    setNavButtonVisual(
      imgRef.current,
      'scale(1.08)',
      'drop-shadow(0 10px 18px rgba(0,0,0,0.35))',
    );
  };

  const hoverOut = () => {
    setNavButtonVisual(
      imgRef.current,
      isActive ? 'scale(1.04)' : 'scale(1)',
      isActive
        ? 'drop-shadow(0 0 14px rgba(212,175,55,0.45))'
        : 'drop-shadow(0 4px 10px rgba(0,0,0,0.22))',
    );
  };

  return (
    <span
      className={`header-nav-btn relative inline-block shrink-0 leading-none${isActive ? ' header-nav-btn--active' : ''}`}
    >
      <img
        ref={imgRef}
        src={item.src}
        alt=""
        draggable={false}
        aria-hidden
        className="header-nav-btn-img pointer-events-none block max-w-none select-none object-contain"
        style={{
          transform: isActive ? 'scale(1.04)' : 'scale(1)',
          filter: isActive
            ? 'drop-shadow(0 0 14px rgba(212,175,55,0.45))'
            : 'drop-shadow(0 4px 10px rgba(0,0,0,0.22))',
        }}
      />
      <Link
        to={item.to}
        className="header-nav-btn-hit absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-sm"
        onClick={onNavigate}
        aria-label={item.label}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
        onMouseDown={() => setNavButtonVisual(imgRef.current, 'scale(0.95)', undefined)}
        onMouseUp={() =>
          setNavButtonVisual(
            imgRef.current,
            isActive ? 'scale(1.04)' : 'scale(1.05)',
            undefined,
          )
        }
      />
    </span>
  );
}

function Header({ user, onAuthSuccess, forceOpenAuth = 0, authInitialMode = 'login' }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const activeCategory = useActiveCategory();

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

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

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
      <header className="site-header">
        <img
          src="/header-bg.png"
          alt=""
          className="site-surface__pattern"
          aria-hidden
          draggable={false}
        />
        <div className="relative h-14 md:h-16">
          <div className="relative mx-auto grid h-full max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 px-4 sm:px-6">
            <Link to="/" className="shrink-0 justify-self-start" onClick={closeMobileMenu}>
              <img
                src="/logo-full.png"
                alt="Династия"
                className="header-logo block h-auto object-contain"
              />
            </Link>

            <div className="hidden min-w-0 md:block" aria-hidden />

            <div className="relative flex shrink-0 items-center justify-self-end gap-2" ref={profileMenuRef}>
            <div className="hidden md:block">
              {showAccountMenu ? (
                <>
                  <ProfileButton
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    ariaExpanded={profileMenuOpen}
                  />
                  {profileMenuOpen ? (
                    <div className="absolute right-4 top-full z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl animate-fade-in lg:right-6">
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

            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="rounded-lg p-2 text-white/90 transition hover:bg-white/10 md:hidden"
              aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={isMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          </div>

          <nav className="pointer-events-none absolute inset-x-0 top-1/2 z-10 hidden -translate-y-1/2 md:flex md:justify-center">
            <div
              className="pointer-events-auto flex max-w-[min(100vw-7rem,1180px)] items-center justify-center gap-3 md:gap-5 lg:gap-10 xl:gap-16 2xl:gap-24"
              aria-label="Основная навигация"
            >
              {navItems.map((item) => (
                <DesktopNavButton
                  key={item.to}
                  item={item}
                  isActive={activeCategory === item.category}
                  onNavigate={closeMobileMenu}
                />
              ))}
            </div>
          </nav>
        </div>

        {isMenuOpen ? (
          <div className="brand-surface animate-slide-down border-t border-white/10 px-4 py-5 md:hidden">
            <nav className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-4" aria-label="Мобильная навигация">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className="transition-transform duration-200 hover:scale-105 active:scale-95"
                  aria-label={item.label}
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    className={`header-nav-btn-img-mobile h-auto w-auto max-w-[min(88vw,320px)] object-contain ${
                      activeCategory === item.category ? 'header-nav-btn-img-mobile--active' : ''
                    }`}
                    draggable={false}
                  />
                </Link>
              ))}
              <div className="mt-3 border-t border-white/15 pt-3">
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
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-accent-400 transition hover:bg-white/10 sm:text-base"
                  >
                    <img
                      src="/btn-profile.png"
                      alt=""
                      className="h-10 w-10 object-contain"
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

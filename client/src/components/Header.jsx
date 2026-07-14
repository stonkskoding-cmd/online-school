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

function DesktopProfileMenu({ isAdmin, onClose, onLogout }) {
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

function MobileProfilePanel({ isAdmin, activeCategory, onClose, onLogout }) {
  const actionClass =
    'w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 sm:text-base';

  return (
    <>
      <button
        type="button"
        className="header-mobile-panel__backdrop md:hidden"
        onClick={onClose}
        aria-label="Закрыть меню"
      />
      <div
        className="header-mobile-panel brand-surface md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Меню профиля"
      >
        <div className="header-mobile-panel__header">
          <h2 className="text-base font-semibold text-white sm:text-lg">Меню</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10"
            aria-label="Закрыть"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="header-mobile-panel__body">
          {isAdmin ? (
            <div className="flex flex-col gap-2">
              <Link to="/admin/dashboard" className={actionClass} onClick={onClose}>
                Панель управления
              </Link>
              <button type="button" className={actionClass} onClick={onLogout}>
                Выйти из аккаунта
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Link to="/purchases" className={actionClass} onClick={onClose}>
                  Мои покупки
                </Link>
                <button
                  type="button"
                  className={actionClass}
                  onClick={() => {
                    onClose();
                    openSupportChat();
                  }}
                >
                  Поддержка
                </button>
              </div>

              <nav className="flex flex-col items-center gap-3 border-y border-white/15 py-4" aria-label="Навигация">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className="transition-transform duration-200 active:scale-95"
                    aria-label={item.label}
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      className={`header-nav-btn-img-mobile h-auto w-auto object-contain ${
                        activeCategory === item.category ? 'header-nav-btn-img-mobile--active' : ''
                      }`}
                      draggable={false}
                    />
                  </Link>
                ))}
              </nav>

              <button type="button" className={actionClass} onClick={onLogout}>
                Выход
              </button>
            </div>
          )}
        </div>
      </div>
    </>
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
        const isMobilePanel = window.matchMedia('(max-width: 767px)').matches;
        if (!isMobilePanel) {
          setProfileMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [profileMenuOpen]);

  useEffect(() => {
    const isMobilePanel = profileMenuOpen && window.matchMedia('(max-width: 767px)').matches;
    document.body.style.overflow = isMobilePanel ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [profileMenuOpen]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    setProfileMenuOpen(false);
    window.location.reload();
  };

  const closeProfileMenu = () => setProfileMenuOpen(false);

  const handleProfileClick = () => {
    if (!showAccountMenu) {
      openAuth();
      return;
    }
    setProfileMenuOpen((value) => !value);
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
        <div className="relative h-16 sm:h-[4.5rem] md:h-20 lg:h-[5.25rem]">
          <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-5 lg:px-8">
            <Link to="/" className="header-logo-link relative z-20 shrink-0" onClick={closeProfileMenu}>
              <img
                src="/logo-full.png"
                alt="Династия"
                className="header-logo block h-auto object-contain"
              />
            </Link>

            <nav
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block"
              aria-label="Основная навигация"
            >
              <div className="pointer-events-auto flex max-w-[min(100vw-12rem,1100px)] items-center justify-center gap-3 lg:gap-8 xl:gap-14 2xl:gap-20">
                {navItems.map((item) => (
                  <DesktopNavButton
                    key={item.to}
                    item={item}
                    isActive={activeCategory === item.category}
                    onNavigate={closeProfileMenu}
                  />
                ))}
              </div>
            </nav>

            <div className="relative z-20 shrink-0" ref={profileMenuRef}>
              <ProfileButton
                onClick={handleProfileClick}
                ariaExpanded={showAccountMenu ? profileMenuOpen : undefined}
                ariaLabel={showAccountMenu ? 'Профиль' : 'Профиль — войти'}
              />

              {profileMenuOpen && showAccountMenu ? (
                <>
                  <div className="absolute right-0 top-full z-50 mt-2 hidden min-w-[12rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl animate-fade-in md:block">
                    <DesktopProfileMenu
                      isAdmin={isAdmin}
                      onClose={closeProfileMenu}
                      onLogout={logout}
                    />
                  </div>
                  <MobileProfilePanel
                    isAdmin={isAdmin}
                    activeCategory={activeCategory}
                    onClose={closeProfileMenu}
                    onLogout={logout}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
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

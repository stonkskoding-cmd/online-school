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

function DesktopMenuButton({ children, onClick, to, onClose, delayIndex = 0 }) {
  const style = { animationDelay: `${delayIndex * 45}ms` };
  const className = 'header-mobile-menu__btn';

  if (to) {
    return (
      <Link to={to} className={className} style={style} onClick={onClose}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className} style={style} onClick={onClick}>
      {children}
    </button>
  );
}

function DesktopProfileMenu({ isAdmin, onClose, onLogout }) {
  let delayIndex = 0;

  if (isAdmin) {
    return (
      <div className="header-mobile-menu__body">
        <DesktopMenuButton to="/admin/dashboard" onClose={onClose} delayIndex={delayIndex++}>
          Панель управления
        </DesktopMenuButton>
        <DesktopMenuButton onClick={onLogout} delayIndex={delayIndex++}>
          Выход
        </DesktopMenuButton>
      </div>
    );
  }

  return (
    <div className="header-mobile-menu__body">
      <DesktopMenuButton to="/purchases" onClose={onClose} delayIndex={delayIndex++}>
        Мои покупки
      </DesktopMenuButton>
      <DesktopMenuButton
        onClick={() => {
          onClose();
          openSupportChat();
        }}
        delayIndex={delayIndex++}
      >
        Поддержка
      </DesktopMenuButton>
      <DesktopMenuButton onClick={onLogout} delayIndex={delayIndex++}>
        Выход
      </DesktopMenuButton>
    </div>
  );
}

function MobilePanelButton({
  children,
  onClick,
  to,
  isActive = false,
  delayIndex = 0,
}) {
  const style = { animationDelay: `${delayIndex * 45}ms` };
  const classes = `header-mobile-menu__btn${isActive ? ' header-mobile-menu__btn--active' : ''}`;

  if (to) {
    return (
      <Link to={to} className={classes} style={style} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} style={style} onClick={onClick}>
      {children}
    </button>
  );
}

function MobileProfilePanel({
  isAdmin,
  isGuest,
  activeCategory,
  onClose,
  onLogout,
  onLogin,
}) {
  let delayIndex = 0;

  if (isAdmin) {
    return (
      <div className="header-mobile-menu brand-surface md:hidden" role="menu" aria-label="Меню профиля">
        <div className="header-mobile-menu__body">
          <MobilePanelButton to="/admin/dashboard" onClick={onClose} delayIndex={delayIndex++}>
            Панель управления
          </MobilePanelButton>
          <MobilePanelButton onClick={onLogout} delayIndex={delayIndex++}>
            Выйти из аккаунта
          </MobilePanelButton>
        </div>
      </div>
    );
  }

  return (
    <div className="header-mobile-menu brand-surface md:hidden" role="menu" aria-label="Меню профиля">
      <div className="header-mobile-menu__body">
        <MobilePanelButton
          to={isGuest ? undefined : '/purchases'}
          onClick={isGuest ? () => { onClose(); onLogin(); } : onClose}
          delayIndex={delayIndex++}
        >
          Мои покупки
        </MobilePanelButton>
        <MobilePanelButton
          onClick={() => {
            onClose();
            openSupportChat();
          }}
          delayIndex={delayIndex++}
        >
          Поддержка
        </MobilePanelButton>
        {navItems.map((item) => {
          const currentDelay = delayIndex++;
          return (
            <MobilePanelButton
              key={item.to}
              to={item.to}
              onClick={onClose}
              isActive={activeCategory === item.category}
              delayIndex={currentDelay}
            >
              {item.label}
            </MobilePanelButton>
          );
        })}
        <MobilePanelButton
          onClick={isGuest ? () => { onClose(); onLogin(); } : onLogout}
          delayIndex={delayIndex++}
        >
          {isGuest ? 'Войти' : 'Выход'}
        </MobilePanelButton>
      </div>
    </div>
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
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
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
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      setProfileMenuOpen((value) => !value);
      return;
    }
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
        <div className="relative h-16 sm:h-[4.5rem] md:h-24 lg:h-[5.75rem]">
          <div className="header-bar relative mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-5">
            <Link
              to="/"
              className="header-logo-link relative z-20 shrink-0"
              onClick={closeProfileMenu}
            >
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
              <div className="pointer-events-auto flex max-w-[min(100vw-10rem,1180px)] items-center justify-center gap-4 lg:gap-10 xl:gap-16 2xl:gap-24">
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
                ariaExpanded={profileMenuOpen}
                ariaLabel={showAccountMenu ? 'Профиль' : 'Профиль — меню'}
              />

              {profileMenuOpen ? (
                <>
                  {showAccountMenu ? (
                    <div className="header-desktop-menu brand-surface absolute right-0 top-full z-50 mt-2 hidden min-w-[16.5rem] md:block">
                      <img
                        src="/header-bg.png"
                        alt=""
                        className="site-surface__pattern"
                        aria-hidden
                        draggable={false}
                      />
                      <DesktopProfileMenu
                        isAdmin={isAdmin}
                        onClose={closeProfileMenu}
                        onLogout={logout}
                      />
                    </div>
                  ) : null}
                  <MobileProfilePanel
                    isAdmin={isAdmin}
                    isGuest={!showAccountMenu}
                    activeCategory={activeCategory}
                    onClose={closeProfileMenu}
                    onLogout={logout}
                    onLogin={openAuth}
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

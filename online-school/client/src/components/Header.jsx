import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import { isValidAdminToken } from '../utils/adminAuth';

const mobileNavLinks = [
  { to: '/?category=OGE-IST#catalog', label: 'ОГЭ История' },
  { to: '/?category=EGE-IST#catalog', label: 'ЕГЭ История' },
  { to: '/?category=EGE-SOC#catalog', label: 'ЕГЭ Обществознание' },
];

export default function Header({ user, onAuthSuccess, forceOpenAuth = 0 }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const openAuth = () => setIsAuthOpen(true);

  const adminTokenSession = typeof localStorage !== 'undefined' && isValidAdminToken(localStorage.getItem('adminToken'));
  const showAccountMenu = Boolean(user) || adminTokenSession;
  const showAdminLink = user?.role === 'admin' || adminTokenSession;

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
                    {user ? (
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Профиль
                      </Link>
                    ) : null}
                    {showAdminLink ? (
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        ⚙️ Панель управления
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={logout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Выход
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={openAuth}
                className="hover:scale-105 transition-transform duration-200 focus:outline-none"
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
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className="text-sm font-medium text-accent-400"
                  >
                    Профиль
                  </Link>
                  {showAdminLink ? (
                    <Link
                      to="/admin/dashboard"
                      onClick={closeMobileMenu}
                      className="text-sm font-medium text-accent-400"
                    >
                      ⚙️ Панель управления
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      logout();
                    }}
                    className="text-left text-sm font-medium text-white/90"
                  >
                    Выход
                  </button>
                </>
              ) : adminTokenSession ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={closeMobileMenu}
                    className="text-sm font-medium text-accent-400"
                  >
                    ⚙️ Панель управления
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      logout();
                    }}
                    className="text-left text-sm font-medium text-white/90"
                  >
                    Выход
                  </button>
                </>
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
        onClose={() => setIsAuthOpen(false)}
        onSuccess={onAuthSuccess}
      />
    </>
  );
}

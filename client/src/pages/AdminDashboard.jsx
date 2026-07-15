import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApiClient } from '../api';
import AdminPackages from '../components/admin/AdminPackages';
import PackageFormModal from '../components/admin/PackageFormModal';
import { clearPackageDraft, loadPackageDraft, savePackageDraft } from '../utils/packageDraft';

const emptyMaterial = (order) => ({
  type: 'text',
  title: '',
  content: '',
  url: '',
  order,
});

function formatChatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function truncatePreview(text, max = 48) {
  if (!text) return '';
  const t = String(text).trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function getInitials(name, email) {
  const s = (name && String(name).trim()) || (email && String(email).split('@')[0]) || '?';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return s.slice(0, 2).toUpperCase();
}

/** Короткое время для списка чатов */
function formatListTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('packages');

  const [packages, setPackages] = useState([]);
  const [packageStats, setPackageStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalPackages: 0,
    topPackage: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [draftHint, setDraftHint] = useState(null);
  const [packageFormError, setPackageFormError] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('OGE-IST');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState([emptyMaterial(0)]);
  const [coverUrl, setCoverUrl] = useState('');

  const [chats, setChats] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  /** userId открытого чата; null — чат не выбран */
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const chatEndRef = useRef(null);

  const filteredChats = useMemo(() => {
    const q = chatSearchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => {
      const blob = `${c.name || ''} ${c.email || ''} ${c.lastMessage?.content || ''}`.toLowerCase();
      return blob.includes(q);
    });
  }, [chats, chatSearchQuery]);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[admin-ui] loadPackages');
      const { data } = await adminApiClient.packages();
      console.log('[admin-ui] loadPackages ok, count:', data.packages?.length ?? 0);
      setPackages(data.packages ?? []);
      setPackageStats(
        data.stats ?? {
          totalSales: 0,
          totalRevenue: 0,
          totalPackages: data.packages?.length ?? 0,
          topPackage: null,
        },
      );
    } catch (err) {
      console.error('[admin-ui] loadPackages failed', err);
      const msg = err.response?.data?.message || 'Не удалось загрузить пакеты';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const t = setTimeout(() => setSuccessMessage(''), 4500);
    return () => clearTimeout(t);
  }, [successMessage]);

  useEffect(() => {
    if (!modalOpen || editingId) return undefined;
    const t = setTimeout(() => {
      savePackageDraft({
        title,
        slug,
        category,
        price,
        description,
        coverUrl,
        materials,
      });
    }, 700);
    return () => clearTimeout(t);
  }, [modalOpen, editingId, title, slug, category, price, description, coverUrl, materials]);

  useEffect(() => {
    let cancelled = false;
    adminApiClient
      .adminChats()
      .then(({ data }) => {
        if (!cancelled) setTotalUnread(data.totalUnread ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'chat') return undefined;

    let cancelled = false;

    const tick = async () => {
      try {
        const { data } = await adminApiClient.adminChats();
        if (cancelled) return;
        const list = data.chats ?? [];
        setChats(list);
        setTotalUnread(data.totalUnread ?? 0);
        setSelectedChatId((prev) => {
          if (prev == null) return null;
          if (list.some((c) => c.userId === prev)) return prev;
          return null;
        });
      } catch {
        if (!cancelled) setError('Не удалось загрузить чаты');
      }
    };

    tick();
    const interval = setInterval(tick, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'chat') {
      setSelectedChatId(null);
      setChatMessages([]);
      setChatSearchQuery('');
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'chat' || selectedChatId == null) return undefined;

    let cancelled = false;
    const tick = async () => {
      try {
        const { data } = await adminApiClient.adminChatThread(selectedChatId);
        if (cancelled) return;
        setChatMessages(data.messages ?? []);
        setSelectedUserEmail(data.user?.email ?? '');
      } catch {
        if (!cancelled) setChatMessages([]);
      }
    };

    setChatLoading(true);
    tick().finally(() => {
      if (!cancelled) setChatLoading(false);
    });
    const interval = setInterval(tick, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeTab, selectedChatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategory('OGE-IST');
    setPrice('');
    setDescription('');
    setMaterials([emptyMaterial(0)]);
    setCoverUrl('');
    setCoverUploading(false);
    setCoverUploadProgress(0);
    setMaterialUploadIndex(null);
    setMaterialUploadProgress(0);
    setFieldErrors({});
    setDraftHint(null);
    setPackageFormError('');
  };

  const openCreate = () => {
    setPackageFormError('');
    const draft = loadPackageDraft();
    if (draft && window.confirm('Восстановить сохранённый черновик пакета?')) {
      setEditingId(null);
      setTitle(draft.title ?? '');
      setSlug(draft.slug ?? '');
      setCategory(draft.category && ['OGE-IST', 'EGE-IST', 'EGE-SOC'].includes(draft.category) ? draft.category : 'OGE-IST');
      setPrice(draft.price != null ? String(draft.price) : '');
      setDescription(draft.description ?? '');
      setCoverUrl(draft.coverUrl ?? '');
      if (Array.isArray(draft.materials) && draft.materials.length > 0) {
        setMaterials(
          draft.materials.map((m, i) => ({
            type: m.type || 'text',
            title: m.title || '',
            content: m.type === 'text' ? (m.content || '') : '',
            url: m.type === 'text' ? '' : (m.url || m.content || ''),
            order: Number.isFinite(Number(m.order)) ? Number(m.order) : i,
          })),
        );
      } else {
        setMaterials([emptyMaterial(0)]);
      }
      setDraftHint('Черновик восстановлен из браузера.');
    } else {
      resetForm();
      setDraftHint('Изменения автоматически сохраняются как черновик в этом браузере.');
    }
    setModalOpen(true);
  };

  const openEdit = (pkg) => {
    setFieldErrors({});
    setPackageFormError('');
    setDraftHint(null);
    setEditingId(pkg.id);
    setTitle(pkg.title);
    setSlug(pkg.slug);
    setCategory(pkg.category);
    setPrice(String(pkg.price));
    setDescription(pkg.description);
    const raw = Array.isArray(pkg.materials) ? pkg.materials : [];
    if (raw.length === 0) {
      setMaterials([emptyMaterial(0)]);
    } else {
      setMaterials(
        raw.map((m, i) => ({
          type: m.type || 'text',
          title: m.title || '',
          content: m.type === 'text' ? (m.content || '') : '',
          url: m.type === 'text' ? '' : (m.url || m.content || ''),
          order: Number.isFinite(Number(m.order)) ? Number(m.order) : i,
        })),
      );
    }
    setCoverUrl(pkg.coverUrl || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleDiscardDraft = () => {
    clearPackageDraft();
    setDraftHint('Черновик в браузере удалён.');
    if (!editingId) {
      setTitle('');
      setSlug('');
      setCategory('OGE-IST');
      setPrice('');
      setDescription('');
      setMaterials([emptyMaterial(0)]);
      setCoverUrl('');
    }
  };
  const normalizedMaterials = () =>
    materials
      .map((m, i) => {
        const type = m.type;
        const title = (m.title || '').trim() || `Материал ${i + 1}`;
        if (type === 'text') {
          const content = (m.content || '').trim() || (m.url || '').trim();
          return { type: 'text', title, content, order: Number(i) };
        }
        const url = (m.url || '').trim() || (m.content || '').trim();
        return { type, title, url, order: Number(i) };
      })
      .filter((row) => {
        if (row.type === 'text') return row.content.length > 0;
        return row.url.length > 0;
      });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (title.trim().length < 3) {
      errs.title = 'Название — не менее 3 символов';
    }
    if (description.trim().length < 3) {
      errs.description = 'Описание — не менее 3 символов';
    }
    const priceNum = Number(price);
    if (!price || !Number.isFinite(priceNum) || priceNum < 1 || !Number.isInteger(priceNum)) {
      errs.price = 'Укажите целую цену в рублях (от 1)';
    }
    if (editingId && slug.trim().length < 3) {
      errs.slug = 'Slug — не менее 3 символов';
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setPackageFormError('Проверьте выделенные поля');
      return;
    }
    setFieldErrors({});
    setPackageFormError('');

    setSaving(true);
    setError('');
    try {
      const mats = normalizedMaterials();
      const payloadBase = {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category,
        coverUrl: coverUrl.trim() || null,
        materials: mats,
      };
      console.log('[admin-ui] submit package', {
        mode: editingId ? 'update' : 'create',
        title: payloadBase.title,
        price: payloadBase.price,
        category: payloadBase.category,
        materialsCount: payloadBase.materials.length,
        hasCover: Boolean(payloadBase.coverUrl),
      });

      if (editingId) {
        await adminApiClient.updatePackage(editingId, {
          ...payloadBase,
          slug: slug.trim(),
        });
      } else {
        await adminApiClient.createPackage(payloadBase);
      }
      clearPackageDraft();
      setSuccessMessage(editingId ? 'Пакет успешно обновлён' : 'Пакет успешно создан');
      setPackageFormError('');
      closeModal();
      await loadPackages();
    } catch (err) {
      console.error('[admin-ui] package save failed', err);
      const d = err.response?.data;
      const status = err.response?.status;
      const joined = Array.isArray(d?.errors) ? d.errors.map((x) => x.message).join(' · ') : '';
      const msg =
        d?.message ||
        d?.error ||
        joined ||
        (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Сервер недоступен. Подождите 30 сек (Render просыпается) и повторите.'
          : 'Ошибка сохранения');
      setPackageFormError(msg);
      if (status === 400 && Array.isArray(d?.errors)) {
        const fe = {};
        for (const e of d.errors) {
          const path = String(e.field || '');
          if (path.includes('title')) fe.title = e.message;
          else if (path.includes('slug')) fe.slug = e.message;
          else if (path.includes('price')) fe.price = e.message;
          else if (path.includes('description')) fe.description = e.message;
          else if (path.includes('materials')) {
            fe.materials = fe.materials ? `${fe.materials} ${e.message}` : e.message;
          }
        }
        if (Object.keys(fe).length) setFieldErrors(fe);
        else setFieldErrors({});
      } else {
        setFieldErrors({});
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот пакет?')) return;
    setError('');
    try {
      await adminApiClient.deletePackage(id);
      await loadPackages();
    } catch {
      setError('Не удалось удалить пакет');
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || selectedChatId == null) return;
    setChatSending(true);
    setError('');
    try {
      console.log('[admin-ui] send chat', selectedChatId);
      await adminApiClient.postAdminChatMessage({ userId: selectedChatId, content: text });
      setChatInput('');
      const { data } = await adminApiClient.adminChatThread(selectedChatId);
      setChatMessages(data.messages ?? []);
      setSelectedUserEmail(data.user?.email ?? '');
      const { data: meta } = await adminApiClient.adminChats();
      setChats(meta.chats ?? []);
      setTotalUnread(meta.totalUnread ?? 0);
    } catch (err) {
      console.error('[admin-ui] send chat failed', err);
      setError(err.response?.data?.message || 'Не удалось отправить сообщение');
    } finally {
      setChatSending(false);
    }
  };

  const handleSelectChat = (c) => {
    setSelectedChatId(c.userId);
    setSelectedUserEmail(c.email ?? '');
  };

  /** Закрыть чат без удаления сообщений */
  const handleCloseChat = () => {
    setSelectedChatId(null);
    setChatMessages([]);
  };

  const handleDeleteChatRow = async (userId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Удалить чат с этим пользователем? Переписка будет удалена.')) return;
    setError('');
    try {
      await adminApiClient.deleteAdminChat(userId);
      const { data } = await adminApiClient.adminChats();
      const list = data.chats ?? [];
      setChats(list);
      setTotalUnread(data.totalUnread ?? 0);
      if (selectedChatId === userId) {
        setSelectedChatId(null);
        setSelectedUserEmail('');
        setChatMessages([]);
      }
    } catch {
      setError('Не удалось удалить чат');
    }
  };

  const handleClearCurrentThread = async () => {
    if (selectedChatId == null) return;
    if (!window.confirm('Очистить все сообщения? Чат останется открытым.')) return;
    setError('');
    try {
      await adminApiClient.clearAdminChat(selectedChatId);
      setChatMessages([]);
      const { data } = await adminApiClient.adminChats();
      setChats(data.chats ?? []);
      setTotalUnread(data.totalUnread ?? 0);
    } catch {
      setError('Не удалось очистить переписку');
    }
  };

  const handleDeleteCurrentThread = async () => {
    if (selectedChatId == null) return;
    if (!window.confirm('Удалить чат полностью? Переписка будет удалена, чат закроется.')) return;
    setError('');
    try {
      await adminApiClient.deleteAdminChat(selectedChatId);
      const { data } = await adminApiClient.adminChats();
      setChats(data.chats ?? []);
      setTotalUnread(data.totalUnread ?? 0);
      setSelectedChatId(null);
      setSelectedUserEmail('');
      setChatMessages([]);
    } catch {
      setError('Не удалось удалить чат');
    }
  };

  const handleRefreshChats = async () => {
    setError('');
    try {
      const { data } = await adminApiClient.adminChats();
      setChats(data.chats ?? []);
      setTotalUnread(data.totalUnread ?? 0);
      if (selectedChatId != null) {
        const { data: thread } = await adminApiClient.adminChatThread(selectedChatId);
        setChatMessages(thread.messages ?? []);
        setSelectedUserEmail(thread.user?.email ?? '');
      }
    } catch {
      setError('Не удалось обновить');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const tabClass = (active) => `admin-tab ${active ? 'admin-tab--active' : 'admin-tab--idle'}`;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900">
      <header className="admin-header header-entrance relative isolate overflow-hidden">
        <img src="/header-bg.png" alt="" className="admin-header__pattern" aria-hidden draggable={false} />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <img src="/logo-full.png" alt="Династия" className="admin-logo block shrink-0" />
            <h1 className="hidden text-base font-bold text-white sm:block sm:text-lg md:text-xl">
              Панель управления
            </h1>
            <button type="button" onClick={handleLogout} className="admin-btn-ghost shrink-0">
              Выход
            </button>
          </div>
          <Link to="/" className="admin-btn-gold shrink-0 no-underline">
            На сайт
          </Link>
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-wrap gap-1 px-4 sm:px-6">
          <button
            type="button"
            className={tabClass(activeTab === 'packages')}
            onClick={() => setActiveTab('packages')}
          >
            📦 Пакеты
          </button>
          <button
            type="button"
            className={tabClass(activeTab === 'chat')}
            onClick={() => setActiveTab('chat')}
          >
            💬 Чат поддержки
            {totalUnread > 0 ? (
              <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                {totalUnread}
              </span>
            ) : null}
          </button>
          <Link to="/admin/footer-settings" className={`${tabClass(false)} no-underline`}>
            ⚙️ Футер
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {successMessage ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
            {successMessage}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {activeTab === 'packages' ? (
          <div key="tab-packages" className="admin-fade-in">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#244E77] sm:text-xl">Каталог пакетов</h2>
                <p className="text-sm text-gray-500">Создание, редактирование и удаление учебных пакетов</p>
              </div>
              <button type="button" onClick={openCreate} className="admin-btn-gold">
                + Создать пакет
              </button>
            </div>

            <AdminPackages
              packages={packages}
              stats={packageStats}
              loading={loading}
              onCreate={openCreate}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </div>
        ) : (
          <div className="admin-fade-in flex h-[calc(100vh-200px)] min-h-[380px] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg md:flex-row">
            {/* Левая колонка — список чатов (~350–400px на десктопе) */}
            <div
              className={`flex w-full flex-col border-gray-200 md:h-full md:w-96 md:min-w-[320px] md:max-w-[400px] md:shrink-0 md:border-r ${
                selectedChatId != null ? 'hidden min-h-0 md:flex' : 'min-h-0 flex-1 md:flex-none'
              }`}
            >
              <div className="shrink-0 border-b border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#244E77]">Чаты с клиентами</h2>
                  <button
                    type="button"
                    onClick={handleRefreshChats}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
                    title="Обновить список"
                  >
                    ↻ Обновить
                  </button>
                </div>
                <label className="sr-only" htmlFor="admin-chat-search">
                  Поиск по чатам
                </label>
                <input
                  id="admin-chat-search"
                  type="search"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Поиск по имени, email или тексту…"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#244E77]"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">
                    {chats.length === 0 ? 'Пока нет диалогов.' : 'Ничего не найдено.'}
                  </p>
                ) : (
                  filteredChats.map((c, idx) => (
                    <div
                      key={c.userId}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectChat(c)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault();
                          handleSelectChat(c);
                        }
                      }}
                      style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
                      className={`admin-chat-row group flex cursor-pointer items-center gap-3 border-b border-gray-100 p-3 text-left transition hover:bg-gray-100 ${
                        selectedChatId === c.userId ? 'bg-blue-50' : ''
                      } ${c.unreadCount > 0 ? 'font-medium' : ''}`}
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#244E77] to-[#163754] text-sm font-bold text-white shadow-inner"
                        aria-hidden
                      >
                        {getInitials(c.name, c.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-semibold text-gray-900">{c.name || c.email}</p>
                          <span className="shrink-0 text-xs tabular-nums text-gray-400">
                            {formatListTime(c.lastMessage?.createdAt)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-gray-500">{c.email}</p>
                        <p
                          className={`mt-0.5 truncate text-sm ${c.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                        >
                          {truncatePreview(c.lastMessage?.content ?? '')}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 self-stretch py-0.5">
                        {c.unreadCount > 0 ? (
                          <span className="flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold leading-none text-white">
                            {c.unreadCount}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          title="Удалить чат"
                          onClick={(ev) => handleDeleteChatRow(c.userId, ev)}
                          className="rounded-full p-2 text-gray-400 opacity-80 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Правая колонка — открытый чат */}
            <div
              className={`min-h-0 min-w-0 flex-1 flex-col bg-white ${
                selectedChatId != null ? 'flex min-h-0' : 'hidden min-h-0 md:flex'
              }`}
            >
              {selectedChatId == null ? (
                <div className="flex flex-1 items-center justify-center bg-gray-50/60 px-6 text-center text-gray-400">
                  <p className="text-base">Выберите чат из списка слева</p>
                </div>
              ) : (
                <>
                  <div className="flex shrink-0 flex-col gap-3 border-b border-gray-200 bg-gray-50 p-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-2 md:items-center">
                      <button
                        type="button"
                        onClick={handleCloseChat}
                        className="shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#244E77] shadow-sm hover:bg-gray-100 md:hidden"
                      >
                        ← Назад к списку
                      </button>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-gray-900">
                          {selectedUserEmail || 'Клиент'}
                        </h3>
                        <p className="text-xs text-gray-500">Оффлайн · последнее посещение недоступно</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                      <button
                        type="button"
                        onClick={handleRefreshChats}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Обновить
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCurrentThread}
                        className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                      >
                        Очистить переписку
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteCurrentThread}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Удалить чат
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseChat}
                        className="hidden rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 md:inline-block"
                      >
                        ✕ Закрыть чат
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#eceff1] p-4 md:bg-[#f4f6f8]">
                    {chatLoading ? (
                      <p className="text-center text-sm text-gray-500">Загрузка…</p>
                    ) : chatMessages.length === 0 ? (
                      <p className="text-center text-sm text-gray-500">Сообщений пока нет.</p>
                    ) : (
                      chatMessages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[min(85%,26rem)] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                              m.isAdmin
                                ? 'rounded-br-sm bg-[#244E77] text-white'
                                : 'rounded-bl-sm border border-gray-300/60 bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                            <div
                              className={`mt-1 flex items-center justify-end gap-1.5 text-[11px] tabular-nums ${
                                m.isAdmin ? 'text-white/80' : 'text-gray-500'
                              }`}
                            >
                              <span>{formatChatTime(m.createdAt)}</span>
                              {m.isAdmin ? (
                                <span className="inline-flex -space-x-1.5 pl-0.5" title="Отправлено">
                                  <span className={m.isRead ? 'text-sky-200' : 'text-white/55'}>✓</span>
                                  <span className={m.isRead ? 'text-sky-200' : 'text-white/55'}>✓</span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form
                    onSubmit={handleSendChat}
                    className="flex shrink-0 gap-2 border-t border-gray-200 bg-white p-3"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Напишите сообщение…"
                      disabled={chatSending}
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#244E77] focus:ring-1 focus:ring-[#244E77]/25 disabled:bg-gray-50"
                    />
                    <button
                      type="submit"
                      disabled={chatSending || !chatInput.trim()}
                      className="shrink-0 rounded-xl bg-[#244E77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163754] disabled:opacity-50"
                    >
                      {chatSending ? '…' : 'Отправить'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <PackageFormModal
        open={modalOpen}
        onClose={closeModal}
        formError={packageFormError}
        editingId={editingId}
        title={title}
        setTitle={setTitle}
        slug={slug}
        setSlug={setSlug}
        category={category}
        setCategory={setCategory}
        price={price}
        setPrice={setPrice}
        description={description}
        setDescription={setDescription}
        coverUrl={coverUrl}
        setCoverUrl={setCoverUrl}
        materials={materials}
        setMaterials={setMaterials}
        saving={saving}
        onSubmit={handleSubmit}
        fieldErrors={fieldErrors}
        draftHint={draftHint}
        onDiscardDraft={handleDiscardDraft}
      />
    </div>
  );
}

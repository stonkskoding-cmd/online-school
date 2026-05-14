import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApiClient } from '../api';

const CATEGORY_OPTIONS = [
  { value: 'OGE-IST', label: 'ОГЭ История' },
  { value: 'EGE-IST', label: 'ЕГЭ История' },
  { value: 'EGE-SOC', label: 'ЕГЭ Обществознание' },
];

const MATERIAL_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'image', label: 'Изображение' },
  { value: 'video', label: 'Видео' },
  { value: 'file', label: 'Файл' },
];

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('OGE-IST');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState([emptyMaterial(0)]);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  /** Индекс строки материала, для которой идёт загрузка файла (null — нет) */
  const [materialUploadIndex, setMaterialUploadIndex] = useState(null);

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
      const { data } = await adminApiClient.packages();
      setPackages(data.packages ?? []);
    } catch {
      setError('Не удалось загрузить пакеты');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

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
    setMaterialUploadIndex(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleCoverFileChange = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setCoverUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await adminApiClient.uploadFile(fd);
      if (data?.url) setCoverUrl(data.url);
    } catch {
      setError('Не удалось загрузить файл. Проверьте авторизацию и размер файла.');
    } finally {
      setCoverUploading(false);
    }
  };

  const openEdit = (pkg) => {
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
          order: typeof m.order === 'number' ? m.order : i,
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

  const addMaterialRow = () => {
    setMaterials((prev) => [...prev, emptyMaterial(prev.length)]);
  };

  const removeMaterialRow = (index) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i })));
  };

  const updateMaterial = (index, field, value) => {
    setMaterials((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  };

  const handleMaterialFileUpload = async (index, file) => {
    setMaterialUploadIndex(index);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await adminApiClient.uploadFile(fd);
      if (!data?.url) return;
      const guess = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'file';
      setMaterials((prev) =>
        prev.map((row, i) => {
          if (i !== index) return row;
          const nextType = row.type === 'text' ? guess : row.type;
          return { ...row, url: data.url, type: nextType, content: '' };
        }),
      );
    } catch {
      setError('Не удалось загрузить файл материала.');
    } finally {
      setMaterialUploadIndex(null);
    }
  };

  const normalizedMaterials = () =>
    materials
      .map((m, i) => {
        const type = m.type;
        const title = (m.title || '').trim() || `Материал ${i + 1}`;
        if (type === 'text') {
          const content = (m.content || '').trim() || (m.url || '').trim();
          return { type: 'text', title, content, order: i };
        }
        const url = (m.url || '').trim() || (m.content || '').trim();
        return { type, title, url, order: i };
      })
      .filter((row) => {
        if (row.type === 'text') return row.content.length > 0;
        return row.url.length > 0;
      });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const mats = normalizedMaterials();
      const payloadBase = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        coverUrl: coverUrl.trim() || null,
        materials: mats,
      };

      if (editingId) {
        await adminApiClient.updatePackage(editingId, {
          ...payloadBase,
          slug: slug.trim(),
        });
      } else {
        await adminApiClient.createPackage(payloadBase);
      }
      closeModal();
      await loadPackages();
    } catch (err) {
      const d = err.response?.data;
      const joined = Array.isArray(d?.errors) ? d.errors.map((x) => x.message).join(' ') : '';
      const msg = d?.message || joined || err.response?.data?.errors?.[0]?.message;
      setError(msg || 'Ошибка сохранения');
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
      await adminApiClient.postAdminChatMessage({ userId: selectedChatId, content: text });
      setChatInput('');
      const { data } = await adminApiClient.adminChatThread(selectedChatId);
      setChatMessages(data.messages ?? []);
      setSelectedUserEmail(data.user?.email ?? '');
      const { data: meta } = await adminApiClient.adminChats();
      setChats(meta.chats ?? []);
      setTotalUnread(meta.totalUnread ?? 0);
    } catch (err) {
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
    if (!window.confirm('Удалить всю переписку с этим пользователем?')) return;
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
      setError('Не удалось удалить переписку');
    }
  };

  const handleClearCurrentThread = () => {
    if (selectedChatId == null) return;
    void handleDeleteChatRow(selectedChatId);
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

  const categoryLabel = (value) =>
    CATEGORY_OPTIONS.find((c) => c.value === value)?.label || value;

  const tabBase =
    'rounded-t-lg px-5 py-3 text-sm font-semibold transition border border-b-0 border-gray-200';
  const tabActive = 'bg-[#244E77] text-white border-[#244E77]';
  const tabInactive = 'bg-white text-[#244E77] hover:bg-gray-100';

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="text-sm font-medium text-[#244E77] hover:underline">
              ← На сайт
            </Link>
            <h1 className="text-xl font-bold text-[#244E77] sm:text-2xl">Панель управления Династия</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#e8c85c] px-4 py-2 text-sm font-semibold text-[#244E77] shadow transition hover:from-[#c9a431] hover:to-[#D4AF37]"
          >
            Выход
          </button>
        </div>

        <div className="mx-auto flex max-w-6xl flex-wrap gap-0 px-4 sm:px-6">
          <button
            type="button"
            className={`${tabBase} ${activeTab === 'packages' ? tabActive : tabInactive}`}
            onClick={() => setActiveTab('packages')}
          >
            Пакеты
          </button>
          <button
            type="button"
            className={`${tabBase} ${activeTab === 'chat' ? tabActive : tabInactive}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Чат поддержки
            {totalUnread > 0 ? (
              <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                {totalUnread}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {activeTab === 'packages' ? (
          <>
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={openCreate}
                className="rounded-lg bg-[#244E77] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#163754]"
              >
                ➕ Добавить пакет
              </button>
            </div>

            {loading ? (
              <p className="text-gray-600">Загрузка…</p>
            ) : packages.length === 0 ? (
              <p className="text-gray-600">Пакетов пока нет.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-[#244E77] text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Название</th>
                      <th className="px-4 py-3 font-semibold">Цена, ₽</th>
                      <th className="px-4 py-3 font-semibold">Категория</th>
                      <th className="px-4 py-3 font-semibold text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-[#244E77]">{pkg.title}</td>
                        <td className="px-4 py-3">{pkg.price}</td>
                        <td className="px-4 py-3">{categoryLabel(pkg.category)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(pkg)}
                            className="mr-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#e8c85c] px-3 py-1.5 text-xs font-semibold text-[#244E77] hover:from-[#c9a431]"
                          >
                            Редактировать
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(pkg.id)}
                            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-[calc(100vh-200px)] min-h-[380px] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg md:flex-row">
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
                  filteredChats.map((c) => (
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
                      className={`group flex cursor-pointer items-center gap-3 border-b border-gray-100 p-3 text-left transition hover:bg-gray-100 ${
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
                          title="Удалить переписку"
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
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        🗑️ Очистить переписку
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

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="mb-4 text-lg font-bold text-[#244E77]">
              {editingId ? 'Редактировать пакет' : 'Новый пакет'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Название пакета</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#244E77]"
                />
              </div>
              {editingId ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Slug (URL)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    minLength={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-[#244E77]"
                  />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Категория</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#244E77]"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Цена (₽)</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#244E77]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={3}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#244E77]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Обложка пакета</label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.zip"
                  disabled={coverUploading}
                  onChange={handleCoverFileChange}
                  className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#244E77] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#163754]"
                />
                {coverUploading ? (
                  <p className="mt-1 text-xs text-gray-500">Загрузка файла…</p>
                ) : null}
                {coverUrl ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={coverUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-xs text-[#244E77] underline"
                      >
                        {coverUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Убрать обложку
                      </button>
                    </div>
                    <img
                      src={coverUrl}
                      alt=""
                      className="max-h-40 max-w-full rounded-lg border border-gray-200 object-contain shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="border-t border-gray-200 pt-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#244E77]">Материалы</span>
                  <button
                    type="button"
                    onClick={addMaterialRow}
                    className="text-xs font-medium text-[#244E77] underline hover:text-[#163754]"
                  >
                    + Добавить материал
                  </button>
                </div>
                <p className="mb-2 text-xs text-gray-500">
                  Текст вводится вручную. Для изображения, видео и файла — ссылка или кнопка «Загрузить файл» (сервер,
                  папка uploads).
                </p>
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {materials.map((m, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <select
                          value={m.type}
                          onChange={(e) => {
                            const v = e.target.value;
                            setMaterials((prev) =>
                              prev.map((row, i) =>
                                i === index
                                  ? {
                                      ...row,
                                      type: v,
                                      url: v === 'text' ? '' : row.url,
                                      content: v === 'text' ? row.content || row.url : '',
                                    }
                                  : row,
                              ),
                            );
                          }}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          {MATERIAL_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeMaterialRow(index)}
                          className="ml-auto text-xs text-red-600 hover:underline"
                        >
                          Удалить
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Заголовок материала"
                        value={m.title}
                        onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                        className="mb-2 w-full rounded border border-gray-200 px-2 py-1 text-sm"
                      />
                      {m.type === 'text' ? (
                        <textarea
                          placeholder="Текст урока"
                          value={m.content}
                          onChange={(e) => updateMaterial(index, 'content', e.target.value)}
                          rows={3}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                        />
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="https://… или URL после загрузки"
                            value={m.url}
                            onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="file"
                              id={`material-file-${index}`}
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = '';
                                if (f) void handleMaterialFileUpload(index, f);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById(`material-file-${index}`)?.click()}
                              disabled={materialUploadIndex === index}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-[#244E77] hover:bg-gray-100 disabled:opacity-50"
                            >
                              {materialUploadIndex === index ? '⏳ Загрузка…' : '📤 Загрузить файл'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-[#244E77] py-2.5 text-sm font-semibold text-[#D4AF37] disabled:opacity-50"
                >
                  {saving ? 'Сохранение…' : editingId ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

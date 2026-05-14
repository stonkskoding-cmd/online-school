import { purchasesApi } from '../api';

export default function PackageCard({ item, isAuthorized, onNeedAuth }) {
  const buy = async () => {
    if (!isAuthorized) {
      onNeedAuth();
      return;
    }

    try {
      await purchasesApi.create(item.id);
      alert('Пакет добавлен в покупки');
    } catch (error) {
      alert(error?.response?.data?.message || 'Не удалось купить пакет');
    }
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <h3 className="mb-2 text-xl font-bold text-gray-900">{item.title}</h3>
      <p className="mb-4 line-clamp-3 text-sm text-gray-600">{item.description}</p>

      <div className="mb-4 space-y-1 text-sm text-gray-500">
        <p>🎥 Видео, 📝 Текст, 📎 Файлы</p>
        <p>Категория: {item.category}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-2xl font-extrabold text-accent-500">{item.price.toLocaleString('ru-RU')} ₽</span>
        <button
          onClick={buy}
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-light"
        >
          Купить
        </button>
      </div>
    </article>
  );
}

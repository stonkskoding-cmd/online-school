import rateLimit from 'express-rate-limit';

/**
 * Ограничитель для чувствительных auth-эндпоинтов (вход/регистрация/админ-вход).
 * Лимит щедрый — живому пользователю хватает с запасом, но брутфорс пароля
 * (тысячи попыток) отсекается. Работает по IP (app.set('trust proxy', 1) уже задан).
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 минут
  max: 40, // не более 40 попыток с одного IP за окно
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Слишком много попыток. Подождите несколько минут и повторите.' },
});

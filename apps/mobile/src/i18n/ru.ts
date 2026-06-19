// Russian dictionary — the primary locale (TZ §8.6: RU is the base language).
// Keys are dot-namespaced by screen/concern. ADD EVERY user-facing string here;
// nothing belongs inline in JSX. `errors.*` is the target of errorToMessage()
// (keyed by the machine error code, not the HTTP status — TZ §8.2).
//
// `{placeholders}` are filled by t()'s second argument.

export const ru = {
  common: {
    appName: 'CARGO',
    back: 'Назад',
    retry: 'Повторить',
    loading: 'Загрузка…',
  },

  phone: {
    title: 'Вход',
    subtitle: 'Введите номер телефона — пришлём код по SMS',
    label: 'Номер телефона',
    placeholder: '996700000001',
    submit: 'Получить код',
  },

  code: {
    title: 'Подтверждение',
    // {len} — длина кода (из OTP_CODE_LENGTH), не хардкодим число в тексте.
    subtitle: 'Введите {len}-значный код из SMS на номер {phone}',
    label: 'Код из SMS',
    submit: 'Войти',
    resend: 'Отправить снова',
    resendIn: 'Отправить снова через {sec} с',
  },

  authed: {
    title: 'Вы вошли',
    role: 'Роль: {role}',
    room: 'Room: {room}',
    noRoom: 'Room ещё не назначен',
    logout: 'Выйти',
  },

  // Navigation / shared chrome.
  nav: {
    logout: 'Выйти',
  },

  // Экран «Мой адрес в Японии» (ТЗ §6.2). Адрес приходит с сервера готовой
  // строкой — здесь только подписи интерфейса, ни одной строки самого адреса.
  address: {
    title: 'Мой адрес в Японии',
    hint: 'Нажмите на строку, чтобы скопировать',
    copied: 'Скопировано',
    copy: 'Копировать',
    error: 'Не удалось загрузить адрес',
  },

  // Заглушка раздела ПВЗ (роль KG_WORKER) — экран в разработке.
  pvz: {
    placeholder: 'ПВЗ — в разработке',
  },

  // Список посылок (ТЗ §3). Бэкенд отдаёт только свои CLAIMED-посылки.
  parcels: {
    title: 'Мои посылки',
    empty: 'Посылок пока нет',
    error: 'Не удалось загрузить посылки',
  },

  // Карточка/детали посылки. Значения (статус, сумма, вес) приходят с сервера —
  // здесь только подписи. Единица «кг» вынесена в формат, чтобы не хардкодить.
  parcel: {
    title: 'Посылка',
    error: 'Не удалось загрузить посылку',
    history: 'История статусов',
    details: 'Детали',
    track: 'Трек-номер',
    weight: 'Вес',
    weightValue: '{kg} кг',
    category: 'Категория',
    shop: 'Магазин',
    amount: 'К оплате',
    pvz: 'Пункт выдачи',
    pvz_pending: 'Пункт выдачи будет назначен по прибытии',
  },

  // Поиск посылки по трек-номеру + привязка/спор (ТЗ §6.4). Значения карточки
  // (статус, местонахождение, claim_status) приходят с сервера — здесь только
  // подписи. Привязка (claim) — пустое тело, личность из JWT.
  track: {
    title: 'Найти посылку',
    placeholder: 'Введите трек-номер',
    search: 'Найти',
    hint: 'Введите трек-номер посылки',
    not_found: 'Посылка не найдена',
    location: 'Местонахождение',
    claim: 'Это моя посылка',
    claimed_success: 'Посылка привязана',
    already_claimed: 'Эту посылку уже привязал другой клиент. Если вы уверены, что она ваша — откройте спор',
    dispute: 'Оспорить',
    dispute_title: 'Оспорить привязку',
    dispute_comment: 'Комментарий (необязательно)',
    dispute_confirm: 'Подтвердить спор',
    dispute_cancel: 'Отмена',
    disputed_success: 'Спор передан администратору',
    disputed_pending: 'Посылка уже оспаривается',
    already_disputed: 'Ваш спор уже на рассмотрении',
    cannot_dispute: 'Нельзя оспорить эту посылку',
  },

  // Pre-alert'ы (ТЗ §6.5): клиент заранее заявляет ожидаемую посылку по
  // трек-номеру. Статус приходит с сервера (ACTIVE / MATCHED / CANCELLED) —
  // здесь только его лейблы; CANCELLED-заявки экран не показывает. Поле суммы на
  // сервере называется declared_value, но по ТЗ лейбл — «Ориентировочная
  // стоимость».
  prealert: {
    title: 'Мои заявки',
    open: 'Заявки',
    empty: 'Пока нет ни одной заявки',
    error: 'Не удалось загрузить заявки',
    create: 'Создать заявку',
    create_title: 'Новая заявка',
    track_number: 'Трек-номер',
    track_placeholder: 'Введите трек-номер',
    shop_name: 'Магазин',
    shop_placeholder: 'Например, Amazon',
    category: 'Категория',
    category_placeholder: 'Выберите категорию',
    category_error: 'Не удалось загрузить категории',
    estimated_value: 'Ориентировочная стоимость',
    estimated_value_placeholder: 'Например, 5000',
    submit: 'Создать',
    cancel: 'Отмена',
    created_success: 'Заявка создана',
    duplicate_track: 'Заявка с этим трек-номером уже существует',
    delete: 'Удалить',
    delete_confirm_title: 'Удалить заявку?',
    delete_confirm_message: 'Это действие нельзя отменить',
    deleted_success: 'Заявка удалена',
    // Лейблы статусов — по реальным значениям из схемы (ACTIVE/MATCHED).
    status_active: 'Ждём посылку',
    status_matched: 'Получена',
    // Сообщения валидации формы (RHF + zod).
    v_track: 'Введите трек-номер',
    v_shop: 'Введите магазин',
    v_category: 'Выберите категорию',
    v_value: 'Введите сумму числом',
  },

  // Гейт по роли: пользователь без поддерживаемой роли.
  noAccess: {
    title: 'Нет доступа',
    description: 'Для вашей роли пока нет экранов в приложении.',
  },

  // errorToMessage(ApiError) → one of these, selected by the machine `code`.
  errors: {
    INVALID_OTP: 'Неверный код. Проверьте SMS и попробуйте снова.',
    NETWORK_ERROR: 'Нет связи с сервером. Проверьте интернет и повторите.',
    VALIDATION_ERROR: 'Проверьте введённые данные.',
    unknown: 'Что-то пошло не так. Попробуйте ещё раз.',
  },

  // react-hook-form + zod field messages.
  validation: {
    phoneRequired: 'Введите номер телефона',
    phoneFormat: 'Номер в формате 996XXXXXXXXX (12 цифр)',
    codeLength: 'Код состоит из {len} цифр',
  },
} as const;

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

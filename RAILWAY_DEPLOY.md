# Деплой на Railway

## Підготовка проєкту ✅

Проєкт вже підготовлений для деплою на Railway! Внесені наступні зміни:

### Файли конфігурації:
- ✅ `Procfile` - налаштований для запуску з gunicorn
- ✅ `requirements.txt` - містить усі необхідні залежності
- ✅ `runtime.txt` - встановлена версія Python 3.11.12
- ✅ `railway.json` - конфігурація для Railway
- ✅ `core/settings.py` - оновлений для продакшна

### Основні зміни в settings.py:
- 🔐 Безпечні налаштування для продакшна
- 🗄️ Підтримка Railway PostgreSQL через DATABASE_URL
- 📁 Налаштування статичних файлів з WhiteNoise
- 🌍 Змінні середовища для конфігурації
- 📋 Логування для моніторингу

## Кроки для деплою:

### 1. Підготовка Railway
1. Зареєструйтеся на [Railway.app](https://railway.app/)
2. Підключіть свій GitHub акаунт
3. Створіть новий проєкт "Deploy from GitHub repo"

### 2. Налаштування бази даних
1. В Railway dashboard додайте PostgreSQL сервіс
2. Railway автоматично створить DATABASE_URL змінну

### 3. Змінні середовища
Додайте наступні змінні в Railway dashboard:

**Обов'язкові:**
```
DJANGO_SECRET_KEY=your-very-long-random-secret-key
DEBUG=False
```

**Email налаштування:**
```
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

**Опціональні:**
```
STUDENT_PASSWORD=YourCustomPassword
DJANGO_LOG_LEVEL=INFO
```

### 4. Деплой
1. Railway автоматично зробить build і deploy
2. Після першого деплою виконайте міграції:
   - Відкрийте Railway Console
   - Виконайте: `python manage.py migrate`
   - Створіть суперюзера: `python manage.py createsuperuser`

### 5. Статичні файли
Railway автоматично збере статичні файли під час деплою завдяки WhiteNoise.

## Важливі нотатки:

⚠️ **Безпека:**
- Змініть DJANGO_SECRET_KEY на унікальний ключ
- Ніколи не публікуйте реальні паролі в коді
- Використовуйте змінні середовища для чутливих даних

🔗 **Домен:**
- Railway автоматично надасть вам домен
- Можете підключити власний домен в налаштуваннях

📊 **Моніторинг:**
- Перевіряйте логи в Railway dashboard
- Налаштовано логування для відстеження помилок

## Готово! 🚀

Ваш проєкт готовий до деплою на Railway. Просто відправте код в GitHub і підключіть репозиторій до Railway. 
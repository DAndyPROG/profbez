# ✅ Чеклист для деплою на Railway

## Швидкий старт:

### 1. 🚀 Railway Setup
- [ ] Зареєструйтесь на [railway.app](https://railway.app)
- [ ] Підключіть GitHub репозиторій
- [ ] Додайте PostgreSQL сервіс

### 2. 🔑 Змінні середовища (Variables)
Додайте в Railway dashboard:

```bash
# ОБОВ'ЯЗКОВО!
DJANGO_SECRET_KEY=FMmW2CDxX5b-!yFWLo1d=Xx1DS!pfxl4oEjFiAuf=zlwjOEKth
DEBUG=False

# EMAIL (замініть на ваші дані)
EMAIL_HOST_USER=ваш-email@gmail.com
EMAIL_HOST_PASSWORD=ваш-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### 3. 📦 Після деплою
В Railway Console виконайте:
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### 4. 🌐 Готово!
Ваш сайт буде доступний за адресою, яку надасть Railway.

---

## 📋 Що було налаштовано:

✅ **Procfile** - gunicorn конфігурація  
✅ **settings.py** - продакшн налаштування  
✅ **WhiteNoise** - статичні файли  
✅ **PostgreSQL** - база даних  
✅ **Environment variables** - безпека  
✅ **railway.json** - конфігурація  
✅ **Logging** - моніторинг  

## 🔧 Файли проєкту:
- `Procfile` → Railway запуск
- `requirements.txt` → Python залежності
- `runtime.txt` → Python версія
- `railway.json` → Railway налаштування
- `core/settings.py` → Django конфігурація
- `generate_secret_key.py` → Генератор ключів

## 📞 Підтримка:
Якщо щось не працює, перевірте:
1. 🔍 Railway logs для помилок
2. 🔑 Чи всі змінні середовища встановлені
3. 🗄️ Чи PostgreSQL сервіс працює
4. 🚀 Чи виконано міграції бази даних

**Проєкт готовий до деплою! 🎉** 
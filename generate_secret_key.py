#!/usr/bin/env python3
"""
Скрипт для генерації безпечного Django SECRET_KEY
Запустіть: python generate_secret_key.py
"""
import secrets
import string

def generate_secret_key(length=50):
    """Генерує безпечний SECRET_KEY для Django"""
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    secret_key = generate_secret_key()
    print("Ваш новий Django SECRET_KEY:")
    print("=" * 60)
    print(secret_key)
    print("=" * 60)
    print("\nДодайте цей ключ як змінну середовища DJANGO_SECRET_KEY в Railway!") 
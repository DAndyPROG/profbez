"""
Django command to create a superuser if it doesn't exist.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    """Django command to create a superuser"""

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Проверяем, существует ли уже суперюзер
        if User.objects.filter(username='admin').exists():
            self.stdout.write(
                self.style.WARNING('Суперюзер "admin" уже существует!')
            )
            return
        
        # Создаем суперюзера
        try:
            user = User.objects.create_superuser(
                username='admin',
                email='admin@profbezpeka.com.ua',
                password='admin123',
                first_name='Администратор',
                last_name='Системы',
                role='admin'
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Суперюзер "{user.username}" успешно создан!')
            )
            self.stdout.write(
                self.style.SUCCESS(f'   Email: {user.email}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'   Логин: admin')
            )
            self.stdout.write(
                self.style.SUCCESS(f'   Пароль: admin123')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Ошибка при создании суперюзера: {str(e)}')
            ) 
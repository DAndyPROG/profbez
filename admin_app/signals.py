from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver, Signal
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings

# Створюємо новий сигнал для реєстрації користувача
user_registered = Signal()

@receiver(user_logged_in)
def update_education_status(sender, request, user, **kwargs):
    """Змінює статус навчання на 'розпочато' при першому вході студента"""
    # Перевіряємо, що це студент
    if user.role == 'student':
        # Імпортуємо тут для уникнення циклічних імпортів
        from student_op_app.models import StudentInfo, Education
        
        try:
            # Отримуємо профіль студента
            student_info = StudentInfo.objects.get(user=user)
            student_info.status = 'started'
            student_info.save()
        
        except StudentInfo.DoesNotExist:
            # Якщо профіль студента не знайдено, просто продовжуємо
            print(f"Профіль студента для користувача {user.username} не знайдено")
        except Exception as e:
            # Логуємо будь-які інші помилки, але не зупиняємо процес входу
            print(f"Помилка при зміні статусу навчання: {str(e)}")

@receiver(user_registered)
def mark_new_registration(sender, user_id, **kwargs):
    """Позначає нового зареєстрованого користувача як новий"""
    # Імпортуємо тут для уникнення циклічних імпортів
    from ingener_op_app.models import IngenerInfo
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        user = User.objects.get(id=user_id)
        # Перевіряємо, що це інженер
        if user.role == 'ingener':
            ingener_info = IngenerInfo.objects.get(user=user)
            ingener_info.is_new_registration = True
            ingener_info.save()
            print(f"Користувача {user.username} позначено як новий")
    except Exception as e:
        print(f"Помилка при позначенні нового користувача: {str(e)}")

@receiver(user_registered)
def send_registration_notification_email(sender, user_id, **kwargs):
    """Відправляє повідомлення про нову реєстрацію на електронну пошту адміністратора"""
    # Імпортуємо тут для уникнення циклічних імпортів
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        user = User.objects.get(id=user_id)
        
        # Формуємо тему та текст листа
        subject = 'Новий користувач зареєструвався!'
        
        # Визначаємо тип користувача для повідомлення
        user_type = "інженер" if user.role == 'ingener' else "студент"
        
        # Формуємо додаткову інформацію залежно від типу користувача
        additional_info = ""
        if user.role == 'ingener':
            try:
                from ingener_op_app.models import IngenerInfo
                ingener_info = IngenerInfo.objects.get(user=user)
                company_name = ingener_info.company_name
                additional_info = f"\nНазва компанії: {company_name}"
            except Exception as e:
                print(f"Помилка при отриманні додаткової інформації: {str(e)}")
        
        # Формуємо повне повідомлення
        message = f"""Зареєстровано нового користувача:
            
Ім'я: {user.first_name} {user.last_name}
Email: {user.email}
Тип користувача: {user_type}{additional_info}

Перейдіть у панель адміністратора, щоб переглянути деталі.
"""
        
        # Визначаємо отримувачів (можна додати декілька адрес)
        admin_emails = [settings.ADMIN_EMAIL] if hasattr(settings, 'ADMIN_EMAIL') else ['admin@profbezpeka.com.ua']
        
        # Відправляємо лист
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@profbezpeka.com.ua',
            recipient_list=admin_emails,
            fail_silently=False, # встановіть True, якщо не хочете, щоб помилки відправки зупиняли процес
        )
        
        print(f"Надіслано повідомлення про реєстрацію користувача {user.username} на {admin_emails}")
    
    except Exception as e:
        print(f"Помилка при відправці повідомлення про нову реєстрацію: {str(e)}") 
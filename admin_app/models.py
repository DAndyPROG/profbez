from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Адміністратор'),
        ('ingener', 'Інженер ОП'),
        ('student', 'Слухач'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')
    first_login = models.DateTimeField(auto_now_add=True, verbose_name='Дата першого входу')
    phone_number = models.CharField(max_length=18, verbose_name='Номер телефону')
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to.',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.',
    )

    def __str__(self):
        return self.username
    
    class Meta:
        verbose_name = 'Користувач'
        verbose_name_plural = 'Користувачі'

class Course(models.Model):
    code = models.CharField(max_length=255, verbose_name='№ курсу', unique=True)
    course_name = models.CharField(max_length=255, verbose_name='Назва курсу')
    course_description = models.TextField(verbose_name='Опис курсу')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата оновлення')

    def __str__(self):
        return f"{self.code} - {self.course_name}"
    
    class Meta:
        verbose_name = 'Курс'
        verbose_name_plural = 'Курси'
        ordering = ['code']

class CourseVideo(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_videos', verbose_name='Курс')
    video_name = models.CharField(max_length=255, verbose_name='Назва відео')
    video_url = models.URLField(max_length=255, verbose_name='Посилання на відео')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата оновлення')

    def __str__(self):
        return f"{self.course.course_name} - {self.video_name}"
    
    class Meta:
        verbose_name = 'Відео'
        verbose_name_plural = 'Відео'




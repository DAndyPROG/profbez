from django.db import models
from django.conf import settings
from admin_app.models import Course
from ingener_op_app.models import IngenerInfo
from datetime import timedelta
from django.utils import timezone

class StudentInfo(models.Model):
    STATUS_CHOICES = [
        ('waiting_authorization', 'Очікує авторізації'),
        ('started', 'Розпочато'),
        ('completed', 'Завершено'),
    ]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_info', verbose_name='Користувач')
    position = models.CharField(max_length=255, verbose_name='Посада')
    ingener = models.ForeignKey(IngenerInfo, on_delete=models.PROTECT, related_name='students', verbose_name='Компанія')
    status = models.CharField(max_length=255, choices=STATUS_CHOICES, default='waiting_authorization', verbose_name='Статус')
    end_date = models.DateField(null=True, blank=True, editable=False, verbose_name='Тривалість навчання')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата оновлення')

    def save(self, *args, **kwargs):
        is_new = not self.pk
        
        # Зберігаємо об'єкт спочатку
        super().save(*args, **kwargs)
        
        # Оновлюємо end_date для нового об'єкту або якщо він не був встановлений
        if (is_new or not self.end_date) and self.created_at:
            self.end_date = self.created_at.date() + timedelta(days=365)
            # Оновлюємо в базі даних
            type(self).objects.filter(pk=self.pk).update(end_date=self.end_date)

    def __str__(self):
        return self.user.first_name + ' ' + self.user.last_name
    
    class Meta:
        verbose_name = 'Інформація про студента ОП'
        verbose_name_plural = 'Інформація про студентів ОП'

class Education(models.Model):
    student = models.ForeignKey(StudentInfo, on_delete=models.CASCADE, related_name='studies', verbose_name='Студент')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='studies', verbose_name='Курс')
    average_score = models.PositiveIntegerField(default=0, verbose_name='Середня оцінка')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата оновлення')

    def calculate_average_score(self):
        """Обчислює середню оцінку всіх тестів для цього навчання"""
        tests = self.tests.all()
        average = tests.aggregate(models.Avg('score'))['score__avg']
        return round(average) if average else 0

    def save(self, *args, **kwargs):
        # Спочатку зберігаємо об'єкт
        super().save(*args, **kwargs)
        
        # Після збереження оновлюємо середню оцінку
        new_average = self.calculate_average_score()
        if new_average != self.average_score:
            Education.objects.filter(pk=self.pk).update(average_score=new_average)
            self.average_score = new_average

    def __str__(self):
        return f"{self.student.user.first_name} {self.student.user.last_name} - {self.course.course_name}"
    
    class Meta:
        verbose_name = 'Навчання'
        verbose_name_plural = 'Навчання'
        unique_together = ('student', 'course')  # Додаємо унікальний ключ для пари студент-курс

class Test(models.Model):
    student = models.ForeignKey(StudentInfo, on_delete=models.CASCADE, related_name='student_tests', verbose_name='Студент')
    education = models.ForeignKey(Education, on_delete=models.CASCADE, related_name='tests', verbose_name='Навчання')
    is_comlited = models.BooleanField(default=False, verbose_name='Чи пройдено')
    score = models.PositiveIntegerField(default=0, verbose_name='Оцінка')
    attempts = models.PositiveIntegerField(default=0, verbose_name='Спроби')
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='Час початку тесту')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')    
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата оновлення')
    
    def save(self, *args, **kwargs):
        # Встановлюємо start_time при створенні нового тесту
        if not self.pk and not self.start_time:
            self.start_time = timezone.now()
        super().save(*args, **kwargs)
        # Оновлюємо last_score в Education після збереження тесту
        self.education.save()
    
    def __str__(self):
        return f"{self.student.user.first_name} {self.student.user.last_name} - {self.education.course.course_name}"
    
    class Meta:
        verbose_name = 'Тестування'
        verbose_name_plural = 'Тестування'
        
class Question(models.Model):
    question_text = models.TextField(verbose_name='Текст питання')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='questions', verbose_name='Курс')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата оновлення')

    def __str__(self):
        return self.question_text
    
    class Meta:
        verbose_name = 'Питання'
        verbose_name_plural = 'Питання'
        unique_together = ('question_text', 'course')

class Answer(models.Model):
    answer_text = models.TextField(verbose_name='Текст відповіді')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers', verbose_name='Питання')
    is_correct = models.BooleanField(default=False, verbose_name='Чи є відповідь правильною')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата оновлення')

    def __str__(self):
        return self.answer_text
    
    class Meta:
        verbose_name = 'Відповідь'
        verbose_name_plural = 'Відповіді'

class StudentAnswer(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='student_answers', verbose_name='Тест')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='student_answers', verbose_name='Питання')
    selected_answer = models.ForeignKey(Answer, on_delete=models.CASCADE, related_name='student_selections', verbose_name='Вибрана відповідь')
    is_correct = models.BooleanField(default=False, verbose_name='Чи правильна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')
    
    def save(self, *args, **kwargs):
        # Автоматично перевіряємо, чи правильна відповідь
        self.is_correct = self.selected_answer.is_correct
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.test.student.user.first_name} - {self.question.question_text[:30]}"
    
    class Meta:
        verbose_name = 'Відповідь на тест'
        verbose_name_plural = 'Відповіді на тест'
        unique_together = ['test', 'question']  # Студент може дати тільки одну відповідь на питання в тесті
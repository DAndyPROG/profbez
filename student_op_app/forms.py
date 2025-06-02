from django import forms
from .models import StudentInfo, Education, Test, Question, Answer
from admin_app.models import Course, CustomUser
from ingener_op_app.models import Contract, IngenerInfo
from django.forms import inlineformset_factory, modelformset_factory
from admin_app.signals import user_registered
import string
import random
from django.conf import settings
from admin_app.forms import validate_ukrainian_phone  # Import the validation function

class StudentEducationForm(forms.Form):
    first_name = forms.CharField(max_length=255, label="Ім'я", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ім\'я', 'required': True}))
    last_name = forms.CharField(max_length=255, label="Прізвище", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Прізвище', 'required': True}))
    position = forms.CharField(max_length=255, label="Посада", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Посада', 'required': True}))
    email = forms.EmailField(label="Email", widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email', 'required': True}))
    phone_number = forms.CharField(max_length=18, label="Телефон", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Телефон у форматі 380XXXXXXXXX або 0XXXXXXXXX', 'required': True}))
    
    # Покращуємо поле для курсів
    courses = forms.ModelMultipleChoiceField(
        queryset=Course.objects.all(), 
        label="Курси", 
        required=False,
        widget=forms.SelectMultiple(attrs={
            'class': 'form-control select2',  # Додаємо клас select2 для кращого UI
            'multiple': 'multiple',
            'data-placeholder': 'Виберіть курси'
        })
    )
    
    company_name = forms.ModelChoiceField(queryset=IngenerInfo.objects.all(), label="Назва компанії", widget=forms.Select(attrs={'class': 'form-control', 'placeholder': 'Назва компанії', 'required': True}))
    generate_new_password = forms.BooleanField(required=False, label="Згенерувати новий пароль", widget=forms.CheckboxInput(attrs={'class': 'form-check-input'}))
    
    def __init__(self, *args, **kwargs):
        self.instance = kwargs.pop('instance', None)
        super().__init__(*args, **kwargs)
        
        # Якщо це редагування, то встановлюємо початкові значення
        if self.instance:
            self.initial = {
                'first_name': self.instance.user.first_name,
                'last_name': self.instance.user.last_name,
                'email': self.instance.user.email,
                'phone_number': self.instance.user.phone_number,
                'position': self.instance.position,
                'company_name': self.instance.ingener.id if self.instance.ingener else None,
                'courses': [education.course.id for education in self.instance.studies.all()]
            }
    
    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        return validate_ukrainian_phone(phone_number)
    
    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        
        # Skip email uniqueness check if this is an update and email hasn't changed
        if self.instance and email == self.instance.user.email:
            # Email hasn't changed, skip validation
            return cleaned_data
            
        # Перевіряємо унікальність email тільки при створенні нового користувача
        if email and not self.instance and CustomUser.objects.filter(email=email).exists():
            self.add_error('email', 'Користувач з таким email вже існує')
        # Якщо редагуємо, перевіряємо, що email не належить іншому користувачу
        elif email and self.instance and CustomUser.objects.filter(email=email).exclude(id=self.instance.user.id).exists():
            self.add_error('email', 'Користувач з таким email вже існує')
            
        return cleaned_data
    
    def save(self):
        # Отримуємо дані з форми
        first_name = self.cleaned_data['first_name']
        last_name = self.cleaned_data['last_name']
        position = self.cleaned_data['position']
        email = self.cleaned_data['email']
        phone_number = self.cleaned_data['phone_number']
        company = self.cleaned_data['company_name']
        courses = self.cleaned_data.get('courses', [])
        
        # Виводимо в лог інформацію про вибрані курси
        print(f"Saving student with courses: {courses}")
        
        # Генеруємо пароль, якщо потрібно
        generate_new_password = self.cleaned_data.get('generate_new_password', False)
        
        if self.instance:
            # Оновлюємо існуючого користувача
            user = self.instance.user
            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            user.phone_number = phone_number
            
            # Генеруємо новий пароль, якщо потрібно
            if generate_new_password:
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
                user.set_password(password)
                self.generated_password = password
                self.generated_email = email  # Додаємо email для відображення в модальному вікні
            
            user.save()
            
            # Оновлюємо інформацію про студента
            student = self.instance
            student.position = position
            student.ingener = company
            student.save()
            
            # Оновлюємо курси
            # Спочатку видаляємо всі поточні записи про навчання
            Education.objects.filter(student=student).delete()
            
            # Додаємо нові записи про навчання
            educations = []
            for course in courses:
                education = Education(student=student, course=course)
                education.save()
                educations.append(education)
            
            return student, user, educations
        else:
            # Створюємо нового користувача
            password = settings.STUDENT_PASSWORD
            user = CustomUser.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone_number=phone_number,
                role='student'
            )
            
            # Створюємо запис про студента
            student = StudentInfo.objects.create(
                user=user,
                position=position,
                ingener=company
            )
            
            # Додаємо записи про навчання
            educations = []
            for course in courses:
                education = Education(student=student, course=course)
                education.save()
                educations.append(education)
            
            # Зберігаємо пароль для відображення
            self.generated_password = password
            self.generated_email = email
            
            # Відправляємо сигнал про нову реєстрацію
            user_registered.send(sender=student.__class__, user_id=user.id)
            
            return student, user, educations

class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ['course', 'question_text']
        widgets = {
            'course': forms.Select(attrs={'class': 'form-control', 'placeholder': '№ курсу', 'required': True}),
            'question_text': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Питання', 'required': True})
        }

class AnswerForm(forms.ModelForm):
    class Meta:
        model = Answer
        fields = ['answer_text', 'is_correct']
        widgets = {
            'answer_text': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Відповідь', 'required': True}),
            'is_correct': forms.CheckboxInput(attrs={'class': 'form-check-input', 'required': True})
        }

AnswerFormSet = inlineformset_factory(
    Question,
    Answer,
    form=AnswerForm,
    extra=1,
    can_delete=True,
    max_num=8
)

    

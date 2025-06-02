from django import forms
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.forms import inlineformset_factory
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
import string
import random
from student_op_app.models import StudentInfo, Education
from admin_app.models import Course, CustomUser
from ingener_op_app.models import IngenerInfo
from admin_app.forms import validate_ukrainian_phone  # Import the validation function


class StudentForm(forms.Form):
    first_name = forms.CharField(max_length=255, label="Ім'я", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ім\'я', 'required': True}))
    last_name = forms.CharField(max_length=255, label="Прізвище", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Прізвище', 'required': True}))
    position = forms.CharField(max_length=255, label="Посада", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Посада', 'required': True}))
    email = forms.EmailField(label="Email", widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email', 'required': True}))
    phone_number = forms.CharField(max_length=18, label="Телефон", widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Телефон', 'required': True}))
    course = forms.ModelChoiceField(queryset=Course.objects.all(), label="№ курсу", widget=forms.Select(attrs={'class': 'form-control', 'placeholder': '№ курсу', 'required': True}))
    company_name = forms.ModelChoiceField(queryset=IngenerInfo.objects.all(), label="Інженер", widget=forms.Select(attrs={'class': 'form-control', 'disabled': True}), required=False)

    def __init__(self, *args, **kwargs):
        self.instance = kwargs.pop('instance', None)
        self.ingener_id = kwargs.pop('ingener_id', None)
        self.engineer = kwargs.pop('engineer', None)
        super().__init__(*args, **kwargs)
        if self.ingener_id:
            self.fields['company_name'].initial = self.ingener_id
        
        if self.instance:
            self.fields['first_name'].initial = self.instance.user.first_name
            self.fields['last_name'].initial = self.instance.user.last_name
            self.fields['position'].initial = self.instance.position
            self.fields['email'].initial = self.instance.user.email
            self.fields['phone_number'].initial = self.instance.user.phone_number
            educ = self.instance.studies.first()
            if educ:
                self.fields['course'].initial = educ.course.id
        
        for field_name, field in self.fields.items():
            field.widget.attrs.update({'class': 'form-control'})
            if hasattr(field.widget, 'input_type') and field.widget.input_type == 'text':
                field.widget.attrs.update({'class': 'form-control is-invalid' if field_name in self.errors else 'form-control'})
    
    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        return validate_ukrainian_phone(phone_number)
    
    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        
        # Перевіряємо унікальність email тільки при створенні нового користувача
        if email and not self.instance and CustomUser.objects.filter(email=email).exists():
            self.add_error('email', 'Користувач з таким email вже існує')
        # Якщо редагуємо, перевіряємо, що email не належить іншому користувачу
        elif email and self.instance and CustomUser.objects.filter(email=email).exclude(id=self.instance.user.id).exists():
            self.add_error('email', 'Користувач з таким email вже існує')
            
        return cleaned_data

    def save(self):
        try:
            # Якщо це редагування існуючого запису
            if self.instance:
                # Оновлюємо дані користувача
                user = self.instance.user
                user.first_name = self.cleaned_data['first_name']
                user.last_name = self.cleaned_data['last_name']
                if user.email != self.cleaned_data['email']:
                    user.email = self.cleaned_data['email']
                    user.username = self.cleaned_data['email']
                user.phone_number = self.cleaned_data['phone_number']
                user.save()

                # Оновлюємо дані студента
                self.instance.position = self.cleaned_data['position']
                # Використовуємо існуючого інженера, якщо поле disabled і не передано
                if 'company_name' in self.cleaned_data and self.cleaned_data['company_name']:
                    self.instance.ingener = self.cleaned_data['company_name']
                self.instance.save()
                
                # Оновлюємо або створюємо освіту
                education = self.instance.studies.first()
                if education:
                    education.course = self.cleaned_data['course']
                    education.save()
                else:
                    education = Education.objects.create(
                        student=self.instance,
                        course=self.cleaned_data['course'],
                    )

                return self.instance, user, education
            else:
                # Створюємо новий запис
                user = CustomUser.objects.create_user(
                    username=self.cleaned_data['email'],
                    first_name=self.cleaned_data['first_name'],
                    last_name=self.cleaned_data['last_name'],
                    email=self.cleaned_data['email'],
                    phone_number=self.cleaned_data['phone_number'],
                    role='student',
                )
                user.save()
                
                # Для нового запису company_name є обов'язковим
                if 'company_name' not in self.cleaned_data or not self.cleaned_data['company_name']:
                    raise forms.ValidationError("Поле 'Інженер' є обов'язковим при створенні нового слухача")
                    
                student = StudentInfo.objects.create(
                    user=user,
                    position=self.cleaned_data['position'],
                    ingener=self.cleaned_data['company_name'],
                )
                student.save()
                
                education = Education.objects.create(
                    student=student,
                    course=self.cleaned_data['course'],
                )
                education.save()

                return student, user, education
            
        except Exception as e:
            if not self.instance:
                if 'user' in locals():
                    user.delete()
                if 'student' in locals():
                    student.delete()
                if 'education' in locals():
                    education.delete()
            raise forms.ValidationError(f"Помилка при збереженні даних: {str(e)}")
from django import forms
from django.forms import inlineformset_factory
from django.contrib.auth.hashers import make_password
from django.conf import settings
from .models import Course, CourseVideo, CustomUser
from ingener_op_app.models import IngenerInfo, Contract
from student_op_app.models import StudentInfo, Education
from datetime import datetime
import random
import string
import re
from .signals import user_registered

# Функція для валідації українського номера телефону
def validate_ukrainian_phone(phone_number):
    if not phone_number:
        raise forms.ValidationError("Номер телефону є обов'язковим")
        
    # Видалення всіх нецифрових символів крім +
    cleaned_number = re.sub(r'[^\d+]', '', phone_number)
    
    # Перевірка на мінімальну довжину
    if len(cleaned_number) < 10:
        raise forms.ValidationError("Номер телефону занадто короткий")
    
    # Перевірка форматів:380XXXXXXXXX або 0XXXXXXXXX
    valid_formats = [
        r'^380\d{9}$',  # 380XXXXXXXXX
        r'^0\d{9}$'         # 0XXXXXXXXX
    ]
    
    for pattern in valid_formats:
        if re.match(pattern, cleaned_number):
            # Нормалізуємо номер до формату 380XXXXXXXXX
            if cleaned_number.startswith('0'):
                cleaned_number = '380' + cleaned_number[1:]
            elif cleaned_number.startswith('380'):
                cleaned_number = '380' + cleaned_number[3:]
                
            return cleaned_number
            
    raise forms.ValidationError("Номер телефону має бути у форматі 380XXXXXXXXX або 0XXXXXXXXX")

class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ['code', 'course_name', 'course_description']

class CourseVideoForm(forms.ModelForm):
    class Meta:
        model = CourseVideo
        fields = ['video_name', 'video_url']
        widgets = {
            'video_name': forms.TextInput(attrs={'class': 'video-name', 'placeholder': 'Назва відео'}),
            'video_url': forms.TextInput(attrs={'class': 'video-url', 'placeholder': 'URL відео'})
        }

# Створюємо формсет для відео
CourseVideoFormSet = inlineformset_factory(
    Course, 
    CourseVideo, 
    form=CourseVideoForm,
    extra=1,  # Початкова кількість форм
    can_delete=True
)

class IngenerInfoForm(forms.Form):
    company_name = forms.CharField(
        max_length=255, label="Назва компанії", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Назва компанії'}))
    code_edrpo = forms.CharField(
        max_length=8,
        required=True,
        widget=forms.TextInput(attrs={
            'placeholder': 'Введіть код ЄДРПОУ (8 цифр)',
            'class': 'form-control'
        }),
        label='Код ЄДРПОУ',
        help_text='Код ЄДРПОУ повинен містити точно 8 цифр'
    )
    first_name = forms.CharField(
        max_length=255, label="Ім'я", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': "Ім'я"}))
    last_name = forms.CharField(
        max_length=255, label="Прізвище", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Прізвище'}))
    email = forms.EmailField(
        label="Email", 
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email'}))
    phone_number = forms.CharField(
        max_length=255, label="Телефон", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '380XXXXXXXXX або 0XXXXXXXXX'}))
    password = forms.CharField(
        label="Пароль", 
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Пароль'}))
    password_confirm = forms.CharField(
        label="Підтвердження паролю", 
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Підтвердження паролю'}))
    
    def __init__(self, *args, **kwargs):
        self.instance = kwargs.pop('instance', None)  # Додаємо параметр instance
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            field.widget.attrs.update({'class': 'form-control'})
            if hasattr(field.widget, 'input_type') and field.widget.input_type == 'text':
                field.widget.attrs.update({'class': 'form-control is-invalid' if field_name in self.errors else 'form-control'})
        
    def clean(self):
        cleaned_data = super().clean()
        
        # Перевірка унікальності email
        email = cleaned_data.get('email')
        if email and CustomUser.objects.filter(email=email).exists():
            self.add_error('email', 'Користувач з таким email вже існує')
            
        company_name = cleaned_data.get('company_name')
        if company_name and IngenerInfo.objects.filter(company_name=company_name).exists():
            self.add_error('company_name', 'Компанія з такою назвою вже зареєстрована')
        
        # Перевірка унікальності коду ЄДРПОУ
        code_edrpo = cleaned_data.get('code_edrpo')
        if code_edrpo and IngenerInfo.objects.filter(code_edrpo=code_edrpo).exists():
            self.add_error('code_edrpo', 'Компанія з таким кодом ЄДРПОУ вже зареєстрована')
        
        # Перевірка відповідності паролів
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')
        
        if password and password_confirm and password != password_confirm:
            self.add_error('password_confirm', 'Паролі не співпадають')
        
        return cleaned_data
    
    def clean_password(self):
        password = self.cleaned_data.get('password')
        
        # Перевірка довжини паролю
        if password and len(password) < 8:
            self.add_error('password', 'Пароль повинен містити щонайменше 8 символів')
            
        # Перевірка наявності цифр
        if password and not any(char.isdigit() for char in password):
            self.add_error('password', 'Пароль повинен містити щонайменше одну цифру')
            
        # Перевірка наявності великих літер
        if password and not any(char.isupper() for char in password):
            self.add_error('password', 'Пароль повинен містити щонайменше одну велику літеру')
            
        return password
    
    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        return validate_ukrainian_phone(phone_number)
    
    def clean_code_edrpo(self):
        code_edrpo = self.cleaned_data.get('code_edrpo')
        
        if code_edrpo:
            # Валідація формату ЄДРПОУ (точно 8 цифр)
            if not re.match(r'^[0-9]{8}$', code_edrpo):
                raise forms.ValidationError('Код ЄДРПОУ повинен містити точно 8 цифр')
                
            # Перевірка унікальності
            if IngenerInfo.objects.filter(code_edrpo=code_edrpo).exists():
                raise forms.ValidationError('Компанія з таким кодом ЄДРПОУ вже зареєстрована')
        
        return code_edrpo
    
    def save(self):
        try:
            # Перевіряємо, чи існує користувач з таким email
            if CustomUser.objects.filter(email=self.cleaned_data['email']).exists():
                raise forms.ValidationError("Користувач з таким email вже існує")
                
            # Перевіряємо, чи існує компанія з таким кодом ЄДРПОУ
            if IngenerInfo.objects.filter(code_edrpo=self.cleaned_data['code_edrpo']).exists():
                raise forms.ValidationError("Компанія з таким кодом ЄДРПОУ вже зареєстрована")
                
            user = CustomUser.objects.create(
                username=self.cleaned_data['email'],
                first_name=self.cleaned_data['first_name'],
                last_name=self.cleaned_data['last_name'],
                email=self.cleaned_data['email'],
                phone_number=self.cleaned_data['phone_number'],
                role='ingener',
                is_active=False
            )
            
            # Створюємо запис без вказання id
            ingener = IngenerInfo()
            ingener.company_name = self.cleaned_data['company_name']
            ingener.code_edrpo = self.cleaned_data['code_edrpo']
            ingener.user = user
            ingener.is_new_registration = True  # Позначаємо як нову реєстрацію
            ingener.save()
            password = self.cleaned_data['password']
            # Використовуємо пароль з форми
            user.set_password(password)
            user.save()
            
            # Відправляємо сигнал про реєстрацію нового користувача
            user_registered.send(sender=ingener.__class__, user_id=user.id)
            
            return ingener, user, password
                
        except Exception as e:
            # Видаляємо створені об'єкти у випадку помилки, але тільки при створенні
            if not self.instance:
                if 'user' in locals():
                    user.delete()
                if 'ingener' in locals():
                    ingener.delete()
            # Повертаємо помилку для обробки у view
            raise forms.ValidationError(f"Помилка при збереженні даних: {str(e)}")

class IngenerCombinedForm(forms.Form):
    # Поля для IngenerInfo
    company_name = forms.CharField(
        max_length=255, label="Назва компанії", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Назва компанії'}))
    code_edrpo = forms.CharField(
        max_length=8,
        required=True,
        widget=forms.TextInput(attrs={
            'placeholder': 'Введіть код ЄДРПОУ (8 цифр)',
            'class': 'form-control'
        }),
        label='Код ЄДРПОУ',
        help_text='Код ЄДРПОУ повинен містити точно 8 цифр'
    )
    
    # Поля для CustomUser
    first_name = forms.CharField(
        max_length=255, label="Ім'я", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': "Ім'я"}))
    last_name = forms.CharField(
        max_length=255, label="Прізвище", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Прізвище'}))
    email = forms.EmailField(
        label="Email", 
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email'}))
    phone_number = forms.CharField(
        max_length=255, label="Телефон", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '380XXXXXXXXX або 0XXXXXXXXX'}))
    
    # Поля для Contract
    contract_number = forms.CharField(
        max_length=255, label="Номер договору", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Номер договору'}))
    contract_end_date = forms.DateField(
        label="Дата закінчення договору", 
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}))
    
    # Додаємо поле для генерації нового пароля
    generate_password = forms.BooleanField(
        required=False, 
        label="Згенерувати новий пароль",
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    
    # Додаємо приховане поле для ID редагованого запису
    edit_id = forms.IntegerField(required=False, widget=forms.HiddenInput(), label='')
    
    def __init__(self, *args, **kwargs):
        # Додаємо параметр instance для підтримки редагування
        self.instance = kwargs.pop('instance', None)
        self.is_update = kwargs.pop('is_update', False)
        self.generated_password = None
        super().__init__(*args, **kwargs)
        
        # Додаємо CSS класи для всіх полів
        for field_name, field in self.fields.items():
            if field_name not in ['generate_password', 'edit_id']:
                if 'class' not in field.widget.attrs:
                    field.widget.attrs['class'] = 'form-control'

    def clean(self):
        cleaned_data = super().clean()
        
        # Перевірка дат
        end_date = cleaned_data.get('contract_end_date')
        if end_date and end_date < datetime.now().date():
            self.add_error('contract_end_date', 'Дата закінчення не може бути раніше сьогоднішньої дати')
        
        # Отримуємо ID поточного запису для редагування
        edit_id = cleaned_data.get('edit_id') or None
        
        # Перевірка унікальності email
        email = cleaned_data.get('email')
        if email:
            email_exists = CustomUser.objects.filter(email=email)
            if self.is_update and edit_id:
                # Виключаємо поточного користувача з перевірки
                try:
                    current_ingener = IngenerInfo.objects.get(id=edit_id)
                    email_exists = email_exists.exclude(id=current_ingener.user.id)
                except IngenerInfo.DoesNotExist:
                    pass
            
            if email_exists.exists():
                self.add_error('email', 'Користувач з таким email вже існує')
        
        # Перевірка унікальності назви компанії
        company_name = cleaned_data.get('company_name')
        if company_name:
            company_exists = IngenerInfo.objects.filter(company_name=company_name)
            if self.is_update and edit_id:
                company_exists = company_exists.exclude(id=edit_id)
                
            if company_exists.exists():
                self.add_error('company_name', 'Компанія з такою назвою вже зареєстрована')
        
        # Перевірка унікальності коду ЄДРПОУ
        code_edrpo = cleaned_data.get('code_edrpo')
        if code_edrpo:
            code_exists = IngenerInfo.objects.filter(code_edrpo=code_edrpo)
            if self.is_update and edit_id:
                code_exists = code_exists.exclude(id=edit_id)
                
            if code_exists.exists():
                self.add_error('code_edrpo', 'Компанія з таким кодом ЄДРПОУ вже зареєстрована')
        
        # Перевірка унікальності номера договору
        contract_number = cleaned_data.get('contract_number')
        if contract_number:
            contract_exists = Contract.objects.filter(contract_number=contract_number)
            if self.is_update and edit_id:
                try:
                    current_ingener = IngenerInfo.objects.get(id=edit_id)
                    if hasattr(current_ingener, 'contract'):
                        contract_exists = contract_exists.exclude(id=current_ingener.contract.id)
                except (IngenerInfo.DoesNotExist, AttributeError):
                    pass
                    
            if contract_exists.exists():
                self.add_error('contract_number', 'Договір з таким номером вже зареєстрований')

        return cleaned_data

    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        return validate_ukrainian_phone(phone_number)

    def clean_code_edrpo(self):
        code_edrpo = self.cleaned_data.get('code_edrpo')
        
        if code_edrpo:
            # Валідація формату ЄДРПОУ (точно 8 цифр)
            if not re.match(r'^[0-9]{8}$', code_edrpo):
                raise forms.ValidationError('Код ЄДРПОУ повинен містити точно 8 цифр')
        
        return code_edrpo

    def save(self):
        try:
            # Якщо це редагування існуючого запису
            if self.instance:
                # Знаходимо пов'язаного користувача
                user = self.instance.user
                # Оновлюємо дані користувача
                user.first_name = self.cleaned_data['first_name']
                user.last_name = self.cleaned_data['last_name']
                user.email = self.cleaned_data['email']
                user.phone_number = self.cleaned_data['phone_number']
                
                # Встановлюємо логін таким же, як email
                user.username = self.cleaned_data['email']
                
                # Генерація пароля якщо вибрано чекбокс
                if self.cleaned_data.get('generate_password'):
                    import random
                    import string
                    password = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(10))
                    user.set_password(password)
                    self.generated_password = password  # Зберігаємо пароль для відображення
                
                user.save()
                
                # Оновлюємо дані інженера
                self.instance.company_name = self.cleaned_data['company_name']
                self.instance.code_edrpo = self.cleaned_data['code_edrpo']
                self.instance.is_new_registration = False  # Скидаємо прапорець нової реєстрації
                self.instance.save()
                
                # Знаходимо і оновлюємо контракт, або створюємо новий якщо не існує
                try:
                    contract = Contract.objects.get(client=self.instance)
                    contract.contract_number = self.cleaned_data['contract_number']
                    contract.contract_end_date = self.cleaned_data['contract_end_date']
                    contract.save()
                except Contract.DoesNotExist:
                    contract = Contract.objects.create(
                        contract_number=self.cleaned_data['contract_number'],
                        contract_end_date=self.cleaned_data['contract_end_date'],
                        client=self.instance,
                    )
                
                return self.instance, user, contract
            
            # Якщо це створення нового запису
            else:
                # Створюємо новий запис
                user = CustomUser.objects.create_user(
                    username=self.cleaned_data['email'],
                    first_name=self.cleaned_data['first_name'],
                    last_name=self.cleaned_data['last_name'],
                    email=self.cleaned_data['email'],
                    phone_number=self.cleaned_data['phone_number'],
                    role='ingener',
                    is_active=True  # Активуємо користувача одразу, оскільки його створює адмін
                )
                
                ingener = IngenerInfo()
                ingener.company_name = self.cleaned_data['company_name']
                ingener.code_edrpo = self.cleaned_data['code_edrpo']
                ingener.user = user
                ingener.is_new_registration = False
                ingener.save()
                
                contract = Contract.objects.create(
                    contract_number=self.cleaned_data['contract_number'],
                    contract_end_date=self.cleaned_data['contract_end_date'],
                    client=ingener,
                )
                
                # Безумовно скидаємо прапорець "новий" при створенні з договором
                if contract.contract_number and contract.contract_end_date:
                    ingener.is_new_registration = False
                    ingener.save()
 
                # Генеруємо пароль автоматично
                import random
                import string
                password = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(10))
                user.set_password(password)
                user.save()
                self.generated_password = password  # Зберігаємо пароль для відображення
                
                # Відправляємо сигнал про реєстрацію нового користувача
                # user_registered.send(sender=ingener.__class__, user_id=user.id)
                return ingener, user, contract
                
        except Exception as e:
            # Видаляємо створені об'єкти у випадку помилки, але тільки при створенні
            if not self.instance:
                if 'user' in locals():
                    user.delete()
                if 'ingener' in locals():
                    ingener.delete()
                if 'contract' in locals():
                    contract.delete()
            
            # Повертаємо помилку для обробки у view
            raise forms.ValidationError(f"Помилка при збереженні даних: {str(e)}")

class StudentUpdateForm(forms.Form):
    first_name = forms.CharField(
        max_length=255, label="Ім'я",
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введіть ім\'я'}))
    last_name = forms.CharField(
        max_length=255, label="Прізвище",
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введіть прізвище'}))
    email = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Введіть email'}))
    position = forms.CharField(
        max_length=255, label="Посада",
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введіть посаду'}))
    phone_number = forms.CharField(
        max_length=255, label="Телефон",
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '380XXXXXXXXX або 0XXXXXXXXX'}))
    company_name = forms.ChoiceField(
        label="Компанія",
        widget=forms.Select(attrs={'class': 'form-control'}))
    courses = forms.MultipleChoiceField(
        required=False,
        label="Курси",
        widget=forms.SelectMultiple(attrs={'class': 'form-control', 'style': 'display:none;'}))
    generate_new_password = forms.BooleanField(
        required=False,
        label="Згенерувати новий пароль",
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'}))

    def __init__(self, *args, **kwargs):
        self.instance = kwargs.pop('instance', None)
        super().__init__(*args, **kwargs)

        # Populate company choices
        ingeners = IngenerInfo.objects.all()
        self.fields['company_name'].choices = [(i.id, i.company_name) for i in ingeners]
        
        # Populate courses choices
        self.fields['courses'].choices = [(c.id, f"{c.code} - {c.course_name}") for c in Course.objects.all()]
        
        # If instance exists, set initial values
        if self.instance:
            self.fields['first_name'].initial = self.instance.user.first_name
            self.fields['last_name'].initial = self.instance.user.last_name
            self.fields['email'].initial = self.instance.user.email
            self.fields['position'].initial = self.instance.position
            self.fields['phone_number'].initial = self.instance.user.phone_number
            self.fields['company_name'].initial = self.instance.ingener_id if self.instance.ingener else None
    
    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        return validate_ukrainian_phone(phone_number)
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        
        # Skip validation if email hasn't changed
        if self.instance and email == self.instance.user.email:
            return email
            
        if email and self.instance:
            # Check if email exists excluding current user
            existing = CustomUser.objects.filter(email=email).exclude(id=self.instance.user.id)
            if existing.exists():
                self.add_error('email', "Користувач з таким email вже існує")
        return email

class StudentCreationForm(forms.Form):
    first_name = forms.CharField(
        max_length=255, label="Ім'я",
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введіть ім\'я'}))
    last_name = forms.CharField(
        max_length=255, label="Прізвище",
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введіть прізвище'}))
    email = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Введіть email'}))
    position = forms.CharField(
        max_length=255, label="Посада",
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введіть посаду'}))
    phone_number = forms.CharField(
        max_length=255, label="Телефон",
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '380XXXXXXXXX або 0XXXXXXXXX'}))
    company_name = forms.ChoiceField(
        label="Компанія",
        widget=forms.Select(attrs={'class': 'form-control'}))
    courses = forms.MultipleChoiceField(
        required=False,
        label="Курси",
        widget=forms.SelectMultiple(attrs={'class': 'form-control', 'style': 'display:none;'}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Populate company choices
        ingeners = IngenerInfo.objects.all()
        self.fields['company_name'].choices = [(i.id, i.company_name) for i in ingeners]
        
        # Populate courses choices
        self.fields['courses'].choices = [(c.id, f"{c.code} - {c.course_name}") for c in Course.objects.all()]
    
    def clean(self):
        cleaned_data = super().clean()
        courses = cleaned_data.get('courses')
        if not courses:
            self.add_error('courses', "Оберіть хоча б один курс")

        company_name = cleaned_data.get('company_name')
        if not company_name:
            self.add_error('company_name', "Оберіть компанію")
        if company_name:
            company_exists = IngenerInfo.objects.filter(company_name=company_name)
            if company_exists.exists():
                self.add_error('company_name', "Компанія з такою назвою вже зареєстрована")

        email = cleaned_data.get('email')
        if email:
            email_exists = CustomUser.objects.filter(email=email)
            if email_exists.exists():
                self.add_error('email', "Користувач з таким email вже існує")

        return cleaned_data
    
    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        return validate_ukrainian_phone(phone_number)
    
    def save(self):
        try:
            ingener = IngenerInfo.objects.get(id=self.cleaned_data.get('company_name'))
            user = CustomUser.objects.create_user(
                username=self.cleaned_data.get('email'),
                first_name=self.cleaned_data.get('first_name'),
                last_name=self.cleaned_data.get('last_name'),
                email=self.cleaned_data.get('email'),
                phone_number=self.cleaned_data.get('phone_number'),
                role='student',
                password=settings.STUDENT_PASSWORD
            )

            student = StudentInfo()
            student.user = user
            student.ingener = ingener
            student.position = self.cleaned_data.get('position')
            student.status = 'waiting_authorization'
            student.save()
            
            courses_selected = self.cleaned_data.get('courses', [])
            for course_id in courses_selected:
                if course_id:
                    try:
                        course = Course.objects.get(id=course_id)
                        Education.objects.create(
                            student=student,
                            course=course
                        )
                    except Course.DoesNotExist:
                        pass

            return student, user
        except Exception as e:
            raise forms.ValidationError(f"Помилка при збереженні даних: {str(e)}")


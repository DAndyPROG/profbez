document.addEventListener('DOMContentLoaded', function() {
    // Отримуємо елементи модального вікна
    const registerModal = document.getElementById('registerModal');
    const registerLink = document.getElementById('registerLink');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // === ВАЛІДАЦІЯ ФОРМИ ЛОГІНУ ===
    if (loginForm) {
        const usernameField = document.getElementById('loginUsername');
        const passwordField = document.getElementById('loginPassword');
        
        // Валідація поля логіну
        usernameField.addEventListener('input', function() {
            clearFieldError(this);
            validateField(this, 'usernameError', 'Будь ласка, введіть логін');
        });
        
        usernameField.addEventListener('blur', function() {
            validateField(this, 'usernameError', 'Будь ласка, введіть логін');
        });
        
        // Валідація поля пароля
        passwordField.addEventListener('input', function() {
            clearFieldError(this);
            validateField(this, 'passwordError', 'Будь ласка, введіть пароль');
        });
        
        passwordField.addEventListener('blur', function() {
            validateField(this, 'passwordError', 'Будь ласка, введіть пароль');
        });
        
        // Валідація при submit
        loginForm.addEventListener('submit', function(e) {
            let isValid = true;
            
            if (!validateField(usernameField, 'usernameError', 'Будь ласка, введіть логін')) {
                isValid = false;
            }
            
            if (!validateField(passwordField, 'passwordError', 'Будь ласка, введіть пароль')) {
                isValid = false;
            }
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    }
    
    // === ВАЛІДАЦІЯ ФОРМИ РЕЄСТРАЦІЇ ===
    if (registerForm) {
        const formFields = registerForm.querySelectorAll('input, textarea');
        
        formFields.forEach(function(field) {
            // Валідація при введенні - очищуємо помилки і валідуємо
            field.addEventListener('input', function() {
                clearFieldError(this);
                validateRegisterField(this);
            });
            
            // Валідація при втраті фокусу
            field.addEventListener('blur', function() {
                validateRegisterField(this);
            });
            
            // Очищуємо помилки при фокусі
            field.addEventListener('focus', function() {
                clearFieldError(this);
            });
        });
        
        // Валідація при submit
        registerForm.addEventListener('submit', function(e) {
            let isValid = true;
            
            formFields.forEach(function(field) {
                if (!validateRegisterField(field)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                // Показуємо загальне повідомлення про помилку
                showFormError('Будь ласка, виправте всі помилки у формі');
            }
        });
    }
    
    // === ФУНКЦІЇ ВАЛІДАЦІЇ ===
    function clearFieldError(field) {
        // Видаляємо клас помилки
        field.classList.remove('is-invalid');
        
        // Приховуємо повідомлення про помилку
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            const errorDiv = formGroup.querySelector('.error-message');
            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.innerHTML = '';
            }
        }
        
        // Очищаємо стандартне повідомлення браузера
        const fieldName = field.getAttribute('name');
        if (fieldName) {
            const errorId = fieldName + 'Error';
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.textContent = '';
            }
        }
        
        // Очищаємо стилі валідації
        field.style.borderColor = '';
        field.style.backgroundColor = '';
    }
    
    function validateField(field, errorId, errorMessage) {
        const errorDiv = document.getElementById(errorId);
        const value = field.value.trim();
        
        if (!value) {
            field.classList.add('is-invalid');
            if (errorDiv) {
                errorDiv.textContent = errorMessage;
            }
            return false;
        } else {
            field.classList.remove('is-invalid');
            if (errorDiv) {
                errorDiv.textContent = '';
            }
            return true;
        }
    }
    
    function validateRegisterField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';
        
        // Перевіряємо обов'язкові поля
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'Це поле є обов\'язковим';
        }
        
        // Специфічна валідація для різних типів полів
        if (value && field.type === 'email') {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
                isValid = false;
                errorMessage = 'Введіть коректну email адресу';
            }
        }
        
        if (value && field.type === 'tel') {
            const phonePattern = /^[\+]?[0-9\s\-\(\)]{10,}$/;
            if (!phonePattern.test(value)) {
                isValid = false;
                errorMessage = 'Введіть коректний номер телефону';
            }
        }
        
        if (value && fieldName === 'code_edrpo') {
            // Валідація ЄДРПОУ - точно 8 цифр
            const edrpoPattern = /^[0-9]{8}$/;
            if (!edrpoPattern.test(value)) {
                isValid = false;
                errorMessage = 'Код ЄДРПОУ повинен містити точно 8 цифр';
            }
        }
        
        if (value && fieldName === 'company_name' && value.length < 3) {
            isValid = false;
            errorMessage = 'Назва компанії повинна містити мінімум 3 символи';
        }
        
        if (value && (fieldName === 'first_name' || fieldName === 'last_name') && value.length < 2) {
            isValid = false;
            errorMessage = "Ім'я повинно містити мінімум 2 символи";
        }
        
        if (value && fieldName === 'phone_number') {
            // Українська валідація телефону
            const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
            const ukrainePhonePattern = /^(\+?380|0)[0-9]{9}$/;
            if (!ukrainePhonePattern.test(cleanPhone)) {
                isValid = false;
                errorMessage = 'Введіть коректний український номер телефону (380XXXXXXXXX або 0XXXXXXXXX)';
            }
        }
        
        if (fieldName === 'password' && value) {
            if (value.length < 8) {
                isValid = false;
                errorMessage = 'Пароль повинен містити щонайменше 8 символів';
            } else if (!/\d/.test(value)) {
                isValid = false;
                errorMessage = 'Пароль повинен містити щонайменше одну цифру';
            } else if (!/[A-Z]/.test(value)) {
                isValid = false;
                errorMessage = 'Пароль повинен містити щонайменше одну велику літеру';
            }
        }
        
        if (fieldName === 'password_confirm' && value) {
            const passwordField = registerForm.querySelector('input[name="password"]');
            if (passwordField && value !== passwordField.value) {
                isValid = false;
                errorMessage = 'Паролі не співпадають';
            }
        }
        
        // Оновлюємо стилі поля
        updateFieldValidation(field, isValid, errorMessage);
        
        return isValid;
    }
    
    function updateFieldValidation(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        let errorDiv = formGroup ? formGroup.querySelector('.error-message') : null;
        
        if (isValid) {
            field.classList.remove('is-invalid');
            field.style.borderColor = '';
            field.style.backgroundColor = '';
            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.innerHTML = '';
            }
        } else {
            field.classList.add('is-invalid');
            field.style.borderColor = '#dc3545';
            if (errorDiv) {
                errorDiv.innerHTML = '<i class="bi bi-exclamation-circle-fill me-1"></i>' + errorMessage;
                errorDiv.style.display = 'block';
            } else if (formGroup) {
                // Створюємо новий div для помилки, якщо його немає
                errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.innerHTML = '<i class="bi bi-exclamation-circle-fill me-1"></i>' + errorMessage;
                errorDiv.style.display = 'block';
                errorDiv.style.color = '#dc3545';
                errorDiv.style.fontSize = '0.875rem';
                errorDiv.style.marginTop = '0.25rem';
                formGroup.appendChild(errorDiv);
            }
        }
    }
    
    function showFormError(message) {
        // Перевіряємо, чи є вже повідомлення про помилку
        let alertDiv = registerForm.querySelector('.alert-danger');
        
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger mb-3';
            registerForm.insertBefore(alertDiv, registerForm.firstChild);
        }
        
        alertDiv.innerHTML = '<i class="bi bi-x-circle-fill me-2"></i>' + message;
    }
    
    // === МОДАЛЬНЕ ВІКНО ===
    // Відкриваємо модальне вікно при кліку на посилання
    if (registerLink) {
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
            // Очищаємо форму перед відкриттям
            clearRegistrationForm();
        registerModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Блокуємо скролл фону
    });
    }
    
    // Закриваємо модальне вікно при кліку на хрестик
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            // Якщо є повідомлення про успішну реєстрацію, перезавантажуємо сторінку
            if (document.querySelector('.alert-success')) {
                window.location.href = '/';
            } else {
                // Очищаємо форму перед закриттям
                clearRegistrationForm();
                registerModal.style.display = 'none';
                document.body.style.overflow = ''; // Відновлюємо скролл
            }
        });
    }
    
    // Закриваємо модальне вікно при кліку на кнопку "Скасувати"
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            // Очищаємо форму перед закриттям
            clearRegistrationForm();
            registerModal.style.display = 'none';
            document.body.style.overflow = ''; // Відновлюємо скролл
        });
    }
    
    // Закриваємо модальне вікно при кліку поза ним
    window.addEventListener('click', function(event) {
        if (event.target == registerModal) {
            // Не закриваємо модальне вікно, якщо є повідомлення про успішну реєстрацію
            if (!document.querySelector('.alert-success')) {
                // Очищаємо форму перед закриттям
                clearRegistrationForm();
                registerModal.style.display = 'none';
                document.body.style.overflow = ''; // Відновлюємо скролл
            }
        }
    });
    
    // Перевіряємо, чи потрібно показати модальне вікно після помилки форми або успішної реєстрації
    const hasFormErrors = document.querySelector('.error-message') || 
                           document.querySelector('.has_form_errors') || 
                           document.querySelector('.form-group .is-invalid');
    const showCredentials = document.querySelector('.alert-success');
    
    if (hasFormErrors || showCredentials) {
        registerModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    // Функція для очищення форми реєстрації
    function clearRegistrationForm() {
        if (registerForm) {
            // Очищуємо всі поля
            registerForm.reset();
            
            // Видаляємо всі класи помилок
            const invalidFields = registerForm.querySelectorAll('.is-invalid');
            invalidFields.forEach(field => {
                field.classList.remove('is-invalid');
                field.style.borderColor = '';
                field.style.backgroundColor = '';
            });
            
            // Видаляємо всі повідомлення про помилки
            const errorMessages = registerForm.querySelectorAll('.error-message');
            errorMessages.forEach(msg => {
                msg.style.display = 'none';
                msg.innerHTML = '';
            });
            
            // Видаляємо алерти
            const alerts = registerForm.querySelectorAll('.alert');
            alerts.forEach(alert => {
                alert.remove();
            });
        }
    }
});

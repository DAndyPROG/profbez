/**
 * Універсальна система валідації форм для всіх модальних вікон
 */

// Глобальні змінні для валідації
window.FormValidator = {
    // Очистити всі помилки форми
    clearFormErrors: function(form) {
        if (!form) return;
        
        // Видаляємо всі повідомлення про помилки
        const errorMessages = form.querySelectorAll('.error-message, .field-error, .validation-error');
        errorMessages.forEach(error => error.remove());
        
        // Видаляємо класи помилок з полів
        const invalidFields = form.querySelectorAll('.is-invalid, .error, .form-control.error');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid', 'error');
        });
        
        // Очищаємо інлайн стилі червоної рамки
        const allFields = form.querySelectorAll('input, select, textarea');
        allFields.forEach(field => {
            field.style.borderColor = '';
        });
    },
    
    // Показати помилку для конкретного поля
    showFieldError: function(field, message) {
        if (!field || !message) return;
        
        // Спочатку очищаємо існуючі помилки для цього поля
        this.clearFieldError(field);
        
        // Додаємо клас помилки
        field.classList.add('is-invalid');
        field.style.borderColor = '#dc3545';
        
        // Створюємо елемент повідомлення про помилку
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Вставляємо повідомлення після поля
        field.parentNode.appendChild(errorDiv);
    },
    
    // Очистити помилку для конкретного поля
    clearFieldError: function(field) {
        if (!field) return;
        
        field.classList.remove('is-invalid', 'error');
        field.style.borderColor = '';
        
        // Видаляємо повідомлення про помилку
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    },
    
    // Показати помилки форми з відповіді сервера
    showFormErrors: function(form, errors) {
        if (!form || !errors) return;
        
        // Спочатку очищаємо всі існуючі помилки
        this.clearFormErrors(form);
        
        // Обробляємо помилки для кожного поля
        Object.keys(errors).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field && errors[fieldName]) {
                const errorMessage = Array.isArray(errors[fieldName]) 
                    ? errors[fieldName][0] 
                    : errors[fieldName];
                this.showFieldError(field, errorMessage);
            }
        });
        
        // Якщо є загальні помилки форми (non_field_errors)
        if (errors.non_field_errors || errors.__all__) {
            const generalErrors = errors.non_field_errors || errors.__all__;
            const errorMessage = Array.isArray(generalErrors) ? generalErrors[0] : generalErrors;
            this.showGeneralError(form, errorMessage);
        }
    },
    
    // Показати загальну помилку форми
    showGeneralError: function(form, message) {
        if (!form || !message) return;
        
        // Видаляємо існуючі загальні помилки
        const existingErrors = form.querySelectorAll('.general-error');
        existingErrors.forEach(error => error.remove());
        
        // Створюємо загальне повідомлення про помилку
        const errorDiv = document.createElement('div');
        errorDiv.className = 'general-error error-message';
        errorDiv.style.marginBottom = '15px';
        errorDiv.style.padding = '10px';
        errorDiv.style.backgroundColor = '#f8d7da';
        errorDiv.style.border = '1px solid #f5c6cb';
        errorDiv.style.borderRadius = '4px';
        errorDiv.textContent = message;
        
        // Вставляємо на початок форми
        form.insertBefore(errorDiv, form.firstChild);
    },
    
    // Валідація email
    validateEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Валідація телефону
    validatePhone: function(phone) {
        if (!phone) return true; // Телефон не обов'язковий
        const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },
    
    // Реальний час валідація
    setupRealTimeValidation: function(form) {
        if (!form) return;
        
        const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        fields.forEach(field => {
            // Валідація при втраті фокусу
            field.addEventListener('blur', () => {
                this.validateSingleField(field);
            });
            
            // Очищення помилки при введенні
            field.addEventListener('input', () => {
                if (field.classList.contains('is-invalid')) {
                    this.clearFieldError(field);
                }
            });
        });
    },
    
    // Валідація одного поля
    validateSingleField: function(field) {
        if (!field) return true;
        
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        // Перевірка на обов'язковість
        // if (isRequired && !value) {
        //     this.showFieldError(field, 'Це поле є обов\'язковим');
        //     return false;
        // }
        
        // Перевірка email
        if (field.type === 'email' && value && !this.validateEmail(value)) {
            this.showFieldError(field, 'Введіть правильний email');
            return false;
        }
        
        // Перевірка телефону
        if (field.name === 'phone_number' && value && !this.validatePhone(value)) {
            this.showFieldError(field, 'Введіть правильний номер телефону');
            return false;
        }
        
        return true;
    },
    
    // Валідація всієї форми
    validateForm: function(form) {
        if (!form) return false;
        
        this.clearFormErrors(form);
        
        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateSingleField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
};

// Універсальна функція для курсів (замінює submitFormWithCourses)
window.submitFormWithCourses = function(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    // Очищаємо попередні помилки
    FormValidator.clearFormErrors(form);
    
    // Базова валідація форми
    if (!FormValidator.validateForm(form)) {
        return false;
    }
    
    // Перевіряємо компанію (якщо поле існує)
    const companySelect = form.querySelector('select[name="company_name"]');
    if (companySelect && !companySelect.value) {
        FormValidator.showFieldError(companySelect, 'Оберіть компанію');
        return false;
    }
    
    // Перевіряємо курси (якщо поля існують)
    const courseSelects = form.querySelectorAll('.course-select, select[name="courses"]');
    if (courseSelects.length > 0) {
        let hasCourses = false;
        courseSelects.forEach(select => {
            if (select.value) {
                hasCourses = true;
            }
        });
        
        if (!hasCourses) {
            FormValidator.showGeneralError(form, 'Оберіть хоча б один напрямок навчання');
            return false;
        }
    }
    
    return true;
};

// Універсальна функція для AJAX відправки форм
window.submitFormAjax = function(form, url, options = {}) {
    if (!form) return Promise.reject('Форма не знайдена');
    
    const formData = new FormData(form);
    
    // Додаємо CSRF токен, якщо його немає
    if (!formData.has('csrfmiddlewaretoken')) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfToken) {
            formData.append('csrfmiddlewaretoken', csrfToken.value);
        }
    }
    
    const defaultOptions = {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };
    
    return fetch(url, { ...defaultOptions, ...options })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                return data;
            } else {
                // Показуємо помилки форми
                if (data.errors) {
                    FormValidator.showFormErrors(form, data.errors);
                }
                if (data.message) {
                    FormValidator.showGeneralError(form, data.message);
                }
                throw new Error(data.message || 'Помилка відправки форми');
            }
        });
};

// Ініціалізація при завантаженні DOM
document.addEventListener('DOMContentLoaded', function() {
    // Налаштовуємо валідацію для всіх форм на сторінці
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        FormValidator.setupRealTimeValidation(form);
    });
    
    // Очищаємо помилки при відкритті модальних вікон
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (modal.style.display === 'block') {
                        const form = modal.querySelector('form');
                        if (form) {
                            FormValidator.clearFormErrors(form);
                        }
                    }
                }
            });
        });
        
        observer.observe(modal, { attributes: true });
    });
}); 
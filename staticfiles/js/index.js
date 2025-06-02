document.addEventListener('DOMContentLoaded', function() {
    // Отримуємо елементи модального вікна
    const registerModal = document.getElementById('registerModal');
    const registerLink = document.getElementById('registerLink');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelRegister');
    
    // Відкриваємо модальне вікно при кліку на посилання
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerModal.style.display = 'block';
    });
    
    // Закриваємо модальне вікно при кліку на хрестик
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            // Якщо є повідомлення про успішну реєстрацію, перезавантажуємо сторінку
            if (document.querySelector('.alert-success')) {
                window.location.href = '/';
            } else {
                registerModal.style.display = 'none';
            }
        });
    }
    
    // Закриваємо модальне вікно при кліку на кнопку "Скасувати"
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            registerModal.style.display = 'none';
        });
    }
    
    // Закриваємо модальне вікно при кліку поза ним
    window.addEventListener('click', function(event) {
        if (event.target == registerModal) {
            // Не закриваємо модальне вікно, якщо є повідомлення про успішну реєстрацію
            if (!document.querySelector('.alert-success')) {
                registerModal.style.display = 'none';
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
    }
});

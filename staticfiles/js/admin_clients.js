// Додаємо функцію для логування з можливістю вмикати/вимикати
let debugMode = false;

// Функція для показу індикатора завантаження
function showLoadingIndicator() {
    // Перевіряємо, чи вже існує індикатор
    let loadingIndicator = document.querySelector('.loading-indicator');
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        
        // Змінюємо стилі для центрованого спінера без перекриття
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.top = '50%';
        loadingIndicator.style.left = '50%';
        loadingIndicator.style.transform = 'translate(-50%, -50%)';
        loadingIndicator.style.zIndex = '9999';
        loadingIndicator.style.backgroundColor = 'transparent';
        
        // Створюємо контейнер для спінера
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'spinner-container';
        spinnerContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        spinnerContainer.style.padding = '25px';
        spinnerContainer.style.borderRadius = '10px';
        spinnerContainer.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.1)';
        spinnerContainer.style.display = 'flex';
        spinnerContainer.style.flexDirection = 'column';
        spinnerContainer.style.alignItems = 'center';
        spinnerContainer.style.justifyContent = 'center';
        
        // Створюємо спінер
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.width = '50px';
        spinner.style.height = '50px';
        spinner.style.border = '5px solid #f3f3f3';
        spinner.style.borderTop = '5px solid #3498db';
        spinner.style.borderRadius = '50%';
        spinner.style.marginBottom = '10px';
        
        // Створюємо текст
        const loadingText = document.createElement('p');
        loadingText.textContent = 'Збереження...';
        loadingText.style.color = '#333';
        loadingText.style.fontSize = '16px';
        loadingText.style.margin = '10px 0 0 0';
        
        // Додаємо анімацію спінера
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .spinner {
                animation: spin 1s linear infinite;
            }
        `;
        document.head.appendChild(style);
        
        // Складаємо все разом
        spinnerContainer.appendChild(spinner);
        spinnerContainer.appendChild(loadingText);
        loadingIndicator.appendChild(spinnerContainer);
        
        document.body.appendChild(loadingIndicator);
    } else {
        loadingIndicator.style.display = 'block';
    }
}

// Функція для приховування індикатора завантаження
function hideLoadingIndicator() {
    const loadingIndicators = document.querySelectorAll('.loading-indicator, .spinner-container');
    loadingIndicators.forEach(indicator => {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    });
}

// Функція для позначення клієнта як переглянутого (видалення зеленого фону)
function markClientAsSeen(clientId) {
    // Отримуємо CSRF токен
    const csrftoken = getCookie('csrftoken');
    
    // Відправляємо AJAX запит для позначення клієнта як переглянутого
    fetch(`/clients/mark-seen/${clientId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Знаходимо всі елементи рядка цього клієнта і видаляємо зелений фон
            const clientRow = document.querySelector(`tr[data-client-id="${clientId}"]`);
            if (clientRow) {
                clientRow.style.backgroundColor = '';
                clientRow.style.color = '';
                
                // Оновлюємо також всі комірки
                const cells = clientRow.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.style.backgroundColor = '';
                    cell.style.color = '';
                    cell.style.border = '';
                });
            }
        }
    })
    .catch(error => {
    });
}

// Функція для закриття всіх модальних вікон
function closeAllModals() {
    // Замість видалення з DOM, просто ховаємо модальні вікна
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Видаляємо клас modal-open з body
    document.body.classList.remove('modal-open');
    
    // Видаляємо всі фонові перекриття
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        if (backdrop && backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
    });
    
    // Видаляємо індикатори завантаження, якщо вони є
    hideLoadingIndicator();
}

// Функція для закриття всіх модальних вікон, окрім вказаного
function closeOtherModals(exceptModalId) {
    const modals = document.querySelectorAll(`.modal:not(#${exceptModalId})`);
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Функція для відкриття модального вікна із закриттям усіх інших
function openModal(modalId) {
    // Спочатку закриваємо всі модальні вікна
    closeAllModals();
    
    // Додаємо фонове перекриття для запобігання кліків поза модальним вікном
    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);
    } else {
        // Якщо бекдроп вже існує, переконаємося, що він видимий
        backdrop.style.display = 'block';
    }
    
    // Встановлюємо клас для блокування прокрутки сторінки
    document.body.classList.add('modal-open');
    
    // Знаходимо модальне вікно
    const modal = document.getElementById(modalId);
    if (modal) {
        // Показуємо модальне вікно з анімацією
        modal.style.opacity = '0';
        modal.style.display = 'block';
        
        // Переконаємося, що кнопки закриття працюють - видаляємо старі обробники
        const closeButtons = modal.querySelectorAll('.close, .close-btn');
        closeButtons.forEach(button => {
            button.removeEventListener('click', closeButtonHandler);
            button.addEventListener('click', closeButtonHandler);
        });
        
        // Переконаємося, що кнопки скасування працюють
        const cancelButtons = modal.querySelectorAll('.cancel-btn');
        cancelButtons.forEach(button => {
            button.removeEventListener('click', cancelButtonHandler);
            button.addEventListener('click', cancelButtonHandler);
        });
        
        // Додаємо обробники для зелених кнопок з текстом "Закрити" чи "ОК"
        const submitButtons = modal.querySelectorAll('.green-btn');
        submitButtons.forEach(button => {
            if (button.textContent.trim() === 'Закрити' || button.textContent.trim() === 'ОК') {
                button.removeEventListener('click', closeButtonHandler);
                button.addEventListener('click', closeButtonHandler);
            }
        });
        
        // Відкладаємо встановлення прозорості для забезпечення анімації
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 50);
    }
}

// Функція для виділення нових реєстрацій
function highlightNewRegistrations() {
    // Знаходимо всі рядки з класом new-registration
    const newRegistrationRows = document.querySelectorAll('tr.new-registration');
    
    if (newRegistrationRows.length > 0) {
        // Автоматичне прокручування до нової реєстрації, якщо вона є
        setTimeout(() => {
            // Прокручуємо до першої нової реєстрації
            newRegistrationRows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }
}

// Перевіряємо стан модального вікна редагування після завантаження сторінки
function checkEditModalState() {
    const editModal = document.getElementById('editClientModal');
    const editFormContent = document.getElementById('editFormContent');
    const successContent = document.getElementById('successContent');
    
    // Якщо модальне вікно редагування відображається
    if (editModal && editModal.style.display === 'block') {
        document.body.classList.add('modal-open');
        
        // Якщо потрібно показати повідомлення про успіх
        if (successContent && successContent.style.display === 'block') {
            // Переконуємося, що форма прихована
            if (editFormContent) {
                editFormContent.style.display = 'none';
            }
            
            // Переконуємося, що всі інші модальні вікна закриті
            closeOtherModals('editClientModal');
        }
    }
}

// Налаштовуємо кнопки закриття для всіх модальних вікон
function setupModalCloseButtons() {
    // Знаходимо всі модальні вікна
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Знаходимо кнопку закриття
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            // Видаляємо існуючі обробники, щоб уникнути дублювання
            closeBtn.removeEventListener('click', closeButtonHandler);
            // Додаємо новий обробник
            closeBtn.addEventListener('click', closeButtonHandler);
        }
        
        // Знаходимо кнопки "Скасувати" та "Закрити"
        const cancelBtn = modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            // Видаляємо існуючі обробники, щоб уникнути дублювання
            cancelBtn.removeEventListener('click', cancelButtonHandler);
            // Додаємо новий обробник
            cancelBtn.addEventListener('click', cancelButtonHandler);
        }
        
        const closeSuccessBtn = modal.querySelector('.close-success-btn');
        if (closeSuccessBtn) {
            // Видаляємо існуючі обробники, щоб уникнути дублювання
            closeSuccessBtn.removeEventListener('click', closeButtonHandler);
            // Додаємо новий обробник
            closeSuccessBtn.addEventListener('click', closeButtonHandler);
        }
    });
}

// Обробник для кнопок закриття
function closeButtonHandler() {
    console.log('Close button clicked');
    const modal = this.closest('.modal');
    if (modal) {
        if (modal.id === 'editClientModal') {
            // Перевіряємо, чи є в модальному вікні повідомлення про успіх
            const successAlert = modal.querySelector('.alert-success');
            if (successAlert) {
                // Перенаправляємо на список клієнтів з форсуванням
                redirectToClientsList();
            } else {
                cancelEditClientForm();
            }
        } else {
            closeAllModals();
            // Додаємо перенаправлення на список клієнтів
            window.location.href = '/clients/';
        }
    }
}

// Обробник для кнопок скасування
function cancelButtonHandler() {
    const modal = this.closest('.modal');
    if (modal) {
        if (modal.id === 'editClientModal' || modal.id === 'addClientModal') {
            // Закриваємо вікно і переходимо на список клієнтів з форсуванням
            closeAllModals();
            redirectToClientsList();
        } else {
            // Для інших модальних вікон просто закриваємо їх
            closeAllModals();
            // Додаємо перенаправлення на список клієнтів
            window.location.href = '/clients/';
        }
    }
}

// Функція для переключення між режимами модального вікна
function switchEditModalContent(showSuccessView) {
    const editFormContent = document.getElementById('editFormContent');
    const successContent = document.getElementById('successContent');
    
    if (editFormContent && successContent) {
        if (showSuccessView) {
            // Показуємо повідомлення про успіх і ховаємо форму
            editFormContent.style.display = 'none';
            successContent.style.display = 'block';
        } else {
            // Показуємо форму і ховаємо повідомлення про успіх
            editFormContent.style.display = 'block';
            successContent.style.display = 'none';
        }
    }
}

// Функція для видалення забарвлення зі строки після редагування
function removeClientHighlighting(clientId) {
    // Шукаємо строку в таблиці
    const row = document.querySelector(`tr[data-client-id="${clientId}"]`);
    if (row) {
        // Знімаємо всі стилі зі строки, що відповідають за забарвлення
        row.style.backgroundColor = '';
        row.style.color = '';
        
        // Також видаляємо забарвлення з усіх комірок в строці
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            cell.style.backgroundColor = '';
            cell.style.color = '';
            cell.style.border = '';
        });
    }
}

// Функція для пошуку клієнтів
window.searchClients = function() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (searchTerm) {
        window.location.href = `/clients/?search=${encodeURIComponent(searchTerm)}`;
    } else {
        window.location.href = '/clients/';
    }
}

// Відкриття модального вікна для додавання клієнта
window.addNewClient = function() {
    // Спочатку очищаємо форму
    clearAddClientForm();
    
    // Налаштовуємо обробники подій форми
    setupAddClientFormHandler();
    
    // Відкриваємо модальне вікно
    openModal('addClientModal');
};

// Функція для отримання CSRF токена з куків
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Отримуємо CSRF токен при завантаженні скрипту
const csrftoken = getCookie('csrftoken');

// Вдосконалена функція для редагування клієнта
window.editClient = function(clientId) {
    const clientRow = document.querySelector(`tr[data-client-id="${clientId}"]`);
    if (clientRow && (clientRow.getAttribute('style') && clientRow.getAttribute('style').includes('background-color'))) {
        // Якщо клієнт новий (зелений фон), позначаємо його як переглянутого
        markClientAsSeen(clientId);
    }
    
    try {
        // Показуємо індикатор завантаження
        showLoadingIndicator();
        
        // Завантажуємо форму редагування через AJAX
        fetch(`/clients/update/${clientId}/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrftoken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            hideLoadingIndicator();
            
            // Додаємо отриманий HTML до body
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = html;
            
            // Закриваємо всі існуючі модальні вікна
            closeAllModals();
            
            // Видаляємо існуюче модальне вікно, якщо воно є
            const existingModal = document.getElementById('editClientModal');
            if (existingModal) {
                existingModal.parentNode.removeChild(existingModal);
            }
            
            // Додаємо нове модальне вікно до DOM
            const newModal = tempContainer.querySelector('#editClientModal');
            if (newModal) {
                document.body.appendChild(newModal);
                
                // Відображаємо модальне вікно
                newModal.style.display = 'block';
                
                // Налаштовуємо модальне вікно
                document.body.classList.add('modal-open');
                
                // Додаємо фонове перекриття
                let backdrop = document.querySelector('.modal-backdrop');
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop';
                    document.body.appendChild(backdrop);
                }
                
                const form = newModal.querySelector('form');
                if (form) {
                    form.style.marginBottom = '60px'; // Залишаємо місце для кнопок
                }
                
                // Переконуємося, що кнопки мають правильні стилі
                const formActions = newModal.querySelector('.form-actions');
                if (formActions) {
                    formActions.style.textAlign = 'right';
                    formActions.style.marginTop = '20px';
                }
                
                // Ініціалізуємо поля дат у формі
                initializeDateFields();
                
                // Налаштовуємо обробники подій
                setupEditModalHandlers();
            }
        })
        .catch(error => {
            hideLoadingIndicator();
        });
    } catch (error) {
        hideLoadingIndicator();
    }
}

// Допоміжні функції для відображення повідомлень
function showSuccessMessage(form, message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'alert alert-success';
    successMsg.textContent = message;
    form.prepend(successMsg);
}

function showErrorMessage(form, message) {
    const errorMsg = document.createElement('div');
    errorMsg.className = 'alert alert-danger';
    errorMsg.textContent = message;
    form.prepend(errorMsg);
}

function showValidationErrors(form, errors) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'alert alert-danger';
    
    const errorList = document.createElement('ul');
    
    // Якщо errors - об'єкт з полями
    if (typeof errors === 'object' && !Array.isArray(errors)) {
        Object.keys(errors).forEach(field => {
            const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
            fieldErrors.forEach(error => {
                const li = document.createElement('li');
                li.textContent = `${field}: ${error}`;
                errorList.appendChild(li);
                
                // Також позначаємо поле з помилкою
                const fieldElement = form.querySelector(`[name="${field}"]`);
                if (fieldElement) {
                    fieldElement.classList.add('error-field');
                }
            });
        });
    } else if (Array.isArray(errors)) {
        // Якщо errors - масив
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorList.appendChild(li);
        });
    } else if (typeof errors === 'string') {
        // Якщо errors - просто рядок
        const li = document.createElement('li');
        li.textContent = errors;
        errorList.appendChild(li);
    }
    
    errorContainer.appendChild(errorList);
    form.prepend(errorContainer);
}

// Функція для видалення клієнта
window.deleteClient = function(id, clientName, companyName) {
    // Знаходимо модальне вікно
    const deleteModal = document.getElementById('deleteClientModal');
    if (!deleteModal) {
        return;
    }
    
    // Відновлюємо модальне вікно, якщо воно було видалено
    if (!deleteModal.parentNode) {
        document.body.appendChild(deleteModal);
    }
    
    // Показуємо модальне вікно видалення
    deleteModal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Встановлюємо ID клієнта у прихованому полі
    const deleteClientIdField = document.getElementById('deleteClientId');
    if (deleteClientIdField) {
        deleteClientIdField.value = id;
    }
    
    // Оновлюємо текст повідомлення
    const messageElement = document.getElementById('deleteClientMessage');
    if (messageElement) {
        messageElement.innerHTML = 
            `Ви впевнені, що хочете видалити клієнта <strong>${clientName}</strong> з компанії <strong>${companyName}</strong>?`;
    }
    
    // Встановлюємо URL для форми
    const deleteForm = document.getElementById('deleteClientForm');
    if (deleteForm) {
        deleteForm.action = `/clients/delete/${id}/`;
    }
    
    // Додаємо фонове перекриття
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
}

// Функція для ініціалізації полів дати
function initializeDateFields() {
    // Знаходимо всі поля дати
    const dateFields = document.querySelectorAll('input[type="date"]');
    
    dateFields.forEach(field => {
        // Перевіряємо, чи є оригінальне значення
        const originalValue = field.dataset.originalValue;
        if (originalValue) {
            // Встановлюємо значення
            field.value = originalValue;
            
            // Додаємо обробник для збереження зміненого значення
            field.addEventListener('change', function() {
                field.dataset.originalValue = field.value;
            });
        }
    });
}

// Додаємо функцію для логування з перевіркою режиму дебагу
function debugLog(...args) {
    if (debugMode) {
        console.log('[DEBUG]', ...args);
    }
}

// Функція для вмикання/вимикання режиму дебагу
function toggleDebugMode() {
    debugMode = !debugMode;
    
    // Створення або оновлення панелі дебагу
    let debugPanel = document.getElementById('debug-panel');
    if (!debugPanel && debugMode) {
        debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.position = 'fixed';
        debugPanel.style.bottom = '10px';
        debugPanel.style.right = '10px';
        debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        debugPanel.style.color = '#fff';
        debugPanel.style.padding = '10px';
        debugPanel.style.borderRadius = '5px';
        debugPanel.style.zIndex = '9999';
        debugPanel.style.maxHeight = '300px';
        debugPanel.style.overflow = 'auto';
        debugPanel.style.width = '300px';
        debugPanel.style.fontFamily = 'monospace';
        debugPanel.style.fontSize = '12px';
        debugPanel.innerHTML = '<h3>Debug Panel</h3><div id="debug-content"></div>';
        document.body.appendChild(debugPanel);
    } else if (debugPanel && !debugMode) {
        debugPanel.style.display = 'none';
    } else if (debugPanel) {
        debugPanel.style.display = 'block';
    }
}

// Перевизначаємо console.log для перехоплення та показу в панелі
const originalConsoleLog = console.log;
console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    
    if (debugMode) {
        const debugContent = document.getElementById('debug-content');
        if (debugContent) {
            const logEntry = document.createElement('div');
            logEntry.style.borderBottom = '1px solid #333';
            logEntry.style.padding = '5px 0';
            logEntry.textContent = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            debugContent.appendChild(logEntry);
            
            // Автоматичне прокручування до нижньої частини
            debugContent.scrollTop = debugContent.scrollHeight;
        }
    }
};

// Додаємо обробник клавіш для вмикання режиму дебагу (Ctrl+Shift+D)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        toggleDebugMode();
    }
});

// Ініціалізація після завантаження сторінки
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Видаляємо всі індикатори завантаження, які могли залишитися
    hideLoadingIndicator();
    
    // Закриваємо всі модальні вікна при завантаженні сторінки
    closeAllModals();
    
    // Перевіряємо стан модального вікна редагування
    checkEditModalState();
    
    // Ініціалізуємо поля дати
    initializeDateFields();
    
    // Додаємо глобальний обробник для закриття модальних вікон по кліку поза ними
    document.addEventListener('click', function(event) {
        // Перевіряємо, чи клік був по модальному вікну (фону)
        if (event.target.classList.contains('modal')) {
            // Якщо це вікно редагування, використовуємо спеціальну функцію закриття
            if (event.target.id === 'editClientModal') {
                // Перевіряємо, чи є в модальному вікні редагування повідомлення про успіх
                const successAlert = event.target.querySelector('.alert-success');
                if (successAlert) {
                    redirectToClientsList();
                } else {
                    cancelEditClientForm();
                }
            } 
            // Інакше просто закриваємо модальне вікно
            else {
                closeAllModals();
            }
        }
    });
    
    // Налаштовуємо всі кнопки закриття модальних вікон
    setupModalCloseButtons();
    
    // Ініціалізуємо AJAX відправку форми
    // setupAjaxFormSubmission();
    
    // Налаштовуємо спостереження за змінами в DOM для підтримки динамічних форм
    // setupDOMObserver();
    
    // Додаємо обробник події для поля пошуку
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchClients();
            }
        });
    }
    
    // Перевіряємо, чи є помилки у формі
    const hasFormErrors = document.querySelector('input[name="has_form_errors"]');
    if (hasFormErrors && hasFormErrors.value === 'True') {
        openModal('addClientModal');
    }
    
    // Перевіряємо наявність даних для відображення
    const showCredentials = document.querySelector('input[name="show_credentials"]');
    if (showCredentials && showCredentials.value === 'True') {
        openModal('addClientModal');
    }
    
    // Виділяємо нові реєстрації
    highlightNewRegistrations();
    
    // Налаштовуємо обробники подій для форми видалення клієнта
    setupDeleteClientForm();
    
    // Налаштовуємо валідацію форми додавання клієнта
    setupRealTimeValidation();
    
    // Додаємо обробник відправки форми додавання клієнта
    setupAddClientFormHandler();
});

// Налаштування форми видалення клієнта
function setupDeleteClientForm() {
    const deleteClientForm = document.getElementById('deleteClientForm');
    
    if (deleteClientForm) {
        deleteClientForm.addEventListener('submit', function(event) {
            // Запобігаємо стандартній відправці форми
            event.preventDefault();
            
            // Показуємо індикатор завантаження
            showLoadingIndicator();
            
            // Отримуємо URL з форми
            const actionUrl = deleteClientForm.getAttribute('action');
            
            // Отримуємо дані форми
            const formData = new FormData(deleteClientForm);
            
            // Відправляємо запит
            fetch(actionUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                // Видаляємо індикатор завантаження
                hideLoadingIndicator();
                
                // Перенаправляємо на список клієнтів (незалежно від результату)
                redirectToClientsList();
            })
            .catch(error => {
                // Видаляємо індикатор завантаження
                hideLoadingIndicator();
                
            });
        });
    }
}

// Глобальна функція для закриття вікна редагування із переходом на список
window.cancelEditClientForm = function() {
    console.log('Cancelling edit client form...');
    
    // Якщо модальне вікно містить повідомлення про успіх (результат генерації пароля)
    const successAlert = document.querySelector('#editClientModal .alert-success');
    if (successAlert) {
        // Перенаправляємо на список клієнтів
        redirectToClientsList();
        return;
    }
    
    // Закриваємо модальні вікна замість видалення їх з DOM
    closeAllModals();
    
    // Видаляємо клас modal-open
    document.body.classList.remove('modal-open');
    
    // Очищуємо всі фонові перекриття
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        if (backdrop && backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
    });
    
    // Перенаправляємо на список клієнтів з форсуванням
    redirectToClientsList();
}

// Функція для закриття модального вікна про пароль
window.closePasswordInfoModal = function() {
    document.getElementById('passwordInfoModal').style.display = 'none';
    document.body.classList.remove('modal-open');
    // Додаємо перенаправлення на список клієнтів
    window.location.href = '/clients/';
};

// Функція для закриття модального вікна редагування
window.closeEditModal = function() {
    // Знаходимо модальне вікно
    const modal = document.getElementById('editClientModal');
    if (modal) {
        // Приховуємо модальне вікно
        modal.style.display = 'none';
        
        // Видаляємо модальне вікно з DOM
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }
    
    // Видаляємо фонове перекриття
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
    }
    
    // Видаляємо клас modal-open з тіла документа
    document.body.classList.remove('modal-open');
    
    // Перенаправляємо на сторінку списку клієнтів
    redirectToClientsList();
}

// Global function for submitting edit form
function submitEditForm(button) {
    const form = document.getElementById('editClientForm');
    if (!form) {
        return false;
    }
    
    // Отримуємо дані форми
    const formData = new FormData(form);
    
    // Показуємо повідомлення про завантаження
    let loadingMsg = document.getElementById('loading-message');
    if (!loadingMsg) {
        loadingMsg = document.createElement('div');
        loadingMsg.className = 'alert alert-info';
        loadingMsg.textContent = 'Зберігаємо зміни...';
        loadingMsg.id = 'loading-message';
        loadingMsg.style.marginBottom = '15px';
        form.prepend(loadingMsg);
    }
    
    // Отримуємо CSRF токен
    const csrfToken = getCookie('csrftoken');
    
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) loadingMessage.remove();
        
        if (data.success) {
            if (data.generated_password) {
                const passwordResult = document.getElementById('password-result');
                if (passwordResult) {
                    // Заповнюємо дані користувача
                    document.getElementById('user-info-name').textContent = `ПІБ: ${data.first_name || ''} ${data.last_name || ''}`;
                    document.getElementById('user-info-email').textContent = `Email: ${data.email || ''}`;
                    document.getElementById('generated-password').textContent = data.generated_password;
                    
                    // Показуємо контейнер з паролем
                    passwordResult.style.display = 'block';
                    
                    // Прокручуємо до початку форми
                    const modal = document.getElementById('editClientModal');
                    if (modal) modal.scrollTo(0, 0);
                    
                    // Знімаємо вибір з чекбокса
                    const passwordCheckbox = document.getElementById('id_generate_password');
                    if (passwordCheckbox) passwordCheckbox.checked = false;
                    
                    // Змінюємо дію кнопки збереження
                    if (button) {
                        button.textContent = 'Закрити';
                        button.onclick = function() { 
                            redirectToClientsList(); 
                            return false;
                        };
                    }
                } else {
                    // Створюємо виразний елемент оповіщення про пароль
                    const passwordAlert = document.createElement('div');
                    passwordAlert.className = 'alert';
                    passwordAlert.style.backgroundColor = '#d4edda';
                    passwordAlert.style.color = '#155724';
                    passwordAlert.style.border = '2px solid #c3e6cb';
                    passwordAlert.style.padding = '15px';
                    passwordAlert.style.marginBottom = '20px';
                    passwordAlert.style.borderRadius = '5px';
                    passwordAlert.style.fontWeight = 'bold';
                    passwordAlert.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
                    passwordAlert.style.fontSize = '16px';
                    
                    // Відображення пароля помітним способом
                    passwordAlert.innerHTML = `
                        <div style="text-align:center;">
                            <h3 style="color:#155724;margin-top:0;">Новий пароль створено!</h3>
                            <div style="background-color:#ffffff;padding:10px;border-radius:5px;border:1px solid #c3e6cb;margin:10px 0;font-size:22px;">
                                ${data.generated_password}
                            </div>
                            <p>Не забудьте зберегти його в надійному місці</p>
                        </div>
                    `;
                    
                    // Видаляємо всі існуючі повідомлення
                    form.querySelectorAll('.alert').forEach(el => el.remove());
                    
                    // Вставляємо елемент на початку форми
                    form.prepend(passwordAlert);
                    
                    // Прокручуємо до початку форми
                    const modal = document.getElementById('editClientModal');
                    if (modal) modal.scrollTo(0, 0);
                    
                    // Створюємо стандартне повідомлення про успіх під оповіщенням про пароль
                    const successMsg = document.createElement('div');
                    successMsg.className = 'alert alert-success';
                    successMsg.innerHTML = `
                        <p><strong>Інженер успішно оновлений!</strong></p>
                        <p><strong>Дані користувача:</strong></p>
                        <p>ПІБ: ${data.first_name || ''} ${data.last_name || ''}</p>
                        <p>Email: ${data.email || ''}</p>
                        <p class="mb-2"><strong>Новий пароль:</strong> <span style="font-weight: bold; font-size: 1.2em; color: #007bff; background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${data.generated_password}</span></p>
                        <p class="mb-3">Будь ласка, збережіть цей пароль в надійному місці.</p>
                    `;
                    
                    // Вставляємо після оповіщення про пароль
                    passwordAlert.after(successMsg);
                    
                    // Змінюємо дію кнопки збереження
                    if (button) {
                        button.textContent = 'Закрити';
                        button.onclick = function() { 
                            redirectToClientsList(); 
                            return false;
                        };
                    }
                }
            } else {
                // Просто перенаправляємо на список клієнтів
                redirectToClientsList();
            }
        } else {
            console.error('Update failed:', data.errors || data.error);
            // Показуємо помилки
            if (data.errors) {
                // Видаляємо існуючі повідомлення про помилки
                form.querySelectorAll('.alert-danger').forEach(el => el.remove());
                
                // Створюємо контейнер для помилок
                const errorContainer = document.createElement('div');
                errorContainer.className = 'alert alert-danger';
                errorContainer.style.marginBottom = '15px';
                
                // Додаємо заголовок
                const errorHeader = document.createElement('p');
                errorHeader.innerHTML = '<strong>Помилка при оновленні клієнта:</strong>';
                errorContainer.appendChild(errorHeader);
                
                // Створюємо список помилок
                const errorList = document.createElement('ul');
                errorList.style.marginBottom = '0';
                
                // Додаємо кожну помилку до списку
                if (typeof data.errors === 'object') {
                    Object.keys(data.errors).forEach(field => {
                        const fieldErrors = Array.isArray(data.errors[field]) ? data.errors[field] : [data.errors[field]];
                        fieldErrors.forEach(error => {
                            const li = document.createElement('li');
                            li.textContent = `${field}: ${error}`;
                            errorList.appendChild(li);
                            
                            // Знаходимо поле з помилкою та позначаємо його
                            const fieldElement = form.querySelector(`[name="${field}"]`);
                            if (fieldElement) {
                                fieldElement.classList.add('error-field');
                                fieldElement.style.borderColor = '#dc3545';
                            }
                        });
                    });
                } else if (typeof data.errors === 'string') {
                    const li = document.createElement('li');
                    li.textContent = data.errors;
                    errorList.appendChild(li);
                }
                
                errorContainer.appendChild(errorList);
                form.prepend(errorContainer);
            } else if (data.error) {
                // Показуємо загальне повідомлення про помилку
                const errorMsg = document.createElement('div');
                errorMsg.className = 'alert alert-danger';
                errorMsg.style.marginBottom = '15px';
                errorMsg.textContent = data.error;
                form.prepend(errorMsg);
            } else {
                // Показуємо загальне повідомлення про невідому помилку
                const errorMsg = document.createElement('div');
                errorMsg.className = 'alert alert-danger';
                errorMsg.style.marginBottom = '15px';
                errorMsg.textContent = 'Помилка при оновленні клієнта. Спробуйте ще раз.';
                form.prepend(errorMsg);
            }
        }
    })
    .catch(error => {
        
        // Видаляємо повідомлення про завантаження
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) loadingMessage.remove();
        
        // Показуємо повідомлення про помилку
        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-danger';
        errorMsg.style.marginBottom = '15px';
        errorMsg.textContent = 'Помилка при відправці форми: ' + error.message;
        form.prepend(errorMsg);
    });
    
    return false;
}

// Функція для закриття модального вікна з успішною реєстрацією та відкриття вікна додавання
window.closeSuccessAndAddNew = function() {
    // Закриваємо поточне модальне вікно
    document.getElementById('addClientModal').style.display = 'none';
    
    // Очищаємо DOM від попереднього модального вікна
    setTimeout(function() {
        // Відкриваємо нове модальне вікно для додавання
        addNewClient();
    }, 100);
};

// Функція для перенаправлення на список клієнтів
function redirectToClientsList() {
    window.location.href = '/clients/';
}

// Функція для закриття модального вікна та перенаправлення
function closeModalAndRedirect() {
    const addModal = document.getElementById('addClientModal');
    if (addModal) {
        addModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    redirectToClientsList();
}

// Оновлюємо обробники подій для кнопок закриття
document.querySelectorAll('.close, .cancel-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        closeModalAndRedirect();
    });
});

// Налаштовуємо валідацію в реальному часі
function setupRealTimeValidation() {
    const addForm = document.getElementById('addClientForm');
    const editForm = document.getElementById('editClientForm');
    
    [addForm, editForm].forEach(form => {
        if (!form) return;
        
        const fields = form.querySelectorAll('input[type="text"], input[type="email"], input[type="date"], textarea');
        
        fields.forEach(field => {
            // Валідація при втраті фокусу
            field.addEventListener('blur', function() {
                validateSingleField(this);
            });
            
            // Прибираємо помилку при введенні тексту
            field.addEventListener('input', function() {
                if (this.classList.contains('error-field')) {
                    this.classList.remove('error-field');
                    const fieldName = this.getAttribute('name');
                    const errorDiv = document.getElementById(`error-${fieldName}`);
                    if (errorDiv) {
                        errorDiv.style.display = 'none';
                        errorDiv.textContent = '';
                    }
                }
            });
        });
    });
}

// Функція для валідації форми додавання клієнта
function validateAddClientForm() {
    const form = document.getElementById('addClientForm');
    if (!form) return true;
    
    let isValid = true;
    
    // Очищаємо попередні помилки
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        if (msg.id && msg.id.startsWith('error-')) {
            msg.style.display = 'none';
            msg.textContent = '';
        }
    });
    
    const errorFields = form.querySelectorAll('.error-field');
    errorFields.forEach(field => {
        field.classList.remove('error-field');
    });
    
    // Список обов'язкових полів
    const requiredFields = [
        { name: 'company_name', label: 'Назва компанії' },
        { name: 'code_edrpo', label: 'Код ЄДРПОУ' },
        { name: 'first_name', label: "Ім'я контактної особи" },
        { name: 'last_name', label: 'Прізвище контактної особи' },
        { name: 'email', label: 'Email' },
        { name: 'phone_number', label: 'Телефон' },
        { name: 'contract_number', label: 'Номер договору' },
        { name: 'contract_end_date', label: 'Дата закінчення договору' }
    ];
    
    // Перевіряємо кожне обов'язкове поле
    requiredFields.forEach(fieldInfo => {
        const field = form.querySelector(`[name="${fieldInfo.name}"]`);
        if (field) {
            const value = field.value.trim();
            
            if (!value) {
                // Поле порожнє
                field.classList.add('error-field');
                showFieldError(field, `${fieldInfo.label} є обов'язковим полем`);
                isValid = false;
            } else {
                // Додаткова валідація для специфічних полів
                if (fieldInfo.name === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        field.classList.add('error-field');
                        showFieldError(field, 'Введіть коректний email');
                        isValid = false;
                    }
                } else if (fieldInfo.name === 'phone_number') {
                    // Валідація українського номера телефону
                    const phoneRegex = /^(380\d{9}|0\d{9})$/;
                    const cleanPhone = value.replace(/[^\d]/g, '');
                    if (!phoneRegex.test(cleanPhone)) {
                        field.classList.add('error-field');
                        showFieldError(field, 'Номер телефону має бути у форматі 380XXXXXXXXX або 0XXXXXXXXX');
                        isValid = false;
                    }
                } else if (fieldInfo.name === 'code_edrpo') {
                    // Валідація коду ЄДРПОУ (8 цифр)
                    const codeRegex = /^\d{8}$/;
                    if (!codeRegex.test(value)) {
                        field.classList.add('error-field');
                        showFieldError(field, 'Код ЄДРПОУ має містити 8 цифр');
                        isValid = false;
                    }
                } else if (fieldInfo.name === 'contract_end_date') {
                    // Валідація дати (не може бути в минулому)
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDate < today) {
                        field.classList.add('error-field');
                        showFieldError(field, 'Дата закінчення не може бути в минулому');
                        isValid = false;
                    }
                }
            }
        }
    });
    
    return isValid;
}

// Функція для показу помилки поля
function showFieldError(field, message) {
    const fieldName = field.getAttribute('name');
    let errorDiv = document.getElementById(`error-${fieldName}`);
    
    if (!errorDiv) {
        // Якщо елемент error div не знайдено, створюємо його
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.id = `error-${fieldName}`;
        
        // Вставляємо після поля
        field.parentNode.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
}

// Функція для валідації одного поля
function validateSingleField(field) {
    const fieldName = field.getAttribute('name');
    const value = field.value.trim();
    
    // Видаляємо попередні помилки
    field.classList.remove('error-field');
    const errorDiv = document.getElementById(`error-${fieldName}`);
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    
    // Список обов'язкових полів
    const requiredFields = ['company_name', 'code_edrpo', 'first_name', 'last_name', 'email', 'phone_number', 'contract_number', 'contract_end_date'];
    
    if (requiredFields.includes(fieldName) && !value) {
        field.classList.add('error-field');
        const labels = {
            'company_name': 'Назва компанії',
            'code_edrpo': 'Код ЄДРПОУ',
            'first_name': "Ім'я контактної особи",
            'last_name': 'Прізвище контактної особи',
            'email': 'Email',
            'phone_number': 'Телефон',
            'contract_number': 'Номер договору',
            'contract_end_date': 'Дата закінчення договору'
        };
        showFieldError(field, `${labels[fieldName]} є обов'язковим полем`);
        return;
    }
    
    // Специфічна валідація для різних типів полів
    if (value) {
        switch (fieldName) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    field.classList.add('error-field');
                    showFieldError(field, 'Введіть коректний email');
                }
                break;
                
            case 'phone_number':
                const phoneRegex = /^(380\d{9}|0\d{9})$/;
                const cleanPhone = value.replace(/[^\d]/g, '');
                if (!phoneRegex.test(cleanPhone)) {
                    field.classList.add('error-field');
                    showFieldError(field, 'Номер телефону має бути у форматі 380XXXXXXXXX або 0XXXXXXXXX');
                }
                break;
                
            case 'code_edrpo':
                const codeRegex = /^\d{8}$/;
                if (!codeRegex.test(value)) {
                    field.classList.add('error-field');
                    showFieldError(field, 'Код ЄДРПОУ має містити 8 цифр');
                }
                break;
                
            case 'contract_end_date':
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    field.classList.add('error-field');
                    showFieldError(field, 'Дата закінчення не може бути в минулому');
                }
                break;
        }
    }
}

// Функція для відправки форми додавання клієнта через AJAX
function submitAddClientForm() {
    const form = document.getElementById('addClientForm');
    if (!form) {
        console.error('Форма додавання клієнта не знайдена');
        return false;
    }
    
    // Видаляємо попередні повідомлення про помилки
    form.querySelectorAll('.alert-danger, .alert-success').forEach(el => el.remove());
    
    // Очищаємо попередні помилки валідації
    form.querySelectorAll('.error-field').forEach(field => {
        field.classList.remove('error-field');
        field.style.borderColor = '';
    });
    
    // Отримуємо дані форми
    const formData = new FormData(form);
    
    // Показуємо повідомлення про завантаження
    let loadingMsg = document.getElementById('loading-message-add');
    if (!loadingMsg) {
        loadingMsg = document.createElement('div');
        loadingMsg.className = 'alert alert-info';
        loadingMsg.textContent = 'Створюємо клієнта...';
        loadingMsg.id = 'loading-message-add';
        loadingMsg.style.marginBottom = '15px';
        form.prepend(loadingMsg);
    }
    
    // Отримуємо CSRF токен
    const csrfToken = getCookie('csrftoken');
    
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => {
        console.log('Add client response status:', response.status);
        return response.text().then(text => {
            // Спробуємо розпарсити як JSON, якщо не вийде - поверне HTML
            try {
                return JSON.parse(text);
            } catch {
                return { html: text, isHTML: true };
            }
        });
    })
    .then(data => {
        const loadingMessage = document.getElementById('loading-message-add');
        if (loadingMessage) loadingMessage.remove();
        
        if (data.isHTML) {
            // Якщо отримали HTML (сторінку з помилками), обробляємо її
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data.html;
            
            // Шукаємо форму з помилками в отриманому HTML
            const newForm = tempDiv.querySelector('#addClientForm');
            if (newForm) {
                // Перевіряємо наявність помилок валідації
                const hasErrors = newForm.querySelector('.error-message, .alert-danger');
                if (hasErrors) {
                    // Замінюємо вміст існуючої форми
                    const currentFormContent = form.querySelector('.modal-content');
                    const newFormContent = tempDiv.querySelector('.modal-content');
                    if (currentFormContent && newFormContent) {
                        currentFormContent.innerHTML = newFormContent.innerHTML;
                        
                        // Повторно налаштовуємо валідацію для нової форми
                        setupRealTimeValidation();
                        
                        // Повторно налаштовуємо обробники подій для форми
                        setupAddClientFormHandler();
                        
                        // Показуємо повідомлення про помилку
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'alert alert-danger';
                        errorMsg.style.marginBottom = '15px';
                        errorMsg.textContent = 'Виправте помилки у формі і спробуйте ще раз';
                        form.prepend(errorMsg);
                    }
                } else {
                    // Перевіряємо наявність згенерованого паролю
                    const passwordInfo = tempDiv.querySelector('input[name="show_credentials"]');
                    if (passwordInfo && passwordInfo.value === 'True') {
                        // Отримуємо дані про пароль
                        const emailInput = tempDiv.querySelector('input[name="generated_email"]');
                        const passwordInput = tempDiv.querySelector('input[name="password"]');
                        
                        if (emailInput && passwordInput) {
                            // Показуємо успішне повідомлення з паролем
                            const successAlert = document.createElement('div');
                            successAlert.className = 'alert alert-success';
                            successAlert.style.marginBottom = '15px';
                            successAlert.innerHTML = `
                                <h4>Клієнта успішно створено!</h4>
                                <p><strong>Email:</strong> ${emailInput.value}</p>
                                <p><strong>Пароль:</strong> ${passwordInput.value}</p>
                                <p>Збережіть ці дані в надійному місці</p>
                            `;
                            form.prepend(successAlert);
                            
                            // Змінюємо кнопку збереження на закриття
                            const submitBtn = form.querySelector('button[type="submit"]');
                            if (submitBtn) {
                                submitBtn.textContent = 'Закрити';
                                submitBtn.type = 'button';
                                submitBtn.onclick = function() { 
                                    redirectToClientsList(); 
                                    return false;
                                };
                            }
                        }
                    } else {
                        // Просто показуємо успішне повідомлення
                        const successMsg = document.createElement('div');
                        successMsg.className = 'alert alert-success';
                        successMsg.style.marginBottom = '15px';
                        successMsg.textContent = 'Клієнта успішно створено!';
                        form.prepend(successMsg);
                        
                        // Перенаправляємо через секунду
                        setTimeout(() => {
                            redirectToClientsList();
                        }, 1500);
                    }
                }
            }
        } else if (data.success) {
            // Якщо отримали JSON з успіхом
            const successMsg = document.createElement('div');
            successMsg.className = 'alert alert-success';
            successMsg.style.marginBottom = '15px';
            
            if (data.generated_password && data.email) {
                successMsg.innerHTML = `
                    <h4>Клієнта успішно створено!</h4>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Пароль:</strong> ${data.generated_password}</p>
                    <p>Збережіть ці дані в надійному місці</p>
                `;
                
                // Змінюємо кнопку збереження на закриття
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Закрити';
                    submitBtn.type = 'button';
                    submitBtn.onclick = function() { 
                        redirectToClientsList(); 
                        return false;
                    };
                }
            } else {
                successMsg.textContent = 'Клієнта успішно створено!';
                // Перенаправляємо через секунду
                setTimeout(() => {
                    redirectToClientsList();
                }, 1500);
            }
            
            form.prepend(successMsg);
        } else if (data.errors) {
            // Якщо отримали JSON з помилками
            console.error('Add client failed:', data.errors);
            
            // Створюємо контейнер для помилок
            const errorContainer = document.createElement('div');
            errorContainer.className = 'alert alert-danger';
            errorContainer.style.marginBottom = '15px';
            
            // Додаємо заголовок
            const errorHeader = document.createElement('p');
            errorHeader.innerHTML = '<strong>Помилка при створенні клієнта:</strong>';
            errorContainer.appendChild(errorHeader);
            
            // Створюємо список помилок
            const errorList = document.createElement('ul');
            errorList.style.marginBottom = '0';
            
            // Додаємо кожну помилку до списку
            if (typeof data.errors === 'object') {
                Object.keys(data.errors).forEach(field => {
                    const fieldErrors = Array.isArray(data.errors[field]) ? data.errors[field] : [data.errors[field]];
                    fieldErrors.forEach(error => {
                        const li = document.createElement('li');
                        li.textContent = `${field}: ${error}`;
                        errorList.appendChild(li);
                        
                        // Знаходимо поле з помилкою та позначаємо його
                        const fieldElement = form.querySelector(`[name="${field}"]`);
                        if (fieldElement) {
                            fieldElement.classList.add('error-field');
                            fieldElement.style.borderColor = '#dc3545';
                        }
                    });
                });
            } else if (typeof data.errors === 'string') {
                const li = document.createElement('li');
                li.textContent = data.errors;
                errorList.appendChild(li);
            }
            
            errorContainer.appendChild(errorList);
            form.prepend(errorContainer);
        }
    })
    .catch(error => {
        console.error('Error submitting add client form:', error);
        
        // Видаляємо повідомлення про завантаження
        const loadingMessage = document.getElementById('loading-message-add');
        if (loadingMessage) loadingMessage.remove();
        
        // Показуємо повідомлення про помилку
        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-danger';
        errorMsg.style.marginBottom = '15px';
        errorMsg.textContent = 'Помилка при відправці форми: ' + error.message;
        form.prepend(errorMsg);
    });
    
    return false;
}

// Функція для налаштування обробників подій форми додавання клієнта
function setupAddClientFormHandler() {
    const addClientForm = document.getElementById('addClientForm');
    if (addClientForm) {
        // Видаляємо всі попередні обробники подій
        const newForm = addClientForm.cloneNode(true);
        addClientForm.parentNode.replaceChild(newForm, addClientForm);
        
        // Налаштовуємо новий обробник
        newForm.addEventListener('submit', function(event) {
            // Запобігаємо стандартній відправці форми
            event.preventDefault();
            
            // Перевіряємо валідність форми
            if (!validateAddClientForm()) {
                // Прокручуємо до першого поля з помилкою
                const firstErrorField = newForm.querySelector('.error-field');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
                return false;
            }
            
            // Якщо валідація пройшла успішно, відправляємо форму через AJAX
            submitAddClientForm();
        });
    }
}

// Функція для очищення форми додавання клієнта
function clearAddClientForm() {
    const form = document.getElementById('addClientForm');
    if (form) {
        // Очищаємо всі поля форми
        form.reset();
        
        // Видаляємо всі повідомлення про помилки та успіх
        form.querySelectorAll('.alert-danger, .alert-success, .alert-info').forEach(el => el.remove());
        
        // Очищаємо всі помилки валідації
        form.querySelectorAll('.error-field').forEach(field => {
            field.classList.remove('error-field');
            field.style.borderColor = '';
        });
        
        // Очищаємо повідомлення про помилки полів
        form.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
    }
}



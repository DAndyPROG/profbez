// Функція для закриття всіх модальних вікон (робимо глобальною)
window.closeAllModals = function() {
    const addModal = document.getElementById("addStudentModal");
    const editModal = document.getElementById("editStudentModal");
    const deleteModal = document.getElementById("deleteStudentModal");
    const passwordModal = document.getElementById("passwordModal");
    const importModal = document.getElementById("importModal");
    
    const modals = [addModal, editModal, deleteModal, passwordModal, importModal];
    modals.forEach(modal => {
        if (modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });
    
    // Очищаємо помилки імпорту при закритті модального вікна
    clearImportErrors();
}

// Функція для отримання CSRF токену
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

document.addEventListener('DOMContentLoaded', function() { 
    // Модальні вікна
    const addModal = document.getElementById("addStudentModal");
    const editModal = document.getElementById("editStudentModal");
    const deleteModal = document.getElementById("deleteStudentModal");
    const passwordModal = document.getElementById("passwordModal");
    const importModal = document.getElementById("importModal");
    if (!addModal) return;
    
    // Налаштування модальних вікон
    const closeButtons = document.querySelectorAll(".close");
    const cancelButtons = document.querySelectorAll(".cancel-btn");
    
    // Закриття при кліку на хрестик
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Перевіряємо чи це хрестик модального вікна імпорту
            const importModal = document.getElementById('importModal');
            if (importModal && importModal.contains(button)) {
                clearImportErrors();
            }
            window.closeAllModals();
        });
    });
    
    // Закриття при кліку на кнопку "Скасувати"  
    cancelButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Перевіряємо чи це кнопка в модальному вікні імпорту
            const importModal = document.getElementById('importModal');
            if (importModal && importModal.contains(button)) {
                clearImportErrors();
            }
            window.closeAllModals();
        });
    });
    
    // Закриття при кліку поза модальним вікном
    window.addEventListener('click', function(event) {
        const modals = [addModal, editModal, deleteModal, passwordModal, importModal];
        modals.forEach(modal => {
            if (event.target === modal) {
                // Якщо це модальне вікно імпорту, очищаємо помилки
                if (modal && modal.id === 'importModal') {
                    clearImportErrors();
                }
                window.closeAllModals();
            }
        });
    });

    // Відкриття модального вікна для додавання
    window.addNewStudent = function() {
        addModal.style.display = "block";
        document.body.style.overflow = "hidden";
    }

    // Функція для пошуку студентів
    window.searchStudents = function() {
        const studentSearch = document.querySelector('input[name="search_student"]')?.value || '';
        const companySearch = document.querySelector('input[name="search_company"]')?.value || '';
        
        let url = '/students/?';
        if (studentSearch) {
            url += `search_student=${encodeURIComponent(studentSearch)}&`;
        }
        if (companySearch) {
            url += `search_company=${encodeURIComponent(companySearch)}&`;
        }
        
        // Видаляємо останній символ & або ? якщо він є
        if (url.endsWith('&') || url.endsWith('?')) {
            url = url.slice(0, -1);
        }
        
        window.location.href = url;
    }

    // Функція для експорту в Excel із поточними параметрами пошуку
    window.exportToExcel = function() {
        // Отримуємо поточні параметри пошуку
        const searchStudent = document.querySelector('input[name="search_student"]')?.value || '';
        const searchCompany = document.querySelector('input[name="search_company"]')?.value || '';
        
        // Будуємо URL для експорту з тими ж параметрами пошуку
        let url = '/students/export-excel/?';
        if (searchStudent) {
            url += `search_student=${encodeURIComponent(searchStudent)}&`;
        }
        if (searchCompany) {
            url += `search_company=${encodeURIComponent(searchCompany)}&`;
        }
        
        // Видаляємо останній символ & або ? якщо він є
        if (url.endsWith('&') || url.endsWith('?')) {
            url = url.slice(0, -1);
        }
        
        // Перенаправляємо на URL експорту
        window.location.href = url;
    }

    // Функція для показу модального вікна імпорту
    window.showImportModal = function() {
        // Показуємо модальне вікно імпорту
        const importModal = document.getElementById('importModal');
        if (importModal) {
            importModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // При відкритті модального вікна перевіряємо, чи потрібно відображати помилки
            checkAndDisplayImportErrors();
        }
    }

    // Функція для очищення помилок імпорту
    function clearImportErrors() {
        console.log('clearImportErrors called');
        
        // Очищаємо блок з помилками в DOM
        const importModal = document.getElementById('importModal');
        if (importModal) {
            const errorContainer = importModal.querySelector('.import-errors');
            if (errorContainer) {
                errorContainer.innerHTML = '';
                errorContainer.style.display = 'none';
            }
            
            const messageContainer = importModal.querySelector('.import-message');
            if (messageContainer) {
                messageContainer.innerHTML = '';
                messageContainer.style.display = 'none';
            }
        }
        
        // Очищаємо помилки на сервері
        fetch('/students/clear-import-errors/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Помилки імпорту очищені на сервері');
        })
        .catch(error => {
            console.error('Помилка при очищенні помилок на сервері:', error);
        });
    }

    // Функція для перевірки та відображення помилок імпорту
    function checkAndDisplayImportErrors() {
        // Робимо AJAX-запит для отримання помилок з сесії
        fetch('/students/get-import-errors/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.has_errors) {
                // Відображаємо помилки
                displayImportErrors(data.errors);
            } else {
                // Приховуємо блок з помилками
                const errorContainer = document.querySelector('#importModal .import-errors');
                if (errorContainer) {
                    errorContainer.innerHTML = '';
                    errorContainer.style.display = 'none';
                }
            }
        })
        .catch(error => console.error('Помилка при отриманні помилок імпорту:', error));
    }

    // Функція для відображення помилок імпорту
    function displayImportErrors(errors) {
        if (!errors || errors.length === 0) return;
        
        const importModal = document.getElementById('importModal');
        if (!importModal) return;
        
        // Знаходимо або створюємо блок для помилок
        let errorContainer = importModal.querySelector('.import-errors');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'import-errors';
            
            // Додаємо контейнер на початок тіла модального вікна
            const modalBody = importModal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.insertBefore(errorContainer, modalBody.firstChild);
            }
        }
        
        // Формуємо HTML для відображення помилок
        let errorsHtml = '<div class="alert alert-danger"><h3>Помилки імпорту:</h3><ul>';
        errors.forEach(error => {
            errorsHtml += `<li>${error}</li>`;
        });
        errorsHtml += '</ul></div>';
        
        // Встановлюємо HTML і показуємо блок
        errorContainer.innerHTML = errorsHtml;
        errorContainer.style.display = 'block';
        
        // Додаємо обробник для кнопки закриття модального вікна
        const closeBtn = importModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', clearImportErrors, { once: true });
        }
    }

    // Функція для закриття модального вікна імпорту
    window.closeImportModal = function() {
        const importModal = document.getElementById('importModal');
        if (importModal) {
            importModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        // Очищаємо помилки імпорту при закритті модального вікна
        clearImportErrors();
    }

    // Функція для відкриття модального вікна зміни пароля
    window.showPasswordModal = function() {
        const passwordModal = document.getElementById("passwordModal");
        if (passwordModal) {
            passwordModal.style.display = "block";
            document.body.style.overflow = "hidden";
            console.log("Відкриваю модальне вікно для зміни пароля");
        } else {
            console.error("Елемент passwordModal не знайдено!");
        }
    }

    // Функція для закриття модального вікна зміни пароля
    window.closePasswordModal = function() {
        const passwordModal = document.getElementById("passwordModal");
        if (passwordModal) {
            passwordModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }

    // Функція для генерації шаблону Excel
    window.generateTemplate = function() {
        // Використовуємо бібліотеку SheetJS для створення Excel файлу
        const workbook = XLSX.utils.book_new();
        
        // Створюємо заголовки
        const headers = ['НАЗВА КОМПАНІЇ', 'ПІБ СЛУХАЧА', 'E-MAIL', 'ПОСАДА СЛУХАЧА', 'НАПРЯМОК НАВЧАННЯ', 'НОМЕР ТЕЛЕФОНУ'];
        
        // Створюємо дані з прикладом
        const data = [
            headers,
            ['ТОВ Приклад', 'Петро Петренко', 'petrenko@example.com', 'Інженер з охорони праці', '57413, 123456', '380671234567']
        ];
        
        // Створюємо аркуш
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Додаємо аркуш до книги
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
        
        // Зберігаємо файл
        XLSX.writeFile(workbook, 'шаблон_імпорту_слухачів.xlsx');
    }

    // Відкриття модального вікна для редагування
    window.editStudent = function(studentId) {
        // Перенаправляємо на URL, який поверне сторінку з відкритим модальним вікном редагування
        window.location.href = `/students/update/${studentId}/`;
        
        // Якщо модальне вікно вже відкрите (після перенаправлення), показуємо його
        const editModal = document.getElementById("editStudentModal");
        if (editModal && editModal.style.display === "block") {
            document.body.style.overflow = "hidden";
        }
    }

    // Відкриття модального вікна для видалення
    window.deleteStudent = function(studentId) {
        const deleteModal = document.getElementById("deleteStudentModal");
        const deleteStudentId = document.getElementById("deleteStudentId");
        const deleteMessage = document.getElementById('deleteStudentMessage');
        
        // Знаходимо рядок студента для отримання імені
        const studentRow = document.querySelector(`tr[data-student-id="${studentId}"]`);
        
        // Отримуємо ім'я та прізвище студента (4-та колонка в таблиці, індекс 3)
        const studentName = studentRow ? studentRow.cells[3].textContent.trim() : 'цього слухача';
        
        if (deleteModal && deleteStudentId && deleteMessage) {
            // Встановлюємо ID студента для видалення
            deleteStudentId.value = studentId;
            
            // Оновлюємо повідомлення з ім'ям студента
            deleteMessage.innerHTML = `Ви впевнені, що хочете видалити слухача <strong>${studentName}</strong>?`;
            
            // Показуємо модальне вікно
            deleteModal.style.display = "block";
            document.body.style.overflow = "hidden";
            
            // Налаштовуємо форму для відправки
            const deleteForm = document.getElementById("deleteStudentForm");
            if (deleteForm) {
                deleteForm.action = `/students/delete/${studentId}/`;
            }
        } else {
            console.error("Не вдалося знайти елементи модального вікна видалення");
        }
    }

    // Обробник кліку на кнопку видалення
    function handleDeleteClick() {
        const deleteForm = document.getElementById("deleteStudentForm");
        if (deleteForm) {
            // Показуємо індикатор очікування
            this.disabled = true;
            this.textContent = 'Видаляємо...';
            
            // Відправляємо форму
            deleteForm.submit();
        }
    }

    // Функція для обробки додавання нових полів курсу
    function setupCourseHandlers() {
        // Додавання нового курсу в формі додавання слухача
        const addMoreCourseBtn = document.getElementById('addMoreCourse');
        if (addMoreCourseBtn) {
            addMoreCourseBtn.addEventListener('click', function() {
                addCourseField('courses_container');
            });
        }
        
        // Додавання нового курсу в формі редагування слухача
        const addMoreEditCourseBtn = document.getElementById('addMoreEditCourse');
        if (addMoreEditCourseBtn) {
            addMoreEditCourseBtn.addEventListener('click', function() {
                addCourseField('edit_courses_container');
            });
        }
        
        // Початкова ініціалізація обробників видалення курсів
        initRemoveCourseHandlers();
    }
    
    // Функція для додавання нового поля курсу
    function addCourseField(containerId) {
        const coursesContainer = document.getElementById(containerId);
        if (!coursesContainer) return;
        
        // Клонуємо перший елемент або створюємо новий
        let firstCourseForm = coursesContainer.querySelector('.course-form');
        let newCourseForm;
        
        if (firstCourseForm) {
            newCourseForm = firstCourseForm.cloneNode(true);
            
            // Очищаємо значення в новому полі
            const selectElement = newCourseForm.querySelector('select.course-select');
            if (selectElement) {
                selectElement.value = '';
            }
        } else {
            // Створюємо новий елемент якщо не змогли клонувати
            newCourseForm = document.createElement('div');
            newCourseForm.className = 'course-form';
            newCourseForm.innerHTML = `
                <div class="course-inputs-row">
                    <div class="course-url-field">
                        <select name="courses" class="form-control course-select">
                            <option value="">Оберіть курс</option>
                            ${generateCoursesOptions()}
                        </select>
                    </div>
                    <div class="course-action-field">
                        <button type="button" class="remove-course delete-btn">✖</button>
                    </div>
                </div>
            `;
        }
        
        // Додаємо обробник для кнопки видалення
        coursesContainer.appendChild(newCourseForm);
        initRemoveCourseHandlers();
    }
    
    // Генеруємо HTML опцій для курсів
    function generateCoursesOptions() {
        if (!window.availableCourses || !window.availableCourses.length) {
            return '';
        }
        
        return window.availableCourses.map(course => {
            return `<option value="${course.id}">${course.code} - ${course.name}</option>`;
        }).join('');
    }
    
    // Ініціалізуємо обробники для кнопок видалення курсу
    function initRemoveCourseHandlers() {
        const removeBtns = document.querySelectorAll('.remove-course');
        removeBtns.forEach(btn => {
            // Видаляємо існуючі обробники, щоб уникнути дублювання
            btn.removeEventListener('click', handleRemoveCourse);
            btn.addEventListener('click', handleRemoveCourse);
        });
    }
    
    // Функція-обробник для видалення курсу
    function handleRemoveCourse(e) {
        const courseForm = e.target.closest('.course-form');
        const coursesContainer = courseForm.parentElement;
        
        // Перевіряємо, чи це останнє поле курсу
        const courseFormElements = coursesContainer.querySelectorAll('.course-form');
        if (courseFormElements.length > 1) {
            courseForm.remove();
        } else {
            // Якщо це останнє поле, просто очищаємо значення
            const selectElement = courseForm.querySelector('select.course-select');
            if (selectElement) {
                selectElement.value = '';
            }
        }
    }
    
    // Запускаємо налаштування обробників при завантаженні сторінки
    setupCourseHandlers();

    // Перевіряємо чи потрібно показати модальне вікно з обліковими даними
    if (typeof showCredentials !== 'undefined' && showCredentials) {
        const addModal = document.getElementById('addStudentModal');
        if (addModal) {
            addModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Додаємо обробник для закриття модального вікна з оновленням сторінки
            const closeButton = addModal.querySelector('.close');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    addModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                });
            }
            
            // Додаємо обробник для кнопки "Закрити"
            const closeBtn = addModal.querySelector('.add-btn.green-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    addModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                });
            }
        }
    }

    // Перевіряємо чи потрібно показати модальне вікно зміни пароля
    if (typeof show_password_modal !== 'undefined' && show_password_modal) {
        const passwordModal = document.getElementById('passwordModal');
        if (passwordModal) {
            passwordModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    // Функція для збереження значень форми перед відправкою
    function preserveFormValues() {
        const form = document.getElementById('editStudentForm');
        if (!form) return;
        
        // Зберігаємо всі значення форми в sessionStorage
        const formData = new FormData(form);
        const formValues = {};
        
        for (let [key, value] of formData.entries()) {
            formValues[key] = value;
        }
        
        sessionStorage.setItem('editFormValues', JSON.stringify(formValues));
    }

    // Функція для відновлення значень форми після помилок
    function restoreFormValues() {
        const savedValues = sessionStorage.getItem('editFormValues');
        if (!savedValues) return;
        
        const formValues = JSON.parse(savedValues);
        const form = document.getElementById('editStudentForm');
        if (!form) return;
        
        // Відновлюємо значення для всіх полів
        Object.keys(formValues).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                if (field.type === 'select-one') {
                    field.value = formValues[fieldName];
                } else {
                    field.value = formValues[fieldName];
                }
            }
        });
        
        // Очищаємо збережені значення
        sessionStorage.removeItem('editFormValues');
    }

    // Модифікуємо функцію submitEditForm
    window.submitEditForm = function() {
        const form = document.getElementById('editStudentForm');
        if (!form) return false;
        
        // Зберігаємо значення форми перед відправкою
        preserveFormValues();
        
        // Перевіряємо обов'язкові поля
        const requiredFields = ['first_name', 'last_name', 'email', 'position', 'phone_number'];
        let missingFields = [];
        
        requiredFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field && !field.value.trim()) {
                field.classList.add('is-invalid');
                missingFields.push(field.labels[0].textContent.replace(':', ''));
            } else if (field) {
                field.classList.remove('is-invalid');
            }
        });
        
        if (missingFields.length > 0) {
            alert(`Будь ласка, заповніть наступні поля: ${missingFields.join(', ')}`);
            return false;
        }
        
        // Перевіряємо вибрані курси
        const courseSelects = form.querySelectorAll('.course-select');
        let hasCourses = false;
        
        courseSelects.forEach(select => {
            if (select.value) {
                hasCourses = true;
                select.classList.remove('is-invalid');
            } else {
                select.classList.add('is-invalid');
            }
        });
        
        if (!hasCourses) {
            alert('Будь ласка, оберіть хоча б один курс');
            return false;
        }
        
        // Показуємо індикатор очікування (без перекриття всього екрану)
        const submitButton = document.querySelector('#editStudentForm button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Зберігаємо...';
        }
        
        // Створюємо індикатор завантаження всередині форми
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'inline-loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><p>Зберігаємо дані...</p>';
        loadingIndicator.style.padding = '15px';
        loadingIndicator.style.margin = '10px 0';
        loadingIndicator.style.textAlign = 'center';
        loadingIndicator.style.backgroundColor = '#f8f9fa';
        loadingIndicator.style.borderRadius = '4px';
        
        // Додаємо індикатор завантаження на початок форми
        form.prepend(loadingIndicator);
        
        // Відправляємо запит через fetch API
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken()
            }
        })
        .then(response => {
            console.log("Response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Response data:", data);
            
            // Видаляємо індикатор завантаження
            const loadingIndicatorElement = document.querySelector('.inline-loading-indicator');
            if (loadingIndicatorElement) {
                loadingIndicatorElement.remove();
            }
            
            // Відновлюємо кнопку
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Зберегти';
            }
            
            // Обробка відповіді в залежності від результату
            if (data.success) {
                console.log("Form submitted successfully");
                
                // Якщо є URL для перенаправлення, використовуємо його
                if (data.redirect_url) {
                    // Показуємо коротке повідомлення перед перенаправленням
                    const successMessage = `Слухача успішно додано!\nEmail: ${data.email}\nПароль: ${data.password}`;
                    alert(successMessage);
                    
                    // Перенаправляємо на сторінку списку студентів
                    window.location.href = data.redirect_url;
                } else {
                    // Залишаємо старий код для зворотної сумісності
                    const addModal = document.getElementById('addStudentModal');
                    if (!addModal) {
                        console.error("Modal not found");
                        return;
                    }
                    
                    // Очищаємо форму
                    form.reset();
                    
                    // Знаходимо контейнер для модального вікна
                    const modalContent = addModal.querySelector('.modal-content');
                    if (!modalContent) {
                        console.error("Modal content not found");
                        return;
                    }
                    
                    // Створюємо новий вміст модального вікна
                    modalContent.innerHTML = `
                        <div class="modal-header">
                            <h2>Реєстрація успішна!</h2>
                            <span class="close">&times;</span>
                        </div>
                        <div class="alert alert-success credentials-container">
                            <p>Слухача успішно додано до системи</p>
                            <p><strong>Email:</strong> ${data.email || ''}</p>
                            <p><strong>Пароль:</strong> ${data.password || ''}</p>
                            <p>Будь ласка, збережіть ці дані в надійному місці.</p>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="add-btn green-btn" onclick="closeAndRefresh()">Закрити</button>
                        </div>
                    `;
                    
                    // Додаємо обробник для кнопки закриття
                    const closeButton = modalContent.querySelector('.close');
                    if (closeButton) {
                        closeButton.addEventListener('click', closeAndRefresh);
                    }
                    
                    // Автоматично оновлюємо таблицю слухачів
                    refreshStudentsTable();
                }
                
            } else {
                console.error("Form submission failed:", data.errors);
                
                // Показуємо повідомлення про помилки
                if (data.errors) {
                    // Створюємо загальне повідомлення про помилку
                    showNotificationModal('Помилка', 'Будь ласка, перевірте форму на наявність помилок', 'error');
                    
                    // Відображаємо помилки для конкретних полів
                    if (data.field_errors) {
                        Object.keys(data.field_errors).forEach(fieldName => {
                            const field = form.querySelector(`[name="${fieldName}"]`);
                            if (field) {
                                field.classList.add('is-invalid');
                                
                                const errorSpan = document.createElement('span');
                                errorSpan.className = 'error-message inline-error';
                                errorSpan.textContent = data.field_errors[fieldName][0];
                                
                                field.parentNode.insertBefore(errorSpan, field.nextSibling);
                            }
                        });
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            
            // Видаляємо індикатор завантаження, якщо він існує
            const loadingIndicatorElement = document.querySelector('.inline-loading-indicator');
            if (loadingIndicatorElement) {
                loadingIndicatorElement.remove();
            }
            
            // Відновлюємо кнопку
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Зберегти';
            }
            
            // Показуємо повідомлення про помилку
            showNotificationModal('Помилка', 'Виникла помилка при збереженні. Спробуйте ще раз.', 'error');
        });
        
        // Запобігаємо стандартній відправці форми
        return false;
    }

    // Функція для показу сповіщення в модальному вікні
    function showNotificationModal(title, message, type) {
        // Створюємо контейнер для модального вікна
        let modalContainer = document.getElementById('notificationModal');
        
        // Якщо вікно не існує, створюємо його
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'notificationModal';
            modalContainer.className = 'modal';
            modalContainer.style.display = 'none';
            document.body.appendChild(modalContainer);
            
            // Створюємо вміст модального вікна
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.maxWidth = '400px';
            
            modalContainer.appendChild(modalContent);
            
            // Створюємо заголовок
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalContent.appendChild(modalHeader);
            
            // Заголовок
            const modalTitle = document.createElement('h2');
            modalTitle.id = 'notification-title';
            modalHeader.appendChild(modalTitle);
            
            // Кнопка закриття
            const closeButton = document.createElement('span');
            closeButton.className = 'close';
            closeButton.innerHTML = '&times;';
            closeButton.onclick = function() {
                modalContainer.style.display = 'none';
            };
            modalHeader.appendChild(closeButton);
            
            // Створюємо тіло модального вікна
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalContent.appendChild(modalBody);
            
            // Вміст повідомлення
            const messageContainer = document.createElement('div');
            messageContainer.id = 'notification-message';
            messageContainer.className = 'alert';
            modalBody.appendChild(messageContainer);
            
            // Кнопки дій
            const actionContainer = document.createElement('div');
            actionContainer.className = 'form-actions';
            modalContent.appendChild(actionContainer);
            
            // Кнопка OK
            const okButton = document.createElement('button');
            okButton.type = 'button';
            okButton.className = 'add-btn green-btn';
            okButton.textContent = 'OK';
            okButton.onclick = function() {
                modalContainer.style.display = 'none';
            };
            actionContainer.appendChild(okButton);
        }
        
        // Оновлюємо заголовок і повідомлення
        document.getElementById('notification-title').textContent = title;
        const messageElement = document.getElementById('notification-message');
        messageElement.textContent = message;
        
        // Встановлюємо клас в залежності від типу
        messageElement.className = 'alert';
        if (type === 'error') {
            messageElement.className += ' alert-danger';
        } else if (type === 'success') {
            messageElement.className += ' alert-success';
        } else if (type === 'warning') {
            messageElement.className += ' alert-warning';
        } else {
            messageElement.className += ' alert-info';
        }
        
        // Показуємо модальне вікно
        modalContainer.style.display = 'block';
    }

    // Функція для оновлення таблиці слухачів без перезавантаження сторінки
    function refreshStudentsTable() {
        // Отримуємо поточні параметри пошуку
        const searchStudent = document.querySelector('input[name="search_student"]')?.value || '';
        const searchCompany = document.querySelector('input[name="search_company"]')?.value || '';
        
        // Будуємо URL для отримання оновленої таблиці
        let url = '/students/?ajax=1';
        if (searchStudent) {
            url += `&search_student=${encodeURIComponent(searchStudent)}`;
        }
        if (searchCompany) {
            url += `&search_company=${encodeURIComponent(searchCompany)}`;
        }
        
        // Робимо AJAX запит для отримання оновленої таблиці
        fetch(url, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken()
            }
        })
        .then(response => response.text())
        .then(html => {
            // Створюємо тимчасовий контейнер для парсингу HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Знаходимо нову таблицю в отриманому HTML
            const newTable = tempDiv.querySelector('#studentsTable');
            const newPagination = tempDiv.querySelector('.pagination');
            
            if (newTable) {
                // Замінюємо всю таблицю
                const currentTableContainer = document.querySelector('.table-container');
                const currentTable = currentTableContainer.querySelector('#studentsTable');
                if (currentTable) {
                    currentTable.replaceWith(newTable);
                }
            }
            
            if (newPagination) {
                // Замінюємо пагінацію
                const currentPagination = document.querySelector('.pagination');
                if (currentPagination) {
                    currentPagination.replaceWith(newPagination);
                }
            }
            
            console.log('Таблиця слухачів успішно оновлена');
        })
        .catch(error => {
            console.error('Помилка при оновленні таблиці слухачів:', error);
        });
    }

    // Функція для закриття модального вікна та оновлення таблиці
    function closeAndRefresh() {
        // Закриваємо всі модальні вікна
        window.closeAllModals();
        
        // Оновлюємо таблицю слухачів
        refreshStudentsTable();
    }

    // Робимо функції глобально доступними
    window.refreshStudentsTable = refreshStudentsTable;
    window.closeAndRefresh = closeAndRefresh;
    window.closeImportModal = closeImportModal;
    window.clearImportErrors = clearImportErrors;

    // Відновлюємо значення форми після перезавантаження сторінки з помилками
    if (document.getElementById('editStudentModal') && 
        document.getElementById('editStudentModal').style.display === 'block') {
        restoreFormValues();
    }

    // Обробка форми імпорту через AJAX
    const importForm = document.getElementById('importForm');
    if (importForm) {
        importForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            // Показуємо індикатор завантаження
            submitButton.textContent = 'Імпортую...';
            submitButton.disabled = true;
            
            // Очищаємо попередні помилки
            clearImportErrors();
            
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCSRFToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Успішний імпорт
                    showImportSuccess(data);
                    // Оновлюємо таблицю
                    refreshStudentsTable();
                    // Очищаємо форму
                    importForm.reset();
                } else {
                    // Показуємо помилки
                    if (data.errors && data.errors.length > 0) {
                        displayImportErrors(data.errors);
                    }
                    if (data.message) {
                        displayImportMessage(data.message, 'error');
                    }
                }
            })
            .catch(error => {
                console.error('Помилка при імпорті:', error);
                displayImportMessage('Помилка при обробці файлу', 'error');
            })
            .finally(() => {
                // Відновлюємо кнопку
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            });
        });
    }

    // Функція для відображення успішного імпорту
    function showImportSuccess(data) {
        const importModal = document.getElementById('importModal');
        if (!importModal) return;
        
        let messageContainer = importModal.querySelector('.import-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'import-message';
            
            const modalBody = importModal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.insertBefore(messageContainer, modalBody.firstChild);
            }
        }
        
        let successHtml = `<div class="alert alert-success">
            <h3>Імпорт завершено успішно!</h3>
            <p>Додано ${data.imported} з ${data.total} слухачів.</p>
        `;
        
        if (data.skipped > 0) {
            successHtml += `<p>Пропущено: ${data.skipped} записів.</p>`;
        }
        
        successHtml += '</div>';
        
        messageContainer.innerHTML = successHtml;
        messageContainer.style.display = 'block';
        
        // Автоматично приховуємо повідомлення через 3 секунди
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 3000);
    }

    // Функція для відображення повідомлень
    function displayImportMessage(message, type = 'info') {
        const importModal = document.getElementById('importModal');
        if (!importModal) return;
        
        let messageContainer = importModal.querySelector('.import-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'import-message';
            
            const modalBody = importModal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.insertBefore(messageContainer, modalBody.firstChild);
            }
        }
        
        const alertClass = type === 'error' ? 'alert-danger' : 'alert-info';
        messageContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
        messageContainer.style.display = 'block';
    }
});


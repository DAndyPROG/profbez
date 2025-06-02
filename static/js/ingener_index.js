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
    
    // Функція для закриття всіх модальних вікон
    function closeAllModals() {
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
    
    // Закриття при кліку на хрестик
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Закриття при кліку на кнопку "Скасувати"
    cancelButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Закриття при кліку поза модальним вікном
    window.addEventListener('click', function(event) {
        const modals = [addModal, editModal, deleteModal, passwordModal, importModal];
        modals.forEach(modal => {
            if (event.target === modal) {
                closeAllModals();
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
        const studentSearch = document.getElementById('searchStudent').value;
        
        let url = '/ingener/index/?';
        if (studentSearch) {
            url += `search_student=${encodeURIComponent(studentSearch)}&`;
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
        const searchStudent = document.getElementById('searchStudent').value;
        
        // Будуємо URL для експорту з тими ж параметрами пошуку
        let url = '/ingener/students/export-excel/?';
        if (searchStudent) {
            url += `search_student=${encodeURIComponent(searchStudent)}&`;
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
            
            // Закриття при кліку на хрестик
            const closeBtn = importModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    importModal.style.display = 'none';
                    // Очищаємо помилки при закритті модального вікна
                    clearImportErrors();
                });
            }
            
            // Закриття при кліку поза модальним вікном
            window.addEventListener('click', function(event) {
                if (event.target === importModal) {
                    importModal.style.display = 'none';
                    // Очищаємо помилки при закритті модального вікна
                    clearImportErrors();
                }
            });
            
            // При відкритті модального вікна перевіряємо, чи потрібно відображати помилки
            checkAndDisplayImportErrors();
        }
    }

    // Функція для очищення помилок імпорту
    function clearImportErrors() {
        // Робимо AJAX-запит для очищення помилок в сесії
        fetch('/ingener/students/clear-import-errors/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Очищаємо блок з помилками в DOM
                const errorContainer = document.querySelector('#importModal .import-errors');
                if (errorContainer) {
                    errorContainer.innerHTML = '';
                    errorContainer.style.display = 'none';
                }
            }
        })
        .catch(error => console.error('Помилка при очищенні помилок імпорту:', error));
    }

    // Функція для перевірки та відображення помилок імпорту
    function checkAndDisplayImportErrors() {
        // Робимо AJAX-запит для отримання помилок з сесії
        fetch('/ingener/students/get-import-errors/', {
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
        closeAllModals();
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
        const headers = ['ПІБ СЛУХАЧА', 'E-MAIL', 'ПОСАДА СЛУХАЧА', 'НАПРЯМОК НАВЧАННЯ', 'НОМЕР ТЕЛЕФОНУ'];
        
        // Створюємо дані з прикладом
        const data = [
            headers,
            ['Петро Петренко', 'petrenko@example.com', 'Інженер з охорони праці', '57413, 123456']
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
        window.location.href = `/ingener/students/update/${studentId}/`;
        
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
        
        const studentRow = document.querySelector(`tr[data-student-id="${studentId}"]`) || 
                       document.querySelector(`button[onclick="deleteStudent(${studentId})"]`).closest('tr');
    
        // Отримуємо ім'я та прізвище студента
        const studentName = studentRow ? studentRow.cells[3].textContent.trim() : 'цього слухача';
        console.log(studentName);
        if (deleteModal && deleteStudentId) {
            // Встановлюємо ID студента для видалення
            deleteStudentId.value = studentId;
            if (deleteMessage) {
                deleteMessage.innerHTML = `Ви впевнені, що хочете видалити слухача <strong>${studentName}</strong>?`;
            }
            
            // Показуємо модальне вікно
            deleteModal.style.display = "block";
            document.body.style.overflow = "hidden";
            
            // Налаштовуємо форму для відправки
            const deleteForm = document.getElementById("deleteStudentForm");
            if (deleteForm) {
                deleteForm.action = `/ingener/students/delete/${studentId}/`;
                
                // Додаємо обробник для кнопки видалення
                const finalDeleteButton = document.getElementById('finalDeleteButton');
                if (finalDeleteButton) {
                    // Видаляємо попередні обробники, щоб уникнути дублювання
                    finalDeleteButton.removeEventListener('click', handleDeleteClick);
                    finalDeleteButton.addEventListener('click', handleDeleteClick);
                }
            }
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

    // Функція для надсилання форми редагування
    window.submitEditForm = function() {
        const form = document.getElementById('editStudentForm');
        if (!form) return false;
        
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
        
        // Відправляємо форму звичайним способом (не AJAX)
        form.submit();
        return true;
    }

    // Обробка відправки форми імпорту через AJAX
    const importForm = document.getElementById('importForm');
    if (importForm) {
        importForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            // Показуємо індикатор завантаження в межах модального вікна
            const importModal = document.getElementById('importModal');
            if (importModal) {
                const loadingIndicator = document.createElement('div');
                loadingIndicator.className = 'inline-loading-indicator';
                loadingIndicator.innerHTML = '<div class="spinner"></div><p>Завантаження...</p>';
                loadingIndicator.style.padding = '15px';
                loadingIndicator.style.margin = '10px 0';
                loadingIndicator.style.textAlign = 'center';
                loadingIndicator.style.backgroundColor = '#f8f9fa';
                loadingIndicator.style.borderRadius = '4px';
                
                const modalBody = importModal.querySelector('.modal-body');
                if (modalBody) {
                    // Видаляємо попередній індикатор, якщо він є
                    const existingIndicator = modalBody.querySelector('.inline-loading-indicator');
                    if (existingIndicator) {
                        existingIndicator.remove();
                    }
                    
                    // Видаляємо попередні повідомлення про успіх або помилки
                    const existingSuccessMessage = modalBody.querySelector('.import-success-message');
                    if (existingSuccessMessage) {
                        existingSuccessMessage.remove();
                    }
                    
                    const existingErrorsContainer = modalBody.querySelector('.import-errors');
                    if (existingErrorsContainer) {
                        existingErrorsContainer.style.display = 'none';
                        existingErrorsContainer.innerHTML = '';
                    }
                    
                    // Додаємо новий індикатор
                    modalBody.insertBefore(loadingIndicator, modalBody.firstChild);
                }
            }
            
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
                // Видаляємо індикатор завантаження
                const loadingIndicator = document.querySelector('.inline-loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
                
                // Очищаємо поле вибору файлу
                const fileInput = document.getElementById('excel_file');
                if (fileInput) {
                    fileInput.value = '';
                }
                
                // Перевіряємо, що це відповідь для модального вікна імпорту
                if (data.modal_type === 'import') {
                    const importModal = document.getElementById('importModal');
                    if (importModal) {
                        const modalBody = importModal.querySelector('.modal-body');
                        if (modalBody) {
                            // Видаляємо попередні повідомлення
                            const existingSuccessMessage = modalBody.querySelector('.import-success-message');
                            if (existingSuccessMessage) {
                                existingSuccessMessage.remove();
                            }
                            
                            // Показуємо повідомлення про успіх, якщо немає помилок
                            if (data.success && (!data.errors || data.errors.length === 0)) {
                                const successMessage = `<div class="alert alert-success">
                                    <h3>Імпорт успішно завершено</h3>
                                    <p>${data.message}</p>
                                </div>`;
                                
                                // Створюємо елемент для повідомлення
                                const messageContainer = document.createElement('div');
                                messageContainer.className = 'import-success-message';
                                messageContainer.innerHTML = successMessage;
                                
                                // Додаємо нове повідомлення на початок
                                modalBody.insertBefore(messageContainer, modalBody.firstChild);
                                
                                // Приховуємо блок з помилками, якщо він є
                                const errorsContainer = modalBody.querySelector('.import-errors');
                                if (errorsContainer) {
                                    errorsContainer.style.display = 'none';
                                    errorsContainer.innerHTML = '';
                                }
                                
                                // Оновлюємо список студентів автоматично
                                if (data.refresh_page) {
                                    refreshStudentsTable();
                                }
                            }
                            
                            // Показуємо помилки, якщо вони є
                            if (data.errors && data.errors.length > 0) {
                                displayImportErrors(data.errors);
                                
                                // Якщо є часткові успіхи, показуємо і їх
                                if (data.success && data.imported > 0) {
                                    const partialSuccessMessage = `<div class="alert alert-warning">
                                        <h3>Частковий успіх імпорту</h3>
                                        <p>${data.message}</p>
                                    </div>`;
                                    
                                    const messageContainer = document.createElement('div');
                                    messageContainer.className = 'import-success-message';
                                    messageContainer.innerHTML = partialSuccessMessage;
                                    
                                    // Додаємо повідомлення про частковий успіх після блоку з помилками
                                    const errorsContainer = modalBody.querySelector('.import-errors');
                                    if (errorsContainer) {
                                        errorsContainer.insertAdjacentElement('afterend', messageContainer);
                                    } else {
                                        modalBody.insertBefore(messageContainer, modalBody.firstChild);
                                    }
                                    
                                    // Оновлюємо список студентів автоматично
                                    if (data.refresh_page) {
                                        refreshStudentsTable();
                                    }
                                }
                            }
                        }
                        
                        // Залишаємо модальне вікно відкритим
                        importModal.style.display = 'block';
                    }
                }
            })
                                            .catch(error => {
            console.error('Помилка при імпорті:', error);
            
            // Видаляємо індикатор завантаження
            const loadingIndicator = document.querySelector('.inline-loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            
            // Показуємо повідомлення про помилку
            displayImportErrors(['Сталася помилка при імпорті. Спробуйте ще раз.']);
            
            // Залишаємо модальне вікно відкритим
            const importModal = document.getElementById('importModal');
            if (importModal) {
                importModal.style.display = 'block';
            }
        });
        });
    }

    // Оновлена функція для отримання CSRF токену
    function getCSRFToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    }

    // Перевіряємо чи потрібно показати модальне вікно з обліковими даними для РЕДАГУВАННЯ
    if ((typeof show_edit_credentials !== 'undefined' && show_edit_credentials) || 
        (typeof generated_password !== 'undefined' && generated_password)) {
        const editModal = document.getElementById('editStudentModal');
        if (editModal) {
            editModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Додаємо обробник для закриття модального вікна
            const closeButton = editModal.querySelector('.close');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    editModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    window.location.href = '/ingener/index/';
                });
            }
            
            // Додаємо обробник для кнопки "Закрити"
            const closeBtn = editModal.querySelector('.add-btn.green-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    editModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    window.location.href = '/ingener/index/';
                });
            }
        }
    }

    // Також додамо обробник для кнопки "Закрити" в модальному вікні успішної реєстрації
    const successModal = document.querySelector('.modal-content:has(.alert-success)');
    if (successModal) {
        const closeBtn = successModal.querySelector('.add-btn.green-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                window.location.href = '/ingener/index/';
            });
        }
        
        const closeX = successModal.querySelector('.close');
        if (closeX) {
            closeX.addEventListener('click', function() {
                window.location.href = '/ingener/index/';
            });
        }
    }

    // Функція для закриття модального вікна та перезавантаження сторінки
    window.closeAndRefresh = function() {
        closeAllModals();
        window.location.href = '/ingener/index/';
    }

    // Функція для валідації форми та відправки з курсами
    window.validateAndSubmitForm = function(formId) {
        console.log("validateAndSubmitForm called for:", formId);
        const form = document.getElementById(formId);
        if (!form) {
            console.error("Form not found:", formId);
            return false;
        }
        
        // Очищаємо всі попередні повідомлення про помилки
        const errorMessages = form.querySelectorAll('.inline-error');
        errorMessages.forEach(msg => msg.remove());
        
        // Валідація обов'язкових полів
        const requiredFields = ['first_name', 'last_name', 'email', 'position', 'phone_number'];
        let hasErrors = false;
        let firstErrorField = null;
        
        // Перевіряємо кожне поле
        requiredFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;
            
            // Видаляємо попередні стилі помилок
            field.classList.remove('is-invalid');
            
            // Перевіряємо чи поле заповнене
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                
                // Створюємо повідомлення про помилку
                const errorSpan = document.createElement('span');
                errorSpan.className = 'error-message inline-error';
                errorSpan.textContent = "Це поле обов'язкове";
                
                // Додаємо після поля
                field.parentNode.insertBefore(errorSpan, field.nextSibling);
                
                hasErrors = true;
                if (!firstErrorField) firstErrorField = field;
            }
        });
        
        // Додаткова валідація email
        const emailField = form.querySelector('input[name="email"]');
        if (emailField && emailField.value.trim()) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailField.value.trim())) {
                emailField.classList.add('is-invalid');
                
                const errorSpan = document.createElement('span');
                errorSpan.className = 'error-message inline-error';
                errorSpan.textContent = "Введіть коректний email";
                
                emailField.parentNode.insertBefore(errorSpan, emailField.nextSibling);
                
                hasErrors = true;
                if (!firstErrorField) firstErrorField = emailField;
            }
        }
        
        // Додаткова валідація телефону
        const phoneField = form.querySelector('input[name="phone_number"]');
        if (phoneField && phoneField.value.trim()) {
            const phoneRegex = /^(380|0)\d{9}$/;
            if (!phoneRegex.test(phoneField.value.trim().replace(/\s+/g, ''))) {
                phoneField.classList.add('is-invalid');
                
                const errorSpan = document.createElement('span');
                errorSpan.className = 'error-message inline-error';
                errorSpan.textContent = "Введіть номер телефону у форматі 380XXXXXXXXX або 0XXXXXXXXX";
                
                phoneField.parentNode.insertBefore(errorSpan, phoneField.nextSibling);
                
                hasErrors = true;
                if (!firstErrorField) firstErrorField = phoneField;
            }
        }
        
        // Валідація курсів
        const courseSelects = form.querySelectorAll('.course-select');
        let hasCourses = false;
        
        courseSelects.forEach(select => {
            // Видаляємо попередні стилі помилок
            select.classList.remove('is-invalid');
            
            // Перевіряємо, чи вибрано курс
            if (select.value) {
                hasCourses = true;
            } else {
                select.classList.add('is-invalid');
                
                // Створюємо повідомлення про помилку
                const errorSpan = document.createElement('span');
                errorSpan.className = 'error-message inline-error';
                errorSpan.textContent = "Оберіть курс";
                
                // Додаємо після поля
                select.parentNode.insertBefore(errorSpan, select.nextSibling);
                
                hasErrors = true;
                if (!firstErrorField) firstErrorField = select;
            }
        });
        
        // Перевіряємо загальні помилки
        if (!hasCourses) {
            // Використовуємо модальне вікно для повідомлення
            showNotificationModal('Помилка', 'Будь ласка, оберіть хоча б один курс', 'error');
            return false;
        }
        
        // Якщо є помилки, фокусуємося на першому полі з помилкою і перериваємо відправку
        if (hasErrors) {
            if (firstErrorField) {
                firstErrorField.focus();
            }
            return false;
        }
        
        // Показуємо індикатор очікування
        const submitButton = document.getElementById('saveAddStudent');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Зберігаємо...';
        }
        
        // Збираємо дані форми
        const formData = new FormData(form);
        
        // Додаємо прапорець, що це AJAX-запит
        formData.append('is_ajax', 'true');
        
        console.log("Submitting form with AJAX to:", form.action);
        
        // Створюємо індикатор завантаження в межах модального вікна
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'inline-loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><p>Зберігаємо дані...</p>';
        loadingIndicator.style.padding = '15px';
        loadingIndicator.style.margin = '10px 0';
        loadingIndicator.style.textAlign = 'center';
        loadingIndicator.style.backgroundColor = '#f8f9fa';
        loadingIndicator.style.borderRadius = '4px';
        
        // Додаємо стилі для спінера
        const spinnerStyle = document.createElement('style');
        spinnerStyle.textContent = `
            .inline-loading-indicator .spinner {
                width: 30px;
                height: 30px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                margin: 0 auto 10px;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinnerStyle);
        
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
                console.log("Form submitted successfully, generating success UI");
                
                
                // Отримуємо модальне вікно, де знаходиться форма
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
        const searchStudent = document.getElementById('searchStudent').value;
        
        // Будуємо URL для отримання оновленої таблиці
        let url = '/ingener/index/?ajax=1';
        if (searchStudent) {
            url += `&search_student=${encodeURIComponent(searchStudent)}`;
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
        closeAllModals();
        
        // Оновлюємо таблицю слухачів
        refreshStudentsTable();
    }

    // Функція для закриття модального вікна імпорту
    function closeImportModal() {
        const importModal = document.getElementById('importModal');
        if (importModal) {
            importModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        // Очищаємо помилки імпорту при закритті модального вікна
        clearImportErrors();
    }

    // Робимо функції глобально доступними
    window.refreshStudentsTable = refreshStudentsTable;
    window.closeAndRefresh = closeAndRefresh;
    window.closeImportModal = closeImportModal;
});


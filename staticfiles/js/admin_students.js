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
        const companySearch = document.getElementById('searchCompany').value;
        
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
        const searchStudent = document.getElementById('searchStudent').value;
        const searchCompany = document.getElementById('searchCompany').value;
        
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
        const importModal = document.getElementById('importModal');
        if (importModal) {
            importModal.style.display = 'block';
            checkAndDisplayImportErrors();
        }
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
       
        
        // Встановлюємо HTML і показуємо блок
        errorContainer.innerHTML = errorsHtml;
        errorContainer.style.display = 'block';
        console.log(errorsHtml);
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

   // Функція для генерації шаблону Excel
   window.generateTemplate = function() {
        // Використовуємо бібліотеку SheetJS для створення Excel файлу
        const workbook = XLSX.utils.book_new();
        
        // Створюємо заголовки
        const headers = ['НАЗВА КОМПАНІЇ', 'ПІБ СЛУХАЧА', 'E-MAIL', 'ПОСАДА СЛУХАЧА', 'НАПРЯМОК НАВЧАННЯ'];
        
        // Створюємо дані з прикладом
        const data = [
            headers,
            ['АТ Приклад', 'Петро Петренко', 'petrenko@example.com', 'Інженер з охорони праці', '57413, 123456']
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
        
        if (!deleteModal || !deleteStudentId || !deleteMessage) return;
        
        const studentRow = document.querySelector(`tr[data-student-id="${studentId}"]`) || 
                       document.querySelector(`button[onclick="deleteStudent(${studentId})"]`)?.closest('tr');

        if (!studentRow) return;

        const studentName = studentRow.cells[3]?.textContent?.trim() || 'цього слухача';
        
        // Використовуємо textContent замість innerHTML
        deleteStudentId.value = studentId;
        deleteMessage.textContent = 'Ви впевнені, що хочете видалити слухача ';
        const strong = document.createElement('strong');
        strong.textContent = studentName;
        deleteMessage.appendChild(strong);
        deleteMessage.appendChild(document.createTextNode('?'));
        
        deleteModal.style.display = "block";
        document.body.style.overflow = "hidden";
        
        const deleteForm = document.getElementById("deleteStudentForm");
        if (deleteForm) {
            deleteForm.action = `/students/delete/${studentId}/`;
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
        
        const newCourseForm = document.createElement('div');
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
        
        coursesContainer.appendChild(newCourseForm);
        initRemoveCourseHandlers();
    }
    
    // Генеруємо HTML опцій для курсів
    function generateCoursesOptions() {
        try {
            if (typeof window.availableCourses === 'undefined') {
                console.error('availableCourses не визначено');
                return '';
            }
            
            return (window.availableCourses || []).map(course => {
                const id = course?.id || '';
                const code = course?.code || '';
                const name = course?.name || '';
                return `<option value="${id}">${code} - ${name}</option>`;
            }).join('');
        } catch (error) {
            console.error('Помилка при генерації опцій курсів:', error);
            return '';
        }
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
    
    // Функція для збору і відправки форми з курсами
    window.submitFormWithCourses = function(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        // Перевіряємо, чи вибрана компанія
        const companySelect = form.querySelector('select[name="company_name"]');
        if (companySelect && !companySelect.value) {
            return false;
        }
        
        // Збираємо всі вибрані курси
        const courseSelects = form.querySelectorAll('.course-select');
        let hasCourses = false;
        
        courseSelects.forEach(select => {
            if (select.value) {
                hasCourses = true;
            }
        });
        
        // Перевіряємо, чи є хоча б один курс
        if (!hasCourses) {
            return false;
        }
        
        // Відправляємо форму і дозволяємо браузеру здійснити перенаправлення
        return true;
    }
    
    // Запускаємо налаштування обробників при завантаженні сторінки
    setupCourseHandlers();

    // Перевіряємо чи потрібно показати модальне вікно з обліковими даними
    if (typeof showCredentials !== 'undefined' && showCredentials) {
        const passwordModal = document.getElementById('passwordModal');
        if (passwordModal) {
            passwordModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
        
        // Закриваємо модальне вікно додавання, якщо воно відкрите
        const addModal = document.getElementById('addStudentModal');
        if (addModal) {
            addModal.style.display = 'none';
        }
    }

    // Оновлюємо обробник форми імпорту
    if (importForm) {
        importForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div><p>Завантаження...</p>';
            document.body.appendChild(loadingIndicator);
            
            // Очищаємо попередні помилки
            const errorContainer = document.querySelector('.import-errors');
            if (errorContainer) {
                errorContainer.style.display = 'none';
                errorContainer.innerHTML = '';
            }
            
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                document.body.removeChild(loadingIndicator);
                
                if (data.success && !data.errors) {
                    // Успішний імпорт без помилок
                    window.location.reload();
                } else {
                    // Показуємо помилки в модальному вікні
                    let errorContainer = document.querySelector('.import-errors');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.className = 'import-errors';
                        const modalBody = document.querySelector('#importModal .modal-body');
                        if (modalBody) {
                            modalBody.insertBefore(errorContainer, modalBody.firstChild);
                        }
                    }
                    
                    
                    errorsHtml += '</ul>';
                    if (data.imported) {
                        errorsHtml += `<p>Успішно імпортовано: ${data.imported} з ${data.total} слухачів</p>`;
                    }
                    errorsHtml += '<div class="error-actions">';
                    errorsHtml += '<button type="button" class="secondary-btn" onclick="clearImportErrors()">Спробувати ще раз</button>';
                    errorsHtml += '</div>';
                    
                    errorContainer.innerHTML = errorsHtml;
                    errorContainer.style.display = 'block';
                    
                    // Забороняємо закриття модального вікна при кліку на хрестик
                    const closeBtn = document.querySelector('#importModal .close');
                    if (closeBtn) {
                        closeBtn.onclick = function(e) {
                            e.preventDefault();
                            clearImportErrors();
                        };
                    }
                }
            })
            .catch(error => {
                document.body.removeChild(loadingIndicator);
                displayImportErrors(['Помилка при відправці форми: ' + error.message]);
            });
        });
    }

    // Оновлена функція закриття модального вікна
    function closeImportModal() {
        const importModal = document.getElementById('importModal');
        const errorContainer = document.querySelector('.import-errors');
        
        if (importModal) {
            if (!errorContainer || errorContainer.style.display === 'none') {
                importModal.style.display = 'none';
                document.body.classList.remove('modal-open');
                
                // Очищаємо форму
                const importForm = document.getElementById('importForm');
                if (importForm) {
                    importForm.reset();
                }
            }
        }
    }

    // Оновлена функція очищення помилок
    function clearImportErrors() {
        const errorContainer = document.querySelector('.import-errors');
        if (errorContainer) {
            errorContainer.style.display = 'none';
            errorContainer.innerHTML = '';
        }
        
        // Очищаємо форму
        const importForm = document.getElementById('importForm');
        if (importForm) {
            importForm.reset();
        }
    }

    // Автоматично перевіряємо на помилки імпорту при завантаженні сторінки
    checkAndDisplayImportErrors();
    
    // Додаємо валідацію форм
    setupStudentValidation();
});

// Функція для налаштування валідації студентів
function setupStudentValidation() {
    // Налаштовуємо валідацію для форми додавання
    const addForm = document.getElementById('addStudentForm');
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            // Спочатку валідуємо форму
            if (!validateStudentForm(this)) {
                e.preventDefault();
                
                // Фокусуємо на першому полі з помилкою
                const firstErrorField = this.querySelector('.error-field');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
                return false;
            }
        });
    }
    
    // Налаштовуємо валідацію для форми редагування
    const editForm = document.getElementById('editStudentForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            // Спочатку валідуємо форму
            if (!validateStudentForm(this)) {
                e.preventDefault();
                
                // Фокусуємо на першому полі з помилкою
                const firstErrorField = this.querySelector('.error-field');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
                return false;
            }
        });
    }
    
    // Налаштовуємо валідацію в реальному часі
    setupStudentRealTimeValidation();
}

// Функція для валідації форми студента
function validateStudentForm(form) {
    if (!form) return true;
    
    let isValid = true;
    
    // Очищаємо попередні помилки
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        msg.style.display = 'none';
        msg.textContent = '';
    });
    
    const errorFields = form.querySelectorAll('.error-field');
    errorFields.forEach(field => {
        field.classList.remove('error-field');
    });
    
    // Перевіряємо обов'язкові поля студента
    const requiredFields = [
        { name: 'first_name', label: "Ім'я" },
        { name: 'last_name', label: 'Прізвище' },
        { name: 'email', label: 'Email' },
        { name: 'position', label: 'Посада' },
        { name: 'phone_number', label: 'Телефон' },
        { name: 'company_name', label: 'Компанія' }
    ];
    
    requiredFields.forEach(fieldInfo => {
        const field = form.querySelector(`[name="${fieldInfo.name}"]`);
        if (field) {
            const value = field.tagName === 'SELECT' ? field.value : field.value.trim();
            
            if (!value) {
                field.classList.add('error-field');
                showStudentFieldError(field, `${fieldInfo.label} є обов'язковим полем`);
                isValid = false;
            } else {
                // Додаткова валідація для специфічних полів
                if (fieldInfo.name === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        field.classList.add('error-field');
                        showStudentFieldError(field, 'Введіть коректний email');
                        isValid = false;
                    }
                } else if (fieldInfo.name === 'phone_number') {
                    // Валідація українського номера телефону
                    const phoneRegex = /^(380\d{9}|0\d{9})$/;
                    const cleanPhone = value.replace(/[^\d]/g, '');
                    if (!phoneRegex.test(cleanPhone)) {
                        field.classList.add('error-field');
                        showStudentFieldError(field, 'Номер телефону має бути у форматі 380XXXXXXXXX або 0XXXXXXXXX');
                        isValid = false;
                    }
                }
            }
        }
    });
    
    // Перевіряємо, чи вибрано принаймні один курс
    const selectedCourses = form.querySelectorAll('.course-checkbox:checked');
    if (selectedCourses.length === 0) {
        // Знаходимо контейнер курсів для показу помилки
        const coursesContainer = form.querySelector('.courses-container, .selected-courses');
        if (coursesContainer) {
            showStudentFieldError(coursesContainer, 'Оберіть принаймні один курс');
            isValid = false;
        }
    }
    
    return isValid;
}

// Функція для показу помилки поля студента
function showStudentFieldError(field, message) {
    const fieldName = field.getAttribute('name') || 'courses';
    let errorDiv = document.getElementById(`error-${fieldName}`);
    
    if (!errorDiv) {
        // Якщо елемент error div не знайдено, створюємо його
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.id = `error-${fieldName}`;
        
        // Вставляємо після поля або його контейнера
        const container = field.closest('.form-group') || field.parentNode;
        container.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
}

// Функція для налаштування валідації в реальному часі
function setupStudentRealTimeValidation() {
    const forms = [document.getElementById('addStudentForm'), document.getElementById('editStudentForm')];
    
    forms.forEach(form => {
        if (!form) return;
        
        const fields = form.querySelectorAll('input[type="text"], input[type="email"], select');
        
        fields.forEach(field => {
            // Валідація при втраті фокусу
            field.addEventListener('blur', function() {
                validateStudentSingleField(this);
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
        
        // Додаємо обробники для чекбоксів курсів
        const courseCheckboxes = form.querySelectorAll('.course-checkbox');
        courseCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Перевіряємо, чи є вибрані курси
                const selectedCourses = form.querySelectorAll('.course-checkbox:checked');
                const errorDiv = document.getElementById('error-courses');
                if (selectedCourses.length > 0 && errorDiv) {
                    errorDiv.style.display = 'none';
                    errorDiv.textContent = '';
                }
            });
        });
    });
}

// Функція для валідації одного поля студента
function validateStudentSingleField(field) {
    const fieldName = field.getAttribute('name');
    const value = field.tagName === 'SELECT' ? field.value : field.value.trim();
    
    // Видаляємо попередні помилки
    field.classList.remove('error-field');
    const errorDiv = document.getElementById(`error-${fieldName}`);
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    
    // Список обов'язкових полів
    const requiredFields = ['first_name', 'last_name', 'email', 'position', 'phone_number', 'company_name'];
    
    if (requiredFields.includes(fieldName) && !value) {
        field.classList.add('error-field');
        const labels = {
            'first_name': "Ім'я",
            'last_name': 'Прізвище',
            'email': 'Email',
            'position': 'Посада',
            'phone_number': 'Телефон',
            'company_name': 'Компанія'
        };
        showStudentFieldError(field, `${labels[fieldName]} є обов'язковим полем`);
        return;
    }
    
    // Специфічна валідація для різних типів полів
    if (value) {
        switch (fieldName) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    field.classList.add('error-field');
                    showStudentFieldError(field, 'Введіть коректний email');
                }
                break;
                
            case 'phone_number':
                const phoneRegex = /^(380\d{9}|0\d{9})$/;
                const cleanPhone = value.replace(/[^\d]/g, '');
                if (!phoneRegex.test(cleanPhone)) {
                    field.classList.add('error-field');
                    showStudentFieldError(field, 'Номер телефону має бути у форматі 380XXXXXXXXX або 0XXXXXXXXX');
                }
                break;
        }
    }
}


document.addEventListener('DOMContentLoaded', function() {
    // Модальні вікна
    const addModal = document.getElementById("addCourseModal");
    const editModal = document.getElementById("editCourseModal");
    const deleteModal = document.getElementById("deleteCourseModal");
    if (!addModal) return;
    
    // Налаштування модальних вікон
    const closeButtons = document.querySelectorAll(".close");
    const cancelButtons = document.querySelectorAll(".cancel-btn");
    
    // Відкриття модального вікна для додавання
    window.addNewCourse = function() {
        addModal.style.display = "block";
        document.body.style.overflow = "hidden";
    }
    
    // Відкриття модального вікна для редагування
    window.editCourse = function(courseId) {
        // Отримуємо дані курсу з рядка таблиці
        const row = document.querySelector(`tr[data-course-id="${courseId}"]`);
        if (!row) {
            return;
        }
        
        // Перевіряємо, чи існують всі необхідні елементи форми
        const courseIdField = document.getElementById("id_edit_course_id");
        const codeField = document.getElementById("id_edit_code");
        const nameField = document.getElementById("id_edit_course_name");
        const descriptionField = document.getElementById("id_edit_course_description");
        const form = document.getElementById("editCourseForm");
        const totalForms = document.querySelector('[name="course_videos-TOTAL_FORMS"]');
        const initialForms = document.querySelector('[name="course_videos-INITIAL_FORMS"]');
        const videoContainer = document.getElementById('editVideoFormset');
        
        if (!courseIdField || !codeField || !nameField || !descriptionField || !form || !totalForms || !initialForms || !videoContainer) {
            return;
        }
        
        // Заповнюємо форму даними
        courseIdField.value = courseId;
        codeField.value = row.cells[0].textContent.trim();
        nameField.value = row.cells[1].textContent.trim();
        descriptionField.value = row.cells[2].textContent.trim();
        
        // Оновлюємо URL форми з правильним ID курсу
        form.action = form.action.replace(/\/update\/\d+\//, `/update/${courseId}/`);
        
        // Очищаємо існуючі відео
        videoContainer.innerHTML = '';
        
        // Додаємо існуючі відео
        const videoRows = row.cells[3].querySelectorAll('.video-display-row');
        let formCount = 0;
        
        videoRows.forEach((videoRow, index) => {
            const videoUrl = videoRow.querySelector('.video-url').textContent.trim();
            const videoName = videoRow.querySelector('.video-name').textContent.trim();
            const videoId = videoRow.dataset.videoId;
            
            const videoForm = createVideoForm(formCount, videoUrl, videoName, videoId);
            videoContainer.appendChild(videoForm);
            formCount++;
        });
        
        // Встановлюємо кількість форм
        totalForms.value = formCount;
        initialForms.value = formCount;
        
        // Показуємо модальне вікно
        const editModal = document.getElementById("editCourseModal");
        if (editModal) {
            editModal.style.display = "block";
            document.body.style.overflow = "hidden";
            
            // Додаємо обробник для кнопки додавання нового відео
            const addMoreEditVideoBtn = document.getElementById('addMoreEditVideo');
            if (addMoreEditVideoBtn) {
                // Видаляємо попередні обробники, щоб уникнути дублювання
                addMoreEditVideoBtn.replaceWith(addMoreEditVideoBtn.cloneNode(true));
                
                // Додаємо новий обробник
                document.getElementById('addMoreEditVideo').addEventListener('click', function() {
                    addNewVideo('editAdditionalVideos', 'course_videos-TOTAL_FORMS');
                });
            }
        }
    }
    
    // Функція для створення форми відео
    function createVideoForm(index, url = '', name = '', videoId = '') {
        const videoForm = document.createElement('div');
        videoForm.className = 'video-form';
        
        let idField = '';
        if (videoId) {
            idField = `<input type="hidden" name="course_videos-${index}-id" value="${videoId}">`;
        }
        
        videoForm.innerHTML = `
            ${idField}
            <input type="hidden" name="course_videos-${index}-course" value="">
            <div class="video-inputs-row">
                <div class="video-url-field">
                    <input type="text" name="course_videos-${index}-video_url" value="${url}" placeholder="URL відео">
                    <div class="field-error" id="error-video_${index}" style="color: red;"></div>
                </div>
                <div class="video-name-field">
                    <input type="text" name="course_videos-${index}-video_name" value="${name}" placeholder="Назва відео">
                </div>
                <div class="video-action-field">
                    <button type="button" class="remove-video delete-btn">✖</button>
                </div>
            </div>
        `;
        
        // Додаємо обробник для кнопки видалення
        const removeBtn = videoForm.querySelector('.remove-video');
        setupRemoveButton(removeBtn);
        
        return videoForm;
    }
    
    // Закриття модальних вікон
    const closeModal = function(modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
    
    // Додаємо обробники для закриття
    closeButtons.forEach(btn => {
        btn.onclick = function() {
            closeModal(this.closest('.modal'));
        }
    });
    
    cancelButtons.forEach(btn => {
        btn.onclick = function() {
            closeModal(this.closest('.modal'));
        }
    });
    
    // Додаємо окремі обробники для кнопок скасування в кожному модальному вікні
    const cancelAddBtn = document.getElementById('cancelAddCourse');
    if (cancelAddBtn) {
        cancelAddBtn.onclick = function() {
            closeModal(document.getElementById('addCourseModal'));
        }
    }

    // Повністю перевизначаємо обробник для кнопки скасування
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'cancelEditCourse') {
            e.preventDefault();
            e.stopPropagation();
            const editModal = document.getElementById('editCourseModal');
            editModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });
    
    // Закриття при кліку поза модальним вікном
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    }
    
    // Функція для видалення відео
    const setupRemoveButton = function(btn) {
        btn.addEventListener('click', function() {
            const videoForm = this.closest('.video-form');
            
            // Перевіряємо, чи є прихований input з id відео
            const idInput = videoForm.querySelector('input[name*="-id"]');
            if (idInput) {
                // Зберігаємо ID видаленого відео в спеціальному полі
                const deletedVideosInput = document.getElementById('deleted_videos');
                if (deletedVideosInput) {
                    const currentIds = deletedVideosInput.value.split(',').filter(Boolean);
                    currentIds.push(idInput.value);
                    deletedVideosInput.value = currentIds.join(',');
                }
                
                // Приховуємо форму замість видалення
                videoForm.remove();
            } else {
                // Якщо це нове відео, просто видаляємо форму
                videoForm.remove();
                
                // Оновлюємо лічильник форм
                const totalForms = document.querySelector('[name="course_videos-TOTAL_FORMS"]');
                if (totalForms) {
                    totalForms.value = parseInt(totalForms.value) - 1;
                }
            }
        });
    }
    
    // Налаштовуємо існуючі кнопки видалення
    document.querySelectorAll('.remove-video').forEach(btn => {
        setupRemoveButton(btn);
    });
    
    // Додавання нового відео (для форми додавання)
    const addMoreVideoBtn = document.getElementById('addMoreVideo');
    if (addMoreVideoBtn) {
        addMoreVideoBtn.addEventListener('click', function() {
            addNewVideo('additionalVideos', 'course_videos-TOTAL_FORMS');
        });
    }
    
    // Додавання нового відео (для форми редагування)
    const addMoreEditVideoBtn = document.getElementById('addMoreEditVideo');
    if (addMoreEditVideoBtn) {
        addMoreEditVideoBtn.addEventListener('click', function() {
            addNewVideo('editAdditionalVideos', 'course_videos-TOTAL_FORMS');
        });
    }
    
    // Функція для додавання нового відео
    function addNewVideo(containerId, totalFormsName) {
        const container = document.getElementById(containerId);
        const totalForms = document.querySelector(`[name="${totalFormsName}"]`);
        const formCount = parseInt(totalForms.value);
        
        // Створюємо новий блок для відео
        const newVideoForm = document.createElement('div');
        newVideoForm.className = 'video-form';
        
        // Отримуємо ID курсу з прихованого поля для правильного зв'язування
        let courseId = '';
        if (containerId === 'editAdditionalVideos') {
            courseId = document.getElementById('id_edit_course_id').value;
        }
        
        // Шаблон для нового відео
        newVideoForm.innerHTML = `
            <input type="hidden" name="course_videos-${formCount}-course" value="${courseId}">
            <div class="video-inputs-row">
                <div class="video-url-field">
                    <input type="text" name="course_videos-${formCount}-video_url" id="id_course_videos-${formCount}-video_url" placeholder="URL відео">
                    <div class="field-error" id="error-video_${formCount}" style="color: red;"></div>
                </div>
                <div class="video-name-field">
                    <input type="text" name="course_videos-${formCount}-video_name" id="id_course_videos-${formCount}-video_name" placeholder="Назва відео">
                </div>
                <div class="video-action-field">
                    <button type="button" class="remove-video delete-btn">✖</button>
                </div>
            </div>
        `;
        
        // Додаємо новий блок і оновлюємо лічильник
        container.appendChild(newVideoForm);
        totalForms.value = formCount + 1;
        
        // Налаштовуємо кнопку видалення
        setupRemoveButton(newVideoForm.querySelector('.remove-video'));
    }
    
    // Видалення курсу
    window.deleteCourse = function(courseId) {
        // Отримуємо дані курсу з рядка таблиці
        const row = document.querySelector(`tr[data-course-id="${courseId}"]`);
        if (!row) {
            return;
        }
        
        // Отримуємо назву курсу
        const courseName = row.cells[1].textContent.trim();
        
        // Заповнюємо модальне вікно
        const modal = document.getElementById('deleteCourseModal');
        const messageElement = document.getElementById('deleteCourseMessage');
        const courseIdInput = document.getElementById('deleteCourseId');
        
        if (modal && messageElement && courseIdInput) {
            // Встановлюємо ID курсу та повідомлення
            courseIdInput.value = courseId;
            messageElement.innerHTML = `Ви впевнені, що хочете видалити курс <strong>${courseName}</strong>?`;
            
            // Встановлюємо URL для форми
            const form = document.getElementById('deleteCourseForm');
            if (form) {
                form.action = `/courses/delete/${courseId}/`;
            }
            
            // Показуємо модальне вікно
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
        }
    }

    // Обробка відправки форми додавання курсу
    document.getElementById('addCourseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Спочатку валідуємо форму
        if (!validateCourseForm(this)) {
            const firstErrorField = this.querySelector('.error-field');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorField.focus();
            }
            return;
        }
        
        const formData = new FormData(this);
        
        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка сервера: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Закриваємо модальне вікно перед перезавантаженням
                const modal = document.getElementById('addCourseModal');
                if (modal) {
                    modal.style.display = "none";
                }
                // Перезавантажуємо сторінку після успішного збереження
                window.location.reload();
            } else {
                // Відображаємо помилки
                if (data.errors) {
                    // Очищаємо попередні помилки
                    this.querySelectorAll('.error-message').forEach(msg => {
                        msg.style.display = 'none';
                        msg.textContent = '';
                    });
                    this.querySelectorAll('.error-field').forEach(field => {
                        field.classList.remove('error-field');
                    });
                    
                    for (const [field, errors] of Object.entries(data.errors)) {
                        const fieldElement = this.querySelector(`[name="${field}"]`);
                        if (fieldElement) {
                            fieldElement.classList.add('error-field');
                            
                            // Правильно обробляємо помилки
                            let errorMessage = '';
                            if (Array.isArray(errors)) {
                                errorMessage = errors.join(', ');
                            } else if (typeof errors === 'string') {
                                errorMessage = errors;
                            } else {
                                errorMessage = errors.toString();
                            }
                            
                            showCourseFieldError(fieldElement, errorMessage);
                        }
                    }
                }
            }
        })
        .catch(error => {
            alert('Сталася помилка при збереженні: ' + error.message);
        });
    });

    // Перевіряємо, чи вже є обробник для форми редагування
    const editForm = document.getElementById('editCourseForm');
    if (editForm) {
        // Видаляємо всі існуючі обробники
        const clonedForm = editForm.cloneNode(true);
        editForm.parentNode.replaceChild(clonedForm, editForm);
        
        // Додаємо новий обробник
        clonedForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Спочатку валідуємо форму
            if (!validateCourseForm(this)) {
                const firstErrorField = this.querySelector('.error-field');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
                return;
            }
            
            const formData = new FormData(this);
            const courseId = formData.get('course_id');
            
            // Додаємо ID курсу до всіх нових відео
            const totalForms = parseInt(formData.get('course_videos-TOTAL_FORMS'));
            for (let i = 0; i < totalForms; i++) {
                const courseField = formData.get(`course_videos-${i}-course`);
                if (!courseField || courseField === '') {
                    formData.set(`course_videos-${i}-course`, courseId);
                }
            }
            
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value
                },
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Помилка сервера: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Закриваємо модальне вікно перед перезавантаженням
                    const modal = document.getElementById('editCourseModal');
                    if (modal) {
                        modal.style.display = "none";
                    }
                    // Перезавантажуємо сторінку після успішного збереження
                    window.location.reload();
                } else {
                    // Відображаємо помилки
                    if (data.errors) {
                        // Очищаємо попередні помилки
                        this.querySelectorAll('.error-message').forEach(msg => {
                            msg.style.display = 'none';
                            msg.textContent = '';
                        });
                        this.querySelectorAll('.error-field').forEach(field => {
                            field.classList.remove('error-field');
                        });
                        
                        for (const [field, errors] of Object.entries(data.errors)) {
                            const fieldElement = this.querySelector(`[name="${field}"], [name="edit_${field}"]`);
                            if (fieldElement) {
                                fieldElement.classList.add('error-field');
                                
                                // Правильно обробляємо помилки
                                let errorMessage = '';
                                if (Array.isArray(errors)) {
                                    errorMessage = errors.join(', ');
                                } else if (typeof errors === 'string') {
                                    errorMessage = errors;
                                } else {
                                    errorMessage = errors.toString();
                                }
                                
                                showCourseFieldError(fieldElement, errorMessage);
                            }
                        }
                    }
                }
            })
            .catch(error => {
                alert('Сталася помилка при збереженні: ' + error.message);
            });
        });
    }

    // Обробник для кнопки скасування видалення
    const cancelDeleteBtn = document.getElementById('cancelDeleteCourse');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.onclick = function() {
            closeModal(document.getElementById('deleteCourseModal'));
        }
    }
    
    // Обробник для форми видалення
    const deleteForm = document.getElementById('deleteCourseForm');
    if (deleteForm) {
        deleteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const courseId = document.getElementById('deleteCourseId').value;
            
            fetch(this.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value
                },
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Помилка сервера: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Закриваємо модальне вікно перед перезавантаженням
                    closeModal(document.getElementById('deleteCourseModal'));
                    // Перезавантажуємо сторінку після успішного видалення
                    window.location.reload();
                } else {
                    alert('Помилка при видаленні курсу');
                }
            })
            .catch(error => {
                alert('Сталася помилка при видаленні: ' + error.message);
            });
        });
    }

    // Функція для пошуку курсів
    window.searchCourses = function() {
        const searchTerm = document.getElementById('searchCourse').value.trim();
        if (searchTerm) {
            window.location.href = `/courses/?search=${encodeURIComponent(searchTerm)}`;
        } else {
            window.location.href = '/courses/';
        }
    }

    // Додаємо обробник події для поля пошуку
    const searchInput = document.getElementById('searchCourse');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchCourses();
            }
        });
    }

    // Додаємо валідацію форм
    setupCourseValidation();
});

// Функція для налаштування валідації курсів
function setupCourseValidation() {
    // Налаштовуємо валідацію для форми додавання
    const addForm = document.getElementById('addCourseForm');
    if (addForm) {
        addForm.addEventListener('submit', function(event) {
            if (!validateCourseForm(addForm)) {
                event.preventDefault();
                
                // Фокусуємо на першому полі з помилкою
                const firstErrorField = addForm.querySelector('.error-field');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
                return false;
            }
        });
    }
    
    // Налаштовуємо валідацію для форми редагування
    const editForm = document.getElementById('editCourseForm');
    if (editForm) {
        editForm.addEventListener('submit', function(event) {
            if (!validateCourseForm(editForm)) {
                event.preventDefault();
                
                // Фокусуємо на першому полі з помилкою
                const firstErrorField = editForm.querySelector('.error-field');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
                return false;
            }
        });
    }
    
    // Налаштовуємо валідацію в реальному часі
    setupCourseRealTimeValidation();
}

// Функція для валідації форми курсу
function validateCourseForm(form) {
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
    
    // Перевіряємо обов'язкові поля курсу
    const requiredFields = [
        { name: 'code', label: 'Код курсу' },
        { name: 'course_name', label: 'Назва курсу' },
        { name: 'course_description', label: 'Опис курсу' }
    ];
    
    requiredFields.forEach(fieldInfo => {
        const field = form.querySelector(`[name="${fieldInfo.name}"], [name="edit_${fieldInfo.name}"]`);
        if (field) {
            const value = field.value.trim();
            
            if (!value) {
                field.classList.add('error-field');
                showCourseFieldError(field, `${fieldInfo.label} є обов'язковим полем`);
                isValid = false;
            }
        }
    });
    
    // Перевіряємо відео (принаймні одне має бути заповнене)
    const videoUrlFields = form.querySelectorAll('input[name*="video_url"]');
    let hasValidVideo = false;
    
    videoUrlFields.forEach((field, index) => {
        const value = field.value.trim();
        if (value) {
            // Перевіряємо, чи це валідний URL
            if (!isValidURL(value)) {
                field.classList.add('error-field');
                showCourseFieldError(field, 'Введіть коректний URL');
                isValid = false;
            } else {
                hasValidVideo = true;
            }
        }
    });
    
    if (!hasValidVideo && videoUrlFields.length > 0) {
        const firstVideoField = videoUrlFields[0];
        if (firstVideoField) {
            firstVideoField.classList.add('error-field');
            showCourseFieldError(firstVideoField, 'Додайте принаймні одне відео');
            isValid = false;
        }
    }
    
    return isValid;
}

// Функція для показу помилки поля курсу
function showCourseFieldError(field, message) {
    const fieldName = field.getAttribute('name');
    let errorDiv = document.getElementById(`error-${fieldName}`);
    
    if (!errorDiv) {
        // Якщо елемент error div не знайдено, створюємо його
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.id = `error-${fieldName}`;
        
        // Вставляємо після поля або його контейнера
        const container = field.closest('.video-url-field') || field.parentNode;
        container.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
}

// Функція для валідації URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        // Перевіряємо також відносні URL
        const urlPattern = /^(https?:\/\/)|(\/)/;
        return urlPattern.test(string);
    }
}

// Функція для налаштування валідації в реальному часі
function setupCourseRealTimeValidation() {
    const forms = [document.getElementById('addCourseForm'), document.getElementById('editCourseForm')];
    
    forms.forEach(form => {
        if (!form) return;
        
        const fields = form.querySelectorAll('input[type="text"], textarea');
        
        fields.forEach(field => {
            // Валідація при втраті фокусу
            field.addEventListener('blur', function() {
                validateCourseSingleField(this);
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

// Функція для валідації одного поля курсу
function validateCourseSingleField(field) {
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
    const requiredFields = ['code', 'course_name', 'course_description', 'edit_code', 'edit_course_name', 'edit_course_description'];
    
    if (requiredFields.includes(fieldName) && !value) {
        field.classList.add('error-field');
        const labels = {
            'code': 'Код курсу',
            'course_name': 'Назва курсу',
            'course_description': 'Опис курсу',
            'edit_code': 'Код курсу',
            'edit_course_name': 'Назва курсу',
            'edit_course_description': 'Опис курсу'
        };
        showCourseFieldError(field, `${labels[fieldName]} є обов'язковим полем`);
        return;
    }
    
    // Валідація URL відео
    if (fieldName.includes('video_url') && value && !isValidURL(value)) {
        field.classList.add('error-field');
        showCourseFieldError(field, 'Введіть коректний URL');
    }
}

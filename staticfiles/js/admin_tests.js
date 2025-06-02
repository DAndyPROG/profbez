/* ФАЙЛ ОНОВЛЕНО - ВСЯКА ПРОБЛЕМНА ФУНКЦІЯ ВИДАЛЕНА! VERSION 2.0 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded event fired");
    
    // Модальні вікна
    const addModal = document.getElementById("addQuestionModal");
    const editModal = document.getElementById("editQuestionModal");
    const deleteModal = document.getElementById("deleteQuestionModal");
    const importModal = document.getElementById("importExcelModal");
    if (!addModal) return;
    
    // Налаштування модальних вікон
    const closeButtons = document.querySelectorAll(".close");
    const cancelButtons = document.querySelectorAll(".cancel-btn");
    
    // Відкриття модального вікна для додавання
    window.addNewQuestion = function() {
        addModal.style.display = "block";
        document.body.style.overflow = "hidden";
        
        // Очищаємо всі існуючі відповіді
        const additionalAnswers = document.getElementById('additionalAnswers');
        const answerFormset = document.getElementById('answerFormset');
        if (additionalAnswers) additionalAnswers.innerHTML = '';
        if (answerFormset) answerFormset.innerHTML = '';
        
        // Скидаємо значення TOTAL_FORMS до 0
        const totalForms = document.querySelector('[name="answer_formset-TOTAL_FORMS"]');
        if (totalForms) totalForms.value = 0;
        
        // Додаємо першу форму для правильної відповіді
        const correctAnswerForm = createAnswerForm(0, '', true);
        answerFormset.appendChild(correctAnswerForm);
        totalForms.value = 1;
        
        // Очищаємо всі поля помилок
        document.querySelectorAll('.field-error').forEach(el => {
            el.textContent = '';
        });
    }
    
    // Відкриття модального вікна для редагування
    window.editQuestion = function(questionId) {
        // Отримуємо дані запитання з рядка таблиці
        const row = document.querySelector(`tr[data-question-id="${questionId}"]`);
        if (!row) {
            return;
        }
        
        // Перевіряємо, чи існують всі необхідні елементи форми
        const questionIdField = document.getElementById("id_edit_question_id");
        const questionTextField = document.getElementById("id_edit_question_text");
        const courseSelect = document.getElementById("id_edit_course");
        const form = document.getElementById("editQuestionForm");
        const totalForms = document.querySelector('[name="answer_formset-TOTAL_FORMS"]');
        const initialForms = document.querySelector('[name="answer_formset-INITIAL_FORMS"]');
        const answerContainer = document.getElementById('editAnswerFormset');
        const additionalAnswers = document.getElementById('editAdditionalAnswers');
        
        if (!questionIdField || !questionTextField || !form || !totalForms || !initialForms || !answerContainer) {
            return;
        }
        
        // Заповнюємо форму даними
        questionIdField.value = questionId;
        questionTextField.value = row.cells[1].textContent.trim();
        
        // Отримуємо ID курсу з першої колонки таблиці (код курсу)
        const courseCode = row.cells[0].textContent.trim();
        // Знаходимо відповідний курс у випадаючому списку
        if (courseSelect) {
            for (let i = 0; i < courseSelect.options.length; i++) {
                const optionText = courseSelect.options[i].text;
                if (optionText.startsWith(courseCode)) {
                    courseSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Оновлюємо URL форми з правильним ID запитання
        form.action = `/tests/update/${questionId}/`;
        
        // Очищаємо існуючі відповіді
        answerContainer.innerHTML = '';
        if (additionalAnswers) {
            additionalAnswers.innerHTML = '';
        }
        
        // Скидаємо значення полів для видалених відповідей
        const deletedAnswersField = document.getElementById('deleted_answers');
        if (deletedAnswersField) {
            deletedAnswersField.value = '';
        }
        
        // Множина для відстеження вже доданих відповідей (щоб уникнути дублікатів)
        const addedAnswers = new Set();
        
        // Спочатку додаємо правильну відповідь (колонка 2)
        const correctAnswerText = row.cells[2].textContent.trim();
        let formCount = 0;
        
        if (correctAnswerText && correctAnswerText !== '-') {
            addedAnswers.add(correctAnswerText);
            const answerForm = createAnswerForm(formCount, correctAnswerText, true);
            answerContainer.appendChild(answerForm);
            formCount++;
        } else {
            // Якщо немає правильної відповіді, створюємо порожнє поле
            const answerForm = createAnswerForm(formCount, '', true);
            answerContainer.appendChild(answerForm);
            formCount++;
        }
        
        // Тепер додаємо інші відповіді (колонки 3-11)
        for (let i = 3; i < 11; i++) {
            const answerText = row.cells[i].textContent.trim();
            if (answerText && answerText !== '-' && !addedAnswers.has(answerText)) {
                // Додаємо відповідь тільки якщо вона не порожня, не "-" і ще не була додана
                addedAnswers.add(answerText);
                const answerForm = createAnswerForm(formCount, answerText, false);
                answerContainer.appendChild(answerForm);
                formCount++;
            }
        }
        
        // Встановлюємо кількість форм
        totalForms.value = formCount;
        initialForms.value = formCount;
        
        // Показуємо модальне вікно
        editModal.style.display = "block";
        document.body.style.overflow = "hidden";
        
        // Додаємо обробник для кнопки додавання нової відповіді
        const addMoreEditAnswerBtn = document.getElementById('addMoreEditAnswer');
        if (addMoreEditAnswerBtn) {
            // Видаляємо попередні обробники, щоб уникнути дублювання
            addMoreEditAnswerBtn.replaceWith(addMoreEditAnswerBtn.cloneNode(true));
            
            // Додаємо новий обробник
            document.getElementById('addMoreEditAnswer').addEventListener('click', function() {
                addNewAnswer('editAdditionalAnswers', 'answer_formset-TOTAL_FORMS');
            });
        }
    }
    
    // Функція для створення форми відповіді
    function createAnswerForm(index, text = '', isCorrect = false, answerId = '') {
        const answerForm = document.createElement('div');
        answerForm.className = 'answer-form';
        
        let idField = '';
        if (answerId) {
            idField = `<input type="hidden" name="answer_formset-${index}-id" value="${answerId}">`;
        }
        
        // Визначаємо мітку залежно від індексу
        const label = index === 0 ? 'Правильна відповідь' : 'Неправильна відповідь';
        
        // Додаємо приховане поле для статусу правильності відповіді (перша = правильна, інші = неправильні)
        const isCorrectValue = index === 0 ? 'true' : 'false';
        
        answerForm.innerHTML = `
            ${idField}
            <input type="hidden" name="answer_formset-${index}-question" value="">
            <input type="hidden" name="answer_formset-${index}-is_correct" value="${isCorrectValue}">
            <div class="answer-inputs-row">
                <div class="answer-text-field">
                    <label class="answer-label">${label}</label>
                    <input type="text" name="answer_formset-${index}-answer_text" value="${text}" placeholder="${label}" required>
                    <div class="field-error" id="error-answer_${index}" style="color: red;"></div>
                </div>
                ${index !== 0 ? `<button type="button" class="remove-answer delete-btn" data-index="${index}" style="margin-top: 24px;">✖</button>` : ''}
            </div>
        `;
        
        // Додаємо обробник для кнопки видалення
        if (index !== 0) {
            const removeBtn = answerForm.querySelector('.remove-answer');
            setupRemoveButton(removeBtn);
        }
        
        return answerForm;
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
    const cancelAddBtn = document.getElementById('cancelAddQuestion');
    if (cancelAddBtn) {
        cancelAddBtn.onclick = function() {
            closeModal(document.getElementById('addQuestionModal'));
        }
    }

    // Повністю перевизначаємо обробник для кнопки скасування
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'cancelEditQuestion') {
            e.preventDefault();
            e.stopPropagation();
            closeModal(document.getElementById('editQuestionModal'));
        }
    });
    
    // Закриття при кліку поза модальним вікном
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    }
    
    // Функція для видалення відповіді
    const setupRemoveButton = function(btn) {
        btn.addEventListener('click', function() {
            const answerForm = this.closest('.answer-form');
            
            // Перевіряємо, чи є прихований input з id відповіді
            const idInput = answerForm.querySelector('input[name*="-id"]');
            if (idInput) {
                // Зберігаємо ID видаленої відповіді в спеціальному полі
                const deletedAnswersInput = document.getElementById('deleted_answers');
                if (deletedAnswersInput) {
                    const currentIds = deletedAnswersInput.value.split(',').filter(Boolean);
                    currentIds.push(idInput.value);
                    deletedAnswersInput.value = currentIds.join(',');
                }
            }
            
            // Видаляємо форму
            answerForm.remove();
            
            // Оновлюємо лічильник форм і перенумеруємо відповіді
            updateFormCount();
        });
    }
    
    // Налаштовуємо існуючі кнопки видалення
    document.querySelectorAll('.remove-answer').forEach(btn => {
        setupRemoveButton(btn);
    });
    
    // Додавання нової відповіді (для форми додавання)
    const addMoreAnswerBtn = document.getElementById('addMoreAnswer');
    if (addMoreAnswerBtn) {
        addMoreAnswerBtn.addEventListener('click', function() {
            addNewAnswer('additionalAnswers', 'answer_formset-TOTAL_FORMS');
        });
    }
    
    // Функція для додавання нової відповіді
    function addNewAnswer(containerId, totalFormsName) {
        const container = document.getElementById(containerId);
        const totalForms = document.querySelector(`[name="${totalFormsName}"]`);
        const formCount = parseInt(totalForms.value);
        
        // Створюємо новий блок для відповіді (завжди неправильна)
        const newAnswerForm = document.createElement('div');
        newAnswerForm.className = 'answer-form';
        
        // Отримуємо ID запитання з прихованого поля для правильного зв'язування
        let questionId = '';
        if (containerId === 'editAdditionalAnswers') {
            questionId = document.getElementById('id_edit_question_id').value;
        }
        
        // Шаблон для нової відповіді (завжди неправильна)
        newAnswerForm.innerHTML = `
            <input type="hidden" name="answer_formset-${formCount}-question" value="${questionId}">
            <input type="hidden" name="answer_formset-${formCount}-is_correct" value="false">
            <div class="answer-inputs-row">
                <div class="answer-text-field">
                    <label class="answer-label">Неправильна відповідь</label>
                    <input type="text" name="answer_formset-${formCount}-answer_text" id="id_answer_formset-${formCount}-answer_text" placeholder="Неправильна відповідь" required>
                    <div class="field-error" id="error-answer_${formCount}" style="color: red;"></div>
                </div>
                <button type="button" class="remove-answer delete-btn" data-index="${formCount}" style="margin-top: 24px;">✖</button>
            </div>
        `;
        
        // Додаємо новий блок і оновлюємо лічильник
        container.appendChild(newAnswerForm);
        totalForms.value = formCount + 1;
        
        // Налаштовуємо кнопку видалення
        setupRemoveButton(newAnswerForm.querySelector('.remove-answer'));
    }
    
    // Функція для оновлення лічильника форм
    function updateFormCount() {
        const totalForms = document.querySelector('[name="answer_formset-TOTAL_FORMS"]');
        if (totalForms) {
            // Підраховуємо кількість актуальних форм відповідей
            const answerForms = document.querySelectorAll('.answer-form');
            totalForms.value = answerForms.length;
            
            // Перенумеруємо форми, щоб не було пропусків в індексації
            answerForms.forEach((form, index) => {
                // Оновлюємо всі індекси в імені полів
                const inputs = form.querySelectorAll('input');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    if (name) {
                        // Формат імен: answer_formset-{index}-{field_name}
                        const parts = name.split('-');
                        if (parts.length >= 3) {
                            const newName = `answer_formset-${index}-${parts[2]}`;
                            input.setAttribute('name', newName);
                        }
                    }
                });
                
                // Оновлюємо статус правильності відповіді
                const isCorrectInput = form.querySelector('input[name*="-is_correct"]');
                if (isCorrectInput) {
                    isCorrectInput.value = index === 0 ? 'true' : 'false';
                }
                
                // Оновлюємо data-index в кнопці видалення
                const removeBtn = form.querySelector('.remove-answer');
                if (removeBtn) {
                    removeBtn.setAttribute('data-index', index);
                }
                
                // Оновлюємо мітку залежно від індексу
                const label = form.querySelector('.answer-label');
                if (label) {
                    label.textContent = index === 0 ? 'Правильна відповідь' : 'Неправильна відповідь';
                }
            });
        }
    }
    
    // Відкриття модального вікна для видалення запитання
    window.deleteQuestion = function(questionId) {
        // Отримуємо дані запитання з рядка таблиці
        const row = document.querySelector(`tr[data-question-id="${questionId}"]`);
        if (!row) {
            return;
        }
        
        // Отримуємо текст запитання
        const questionText = row.cells[1].textContent.trim();
        
        // Заповнюємо модальне вікно
        const modal = document.getElementById('deleteQuestionModal');
        const messageElement = document.getElementById('deleteQuestionMessage');
        const questionIdInput = document.getElementById('deleteQuestionId');
        
        if (modal && messageElement && questionIdInput) {
            // Встановлюємо ID запитання та повідомлення
            questionIdInput.value = questionId;
            messageElement.innerHTML = `Ви впевнені, що хочете видалити запитання <strong>${questionText}</strong>?`;
            
            // Показуємо модальне вікно
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
        }
    }

    // Обробка відправки форми додавання запитання
    const addQuestionForm = document.getElementById('addQuestionForm');
    if (addQuestionForm) {
        addQuestionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Перед відправкою форми оновлюємо індекси всіх полів
            // Знаходимо всі поля відповідей у цій формі
            const answerForms = document.querySelectorAll('#additionalAnswers .answer-form, #answerFormset .answer-form');
            
            // Оновлюємо індексацію полів
            const totalFormsField = this.querySelector('[name="answer_formset-TOTAL_FORMS"]');
            if (totalFormsField) {
                totalFormsField.value = answerForms.length;
                
                // Перенумеруємо всі поля
                answerForms.forEach((form, index) => {
                    const inputs = form.querySelectorAll('input');
                    inputs.forEach(input => {
                        const name = input.getAttribute('name');
                        if (name && name.includes('answer_formset-')) {
                            const parts = name.split('-');
                            if (parts.length >= 3) {
                                input.setAttribute('name', `answer_formset-${index}-${parts[2]}`);
                            }
                        }
                    });
                    
                    // Оновлюємо статус правильності відповіді
                    const isCorrectInput = form.querySelector('input[name*="-is_correct"]');
                    if (isCorrectInput) {
                        isCorrectInput.value = index === 0 ? 'true' : 'false';
                    }
                });
            }
            
            // Перевірка на наявність хоча б однієї відповіді
            if (answerForms.length === 0) {
                alert('Додайте хоча б одну відповідь');
                return;
            }
            
            // Перевірка на наявність правильної відповіді
            const firstAnswerInput = this.querySelector('input[name="answer_formset-0-answer_text"]');
            if (!firstAnswerInput || !firstAnswerInput.value.trim()) {
                alert('Заповніть текст правильної відповіді');
                return;
            }
            
            // Перевірка на заповненість всіх полів відповідей
            let allAnswersFilled = true;
            this.querySelectorAll('input[name*="-answer_text"]').forEach(input => {
                if (!input.value.trim()) {
                    allAnswersFilled = false;
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            });
            
            if (!allAnswersFilled) {
                alert('Заповніть текст всіх відповідей');
                return;
            }
            
            const formData = new FormData(this);
            
            // Використовуємо повний URL
            const url = window.location.origin + '/tests/create/';
            console.log('Sending create request to URL:', url);
            
            fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value
                },
                credentials: 'same-origin'
            })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error('Помилка сервера: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                if (data.success) {
                    // Закриваємо модальне вікно перед перезавантаженням
                    closeModal(document.getElementById('addQuestionModal'));
                    // Перезавантажуємо сторінку після успішного збереження
                    window.location.reload();
                } else {
                    // Відображаємо помилки
                    if (data.errors) {
                        for (const [field, errors] of Object.entries(data.errors)) {
                            const errorElement = document.getElementById(`error-${field}`);
                            if (errorElement) {
                                // Перевіряємо, чи errors є масивом
                                if (Array.isArray(errors)) {
                                    errorElement.textContent = errors.join(', ');
                                } else {
                                    // Якщо не масив, просто виводимо як текст
                                    errorElement.textContent = errors.toString();
                                }
                            }
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error during create:', error);
                alert('Сталася помилка при збереженні: ' + error.message);
            });
        });
    }

    // Обробка відправки форми редагування запитання
    const editQuestionForm = document.getElementById('editQuestionForm');
    if (editQuestionForm) {
        editQuestionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Перед відправкою форми оновлюємо індекси всіх полів
            updateFormCount();
            
            // Перевірка правильної відповіді - уточнюємо селектор, щоб вибирати лише в поточній формі
            const firstAnswerInput = this.querySelector('#editAnswerFormset input[name*="-answer_text"]');
            if (!firstAnswerInput || !firstAnswerInput.value.trim()) {
                alert('Заповніть текст правильної відповіді');
                return;
            }
            
            // Перевірка на заповненість всіх полів відповідей
            let allAnswersFilled = true;
            this.querySelectorAll('input[name*="-answer_text"]').forEach(input => {
                if (!input.value.trim()) {
                    allAnswersFilled = false;
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            });
            
            if (!allAnswersFilled) {
                alert('Заповніть текст всіх відповідей');
                return;
            }
            
            const formData = new FormData(this);
            const questionId = formData.get('question_id');
            
            // Встановлюємо правильний повний URL
            const url = window.location.origin + `/tests/update/${questionId}/`;
            console.log('Sending update request to URL:', url);
            
            // Додаємо ID запитання до всіх нових відповідей
            const totalForms = parseInt(formData.get('answer_formset-TOTAL_FORMS'));
            for (let i = 0; i < totalForms; i++) {
                const questionField = formData.get(`answer_formset-${i}-question`);
                if (!questionField || questionField === '') {
                    formData.set(`answer_formset-${i}-question`, questionId);
                }
            }
            
            fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value
                },
                credentials: 'same-origin'
            })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error('Помилка сервера: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                if (data.success) {
                    // Закриваємо модальне вікно перед перезавантаженням
                    closeModal(document.getElementById('editQuestionModal'));
                    // Перезавантажуємо сторінку після успішного збереження
                    window.location.reload();
                } else {
                    // Відображаємо помилки
                    if (data.errors) {
                        for (const [field, errors] of Object.entries(data.errors)) {
                            const errorElement = document.getElementById(`error-edit-${field}`);
                            if (errorElement) {
                                // Перевіряємо, чи errors є масивом
                                if (Array.isArray(errors)) {
                                    errorElement.textContent = errors.join(', ');
                                } else {
                                    // Якщо не масив, просто виводимо як текст
                                    errorElement.textContent = errors.toString();
                                }
                            }
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error during update:', error);
                alert('Сталася помилка при збереженні: ' + error.message);
            });
        });
    }
    
    // Обробник для форми видалення
    const deleteQuestionForm = document.getElementById('deleteQuestionForm');
    if (deleteQuestionForm) {
        deleteQuestionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const questionId = document.getElementById('deleteQuestionId').value;
            if (!questionId) {
                alert('ID питання не знайдено');
                return;
            }
            
            // Use the alternative delete endpoint which accepts POST data
            const url = window.location.origin + '/tests/delete_alt/';
            
            console.log('Attempting to delete question ID:', questionId);
            console.log('Using alt delete URL:', url);
            
            // Prepare the form data
            const formData = new FormData();
            formData.append('question_id', questionId);
            formData.append('csrfmiddlewaretoken', this.querySelector('[name=csrfmiddlewaretoken]').value);
            
            // Send the delete request
            fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            })
            .then(response => {
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    throw new Error('Помилка сервера: ' + response.status);
                }
                
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                if (data.success) {
                    // Закриваємо модальне вікно перед перезавантаженням
                    closeModal(document.getElementById('deleteQuestionModal'));
                    // Перезавантажуємо сторінку після успішного видалення
                    window.location.reload();
                } else {
                    alert('Помилка при видаленні запитання');
                }
            })
            .catch(error => {
                console.error('Error during delete:', error);
                alert('Сталася помилка при видаленні: ' + error.message);
            });
        });
    }
    
    // Функція для пошуку питань
    window.searchQuestions = function() {
        const searchTerm = document.getElementById('searchQuestion').value.trim();
        if (searchTerm) {
            window.location.href = `/tests/?search=${encodeURIComponent(searchTerm)}`;
        } else {
            window.location.href = '/tests/';
        }
    }

    // Додаємо обробник події для поля пошуку
    const searchInput = document.getElementById('searchQuestion');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchQuestions();
            }
        });
    }

    // Відкриття модального вікна для імпорту з Excel
    window.importExcel = function() {
        console.log("importExcel function called");
        const importModal = document.getElementById("importExcelModal");
        console.log("importModal:", importModal);
        if (importModal) {
            importModal.style.display = "block";
            document.body.style.overflow = "hidden";
            
            // Очищаємо контейнер помилок
            const errorContainer = importModal.querySelector('.import-errors-container');
            const errorList = importModal.querySelector('.error-list');
            if (errorContainer) errorContainer.style.display = 'none';
            if (errorList) errorList.innerHTML = '';
        } else {
            console.error("importModal element not found!");
        }
    }

    // Кнопка завантаження шаблону
    const downloadTemplateBtn = document.getElementById('downloadTemplate');
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', function() {
            generateTemplate();
        });
    }
    
    // Кнопка скасування імпорту
    const cancelImportBtn = document.getElementById('cancelImport');
    if (cancelImportBtn) {
        cancelImportBtn.addEventListener('click', function() {
            const importModal = document.getElementById("importExcelModal");
            if (importModal) {
                importModal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        });
    }
    
    // Обробка відправки форми імпорту
    const importForm = document.getElementById('importTestsForm');
    if (importForm) {
        importForm.addEventListener('submit', function(e) {
            // Валідація форми
            const courseId = document.getElementById('course_for_import').value;
            const fileInput = document.getElementById('excel_file');
            
            if (!courseId) {
                alert('Оберіть курс для імпорту запитань');
                e.preventDefault();
                return false;
            }
            
            if (!fileInput.files || fileInput.files.length === 0) {
                alert('Виберіть файл для імпорту');
                e.preventDefault();
                return false;
            }
            
            // Дозволяємо формі відправитися звичайним способом
        });
    }

    // Функція для генерації шаблону Excel
    function generateTemplate() {
        // Створюємо заголовки для шаблону
        const headers = ['ЗАПИТАННЯ', 'ПРАВИЛЬНА ВІДПОВІДЬ', 'ВІДПОВІДЬ 1', 'ВІДПОВІДЬ 2', 'ВІДПОВІДЬ 3', 'ВІДПОВІДЬ 4', 'ВІДПОВІДЬ 5', 'ВІДПОВІДЬ 6', 'ВІДПОВІДЬ 7', 'ВІДПОВІДЬ 8'];
        
        // Створюємо CSV-рядок з заголовками і одним прикладом рядка
        let csvContent = headers.join(',') + '\n';
        csvContent += 'Хто вбив Кеннеді?,Лі Гарві Освальд,Масяня,Кені,Боснієць,Боснієць2,,,,,';
        
        // Кодуємо CSV для завантаження
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        
        // Створюємо тимчасове посилання для завантаження
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'шаблон_імпорту_запитань.csv');
        document.body.appendChild(link);
        
        // Клікаємо на посилання для початку завантаження
        link.click();
        
        // Видаляємо тимчасове посилання
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        }, 100);
    }

    // Функція для відображення помилок імпорту
    function showImportErrors(errors) {
        const importModal = document.getElementById("importExcelModal");
        if (!importModal) return;
        
        const errorContainer = importModal.querySelector('.import-errors-container');
        const errorList = importModal.querySelector('.error-list');
        
        if (!errorContainer || !errorList) return;
        
        // Очищаємо список помилок
        errorList.innerHTML = '';
        
        // Додаємо кожну помилку до списку
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorList.appendChild(li);
        });
        
        // Показуємо контейнер помилок
        errorContainer.style.display = 'block';
    }
});

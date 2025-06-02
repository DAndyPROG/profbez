from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.forms import SetPasswordForm
from django.contrib.auth import update_session_auth_hash
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib import messages
import openpyxl
from student_op_app.models import StudentInfo, Education
from ingener_op_app.models import IngenerInfo
from student_op_app.forms import StudentEducationForm
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db.models import Q, Count
from admin_app.models import CustomUser, Course
import pandas as pd
import random
import string
from core.settings import STUDENT_PASSWORD


@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def set_new_password(request):
    if request.method == 'POST':
        form = SetPasswordForm(user=request.user, data=request.POST)
        if form.is_valid():
            form.save()
            update_session_auth_hash(request, form.user)  # щоб користувача не викинуло з сесії
            messages.success(request, 'Пароль успішно змінено!')
            return redirect('ingener_index')
        else:
            # При помилці повертаємо до індексу з помилками та відкритим модальним вікном
            try:
                ingener_info = IngenerInfo.objects.get(user=request.user)
                students = StudentInfo.objects.filter(ingener=ingener_info)
                all_courses = Course.objects.all()
                # Позначаємо курси, які використовуються
                student_education = Education.objects.filter(student__ingener=ingener_info).select_related('course')
                used_course_ids = student_education.values_list('course__id', flat=True).distinct()
                for course in all_courses:
                    course.is_used = course.id in used_course_ids
            except (IngenerInfo.DoesNotExist, ObjectDoesNotExist):
                students = StudentInfo.objects.none()
                all_courses = Course.objects.none()
            
            context = {
                'students': students,
                'password_form': form,
                'show_password_modal': True,
                'courses': all_courses
            }
            return render(request, 'ingener_op_app/ingener_index.html', context)
    else:
        # GET-запит - просто перенаправляємо на індекс з відкритим модальним вікном
        form = SetPasswordForm(user=request.user)
        try:
            ingener_info = IngenerInfo.objects.get(user=request.user)
            students = StudentInfo.objects.filter(ingener=ingener_info)
            all_courses = Course.objects.all()
            # Позначаємо курси, які використовуються
            student_education = Education.objects.filter(student__ingener=ingener_info).select_related('course')
            used_course_ids = student_education.values_list('course__id', flat=True).distinct()
            for course in all_courses:
                course.is_used = course.id in used_course_ids
        except (IngenerInfo.DoesNotExist, ObjectDoesNotExist):
            students = StudentInfo.objects.none()
            all_courses = Course.objects.none()
        
        context = {
            'students': students,
            'password_form': form,
            'show_password_modal': True,
            'courses': all_courses
        }
        return render(request, 'ingener_op_app/ingener_index.html', context)

@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def ingener_index(request):
    try:
        # Отримуємо параметри пошуку з URL
        search_student = request.GET.get('search_student', '')
        
        ingener_info = IngenerInfo.objects.get(user=request.user)
        
        # Базовий QuerySet
        students_list = StudentInfo.objects.filter(ingener=ingener_info)
        
        # Застосовуємо фільтри пошуку, якщо вони є
        if search_student:
            students_list = students_list.filter(
                Q(user__first_name__icontains=search_student) | 
                Q(user__last_name__icontains=search_student)
            )
        
        # Пагінація: 10 студентів на сторінку
        paginator = Paginator(students_list, 10)
        page = request.GET.get('page')
        
        try:
            students = paginator.page(page)
        except PageNotAnInteger:
            # Якщо параметр page не є цілим числом, показуємо першу сторінку
            students = paginator.page(1)
        except EmptyPage:
            # Якщо параметр page більший за кількість сторінок, показуємо останню
            students = paginator.page(paginator.num_pages)
        
        # Створюємо форму і передаємо ingener_info як початкове значення
        form = StudentEducationForm(initial={'company_name': ingener_info})
        # Обмежуємо вибір інженера тільки поточним інженером
        form.fields['company_name'].queryset = IngenerInfo.objects.filter(id=ingener_info.id)
        form.fields['company_name'].initial = ingener_info
        form.fields['company_name'].widget.attrs['readonly'] = True  # Додаємо атрибут readonly
        
        # Отримуємо список курсів для модального вікна
        # Знайдемо всі курси, які використовуються студентами цього інженера
        student_education = Education.objects.filter(student__ingener=ingener_info).select_related('course')
        used_course_ids = student_education.values_list('course__id', flat=True).distinct()
        
        # Отримуємо всі курси
        all_courses = Course.objects.all()
        
        # Помічаємо курси, які використовуються студентами цього інженера
        for course in all_courses:
            course.is_used = course.id in used_course_ids
            
    except (IngenerInfo.DoesNotExist, ObjectDoesNotExist):
        students = StudentInfo.objects.none()
        form = StudentEducationForm()
        all_courses = Course.objects.none()
        messages.warning(request, "Студентів не знайдено!")

    # Додаємо форму для зміни пароля
    password_form = SetPasswordForm(user=request.user)

    # Підготовка базового контексту
    context = {
        'students': students,
        'form': form,
        'search_student': search_student,
        'courses': all_courses,
        'password_form': password_form  # Додаємо форму для зміни пароля
    }
    
    # Якщо це AJAX запит для оновлення таблиці, повертаємо тільки HTML таблиці
    if request.GET.get('ajax') == '1' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return render(request, 'ingener_op_app/students_table_partial.html', context)
    
    # Перевіряємо наявність облікових даних для ДОДАВАННЯ у сесії
    if request.session.get('show_credentials'):
        context['show_credentials'] = True
        context['generated_password'] = request.session.get('generated_password')
        context['generated_email'] = request.session.get('generated_email')
        
        # Очищаємо дані сесії після додавання їх до контексту
        del request.session['show_credentials']
        del request.session['generated_password']
        del request.session['generated_email']
    
    # Перевіряємо наявність облікових даних для РЕДАГУВАННЯ у сесії
    if request.session.get('show_edit_credentials'):
        # Підготуємо форму для редагування з правильними даними
        edit_student_id = request.session.get('edit_student_id')
        if edit_student_id:
            student = get_object_or_404(StudentInfo, pk=edit_student_id)
            edit_form = StudentEducationForm(instance=student)
            edit_form.fields['company_name'].queryset = IngenerInfo.objects.filter(id=ingener_info.id)
            edit_form.fields['company_name'].initial = ingener_info.id
            
            all_edit_courses = Course.objects.all()
            for course in all_edit_courses:
                course.is_used = student.studies.filter(course=course).exists()
                
            context['edit_form'] = edit_form
            context['edit_id'] = edit_student_id
            context['courses'] = all_edit_courses
            context['generated_password'] = request.session.get('edit_generated_password')
            context['show_edit_credentials'] = True
            context['user_name'] = request.session.get('edit_user_name')
            context['user_email'] = request.session.get('edit_user_email')
            
            # Очищаємо дані сесії після додавання їх до контексту
            del request.session['show_edit_credentials']
            del request.session['edit_generated_password']
            del request.session['edit_generated_email']
            if 'edit_student_id' in request.session:
                del request.session['edit_student_id']
            if 'edit_user_name' in request.session:
                del request.session['edit_user_name']
            if 'edit_user_email' in request.session:
                del request.session['edit_user_email']
    
    return render(request, 'ingener_op_app/ingener_index.html', context)

@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def students_create(request):
    ingener_info = IngenerInfo.objects.get(user=request.user)
    if request.method == 'POST':
        form = StudentEducationForm(request.POST)
        
        # Отримуємо список курсів з форми
        courses = request.POST.getlist('courses')
        
        # Виводимо курси для діагностики
        print(f"Received courses in POST: {courses}")
        
        # Перевіряємо, чи вибрано хоча б один курс
        if not courses:
            if 'is_ajax' in request.POST and request.POST.get('is_ajax') == 'true':
                return JsonResponse({
                    'success': False,
                    'errors': ['Оберіть хоча б один напрямок навчання'],
                    'field_errors': {'courses': ['Оберіть хоча б один напрямок навчання']}
                })
            else:
                messages.error(request, 'Оберіть хоча б один напрямок навчання')
                return render(request, 'ingener_op_app/ingener_index.html', {
                    'form': form,
                    'has_form_errors': True,
                    'students': StudentInfo.objects.filter(ingener=ingener_info),
                    'courses': Course.objects.all(),
                })
        
        # Додаємо курси до форми
        form.data = form.data.copy()
        form.data.setlist('courses', courses)
            
        # Перевіряємо валідність форми
        if form.is_valid():
            # Зберігаємо дані
            student, user, educations = form.save()
            
            # Перевіряємо, чи запит Ajax
            if 'is_ajax' in request.POST and request.POST.get('is_ajax') == 'true':
                return JsonResponse({
                    'success': True,
                    'email': user.email,
                    'password': form.generated_password,
                    'message': 'Слухача успішно додано!'
                })
            
            # Стандартний потік для звичайного запиту (не Ajax)
            # Встановлюємо повідомлення про успіх
            messages.success(request, 'Слухача успішно додано!')
            
            # Зберігаємо інформацію про облікові дані в сесії для відображення після перенаправлення
            request.session['show_credentials'] = True
            request.session['generated_password'] = form.generated_password
            request.session['generated_email'] = user.email
            
            # Перенаправляємо на сторінку індексу інженера
            return redirect('ingener_index')
        else:
            # Додаємо логування помилок форми
            print(f"Помилки форми: {form.errors}")
            
            # Перевіряємо, чи запит Ajax
            if 'is_ajax' in request.POST and request.POST.get('is_ajax') == 'true':
                field_errors = {}
                for field, errors in form.errors.items():
                    field_errors[field] = [str(error) for error in errors]
                
                return JsonResponse({
                    'success': False,
                    'errors': ['Виникла помилка при збереженні. Перевірте форму на помилки.'],
                    'field_errors': field_errors
                })
            
            return render(request, 'ingener_op_app/ingener_index.html', {
                'form': form,
                'has_form_errors': True,
                'students': StudentInfo.objects.filter(ingener=ingener_info),
                'courses': Course.objects.all(),
            })
    else:
        form = StudentEducationForm()
    
    context = {
        'form': form,
        'has_form_errors': False,
        'students': StudentInfo.objects.filter(ingener=ingener_info),
        'courses': Course.objects.all(),
    }
    return render(request, 'ingener_op_app/ingener_index.html', context)

@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def students_update(request, pk):
    student = get_object_or_404(StudentInfo, pk=pk)
    ingener_info = IngenerInfo.objects.get(user=request.user)
    
    # Verify this engineer owns this student
    if student.ingener.id != ingener_info.id:
        messages.error(request, 'Ви не маєте доступу до цього слухача')
        return redirect('ingener_index')
    
    if request.method == 'POST':
        form = StudentEducationForm(request.POST, instance=student)
        courses = request.POST.getlist('courses')
        
        # Перевіряємо, чи вибрано хоча б один курс
        if not courses:
            messages.error(request, 'Оберіть хоча б один напрямок навчання')
            all_courses = Course.objects.all()
            for course in all_courses:
                course.is_used = student.studies.filter(course=course).exists()
                
            return render(request, 'ingener_op_app/ingener_index.html', {
                'edit_form': form,
                'students': StudentInfo.objects.filter(ingener=ingener_info),
                'edit_id': pk,
                'courses': all_courses,
                'has_form_errors': True
            })
            
        # Add courses to form data
        form.data = form.data.copy()
        form.data.setlist('courses', courses)
        
        # Додаємо company_name до форми
        form.data['company_name'] = ingener_info.id
        
        if form.is_valid():
            try:
                # Save form data
                student, user, educations = form.save()
                
                # Set success message
                if hasattr(form, 'generated_password'):
                    # Зберігаємо інформацію про нові облікові дані у сесії для РЕДАГУВАННЯ
                    request.session['show_edit_credentials'] = True
                    request.session['edit_generated_password'] = form.generated_password
                    request.session['edit_generated_email'] = form.generated_email
                    request.session['edit_student_id'] = pk
                    request.session['edit_user_name'] = f"{user.first_name} {user.last_name}" 
                    request.session['edit_user_email'] = user.email
                    
                    messages.success(request, 'Слухача успішно оновлено з новим паролем!')
                else:
                    messages.success(request, 'Слухача успішно оновлено!')
                
                # Перенаправляємо на сторінку індексу інженера
                return redirect('ingener_index')
            except Exception as e:
                messages.error(request, f'Помилка при оновленні слухача: {str(e)}')
                print(f"Error saving student: {str(e)}")
                context = {
                    'edit_form': form,
                    'students': StudentInfo.objects.filter(ingener=ingener_info),
                    'edit_id': pk,
                    'has_form_errors': True
                }
                return render(request, 'ingener_op_app/ingener_index.html', context)
        else:
            print(f"Form errors: {form.errors}")
            context = {
                'edit_form': form,
                'students': StudentInfo.objects.filter(ingener=ingener_info),
                'edit_id': pk,
                'has_form_errors': True
            }
            return render(request, 'ingener_op_app/ingener_index.html', context)
    else:
        # Create form with initial values for the student's courses
        form = StudentEducationForm(instance=student)
        # Restrict company choice to this engineer only
        form.fields['company_name'].queryset = IngenerInfo.objects.filter(id=ingener_info.id)
        form.fields['company_name'].initial = ingener_info.id
    
    all_courses = Course.objects.all()
    for course in all_courses:
        course.is_used = student.studies.filter(course=course).exists()
    
    context = {
        'edit_form': form,
        'students': StudentInfo.objects.filter(ingener=ingener_info),
        'edit_id': pk,
        'courses': all_courses
    }
    return render(request, 'ingener_op_app/ingener_index.html', context)

@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def students_delete(request, pk):
    student = get_object_or_404(StudentInfo, pk=pk)
    user = student.user
    if request.method == 'POST':
        student.delete()
        user.delete()
        return redirect('ingener_index')
    return render(request, 'ingener_op_app/ingener_index.html', {'student': student})

@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def import_students_from_excel(request):
    if request.method == 'POST' and request.FILES.get('excel_file'):
        excel_file = request.FILES['excel_file']
        
        # Очищаємо попередні помилки, якщо вони є
        if 'import_errors' in request.session:
            del request.session['import_errors']
        
        # Перевіряємо розширення файлу
        if not excel_file.name.endswith(('.xlsx', '.xls')):
            error_message = 'Будь ласка, завантажте файл Excel (.xlsx, .xls)'
            
            # Перевіряємо, чи це AJAX-запит
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False, 
                    'message': error_message,
                    'errors': [error_message],
                    'keep_modal_open': True,
                    'modal_type': 'import'  # Додаємо тип модального вікна
                })
            
            messages.error(request, error_message)
            return redirect('ingener_index')
        
        try:
            # Отримуємо інформацію про інженера
            ingener = IngenerInfo.objects.get(user=request.user)
            
            # Обробка Excel файлу
            df = pd.read_excel(excel_file)
            
            # Перевіряємо наявність необхідних колонок
            required_columns = ['ПІБ СЛУХАЧА', 'E-MAIL', 'ПОСАДА СЛУХАЧА', 'НАПРЯМОК НАВЧАННЯ']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                error_message = f'У файлі відсутні обов\'язкові колонки: {", ".join(missing_columns)}'
                
                # Перевіряємо, чи це AJAX-запит
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': False, 
                        'message': error_message,
                        'errors': [error_message],
                        'keep_modal_open': True,
                        'modal_type': 'import'  # Додаємо тип модального вікна
                    })
                
                messages.error(request, error_message)
                return redirect('ingener_index')
            
            # Статистика для звіту
            stats = {
                'total': len(df),
                'imported': 0,
                'skipped': 0,
                'errors': []
            }
            
            # Обробка кожного рядка даних
            for index, row in df.iterrows():
                try:
                    # Перевіряємо, чи всі обов'язкові поля заповнені
                    if pd.isna(row['ПІБ СЛУХАЧА']) or pd.isna(row['E-MAIL']) or pd.isna(row['ПОСАДА СЛУХАЧА']) or pd.isna(row['НАПРЯМОК НАВЧАННЯ']):
                        stats['skipped'] += 1
                        stats['errors'].append(f"Рядок {index+2}: Не всі обов'язкові поля заповнені")
                        continue
                    
                    # Розбираємо ПІБ на ім'я та прізвище
                    full_name = row['ПІБ СЛУХАЧА'].strip()
                    name_parts = full_name.split()
                    
                    if len(name_parts) >= 2:
                        first_name = name_parts[0]
                        last_name = ' '.join(name_parts[1:])
                    else:
                        first_name = full_name
                        last_name = ""
                    
                    # Перевіряємо, чи існує користувач з таким email
                    email = row['E-MAIL'].strip()
                    if CustomUser.objects.filter(email=email).exists():
                        stats['skipped'] += 1
                        stats['errors'].append(f"Рядок {index+2}: Користувач з email '{email}' вже існує")
                        continue
                    
                    # Перевіряємо курси
                    course_codes = [code.strip() for code in str(row['НАПРЯМОК НАВЧАННЯ']).split(',')]
                    valid_courses = []
                    invalid_courses = []
                    
                    for code in course_codes:
                        try:
                            course = Course.objects.get(code=code)
                            valid_courses.append(course)
                        except Course.DoesNotExist:
                            invalid_courses.append(code)
                    
                    if not valid_courses:
                        stats['skipped'] += 1
                        stats['errors'].append(f"Рядок {index+2}: Жоден з вказаних курсів не знайдено в системі: {', '.join(course_codes)}")
                        continue
                    
                    if invalid_courses:
                        stats['errors'].append(f"Рядок {index+2}: Деякі курси не знайдені: {', '.join(invalid_courses)}")
                    
                    # Створюємо користувача
                    # Генеруємо пароль
                    password = STUDENT_PASSWORD
                    
                    # Створюємо користувача
                    user = CustomUser.objects.create(
                        username=email,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        phone_number=row.get('ТЕЛЕФОН', ''),  # Необов'язкове поле
                        role='student'
                    )
                    user.set_password(password)
                    user.save()
                    
                    # Створюємо студента, прив'язаного до поточного інженера
                    student = StudentInfo.objects.create(
                        user=user,
                        ingener=ingener,
                        position=row['ПОСАДА СЛУХАЧА'],
                        status='waiting_authorization'
                    )
                    
                    # Додаємо курси
                    for course in valid_courses:
                        Education.objects.create(
                            student=student,
                            course=course
                        )
                    
                    stats['imported'] += 1
                
                except Exception as e:
                    stats['skipped'] += 1
                    stats['errors'].append(f"Рядок {index+2}: {str(e)}")
            
            # Формуємо повідомлення про результати імпорту
            success_message = f"Імпорт завершено. Додано {stats['imported']} з {stats['total']} слухачів."
            
            # Якщо були помилки, зберігаємо їх окремо для імпорту
            if stats['errors']:
                request.session['import_errors'] = stats['errors']
            
            # Перевіряємо, чи це AJAX-запит
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True, 
                    'message': success_message,
                    'imported': stats['imported'],
                    'total': stats['total'],
                    'has_errors': len(stats['errors']) > 0,
                    'errors': stats['errors'],
                    'keep_modal_open': True,
                    'modal_type': 'import',  # Додаємо тип модального вікна
                    'refresh_page': True  # Додаємо флаг для оновлення сторінки
                })
            
            messages.success(request, success_message)
            return redirect('ingener_index')
        
        except Exception as e:
            error_message = f'Помилка при обробці файлу: {str(e)}'
            
            # Перевіряємо, чи це AJAX-запит
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False, 
                    'message': error_message,
                    'errors': [error_message],
                    'keep_modal_open': True,
                    'modal_type': 'import'  # Додаємо тип модального вікна
                })
            
            messages.error(request, error_message)
            return redirect('ingener_index')
    
    error_message = 'Будь ласка, виберіть файл для імпорту'
    
    # Перевіряємо, чи це AJAX-запит
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'success': False, 
            'message': error_message,
            'errors': [error_message],
            'keep_modal_open': True,
            'modal_type': 'import'  # Додаємо тип модального вікна
        })
    
    messages.error(request, error_message)
    return redirect('ingener_index')

@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def clear_import_errors(request):
    """Очищує помилки імпорту зі сесії"""
    if 'import_errors' in request.session:
        del request.session['import_errors']
    
    # Якщо це AJAX-запит
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
        
    return redirect('ingener_index')

@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def get_import_errors(request):
    """Повертає помилки імпорту з сесії"""
    errors = request.session.get('import_errors', [])
    return JsonResponse({'errors': errors})

@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def students_delete(request, pk):
    """Видаляє слухача"""
    ingener_info = get_object_or_404(IngenerInfo, user=request.user)
    student = get_object_or_404(StudentInfo, pk=pk, ingener=ingener_info)
    
    try:
        user = student.user
        student_name = f"{user.first_name} {user.last_name}"
        
        # Видаляємо студента та його користувача
        student.delete()
        user.delete()
        messages.success(request, f'Слухача {student_name} успішно видалено.')
    except Exception as e:
        messages.error(request, f'Помилка при видаленні слухача: {str(e)}')
    
    # Always redirect to ingener_index
    return redirect('ingener_index')

@login_required
@user_passes_test(lambda u: u.role == 'ingener')
def export_students_to_excel(request):
    # Отримуємо параметри пошуку з URL для фільтрації
    search_student = request.GET.get('search_student', '')
    
    # Базовий QuerySet з тими ж фільтрами, що і на сторінці списку
    ingener = IngenerInfo.objects.get(user=request.user)
    students_list = StudentInfo.objects.filter(ingener=ingener)
    
    # Застосовуємо фільтри пошуку, якщо вони є
    if search_student:
        students_list = students_list.filter(
            Q(user__first_name__icontains=search_student) | 
            Q(user__last_name__icontains=search_student)
        )
    
    # Створюємо DataFrame для експорту
    data = []
    
    for student in students_list:
        # Отримуємо всі курси студента
        courses = ", ".join([education.course.code for education in student.studies.all()])
        
        # Формуємо рядок з даними студента
        student_data = {
            'КОМПАНІЯ': student.ingener.company_name if student.ingener else '',
            'ПІБ СЛУХАЧА': f"{student.user.first_name} {student.user.last_name}",
            'E-MAIL': student.user.email,
            'ПАРОЛЬ': STUDENT_PASSWORD,
            'ПОСАДА СЛУХАЧА': student.position,
            'НАПРЯМОК НАВЧАННЯ': courses,
            'ТЕЛЕФОН': student.user.phone_number if hasattr(student.user, 'phone_number') else ''
        }
        
        data.append(student_data)
    
    # Створюємо DataFrame з даних
    df = pd.DataFrame(data)
    
    # Створюємо Excel-файл в пам'яті
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=students_export.xlsx'
    
    # Зберігаємо DataFrame в Excel
    with pd.ExcelWriter(response, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Слухачі')
        
        # Доступ до робочої книги та аркуша
        workbook = writer.book
        worksheet = writer.sheets['Слухачі']
        
        # Форматування ширини стовпців
        for i, column in enumerate(df.columns):
            column_width = max(len(column), df[column].astype(str).map(len).max())
            worksheet.column_dimensions[chr(65 + i)].width = column_width + 4  # Додаємо відступ
        
        # Форматування заголовків (жирний шрифт)
        for cell in worksheet[1]:
            cell.font = openpyxl.styles.Font(bold=True)
    
    return response
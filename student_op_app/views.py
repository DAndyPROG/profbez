from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from student_op_app.models import StudentInfo, Question, Education, Test, Answer, StudentAnswer
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.exceptions import ObjectDoesNotExist
from admin_app.models import Course, CourseVideo
import re
from urllib.parse import urlparse, parse_qs
from django.db import models
import random
from django.utils import timezone
from datetime import timedelta
from django.http import JsonResponse
import logging

@login_required
@user_passes_test(lambda u: u.role == 'student')
def students_index(request):
    try:
        # Спробуємо знайти StudentInfo для поточного користувача напряму
        student_info = StudentInfo.objects.get(user=request.user)
        educations = Education.objects.filter(student=student_info)
    except (StudentInfo.DoesNotExist, ObjectDoesNotExist):
        # Якщо не знайдено, показуємо порожній список
        educations = Education.objects.none()
        messages.warning(request, "Ваш профіль студента не знайдено. Зверніться до адміністратора.")

    context = {
        'educations': educations
    }
    return render(request, 'student_op_app/students_index.html', context)


def get_embed_url(url):
    """Convert regular video URLs to embedded formats for various services"""
    if not url:
        return url
        
    # YouTube
    youtube_pattern1 = r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)'
    youtube_pattern2 = r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)'
    
    # Check for YouTube URLs
    youtube_match1 = re.match(youtube_pattern1, url)
    youtube_match2 = re.match(youtube_pattern2, url)
    
    if youtube_match1:
        video_id = youtube_match1.group(1)
        return f'https://www.youtube.com/embed/{video_id}'
    elif youtube_match2:
        video_id = youtube_match2.group(1)
        return f'https://www.youtube.com/embed/{video_id}'
    
    # Google Drive
    if 'drive.google.com/file/d/' in url:
        file_id = url.split('/d/')[1].split('/')[0]
        return f'https://drive.google.com/file/d/{file_id}/preview'
    
    if 'drive.google.com/open' in url:
        parsed_url = urlparse(url)
        params = parse_qs(parsed_url.query)
        if 'id' in params:
            file_id = params['id'][0]
            return f'https://drive.google.com/file/d/{file_id}/preview'
    
    # Повертаємо оригінальний URL якщо не співпали шаблони
    return url


@login_required
@user_passes_test(lambda u: u.role == 'student')
def students_course_views(request, course_id=None):
    # Якщо course_id не вказано, отримуємо його з GET параметрів
    if course_id is None:
        course_id = request.GET.get('course_id')
    
    course = get_object_or_404(Course, id=course_id)
    course_videos = CourseVideo.objects.filter(course=course)
    
    # Перевіряємо, чи є освіта для цього курсу у студента
    student_education = None
    try:
        student_info = StudentInfo.objects.get(user=request.user)
        student_education = Education.objects.filter(student=student_info, course=course).first()
    except StudentInfo.DoesNotExist:
        pass
    
    # Отримуємо video_id з query параметрів, якщо він є
    video_id = request.GET.get('video_id')
    selected_video = None
    
    if video_id and course_videos.exists():
        try:
            selected_video = course_videos.get(id=video_id)
            # Конвертуємо URL відео в формат для вбудованих відео
            if selected_video:
                selected_video.video_url = get_embed_url(selected_video.video_url)
        except CourseVideo.DoesNotExist:
            selected_video = course_videos.first()
            if selected_video:
                selected_video.video_url = get_embed_url(selected_video.video_url)
    elif course_videos.exists():
        selected_video = course_videos.first()
        if selected_video:
            selected_video.video_url = get_embed_url(selected_video.video_url)
    
    # Конвертуємо всі URL відео в queryset в формат для вбудованих відео
    for video in course_videos:
        video.video_url = get_embed_url(video.video_url)
    
    context = {
        'course': course,
        'course_videos': course_videos,
        'selected_video': selected_video,
        'student_education': student_education
    }
    return render(request, 'student_op_app/students_course_views.html', context)


@login_required
@user_passes_test(lambda u: u.role == 'student')
def students_testing(request):
    # Отримуємо test_id і course_id з URL
    test_id = request.GET.get('test_id')
    education_id = request.GET.get('education_id')
    question_id = request.GET.get('question_id')
    start_new = request.GET.get('start_new', 'false') == 'true'  # Параметр для початку нового тесту
    
    # Якщо вказано start_new=true, завершуємо попередні незавершені тести
    if start_new and education_id:
        education = get_object_or_404(Education, id=education_id, student__user=request.user)
        
        # Завершуємо попередні незавершені тести
        Test.objects.filter(
            student__user=request.user,
            education=education,
            is_comlited=False
        ).update(is_comlited=True, score=0)
        
        # Видаляємо всі попередні порядки питань з сесії для примусового перемішування при новому тесті
        for key in list(request.session.keys()):
            if key.startswith('test_') and '_question_order' in key:
                del request.session[key]
        request.session.modified = True
        
        # Переходимо до створення нового тесту
        test_id = None
    
    # Якщо не вказано test_id, ми повинні створити новий тест
    if not test_id and education_id:
        # Отримуємо освіту
        education = get_object_or_404(Education, id=education_id, student__user=request.user)
        student = StudentInfo.objects.get(user=request.user)
        
        # Перевіряємо, чи є активний тест
        active_test = Test.objects.filter(
            student__user=request.user,
            education=education,
            is_comlited=False
        ).first()
        
        if active_test:
            test = active_test
            # Перевіряємо, чи минуло 30 хвилин з початку тесту
            if test.start_time:
                time_limit = timedelta(minutes=30)
                current_time = timezone.now()
                time_elapsed = current_time - test.start_time
                
                # Якщо час вичерпано, завершуємо тест
                if time_elapsed >= time_limit:
                    # Обчислюємо оцінку на основі поточних відповідей
                    total_answered = StudentAnswer.objects.filter(test=test).count()
                    correct_answers = StudentAnswer.objects.filter(test=test, is_correct=True).count()
                    
                    if total_answered > 0:
                        score_percentage = (correct_answers / total_answered) * 100
                    else:
                        score_percentage = 0
                    
                    # Завершуємо тест
                    test.is_comlited = True
                    test.score = score_percentage
                    test.save()
                    
                    # Видаляємо порядок питань із сесії
                    if f'test_{test.id}_question_order' in request.session:
                        del request.session[f'test_{test.id}_question_order']
                        request.session.modified = True
                    
                    messages.warning(request, "Час тестування вичерпано! Тест автоматично завершено.")
                    return redirect(f'/students/testing/results/?test_id={test.id}')
            
            # Встановлюємо start_time, якщо воно не встановлено
            if not test.start_time:
                test.start_time = timezone.now()
                test.save()
            
            # Перевіряємо активність сесії користувача
            session_key = f'test_{test.id}_last_activity'
            current_time = timezone.now()
            
            # Якщо є збережена остання активність
            if session_key in request.session:
                last_activity = timezone.datetime.fromisoformat(request.session[session_key])
                # Якщо користувач був неактивний більше 1 хвилини, скидаємо тест
                if current_time - last_activity > timedelta(minutes=1):
                    # Завершуємо поточний тест з нульовою оцінкою
                    test.is_comlited = True
                    test.score = 0
                    test.save()
                    
                    # Видаляємо дані з сесії
                    for key in list(request.session.keys()):
                        if key.startswith(f'test_{test.id}_'):
                            del request.session[key]
                    request.session.modified = True
                    
                    messages.warning(request, "Тестування було скинуто через тривалу відсутність. Почніть заново.")
                    return redirect('students_index')
            
            # Оновлюємо час останньої активності
            request.session[session_key] = current_time.isoformat()
            request.session.modified = True
            
            # Перевіряємо, чи минуло 30 хвилин з початку тесту
            time_limit = timedelta(minutes=30)
            time_elapsed = current_time - test.start_time
            time_remaining = time_limit - time_elapsed
            
            # Перевіряємо, чи є збережений порядок питань у сесії
            if f'test_{test.id}_question_order' not in request.session:
                # Створюємо порядок питань і перемішуємо їх при першому входженні в тест
                question_ids = list(Question.objects.filter(course=education.course).values_list('id', flat=True))
                random.shuffle(question_ids)  # Перемішуємо питання при створенні нового порядку
                # Обмежуємо кількість питань до 20
                if len(question_ids) > 20:
                    question_ids = question_ids[:20]
                request.session[f'test_{test.id}_question_order'] = question_ids
                request.session.modified = True
        else:
            # Отримуємо кількість попередніх завершених спроб
            previous_attempts = Test.objects.filter(
                student=student,
                education=education,
                is_comlited=True
            ).count()
            
            # Створюємо новий тест з правильним номером спроби
            test = Test.objects.create(
                student=student,
                education=education,
                attempts=previous_attempts + 1  # Збільшуємо номер спроби
            )
            
            # Отримуємо всі питання для цього курсу і перемішуємо їх при новому тесті
            course = education.course
            question_ids = list(Question.objects.filter(course=course).values_list('id', flat=True))
            random.shuffle(question_ids)  # Перемішуємо питання для нового тесту
            
            # Обмежуємо кількість питань до 20
            if len(question_ids) > 20:
                question_ids = question_ids[:20]
            
            # Зберігаємо порядок питань в сесії
            request.session[f'test_{test.id}_question_order'] = question_ids
            request.session.modified = True
        
        # Перенаправляємо на перше питання
        # Використовуємо збережений порядок питань з сесії
        question_ids = request.session[f'test_{test.id}_question_order']
        
        if question_ids:
            first_question_id = question_ids[0]
            return redirect(f'/students/testing/?test_id={test.id}&question_id={first_question_id}')
        else:
            messages.error(request, "Для цього курсу немає питань.")
            return redirect('students_index')
            
    # Якщо є test_id, отримуємо тест
    if test_id:
        test = get_object_or_404(Test, id=test_id, student__user=request.user)
        education = test.education
        course = education.course
        
        # Перевіряємо, чи тест вже завершено
        if test.is_comlited:
            return redirect(f'/students/testing/results/?test_id={test.id}')
        
        # Встановлюємо start_time, якщо воно не встановлено
        if not test.start_time:
            test.start_time = timezone.now()
            test.save()
        
        # Перевіряємо активність сесії користувача
        session_key = f'test_{test.id}_last_activity'
        current_time = timezone.now()
        
        # Якщо є збережена остання активність
        if session_key in request.session:
            last_activity = timezone.datetime.fromisoformat(request.session[session_key])
            # Якщо користувач був неактивний більше 1 хвилини, скидаємо тест
            if current_time - last_activity > timedelta(minutes=1):
                # Завершуємо поточний тест з нульовою оцінкою
                test.is_comlited = True
                test.score = 0
                test.save()
                
                # Видаляємо дані з сесії
                for key in list(request.session.keys()):
                    if key.startswith(f'test_{test.id}_'):
                        del request.session[key]
                request.session.modified = True
                
                messages.warning(request, "Тестування було скинуто через тривалу відсутність. Почніть заново.")
                return redirect('students_index')
        
        # Оновлюємо час останньої активності
        request.session[session_key] = current_time.isoformat()
        request.session.modified = True
        
        # Перевіряємо, чи минуло 30 хвилин з початку тесту
        time_limit = timedelta(minutes=30)
        time_elapsed = current_time - test.start_time
        time_remaining = time_limit - time_elapsed
        
        # Якщо час вичерпано, автоматично завершуємо тест
        # Додаємо невелику толерантність (15 секунд) для уникнення передчасного завершення
        if time_remaining <= timedelta(seconds=-15):
            # Обчислюємо оцінку на основі поточних відповідей
            total_answered = StudentAnswer.objects.filter(test=test).count()
            correct_answers = StudentAnswer.objects.filter(test=test, is_correct=True).count()
            
            if total_answered > 0:
                score_percentage = (correct_answers / total_answered) * 100
            else:
                score_percentage = 0
            
            # Завершуємо тест
            test.is_comlited = True
            test.score = score_percentage
            test.save()
            
            # Видаляємо порядок питань із сесії
            if f'test_{test.id}_question_order' in request.session:
                del request.session[f'test_{test.id}_question_order']
                request.session.modified = True
            
            messages.warning(request, "Час тестування вичерпано! Тест автоматично завершено.")
            return redirect(f'/students/testing/results/?test_id={test.id}')
        
        # Перевіряємо, чи є збережений порядок питань у сесії
        if f'test_{test.id}_question_order' not in request.session:
            # Створюємо новий порядок питань, якщо заходимо в існуючий тест без збереженого порядку (наприклад, після сесії)
            question_ids = list(Question.objects.filter(course=course).values_list('id', flat=True))
            random.shuffle(question_ids)  # Перемішуємо питання при першому входженні
            # Обмежуємо кількість питань до 20
            if len(question_ids) > 20:
                question_ids = question_ids[:20]
            request.session[f'test_{test.id}_question_order'] = question_ids
            request.session.modified = True
        
        # Отримуємо порядок питань із сесії
        question_ids = request.session[f'test_{test.id}_question_order']
        
        # Перевіряємо, чи порядок питань містить більше 20 питань (для існуючих тестів)
        if len(question_ids) > 20:
            # Обмежуємо до 20 питань, зберігаючи випадковий порядок
            question_ids = question_ids[:20]
            request.session[f'test_{test.id}_question_order'] = question_ids
            request.session.modified = True
        
        total_questions = len(question_ids)
        
        # Якщо не вказано question_id, перенаправляємо на перше питання
        if not question_id and question_ids:
            return redirect(f'/students/testing/?test_id={test.id}&question_id={question_ids[0]}')
        
        # Отримуємо поточне питання або 404
        if question_id:
            current_question = get_object_or_404(Question, id=question_id, course=course)
            # Отримуємо номер поточного питання (позицію) з нашого збереженого порядку
            try:
                current_question_num = question_ids.index(int(question_id)) + 1
            except (ValueError, TypeError):
                current_question_num = 1
        else:
            # Якщо не вказано question_id, отримуємо перше питання з нашого порядку
            if question_ids:
                current_question = Question.objects.get(id=question_ids[0])
                current_question_num = 1
            else:
                # Якщо питань немає, показуємо помилку
                messages.error(request, "Для цього курсу немає питань.")
                return redirect('students_index')
            
            if current_question:
                # Перенаправляємо на URL з question_id
                return redirect(f'/students/testing/?test_id={test.id}&question_id={current_question.id}')
        
        # Обробляємо відправку форми для відповіді
        if request.method == 'POST':
            # Перевіряємо час ще раз перед обробкою відповіді
            current_time = timezone.now()
            time_elapsed = current_time - test.start_time
            time_remaining = time_limit - time_elapsed
            
            # Якщо час вичерпано, завершуємо тест і перенаправляємо до результатів
            # Додаємо невелику толерантність (15 секунд) для уникнення передчасного завершення
            if time_remaining <= timedelta(seconds=-15):
                # Обчислюємо оцінку на основі поточних відповідей
                total_answered = StudentAnswer.objects.filter(test=test).count()
                correct_answers = StudentAnswer.objects.filter(test=test, is_correct=True).count()
                
                if total_answered > 0:
                    score_percentage = (correct_answers / total_answered) * 100
                else:
                    score_percentage = 0
                
                # Завершуємо тест
                test.is_comlited = True
                test.score = score_percentage
                test.save()
                
                # Видаляємо порядок питань із сесії
                if f'test_{test.id}_question_order' in request.session:
                    del request.session[f'test_{test.id}_question_order']
                    request.session.modified = True
                
                messages.warning(request, "Час тестування вичерпано! Тест автоматично завершено.")
                return redirect(f'/students/testing/results/?test_id={test.id}')
            
            selected_answer_id = request.POST.get('answer')
            
            if selected_answer_id:
                selected_answer = get_object_or_404(Answer, id=selected_answer_id)
                
                # Перевіряємо, чи вже існує відповідь для цього питання
                existing_answer = StudentAnswer.objects.filter(
                    test=test,
                    question=current_question
                ).first()
                
                if existing_answer:
                    # Оновлюємо існуючу відповідь
                    existing_answer.selected_answer = selected_answer
                    existing_answer.is_correct = selected_answer.is_correct
                    existing_answer.save()
                else:
                    # Створюємо нову відповідь
                    StudentAnswer.objects.create(
                        test=test,
                        question=current_question,
                        selected_answer=selected_answer,
                        is_correct=selected_answer.is_correct
                    )
                
                # Якщо є наступне питання, перенаправляємо на нього
                if current_question_num < total_questions:
                    next_question_id = question_ids[current_question_num]
                    return redirect(f'/students/testing/?test_id={test.id}&question_id={next_question_id}')
                else:
                    # Якщо це останнє питання, перенаправляємо на результати
                    return redirect(f'/students/testing/results/?test_id={test.id}')
        
        # Отримуємо всі відповіді для поточного питання
        answers = list(Answer.objects.filter(question=current_question))
        
        # Завжди перемішуємо варіанти відповідей
        random.shuffle(answers)
        
        # Отримуємо раніше вибрану відповідь (якщо вона є)
        selected_answer = StudentAnswer.objects.filter(
            test=test,
            question=current_question
        ).first()
        
        # Отримуємо кількість запитань, на які відповіли
        answered_questions_count = StudentAnswer.objects.filter(
            test=test
        ).count()
        
        # Отримуємо ID попереднього і наступного питання з нашого збереженого порядку
        prev_question_id = None
        next_question_id = None
        
        if current_question_num > 1:
            prev_question_id = question_ids[current_question_num - 2]
        
        if current_question_num < total_questions:
            next_question_id = question_ids[current_question_num]
        
        # Створюємо список всіх питань з їхнім статусом відповіді
        questions_status = []
        for i, q_id in enumerate(question_ids):
            answered = StudentAnswer.objects.filter(test=test, question_id=q_id).exists()
            questions_status.append({
                'number': i + 1,
                'id': q_id,
                'answered': answered,
                'current': q_id == int(question_id)
            })
        
        context = {
            'test': test,
            'education': education,
            'course': course,
            'current_question': current_question,
            'current_question_num': current_question_num,
            'total_questions': total_questions,
            'answers': answers,
            'selected_answer': selected_answer.selected_answer if selected_answer else None,
            'answered_questions_count': answered_questions_count,
            'questions_status': questions_status,
            'prev_question_id': prev_question_id,
            'next_question_id': next_question_id,
            'test_start_time': test.start_time.isoformat() if test.start_time else None,
            'time_remaining_seconds': int(time_remaining.total_seconds()) if time_remaining > timedelta(0) else 0,
        }
        
        return render(request, 'student_op_app/testing.html', context)
    
    # Якщо немає test_id або education_id, показуємо всі доступні тести
    educations = Education.objects.filter(
        student__user=request.user,
        status='started'  # Показувати лише активні освіти
    )
    
    context = {
        'educations': educations,
    }
    
    return render(request, 'student_op_app/tests_list.html', context)

@login_required
@user_passes_test(lambda u: u.role == 'student')
def tests_results(request):
    test_id = request.GET.get('test_id')
    
    if not test_id:
        return redirect('students_index')
    
    test = get_object_or_404(Test, id=test_id, student__user=request.user)
    
    # Автоматично обчислюємо та зберігаємо результати, якщо тест ще не завершено
    if not test.is_comlited:
        # Обчислюємо оцінку на основі кількості питань у тесті
        total_questions = StudentAnswer.objects.filter(test=test).count()
        correct_answers = StudentAnswer.objects.filter(test=test, is_correct=True).count()
        
        if total_questions > 0:
            score_percentage = (correct_answers / total_questions) * 100
        else:
            score_percentage = 0
        
        # Оновлюємо тест
        test.is_comlited = True
        test.score = score_percentage
        test.save()
        
        messages.success(request, f"Тест завершено! Ваш результат: {score_percentage:.2f}%")
        if score_percentage >= 55:
            student = test.student
            student.status = 'completed'
            student.save()
            test.education.last_score = score_percentage
            test.education.save()
        # Видаляємо порядок питань із сесії, оскільки тест завершено
        if f'test_{test.id}_question_order' in request.session:
            del request.session[f'test_{test.id}_question_order']
            request.session.modified = True
    
    # Отримуємо всі відповіді студента для цього тесту
    student_answers = StudentAnswer.objects.filter(test=test)
    
    # Рахуємо загальну кількість питань у тесті та правильні відповіді
    total_questions = student_answers.count()
    correct_answers = student_answers.filter(is_correct=True).count()
    
    # Обчислюємо оцінку
    if total_questions > 0:
        score_percentage = (correct_answers / total_questions) * 100
    else:
        score_percentage = 0
    
    # Перевіряємо, чи всі питання були відповідені
    total_answered = student_answers.count()
    all_answered = total_answered == total_questions
    
    # Отримуємо всі попередні спроби цього тесту
    previous_tests = Test.objects.filter(
        student=test.student,
        education=test.education
    ).order_by('-attempts')
    
    # Обчислюємо найвищу оцінку серед всіх спроб
    highest_score = previous_tests.exclude(is_comlited=False).aggregate(
        highest=models.Max('score'))['highest'] or 0
    
    # Отримуємо загальну кількість спроб
    total_attempts = Test.objects.filter(
        student=test.student,
        education=test.education
    ).count()
    
    context = {
        'test': test,
        'education': test.education,
        'total_questions': total_questions,
        'answered_questions': total_answered,
        'correct_answers': correct_answers,
        'score_percentage': score_percentage,
        'all_answered': all_answered,
        'previous_tests': previous_tests,
        'highest_score': highest_score,
        'total_attempts': total_attempts,
    }
    
    return render(request, 'student_op_app/test_results.html', context)

@login_required
@user_passes_test(lambda u: u.role == 'student')
def reset_test_questions(request):
    """Очищає порядок питань у сесії для поточного тесту та перезапускає з 20 питаннями"""
    test_id = request.GET.get('test_id')
    
    if test_id:
        # Видаляємо порядок питань з сесії
        session_key = f'test_{test_id}_question_order'
        if session_key in request.session:
            del request.session[session_key]
            request.session.modified = True
        
        # Перенаправляємо назад на тест
        return redirect(f'/students/testing/?test_id={test_id}')
    
    return redirect('students_index')

@login_required
@user_passes_test(lambda u: u.role == 'student')
def update_test_activity(request):
    """Оновлює час останньої активності користувача під час тестування"""
    if request.method == 'POST':
        test_id = request.POST.get('test_id')
        
        if test_id:
            try:
                # Перевіряємо, що тест належить користувачу
                test = Test.objects.get(id=test_id, student__user=request.user, is_comlited=False)
                
                # Оновлюємо час останньої активності
                session_key = f'test_{test.id}_last_activity'
                request.session[session_key] = timezone.now().isoformat()
                request.session.modified = True
                
                # Перевіряємо, чи не вичерпано час
                time_limit = timedelta(minutes=30)
                current_time = timezone.now()
                time_elapsed = current_time - test.start_time if test.start_time else timedelta(0)
                time_remaining = time_limit - time_elapsed
                
                return JsonResponse({
                    'success': True,
                    'time_remaining': int(time_remaining.total_seconds()) if time_remaining > timedelta(0) else 0
                })
                
            except Test.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Test not found'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@login_required
@user_passes_test(lambda u: u.role == 'student')
def leave_test(request):
    """Обробляє вихід користувача з тестування та скидає тест"""
    if request.method == 'POST':
        test_id = request.POST.get('test_id')
        
        if test_id:
            try:
                # Перевіряємо, що тест належить користувачу
                test = Test.objects.get(id=test_id, student__user=request.user, is_comlited=False)
                
                # Логуємо причину скидання тесту для діагностики
                logger = logging.getLogger(__name__)
                logger.info(f"Test {test_id} reset by user {request.user.id} - User left testing page")
                
                # Завершуємо тест з нульовою оцінкою
                test.is_comlited = True
                test.score = 0
                test.save()
                
                # Видаляємо дані з сесії
                for key in list(request.session.keys()):
                    if key.startswith(f'test_{test.id}_'):
                        del request.session[key]
                request.session.modified = True
                
                return JsonResponse({'success': True, 'message': 'Test reset successfully'})
                
            except Test.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Test not found'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})


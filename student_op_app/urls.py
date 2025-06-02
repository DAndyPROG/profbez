from django.urls import path
from . import views

urlpatterns = [
    # Студенти
    path('students/index/', views.students_index, name='students_index'),
    path('students/course_views/', views.students_course_views, name='students_course_views'),
    path('students/course_views/<int:course_id>/', views.students_course_views, name='students_course_views_with_id'),
    path('students/testing/', views.students_testing, name='students_testing'),
    path('students/testing/results/', views.tests_results, name='tests_results'),
    path('students/testing/reset/', views.reset_test_questions, name='reset_test_questions'),
    path('students/testing/update_activity/', views.update_test_activity, name='update_test_activity'),
    path('students/testing/leave/', views.leave_test, name='leave_test'),
]

from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('health/', views.health_check, name='health_check'),  # Healthcheck endpoint for Railway
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    # Курси
    path('courses/', views.courses_list, name='admin_courses_list'),
    path('courses/create/', views.courses_create, name='admin_courses_create'),
    path('courses/update/<int:course_id>/', views.courses_update, name='admin_courses_update'),
    path('courses/delete/<int:course_id>/', views.courses_delete, name='admin_courses_delete'),
    # Клієнти
    path('clients/', views.clients_list, name='admin_clients_list'),
    path('clients/create/', views.clients_create, name='admin_clients_create'),
    path('clients/update/<int:pk>/', views.clients_update, name='admin_clients_update'),
    path('clients/delete/<int:pk>/', views.clients_delete, name='admin_clients_delete'),
    path('clients/mark-seen/<int:pk>/', views.mark_client_as_seen, name='mark_client_as_seen'),
     # Студенти
    path('students/', views.students_list, name='students_list'),
    path('students/create/', views.students_create, name='students_create'),
    path('students/add-ajax/', views.students_add_ajax, name='students_add_ajax'),
    path('students/update/<int:pk>/', views.students_update, name='students_update'),
    # path('students/update-ajax/<int:pk>/', views.students_update_ajax, name='students_update_ajax'),
    path('students/delete/<int:pk>/', views.students_delete, name='students_delete'),
    # Excel імпорт/експорт слухачів
    path('students/export-excel/', views.export_students_to_excel, name='export_students_to_excel'),
    path('students/import-excel/', views.import_students_from_excel, name='import_students_from_excel'),
    path('students/clear-import-errors/', views.clear_import_errors, name='clear_import_errors'),
    path('students/get-import-errors/', views.get_import_errors, name='get_import_errors'),
    # Тестування
    path('tests/', views.tests_list, name='admin_tests_list'),
    path('tests/create/', views.tests_create, name='admin_tests_create'),
    path('tests/update/<int:test_id>/', views.tests_update, name='admin_tests_update'),
    path('tests/delete/<int:test_id>/', views.tests_delete, name='admin_tests_delete'),
    path('tests/delete_alt/', views.tests_delete_alt, name='admin_tests_delete_alt'),
    path('tests/import-excel/', views.import_tests_from_excel, name='import_tests_from_excel'),
    path('tests/clear-import-errors/', views.clear_import_errors, name='clear_tests_import_errors'),
    path('tests/get-import-errors/', views.get_import_errors, name='get_tests_import_errors'),
    # Debug
    path('debug/', views.debug_view, name='debug_view'),
    path('debug/<int:test_id>/', views.debug_view, name='debug_view_with_id'),
    # Додаємо URL для створення тестової компанії
    path('test-company/create/', views.create_test_company, name='create_test_company'),
]


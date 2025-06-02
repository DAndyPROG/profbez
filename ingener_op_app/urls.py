from django.urls import path
from . import views

urlpatterns = [
    path('ingener/index/', views.ingener_index, name='ingener_index'),
    path('ingener/set-new-password/', views.set_new_password, name='set_new_password'),
    path('ingener/students/create/', views.students_create, name='ingener_students_create'),
    path('ingener/students/update/<int:pk>/', views.students_update, name='ingener_students_update'),
    # path('ingener/students/update-ajax/<int:pk>/', views.students_update_ajax, name='ingener_students_update_ajax'),
    path('ingener/students/delete/<int:pk>/', views.students_delete, name='ingener_students_delete'),
    # Excel імпорт/експорт слухачів
    path('ingener/students/import-excel/', views.import_students_from_excel, name='ingener_import_students_from_excel'),
    path('ingener/students/clear-import-errors/', views.clear_import_errors, name='ingener_clear_import_errors'),
    path('ingener/students/get-import-errors/', views.get_import_errors, name='ingener_get_import_errors'),
    path('ingener/students/export-excel/', views.export_students_to_excel, name='ingener_export_students_to_excel'),
]
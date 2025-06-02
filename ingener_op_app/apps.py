from django.apps import AppConfig


class IngenerOpAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ingener_op_app'
    
    def ready(self):
        import ingener_op_app.signals  # Імпортуємо сигнали
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth import logout
from django.contrib import messages
from django.utils import timezone
from datetime import date
from ingener_op_app.models import Contract
from student_op_app.models import StudentInfo


class ContractExpirationMiddleware:
    """
    Middleware для перевірки термінів дії договорів.
    Блокує доступ користувачів, чий договір завершився.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Пропускаємо неавторизованих користувачів та адміністраторів
        if not request.user.is_authenticated or request.user.role == 'admin':
            return self.get_response(request)
        
        # Пропускаємо запити до logout та index (щоб користувач міг вийти)
        exempt_urls = [reverse('logout'), reverse('index')]
        if request.path in exempt_urls:
            return self.get_response(request)
        
        # Перевіряємо договір для інженерів
        if request.user.role == 'ingener':
            try:
                # Знаходимо інженера та його договір
                from ingener_op_app.models import IngenerInfo
                ingener = IngenerInfo.objects.get(user=request.user)
                
                # Перевіряємо чи є активний договір
                if hasattr(ingener, 'contract'):
                    contract = ingener.contract
                    today = date.today()
                    
                    # Якщо договір завершився
                    if contract.contract_end_date < today:
                        # Деактивуємо користувача
                        request.user.is_active = False
                        request.user.save()
                        
                        # Виходимо з системи
                        logout(request)
                        
                        # Додаємо повідомлення про завершення договору
                        messages.error(request, 
                            f'Термін дії вашого договору (до {contract.contract_end_date.strftime("%d.%m.%Y")}) '
                            f'завершився. Для продовження роботи зверніться до адміністратора.')
                        
                        return HttpResponseRedirect(reverse('index'))
                else:
                    # Якщо немає договору, блокуємо доступ
                    request.user.is_active = False
                    request.user.save()
                    request.session['login_error'] = 'no_contract'
                    logout(request)
                    messages.error(request, 'У вас немає активного договору. Зверніться до адміністратора.')
                    return HttpResponseRedirect(reverse('index'))
                    
            except IngenerInfo.DoesNotExist:
                # Якщо профіль інженера не знайдено
                logout(request)
                messages.error(request, 'Профіль користувача не знайдено. Зверніться до адміністратора.')
                return HttpResponseRedirect(reverse('index'))
        
        # Перевіряємо договір для студентів (через їх інженера)
        elif request.user.role == 'student':
            try:
                student = StudentInfo.objects.get(user=request.user)
                
                # Перевіряємо договір інженера студента
                if student.ingener and hasattr(student.ingener, 'contract'):
                    contract = student.ingener.contract
                    today = date.today()
                    
                    # Якщо договір завершився
                    if contract.contract_end_date < today:
                        # Деактивуємо користувача
                        request.user.is_active = False
                        request.user.save()
                        
                        # Виходимо з системи
                        logout(request)
                        
                        # Додаємо повідомлення про завершення договору
                        messages.error(request, 
                            f'Термін дії договору вашої компанії (до {contract.contract_end_date.strftime("%d.%m.%Y")}) '
                            f'завершився. Для продовження навчання зверніться до вашого керівника або адміністратора.')
                        
                        return HttpResponseRedirect(reverse('index'))
                else:
                    # Якщо немає договору у компанії
                    request.user.is_active = False
                    request.user.save()
                    logout(request)
                    messages.error(request, 'У вашої компанії немає активного договору. Зверніться до адміністратора.')
                    return HttpResponseRedirect(reverse('index'))
                    
            except StudentInfo.DoesNotExist:
                # Якщо профіль студента не знайдено
                logout(request)
                messages.error(request, 'Профіль користувача не знайдено. Зверніться до адміністратора.')
                return HttpResponseRedirect(reverse('index'))

        return self.get_response(request) 
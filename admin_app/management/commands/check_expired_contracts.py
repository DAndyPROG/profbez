from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from ingener_op_app.models import Contract, IngenerInfo
from student_op_app.models import StudentInfo
from admin_app.models import CustomUser


class Command(BaseCommand):
    help = 'Деактивує користувачів з прострочeними договорами'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            dest='dry_run',
            help='Показати результати без фактичного оновлення',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Детальний вивід',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        today = date.today()
        
        self.stdout.write(
            self.style.SUCCESS(f'Перевірка прострочених договорів на {today}')
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('*** РЕЖИМ ТЕСТУВАННЯ - ЗМІНИ НЕ БУДУТЬ ЗБЕРЕЖЕНІ ***')
            )
        
        # Лічильники
        expired_ingeniers = 0
        expired_students = 0
        
        # Знаходимо всі договори, які завершилися
        expired_contracts = Contract.objects.filter(contract_end_date__lt=today)
        
        for contract in expired_contracts:
            # Деактивуємо інженера
            if contract.client and contract.client.user:
                user = contract.client.user
                if user.is_active:
                    if verbose:
                        self.stdout.write(
                            f'Деактивуємо інженера: {user.email} '
                            f'(договір до {contract.contract_end_date})'
                        )
                    
                    if not dry_run:
                        user.is_active = False
                        user.save()
                    
                    expired_ingeniers += 1
                    
                    # Деактивуємо всіх студентів цього інженера
                    students = StudentInfo.objects.filter(ingener=contract.client)
                    for student in students:
                        if student.user.is_active:
                            if verbose:
                                self.stdout.write(
                                    f'  Деактивуємо студента: {student.user.email} '
                                    f'(компанія: {contract.client.company_name})'
                                )
                            
                            if not dry_run:
                                student.user.is_active = False
                                student.user.save()
                            
                            expired_students += 1
        
        # Виводимо статистику
        self.stdout.write('') 
        self.stdout.write(self.style.SUCCESS('=== РЕЗУЛЬТАТИ ==='))
        self.stdout.write(f'Договорів з прострочeним терміном: {len(expired_contracts)}')
        self.stdout.write(f'Деактивовано інженерів: {expired_ingeniers}')
        self.stdout.write(f'Деактивовано студентів: {expired_students}')
        
        if dry_run:
            self.stdout.write('')
            self.stdout.write(
                self.style.WARNING('Для фактичного виконання запустіть без --dry-run')
            )
        else:
            self.stdout.write('')
            self.stdout.write(
                self.style.SUCCESS('Деактивування завершено успішно!')
            ) 
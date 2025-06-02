"""
Django command to wait for database to be available.
"""
import time
import sys

from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    """Django command to pause execution until database is available"""

    def add_arguments(self, parser):
        parser.add_argument(
            '--timeout', 
            type=int, 
            default=300, 
            help='Maximum time to wait for database (seconds)'
        )

    def handle(self, *args, **options):
        timeout = options['timeout']
        self.stdout.write('🔍 Waiting for database...')
        self.stdout.write(f'⏱️ Timeout set to {timeout} seconds')
        
        db_conn = None
        start_time = time.time()
        attempts = 0
        
        while not db_conn:
            attempts += 1
            try:
                db_conn = connections['default']
                db_conn.cursor()
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Database available after {attempts} attempts!')
                )
                return
            except OperationalError as e:
                elapsed_time = time.time() - start_time
                if elapsed_time > timeout:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Database timeout after {elapsed_time:.1f} seconds')
                    )
                    self.stdout.write(self.style.ERROR(f'Last error: {str(e)}'))
                    sys.exit(1)
                
                self.stdout.write(f'🔄 Database unavailable (attempt {attempts}), waiting 2 seconds...')
                self.stdout.write(f'   Error: {str(e)[:100]}...')
                time.sleep(2) 
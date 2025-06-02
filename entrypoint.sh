#!/bin/bash
set -e

echo "🔧 Entrypoint script starting..."

# Убедимся что start.sh исполняемый
chmod +x start.sh

# Запускаем основной скрипт
exec ./start.sh 
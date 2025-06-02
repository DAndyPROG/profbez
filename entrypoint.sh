#!/bin/bash
set -e

echo "🔧 Entrypoint script starting..."

# Убедимся что start.sh исполняемый (хотя будем запускать через bash)
chmod +x start.sh || echo "chmod failed, will use bash directly"

# Запускаем основной скрипт через bash
exec bash start.sh 
#!/bin/bash

# Строка ошибки, которую ищем
ERROR_STRING="mkdir /root: read-only file system"
SCRIPT_NAME=$(basename "$0")
LOG_PREFIX="[${SCRIPT_NAME}]"

echo "$LOG_PREFIX 🧘‍♂️ Запускаем проверку сборки и запуска Docker..."

# Функция для логирования с префиксом
log() {
    echo "$LOG_PREFIX $1"
}

# Переменная для хранения вывода
output=""
exit_code=0

# Шаг 1: Попытка пересобрать ai-server без кэша
log "🛠️ Шаг 1: Пересборка 'ai-server' без кэша (docker-compose build --no-cache ai-server)..."
output=$(docker-compose build --no-cache ai-server 2>&1) || exit_code=$? # Захватываем stdout и stderr

if [ $exit_code -ne 0 ]; then
    log "⚠️ Сборка завершилась с ошибкой (код: $exit_code)."
fi

log "📜 Вывод команды сборки:"
echo "$output" # Показываем вывод для диагностики

# Проверка на искомую ошибку в выводе сборки
if echo "$output" | grep -q -F "$ERROR_STRING"; then
    log "❌ Обнаружена ошибка во время сборки: '$ERROR_STRING'"
    log "🚫 Проверка провалена на этапе сборки."
    exit 1
fi

# Шаг 2: Попытка запустить контейнеры (если сборка была успешной или ошибка не найдена)
log "🚀 Шаг 2: Запуск контейнеров (docker-compose up --build -d)..."
# Используем --build, чтобы поймать ошибки при запуске после свежей сборки
# Возможно, стоит добавить --force-recreate для чистоты эксперимента
output=$(docker-compose up --build -d 2>&1) || exit_code=$? # Захватываем stdout и stderr

if [ $exit_code -ne 0 ]; then
    log "⚠️ Запуск завершился с ошибкой (код: $exit_code)."
fi

log "📜 Вывод команды запуска:"
echo "$output" # Показываем вывод для диагностики

# Проверка на искомую ошибку в выводе запуска
if echo "$output" | grep -q -F "$ERROR_STRING"; then
    log "❌ Обнаружена ошибка во время запуска: '$ERROR_STRING'"
    log "🚫 Проверка провалена на этапе запуска."
    # Опционально: остановить контейнеры для чистоты
    log "🛑 Остановка контейнеров (docker-compose down)..."
    docker-compose down > /dev/null 2>&1 || true
    exit 1
fi

log "✅ Ошибка '$ERROR_STRING' не обнаружена ни на этапе сборки, ни на этапе запуска."
log "🕉️ Проверка Docker успешно завершена."

# Опционально: оставить контейнеры запущенными или остановить
log "🛑 Остановка контейнеров для чистоты (docker-compose down)..."
    docker-compose down > /dev/null 2>&1 || true

exit 0 
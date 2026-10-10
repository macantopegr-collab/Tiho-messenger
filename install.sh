#!/usr/bin/env bash
# Установка мессенджера «Тихо» на Ubuntu 22.04 / 24.04.
#
#   bash install.sh tiho-chat.ru     — со своим доменом (A-запись должна указывать на этот сервер)
#   bash install.sh                  — без домена: временный адрес вида 1-2-3-4.sslip.io
#
# Скрипт можно запускать повторно — так ставятся обновления. Данные и настройки сохраняются.
set -euo pipefail

DOMAIN="${1:-}"
APP_DIR=/opt/tiho
DATA_DIR=/var/lib/tiho
ENV_FILE=/etc/tiho.env
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31mОшибка: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "запустите от root: sudo bash install.sh $DOMAIN"
[ -f "$SRC_DIR/server.js" ] || die "запускайте скрипт из папки с мессенджером"
. /etc/os-release
[ "${ID:-}" = "ubuntu" ] || echo "Внимание: скрипт проверен на Ubuntu, у вас ${PRETTY_NAME:-неизвестная ОС}"

export DEBIAN_FRONTEND=noninteractive

say "Обновляю список пакетов и ставлю базовые утилиты"
apt-get update -y
apt-get install -y curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https build-essential python3 ufw

PUBLIC_IP="$(curl -4fsS https://api.ipify.org || curl -4fsS https://ifconfig.me || true)"
if [ -z "$DOMAIN" ]; then
  [ -n "$PUBLIC_IP" ] || die "не удалось узнать IP сервера, укажите домен: bash install.sh ваш-домен.ru"
  DOMAIN="${PUBLIC_IP//./-}.sslip.io"
  echo "Домен не указан — использую временный адрес $DOMAIN"
else
  DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN%%/*}"
  RESOLVED="$(getent ahostsv4 "$DOMAIN" | awk '{print $1; exit}' || true)"
  if [ -n "$PUBLIC_IP" ] && [ "$RESOLVED" != "$PUBLIC_IP" ]; then
    echo "Внимание: $DOMAIN сейчас указывает на '${RESOLVED:-никуда}', а IP сервера — $PUBLIC_IP."
    echo "HTTPS-сертификат выдадут, только когда A-запись домена будет указывать на $PUBLIC_IP."
    echo "Установка продолжится; сертификат получится сам, как только DNS обновится."
  fi
fi

say "Устанавливаю Node.js 22"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

say "Устанавливаю Caddy (веб-сервер с автоматическим HTTPS)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

say "Копирую мессенджер в $APP_DIR"
id tiho >/dev/null 2>&1 || useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin tiho
mkdir -p "$APP_DIR" "$DATA_DIR"
if [ "$SRC_DIR" != "$APP_DIR" ]; then
  rm -rf "$APP_DIR/public"
  cp -r "$SRC_DIR/server.js" "$SRC_DIR/package.json" "$SRC_DIR/package-lock.json" "$SRC_DIR/public" "$APP_DIR/"
  cp "$SRC_DIR/install.sh" "$APP_DIR/" 2>/dev/null || true
fi
cd "$APP_DIR"
npm ci --omit=dev --no-audit --no-fund
chown -R tiho:tiho "$DATA_DIR"
chmod 700 "$DATA_DIR"

if [ ! -f "$ENV_FILE" ]; then
  say "Создаю настройки $ENV_FILE"
  CODE="$(tr -dc 'a-z0-9' </dev/urandom | head -c 8)"
  cat > "$ENV_FILE" <<EOF
# Настройки «Тихо». После изменения: systemctl restart tiho
PORT=3000
HOST=127.0.0.1
DATA_DIR=$DATA_DIR
# Код приглашения для регистрации. Оставьте пустым, чтобы регистрироваться мог любой.
REGISTRATION_CODE=$CODE
# Максимальный размер файла, МБ
MAX_FILE_MB=25
EOF
  chmod 600 "$ENV_FILE"
fi

say "Настраиваю автозапуск"
cat > /etc/systemd/system/tiho.service <<EOF
[Unit]
Description=Тихо — мессенджер
After=network.target

[Service]
Type=simple
User=tiho
Group=tiho
EnvironmentFile=$ENV_FILE
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable tiho >/dev/null 2>&1
systemctl restart tiho

say "Настраиваю HTTPS для $DOMAIN"
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
	encode gzip
	request_body {
		max_size 30MB
	}
	header Strict-Transport-Security "max-age=31536000"
	reverse_proxy 127.0.0.1:3000
}
EOF
systemctl enable caddy >/dev/null 2>&1
systemctl restart caddy

say "Настраиваю файрвол (открыты только SSH, 80 и 443)"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

sleep 2
systemctl is-active --quiet tiho || { journalctl -u tiho -n 30 --no-pager; die "мессенджер не запустился (лог выше)"; }

CODE_NOW="$(grep '^REGISTRATION_CODE=' "$ENV_FILE" | cut -d= -f2-)"
printf '\n\033[1;32m✔ Готово!\033[0m\n\n'
echo "  Адрес:            https://$DOMAIN"
if [ -n "$CODE_NOW" ]; then
  echo "  Код приглашения:  $CODE_NOW   (нужен при регистрации; поменять — в $ENV_FILE)"
fi
echo
echo "  Первое открытие может занять до минуты, пока выпускается HTTPS-сертификат."
echo "  Логи:        journalctl -u tiho -f"
echo "  Перезапуск:  systemctl restart tiho"
echo "  Бэкап:       папка $DATA_DIR (база и зашифрованные файлы)"
echo

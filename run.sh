#!/usr/bin/env bash
# Запуск «Тихо» на сервере без прав администратора (контейнер, хостинг-панель).
#   bash run.sh
# Скачивает Node.js и cloudflared в домашнюю папку, запускает мессенджер
# и открывает его по HTTPS через бесплатный туннель Cloudflare.
# Повторный запуск перезапускает мессенджер. Переписка хранится в ~/tiho-data.
set -uo pipefail

APP="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="${TIHO_HOME:-${HOME:-}}"
if [ -z "$BASE" ] || [ ! -w "$BASE" ]; then BASE="$(dirname "$APP")"; fi
RT="$BASE/.tiho-runtime"
DATA="$BASE/tiho-data"
LOGS="$DATA/logs"
PORT="${PORT:-3000}"
export npm_config_cache="$RT/npm-cache"

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mОшибка: %s\033[0m\n' "$*" >&2; exit 1; }

mkdir -p "$RT" "$DATA" "$LOGS" || die "нет прав на запись в $BASE"

case "$(uname -m)" in
  x86_64|amd64) NODE_ARCH=x64; CF_ARCH=amd64 ;;
  aarch64|arm64) NODE_ARCH=arm64; CF_ARCH=arm64 ;;
  *) die "неподдерживаемый процессор: $(uname -m)" ;;
esac

# 1. Node.js
if [ ! -x "$RT/node/bin/node" ]; then
  say "Скачиваю Node.js 22"
  DIST="https://nodejs.org/dist/latest-v22.x"
  FILE="$(curl -fsSL "$DIST/SHASUMS256.txt" | grep -o "node-v[0-9.]*-linux-$NODE_ARCH\.tar\.gz" | head -1)"
  [ -n "$FILE" ] || die "не удалось получить список версий с nodejs.org"
  rm -rf "$RT/node" "$RT/node-tmp" && mkdir -p "$RT/node-tmp"
  curl -fsSL "$DIST/$FILE" | tar xz -C "$RT/node-tmp" --strip-components=1 || die "не удалось скачать Node.js"
  mv "$RT/node-tmp" "$RT/node"
fi
export PATH="$RT/node/bin:$PATH"
echo "Node.js $(node -v)"

# 2. Зависимости
if [ ! -f "$APP/node_modules/.tiho-ok" ] || [ "$APP/package-lock.json" -nt "$APP/node_modules/.tiho-ok" ]; then
  say "Устанавливаю зависимости"
  (cd "$APP" && npm ci --omit=dev --no-audit --no-fund) || die "npm не смог установить зависимости"
  touch "$APP/node_modules/.tiho-ok"
fi

# 3. Туннель Cloudflare (даёт HTTPS-адрес без открытия портов)
need_cf() { [ -z "${FXTUNNEL_TOKEN:-}" ]; }
if [ -f "$DATA/tiho.env" ]; then set -a; . "$DATA/tiho.env"; set +a; fi
if need_cf && [ ! -x "$RT/cloudflared" ]; then
  say "Скачиваю cloudflared"
  curl -fsSL -o "$RT/cloudflared.tmp" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$CF_ARCH" \
    || die "не удалось скачать cloudflared"
  chmod +x "$RT/cloudflared.tmp" && mv "$RT/cloudflared.tmp" "$RT/cloudflared"
fi

# 4. Настройки
ENV_FILE="$DATA/tiho.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF2'
# Настройки «Тихо». После изменения выполните: bash run.sh
MAX_FILE_MB=25

# Адрес через fxTunnel (fxtun.ru) — открывается в России без VPN.
# Токен: зарегистрируйтесь на fxtun.ru → «Токены» → «Создать ключ».
FXTUNNEL_TOKEN=
# Имя адреса: tiho-ivan → https://tiho-ivan.fxtun.ru (латиница, цифры, дефис)
FXTUNNEL_SUBDOMAIN=

# Вход через Google: Client ID из Google Cloud Console (см. ИНСТРУКЦИЯ.md)
GOOGLE_CLIENT_ID=

# Постоянный адрес через свой домен в Cloudflare (см. ИНСТРУКЦИЯ.md).
# Без этих строк адрес временный и меняется при каждом запуске.
CF_TUNNEL_TOKEN=
PUBLIC_URL=
EOF2
  chmod 600 "$ENV_FILE"
fi
# Старые настройки дополняем новыми полями
grep -q '^FXTUNNEL_TOKEN=' "$ENV_FILE" || printf '\n# Адрес через fxTunnel (fxtun.ru) — открывается в России без VPN.\n# Токен: зарегистрируйтесь на fxtun.ru → «Токены» → «Создать ключ».\nFXTUNNEL_TOKEN=\n# Имя адреса: tiho-ivan → https://tiho-ivan.fxtun.ru (латиница, цифры, дефис)\nFXTUNNEL_SUBDOMAIN=\n' >> "$ENV_FILE"
grep -q '^ADMINS=' "$ENV_FILE" || printf '\n# Модераторы жалоб: юзернеймы через запятую (пусто — первый зарегистрированный)\nADMINS=\n' >> "$ENV_FILE"
grep -q '^ANDROID_SHA256=' "$ENV_FILE" || printf '\n# Приложение Android: отпечаток ключа из сборки (fingerprint.txt, см. ИНСТРУКЦИЯ.md)\nANDROID_SHA256=\n' >> "$ENV_FILE"
grep -q '^TURN_URL=' "$ENV_FILE" || printf '\n# Звонки через сложные сети: свой TURN-сервер (см. ИНСТРУКЦИЯ.md)\nTURN_URL=\nTURN_SECRET=\n' >> "$ENV_FILE"
grep -q '^GIPHY_API_KEY=' "$ENV_FILE" || printf '\n# Поиск GIF: бесплатный ключ с developers.giphy.com (см. ИНСТРУКЦИЯ.md)\nGIPHY_API_KEY=\n' >> "$ENV_FILE"
grep -q '^GOOGLE_CLIENT_ID=' "$ENV_FILE" || printf '\n# Вход через Google: Client ID из Google Cloud Console (см. ИНСТРУКЦИЯ.md)\nGOOGLE_CLIENT_ID=\n' >> "$ENV_FILE"
grep -q '^CF_TUNNEL_TOKEN=' "$ENV_FILE" || printf '\n# Постоянный адрес через свой домен в Cloudflare (см. ИНСТРУКЦИЯ.md)\nCF_TUNNEL_TOKEN=\nPUBLIC_URL=\n' >> "$ENV_FILE"
set -a; . "$ENV_FILE"; set +a

# 5. Останавливаем прошлый запуск
for name in watchdog server tunnel; do
  if [ -f "$RT/$name.pid" ]; then kill "$(cat "$RT/$name.pid")" 2>/dev/null || true; rm -f "$RT/$name.pid"; fi
done
sleep 1

# 6. Мессенджер (если упадёт — сам перезапустится через 3 секунды)
say "Запускаю мессенджер"
cat > "$RT/watchdog.sh" <<EOF3
#!/usr/bin/env bash
while true; do
  PORT="$PORT" HOST=127.0.0.1 DATA_DIR="$DATA" "$RT/node/bin/node" --disable-warning=ExperimentalWarning "$APP/server.js" >> "$LOGS/server.log" 2>&1 &
  echo \$! > "$RT/server.pid"
  wait \$!
  echo "[\$(date '+%F %T')] мессенджер остановился, перезапуск" >> "$LOGS/server.log"
  sleep 3
done
EOF3
chmod +x "$RT/watchdog.sh"
nohup "$RT/watchdog.sh" > /dev/null 2>&1 &
echo $! > "$RT/watchdog.pid"
sleep 3
curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/config" || { tail -n 20 "$LOGS/server.log"; die "мессенджер не запустился (лог выше)"; }

# 7. Туннель
say "Открываю HTTPS-адрес"
: > "$LOGS/tunnel.log"
OK=""
if [ -n "${FXTUNNEL_TOKEN:-}" ]; then
  # fxTunnel — российский сервис, работает без VPN
  FXBIN="$HOME/.local/bin/fxtunnel"
  if [ ! -x "$FXBIN" ]; then
    say "Скачиваю fxTunnel"
    curl -fsSL https://fxtun.ru/install.sh | sh || die "не удалось установить fxTunnel"
  fi
  SUB="$(printf '%s' "${FXTUNNEL_SUBDOMAIN:-}" | tr 'A-Z' 'a-z' | tr -cd 'a-z0-9-' | cut -c1-32)"
  if [ -z "$SUB" ]; then
    SUB="tiho-$(head -c 4 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    sed -i "s/^FXTUNNEL_SUBDOMAIN=.*/FXTUNNEL_SUBDOMAIN=$SUB/" "$ENV_FILE"
  fi
  FXTUNNEL_TOKEN="$FXTUNNEL_TOKEN" nohup "$FXBIN" http "$PORT" --domain "$SUB" < /dev/null >> "$LOGS/tunnel.log" 2>&1 &
  echo $! > "$RT/tunnel.pid"
  URL="https://$SUB.fxtun.ru"
  for _ in $(seq 1 40); do
    code="$(curl -s -o /dev/null -w '%{http_code}' -H 'X-FxTunnel-Skip-Warning: 1' "$URL/api/config" || true)"
    [ "$code" = "200" ] && { OK=1; break; }
    kill -0 "$(cat "$RT/tunnel.pid")" 2>/dev/null || break
    sleep 1
  done
  [ -n "$OK" ] || { tail -n 15 "$LOGS/tunnel.log" | cut -c1-200; die "fxTunnel не подключился (лог выше). Проверьте токен или смените FXTUNNEL_SUBDOMAIN — имя может быть занято"; }
elif [ -n "${CF_TUNNEL_TOKEN:-}" ]; then
  # Постоянный туннель со своим доменом (настраивается в панели Cloudflare)
  nohup "$RT/cloudflared" tunnel --no-autoupdate --protocol http2 run --token "$CF_TUNNEL_TOKEN" >> "$LOGS/tunnel.log" 2>&1 &
  echo $! > "$RT/tunnel.pid"
  URL="${PUBLIC_URL:-}"
  [ -n "$URL" ] || URL="(адрес, который вы указали в Cloudflare)"
else
  nohup "$RT/cloudflared" tunnel --no-autoupdate --protocol http2 --url "http://127.0.0.1:$PORT" >> "$LOGS/tunnel.log" 2>&1 &
  echo $! > "$RT/tunnel.pid"
  URL=""
  for _ in $(seq 1 45); do
    URL="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOGS/tunnel.log" | head -1)"
    [ -n "$URL" ] && break
    kill -0 "$(cat "$RT/tunnel.pid")" 2>/dev/null || break
    sleep 1
  done
  [ -n "$URL" ] || { tail -n 20 "$LOGS/tunnel.log"; die "туннель не открылся (лог выше)"; }
fi
for _ in $(seq 1 40); do
  [ -n "$OK" ] && break
  grep -q 'Registered tunnel connection' "$LOGS/tunnel.log" && { OK=1; break; }
  kill -0 "$(cat "$RT/tunnel.pid")" 2>/dev/null || break
  sleep 1
done
[ -n "$OK" ] || { tail -n 15 "$LOGS/tunnel.log" | cut -c1-200; die "туннель не смог подключиться к Cloudflare (лог выше)"; }
echo "$URL" > "$DATA/url.txt"

printf '\n\033[1;32m✔ Мессенджер работает!\033[0m\n\n'
echo "  Адрес:            $URL"
echo
if [ -n "${GOOGLE_CLIENT_ID:-}" ]; then echo "  Вход через Google: включён"; else echo "  Вход через Google: выключен (нужен GOOGLE_CLIENT_ID в $ENV_FILE)"; fi
if [ -z "${CF_TUNNEL_TOKEN:-}" ] && [ -z "${FXTUNNEL_TOKEN:-}" ]; then
  echo
  echo "  Адрес временный и меняется при каждом перезапуске."
  echo "  В России trycloudflare.com часто открывается только с VPN — подключите fxTunnel:"
  echo "  впишите FXTUNNEL_TOKEN в $ENV_FILE и снова выполните bash run.sh (см. ИНСТРУКЦИЯ.md)"
fi
if [ -n "${FXTUNNEL_TOKEN:-}" ]; then
  echo "  Адрес постоянный, пока сервер запущен. Если сервер перезагрузится — снова выполните bash run.sh"
fi
echo "  Логи:  tail -f $LOGS/server.log"
echo

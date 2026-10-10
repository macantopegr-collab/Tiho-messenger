# Тихо

Мессенджер со сквозным шифрованием: личные и групповые чаты, фото и файлы, светлая и тёмная тема.
Сообщения шифруются в браузере — сервер хранит только шифротекст.

## Запуск на сервере без прав администратора (контейнер, хостинг-панель)

```
cd ~ && rm -rf Tiho-messenger-main && curl -fsSL https://github.com/macantopegr-collab/tiho-messenger/archive/refs/heads/main.tar.gz | tar xz && cd Tiho-messenger-main && bash run.sh
```

Переписка хранится в `~/tiho-data` и не удаляется при обновлении.

## Установка на полноценный VPS с root (Ubuntu 22.04 / 24.04)

В консоли сервера:

```
curl -fsSL https://github.com/macantopegr-collab/tiho-messenger/archive/refs/heads/main.tar.gz | tar xz && cd Tiho-messenger-main && bash install.sh
```

Со своим доменом — допишите его в конце: `bash install.sh tiho-chat.ru`.

Подробно — в [ИНСТРУКЦИЯ.md](ИНСТРУКЦИЯ.md).

# Тихо

Мессенджер со сквозным шифрованием: личные и групповые чаты, фото и файлы, светлая и тёмная тема.
Сообщения шифруются в браузере — сервер хранит только шифротекст.

## Установка на сервер (Ubuntu 22.04 / 24.04)

В консоли сервера:

```
curl -fsSL https://github.com/macantopegr-collab/tiho-messenger/archive/refs/heads/main.tar.gz | tar xz && cd tiho-messenger-main && bash install.sh
```

Со своим доменом — допишите его в конце: `bash install.sh tiho-chat.ru`.

Подробно — в [ИНСТРУКЦИЯ.md](ИНСТРУКЦИЯ.md).

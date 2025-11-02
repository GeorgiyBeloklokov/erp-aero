# Сервис ERP Aero

Бэкенд-сервис для ERP Aero, предоставляющий функции аутентификации пользователей, управления файлами и получения информации о пользователях.

### Предварительные требования

*   Node.js (рекомендуется LTS версия)
*   Docker и Docker Compose (Docker через WSL или docker compose в линукс)
*   Postman (для тестирования API) или curl

### Установка

1.  **Клонируйте репозиторий:**
    ```bash
    git clone <repository_url>
    cd erp-aero
    ```

2.  **Установите зависимости:**
    ```bash
    npm install
    ```

3.  **Переменные окружения:**
    *  Переименуйте файл `.env.example` в `.env` в корневой директории 
    

4.  **Соберите и запустите контейнеры:**
    ```bash
    docker-compose up --build
    ```
    *   Убедитесь, что ваш сервер MySQL запущен. `docker compose ps` или `docker-compose ps`


5.  **Инициализируйте схему базы данных::**

    ```bash
    npm run db:init
    ```

6.  **Запустите сервер в режиме разработки (с горячей перезагрузкой):**
    ```bash
    npm run dev
    ```
    Или, чтобы запустить сервер в производственном режиме:
    ```bash
    npm start
    ```
    Сервер будет работать на порту, указанном в вашем файле `.env` (по умолчанию: 3000).


## Тестирование API с помощью Postman

Вы можете тестировать конечные точки API с помощью Postman.

1.  **Импортируйте коллекцию API:**
    *   Вам потребуется создать коллекцию Postman для этого API.
    *   Вручную создайте запросы для следующих конечных точек:

2.  **Конечные точки аутентификации:**
    *   `POST http://localhost:3000/auth/signup`
        *   Тело: `{ "login": "testuser", "password": "password123" }`
    *   `POST http://localhost:3000/auth/signin`
        *   Тело: `{ "login": "testuser", "password": "password123" }`
    *   `POST http://localhost:3000/auth/signin/new_token`
        *   Тело: `{ "refreshToken": "your_refresh_token_here" }`
    *   `GET http://localhost:3000/auth/logout`
        *   Заголовки: `Authorization: Bearer your_access_token_here`

3.  **Конечные точки управления файлами:**
    *   `POST http://localhost:3000/file/upload`
        *   Заголовки: `Authorization: Bearer your_access_token_here`
        *   Тело: `form-data` с файлом.
    *   `GET http://localhost:3000/file/list`
        *   Заголовки: `Authorization: Bearer your_access_token_here`
        *   Параметры запроса: `list_size`, `page` (опционально)
    *   `DELETE http://localhost:3000/file/delete/:id`
        *   Заголовки: `Authorization: Bearer your_access_token_here`
    *   `GET http://localhost:3000/file/:id`
        *   Заголовки: `Authorization: Bearer your_access_token_here`
    *   `GET http://localhost:3000/file/download/:id`
        *   Заголовки: `Authorization: Bearer your_access_token_here`
    *   `PUT http://localhost:3000/file/update/:id`
        *   Заголовки: `Authorization: Bearer your_access_token_here`
        *   Тело: `form-data` с новым файлом.

4.  **Конечные точки информации о пользователе:**
    *   `GET http://localhost:3000/user/info`
        *   Заголовки: `Authorization: Bearer your_access_token_here`

*Не забудьте заменить `your_access_token_here`/`your_refresh_token_here` на фактические токены, полученные в результате запросов на вход/обновление токена.*
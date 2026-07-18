# ИИ-генератор ReadFox через OpenRouter

Cloudflare Worker обращается к бесплатному маршрутизатору моделей `openrouter/free`. Ключ OpenRouter хранится как зашифрованный секрет Worker и не попадает в GitHub Pages или репозиторий. Корневой `wrangler.jsonc` объединяет статический сайт, перевод русской темы через `/translate` и генерацию английского текста через `/generate` в одном Worker `readfox`.

## Развёртывание из GitHub

1. Отправьте актуальные файлы проекта в GitHub.
2. В настройках сборки Worker `readfox` укажите команду `npx wrangler deploy`.
3. Убедитесь, что в `Variables and Secrets` сохранён Secret `OPENROUTER_API_KEY`.
4. Запустите новый deploy.

## Развёртывание через Wrangler

1. Откройте терминал в корневой папке ReadFox.
2. Авторизуйтесь в Cloudflare: `npx wrangler login`.
3. Разверните Worker: `npx wrangler deploy`.
4. Добавьте ключ безопасной командой: `npx wrangler secret put OPENROUTER_API_KEY`.
5. Вставьте ключ в скрытое поле терминала и подтвердите ввод.

Пример:

```js
window.READFOX_CONFIG = Object.freeze({
  aiGeneratorEndpoint: "https://readfox.gemerpc.workers.dev/generate"
});
```

В `worker/src/index.mjs` разрешены домены `https://gemerpc.github.io` и `https://readfox.gemerpc.workers.dev`. Если адрес сайта изменится, обновите `ALLOWED_ORIGINS` и повторите deploy.

Не записывайте ключ в `js/config.js`, `wrangler.jsonc` или другие файлы проекта. При русской теме ReadFox сначала получает английскую формулировку через `/translate`, а затем передаёт её в `/generate`. Если подключённый AI недоступен, интерфейс показывает ошибку и не подменяет результат локальным шаблоном.

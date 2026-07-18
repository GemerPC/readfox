export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Безопасная проверка: ключ существует или нет.
    // Само значение ключа никогда не возвращается.
    if (url.pathname === "/api/test") {
      return Response.json({
        ok: true,
        openRouterKeyAdded: Boolean(env.OPENROUTER_API_KEY),
      });
    }

    // Обычные HTML, CSS и JS сайта.
    return env.ASSETS.fetch(request);
  },
};

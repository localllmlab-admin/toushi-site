/** Ollama / OpenRouter 最小クライアント（依存ゼロ） */
export async function ollamaChat(cfg, messages, overrides = {}) {
  const res = await fetch(`${cfg.ollama.baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: overrides.model || cfg.ollama.draftModel,
      messages,
      stream: false,
      options: { ...cfg.ollama.options, ...(overrides.options || {}) },
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.message?.content ?? "";
}

/** API磨きは記事1本につきこの1呼び出しのみ（コスト規律） */
export async function polishViaApi(cfg, systemPrompt, article) {
  const key = process.env[cfg.polish.apiKeyEnv];
  if (!key) throw new Error(`${cfg.polish.apiKeyEnv} が未設定`);
  const res = await fetch(cfg.polish.baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: cfg.polish.model,
      max_tokens: cfg.polish.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: article },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Polish API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

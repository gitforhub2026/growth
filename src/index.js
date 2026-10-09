function mimeType(key) {
  const k = key.toLowerCase();
  if (k.endsWith(".m4a")) return "audio/mp4";
  if (k.endsWith(".webp")) return "image/webp";
  if (k.endsWith(".png")) return "image/png";
  if (k.endsWith(".jpg") || k.endsWith(".jpeg")) return "image/jpeg";
  if (k.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function objectHeaders(object, key) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=86400");
  headers.set("content-type", mimeType(key));
  return headers;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function health(env) {
  if (!env.AUDIO) return json({ ok: false, binding: false, object01: false }, 503);
  try {
    const object = await env.AUDIO.head("01.m4a");
    return json({ ok: Boolean(object), binding: true, object01: Boolean(object) }, object ? 200 : 404);
  } catch (error) {
    return json({ ok: false, binding: true, object01: false, error: String(error) }, 500);
  }
}

async function saveFeedback(request, env) {
  if (!env.AUDIO) return json({ ok: false, message: "暫時無法送出，請稍後再試。" }, 503);
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8192) return json({ ok: false, message: "內容太長，請稍微精簡後再送出。" }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "送出的內容格式不正確。" }, 400);
  }

  if (String(body.website || "").trim()) return json({ ok: true });

  const name = String(body.name || "").trim().slice(0, 80);
  const contact = String(body.contact || "").trim().slice(0, 160);
  const message = String(body.message || "").trim();

  if (message.length < 2) return json({ ok: false, message: "請留下一點想告訴我們的內容。" }, 400);
  if (message.length > 2500) return json({ ok: false, message: "內容太長，請控制在 2500 字以內。" }, 400);

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const safeTime = now.toISOString().replace(/[:.]/g, "-");
  const id = crypto.randomUUID();
  const key = `feedback/${date}/${safeTime}-${id}.json`;

  const record = {
    name,
    contact,
    message,
    createdAt: now.toISOString(),
    page: request.headers.get("referer") || "",
    userAgent: (request.headers.get("user-agent") || "").slice(0, 300),
  };

  try {
    await env.AUDIO.put(key, JSON.stringify(record, null, 2), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
      customMetadata: { source: "growth-toolkit" },
    });
    return json({ ok: true, message: "謝謝你的建議，我們收到了。" });
  } catch (error) {
    return json({ ok: false, message: "暫時無法送出，請稍後再試。" }, 500);
  }
}

async function serveObject(request, env, key, allowed) {
  if (!env.AUDIO) return new Response("Storage unavailable", { status: 503 });
  if (!key || key.includes("..") || !allowed(key.toLowerCase())) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    if (request.method === "HEAD") {
      const object = await env.AUDIO.head(key);
      if (!object) return new Response("Not Found", { status: 404 });
      const headers = objectHeaders(object, key);
      headers.set("content-length", String(object.size));
      return new Response(null, { status: 200, headers });
    }

    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const rangeRequested = request.headers.has("range");
    const object = await env.AUDIO.get(key, rangeRequested ? { range: request.headers } : undefined);
    if (!object) return new Response("Not Found", { status: 404 });

    const headers = objectHeaders(object, key);
    let status = 200;
    if (rangeRequested && object.range) {
      status = 206;
      const offset = object.range.offset ?? 0;
      const length = object.range.length ?? Math.max(0, object.size - offset);
      const end = offset + length - 1;
      headers.set("content-range", `bytes ${offset}-${end}/${object.size}`);
      headers.set("content-length", String(length));
    } else {
      headers.set("content-length", String(object.size));
    }
    return new Response(object.body, { status, headers });
  } catch (error) {
    return new Response(`Storage error: ${String(error)}`, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/audio-health") return health(env);
    if (url.pathname === "/feedback") return saveFeedback(request, env);
    if (url.pathname === "/__light-audio-index") {
      if (!env.AUDIO) return json({ ok: false, objects: [] }, 503);
      const listed = await env.AUDIO.list({ prefix: "light/", limit: 1000 });
      return json({ ok: true, objects: listed.objects.map(o => ({ key: o.key, size: o.size, uploaded: o.uploaded })) });
    }

    if (url.pathname.startsWith("/audio/")) {
      let key;
      try { key = decodeURIComponent(url.pathname.slice("/audio/".length)); }
      catch { return new Response("Bad Request", { status: 400 }); }
      return serveObject(request, env, key, k => k.endsWith(".m4a"));
    }

    if (url.pathname.startsWith("/media/")) {
      let key;
      try { key = decodeURIComponent(url.pathname.slice("/media/".length)); }
      catch { return new Response("Bad Request", { status: 400 }); }
      return serveObject(request, env, key, k => /\.(webp|png|jpe?g|pdf)$/.test(k));
    }

    return env.ASSETS.fetch(request);
  },
};

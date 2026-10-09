function mimeType(key) {
  const k = key.toLowerCase();
  if (k.endsWith(".m4a")) return "audio/mp4";
  if (k.endsWith(".mp3")) return "audio/mpeg";
  if (k.endsWith(".aac")) return "audio/aac";
  if (k.endsWith(".wav")) return "audio/wav";
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

const NORTH_STAR_KEY = "north-star/state.json";
const NORTH_STAR_WRITE_HASH = "732d82e5fdbeb4536d6d64cf4c3e5b3dd3216325a37bd32a6f3037b81062ed95";
const NORTH_STAR_ALLOWED_ORIGIN = "https://page.notesss.workers.dev";

function northStarCors(request) {
  const origin = request.headers.get("origin") || "";
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-methods": "GET, PUT, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    "vary": "Origin",
  });
  if (origin === NORTH_STAR_ALLOWED_ORIGIN) headers.set("access-control-allow-origin", origin);
  return headers;
}

function northStarResponse(request, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: northStarCors(request) });
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function northStarAuthorized(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  return (await sha256Hex(token)) === NORTH_STAR_WRITE_HASH;
}

async function northStarData(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: northStarCors(request) });
  if (!env.AUDIO) return northStarResponse(request, { ok: false, message: "Storage unavailable" }, 503);

  if (request.method === "GET") {
    try {
      const object = await env.AUDIO.get(NORTH_STAR_KEY);
      if (!object) return northStarResponse(request, { ok: true, data: null });
      const data = JSON.parse(await object.text());
      return northStarResponse(request, { ok: true, data });
    } catch (error) {
      return northStarResponse(request, { ok: false, message: "讀取失敗", error: String(error) }, 500);
    }
  }

  if (request.method === "PUT") {
    if (!(await northStarAuthorized(request))) return northStarResponse(request, { ok: false, message: "編輯金鑰不正確" }, 401);

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 150000) return northStarResponse(request, { ok: false, message: "資料太大" }, 413);

    let body;
    try { body = await request.json(); }
    catch { return northStarResponse(request, { ok: false, message: "資料格式錯誤" }, 400); }

    if (!body || !Array.isArray(body.tree)) return northStarResponse(request, { ok: false, message: "缺少 tree 資料" }, 400);

    const record = {
      version: 1,
      updatedAt: new Date().toISOString(),
      tree: body.tree,
    };

    try {
      const previous = await env.AUDIO.get(NORTH_STAR_KEY);
      if (previous) {
        const oldText = await previous.text();
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        await env.AUDIO.put(`north-star/backups/${stamp}.json`, oldText, {
          httpMetadata: { contentType: "application/json; charset=utf-8" },
        });
      }

      await env.AUDIO.put(NORTH_STAR_KEY, JSON.stringify(record, null, 2), {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });
      return northStarResponse(request, { ok: true, data: record });
    } catch (error) {
      return northStarResponse(request, { ok: false, message: "儲存失敗", error: String(error) }, 500);
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, PUT, OPTIONS" } });
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
  const page = request.headers.get("referer") || "";
  const source = body.source === "light-house" || page.includes("/light/") ? "light-house" : "growth-toolkit";

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
    source,
    createdAt: now.toISOString(),
    page,
    userAgent: (request.headers.get("user-agent") || "").slice(0, 300),
  };

  try {
    await env.AUDIO.put(key, JSON.stringify(record, null, 2), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
      customMetadata: { source },
    });
    return json({ ok: true, message: "謝謝你的建議，我們收到了。" });
  } catch (error) {
    return json({ ok: false, message: "暫時無法送出，請稍後再試。" }, 500);
  }
}

async function serveObject(request, bucket, key, allowed) {
  if (!bucket) return new Response("Storage unavailable", { status: 503 });
  if (!key || key.includes("..") || !allowed(key.toLowerCase())) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    if (request.method === "HEAD") {
      const object = await bucket.head(key);
      if (!object) return new Response("Not Found", { status: 404 });
      const headers = objectHeaders(object, key);
      headers.set("content-length", String(object.size));
      return new Response(null, { status: 200, headers });
    }

    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const rangeRequested = request.headers.has("range");
    const object = await bucket.get(key, rangeRequested ? { range: request.headers } : undefined);
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

const LIGHT_FEEDBACK_MARKUP = `
<section class="light-feedback" aria-labelledby="light-feedback-title">
  <div class="light-feedback-mark" aria-hidden="true">✎</div>
  <div class="light-feedback-copy">
    <div class="eyebrow">CONTACT · SUGGESTIONS</div>
    <h2 id="light-feedback-title">歡迎留下建議</h2>
    <p>如果有收聽心得、想聽的主題，或希望我們增加哪一類內容，都可以直接告訴我們。</p>
    <form class="light-feedback-form" id="light-feedback-form">
      <div class="light-feedback-fields">
        <label><span>怎麼稱呼您？ <small>選填</small></span><input type="text" name="name" maxlength="80" autocomplete="name" placeholder="姓名／暱稱"></label>
        <label><span>Email／聯絡方式 <small>選填</small></span><input type="text" name="contact" maxlength="160" autocomplete="email" placeholder="方便回覆時再留下即可"></label>
      </div>
      <label><span>想告訴我們什麼？</span><textarea name="message" required minlength="2" maxlength="2500" rows="5" placeholder="收聽心得、想聽的主題、內容建議……"></textarea></label>
      <label class="light-feedback-honeypot" aria-hidden="true">網站<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
      <div class="light-feedback-submit-row">
        <button class="light-feedback-submit" type="submit">送出建議</button>
        <div class="light-feedback-status" id="light-feedback-status" role="status" aria-live="polite"></div>
      </div>
    </form>
  </div>
</section>`;

const EMPTY_FAVICON = '<link rel="icon" href="data:,">';

async function serveAssetPage(request, env, url) {
  const response = await env.ASSETS.fetch(request);
  if (request.method !== "GET" || !response.ok) return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (path === "/" || path === "/index.html") {
    return new HTMLRewriter()
      .on("head", {
        element(element) {
          element.append(`${EMPTY_FAVICON}<link rel="stylesheet" href="/ux-fixes.css">`, { html: true });
        },
      })
      .on("body", {
        element(element) {
          element.append('<script src="/ux-fixes.js"></script>', { html: true });
        },
      })
      .transform(response);
  }

  if (path === "/light" || path === "/light/index.html") {
    return new HTMLRewriter()
      .on("head", {
        element(element) {
          element.append(`${EMPTY_FAVICON}<link rel="stylesheet" href="/light-feedback.css"><link rel="stylesheet" href="/light-ux.css">`, { html: true });
        },
      })
      .on("footer.footer", {
        element(element) {
          element.before(LIGHT_FEEDBACK_MARKUP, { html: true });
        },
      })
      .on("body", {
        element(element) {
          element.append('<script src="/light-feedback.js"></script><script src="/light-ux.js"></script>', { html: true });
        },
      })
      .transform(response);
  }

  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/audio-health") return health(env);
    if (url.pathname === "/feedback") return saveFeedback(request, env);
    if (url.pathname === "/north-star-data") return northStarData(request, env);

    if (url.pathname.startsWith("/audio/")) {
      let key;
      try { key = decodeURIComponent(url.pathname.slice("/audio/".length)); }
      catch { return new Response("Bad Request", { status: 400 }); }
      return serveObject(request, env.AUDIO, key, k => k.endsWith(".m4a"));
    }

    if (url.pathname.startsWith("/light-audio/")) {
      let key;
      try { key = decodeURIComponent(url.pathname.slice("/light-audio/".length)); }
      catch { return new Response("Bad Request", { status: 400 }); }
      return serveObject(request, env.LIGHT_AUDIO, key, k => /\.(m4a|mp3|aac|wav)$/.test(k));
    }

    if (url.pathname.startsWith("/media/")) {
      let key;
      try { key = decodeURIComponent(url.pathname.slice("/media/".length)); }
      catch { return new Response("Bad Request", { status: 400 }); }
      return serveObject(request, env.AUDIO, key, k => /\.(webp|png|jpe?g|pdf)$/.test(k));
    }

    return serveAssetPage(request, env, url);
  },
};
function baseHeaders(object) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=86400");
  headers.set("content-type", "audio/mp4");
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

async function serveAudio(request, env, key) {
  if (!env.AUDIO) return new Response("Audio storage unavailable", { status: 503 });
  if (!key || key.includes("..") || !key.toLowerCase().endsWith(".m4a")) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    if (request.method === "HEAD") {
      const object = await env.AUDIO.head(key);
      if (!object) return new Response("Not Found", { status: 404 });
      const headers = baseHeaders(object);
      headers.set("content-length", String(object.size));
      return new Response(null, { status: 200, headers });
    }

    if (request.method !== "GET") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const rangeRequested = request.headers.has("range");
    const object = await env.AUDIO.get(
      key,
      rangeRequested ? { range: request.headers } : undefined
    );

    if (!object) return new Response("Not Found", { status: 404 });

    const headers = baseHeaders(object);
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
    return new Response(`Audio error: ${String(error)}`, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/audio-health") {
      return health(env);
    }

    if (url.pathname.startsWith("/audio/")) {
      let key;
      try {
        key = decodeURIComponent(url.pathname.slice("/audio/".length));
      } catch {
        return new Response("Bad Request", { status: 400 });
      }
      return serveAudio(request, env, key);
    }

    return env.ASSETS.fetch(request);
  },
};

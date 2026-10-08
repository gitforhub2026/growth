function audioHeaders(object) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=86400");
  headers.set("content-type", "audio/mp4");
  return headers;
}

async function serveAudio(request, env, key) {
  if (!key || key.includes("..") || !key.toLowerCase().endsWith(".m4a")) {
    return new Response("Not Found", { status: 404 });
  }

  if (request.method === "HEAD") {
    const object = await env.AUDIO.head(key);
    if (!object) return new Response("Not Found", { status: 404 });

    const headers = audioHeaders(object);
    headers.set("content-length", String(object.size));
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const object = await env.AUDIO.get(key, {
    onlyIf: request.headers,
    range: request.headers,
  });

  if (!object) return new Response("Not Found", { status: 404 });

  const headers = audioHeaders(object);

  if (!("body" in object)) {
    return new Response(null, { status: 412, headers });
  }

  let status = 200;
  if (request.headers.has("range") && object.range) {
    status = 206;
    const offset = object.range.offset ?? 0;
    const length = object.range.length ?? (object.size - offset);
    const end = offset + length - 1;
    headers.set("content-range", `bytes ${offset}-${end}/${object.size}`);
    headers.set("content-length", String(length));
  } else {
    headers.set("content-length", String(object.size));
  }

  return new Response(object.body, { status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

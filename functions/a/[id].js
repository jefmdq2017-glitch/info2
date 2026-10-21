export async function onRequest({ params, request, env }) {
  const u = new URL(request.url);
  const rawId = (params.id || '').trim();

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const sinAviso = rawId.replace(/^aviso-/, '');

  const candidatos = [
    `${rawId}.json`,
    `aviso-${sinAviso}.json`,
    `${sinAviso}.json`
  ];

  let data = null;
  for (const f of [...new Set(candidatos)]) {
    try {
      const r = await env.ASSETS.fetch(new Request(`${u.origin}/${f}`));
      if (r.ok) { data = await r.json(); break; }
    } catch {}
  }

  if (!data) return Response.redirect(u.origin + '/', 302);

  const titulo = data.nombre || data.titulo || rawId;
  const desc = data.slogan || data.direccion || data.subtitulo || '';
  let foto = data.imagen_fachada || data.imagen_frente || data.imagen || data.foto || '';

  if (!foto.startsWith('http')) {
    foto = `${u.origin}/${foto.replace(/^\.?\//, '')}`;
  }
  foto = encodeURI(foto);

  const destino = `${u.origin}/?aviso=${encodeURIComponent(data.id || rawId)}`;

  return new Response(`<!doctype html>
<html><head>
<meta charset="utf-8">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(foto)}">
<meta property="og:url" content="${esc(u.href)}">
<meta property="og:type" content="article">
</head><body><script>location.replace(${JSON.stringify(destino)})</script></body></html>`, 
  { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function onRequest({ params, request, env }) {
  const u = new URL(request.url);
  const rawId = (params.id || '').trim();

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // Intenta varios nombres posibles de JSON para el mismo aviso
  const candidatos = [
    `${rawId}.json`,
    `aviso-${rawId}.json`,
    `${rawId.replace(/^aviso-/, '')}.json`,
    `aviso-${rawId.replace(/^aviso-/, '')}.json`,
    `aviso-lavanderia.json`,
    `aviso-los-mellis.json`
  ];

  let a = null;
  for (const file of [...new Set(candidatos)]) {
    try {
      const r = await env.ASSETS.fetch(new Request(`${u.origin}/${file}`));
      if (r.ok) {
        a = await r.json();
        break;
      }
    } catch {}
  }

  if (!a) {
    return Response.redirect(u.origin + '/', 302);
  }

  const titulo = a.nombre || a.titulo || 'Comercio en INFO MDQ SUR HOY';
  const descripcion = a.slogan || a.subtitulo || a.direccion || a.mp || 'Mirá esta publicación en nuestro portal local.';
  const fotoRaw = a.imagen_fachada || a.imagen_frente || a.imagen || a.foto || a.foto_perfil || a.logo_circle || '';

  if (!fotoRaw) {
    return Response.redirect(u.origin + '/', 302);
  }

  // URL absoluta y codificada para Facebook
  let img = fotoRaw.trim();
  if (!img.startsWith('http')) {
    img = `${u.origin}/${img.replace(/^\.?\//, '')}`;
  }
  // Codifica espacios y caracteres raros, pero no rompe los :
  img = encodeURI(img);

  const destino = `${u.origin}/?aviso=${encodeURIComponent(a.id || rawId)}`;

  return new Response(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${esc(titulo)}</title>
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(descripcion)}">
  <meta property="og:image" content="${esc(img)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${esc(u.href)}">
  <meta property="og:site_name" content="INFO MDQ HOY">
  <meta name="twitter:card" content="summary_large_image">
  <noscript><meta http-equiv="refresh" content="0;url=${esc(destino)}"></noscript>
</head>
<body>
  <script>location.replace(${JSON.stringify(destino)})</script>
  <a href="${esc(destino)}">Ver aviso en INFO MDQ SUR HOY</a>
</body>
</html>`, {
    headers: { 
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}

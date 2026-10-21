export async function onRequest({ params, request, env }) {
  const u = new URL(request.url);
  const id = params.id; // ej: "farmacia-vara"

  try {
    // Busca directamente el archivo JSON individual del comercio
    const r = await env.ASSETS.fetch(new Request(`${u.origin}/${id}.json`));
    
    if (!r.ok) {
      return Response.redirect(u.origin + '/', 302);
    }

    const a = await r.json();

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    // Mapeo de tus campos reales del JSON
    const titulo = a.nombre || a.titulo || 'Comercio en INFO MDQ SUR HOY';
    const descripcion = a.slogan || a.subtitulo || a.mp || 'Mirá esta publicación en nuestro portal local.';
    const foto = a.imagen_frente || a.imagen || 'banner1.jpg';
    
    const img = foto.startsWith('http') ? foto : `${u.origin}/${foto.replace(/^\//, '')}`;
    const destino = `${u.origin}/?aviso=${encodeURIComponent(id)}`;

    return new Response(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${esc(titulo)}</title>
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(descripcion)}">
  <meta property="og:image" content="${esc(img)}">
  <meta property="og:url" content="${esc(u.href)}">
  <meta name="twitter:card" content="summary_large_image">
  <noscript><meta http-equiv="refresh" content="0;url=${esc(destino)}"></noscript>
</head>
<body>
  <script>location.replace(${JSON.stringify(destino)})</script>
  <a href="${esc(destino)}">Ver aviso en INFO MDQ SUR HOY</a>
</body>
</html>`, {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });

  } catch (err) {
    return Response.redirect(u.origin + '/', 302);
  }
}

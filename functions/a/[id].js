export async function onRequest({ params, request, env }) {
  const u = new URL(request.url);
  const rawId = (params.id || '').trim().toLowerCase();

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // LISTA REAL DE TUS ARCHIVOS - sacada de tu captura
  // Si agregás uno nuevo, solo lo agregás acá abajo
  const ARCHIVOS_COMERCIOS = [
    'farmacia-vara.json',
    'amapolas-dietetica.json',
    'julia-moscoloni.json',
    'aviso-kevin.json',
    'aviso-lavanderia.json',
    'aviso-los-mellis.json',
    'cortes-edea.json'
  ];

  let data = null;

  for (const archivo of ARCHIVOS_COMERCIOS) {
    try {
      const r = await env.ASSETS.fetch(new Request(`${u.origin}/${archivo}`));
      if (!r.ok) continue;
      const j = await r.json();
      const idDelJson = String(j.id || '').toLowerCase();
      const nombreArchivoSinJson = archivo.replace('.json','').toLowerCase();
      
      // Coincide si: id del json es igual, o el nombre del archivo es igual, o con/sin prefijo aviso-
      if (
        idDelJson === rawId ||
        idDelJson === `aviso-${rawId}` ||
        rawId === `aviso-${idDelJson}` ||
        nombreArchivoSinJson === rawId ||
        nombreArchivoSinJson === `aviso-${rawId}` ||
        rawId === nombreArchivoSinJson.replace(/^aviso-/, '')
      ) {
        data = j;
        break;
      }
    } catch {}
  }

  if (!data) return Response.redirect(u.origin + '/', 302);

  const titulo = data.nombre || data.titulo || rawId;
  const desc = data.slogan || data.direccion || data.subtitulo || '';
  let foto = data.imagen_fachada || data.imagen_frente || data.imagen || data.foto || '';

  if (!foto) return Response.redirect(u.origin + '/', 302);

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

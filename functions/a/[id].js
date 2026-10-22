const slug = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const g = (a, ...ks) => { for (const k of ks) if (a[k] != null && a[k] !== '') return a[k]; return ''; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Mapeo exacto entre el slug de la URL y el nombre real del archivo JSON en tu carpeta
const mapaArchivos = {
    'farmacia-vara': 'farmacia-vara.json',
    'amapola': 'amapolas-dietetica.json',
    'julia': 'julia-moscoloni.json',
    'kevin': 'aviso-kevin.json',
    'los-mellis': 'aviso-los-mellis.json',
    'nannin': 'nannin.json' // Ajustá el nombre si el de nannin se llama distinto en tu carpeta
};

export async function onRequest({ params, request, env }) {
  const u = new URL(request.url);
  let clave = params.id; try { clave = decodeURIComponent(clave); } catch {}
  const k = slug(clave);

  const archivoJson = mapaArchivos[k];
  if (!archivoJson) {
    return Response.redirect(u.origin + '/', 302);
  }

  try {
    const r = await env.ASSETS.fetch(new Request(u.origin + '/' + archivoJson));
    if (!r.ok) return Response.redirect(u.origin + '/', 302);
    const a = await r.json();

    const titulo = g(a, 'titulo', 'title', 'nombre') || 'Aviso';
    const desc = g(a, 'descripcion', 'description', 'texto', 'detalle');
    let img = String(g(a, 'imagen', 'image', 'foto', 'img') || 'banner1.jpg');
    if (!/^https?:\/\//.test(img)) img = u.origin + '/' + img.replace(/^\.?\//, '');
    const destino = u.origin + '/?aviso=' + encodeURIComponent(k);

    return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(titulo)}</title>
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="${esc(u.href)}">
<meta name="twitter:card" content="summary_large_image">
<noscript><meta http-equiv="refresh" content="0;url=${esc(destino)}"></noscript>
</head><body><script>location.replace(${JSON.stringify(destino)})</script>
<a href="${esc(destino)}">Ver aviso</a></body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } });
  } catch (e) {
    return Response.redirect(u.origin + '/', 302);
  }
}

const slug = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const g = (a, ...ks) => { for (const k of ks) if (a[k] != null && a[k] !== '') return a[k]; return ''; };
const aplanar = d => Array.isArray(d)
  ? d.flatMap(x => (x && typeof x === 'object' && !Array.isArray(x) && ('titulo' in x || 'title' in x || 'id' in x)) ? [x] : aplanar(x))
  : (d && typeof d === 'object') ? Object.values(d).flatMap(aplanar) : [];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function onRequest({ params, request, env }) {
  const u = new URL(request.url);
  const r = await env.ASSETS.fetch(new Request(u.origin + '/avisos.json'));
  if (!r.ok) return new Response('No pude leer avisos.json', {status: 500});
  const lista = aplanar(await r.json());

  if (params.id === '_ids') {
    return new Response(JSON.stringify(lista.map((a, i) => ({
      n: i + 1, id: a.id, titulo: g(a, 'titulo', 'title', 'nombre'),
      slug_final: slug(g(a, 'id', 'slug', 'titulo', 'title', 'nombre')),
      enlace: '/a/' + slug(g(a, 'id', 'slug', 'titulo', 'title', 'nombre'))
    })), null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
  }

  let clave = params.id; try { clave = decodeURIComponent(clave); } catch {}
  const k = slug(clave);
  // Busca por ID primero, después por slug/titulo
  let a = lista.find(x => String(g(x,'id')).trim() === clave.trim());
  if (!a) a = lista.find(x => [g(x,'id'), g(x,'slug'), g(x,'titulo','title','nombre')].some(v => v !== '' && slug(v) === k));
  
  if (!a) {
    return new Response(`Aviso no encontrado: ${esc(clave)}. Revisa /a/_ids`, {status: 404, headers: {'content-type':'text/plain; charset=utf-8'}});
  }

  const titulo = g(a, 'titulo', 'title', 'nombre') || 'Aviso en Info MDQ Hoy';
  const descRaw = g(a, 'descripcion', 'description', 'texto', 'detalle') || `Mirá este aviso de ${titulo} en Info MDQ Hoy - Mar del Plata`;
  const desc = descRaw.slice(0, 200);
  let img = String(g(a, 'imagen', 'image', 'foto', 'img', 'imagenes') || 'banner1.jpg');
  // Si es array de imagenes, toma la primera
  if (img.includes(',')) img = img.split(',')[0];
  if (!/^https?:\/\//.test(img)) img = u.origin + '/' + img.replace(/^\.?\//, '');
  const slugFinal = slug(g(a, 'id', 'slug', 'titulo', 'title', 'nombre'));
  const destino = u.origin + '/?aviso=' + encodeURIComponent(slugFinal);

  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(titulo)} - Info MDQ Hoy</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="Info MDQ Hoy">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:url" content="${esc(u.href)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<noscript><meta http-equiv="refresh" content="0;url=${esc(destino)}"></noscript>
</head><body><script>location.replace(${JSON.stringify(destino)})</script>
<p><a href="${esc(destino)}">Ver ${esc(titulo)}</a></p></body></html>`,
  { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

const slug = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const g = (a, ...ks) => { for (const k of ks) if (a[k] != null && a[k] !== '') return a[k]; return ''; };
const aplanar = d => Array.isArray(d)
  ? d.flatMap(x => (x && typeof x === 'object' && !Array.isArray(x) && ('titulo' in x || 'title' in x || 'id' in x)) ? [x] : aplanar(x))
  : (d && typeof d === 'object') ? Object.values(d).flatMap(aplanar) : [];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function onRequest({ params, request }) {
  try {
    const u = new URL(request.url);
    // CAMBIO IMPORTANTE: usamos fetch directo, no env.ASSETS
    const r = await fetch(u.origin + '/avisos.json', { cf: { cacheTtl: 60 } });
    if (!r.ok) return new Response('No pude leer /avisos.json: ' + r.status, { status: 500 });
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
    let a = lista.find(x => String(g(x,'id')).trim() === clave.trim());
    if (!a) a = lista.find(x => [g(x,'id'), g(x,'slug'), g(x,'titulo','title','nombre')].some(v => v !== '' && slug(v) === k));
    if (!a) return new Response('Aviso no encontrado: ' + clave + ' - Revisa /a/_ids', { status: 404 });

    const titulo = g(a, 'titulo', 'title', 'nombre') || 'Aviso';
    const desc = (g(a, 'descripcion', 'description', 'texto', 'detalle') || '').slice(0, 200) || `Mirá ${titulo} en Info MDQ Hoy`;
    let img = String(g(a, 'imagen', 'image', 'foto', 'img') || 'banner1.jpg');
    if (img.includes(',')) img = img.split(',')[0].trim();
    if (!/^https?:\/\//.test(img)) img = u.origin + '/' + img.replace(/^\.?\//, '');
    const destino = u.origin + '/?aviso=' + encodeURIComponent(slug(g(a, 'id', 'slug', 'titulo', 'title', 'nombre')));

    return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(titulo)}</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="Info MDQ Hoy">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="${esc(u.href)}">
<meta name="twitter:card" content="summary_large_image">
<noscript><meta http-equiv="refresh" content="0;url=${esc(destino)}"></noscript>
</head><body><script>location.replace(${JSON.stringify(destino)})</script></body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } });

  } catch (e) {
    // Esto evita el Error 1101 y te muestra el error real
    return new Response('Error en el Worker: ' + (e && e.message ? e.message : e) + '\n' + (e && e.stack ? e.stack : ''), { status: 500, headers: {'content-type':'text/plain; charset=utf-8'}});
  }
}

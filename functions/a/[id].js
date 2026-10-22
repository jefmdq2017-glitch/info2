export async function onRequest(context) {
  const { params, request, env } = context;
  try {
    const u = new URL(request.url);
    let jsonText = '';
    
    // Intenta 2 formas de leer el json
    try {
      if (env && env.ASSETS) {
        const r1 = await env.ASSETS.fetch(new Request(u.origin + '/avisos.json'));
        jsonText = await r1.text();
      } else {
        throw new Error('no ASSETS');
      }
    } catch {
      const r2 = await fetch(u.origin + '/avisos.json');
      jsonText = await r2.text();
    }

    // Si nos devolvió HTML, te lo digo en vez de explotar
    if (jsonText.trim().startsWith('<')) {
      return new Response('ERROR: /avisos.json devuelve HTML, no JSON. Falta el archivo en public/ o tenes un _redirects que manda todo al index.html\n\nPrimeras letras: ' + jsonText.slice(0, 200), { status: 500 });
    }

    const slug = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    const g = (a, ...ks) => { for (const k of ks) if (a[k] != null && a[k] !== '') return a[k]; return ''; };
    const aplanar = d => Array.isArray(d) ? d.flatMap(x => (x && typeof x === 'object' && !Array.isArray(x) && ('titulo' in x || 'title' in x || 'id' in x)) ? [x] : aplanar(x)) : (d && typeof d === 'object') ? Object.values(d).flatMap(aplanar) : [];
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    
    const lista = aplanar(JSON.parse(jsonText));

    if (params.id === '_ids') {
      return new Response(JSON.stringify(lista.map((a, i) => ({
        n: i + 1, id: a.id, titulo: g(a, 'titulo', 'title', 'nombre'), enlace: '/a/' + slug(g(a, 'id', 'slug', 'titulo', 'title', 'nombre'))
      })), null, 2), { headers: { 'content-type': 'application/json' } });
    }

    let clave = params.id; try { clave = decodeURIComponent(clave); } catch {}
    const k = slug(clave);
    let a = lista.find(x => String(g(x,'id')).trim() === clave.trim());
    if (!a) a = lista.find(x => [g(x,'id'), g(x,'slug'), g(x,'titulo','title','nombre')].some(v => v !== '' && slug(v) === k));
    if (!a) return new Response('Aviso no encontrado: ' + clave, { status: 404 });

    const titulo = g(a, 'titulo', 'title', 'nombre') || 'Aviso';
    const desc = (g(a, 'descripcion', 'description', 'texto', 'detalle') || '').slice(0, 200) || titulo;
    let img = String(g(a, 'imagen', 'image', 'foto', 'img') || 'banner1.jpg');
    if (img.includes(',')) img = img.split(',')[0].trim();
    if (!/^https?:\/\//.test(img)) img = u.origin + '/' + img.replace(/^\.?\//, '');
    const destino = u.origin + '/?aviso=' + encodeURIComponent(slug(g(a, 'id', 'slug', 'titulo', 'title', 'nombre')));

    return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)}</title><meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(img)}"><meta property="og:url" content="${esc(u.href)}"><meta name="twitter:card" content="summary_large_image"></head><body><script>location.replace(${JSON.stringify(destino)})</script><a href="${esc(destino)}">Ver aviso</a></body></html>`, { headers: { 'content-type': 'text/html' } });

  } catch (e) {
    return new Response('Error en Worker: ' + e.message + '\n' + e.stack, { status: 500 });
  }
}

export async function onRequest({ request, env }) {
  const u = new URL(request.url);
  const id = u.searchParams.get('id');
  if (!id) return new Response('0', { status: 400 });
  
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const key = 'likes_' + id;
  let count = parseInt(await env.KV_LIKES.get(key) || '0') + 1;
  await env.KV_LIKES.put(key, String(count));
  
  return new Response(String(count), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain' }
  });
}

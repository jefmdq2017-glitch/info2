export async function onRequest({ request, env }) {
  const u = new URL(request.url);
  const id = u.searchParams.get('id');
  if (!id) return new Response('0');
  const count = await env.KV_LIKES.get('likes_' + id) || '0';
  return new Response(count, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain' }
  });
}

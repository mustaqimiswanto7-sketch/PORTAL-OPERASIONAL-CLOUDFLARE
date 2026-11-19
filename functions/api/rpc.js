/**
 * Cloudflare Pages Function: /api/rpc
 * Bind environment variables:
 *   GAS_WEB_APP_URL = deployed Apps Script /exec URL
 *   GAS_API_SECRET  = same secret stored in GAS Script Properties
 */
export async function onRequestPost({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
  try {
    if (!env.GAS_WEB_APP_URL || !env.GAS_API_SECRET) {
      return new Response(JSON.stringify({ok:false,error:'Cloudflare belum dikonfigurasi: GAS_WEB_APP_URL / GAS_API_SECRET.'}), {status:500,headers:cors});
    }
    const input = await request.json();
    if (!input || typeof input.function !== 'string' || !Array.isArray(input.args)) {
      return new Response(JSON.stringify({ok:false,error:'Format RPC tidak valid.'}), {status:400,headers:cors});
    }
    const upstream = await fetch(env.GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        secret: env.GAS_API_SECRET,
        function: input.function,
        args: input.args
      }),
      redirect: 'follow'
    });
    const body = await upstream.text();
    let parsed;
    try { parsed = JSON.parse(body); }
    catch (_) { throw new Error('Apps Script tidak mengembalikan JSON. Periksa deployment Web App dan doPost().'); }
    return new Response(JSON.stringify(parsed), {status: upstream.ok ? 200 : upstream.status, headers:cors});
  } catch (err) {
    return new Response(JSON.stringify({ok:false,error:err && err.message ? err.message : String(err)}), {status:502,headers:cors});
  }
}
export async function onRequestOptions() {
  return new Response(null, {status:204,headers:{
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Max-Age':'86400'
  }});
}

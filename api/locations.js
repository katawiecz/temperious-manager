
/* ===========================
   api/locations.js (Vercel serverless)
   - GET: read locations.json from GitHub repo via Contents API
   - PUT: validate & commit new content to the same file
=========================== */
const https = require('https');

function env(name, fallback){
  return process.env[name] || fallback;
}

function ghFetch(path, method='GET', bodyObj){
  const token = env('GITHUB_TOKEN');
  const owner = env('GITHUB_OWNER');
  const repo  = env('GITHUB_REPO');
  if(!token || !owner || !repo) throw new Error('Missing GitHub env vars');

  const data = bodyObj ? Buffer.from(JSON.stringify(bodyObj)) : null;
  const opts = {
    hostname: 'api.github.com',
    path,
    method,
    headers: {
      'User-Agent': 'temperious-manager',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      ...(data ? { 'Content-Type':'application/json', 'Content-Length': String(data.length) } : {})
    }
  };

  return new Promise((resolve, reject)=>{
    const req = https.request(opts, res=>{
      let buf='';
      res.on('data', c=> buf+=c);
      res.on('end', ()=>{
        const status = res.statusCode || 0;
        let json=null; try{ json = JSON.parse(buf); }catch(_){}
        if(status >= 200 && status < 300){ resolve(json ?? {}); }
        else reject(new Error(`GitHub ${status}: ${buf.slice(0,300)}`));
      });
    });
    req.on('error', reject);
    if(data) req.write(data);
    req.end();
  });
}

function b64encode(str){ return Buffer.from(str, 'utf8').toString('base64'); }
function b64decode(b64){ return Buffer.from(b64, 'base64').toString('utf8'); }

function validateArray(arr){
  if(!Array.isArray(arr)) throw new Error('Body must be an array');
  for(const [i,o] of arr.entries()){
    if(!o || typeof o !== 'object') throw new Error(`Row ${i}: must be object`);
    if(typeof o.name !== 'string' || o.name.trim().length < 2) throw new Error(`Row ${i}: invalid name`);
    if(!Number.isFinite(o.lat) || o.lat < -90 || o.lat > 90) throw new Error(`Row ${i}: invalid lat`);
    if(!Number.isFinite(o.lon) || o.lon < -180 || o.lon > 180) throw new Error(`Row ${i}: invalid lon`);
    if(!Number.isFinite(o.threshold)) throw new Error(`Row ${i}: invalid threshold`);
    if(o.notify && typeof o.notify !== 'string') throw new Error(`Row ${i}: invalid notify`);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type','application/json');
  try {
    const owner = env('GITHUB_OWNER');
    const repo  = env('GITHUB_REPO');
    const branch= env('GITHUB_BRANCH','main');
    const file  = env('GITHUB_FILE_PATH','locations.json');

    if(req.method === 'GET'){
      const out = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file)}?ref=${encodeURIComponent(branch)}`);
      const content = b64decode(out.content || '');
      const json = JSON.parse(content);
      res.statusCode = 200; res.end(JSON.stringify(json));
      return;
    }

    if(req.method === 'PUT'){
      const bodyStr = await new Promise((resolve)=>{ let b=''; req.on('data',c=>b+=c); req.on('end',()=>resolve(b)); });
      let arr; try{ arr = JSON.parse(bodyStr); }catch{ throw new Error('Invalid JSON body'); }
      validateArray(arr);

      // get current sha
      const head = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file)}?ref=${encodeURIComponent(branch)}`);
      const sha  = head.sha;
      const newContent = JSON.stringify(arr, null, 2) + '\n';

      const commit = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file)}`, 'PUT', {
        message: 'chore: update locations via Temperious Manager',
        content: b64encode(newContent),
        sha,
        branch
      });

      res.statusCode = 200; res.end(JSON.stringify({ ok: true, commit }));
      return;
    }

    res.statusCode = 405; res.end(JSON.stringify({ error:'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500; res.end(JSON.stringify({ error: err.message }));
  }
};
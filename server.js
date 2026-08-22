const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, '[]');

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function products() {
  try { return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8')); }
  catch { return []; }
}

function writeProducts(items) { fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(items, null, 2)); }

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 7 * 1024 * 1024) { reject(new Error('Imagem muito grande.')); req.destroy(); }
    });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Dados inválidos.')); } });
    req.on('error', reject);
  });
}

function serveFile(req, res) {
  const requested = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const filename = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filename.startsWith(PUBLIC_DIR) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()) return send(res, 404, 'Página não encontrada', 'text/plain; charset=utf-8');
  fs.readFile(filename, (err, data) => err ? send(res, 500, 'Erro ao abrir arquivo') : send(res, 200, data, mime[path.extname(filename)] || 'application/octet-stream'));
}

http.createServer(async (req, res) => {
  if (req.url === '/api/products' && req.method === 'GET') return send(res, 200, products());
  if (req.url === '/api/products' && req.method === 'POST') {
    try {
      const item = await readBody(req);
      if (!item.name || !item.price || !item.image || !String(item.image).startsWith('data:image/')) throw new Error('Preencha nome, preço e uma imagem válida.');
      const product = { id: Date.now().toString(36), name: String(item.name).slice(0, 80), size: String(item.size || '').slice(0, 30), description: String(item.description || '').slice(0, 500), price: Number(item.price), image: item.image, createdAt: new Date().toISOString() };
      if (!Number.isFinite(product.price) || product.price <= 0) throw new Error('Informe um preço válido.');
      const current = products(); current.unshift(product); writeProducts(current);
      return send(res, 201, product);
    } catch (error) { return send(res, 400, { error: error.message }); }
  }
  const match = req.url.match(/^\/api\/products\/([a-z0-9]+)$/);
  if (match && req.method === 'DELETE') {
    const updated = products().filter(item => item.id !== match[1]); writeProducts(updated);
    return send(res, 200, { ok: true });
  }
  serveFile(req, res);
}).listen(PORT, () => console.log(`Brechó da Mara disponível na porta ${PORT}`));

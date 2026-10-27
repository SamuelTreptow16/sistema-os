// Deixe vazio para usar o armazenamento local do navegador (modo demonstração).
// Para usar o Django: const API_URL = '/api/v1/ordens/';
const API_URL = '';
const STATUS = {A:'Aberta',E:'Em andamento',C:'Concluída',X:'Cancelada'};
const PRIO = {B:'Baixa',M:'Média',A:'Alta'};
let dados = [];

/* ---------- Armazenamento / API ---------- */
const store = {
  ler(){ try{return JSON.parse(localStorage.getItem('os')||'[]')}catch(e){return []} },
  gravar(v){ try{localStorage.setItem('os',JSON.stringify(v))}catch(e){} }
};

async function listar(){
  if(API_URL){ const r = await fetch(API_URL); const d = await r.json(); return d.results || d; }
  return store.ler();
}

async function criar(os){
  if(API_URL){
    const r = await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(os)});
    if(!r.ok) throw new Error('Erro ao salvar');
    return r.json();
  }
  const l = store.ler();
  os.id = Date.now();
  os.numero = l.length ? Math.max(...l.map(x=>x.numero))+1 : 1;
  os.data_abertura = new Date().toISOString();
  l.push(os); store.gravar(l); return os;
}

async function mudarStatus(id, status){
  if(API_URL){
    await fetch(API_URL+id+'/',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
  } else {
    const l = store.ler(); const o = l.find(x=>x.id===id); if(o) o.status = status; store.gravar(l);
  }
  await carregar();
}

/* ---------- Interface ---------- */
function aba(n){
  ['nova','lista'].forEach(a=>{
    document.getElementById(a).classList.toggle('on',a===n);
    document.getElementById('t'+a[0].toUpperCase()+a.slice(1)).classList.toggle('on',a===n);
  });
  if(n==='lista') carregar();
}

async function salvarOS(e){
  e.preventDefault();
  const o = Object.fromEntries(new FormData(e.target));
  o.status = 'A'; if(!o.previsao) o.previsao = null;
  try{
    const nova = await criar(o);
    e.target.reset();
    document.getElementById('msg').innerHTML = 'OS nº '+nova.numero+' aberta com sucesso. <button type="button" class="btn sm" onclick="imprimir('+nova.id+')">Imprimir</button>';
    dados.push(nova);
  }catch(err){ document.getElementById('msg').textContent = err.message; }
}

async function carregar(){ dados = await listar(); render(); }

const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt = s => s ? new Date(s.length===10 ? s+'T00:00:00' : s).toLocaleDateString('pt-BR') : '—';
const num = n => String(n).padStart(5,'0');

function render(){
  const q = document.getElementById('busca').value.toLowerCase();
  const st = document.getElementById('fStatus').value;
  const l = dados.filter(o => (!st || o.status===st) &&
    (num(o.numero)+o.cliente_nome+o.equipamento).toLowerCase().includes(q)).sort((a,b)=>b.numero-a.numero);
  document.getElementById('tb').innerHTML = l.length ? l.map(o=>`
    <tr><td>${num(o.numero)}</td><td>${dt(o.data_abertura)}</td><td>${esc(o.cliente_nome)}</td><td>${esc(o.equipamento)}</td>
    <td><span class="tag ${o.status}">${STATUS[o.status]}</span></td>
    <td><select onchange="mudarStatus(${o.id},this.value)">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${k===o.status?'selected':''}>${v}</option>`).join('')}</select>
    <button class="btn sm" onclick="imprimir(${o.id})">🖨 Imprimir</button></td></tr>`).join('')
    : '<tr><td colspan="6">Nenhuma OS encontrada.</td></tr>';
}

/* ---------- Impressão ---------- */
function imprimir(id){
  const o = dados.find(x=>x.id===id); if(!o) return;
  const w = window.open('','_blank');
  if(!w){ alert('Permita pop-ups para imprimir.'); return; }

  const cssUrl = new URL(document.body.dataset.cssImpressao, location.href).href;

  const via = t => `
  <div class="via">
    <div class="topo"><div><h1>ORDEM DE SERVIÇO Nº ${num(o.numero)}</h1><small>${t}</small></div>
    <div class="dir">Abertura: ${dt(o.data_abertura)}<br>Previsão: ${dt(o.previsao)}<br>Prioridade: ${PRIO[o.prioridade]}</div></div>
    <table>
      <tr><th>Cliente</th><td>${esc(o.cliente_nome)}</td><th>Telefone</th><td>${esc(o.cliente_telefone)}</td></tr>
      <tr><th>CPF/CNPJ</th><td>${esc(o.cliente_documento)||'—'}</td><th>Técnico</th><td>${esc(o.tecnico)||'—'}</td></tr>
      <tr><th>Equipamento</th><td>${esc(o.equipamento)}</td><th>Marca/Modelo</th><td>${esc(o.marca_modelo)||'—'}</td></tr>
      <tr><th>Nº de série</th><td>${esc(o.numero_serie)||'—'}</td><th>Acessórios</th><td>${esc(o.acessorios)||'—'}</td></tr>
      <tr><th>Defeito relatado</th><td colspan="3">${esc(o.defeito)}</td></tr>
      <tr><th>Valor estimado</th><td colspan="3">R$ ${Number(o.valor_estimado||0).toFixed(2).replace('.',',')}</td></tr>
    </table>
    <p class="termo">Declaro que as informações acima conferem com o equipamento entregue e autorizo a avaliação/reparo. Equipamentos não retirados em 90 dias após o aviso de conclusão poderão ser descartados.</p>
    <div class="ass"><div><hr>Cliente<br>${esc(o.cliente_nome)}</div><div><hr>Técnico responsável<br>${esc(o.tecnico)||'&nbsp;'}</div></div>
  </div>`;

  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>OS ${num(o.numero)}</title>
  <link rel="stylesheet" href="${cssUrl}"></head><body>${via('Via do Cliente')}${via('Via da Assistência')}</body></html>`);
  w.document.close();

  // Imprime quando o CSS terminar de carregar (com garantia de disparo único)
  let impresso = false;
  const imprimirAgora = () => { if(impresso) return; impresso = true; w.focus(); w.print(); };
  w.addEventListener('load', imprimirAgora);
  setTimeout(imprimirAgora, 1500);
}

carregar();
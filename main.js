// ── Estado dos registradores e flags ────────────────────────────────────────
const R = {
  RAX:0, RBX:0, RCX:0, RDX:0, RSI:0, RDI:0,
  R8:0,  R9:0,  R12:0, R13:0, RSP:0x7fff0000, RBP:0
};
const F = { ZF:0, SF:0, OF:0, CF:0 };
let stk = [];

// ── Utilitários ──────────────────────────────────────────────────────────────
function hx(v) {
  const n = BigInt(Math.trunc(v)) & 0xFFFFFFFFFFFFFFFFn;
  return '0x' + n.toString(16).toUpperCase().padStart(16, '0');
}
function fmtReg(v) { return hx(v) + ' (' + Math.trunc(v) + ')'; }

// ── Renderiza registradores e flags ─────────────────────────────────────────
const REG_ORDER = ['RAX','RBX','RCX','RDX','RSI','RDI','R8','R9','R12','R13','RSP','RBP'];

function renderRegs(changed = []) {
  document.getElementById('rg').innerHTML = REG_ORDER.map(r =>
    `<div class="rc ${changed.includes(r) ? 'ch' : ''}">
       <span class="rn">${r}</span>
       <span class="rv">${fmtReg(R[r])}</span>
     </div>`
  ).join('');

  document.getElementById('fr').innerHTML = Object.entries(F).map(([f, v]) =>
    `<div class="fl ${v ? 'on' : ''}">${f}=${v}</div>`
  ).join('');
}

// ── Renderiza pilha ──────────────────────────────────────────────────────────
function renderStack() {
  const el = document.getElementById('sw');
  if (!stk.length) {
    el.innerHTML = '<div style="color:var(--muted)">(vazia)</div>';
    return;
  }
  el.innerHTML = stk.slice(-5).reverse().map((v, i) =>
    `<div class="si">
       <span class="sa">RSP+${(stk.length - 1 - i) * 8}</span>
       <span class="sv">${fmtReg(v)}</span>
     </div>`
  ).join('');
}

// ── Tabela de instruções Assembly exibidas ───────────────────────────────────
const ASM = [
  [null,     '',       '',                    '; ─── _start ──────────────────────'],
  ['401000', 'mov',    'rdi, prompt_a',       '; endereço do prompt A'],
  ['401007', 'call',   'print_str',           '; stdout: "Numero A : "'],
  ['40100c', 'mov',    'rdi, buf_a',          '; buffer para leitura'],
  ['401013', 'mov',    'rsi, 32',             '; tamanho máximo'],
  ['40101a', 'call',   'read_line',           '; lê número A do stdin'],
  ['40101f', 'mov',    'rdi, buf_a',          '; arg para parse_int'],
  ['401026', 'call',   'parse_int',           '; ASCII → inteiro → RAX'],
  ['40102b', 'mov',    'r12, rax',            '; salva A em R12'],
  [null,     '',       '',                    '; ─── operador ────────────────────'],
  ['401030', 'mov',    'rdi, prompt_op',      ''],
  ['401037', 'call',   'print_str',           '; stdout: "Operador : "'],
  ['40104a', 'call',   'read_line',           '; lê operador (+,-,*,/)'],
  [null,     '',       '',                    '; ─── número B ────────────────────'],
  ['401056', 'call',   'print_str',           '; stdout: "Numero B : "'],
  ['401069', 'call',   'read_line',           '; lê número B do stdin'],
  ['401075', 'call',   'parse_int',           '; ASCII → inteiro → RAX'],
  ['40107a', 'mov',    'r13, rax',            '; salva B em R13'],
  [null,     '',       '',                    '; ─── despacha operação ───────────'],
  ['40107f', 'movzx',  'rax, byte [buf_op]',  '; AL = char do operador'],
  ['401086', 'cmp',    'al, 0x2B',            "; compara com '+'"],
  ['401089', 'je',     '.do_add',             ''],
  ['40108b', 'cmp',    'al, 0x2D',            "; compara com '-'"],
  ['40108e', 'je',     '.do_sub',             ''],
  ['401090', 'cmp',    'al, 0x2A',            "; compara com '*'"],
  ['401093', 'je',     '.do_mul',             ''],
  ['401095', 'cmp',    'al, 0x2F',            "; compara com '/'"],
  ['401098', 'je',     '.do_div',             ''],
  [null,     '',       '',                    '; ─── .do_add ─────────────────────'],
  ['4010a0', 'mov',    'rax, r12',            '; RAX = A'],
  ['4010a3', 'add',    'rax, r13',            '; RAX = A + B'],
  ['4010a6', 'jmp',    '.print_result',       ''],
  [null,     '',       '',                    '; ─── .do_sub ─────────────────────'],
  ['4010b0', 'mov',    'rax, r12',            '; RAX = A'],
  ['4010b3', 'sub',    'rax, r13',            '; RAX = A - B'],
  ['4010b6', 'jmp',    '.print_result',       ''],
  [null,     '',       '',                    '; ─── .do_mul ─────────────────────'],
  ['4010c0', 'mov',    'rax, r12',            '; RAX = A'],
  ['4010c3', 'imul',   'rax, r13',            '; RAX = A * B'],
  ['4010c7', 'jmp',    '.print_result',       ''],
  [null,     '',       '',                    '; ─── .do_div ─────────────────────'],
  ['4010d0', 'cmp',    'r13, 0',              '; divisão por zero?'],
  ['4010d4', 'je',     '.div_zero',           ''],
  ['4010d6', 'mov',    'rax, r12',            '; RAX = A'],
  ['4010d9', 'cqo',    '',                    '; sign-extend RDX:RAX'],
  ['4010db', 'idiv',   'r13',                 '; RAX=quociente RDX=resto'],
  [null,     '',       '',                    '; ─── .print_result ───────────────'],
  ['4010e0', 'push',   'rax',                 '; salva resultado na pilha'],
  ['4010e8', 'call',   'print_str',           '; stdout: "Resultado : "'],
  ['4010ed', 'pop',    'rax',                 '; recupera resultado'],
  ['4010f5', 'call',   'int_to_str',          '; inteiro → ASCII'],
  ['401101', 'call',   'print_str',           '; imprime resultado'],
  ['401106', 'mov',    'rax, 60',             '; syscall exit'],
  ['40110d', 'xor',    'rdi, rdi',            '; código 0'],
  ['401110', 'syscall','',                    '; encerra processo ✓'],
];

// ── Renderiza código Assembly com linha destacada ────────────────────────────
function renderCode(execLine = -1) {
  const cv = document.getElementById('cv');
  cv.innerHTML = ASM.map(([addr, mn, ag, cm], i) => {
    const ex = i === execLine;
    if (!addr && !mn) {
      return `<div class="cl" style="opacity:.4">
        <span class="cn">${i + 1}</span>
        <span class="ca"></span><span class="cm"></span><span class="cg"></span>
        <span class="cc">${ag || ''} ${cm || ''}</span>
      </div>`;
    }
    return `<div class="cl ${ex ? 'ex' : ''}">
      <span class="cn">${i + 1}</span>
      <span class="ca">${addr}</span>
      <span class="cm">${mn}</span>
      <span class="cg">${ag}</span>
      <span class="cc">${cm}</span>
    </div>`;
  }).join('');

  if (execLine >= 0) {
    cv.querySelectorAll('.cl')[execLine]?.scrollIntoView({ block: 'nearest' });
  }
}

// ── Adiciona linha ao trace log ──────────────────────────────────────────────
function addTrace(addr, ins, ops, cmt = '', active = false) {
  const log = document.getElementById('tl');
  const d = document.createElement('div');
  d.className = 'tl' + (active ? ' ac' : '');
  d.innerHTML =
    `<span class="ta">${addr}</span>` +
    `<span class="ti">${ins}</span>` +
    `<span class="to">${ops}</span>` +
    `<span class="tc">${cmt}</span>`;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

// ── Execução simulada ────────────────────────────────────────────────────────
async function run() {
  const a  = parseInt(document.getElementById('na').value) || 0;
  const b  = parseInt(document.getElementById('nb').value) || 0;
  const op = document.getElementById('op').value;

  // reset
  document.getElementById('em').textContent = '';
  const rb = document.getElementById('rb');
  rb.textContent = '…';
  rb.style.color = 'var(--muted)';
  document.getElementById('tl').innerHTML = '';
  Object.keys(R).forEach(k => R[k] = 0);
  R.RSP = 0x7fff0000;
  Object.keys(F).forEach(k => F[k] = 0);
  stk = [];
  renderCode(-1); renderRegs(); renderStack();

  const btn = document.getElementById('btn');
  btn.disabled = true;
  btn.textContent = '⟳ EXECUTANDO…';

  const D  = 55;
  const dl = ms => new Promise(r => setTimeout(r, ms));

  // ── parse A ────────────────────────────────────────────────────────────────
  addTrace('401000','mov','rdi, prompt_a',''); renderCode(1);
  R.RDI = 0x402000; renderRegs(['RDI']); await dl(D);

  addTrace('401007','call','print_str','stdout: "Numero A : "', true); renderCode(2); await dl(D);

  addTrace('401026','call','parse_int', `"${a}" → ${a}`, true); renderCode(7);
  let acc = 0;
  for (const c of String(Math.abs(a))) {
    R.RCX++; R.RAX = acc = acc * 10 + parseInt(c);
    renderRegs(['RAX','RCX']); await dl(D / 2);
  }
  if (a < 0) { R.R8 = -1; R.RAX = a; renderRegs(['R8','RAX']); }

  addTrace('40102b','mov','r12, rax', `R12 = ${a}`, true); renderCode(8);
  R.R12 = a; renderRegs(['R12']); await dl(D);

  // ── operador ───────────────────────────────────────────────────────────────
  addTrace('401037','call','print_str','stdout: "Operador : "', true); renderCode(11); await dl(D);
  addTrace('40104a','call','read_line', `stdin → "${op}"`, true); renderCode(12); await dl(D);

  // ── parse B ────────────────────────────────────────────────────────────────
  addTrace('401056','call','print_str','stdout: "Numero B : "', true); renderCode(14); await dl(D);

  addTrace('401075','call','parse_int', `"${b}" → ${b}`, true); renderCode(16);
  acc = 0;
  for (const c of String(Math.abs(b))) {
    R.RCX++; R.RAX = acc = acc * 10 + parseInt(c);
    renderRegs(['RAX','RCX']); await dl(D / 2);
  }
  if (b < 0) { R.R8 = -1; R.RAX = b; renderRegs(['R8','RAX']); }

  addTrace('40107a','mov','r13, rax', `R13 = ${b}`, true); renderCode(17);
  R.R13 = b; renderRegs(['R13']); await dl(D);

  // ── dispatch ───────────────────────────────────────────────────────────────
  addTrace('40107f','movzx','rax, byte [buf_op]',
    `AL = '${op}' (0x${op.charCodeAt(0).toString(16).toUpperCase()})`);
  renderCode(19); R.RAX = op.charCodeAt(0); renderRegs(['RAX']); await dl(D);

  addTrace('401086','cmp',
    `al, 0x${op.charCodeAt(0).toString(16).toUpperCase()}`, `match: '${op}'`);
  await dl(D);

  const branch = op === '+' ? 'add' : op === '-' ? 'sub' : op === '*' ? 'mul' : 'div';
  addTrace('401089','je', `.do_${branch}`, 'branch taken', true); await dl(D);

  // ── operação ───────────────────────────────────────────────────────────────
  let result;

  if (op === '+') {
    addTrace('4010a0','mov','rax, r12', `RAX = ${a}`); renderCode(29);
    R.RAX = a; renderRegs(['RAX']); await dl(D);
    addTrace('4010a3','add','rax, r13', `${a} + ${b} = ${a + b}`, true); renderCode(30);
    result = a + b; R.RAX = result;
    F.ZF = result === 0 ? 1 : 0; F.SF = result < 0 ? 1 : 0;
    renderRegs(['RAX']); await dl(D);

  } else if (op === '-') {
    addTrace('4010b0','mov','rax, r12', `RAX = ${a}`); renderCode(33);
    R.RAX = a; renderRegs(['RAX']); await dl(D);
    addTrace('4010b3','sub','rax, r13', `${a} - ${b} = ${a - b}`, true); renderCode(34);
    result = a - b; R.RAX = result;
    F.ZF = result === 0 ? 1 : 0; F.SF = result < 0 ? 1 : 0;
    renderRegs(['RAX']); await dl(D);

  } else if (op === '*') {
    addTrace('4010c0','mov','rax, r12', `RAX = ${a}`); renderCode(37);
    R.RAX = a; renderRegs(['RAX']); await dl(D);
    addTrace('4010c3','imul','rax, r13', `${a} × ${b} = ${a * b}`, true); renderCode(38);
    result = a * b; R.RAX = result;
    F.ZF = result === 0 ? 1 : 0; F.SF = result < 0 ? 1 : 0;
    renderRegs(['RAX']); await dl(D);

  } else {
    addTrace('4010d0','cmp','r13, 0', `${b} == 0?`); renderCode(41);
    F.ZF = b === 0 ? 1 : 0; renderRegs([]); await dl(D);

    if (b === 0) {
      addTrace('4010d4','je','.div_zero','ERRO: divisão por zero!', true); renderCode(42);
      document.getElementById('em').textContent = '✗ ERRO: divisão por zero!';
      rb.textContent = 'ERR'; rb.style.color = 'var(--red)';
      btn.disabled = false; btn.textContent = '▶ EXECUTAR / CALCULAR';
      return;
    }

    addTrace('4010d9','cqo','','sign-extend RDX:RAX'); renderCode(44);
    R.RDX = a < 0 ? -1 : 0; renderRegs(['RDX']); await dl(D);

    const q = Math.trunc(a / b), rem = a % b;
    addTrace('4010db','idiv','r13', `RAX=${q}  RDX(resto)=${rem}`, true); renderCode(45);
    result = q; R.RAX = q; R.RDX = rem;
    F.ZF = q === 0 ? 1 : 0; F.SF = q < 0 ? 1 : 0;
    renderRegs(['RAX','RDX']); await dl(D);
  }

  // ── saída ──────────────────────────────────────────────────────────────────
  addTrace('4010e0','push','rax', `pilha ← ${result}`); renderCode(47);
  stk.push(result); R.RSP -= 8; renderRegs(['RSP']); renderStack(); await dl(D);

  addTrace('4010e8','call','print_str','stdout: "Resultado : "', true); renderCode(48); await dl(D);

  addTrace('4010ed','pop','rax', `RAX ← ${result}`); renderCode(49);
  stk.pop(); R.RSP += 8; R.RAX = result; renderRegs(['RAX','RSP']); renderStack(); await dl(D);

  addTrace('4010f5','call','int_to_str', `${result} → "${result}"`, true); renderCode(50); await dl(D);
  addTrace('401101','call','print_str',  `stdout: "${result}"`,    true); renderCode(51); await dl(D);

  addTrace('401106','mov','rax, 60','syscall exit'); renderCode(52);
  R.RAX = 60; renderRegs(['RAX']); await dl(D);

  addTrace('401110','syscall','','processo encerrado ✓', true); renderCode(54); await dl(D);

  // mostra resultado
  rb.textContent = String(result);
  rb.style.color = 'var(--green)';
  rb.classList.add('pulse');
  setTimeout(() => rb.classList.remove('pulse'), 900);

  renderCode(-1);
  btn.disabled = false;
  btn.textContent = '▶ EXECUTAR / CALCULAR';
}

// ── Init ─────────────────────────────────────────────────────────────────────
renderCode(-1);
renderRegs();
renderStack();
document.getElementById('btn').addEventListener('click', run);

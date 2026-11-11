/* Nº5 Clara | Checkout da pré-reserva (porte para JavaScript puro do checkout do site anterior).
   Fluxo: a Clara pergunta nome, email e telemóvel (uma coisa de cada vez) e depois mostra o último passo,
   a pré-reserva de 27 €, que se paga num Payment Link da Stripe. A Stripe devolve a pessoa a
   /pre-reserva-confirmada/. O site não guarda chaves nem confirma pagamentos. */
(() => {
  'use strict';

  /* ---------- configuração ---------- */
  const LINK_PRE_RESERVA = 'https://buy.stripe.com/cNi8wRfFv4Cb1fN3DUgrS0a';
  const PRE_RESERVA = '27 €';
  /* Se definires um endereço (por exemplo uma função serverless), a inscrição é enviada para lá (POST,
     application/x-www-form-urlencoded). Sem endereço, os dados ficam só no navegador. */
  const ENDPOINT_INSCRICAO = '';
  const FORMULARIO = 'lista-clara';

  const OFERTA = {
    meses: [
      { quando: 'Agora', valor: PRE_RESERVA, texto: 'a pré-reserva' },
      { quando: '1.º mês', valor: 'Pago', texto: 'com a pré-reserva, com a Clara Elite completa', destaque: true },
      { quando: '2.º mês', valor: '−50%', texto: 'na primeira mensalidade da Pro (48,50 €) ou da Elite (73,50 €), se continuares' },
      { quando: 'Sempre', valor: 'Sem fidelização', texto: 'cancelas quando quiseres' },
    ],
    nota: 'Preferes o plano Clara? A partir do 2.º mês pagas 53 € por mês.',
  };
  const METODOS = ['MB WAY', 'Multibanco', 'Cartão', 'Apple Pay', 'Google Pay'];

  const PERGUNTAS = [
    { id: 'nome', rotulo: 'O teu nome', fala: () => 'Olá! Sou a Clara. Como é que te devo chamar?',
      campo: { type: 'text', autocomplete: 'name', autocapitalize: 'words', placeholder: 'O teu nome', maxlength: 120 } },
    { id: 'email', rotulo: 'O teu email', fala: n => `Prazer, ${n}! Qual é o teu email?`, ajuda: 'É por lá que te mando tudo sobre a tua vaga.',
      campo: { type: 'email', inputmode: 'email', autocomplete: 'email', autocapitalize: 'none', spellcheck: 'false', placeholder: 'nome@exemplo.pt', maxlength: 180 } },
    { id: 'telefone', rotulo: 'O teu número de telemóvel', fala: n => `E o teu número de telemóvel, ${n}?`, ajuda: 'Para falarmos contigo antes do lançamento.',
      campo: { type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: 'Ex.: 912 345 678', maxlength: 24 } },
  ];

  /* ---------- validação ---------- */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function erroDoCampo(campo, d) {
    const v = String(d[campo] ?? '').trim();
    if (campo === 'nome') return v ? null : 'Preciso de um nome para saber como te tratar.';
    if (campo === 'email') return EMAIL.test(v) ? null : 'Este email não me parece certo. Confirmas?';
    if (campo === 'telefone') {
      if (!v) return 'Preciso do teu número para falarmos contigo.';
      const n = v.replace(/\D/g, '').length;
      return n < 9 || n > 15 ? 'O número tem de ter entre 9 e 15 dígitos.' : null;
    }
    return null;
  }
  function erroIndicacao(d) {
    const v = String(d.indicado_por ?? '').trim();
    if (v.length > 120) return 'Escreve só o nome, o email ou o código de quem te indicou.';
    if (v.includes('@') && !EMAIL.test(v)) return 'Este email não parece válido.';
    if (v && v.toLowerCase() === String(d.email ?? '').trim().toLowerCase()) return 'Põe quem te indicou, não o teu email.';
    return null;
  }
  const primeiroNome = nome => {
    const p = String(nome ?? '').trim().split(/\s+/)[0] || '';
    return p ? p.charAt(0).toLocaleUpperCase('pt-PT') + p.slice(1) : '';
  };

  /* ---------- Passa a Clara: códigos de indicação ---------- */
  const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const FORMATO = /^[A-HJ-NP-Z2-9]{6}$/;
  const K_MEU = 'n5-passa-codigo', K_REF = 'n5-passa-ref', VALIDADE_REF = 30 * 24 * 3600 * 1000;
  const arm = () => { try { return window.localStorage; } catch (_) { return null; } };
  const ler = k => { try { return arm()?.getItem(k) ?? null; } catch (_) { return null; } };
  const gravar = (k, v) => { try { arm()?.setItem(k, v); } catch (_) {} };
  const normalizar = c => String(c ?? '').trim().toUpperCase();
  const codigoValido = c => FORMATO.test(normalizar(c));
  const novoCodigo = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => ALFABETO[b % 32]).join('');
  const meuCodigo = () => { const c = ler(K_MEU); return codigoValido(c) ? normalizar(c) : null; };
  function lerRef() {
    try {
      const r = JSON.parse(ler(K_REF) || 'null');
      return r && codigoValido(r.codigo) && Date.now() - r.em < VALIDADE_REF ? r.codigo : null;
    } catch (_) { return null; }
  }
  function guardarRef(c) {
    const codigo = normalizar(c);
    if (codigoValido(codigo) && codigo !== meuCodigo()) gravar(K_REF, JSON.stringify({ codigo, em: Date.now() }));
  }
  /* ao abrir a página: ?ref=CÓDIGO fica guardado (30 dias) */
  try { const r = new URLSearchParams(window.location.search).get('ref'); if (r) guardarRef(r); } catch (_) {}

  function linkPagamento(ref) {
    if (!codigoValido(ref)) return LINK_PRE_RESERVA;
    const u = new URL(LINK_PRE_RESERVA);
    u.searchParams.set('client_reference_id', normalizar(ref));
    return u.toString();
  }
  /* só aceita links da Stripe, para o botão nunca levar a outro sítio */
  const linkValido = url => /^https:\/\/(buy|checkout)\.stripe\.com\/[\w/-]+$/.test(String(url || ''));

  /* ---------- utilitários ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const attrs = o => Object.entries(o).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
  const reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const marcar = (nome, detalhe = {}) => document.dispatchEvent(new CustomEvent('n5:evento', { detail: { nome, ...detalhe } }));
  const codificar = obj => Object.entries(obj).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

  /* ---------- interface ---------- */
  const raiz = document.getElementById('checkout-root');
  if (!raiz) return;

  const d = { nome: '', email: '', telefone: '', indicado_por: '' };
  let i = 0, escreve = false, erros = {}, codigoAberto = false, aEnviar = false, falhou = false, aceito = false;
  let iniciada = false, indicacao = null, respondeu = false;
  const porLigacao = !!lerRef();

  const avatar = tam => `<span class="clara-avatar" style="width:${tam}px;height:${tam}px"><img src="assets/clara-avatar.png" alt="" width="${tam}" height="${tam}"><span class="clara-avatar-faisca" aria-hidden="true">✦</span></span>`;

  function fala(texto, ajuda, { compacta = false, aEscrever = false } = {}) {
    const balao = aEscrever
      ? '<span class="clara-a-escrever" role="status" aria-label="A Clara está a escrever"><i></i><i></i><i></i></span>'
      : `<p>${esc(texto)}</p>${ajuda ? `<small>${esc(ajuda)}</small>` : ''}`;
    return `<div class="clara-fala ${compacta ? 'clara-fala--compacta' : ''}">${avatar(compacta ? 26 : 36)}<div class="clara-fala-balao">${balao}</div></div>`;
  }

  function oQuePagas() {
    return `<div class="o-que-pagas o-que-pagas--compacto"><ol aria-label="O que pagas, mês a mês">${OFERTA.meses.map(p =>
      `<li${p.destaque ? ' class="o-que-pagas-destaque"' : ''}><small>${esc(p.quando)}</small><b>${esc(p.valor)}</b><span>${esc(p.texto)}</span></li>`).join('')}</ol><p class="o-que-pagas-nota">${esc(OFERTA.nota)}</p></div>`;
  }

  function desenharPerguntas() {
    const q = PERGUNTAS[i];
    const ultima = i === PERGUNTAS.length - 1;
    const nome = primeiroNome(d.nome);
    const trocas = PERGUNTAS.slice(0, i).map((p, k) =>
      `<div class="clara-troca">${fala(p.fala(nome), '', { compacta: true })}<button type="button" class="clara-resposta" data-voltar="${k}" aria-label="${esc(p.rotulo)}: ${esc(d[p.id])}. Mudar">${esc(d[p.id])}</button></div>`).join('');
    const erro = erros[q.id];
    const codigo = ultima && !porLigacao ? (codigoAberto
      ? `<label class="campo clara-codigo ${erros.indicado_por ? 'campo--erro' : ''}"><span>Código ou nome do colega que te falou da Clara</span><input id="campo-indicado_por" name="indicado_por" value="${esc(d.indicado_por)}" autocomplete="off" placeholder="Ex.: ABC234">${erros.indicado_por ? `<small role="alert">${esc(erros.indicado_por)}</small>` : ''}</label>`
      : '<button type="button" class="clara-voltar clara-codigo-abrir" data-codigo>Tens o código de um colega?</button>') : '';
    raiz.innerHTML = `
      <form class="clara-form" novalidate>
        <h3>Reserva a tua Clara</h3>
        <p class="prevenda-form-sub">Três perguntas e, a seguir, o pagamento da pré-reserva de ${PRE_RESERVA}.</p>
        <p class="so-leitores"><label>Não preenchas: <input name="empresa-site" tabindex="-1" autocomplete="off"></label></p>
        <div class="clara-passos"><span class="eyebrow">Pergunta ${i + 1} de ${PERGUNTAS.length}</span>${i > 0 ? `<button type="button" class="clara-voltar" data-voltar="${i - 1}">← Voltar</button>` : ''}</div>
        <div class="clara-progresso" aria-hidden="true"><span style="width:${(i / PERGUNTAS.length) * 100}%"></span></div>
        <div class="clara-conversa" aria-live="polite">${trocas}<div id="fala-atual">${fala(q.fala(nome), q.ajuda, { aEscrever: escreve && !reduzir })}</div></div>
        <label class="campo clara-campo ${erro ? 'campo--erro' : ''}"><span class="so-leitores">${esc(q.rotulo)}</span><input id="campo-${q.id}" name="${q.id}" value="${esc(d[q.id])}" ${attrs(q.campo)} enterkeyhint="${ultima ? 'send' : 'next'}" ${erro ? 'aria-invalid="true"' : ''}>${erro ? `<small role="alert">${esc(erro)}</small>` : ''}</label>
        ${codigo}
        ${ultima ? '<p class="clara-aviso">Ao continuares, autorizas a Nº 5 a guardar estes dados e a contactar-te sobre o lançamento da N5 Clara, nos termos da <a href="privacidade.html" target="_blank" rel="noopener">política de privacidade</a>.</p>' : ''}
        <button class="btn prevenda-botao" type="submit" ${aEnviar ? 'disabled' : ''}>${aEnviar ? 'A enviar…' : ultima ? 'Continuar para o pagamento' : 'Seguinte'}</button>
        ${falhou ? '<p class="erro-solto">Não conseguimos enviar. Tenta outra vez daqui a pouco.</p>' : ''}
      </form>`;

    const form = raiz.querySelector('form');
    const campo = form.elements[q.id];
    if (respondeu) campo.focus();
    if (escreve && !reduzir) {
      escreve = false;
      setTimeout(() => {
        const alvo = raiz.querySelector('#fala-atual');
        if (alvo && PERGUNTAS[i] === q) alvo.innerHTML = fala(q.fala(nome), q.ajuda);
      }, 550);
    } else escreve = false;
    form.addEventListener('focusin', () => { if (!iniciada) { iniciada = true; marcar('inscricao_iniciada'); } });
    form.addEventListener('input', e => {
      if (e.target.name in d) { d[e.target.name] = e.target.value; if (erros[e.target.name]) { delete erros[e.target.name]; e.target.closest('.campo')?.classList.remove('campo--erro'); e.target.closest('.campo')?.querySelector('small')?.remove(); e.target.removeAttribute('aria-invalid'); } }
    });
    form.addEventListener('click', e => {
      const v = e.target.closest('[data-voltar]');
      if (v) { respondeu = true; erros = {}; escreve = false; i = Number(v.dataset.voltar); desenharPerguntas(); return; }
      if (e.target.closest('[data-codigo]')) { codigoAberto = true; desenharPerguntas(); raiz.querySelector('#campo-indicado_por')?.focus(); }
    });
    form.addEventListener('submit', seguinte);
  }

  function seguinte(e) {
    e.preventDefault();
    const q = PERGUNTAS[i];
    const erro = erroDoCampo(q.id, d);
    if (erro) { erros = { [q.id]: erro }; marcar('inscricao_com_erros', { campos: [q.id] }); desenharPerguntas(); raiz.querySelector(`#campo-${q.id}`)?.focus(); return; }
    marcar('inscricao_pergunta', { n: i + 1, id: q.id });
    respondeu = true;
    if (i + 1 < PERGUNTAS.length) { erros = {}; escreve = true; i += 1; desenharPerguntas(); }
    else enviar(e.target);
  }

  async function enviar(form) {
    const todos = {};
    PERGUNTAS.forEach(p => { const x = erroDoCampo(p.id, d); if (x) todos[p.id] = x; });
    const ei = erroIndicacao(d); if (ei) todos.indicado_por = ei;
    if (Object.keys(todos).length) {
      const k = PERGUNTAS.findIndex(p => todos[p.id]);
      if (k >= 0) { escreve = false; i = k; }
      erros = todos; desenharPerguntas(); return;
    }
    erros = {};
    let meu = meuCodigo();
    if (!meu) { meu = novoCodigo(); gravar(K_MEU, meu); }
    const escrito = d.indicado_por.trim();
    let ref = codigoValido(escrito) ? normalizar(escrito) : lerRef();
    if (ref === meu) ref = null;
    if (ref) guardarRef(ref);
    const honeypot = form.elements['empresa-site']?.value || '';
    aEnviar = true; falhou = false; desenharPerguntas();
    if (ENDPOINT_INSCRICAO) {
      try {
        const r = await fetch(ENDPOINT_INSCRICAO, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: codificar({ 'form-name': FORMULARIO, nome: d.nome, email: d.email, telefone: d.telefone, indicado_por: escrito || ref || '', consentimento: true, codigo: meu, indicado_codigo: ref || '', 'empresa-site': honeypot }) });
        if (!r.ok) throw new Error(String(r.status));
      } catch (_) { aEnviar = false; falhou = true; desenharPerguntas(); return; }
    }
    marcar('inscricao_enviada', { indicado: !!(escrito || ref), por_codigo: !!ref });
    aEnviar = false; indicacao = ref;
    desenharPreReserva();
  }

  function desenharPreReserva() {
    marcar('passo_visto', { passo: 'pre-reserva', ordem: 2 });
    const destino = linkPagamento(indicacao);
    const temLink = linkValido(LINK_PRE_RESERVA);
    const botaoTexto = `Pagar ${PRE_RESERVA} e garantir a minha vaga`;
    raiz.innerHTML = `
      <div class="pre-reserva">
        <p class="prioridades-feito">✓ Dados guardados.</p>
        <h3>Último passo: a pré-reserva</h3>
        <dl class="pre-reserva-resumo"><div class="pre-reserva-total"><dt>Pré-reserva: total a pagar agora</dt><dd>${PRE_RESERVA}</dd></div></dl>
        ${oQuePagas()}
        <ul class="pre-reserva-inclui">
          <li>Uma das 25 vagas com as condições de lançamento: entras a 1 de dezembro</li>
          <li>Copiloto do CRM durante 3 meses, sessão de configuração e 2 formações incluídas</li>
          <li>Reembolsável após o dia do lançamento</li>
        </ul>
        <div class="pre-reserva-metodos" aria-label="Formas de pagamento">${METODOS.map(m => `<span>${esc(m)}</span>`).join('')}</div>
        ${temLink ? `
          <label class="pre-reserva-aceito"><input type="checkbox" id="aceito" ${aceito ? 'checked' : ''}><span>Li e aceito as <a href="termos.html#pre-reserva" target="_blank" rel="noopener">condições da pré-reserva e do reembolso</a>.</span></label>
          <div id="pagar-caixa"></div>
          <p class="pre-reserva-nota">Pagamento seguro na Stripe. Voltas a este site no fim.</p>`
        : '<p class="pre-reserva-nota pre-reserva-nota--aviso">O pagamento abre nos próximos dias. Enviamos-te o link por email assim que estiver ativo.</p>'}
      </div>`;
    const caixa = raiz.querySelector('#pagar-caixa');
    const pintar = () => {
      if (!caixa) return;
      caixa.innerHTML = aceito
        ? `<a class="btn prevenda-botao" href="${esc(destino)}">${botaoTexto}</a>`
        : `<button type="button" class="btn prevenda-botao" disabled>${botaoTexto}</button>`;
      caixa.querySelector('a')?.addEventListener('click', () => marcar('pagamento_aberto'));
    };
    pintar();
    raiz.querySelector('#aceito')?.addEventListener('change', e => { aceito = e.target.checked; pintar(); });
    raiz.scrollIntoView?.({ block: 'nearest', behavior: reduzir ? 'auto' : 'smooth' });
  }

  desenharPerguntas();
})();

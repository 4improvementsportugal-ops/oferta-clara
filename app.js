/* Nº5 Clara | Landing: CTA fixo, exemplos da conversa e formulário que segue para o pagamento na Stripe. */
(() => {
  'use strict';
  /* Payment Link da Stripe da pré-reserva de 27 € (cobra a sério). */
  const LINK_PRE_RESERVA = 'https://buy.stripe.com/cNi8wRfFv4Cb1fN3DUgrS0a';
  /* Endereço do webhook de entrada do GoHighLevel (workflow "Inscrição"). Enquanto estiver vazio, a inscrição
     não é enviada. Não é um segredo: só aceita dados. Nunca ponhas aqui chaves de API. */
  const WEBHOOK_INSCRICAO = 'https://services.leadconnectorhq.com/hooks/edKb7bpIXSA838eQDrMd/webhook-trigger/fuo4k7EhouwDloxpHGHn';

  /* Passa a Clara: cada pessoa tem um código de 6 letras; quem chega por ?ref=CÓDIGO fica com ele guardado 30 dias */
  const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const FORMATO = /^[A-HJ-NP-Z2-9]{6}$/;
  const K_MEU = 'n5-passa-codigo', K_REF = 'n5-passa-ref', VALIDADE_REF = 30 * 24 * 3600 * 1000;
  const lerLS = k => { try { return window.localStorage.getItem(k); } catch (_) { return null; } };
  const gravarLS = (k, v) => { try { window.localStorage.setItem(k, v); } catch (_) {} };
  const normalizar = c => String(c || '').trim().toUpperCase();
  const codigoValido = c => FORMATO.test(normalizar(c));
  const novoCodigo = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => ALFABETO[b % 32]).join('');
  function meuCodigo() {
    const c = lerLS(K_MEU);
    if (codigoValido(c)) return normalizar(c);
    const novo = novoCodigo();
    gravarLS(K_MEU, novo);
    return novo;
  }
  function refGuardado() {
    try {
      const r = JSON.parse(lerLS(K_REF) || 'null');
      return r && codigoValido(r.codigo) && Date.now() - r.em < VALIDADE_REF ? normalizar(r.codigo) : null;
    } catch (_) { return null; }
  }
  try {
    const r = normalizar(new URLSearchParams(window.location.search).get('ref'));
    if (codigoValido(r) && r !== normalizar(lerLS(K_MEU))) gravarLS(K_REF, JSON.stringify({ codigo: r, em: Date.now() }));
  } catch (_) {}
  const $ = (selector, root = document) => root.querySelector(selector);
  const page = document.body.dataset.page;

  if (page === 'landing') {
    const stickyCTA = $('.sticky-mobile-cta');
    const hero = $('.hero');
    if (stickyCTA && hero && 'IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver(entries => {
        stickyCTA.classList.toggle('is-visible', !entries[0].isIntersecting);
      }, { threshold: 0 });
      visibilityObserver.observe(hero);
    }

    const samples = {
      dia: {
        user: 'Clara, quais são as minhas prioridades de hoje?',
        assistant: 'Tens 2 visitas marcadas, 3 leads por acompanhar e um documento pendente. Organizei o teu dia por prioridade.'
      },
      visita: {
        user: 'Acabei de visitar um T3 com a Maria. Ela gostou do imóvel, mas quer falar com o banco. Regista isso.',
        assistant: 'Registei o feedback na ficha da Maria e preparei uma tarefa para acompanhar a questão do financiamento.'
      },
      tarefa: {
        user: 'Clara, cria uma tarefa para contactar o João amanhã.',
        assistant: 'Tarefa criada para amanhã: contactar o João. Vai aparecer no teu plano do dia.'
      }
    };
    document.querySelectorAll('[data-demo]').forEach(button => {
      button.addEventListener('click', () => {
        const sample = samples[button.dataset.demo];
        if (!sample) return;
        $('#demo-user').textContent = sample.user;
        $('#demo-assistant').textContent = sample.assistant;
        document.querySelectorAll('[data-demo]').forEach(tab => {
          const selected = tab === button;
          tab.classList.toggle('active', selected);
          tab.setAttribute('aria-pressed', String(selected));
        });
      });
    });

    const form = $('#lead-form');
    const inputs = {
      name: $('#lead-name'), email: $('#lead-email'), phone: $('#lead-phone'), consent: $('#consent')
    };
    const errors = {
      name: $('#error-name'), email: $('#error-email'), phone: $('#error-phone'), consent: $('#error-consent')
    };
    function setError(field, message) {
      errors[field].textContent = message;
      if (inputs[field].type !== 'checkbox') inputs[field].setAttribute('aria-invalid', String(Boolean(message)));
    }
    function validate() {
      Object.keys(errors).forEach(key => setError(key, ''));
      let valid = true;
      const name = inputs.name.value.trim().replace(/\s+/g, ' ');
      const email = inputs.email.value.trim();
      const phone = inputs.phone.value.trim();
      const digits = phone.replace(/\D/g, '');
      if (name.length < 2) { setError('name', 'Introduz o teu nome.'); valid = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('email', 'Introduz um email válido.'); valid = false; }
      if (digits.length < 9 || digits.length > 15) { setError('phone', 'Introduz um número de telefone válido, com indicativo se necessário.'); valid = false; }
      if (!inputs.consent.checked) { setError('consent', 'É necessário ler e aceitar a informação indicada para continuar.'); valid = false; }
      return valid ? { nome: name, email, telefone: phone } : null;
    }
    form?.addEventListener('submit', event => {
      event.preventDefault();
      $('#form-alert').hidden = true;
      const lead = validate();
      if (!lead) {
        const invalid = form.querySelector('[aria-invalid="true"]') || (!inputs.consent.checked && inputs.consent);
        invalid?.focus();
        return;
      }
      const meu = meuCodigo();
      let ref = refGuardado();
      if (ref === meu) ref = null;
      const destino = new URL(LINK_PRE_RESERVA);
      destino.searchParams.set('prefilled_email', lead.email);
      if (ref) destino.searchParams.set('client_reference_id', ref);
      const seguir = () => window.location.assign(destino.toString());
      if (!WEBHOOK_INSCRICAO) { seguir(); return; }
      const eventId = 'lead_' + Date.now() + '_' + meu;
      const corpo = JSON.stringify({ nome: lead.nome, email: lead.email, telefone: lead.telefone, codigo: meu, indicado_por: ref || '', consentimento: 'sim', origem: window.location.href, event_id: eventId, timestamp: new Date().toISOString() });
      const botao = form.querySelector('[type="submit"]');
      if (botao) botao.disabled = true;
      /* Meta Pixel: Lead (só é enviado com os cookies de marketing aceites, ver pixel.js) */
      window.N5Pixel?.track('Lead', { content_name: 'Pré-reserva Nº5 Clara' }, { eventID: eventId });
      /* envia para o GHL (JSON, senão o mapping do gatilho fica vazio) e segue para a Stripe;
         se o GHL falhar ou demorar, o pagamento não fica bloqueado */
      Promise.race([
        fetch(WEBHOOK_INSCRICAO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo }).catch(() => {}),
        new Promise(r => setTimeout(r, 3000)),
      ]).then(seguir);
    });
  }

  if (page === 'thanks') {
    /* mostra a ligação pessoal do comprador (o código criado no formulário e enviado ao GHL) */
    const cod = lerLS(K_MEU);
    /* Meta Pixel: Purchase da pré-reserva (27 €), uma vez por navegador e só para quem passou pelo formulário */
    if (codigoValido(cod) && !lerLS('n5-pixel-purchase')) {
      document.addEventListener('DOMContentLoaded', () => {
        window.N5Pixel?.track('Purchase', { value: 27, currency: 'EUR', content_name: 'Pré-reserva Nº5 Clara' }, { eventID: 'purchase_' + normalizar(cod) });
        gravarLS('n5-pixel-purchase', '1');
      });
    }
    if (codigoValido(cod)) {
      const codigo = normalizar(cod);
      const ligacao = window.location.origin + '/?ref=' + codigo;
      $('#referral-url').textContent = ligacao;
      $('#referral-code').textContent = codigo;
      $('#referral-live').hidden = false;
      $('#referral-fallback').hidden = true;
      const copy = $('#copy-referral');
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(ligacao); copy.textContent = 'Ligação copiada ✓'; }
        catch (_) {
          const ta = document.createElement('textarea');
          ta.value = ligacao; document.body.appendChild(ta); ta.select();
          const ok = document.execCommand('copy'); ta.remove();
          copy.textContent = ok ? 'Ligação copiada ✓' : 'Não foi possível copiar neste navegador';
        }
      });
      $('#share-whatsapp').addEventListener('click', () => {
        const msg = 'Conheces a Nº5 Clara? É a assistente comercial dos consultores imobiliários. Se fizeres a pré-reserva pela minha ligação, conta como indicação minha: ' + ligacao;
        window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
      });
    }
  }
})();

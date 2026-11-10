/* Nº5 Clara | Demonstração estática sem bibliotecas externas.
   Integração real: substituir o armazenamento de sessão por POST para backend seguro,
   criar pedido de checkout no servidor e validar pagamento por webhook antes da confirmação. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const page = document.body.dataset.page;
  const DEMO_LEAD_KEY = 'n5_clara_demo_lead';
  const DEMO_NAME_KEY = 'n5_clara_demo_nome';
  const DEMO_DONE_KEY = 'n5_clara_demo_concluido';
  const localPage = filename => new URL(filename, window.location.href).href;

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
      try {
        // Apenas demonstração. Nenhum dado é transmitido externamente.
        sessionStorage.setItem(DEMO_LEAD_KEY, JSON.stringify(lead));
        window.location.assign(localPage('checkout-simulado.html'));
      } catch (_) {
        $('#form-alert').textContent = 'Não foi possível iniciar a demonstração neste navegador. Verifica se o armazenamento de sessão está disponível.';
        $('#form-alert').hidden = false;
      }
    });
    const saved = sessionStorage.getItem(DEMO_LEAD_KEY);
    if (saved && form) {
      try {
        const lead = JSON.parse(saved);
        inputs.name.value = lead.nome || '';
        inputs.email.value = lead.email || '';
        inputs.phone.value = lead.telefone || '';
      } catch (_) {}
    }
  }

  if (page === 'checkout') {
    const cta = $('#simulate-checkout');
    let lead = null;
    try { lead = JSON.parse(sessionStorage.getItem(DEMO_LEAD_KEY) || 'null'); } catch (_) {}
    if (!lead || !lead.nome || !lead.email || !lead.telefone) {
      $('#summary-name').textContent = 'Preenche o formulário primeiro';
      $('#summary-email').textContent = '—';
      $('#summary-phone').textContent = '—';
      cta.disabled = true;
      cta.textContent = 'Volta ao formulário para continuar';
    } else {
      $('#summary-name').textContent = lead.nome;
      $('#summary-email').textContent = lead.email;
      $('#summary-phone').textContent = lead.telefone;
      cta.addEventListener('click', () => {
        try {
          sessionStorage.setItem(DEMO_NAME_KEY, lead.nome.split(/\s+/)[0].slice(0, 50));
          sessionStorage.setItem(DEMO_DONE_KEY, 'simulado');
          sessionStorage.removeItem(DEMO_LEAD_KEY); // Evita persistir email e telefone após a simulação.
          window.location.assign(localPage('obrigado.html'));
        } catch (_) {
          alert('Não foi possível concluir a demonstração neste navegador.');
        }
      });
    }
  }

  if (page === 'thanks') {
    const done = sessionStorage.getItem(DEMO_DONE_KEY) === 'simulado';
    const firstName = done ? sessionStorage.getItem(DEMO_NAME_KEY) : '';
    if (firstName) $('#thanks-name').textContent = ', ' + firstName;
    sessionStorage.removeItem(DEMO_NAME_KEY);
    sessionStorage.removeItem(DEMO_DONE_KEY);
    sessionStorage.removeItem(DEMO_LEAD_KEY);
    const demoReferral = 'https://clara.numerocinco.pt/?ref=DEMO-CLARA';
    const copy = $('#copy-referral');
    copy?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(demoReferral);
        copy.textContent = 'Ligação de exemplo copiada ✓';
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = demoReferral;
        document.body.appendChild(ta);
        ta.select();
        const success = document.execCommand('copy');
        ta.remove();
        copy.textContent = success ? 'Ligação de exemplo copiada ✓' : 'Não foi possível copiar neste navegador';
      }
    });
    $('#share-whatsapp')?.addEventListener('click', () => {
      const message = 'Mensagem de DEMONSTRAÇÃO: conheces a Nº5 Clara? Esta ligação é apenas um exemplo e ainda não permite pré-reservas nem contabiliza indicações: ' + demoReferral;
      window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
    });
  }
})();

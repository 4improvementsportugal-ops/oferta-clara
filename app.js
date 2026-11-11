/* Nº5 Clara | Landing: CTA fixo no telemóvel e exemplos da conversa. O checkout está em checkout.js. */
(() => {
  'use strict';
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
  }
})();

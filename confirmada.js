/* Nº5 Clara | Página para onde a Stripe devolve quem pagou a pré-reserva.
   Mostra o código Passa a Clara guardado no navegador e a mensagem para partilhar no WhatsApp.
   Esta página não prova pagamento: a confirmação real vem do webhook da Stripe, no servidor. */
(() => {
  'use strict';
  const SITE = 'https://clara.numerocinco.pt/';
  const TEXTO = 'Inscrevi-me na N5 Clara, a assistente comercial dos consultores imobiliários: responde às leads em minutos, organiza o dia e diz como fechar. Lança a 1 de dezembro. Se te inscreveres pela minha ligação, ou com o meu código, contas como indicação minha.';
  const FORMATO = /^[A-HJ-NP-Z2-9]{6}$/;

  let codigo = null;
  try {
    const c = String(window.localStorage.getItem('n5-passa-codigo') || '').trim().toUpperCase();
    if (FORMATO.test(c)) codigo = c;
  } catch (_) { /* sem armazenamento: partilha-se o site */ }

  let ligacao = SITE;
  if (codigo) {
    const u = new URL(SITE);
    u.searchParams.set('utm_source', 'partilha');
    u.searchParams.set('utm_medium', 'whatsapp');
    u.searchParams.set('utm_campaign', 'passa-a-clara');
    u.searchParams.set('ref', codigo);
    ligacao = u.toString();
    const alvo = document.getElementById('codigo-texto');
    if (alvo) {
      alvo.append(' O teu código é ');
      const b = document.createElement('b');
      b.textContent = codigo;
      alvo.append(b, '.');
    }
  }
  const botao = document.getElementById('partilhar-whatsapp');
  if (botao) botao.href = 'https://wa.me/?text=' + encodeURIComponent(TEXTO + ' ' + ligacao);
})();

# Nº5 Clara — Frontend estático da pré-reserva

Protótipo navegável feito com **HTML + CSS + JavaScript puro**, sem React, bibliotecas de interface, build step, dependências ou serviços de backend.

## Estrutura

- `index.html`: página de vendas da pré-reserva, com o checkout em conversa dentro da secção da oferta.
- `checkout.js`: checkout em JavaScript puro (porte do site anterior): a Clara pergunta nome, email e telemóvel e depois mostra o passo da pré-reserva, com o pagamento num Payment Link da Stripe.
- `pre-reserva-confirmada/index.html` + `confirmada.js`: página para onde a Stripe devolve quem pagou.
- `privacidade.html` e `termos.html`: política de privacidade e termos e condições.
- `cookies.js`: definições de cookies.
- `styles.css`, `app.js`, `assets/`: estilo, interações da landing e imagens.

## Pré-visualizar localmente

Na pasta extraída, executar:

```bash
python -m http.server 8080
```

Abrir `http://localhost:8080` no navegador. Também é possível abrir `index.html` diretamente, mas o servidor local reproduz melhor o funcionamento de um site.

## Fluxo do checkout

1. Na oferta, a Clara pergunta o nome, o email e o telemóvel, uma coisa de cada vez.
2. Segue-se o passo "Último passo: a pré-reserva": total de 27 €, o que se paga mês a mês, aceitação das condições e botão para a Stripe.
3. A Stripe cobra (MB WAY, Multibanco, cartão, Apple Pay, Google Pay) e devolve a pessoa a `/pre-reserva-confirmada/`.

O Payment Link em `checkout.js` (`LINK_PRE_RESERVA`) é **real**: o botão de pagamento cobra 27 €.

**Os dados da inscrição não são guardados em servidor.** O site anterior usava Netlify Forms, que não existe no GitHub Pages. Para guardar os contactos, preenche `ENDPOINT_INSCRICAO` em `checkout.js` com um endereço que aceite um POST (`application/x-www-form-urlencoded`).

## Para colocar em produção

1. Remover os avisos de demonstração, apenas após concluir as integrações reais.
2. Trocar o `sessionStorage` por envio `POST` para **um backend seguro**, que valide e grave nome, email, telefone, consentimento e informações da campanha no GHL ou na base definida. Nunca enviar chaves privadas de GHL ou checkout diretamente pelo browser.
3. O backend deve criar a sessão/pedido de checkout através do provedor de pagamentos. **Só o webhook autenticado do provedor confirma a pré-reserva**; uma URL de obrigado por si só não prova pagamento.
4. Após confirmação do pagamento, disponibilizar a página de obrigado e criar uma ligação pessoal de referenciação. Armazenar e contabilizar apenas pré-reservas pagas dentro das regras da campanha.
5. Substituir `privacidade.html` por política validada (RGPD), introduzir termos e condições, informação sobre IVA, tratamento dos dados e informação clara sobre cancelamento/renovação.
6. Verificar datas das promoções (25 fundadores, início em 1/12/2026 e prazo do Passa a Clara em 30/11/2026) antes de lançar.
7. Validar a disponibilidade real das funcionalidades anunciadas, sobretudo as de fase 2 e 3, e assegurar que os exemplos de conversas estão identificados como ilustrativos.
8. Ligar domínio, analytics e pixels **apenas após gerir adequadamente cookies e consentimentos aplicáveis**.
9. Rever identificação legal da empresa, contacto e preços/IVA antes de publicação.

## Desempenho

A página não carrega bibliotecas de frameworks. O JavaScript é diferido (`defer`), as imagens são locais, a mascote do hero é carregada com prioridade, as fontes têm fallback, as animações são mínimas e o CSS respeita `prefers-reduced-motion`. O peso final depende também do alojamento, cache, compressão e rede.

Para medir: executar Lighthouse em ambiente de staging e testar LCP, CLS, INP e funcionamento em telemóvel. Não foram inventados resultados de desempenho.

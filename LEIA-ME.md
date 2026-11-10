# Nº5 Clara — Frontend estático da pré-reserva

Protótipo navegável feito com **HTML + CSS + JavaScript puro**, sem React, bibliotecas de interface, build step, dependências ou serviços de backend.

## Estrutura

- `index.html`: página de vendas da pré-reserva, seis secções e formulário (nome, email, telemóvel e aceitação de informação de privacidade).
- `checkout-simulado.html`: página de checkout fictícia para testar a navegação.
- `obrigado.html`: confirmação simulada com programa “Passa a Clara”.
- `privacidade.html`: **placeholder de demonstração**, a substituir antes da publicação.
- `styles.css`: estilo completo e responsivo, mantendo a paleta oficial.
- `app.js`: validação do formulário, mini-demo da Clara, simulação e ações de partilha.
- `assets/`: símbolo SVG oficial, favicon, mascote e imagem de partilha da marca.

**Fontes:** títulos Bricolage Grotesque e corpo Archivo via Google Fonts, com `font-display: swap`. Não inclui ficheiros de fontes.

## Pré-visualizar localmente

Na pasta extraída, executar:

```bash
python -m http.server 8080
```

Abrir `http://localhost:8080` no navegador. Também é possível abrir `index.html` diretamente, mas o servidor local reproduz melhor o funcionamento de um site.

## Fluxo de demonstração

1. Na página principal, descer à oferta ou clicar num CTA.
2. Preencher os campos e confirmar a informação de privacidade.
3. O formulário valida os dados e coloca-os **apenas em `sessionStorage` no próprio navegador**, passando para `checkout-simulado.html`.
4. O checkout mostra o resumo e um botão **Simular confirmação**, sem recolher dados de pagamento.
5. Após o clique, email e telefone são eliminados da sessão e abre `obrigado.html`, com a secção "Passa a Clara".
6. O código de referenciação é **DEMO-CLARA**. Não há contabilização real de recomendações.

**Nada é enviado para GHL, n8n, Supabase, outro CRM ou gateway de pagamento.** O protótipo não emite vouchers, não envia emails, não cria reservas e não valida pagamentos.

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

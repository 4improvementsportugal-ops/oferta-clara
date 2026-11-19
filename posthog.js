/* Nº5 Clara | PostHog (UE, Frankfurt), como descrito na política de privacidade.
   Sem consentimento de estatística: contagem anónima, sem cookies nem nada guardado no navegador.
   Com consentimento (cookies.js → window.N5Cookies / evento "n5:cookies"): identificador no navegador e gravação
   das visitas com tudo o que se escreve escondido. Expõe window.N5Posthog.track(evento, dados).
   A chave "phc_" é pública, feita para ir no site. Nunca ponhas aqui chaves secretas. */
(() => {
  'use strict';
  const CHAVE = 'phc_knF2fZccBcGVgHcayHbPfcYfXguFx3jzxaBksdduz9R3';
  const HOST = 'https://eu.i.posthog.com';

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  const estatisticaAceite = () => {
    try { return !!(window.N5Cookies && window.N5Cookies.get()?.estatistica); } catch (_) { return false; }
  };

  /* começa sempre em modo anónimo: só memória, sem cookies, sem gravações */
  posthog.init(CHAVE, {
    api_host: HOST,
    person_profiles: 'identified_only',
    persistence: 'memory',
    disable_session_recording: true,
    session_recording: { maskAllInputs: true },
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    disable_surveys: true,
  });

  function aplicar(aceite) {
    if (aceite) {
      posthog.set_config({ persistence: 'localStorage+cookie', disable_session_recording: false });
      posthog.startSessionRecording();
    } else {
      posthog.stopSessionRecording();
      posthog.set_config({ persistence: 'memory', disable_session_recording: true });
    }
  }

  window.N5Posthog = {
    /* nunca enviar nome, email nem telefone */
    track(evento, dados) { try { posthog.capture(evento, dados || {}); } catch (_) {} },
  };

  document.addEventListener('n5:cookies', e => aplicar(!!e.detail?.estatistica));
  const verificar = () => { if (estatisticaAceite()) aplicar(true); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', verificar);
  else verificar();
})();

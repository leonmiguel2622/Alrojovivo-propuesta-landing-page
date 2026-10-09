// JS: nav, tabs, buscador, reveal, WhatsApp por plato, GSAP progresivo.
// Autor: Miguel Ángel León Oliveros.
(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  // anime.js v4 UMD expone namespace (anime.animate); v3 era callable directo
  var AZ = null;
  try{
    if(window.anime && typeof window.anime.animate === 'function') AZ = {run:window.anime.animate, stagger:window.anime.stagger};
    else if(typeof window.anime === 'function') AZ = {run:window.anime, stagger:window.anime.stagger};
  }catch(e){ AZ = null; }
  var nav = document.querySelector('.site-nav');
  var toggle = document.querySelector('.nav-toggle');
  if(nav && toggle){
    toggle.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); });
    });
  }

  // Tabs accesibles menú
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
  function selectTab(tab, animate){
    tabs.forEach(function(t){ t.setAttribute('aria-selected', t===tab?'true':'false'); t.tabIndex = t===tab?0:-1; });
    // 1) ocultar TODO primero (si la animación falla, nada queda duplicado)
    panels.forEach(function(p){ p.hidden = true; p.style.display = 'none'; });
    // 2) mostrar solo el elegido
    var key = tab.getAttribute('data-tab');
    var active = panels.filter(function(p){ return p.getAttribute('data-panel') === key; })[0];
    if(active){ active.hidden = false; active.style.display = ''; animatePanel(active, animate !== false); }
  }
  function animatePanel(panel, animate){
    var dishes = panel.querySelectorAll('.dish:not([hidden])');
    dishes.forEach(function(d){ d.classList.add('in'); });
    if(!animate || reduceMotion || !dishes.length) return;
    try{
      if(AZ){
        AZ.run({targets:dishes, translateY:[14,0], opacity:[0,1], duration:320, easing:'easeOutCubic', delay:AZ.stagger(45)});
      } else if(hasGsap){
        gsap.fromTo(dishes, {y:14, opacity:0}, {y:0, opacity:1, duration:.32, ease:'power3.out', stagger:.045, overwrite:'auto', clearProps:'transform,opacity'});
      }
    }catch(e){}
  }
  tabs.forEach(function(tab, i){
    tab.addEventListener('click', function(){ clearSearch(); selectTab(tab); tab.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'}); });
    tab.addEventListener('keydown', function(e){
      var next = null;
      if(e.key==='ArrowRight') next = tabs[(i+1)%tabs.length];
      else if(e.key==='ArrowLeft') next = tabs[(i-1+tabs.length)%tabs.length];
      else if(e.key==='Home') next = tabs[0];
      else if(e.key==='End') next = tabs[tabs.length-1];
      else return;
      e.preventDefault();
      next.focus(); selectTab(next);
    });
  });

  // Salto directo desde destacados a su categoría del menú
  document.querySelectorAll('[data-goto]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var t = tabs.filter(function(x){ return x.getAttribute('data-tab') === a.getAttribute('data-goto'); })[0];
      if(t){ clearSearch(); selectTab(t); }
      document.getElementById('menu').scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth'});
    });
  });

  // Estado inicial impuesto por JS (no depende solo del CSS en caché)
  selectTab(tabs.filter(function(t){ return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0], false);

  // Flechas para recorrer categorías (sin barra nativa)
  var tabsBox = document.querySelector('.tabs');
  var tPrev = document.getElementById('tabs-prev');
  var tNext = document.getElementById('tabs-next');
  function syncArrows(){
    if(!tabsBox || !tPrev) return;
    tPrev.disabled = tabsBox.scrollLeft <= 4;
    tNext.disabled = tabsBox.scrollLeft + tabsBox.clientWidth >= tabsBox.scrollWidth - 4;
  }
  if(tabsBox && tPrev && tNext){
    var slide = function(dir){ tabsBox.scrollBy({left:dir * 260, behavior:reduceMotion ? 'auto' : 'smooth'}); };
    tPrev.addEventListener('click', function(){ slide(-1); });
    tNext.addEventListener('click', function(){ slide(1); });
    tabsBox.addEventListener('scroll', function(){ requestAnimationFrame(syncArrows); }, {passive:true});
    window.addEventListener('resize', syncArrows);
    syncArrows();
  }

  // Reveal progresivo — solo si hay IntersectionObserver y no reduced-motion
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal');
  if(reduce || !('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function(el){ io.observe(el); });
  }

  // Buscador del menú (filtra platos en todas las categorías)
  var search = document.getElementById('menu-search');
  var searchClear = document.getElementById('search-clear');
  var searchCount = document.getElementById('search-count');
  var noResults = document.getElementById('no-results');
  function norm(s){ return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function panelFor(tab){ return panels.filter(function(p){ return p.getAttribute('data-panel')===tab.getAttribute('data-tab'); })[0]; }
  function clearSearch(){ if(search && search.value){ search.value=''; applySearch(); } }
  function applySearch(){
    if(!search) return;
    var q = norm(search.value.trim());
    searchClear.hidden = !q;
    if(!q){
      tabs.forEach(function(t){ t.hidden = false; t.style.display = ''; });
      panels.forEach(function(p){ p.querySelectorAll('.dish').forEach(function(d){ d.hidden = false; d.style.display = ''; }); });
      noResults.hidden = true;
      searchCount.textContent = '';
      var current = tabs.filter(function(t){ return t.getAttribute('aria-selected')==='true'; })[0] || tabs[0];
      selectTab(current, false);
      return;
    }
    var total = 0;
    panels.forEach(function(p){
      var hits = 0;
      p.querySelectorAll('.dish').forEach(function(d){
        var ok = norm(d.textContent).indexOf(q) > -1;
        d.hidden = !ok;
        d.style.display = ok ? '' : 'none';
        if(ok){ hits++; d.classList.add('in'); }
      });
      p.hidden = hits === 0;
      p.style.display = hits ? '' : 'none';
      if(hits) total += hits;
    });
    tabs.forEach(function(t){ var hide = panelFor(t).hidden; t.hidden = hide; t.style.display = hide ? 'none' : ''; });
    noResults.hidden = total > 0;
    searchCount.textContent = total ? total + ' resultado' + (total>1?'s':'') + ' para “' + search.value.trim() + '”' : 'Sin resultados para “' + search.value.trim() + '”';
  }
  if(search){
    search.addEventListener('input', applySearch);
    searchClear.addEventListener('click', function(){ clearSearch(); search.focus(); });
  }

  // Contador por categoría (las letras de tiles ya van en el HTML)
  tabs.forEach(function(t){
    var p = panelFor(t);
    var n = p ? p.querySelectorAll('.dish').length : 0;
    var s = document.createElement('span');
    s.className = 'tab-count';
    s.textContent = n;
    t.appendChild(s);
  });

  // Nav activa según sección visible
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  if('IntersectionObserver' in window && navLinks.length){
    var secIO = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          navLinks.forEach(function(a){ a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false'); });
        }
      });
    }, {rootMargin:'-40% 0px -55% 0px'});
    document.querySelectorAll('main section[id]').forEach(function(s){ secIO.observe(s); });
  }

  // Barra de progreso de scroll
  var bar = document.getElementById('scrollbar');
  if(bar){
    var ticking = false;
    var upd = function(){
      ticking = false;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
    };
    window.addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(upd); } }, {passive:true});
    upd();
  }

  // Count-up del rating + entrada de contacto con anime.js (blindado: nunca rompe el resto)
  if(AZ && !reduceMotion){
    try{
      var rating = document.querySelector('.hero-meta strong');
      if(rating){
        var o = {v:0};
        AZ.run({targets:o, v:4.8, duration:1200, delay:600, easing:'easeOutExpo', update:function(){ rating.textContent = '★ ' + o.v.toFixed(1) + ' (31 opiniones)'; }});
      }
      var grid = document.querySelector('.contact-grid');
      if(grid && 'IntersectionObserver' in window){
        var once = new IntersectionObserver(function(es){
          if(es[0].isIntersecting){
            once.disconnect();
            AZ.run({targets:Array.prototype.slice.call(grid.children), translateY:[18,0], opacity:[0,1], duration:450, easing:'easeOutCubic', delay:AZ.stagger(70)});
          }
        }, {threshold:.25});
        once.observe(grid);
      }
    }catch(e){}
  }
  var WA_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="12.5" cy="12" r="1.2" fill="currentColor"/><circle cx="16" cy="12" r="1.2" fill="currentColor"/></svg>';
  document.querySelectorAll('.dish').forEach(function(d){
    var name = d.querySelector('h3') ? d.querySelector('h3').textContent.trim() : 'el menú';
    var a = document.createElement('a');
    a.className = 'dish-wa';
    a.href = 'https://wa.me/573045473147?text=' + encodeURIComponent('Hola Al Rojo Vivo, me interesa: ' + name);
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Preguntar por ' + name + ' en WhatsApp');
    a.innerHTML = WA_ICON;
    d.appendChild(a);
    var more = document.createElement('span');
    more.className = 'dish-more';
    more.setAttribute('aria-hidden', 'true');
    more.textContent = 'Ver más →';
    d.querySelector('.dish-text').appendChild(more);
  });

  // GSAP progresivo: entrada hero + flotación + nada más (el scroll ya lo cubre CSS)
  if(hasGsap && !reduceMotion){
    document.documentElement.classList.add('gsap-on');
    gsap.from('.hero-copy > *', {y:22, opacity:0, duration:.6, ease:'power3.out', stagger:.08, delay:.1});
    gsap.from('.hero-logo', {scale:.92, opacity:0, duration:.7, ease:'back.out(1.4)', delay:.25});
    gsap.from('.hero-card', {y:16, opacity:0, scale:.9, duration:.5, ease:'back.out(1.7)', stagger:.12, delay:.55});
    gsap.to('.float-1', {y:-8, duration:2.2, ease:'sine.inOut', yoyo:true, repeat:-1});
    gsap.to('.float-2', {y:8, duration:2.6, ease:'sine.inOut', yoyo:true, repeat:-1, delay:.4});
  }
  document.querySelectorAll('[data-pending]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      var k = el.getAttribute('data-pending');
      var msg = { whatsapp:'Falta el número real de WhatsApp.', telefono:'Falta el teléfono real.', instagram:'Falta el Instagram real.', facebook:'Falta el Facebook real.', tiktok:'Falta el TikTok real.', maps:'Falta la dirección real para Google Maps.' }[k] || 'Dato pendiente.';
      el.setAttribute('title', msg);
      if(window.alert) alert('PENDIENTE: ' + msg);
    });
  });

  // Botones pendientes: avisan qué falta en vez de parecer rotos
  document.querySelectorAll('[data-pending]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      var k = el.getAttribute('data-pending');
      var msg = { whatsapp:'Falta el número real de WhatsApp.', telefono:'Falta el teléfono real.', instagram:'Falta el Instagram real.', facebook:'Falta el Facebook real.', tiktok:'Falta el TikTok real.', maps:'Falta la dirección real para Google Maps.' }[k] || 'Dato pendiente.';
      el.setAttribute('title', msg);
      if(window.alert) alert('PENDIENTE: ' + msg);
    });
  });

  // Loading: se va al cargar (con mínimo visible) o por tiempo máximo
  var loader = document.getElementById('loader');
  function hideLoader(){
    if(!loader || loader.classList.contains('done')) return;
    loader.classList.add('done');
    setTimeout(function(){ if(loader.parentNode) loader.parentNode.removeChild(loader); }, 600);
  }
  window.addEventListener('load', function(){ setTimeout(hideLoader, 700); });
  setTimeout(hideLoader, 3400);

  // Tema claro/oscuro manual con memoria (el inline del head ya evitó el parpadeo)
  var themeBtn = document.getElementById('theme-toggle');
  function syncThemeBtn(){
    if(!themeBtn) return;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    themeBtn.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
  }
  if(themeBtn){
    syncThemeBtn();
    themeBtn.addEventListener('click', function(){
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try{ localStorage.setItem('arv-theme', next); }catch(e){}
      document.documentElement.setAttribute('data-theme', next);
      syncThemeBtn();
    });
  }

  var y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();

  // Modal detalle por plato (clic en la tarjeta; las flechas pasean la categoría)
  var CAT = {tacos:'Tacos x3', burrotes:'Burrotes', quesadillas:'Quesadillas', tortas:'Tortas', burgers:'Burgers', dogs:'Dogs', nachos:'Nachos y papas', picar:"Pa' picar", postre:'Postre e infantil', chelas:'Chelas y micheladas', cocteles:'Cocteles y shots', aguas:'Aguas y refrescos'};
  var dlg = document.getElementById('dish-modal');
  var dmList = [], dmIndex = 0, lastFocus = null;
  function dmDishName(d){ return d.querySelector('h3') ? d.querySelector('h3').textContent.trim() : 'Plato'; }
  function dmDishDesc(d){    var box = document.getElementById('dm-desc');
    box.innerHTML = '';
    var p = d.querySelector('.dish-text p');
    var ul = d.querySelector('.dish-text ul');
    if(p){ var np = document.createElement('p'); np.style.margin = '0'; np.textContent = p.textContent; box.appendChild(np); }
    if(ul){ var nu = document.createElement('ul'); ul.querySelectorAll('li').forEach(function(li){ var c = document.createElement('li'); c.textContent = li.textContent; nu.appendChild(c); }); box.appendChild(nu); }
  }
  function dmRender(i){
    var d = dmList[i];
    if(!d) return;
    dmIndex = (i + dmList.length) % dmList.length;
    d = dmList[dmIndex];
    var name = dmDishName(d);
    var mediaImg = document.getElementById('dm-img');
    var photo = d.querySelector('.ph-dish img, .ph-card img');
    document.getElementById('dm-tileletter').textContent = name.charAt(0).toUpperCase();
    if(photo){ mediaImg.src = photo.currentSrc || photo.src; mediaImg.alt = name; mediaImg.hidden = false; mediaImg.style.display = ''; }
    else { mediaImg.removeAttribute('src'); mediaImg.hidden = true; mediaImg.style.display = 'none'; }
    document.getElementById('dm-name').textContent = name;
    var panel = d.closest('[data-panel]');
    document.getElementById('dm-kicker').textContent = panel ? (CAT[panel.getAttribute('data-panel')] || 'Menú') : 'Menú';
    dmDishDesc(d);
    var wa = d.querySelector('.dish-wa');
    document.getElementById('dm-wa').href = wa ? wa.href : 'https://wa.me/573045473147';
    document.getElementById('dm-copied').hidden = true;
    if(AZ && !reduceMotion){
      try{ AZ.run({targets:'#dish-modal .dm-media, #dish-modal .dm-name', scale:[.96,1], opacity:[.4,1], duration:280, easing:'easeOutCubic'}); }catch(e){}
    }
  }
  function dmOpen(dish){
    var panel = dish.closest('[data-panel]');
    dmList = panel ? Array.prototype.slice.call(panel.querySelectorAll('.dish:not([hidden])')) : [dish];
    lastFocus = document.activeElement;
    dmRender(dmList.indexOf(dish));
    if(dlg && typeof dlg.showModal === 'function'){ dlg.showModal(); document.getElementById('dm-close').focus({preventScroll:true}); }
  }
  if(dlg){
    document.querySelectorAll('.menu-panels .dish').forEach(function(d){
      d.setAttribute('tabindex', '0');
      d.setAttribute('role', 'button');
      d.setAttribute('aria-label', 'Ver detalle de ' + dmDishName(d));
      d.addEventListener('click', function(e){ if(e.target.closest('a,button')) return; dmOpen(d); });
      d.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); dmOpen(d); } });
    });
    document.getElementById('dm-close').addEventListener('click', function(){ dlg.close(); });
    document.getElementById('dm-prev').addEventListener('click', function(){ dmRender(dmIndex - 1); });
    document.getElementById('dm-next').addEventListener('click', function(){ dmRender(dmIndex + 1); });
    dlg.addEventListener('click', function(e){ if(e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function(){ if(lastFocus && lastFocus.focus){ try{ lastFocus.focus({preventScroll:true}); }catch(e){ lastFocus.focus(); } } });
    document.getElementById('dm-share').addEventListener('click', function(){
      var data = {title:'Al Rojo Vivo', text:dmDishName(dmList[dmIndex]) + ' — Al Rojo Vivo, Bucaramanga', url:location.href};
      if(navigator.share){ navigator.share(data).catch(function(){}); }
      else if(navigator.clipboard){
        navigator.clipboard.writeText(data.text + ' ' + data.url).then(function(){ document.getElementById('dm-copied').hidden = false; }, function(){});
      }
    });
  }

  // Resalta la fila de hoy en horarios (Lun=0..Dom=6)
  try{
    var rows = document.querySelectorAll('.hours tbody tr');
    if(rows.length === 7){
      var today = (new Date().getDay() + 6) % 7;
      rows[today].classList.add('today');
    }
  }catch(e){}

  // Copiar dirección al portapapeles
  var copyBtn = document.getElementById('copy-addr');
  if(copyBtn){
    copyBtn.addEventListener('click', function(){
      var done = function(){ copyBtn.textContent = '¡Dirección copiada!'; setTimeout(function(){ copyBtn.textContent = 'Copiar dirección'; }, 2000); };
      if(navigator.clipboard){ navigator.clipboard.writeText('Cl. 20 Nte. #10-94, Bucaramanga, Santander').then(done, function(){}); }
    });
  }

  // Estado en vivo: horario del local Lun cerrado, Mar-Vie 17-23, Sab-Dom 17-24
  try{
    var now = new Date(), d = now.getDay(), h = now.getHours() + now.getMinutes()/60;
    var open = (d>=2 && d<=5 && h>=17 && h<23) || ((d===6 || d===0) && h>=17);
    var closeLabel = (d===0 || d===6) ? '12 a.m.' : '11 p.m.';
    var badge = document.getElementById('open-badge');
    var status = document.getElementById('hours-status');
    var state = document.getElementById('hours-state');
    if(badge) badge.textContent = open ? 'Abierto ahora' : (d===1 ? 'Cerrado hoy (lunes)' : 'Abre hoy 5 p.m.');
    if(status && state){
      if(open){ status.classList.remove('closed'); state.textContent = 'Abierto ahora · cerramos ' + closeLabel; }
      else{
        status.classList.add('closed');
        state.textContent = d===1 ? 'Cerrado · abrimos mañana 5 p.m.' : (h<17 ? 'Cerrado · abrimos hoy 5 p.m.' : 'Cerrado · abrimos mañana 5 p.m.');
      }
    }
  }catch(e){}
})();

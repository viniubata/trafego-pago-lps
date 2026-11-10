/* ===== CONFIGURAÇÃO (troque aqui) ===== */
const WHATSAPP_NUMBER = '5511954353037';           // DDI+DDD+número, só dígitos
const PHONE_DISPLAY   = '(11) 95435-3037';
const WA_DEFAULT_MSG  = 'Olá! Vi o site da Vértice Porcelanato e quero um orçamento de bancada de porcelanato.';
// Endpoint do formulário. Formspree: 'https://formspree.io/f/SEU_ID'.
// Google Sheets: URL do Apps Script publicado como Web App. Vazio = só envia pelo WhatsApp.
const FORM_ENDPOINT   = '';

const waLink = (msg = WA_DEFAULT_MSG) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
document.documentElement.classList.add('js');

/* Links de WhatsApp e telefone centralizados */
document.querySelectorAll('[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa || WA_DEFAULT_MSG); a.target = '_blank'; a.rel = 'noopener'; a.addEventListener('click', e => { e.preventDefault(); openForm(a); }); });
document.querySelectorAll('[data-tel]').forEach(a => { a.href = 'tel:+' + WHATSAPP_NUMBER; });
document.querySelectorAll('[data-phone]').forEach(el => { el.textContent = PHONE_DISPLAY; });
const y = document.getElementById('ano'); if (y) y.textContent = new Date().getFullYear();

/* Fade-up discreto (o conteúdo já nasce visível) */
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); } });
}

/* ===== Galeria ===== */
const cards = [...document.querySelectorAll('.card')];

/* ===== Lightbox ===== */
const lb = document.getElementById('lb'), lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap'), lbCount = document.getElementById('lb-count');
let cur = 0, lastFocus = null;
const visible = () => cards;
function show(i) {
  const list = visible(); cur = (i + list.length) % list.length; const c = list[cur], img = c.querySelector('img');
  lbImg.src = img.dataset.full; lbImg.alt = img.alt; lbCap.textContent = c.dataset.cap;
  lbCount.textContent = `${cur + 1} / ${list.length}`;
}
function openLb(card) { lastFocus = document.activeElement; show(visible().indexOf(card)); lb.hidden = false; document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); }
function closeLb() { lb.hidden = true; document.body.style.overflow = ''; lastFocus?.focus(); }
cards.forEach(c => c.querySelector('button').addEventListener('click', () => openLb(c)));
lb.querySelector('.lb-close').addEventListener('click', closeLb);
lb.querySelector('.lb-prev').addEventListener('click', () => show(cur - 1));
lb.querySelector('.lb-next').addEventListener('click', () => show(cur + 1));
lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-stage')) closeLb(); });
document.addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLb();
  else if (e.key === 'ArrowLeft') show(cur - 1);
  else if (e.key === 'ArrowRight') show(cur + 1);
  else if (e.key === 'Tab') { // mantém o foco dentro do lightbox
    const f = [...lb.querySelectorAll('button')]; const i = f.indexOf(document.activeElement);
    e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
});
let tx = null;
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => { if (tx === null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); tx = null; });

/* "Quero um orçamento com este acabamento" → preenche o formulário */
const fAmb = document.getElementById('f-amb'), fAcab = document.getElementById('f-acab'), fMsg = document.getElementById('f-msg');
document.getElementById('lb-cta').addEventListener('click', () => {
  const c = visible()[cur];
  fAmb.value = c.dataset.amb; fAcab.value = c.dataset.acab;
  fMsg.value = `Gostei do projeto: ${c.dataset.title}.`;
  closeLb(); document.getElementById('orcamento').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('f-nome').focus({ preventScroll: true }), 600);
});

/* ===== Formulário ===== */
const form = document.getElementById('form-orc'), tel = document.getElementById('f-tel');
tel.addEventListener('input', () => {
  let d = tel.value.replace(/\D/g, '').slice(0, 11);
  tel.value = d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
});
const rules = {
  'f-nome': v => v.trim().length >= 3 || 'Informe seu nome.',
  'f-tel': v => v.replace(/\D/g, '').length >= 10 || 'Informe um WhatsApp com DDD.',
  'f-cidade': v => v.trim().length >= 2 || 'Informe sua cidade ou bairro.',
  'f-amb': v => !!v || 'Escolha o ambiente.',
  'f-perfil': v => !!v || 'Escolha uma opção.',
  'f-fase': v => !!v || 'Escolha uma opção.',
  'f-prazo': v => !!v || 'Escolha uma opção.',
  'f-proj': v => !!v || 'Escolha uma opção.'
};
function check(id) {
  const el = document.getElementById(id), r = rules[id](el.value), box = el.closest('.field');
  box.classList.toggle('err', r !== true); box.querySelector('.msg').textContent = r === true ? '' : r;
  el.setAttribute('aria-invalid', r !== true); return r === true;
}
Object.keys(rules).forEach(id => document.getElementById(id).addEventListener('blur', () => check(id)));
form.addEventListener('submit', async e => {
  e.preventDefault();
  const bad = Object.keys(rules).filter(id => !check(id));
  if (bad.length) { document.getElementById(bad[0]).focus(); return; }
  const data = Object.fromEntries(new FormData(form));
  const msg = `Olá! Quero um orçamento de bancada de porcelanato.\n\nNome: ${data.nome}\nWhatsApp: ${data.whatsapp}\nCidade/Bairro: ${data.cidade}\nAmbiente: ${data.ambiente}\nPerfil: ${data.perfil}\nFase da obra: ${data.fase}\nPrazo: ${data.prazo}\nProjeto/medidas: ${data.projeto}\nAcabamento: ${data.acabamento || 'Ainda não sei'}${data.mensagem ? `\nMensagem: ${data.mensagem}` : ''}`;
  if (FORM_ENDPOINT) { try { await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }); } catch (_) {} }
  const link = waLink(msg);
  form.classList.add('done'); form.innerHTML = `<div class="success" role="status"><h3>Pedido pronto.</h3><p>Toque no botão abaixo para enviar pelo WhatsApp. Respondemos em horário comercial.</p><a class="btn btn-primary" href="${link}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a></div>`;
  if (typeof fbq === 'function') fbq('track', 'Lead');
  if (typeof gtag === 'function') gtag('event', 'generate_lead');
  window.open(link, '_blank', 'noopener');
});

/* ===== Botões de WhatsApp abrem o formulário de qualificação ===== */
const fm = document.getElementById('fm'), slot = document.getElementById('fm-slot'), home = form.parentNode, anchor = document.createComment('form');
home.insertBefore(anchor, form);
let fmLast = null;
function openForm(trigger) {
  fmLast = trigger; slot.appendChild(form); fm.hidden = false; document.body.style.overflow = 'hidden';
  if (trigger?.dataset.wa && fMsg && !fMsg.value) fMsg.value = trigger.dataset.wa.replace(/^Olá! ?/, '');
  setTimeout(() => (document.getElementById('f-nome') || fm.querySelector('a,button')).focus(), 50);
  if (typeof fbq === 'function') fbq('track', 'Contact');
}
function closeForm() { home.insertBefore(form, anchor.nextSibling); fm.hidden = true; document.body.style.overflow = ''; fmLast?.focus(); }
fm.querySelector('.fm-close').addEventListener('click', closeForm);
fm.addEventListener('click', e => { if (e.target === fm) closeForm(); });
document.addEventListener('keydown', e => { if (!fm.hidden && e.key === 'Escape') closeForm(); });

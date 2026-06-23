/* ============================================================
   SCROLL REVEAL (fade + slide)
   ============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
});

/* ============================================================
   NAV — scroll state
   ============================================================ */
const nav = document.getElementById('site-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ============================================================
   MOBILE MENU
   ============================================================ */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});
mobileMenu?.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => mobileMenu.classList.remove('open'))
);

/* ============================================================
   SUBTLE PARALLAX (hero decorative squares) — desktop only
   ============================================================ */
const heroStack = document.querySelector('.hero-photo-stack');
let ticking = false;

function applyParallax() {
  const y = window.scrollY;
  if (heroStack && window.innerWidth > 600) {
    const sq1 = heroStack.querySelector('.sq1');
    const sq2 = heroStack.querySelector('.sq2');
    if (sq1) sq1.style.transform = `translateY(${y * 0.06}px)`;
    if (sq2) sq2.style.transform = `translateY(${y * -0.04}px)`;
  }
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(applyParallax);
    ticking = true;
  }
}, { passive: true });

/* ============================================================
   CERTIFICATIONS — LIGHTBOX
   ============================================================ */
const certificates = [
  { image: 'images/IBM_Management_Consultant.png', pdf: 'pdfs/IBM_Management_Consultant.pdf', title: 'IBM Management Consultant Professional Certificate, Coursera', credential: 'https://www.coursera.org/account/accomplishments/professional-cert/XAUKX0J9NCH6' },
  { image: 'images/IIBA - ECBA certificate.png', pdf: 'pdfs/IIBA - ECBA certificate.pdf', title: 'Entry Certificate in Business Analysis, IIBA', credential: 'https://badges.iiba.org/5a124e1a-7ca9-461b-bee8-629dfc02caa5#acc.DIMjGCg5' },
  { image: 'images/My_Learning___NVIDIA.png', pdf: 'pdfs/My Learning _ NVIDIA.pdf', title: 'Building LLM Applications with Prompt Engineering, NVIDIA' },
  { image: 'images/tableau_cert_prep.png', pdf: 'pdfs/CertificateOfCompletion_Tableau Certified Data Analyst Cert Prep.pdf', title: 'Tableau Certified Data Analyst Cert Prep, LinkedIn' },
  { image: 'images/course_r.png', pdf: 'pdfs/CertificateOfCompletion_R for Data Science Analysis and Visualization.pdf', title: 'R for Data Science: Analysis and Visualization, LinkedIn' },
  { image: 'images/excel_2019.png', pdf: 'pdfs/CertificateOfCompletion_Learning Excel 2019.pdf', title: 'Learning Excel 2019, LinkedIn' },
  { image: 'images/course_1.png', pdf: 'pdfs/course 1.pdf', title: 'Foundations of User Experience (UX) Design, Coursera' },
  { image: 'images/Course_2.png', pdf: 'pdfs/Course 2.pdf', title: 'Start the UX Design Process: Empathize, Define and Ideate, Coursera' },
  { image: 'images/Meghana_L_Artificial_Intelligence_Unschool_Certificate2021.png', pdf: 'pdfs/Meghana L_Artificial Intelligence_Unschool Certificate2021.pdf', title: 'Artificial Intelligence, Unschool' },
  { image: 'images/Meghana.L_1BY19IS094_IoT.png', pdf: 'pdfs/Meghana.L 1BY19IS094_IoT.pdf', title: 'Internet of Things with Hands On' },
  { image: 'images/Certificate_for_Meghana_L_for__Alumni_Session__-__Expectat..._.png', pdf: 'pdfs/Certificate for Meghana L for _Alumni Session  - _Expectat..._.pdf', title: 'Expectations and Challenges in the IT Industry' }
];

let currentCertIndex = 0;
const lightbox = document.getElementById('cert-lightbox');
const lbImg = document.getElementById('lb-img');
const lbTitle = document.getElementById('lb-title');
const lbPdfBtn = document.getElementById('lb-pdf');
const lbCredBtn = document.getElementById('lb-cred');

function openLightbox(index) {
  if (index < 0 || index >= certificates.length) return;
  currentCertIndex = index;
  const cert = certificates[index];
  lbImg.src = cert.image;
  lbTitle.textContent = cert.title;
  lbPdfBtn.href = cert.pdf;
  if (cert.credential) {
    lbCredBtn.href = cert.credential;
    lbCredBtn.style.display = 'inline-flex';
  } else {
    lbCredBtn.style.display = 'none';
  }
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('lb-close')?.addEventListener('click', closeLightbox);
document.getElementById('lb-prev')?.addEventListener('click', () => openLightbox(currentCertIndex - 1));
document.getElementById('lb-next')?.addEventListener('click', () => openLightbox(currentCertIndex + 1));
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox?.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') openLightbox(currentCertIndex - 1);
  if (e.key === 'ArrowRight') openLightbox(currentCertIndex + 1);
});
document.querySelectorAll('.cert-card').forEach((card, i) =>
  card.addEventListener('click', () => openLightbox(i))
);

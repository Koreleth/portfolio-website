function animateText(textElement) {
    const printText = textElement.dataset.text;

    // Nachlaufende Leerzeichen/Umbrüche aus dem Template entfernen
    const contentArray = printText.split('/n').map(line => line.replace(/\s+$/, ''));

    contentArray.forEach((line, lineIndex) => {
      const lineContainer = document.createElement('span');
      lineContainer.className = 'code-line';
      lineContainer.id = 'line-' + lineIndex;

      const characters = [...line];

      setTimeout(() => {
        // Zeile erst beim Tippen anlegen, damit die Zeilennummern mitwachsen
        textElement.appendChild(lineContainer);
        textElement.scrollTop = textElement.scrollHeight;
        textElement.querySelectorAll('.typing').forEach(el => el.classList.remove('typing'));
        lineContainer.classList.add('typing');

        characters.forEach((char, charIndex) => {
          setTimeout(() => {
            lineContainer.appendChild(document.createTextNode(char));
            // Wie im Terminal: immer die zuletzt getippte Zeile zeigen
            textElement.scrollTop = textElement.scrollHeight;
          }, charIndex * 5);
        });

        if (lineIndex === contentArray.length - 1) {
          setTimeout(() => {
            lineContainer.classList.remove('typing');
            textElement.classList.add('done');
          }, characters.length * 5);
        }
      }, lineIndex * 200);
    });
  }

  // Scroll-Trigger mit IntersectionObserver
  document.addEventListener('DOMContentLoaded', function () {
    const target = document.querySelector('.text');
    if (!target) return;

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateText(entry.target);
          observer.unobserve(entry.target); // nur einmal ausführen
        }
      });
    }, {
      threshold: 0.3 // Trigger wenn 30% des Elements sichtbar sind
    });

    observer.observe(target);
  });


  //LEBENSLAUF: Station per Klick aufklappen (immer nur eine offen)
  document.addEventListener("DOMContentLoaded", function() {
    const heads = document.querySelectorAll('.cv-head');

    heads.forEach(head => {
        head.addEventListener('click', () => {
            const item = head.closest('.cv-item');
            const wasOpen = item.classList.contains('is-open');

            heads.forEach(other => {
                other.closest('.cv-item').classList.remove('is-open');
                other.setAttribute('aria-expanded', 'false');
            });

            if (!wasOpen) {
                item.classList.add('is-open');
                head.setAttribute('aria-expanded', 'true');
            }
        });
    });
});

// Startseite (Desktop): Mausrad/Touchpad springt immer genau einen Bereich weiter
document.addEventListener("DOMContentLoaded", function() {
    const sections = [...document.querySelectorAll('.hero, .screen')];
    if (sections.length < 2) return;

    // Gleiche Bedingung wie das Einrasten in style.css
    const snapQuery = window.matchMedia('(min-width: 861px) and (min-height: 600px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let locked = false;
    let lastWheel = 0;

    // Kann ein Element unter dem Mauszeiger (z. B. das Code-Fenster) selbst noch weiterscrollen?
    const canScrollInside = (target, direction) => {
        for (let el = target; el && el !== document.body; el = el.parentElement) {
            if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight) continue;
            if (direction > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
        }
        return false;
    };

    // Erst wieder freigeben, wenn das Rad kurz Ruhe gibt (Touchpads scrollen nach)
    const unlock = () => {
        if (Date.now() - lastWheel < 180) return setTimeout(unlock, 120);
        locked = false;
    };

    window.addEventListener('wheel', (e) => {
        if (!snapQuery.matches || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
        // Nur wenn alle Bereiche wirklich auf den Bildschirm passen
        if (sections.some(section => section.offsetHeight > window.innerHeight + 2)) return;

        const direction = Math.sign(e.deltaY);
        if (direction === 0 || canScrollInside(e.target, direction)) return;

        e.preventDefault();
        lastWheel = Date.now();
        if (locked) return;

        const current = sections.reduce((best, section, index) =>
            Math.abs(section.offsetTop - window.scrollY) < Math.abs(sections[best].offsetTop - window.scrollY) ? index : best, 0);
        const next = Math.min(sections.length - 1, Math.max(0, current + direction));
        if (next === current) return;

        locked = true;
        window.scrollTo({ top: sections[next].offsetTop, behavior: reduceMotion ? 'auto' : 'smooth' });
        setTimeout(unlock, 700);
    }, { passive: false });
});

// Navigation wird dunkel, solange sie über einem dunklen Bereich liegt (Hero, Kontakt)
document.addEventListener("DOMContentLoaded", function() {
    const nav = document.querySelector('nav');
    const darkAreas = document.querySelectorAll('.hero, footer');
    if (!nav || darkAreas.length === 0) return;

    const updateNav = () => {
        const navRect = nav.getBoundingClientRect();
        const navMiddle = navRect.top + navRect.height / 2;
        const onDark = [...darkAreas].some(area => {
            const rect = area.getBoundingClientRect();
            return rect.top <= navMiddle && rect.bottom >= navMiddle;
        });
        nav.classList.toggle('nav-on-dark', onDark);
    };

    window.addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', updateNav);
    updateNav();
});

 //Elemente active in navbar (über die IDs der Sektionen)
document.addEventListener("DOMContentLoaded", function() {
    const sections = document.querySelectorAll('section[id], footer[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    // Unterseiten ohne eigene Sektionen: keine Markierung
    if (!document.querySelector('section[id]')) return;

    function activateLink() {
        let current = sections[0];
        sections.forEach(section => {
            if (window.scrollY + 120 >= section.offsetTop) current = section;
        });

        // Ganz unten angekommen: letzte Sektion (Kontakt) aktivieren
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
            current = sections[sections.length - 1];
        }

        navLinks.forEach((link) => {
            link.classList.toggle('nav-active', link.hash === '#' + current.id);
        });
    }

    window.addEventListener('scroll', activateLink, { passive: true });
    window.addEventListener('load', activateLink);
    activateLink(); // Initial call to set the active link on page load
});

// Sanftes Einblenden der Inhalte beim Scrollen
document.addEventListener("DOMContentLoaded", function() {
    const items = document.querySelectorAll('section > h2, .card-link, .about-grid > *, .upperpart > *, .middlepart > *');
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach((item, i) => {
      item.classList.add('reveal');
      // Karten nacheinander einblenden
      if (item.classList.contains('card-link')) {
        item.style.transitionDelay = (i % 4) * 80 + 'ms';
      }
      observer.observe(item);
    });
});

// HERO: Spotlight, Video-Karte und Schreibmaschinen-Zeile
document.addEventListener("DOMContentLoaded", function() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Punkteraster leuchtet rund um den Mauszeiger auf
    let pointerX = 0;
    let pointerY = 0;
    let frame = null;
    hero.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        pointerX = e.clientX;
        pointerY = e.clientY;
        if (frame) return;
        frame = requestAnimationFrame(() => {
            const rect = hero.getBoundingClientRect();
            hero.style.setProperty('--mx', (pointerX - rect.left) + 'px');
            hero.style.setProperty('--my', (pointerY - rect.top) + 'px');
            frame = null;
        });
    });

    // Video-Karte neigt sich leicht in Richtung Maus
    const card = hero.querySelector('.video-card');
    if (card && !reduceMotion) {
        card.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse' || card.classList.contains('is-playing')) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.setProperty('--rx', (-y * 8) + 'deg');
            card.style.setProperty('--ry', (x * 10) + 'deg');
        });
        card.addEventListener('pointerleave', () => {
            card.style.removeProperty('--rx');
            card.style.removeProperty('--ry');
        });
    }

    // YouTube wird erst beim Klick geladen (schneller und datensparsamer)
    const trigger = hero.querySelector('.video-trigger');
    if (card && trigger) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube-nocookie.com/embed/' + card.dataset.video + '?autoplay=1&rel=0';
            iframe.title = 'Kurze Vorstellung';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.allowFullscreen = true;
            card.classList.add('is-playing');
            card.style.removeProperty('--rx');
            card.style.removeProperty('--ry');
            trigger.replaceWith(iframe);
        });
    }

    // Schreibmaschine: tippt die Kategorien nacheinander
    const typeEl = hero.querySelector('.hero-type');
    if (typeEl && !reduceMotion) {
        const words = JSON.parse(typeEl.dataset.words || '[]');
        if (words.length > 1) {
            let wordIndex = 0;
            let charIndex = words[0].length;
            let deleting = true;

            const tick = () => {
                const word = words[wordIndex];
                charIndex += deleting ? -1 : 1;
                typeEl.textContent = word.slice(0, charIndex);

                if (!deleting && charIndex === word.length) {
                    deleting = true;
                    return setTimeout(tick, 1800);
                }
                if (deleting && charIndex === 0) {
                    deleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                    return setTimeout(tick, 350);
                }
                setTimeout(tick, deleting ? 35 : 75);
            };
            setTimeout(tick, 2400);
        }
    }
});

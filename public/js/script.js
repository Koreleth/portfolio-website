function animateText(textElement) {
    const printText = textElement.dataset.text;

    // Eine Zeile pro Zeilenumbruch (Inhalt aus models/about.json), Leerraum am Zeilenende entfernen
    const contentArray = printText.split(/\r?\n/).map(line => line.replace(/\s+$/, ''));

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
    // Nur auf der Startseite; Unterseiten markieren den Menüpunkt serverseitig (activeNav)
    if (!document.querySelector('.hero')) return;

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

// Kurze Hinweise (z. B. „Projekt gespeichert“) nach ein paar Sekunden ausblenden;
// ?gespeichert verschwindet aus der Adresse, damit der Hinweis beim Neuladen nicht wiederkommt
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('[data-toast]').forEach(toast => {
        setTimeout(() => toast.classList.add('is-leaving'), 3200);
        setTimeout(() => toast.remove(), 3600);
    });
    if (new URLSearchParams(location.search).has('gespeichert')) {
        history.replaceState(null, '', location.pathname + location.hash);
    }
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

// KARUSSELL (Projektseite): Pfeile, Punkte und Pfeiltasten; Wischen und Trackpad laufen über natives Scrollen
document.addEventListener("DOMContentLoaded", function() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('[data-carousel]').forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        const slides = [...track.children];
        const prev = carousel.querySelector('[data-carousel-prev]');
        const next = carousel.querySelector('[data-carousel-next]');
        const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
        const current = carousel.querySelector('[data-carousel-current]');
        if (slides.length < 2) return;

        const currentIndex = () => Math.round(track.scrollLeft / track.clientWidth);

        const goTo = (index) => {
            const target = Math.max(0, Math.min(slides.length - 1, index));
            track.scrollTo({ left: target * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
        };

        // Zähler, Punkte und Pfeile an die sichtbare Folie anpassen
        const update = () => {
            const index = currentIndex();
            current.textContent = String(index + 1).padStart(2, '0');
            dots.forEach((dot, i) => dot.setAttribute('aria-current', i === index ? 'true' : 'false'));
            prev.disabled = index === 0;
            next.disabled = index === slides.length - 1;
        };

        prev.addEventListener('click', () => goTo(currentIndex() - 1));
        next.addEventListener('click', () => goTo(currentIndex() + 1));
        dots.forEach(dot => dot.addEventListener('click', () => goTo(parseInt(dot.dataset.carouselDot))));

        track.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                goTo(currentIndex() + (e.key === 'ArrowRight' ? 1 : -1));
            } else if (e.key === 'Enter') {
                // Enter zeigt die sichtbare Folie in der Bildansicht
                const zoom = slides[currentIndex()].querySelector('[data-zoom]');
                if (zoom) zoom.click();
            }
        });

        let frame = null;
        track.addEventListener('scroll', () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                update();
                frame = null;
            });
        }, { passive: true });
        window.addEventListener('resize', update);
        update();
    });
});

// BILDANSICHT (Projektseite): Klick auf ein Bild zeigt das ganze Foto; Pfeile, ←/→ und Wischen blättern durch alle Bilder
document.addEventListener("DOMContentLoaded", function() {
    const lightbox = document.querySelector('[data-lightbox]');
    if (!lightbox || typeof lightbox.showModal !== 'function') return;

    const links = [...document.querySelectorAll('[data-zoom]')];
    // Jedes Foto nur einmal (ohne zweites Bild steht das Titelbild zweimal auf der Seite)
    const sources = [...new Set(links.map(link => link.getAttribute('href')))];
    const image = lightbox.querySelector('[data-lightbox-image]');
    const count = lightbox.querySelector('[data-lightbox-count]');
    const caption = lightbox.querySelector('[data-lightbox-caption]');
    const prev = lightbox.querySelector('[data-lightbox-prev]');
    const next = lightbox.querySelector('[data-lightbox-next]');
    const total = String(sources.length).padStart(2, '0');
    let index = 0;

    const linkAt = (i) => links.find(link => link.getAttribute('href') === sources[i]);

    const show = (i) => {
        index = Math.max(0, Math.min(sources.length - 1, i));
        const link = linkAt(index);
        image.src = sources[index];
        image.alt = link.querySelector('img').alt;
        caption.textContent = link.dataset.caption || '';
        count.textContent = String(index + 1).padStart(2, '0') + ' / ' + total;
        count.hidden = sources.length < 2;
        prev.disabled = index === 0;
        next.disabled = index === sources.length - 1;
        // Nachbarbilder vorladen, damit das Blättern ohne Wartezeit geht
        [index - 1, index + 1].forEach(n => { if (sources[n]) new Image().src = sources[n]; });
    };

    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-zoom]');
        // Strg-/Cmd-/Shift-Klick öffnet das Bild wie gewohnt in einem neuen Tab bzw. Fenster
        if (!link || e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        show(sources.indexOf(link.getAttribute('href')));
        lightbox.showModal();
    });

    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    lightbox.querySelector('[data-lightbox-close]').addEventListener('click', () => lightbox.close());

    // Klick neben das Bild schließt (Esc schließt von selbst)
    lightbox.addEventListener('click', (e) => {
        if (!e.target.closest('img, button')) lightbox.close();
    });

    lightbox.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            show(index + (e.key === 'ArrowRight' ? 1 : -1));
        }
    });

    // Wischen auf dem Handy – nicht, solange die Seite mit zwei Fingern vergrößert ist
    let touchStart = null;
    lightbox.addEventListener('touchstart', (e) => {
        touchStart = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
        const zoomed = window.visualViewport && window.visualViewport.scale > 1.01;
        if (!touchStart || zoomed) return;
        const dx = e.changedTouches[0].clientX - touchStart.x;
        const dy = e.changedTouches[0].clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });

    // Beim Schließen steht ein Karussell auf dem zuletzt gezeigten Bild
    lightbox.addEventListener('close', () => {
        const slide = linkAt(index).closest('.carousel-slide');
        if (slide) {
            const track = slide.parentElement;
            track.scrollTo({ left: [...track.children].indexOf(slide) * track.clientWidth });
        }
    });
});

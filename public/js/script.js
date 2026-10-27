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

// Kann ein Element unter dem Mauszeiger bzw. mit dem Fokus (z. B. das Code-Fenster) selbst noch weiterscrollen?
function canScrollInside(target, direction) {
    for (let el = target; el && el !== document.body; el = el.parentElement) {
        if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight) continue;
        if (direction > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    return false;
}

// Startseite (Desktop): Mausrad/Touchpad springt immer genau einen Bereich weiter
document.addEventListener("DOMContentLoaded", function() {
    const sections = [...document.querySelectorAll('.hero, .screen')];
    if (sections.length < 2) return;

    // Gleiche Bedingung wie das Einrasten in style.css
    const snapQuery = window.matchMedia('(min-width: 861px) and (min-height: 600px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let locked = false;
    let lastWheel = 0;

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
    // Nur die Menüpunkte selbst (nicht die Kategorien im Dropdown); „Portfolio“ führt zu /portfolio und
    // nennt seinen Bereich der Startseite in data-section
    const navLinks = document.querySelectorAll('.nav-links > a, .nav-item > a');
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
            const target = link.dataset.section ? '#' + link.dataset.section : link.hash;
            link.classList.toggle('nav-active', target === '#' + current.id);
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

// STARTSEITE: die Kategorie-Bänder fliegen beim Hineinscrollen herein – abwechselnd von links und rechts,
// die zugleich sichtbaren kurz nacheinander (Aussehen in style.css unter .fly-in)
document.addEventListener("DOMContentLoaded", function() {
    const bands = [...document.querySelectorAll('.home-cats > li')];
    if (bands.length === 0 || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver((entries) => {
        entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
            entry.target.style.setProperty('--delay', index * 0.14 + 's');
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.3 });

    // Ausgangslage ohne Übergang setzen – sonst blenden die Bänder erst aus, bevor sie hereinfliegen
    const list = bands[0].parentElement;
    list.classList.add('fly-in-setup');
    bands.forEach((band, index) => {
        band.classList.add('fly-in');
        if (index % 2 === 1) band.classList.add('fly-in--right');
    });
    void list.offsetWidth;
    list.classList.remove('fly-in-setup');
    bands.forEach(band => observer.observe(band));

    // Nach der Landung ohne die Klassen, damit Hover und Übergänge wieder wie gewohnt laufen
    document.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'transform' && e.target.matches('.fly-in.is-visible')) {
            e.target.classList.remove('fly-in', 'fly-in--right', 'is-visible');
            e.target.style.removeProperty('--delay');
        }
    });
});

// NAVIGATION: unter „Portfolio“ klappt die Liste der Kategorien auf (style.css); die Bilder laden erst beim ersten
// Aufklappen, Esc schließt die Liste wieder
document.addEventListener("DOMContentLoaded", function() {
    const item = document.querySelector('.nav-item');
    if (!item) return;

    const loadImages = () => item.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
    });
    item.addEventListener('pointerenter', loadImages, { once: true });
    item.addEventListener('focusin', loadImages, { once: true });

    // Zu bleibt sie, bis Maus oder Fokus den Menüpunkt verlassen
    item.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        item.classList.add('is-dismissed');
        item.querySelector('a').focus();
    });
    item.addEventListener('pointerleave', () => item.classList.remove('is-dismissed'));
    item.addEventListener('focusout', (e) => {
        if (!item.contains(e.relatedTarget)) item.classList.remove('is-dismissed');
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

// PROJEKTSEITE: Bewegung – das Titelbild bekommt Tiefe (wandert beim Scrollen langsamer und folgt leicht der Maus),
// Bilder in den Abschnitten öffnen sich aus einer Maske, Überschriften und Texte gleiten herein
document.addEventListener("DOMContentLoaded", function() {
    const top = document.querySelector('.project-top');
    if (!top || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Scrollweite im Kopf als --shift: style.css bewegt Titelbild und Farbverlauf damit unterschiedlich schnell
    let frame = null;
    const update = () => {
        frame = null;
        top.style.setProperty('--shift', Math.min(window.scrollY, top.offsetHeight) + 'px');
    };
    window.addEventListener('scroll', () => {
        if (!frame) frame = requestAnimationFrame(update);
    }, { passive: true });
    update();

    // Das Titelbild verschiebt sich ein wenig entgegen der Maus – wie ein Blick durch ein Fenster
    top.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const rect = top.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        top.style.setProperty('--hero-x', (-x * 24) + 'px');
        top.style.setProperty('--hero-y', (-y * 16) + 'px');
    });
    top.addEventListener('pointerleave', () => {
        top.style.removeProperty('--hero-x');
        top.style.removeProperty('--hero-y');
    });

    // Abschnitte und „Nächstes Projekt“: Bilder und Fenster öffnen sich aus einer Maske, Überschriften gleiten
    // von links, Texte von unten herein – die Bausteine einer Spalte nacheinander
    if (!('IntersectionObserver' in window)) return;
    const effects = [
        ['.psection-col > :is(.block-image, .carousel, .block-code, .block-compare, .block-demo, .block-youtube), .next-project', 'reveal-mask'],
        ['.psection-col > .block-title, .credits .block-title', 'reveal-slide'],
        ['.psection-col > .block-text, .credits .block-text', 'reveal']
    ];
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    effects.forEach(([selector, effect]) => {
        document.querySelectorAll(selector).forEach(element => {
            element.classList.add(effect);
            element.style.transitionDelay = Math.min([...element.parentElement.children].indexOf(element), 4) * 90 + 'ms';
            observer.observe(element);
        });
    });
    // Nach dem Öffnen ohne Maske, damit die Schatten wieder zu sehen sind
    document.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'clip-path' && e.target.classList.contains('reveal-mask')) {
            e.target.classList.add('is-done');
            e.target.style.transitionDelay = '';
        }
    });
});

// PROJEKTSEITE: aus dem Eyecatcher geht es mit einem Schritt direkt zum Projekt (#weiter, wie beim Pfeil) und von dort
// ebenso zurück nach oben – mit Mausrad, Touchpad und Tasten sofort; bleibt die Seite nach dem Wischen oder Ziehen
// mitten im Eyecatcher stehen, gleitet sie weiter
document.addEventListener("DOMContentLoaded", function() {
    const hero = document.querySelector('.project-top .project-hero');
    const next = document.getElementById('weiter');
    if (!hero || !next) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let locked = false;
    let lastWheel = 0;
    let lastY = window.scrollY;
    let direction = 0;
    let touches = 0;

    // Anfang des Projekts – höchstens so weit, wie die Seite scrollen kann
    const end = () => Math.min(
        Math.round(next.getBoundingClientRect().top + window.scrollY),
        document.documentElement.scrollHeight - document.documentElement.clientHeight
    );

    // Nur wenn der Eyecatcher ganz auf den Bildschirm passt, keine Bildansicht und kein Vollbild offen ist
    // und die Seite nicht mit zwei Fingern vergrößert ist
    const active = () => hero.offsetHeight <= window.innerHeight + 2
        && !document.querySelector('dialog[open]')
        && !document.fullscreenElement
        && !(window.visualViewport && window.visualViewport.scale > 1.01);

    // Wohin führt ein Schritt um delta Pixel? Nach unten aus dem Eyecatcher zum Projekt; nach oben ganz nach oben,
    // sobald der Eyecatcher wieder ins Bild käme. null = normal scrollen
    const targetFor = (delta) => {
        const y = window.scrollY;
        const stop = end();
        if (delta > 0 && y < stop - 1) return stop;
        if (delta < 0 && y > 1 && y + delta < stop - 1) return 0;
        return null;
    };

    // Erst wieder freigeben, wenn das Rad kurz Ruhe gibt (Touchpads scrollen nach)
    const unlock = () => {
        if (Date.now() - lastWheel < 180) return setTimeout(unlock, 120);
        locked = false;
        settle();
    };
    const jump = (top) => {
        locked = true;
        window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
        setTimeout(unlock, 700);
    };

    // Steht die Seite mitten im Eyecatcher, gleitet sie in die zuletzt gescrollte Richtung weiter;
    // nach einer kleinen Bewegung springt sie zurück
    const settle = () => {
        if (locked || touches || !active()) return;
        const y = window.scrollY;
        const stop = end();
        if (y <= 1 || y >= stop - 1) return;
        jump(y < 60 ? 0 : y > stop - 60 ? stop : direction > 0 ? stop : 0);
    };

    window.addEventListener('wheel', (e) => {
        if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX) || !active()) return;
        if (canScrollInside(e.target, Math.sign(e.deltaY))) return;
        if (!locked) {
            // Firefox zählt teils in Zeilen oder Seiten
            const top = targetFor(e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1));
            if (top === null) return;
            jump(top);
        }
        e.preventDefault();
        lastWheel = Date.now();
    }, { passive: false });

    // Tasten wie gewohnt: ↓, Bild↓ und Leertaste nach unten; ↑, Bild↑ und Umschalt+Leertaste nach oben
    window.addEventListener('keydown', (e) => {
        const page = window.innerHeight * 0.875;
        const delta = { ArrowDown: 40, ArrowUp: -40, PageDown: page, PageUp: -page, ' ': e.shiftKey ? -page : page }[e.key];
        if (!delta || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !active()) return;
        // Nicht in Feldern, Reglern und Knöpfen und nicht, solange ein Fenster mit dem Fokus selbst noch scrollen kann
        if (e.target.isContentEditable || e.target.closest('input, textarea, select, button, summary, video, audio')) return;
        if (canScrollInside(e.target, Math.sign(delta))) return;
        if (!locked) {
            const top = targetFor(delta);
            if (top === null) return;
            jump(top);
        }
        e.preventDefault();
    });

    // Wischen, Scrollleiste & Co.: erst prüfen, wenn der Finger los ist und die Seite ausgerollt ist
    window.addEventListener('scroll', () => {
        if (window.scrollY !== lastY) direction = Math.sign(window.scrollY - lastY);
        lastY = window.scrollY;
    }, { passive: true });
    window.addEventListener('touchstart', (e) => { touches = e.touches.length; }, { passive: true });
    ['touchend', 'touchcancel'].forEach(type => window.addEventListener(type, (e) => { touches = e.touches.length; }, { passive: true }));
    if ('onscrollend' in window) {
        window.addEventListener('scrollend', settle);
    } else {
        // Ohne scrollend: kurz nachdem sich nichts mehr bewegt
        let timer = null;
        const settleSoon = () => {
            clearTimeout(timer);
            timer = setTimeout(settle, 150);
        };
        window.addEventListener('scroll', settleSoon, { passive: true });
        window.addEventListener('touchend', settleSoon, { passive: true });
    }
});

// VORHER/NACHHER (Projektseite): der Regler bestimmt, wie viel vom Vorher-Bild zu sehen ist (--split)
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('[data-compare]').forEach(compare => {
        const range = compare.querySelector('.compare-range');
        const update = () => compare.style.setProperty('--split', range.value + '%');
        range.addEventListener('input', update);
        update();
    });
});

// LIVE-DEMO (Projektseite): Website oder Spiel erst beim Klick laden (schneller und datensparsamer), danach auch im Vollbild
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('[data-demo]').forEach(demo => {
        const start = demo.querySelector('[data-demo-start]');
        const stage = demo.querySelector('.demo-stage');
        const fullscreen = demo.querySelector('[data-demo-fullscreen]');
        start.addEventListener('click', () => {
            const iframe = document.createElement('iframe');
            iframe.src = start.dataset.src;
            iframe.title = 'Live-Demo: ' + demo.querySelector('.demo-address').textContent;
            iframe.allow = 'fullscreen; autoplay';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-modals');
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            start.replaceWith(iframe);
            iframe.focus();
            fullscreen.hidden = !stage.requestFullscreen;
        });
        fullscreen.addEventListener('click', () => stage.requestFullscreen());
    });
});

// YOUTUBE (Projektseite): zuerst nur das Vorschaubild, der Player (youtube-nocookie.com) lädt erst beim Klick
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('[data-youtube]').forEach(box => {
        const trigger = box.querySelector('.youtube-trigger');
        const img = trigger.querySelector('img');

        // Ohne Vorschaubild in hoher Auflösung liefert YouTube ein winziges Ersatzbild – dann die mittlere Auflösung
        const fallback = () => {
            if (img.naturalWidth <= 120 && !img.src.endsWith('/hqdefault.jpg')) img.src = img.src.replace(/[^/]+$/, 'hqdefault.jpg');
        };
        img.addEventListener('load', fallback);
        img.addEventListener('error', fallback);
        if (img.complete) fallback();

        trigger.addEventListener('click', (e) => {
            // Strg-/Cmd-/Shift-Klick öffnet das Video wie gewohnt auf YouTube
            if (e.ctrlKey || e.metaKey || e.shiftKey) return;
            e.preventDefault();
            const start = parseInt(box.dataset.start) || 0;
            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube-nocookie.com/embed/' + box.dataset.youtube + '?autoplay=1&rel=0' + (start ? '&start=' + start : '');
            iframe.title = box.dataset.title;
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.allowFullscreen = true;
            trigger.replaceWith(iframe);
            iframe.focus();
        });
    });
});

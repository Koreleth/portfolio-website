function animateText(textElement) {
    const printText = textElement.dataset.text;

    // Nachlaufende Leerzeichen/Umbrüche aus dem Template entfernen
    const contentArray = printText.split('/n').map(line => line.replace(/\s+$/, ''));

    contentArray.forEach((line, lineIndex) => {
      const lineContainer = document.createElement('span');
      lineContainer.className = 'code-line';
      lineContainer.id = 'line-' + lineIndex;
      textElement.appendChild(lineContainer);

      const characters = [...line];

      setTimeout(() => {
        textElement.querySelectorAll('.typing').forEach(el => el.classList.remove('typing'));
        lineContainer.classList.add('typing');

        characters.forEach((char, charIndex) => {
          setTimeout(() => {
            lineContainer.appendChild(document.createTextNode(char));
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


  //TIMELINE
  document.addEventListener("DOMContentLoaded", function() {
    const cards = document.querySelectorAll('.time-card');
    if (cards.length === 0) return;

    function checkCards() {
        let closestCard = null;
        let closestDistance = Infinity;
        const screenMiddle = window.innerHeight / 2;

        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardMiddle = rect.top + rect.height / 2;
            const distance = Math.abs(screenMiddle - cardMiddle);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestCard = card;
            }
        });

        // Zuerst alle Karten deaktivieren
        cards.forEach(card => card.classList.remove('active'));

        // Nur die am nächsten zur Mitte aktivieren
        if (closestCard) {
            closestCard.classList.add('active');
        }
    }

    window.addEventListener('scroll', checkCards, { passive: true });
    window.addEventListener('load', checkCards);
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
    const items = document.querySelectorAll('section > h2, .card-link, .flexbox, .timeline-container, .upperpart > *, .middlepart > *');
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

    // Navigation wird dunkel, solange sie über dem Hero liegt
    const nav = document.querySelector('nav');
    if (nav) {
        const updateNav = () => {
            const navRect = nav.getBoundingClientRect();
            nav.classList.toggle('nav-on-dark', hero.getBoundingClientRect().bottom > navRect.top + navRect.height / 2);
        };
        window.addEventListener('scroll', updateNav, { passive: true });
        window.addEventListener('resize', updateNav);
        updateNav();
    }

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

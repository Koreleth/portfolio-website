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

document.querySelectorAll('.dynamic-link').forEach(link => {
    const id = link.getAttribute('data-id');
    const currentUrl = window.location.origin + window.location.pathname;
    link.href = currentUrl + id;
  });

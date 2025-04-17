function animateText() {
    const textElement = document.querySelector('.text');
    const printText = textElement.dataset.text;

    const contentArray = printText.split('/n');

    contentArray.forEach((line, lineIndex) => {
      const lineContainer = document.createElement('span');
      lineContainer.style.display = 'block';
      lineContainer.id = 'line-' + lineIndex;
      textElement.appendChild(lineContainer);

      const characters = [...line];

      setTimeout(() => {
        characters.forEach((char, charIndex) => {
          setTimeout(() => {
            const charSpan = document.createElement('span');
            charSpan.textContent = char;
            lineContainer.appendChild(charSpan);
          }, charIndex * 5);
        });
      }, lineIndex * 200);
    });
  }

  // Scroll-Trigger mit IntersectionObserver
  document.addEventListener('DOMContentLoaded', function () {
    const target = document.querySelector('.text');

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateText();
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

    window.addEventListener('scroll', checkCards);
    window.addEventListener('load', checkCards);
});

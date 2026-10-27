# Portfolio

Dieses Repository enthält meine persönliche Portfolio-Webseite, in der ich Projekte, Fähigkeiten und Kontaktinformationen präsentiere. (Noch in Bearbeitung)

<img width="2843" height="1491" alt="portoflio-website" src="https://github.com/user-attachments/assets/8fca225f-36c5-482c-a46b-a22048932d2c" />


---

## 📂 Projektstruktur

```text
portfolio-website/
├── app.js             # Express-App: Seiten, JSON-API unter /api, Admin, Fehlerseiten
├── bin/www            # Startet den Server (Port 3000, über PORT änderbar)
├── controllers/       # Logik: Kategorien, Projekte, Tools, Lebenslauf
├── models/            # Daten als JSON (Projekte, Kategorien, Tools, Über mich, Lebenslauf) + store.js
├── routes/            # Seiten- und API-Routen; routes/admin: Login, Projekte, Kategorien, Tools
├── middleware/        # Schutz des Admin-Bereichs (Login-Pflicht, nur eigene Formulare)
├── utils/             # Hilfen: URL-Namen, Bild-Uploads, Aufzählungen im Text, farbige Codesamples
├── views/             # EJS-Templates (views/admin: Login, Übersicht, Formulare)
├── public/            # CSS, JavaScript, Bilder (Uploads: public/img/uploads)
├── .env.example       # Vorlage für die Admin-Zugangsdaten (.env)
└── README.md
```

---

## 🛠️ Technologien & Tools

- HTML5 & CSS3  
- JavaScript
- Node.js + Express
- EJS (Templates)

---

## 🚀 Installation & Nutzung

1. Repository klonen:

   ```bash
   git clone https://github.com/Koreleth/portfolio-website.git
   cd portfolio-website
   ```
2. Node Module installieren:
    ```bash
   npm install
   ```

3. Server starten:
    ```bash
   npm run dev
   ```

4. Gebe anschließend `localhost:3000` im Browser ein.

---

## 🔐 Admin-Bereich

Unter `localhost:3000/admin` verwaltest du nach dem Login die Inhalte der Seite:

- **Projekte:** Titelbild, zweites Bild, Text, verwendete Tools und beliebig viele weitere **Abschnitte**. Den ersten Bildschirm füllt der Eyecatcher: das Titelbild über die ganze Breite, unten abgerundet; Seitenpfad, Titel, Kurzbeschreibung und Tools stehen dezent unten links darauf (auf dem Handy mittig). Ein Scrollschritt (Mausrad, Touchpad, Pfeil- und Bildtasten, Wischen) springt direkt zum Projekttext und von dort ebenso zurück nach oben; auch ein Pfeil führt dorthin. Für Logos lässt sich das Titelbild im Bearbeitungsmodus auf **Ganz zeigen** umstellen – dann steht es vollständig rechts (auf dem Handy oben), der Kopf ist hell. Beim Scrollen bekommt das Titelbild Tiefe, Bilder öffnen sich aus einer Maske und Überschriften gleiten herein (nicht bei „Bewegung reduzieren“); am Seitenende führt eine große Karte zum **nächsten Projekt**. Die ganze Projektseite liegt in einem Raster aus Dritteln; jeder Abschnitt wählt sein Spalten-Layout (ganze Breite, ⅔ + ⅓, ⅓ + ⅔, 3 × ⅓) und bekommt pro Spalte Bausteine untereinander – **Titel**, **Text**, **Bild**, **Karussell** (mehrere Bilder zum Durchblättern), **Codesample** (Code im Editor-Fenster mit Zeilennummern und Farben über `highlight.js`, wird nur angezeigt; die Endung des Dateinamens, z. B. `karte.js`, bestimmt die Sprache), **Vorher/Nachher** (zwei Bilder übereinander mit einem Regler zum Vergleichen), **Live-Demo** (Website oder Spiel in einem Browserfenster zum Ausprobieren; lädt erst nach Klick auf „Starten“, auch im Vollbild) oder **YouTube** (Video über seine Adresse, z. B. `https://youtu.be/…` mit Startzeit `?t=90`; zuerst steht nur das Vorschaubild da, der Player lädt erst nach Klick über `youtube-nocookie.com`, Shorts erscheinen hochkant). Vor dem ersten Abschnitt steht ein Trennstrich, vor weiteren nur, wenn er im Bearbeitungsmodus per Knopf gesetzt wird. In Texten wird eine Zeile mit `- `, `• ` oder `o ` am Anfang zum Aufzählungspunkt (weiter eingerückt = Unterpunkt), `1. ` zur nummerierten Liste; Adressen mit `https://` werden zu Links. Alle Bilder erscheinen im festen Format 4:3 (über die ganze Breite 16:9); ein Klick öffnet das ganze Foto in einer Bildansicht. Bearbeitet wird **direkt im Layout der Projektseite**: Titel, Kurzbeschreibung, die Überschrift neben dem zweiten Bild (leer = Titel des Projekts), Texte und Bildunterschriften sind Textfelder an ihrer Stelle, Bilder werden auf dem Bild ausgetauscht, Abschnitte und Bausteine im echten Raster angeordnet – gespeichert wird mit dem Knopf ganz unten, danach öffnet sich direkt die fertige Projektseite. Nach dem letzten Abschnitt folgt, durch einen Strich abgesetzt, der Bereich **Mitwirkende**: links unter der Überschrift die Namen (eine Zeile pro Person), rechts daneben ein freier Text, z. B. eine Danksagung (beide leer = nicht angezeigt)
- **Kategorien:** anlegen, bearbeiten, löschen (nur leere Kategorien). Die Startseite zeigt drei Kategorien: zuerst die mit **Auf der Startseite zeigen**, die übrigen Plätze füllen die ersten der Liste (in der Übersicht mit „Startseite“ markiert)
- **Tools:** Name und Icon – aus allen SVGs unter `public/img` wählen oder ein eigenes hochladen
- **Über mich:** Foto mit Bildunterschrift, Inhalt des Code-Fensters und der Lebenslauf (Stationen hinzufügen, sortieren, entfernen)

Vor dem Löschen oder Entfernen fragt ein Dialog im Design der Seite nach. Wer den Bearbeitungsmodus eines Projekts mit ungespeicherten Änderungen über einen Link verlässt, wird ebenfalls gefragt (beim Schließen oder Neuladen des Tabs übernimmt das die Abfrage des Browsers).

Bilder dürfen bis zu **20 MB** groß sein (Icons bis 1 MB). Größere Fotos werden beim Hochladen automatisch auf höchstens 2400 px verkleinert und komprimiert (mit `sharp`). Sie landen in `public/img/uploads` und werden gelöscht, sobald sie nirgends mehr verwendet werden.

Die Daten liegen als JSON in `models/`. Mit der Umgebungsvariable `DATA_DIR` lässt sich ein anderer Ordner verwenden, z. B. ein dauerhafter Speicher beim Hoster.

**Einrichtung:**

1. `.env.example` nach `.env` kopieren (die `.env` wird nicht committet).
2. Einen bcrypt-Hash deines Passworts erzeugen und als `ADMIN_PASSWORD_HASH` eintragen (in einfachen Anführungszeichen):
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('DEIN-PASSWORT', 12))"
   ```
3. `SESSION_SECRET` auf einen langen Zufallswert setzen:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Server neu starten und mit `ADMIN_USER` (Standard: `admin`) und deinem Passwort anmelden.

---

## ✨ Features & Inhalt

In deinem Portfolio findest du typischerweise:

- Eine **Startseite** mit Vorstellung, drei Kategorien als breite Bänder (das Kachelbild abgedunkelt dahinter; sie fliegen beim Scrollen abwechselnd von links und rechts herein), Über mich und Kontakt
- Eine **Navigation**, in der „Portfolio“ zur Übersicht aller Kategorien führt; beim Darüberfahren (oder mit der Tab-Taste) klappt die Liste der Kategorien auf
- Eine **Über mich**-Sektion mit biografischen Informationen  
- Eine **Projektübersicht** mit Screenshots, Links und Beschreibungen   
- Eine **Kontaktsektion** mit Formular oder Social-Media-Links  

---

## 👤 Autor & Kontakt

- **Name:** Korel Öztekin  
- **GitHub:** [Koreleth](https://github.com/Koreleth)  

---

## 📄 Lizenz

Dieses Projekt ist für Präsentationszwecke gedacht und kann unter der **MIT License** oder einer freien Lizenz deiner Wahl stehen.


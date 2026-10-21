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
├── models/            # Daten als JSON (inkl. tools.json) + store.js zum Lesen/Schreiben
├── routes/            # Seiten-, API- und Admin-Routen
├── views/             # EJS-Templates (views/admin: Login, Übersicht, Formular)
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

Unter `localhost:3000/admin` kannst du nach dem Login Projekte anlegen, bearbeiten und löschen – inklusive Bild-Upload und Auswahl der verwendeten Tools.

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

Neue Tools trägst du in `models/tools.json` ein (`id`, `name`, Pfad zum `icon` unter `public/img`).

---

## ✨ Features & Inhalt

In deinem Portfolio findest du typischerweise:

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


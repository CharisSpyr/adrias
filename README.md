# adrias · Πισίνες & Ενεργειακά

Ιστοσελίδα της adrias (ΣΠΥΡΟΠΟΥΛΟΣ Γ. ΜΕΠΕ), Αίγιο. Στατικό site, χωρίς build: ανεβαίνει όπως είναι σε GitHub Pages.

| Σελίδα | Ελληνικά | English |
|---|---|---|
| Αρχική | `index.html` | `en/index.html` |
| Πισίνες | `pools.html` | `en/pools.html` |
| Ενεργειακά & HVAC | `energy.html` | `en/energy.html` |

- `assets/css/style.css`: όλη η εμφάνιση
- `assets/js/water.js`: το διαδραστικό νερό (πισίνες)
- `assets/js/air.js`: η διαδραστική ροή αέρα (ενεργειακά)
- `assets/js/main.js`: μενού, gallery, στάδια κατασκευής, σχέδιο HVAC
- `assets/img/`: λογότυπο και φωτογραφίες (από το παλιό adrias.gr)

## Ανέβασμα σε GitHub Pages
1. Νέο repository (π.χ. `adrias`) → ανεβάστε όλα τα αρχεία.
2. Settings → Pages → Branch: `main`, folder `/ (root)`.
3. Σε 1–2 λεπτά: `https://<username>.github.io/adrias/`.

## Σύνδεση με το adrias.gr
1. Settings → Pages → Custom domain: `www.adrias.gr` (δημιουργείται αρχείο `CNAME`).
2. Στον πάροχο του domain: εγγραφή `CNAME` για `www` → `<username>.github.io`, και εγγραφές `A` για το `adrias.gr` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. Ενεργοποιήστε το “Enforce HTTPS”.

## Αλλαγή φωτογραφιών
Βάλτε νέες φωτογραφίες στο `assets/img/gallery/` και προσθέστε μια γραμμή `<figure>` στην ενότητα `id="gallery"` του `pools.html` (και του `en/pools.html`). Το `data-cat` ορίζει το φίλτρο: `private`, `pro`, `rocks`, `spa`.

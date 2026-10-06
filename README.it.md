# 🎬 AnimeUnity to AniList Sync

[English](README.md) | **Italiano**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.1.0-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Browser-Safari%20%7C%20Chrome-blueviolet.svg)]()

Un Userscript moderno, ultra-leggero e reattivo per sincronizzare automaticamente il progresso degli anime, lo stato di visualizzazione (*Watching*, *Completed*, ecc.) e i voti personali su **[AniList](https://anilist.co)** direttamente dall'interfaccia di AnimeUnity, sia su **Desktop** che su **Mobile**.

> 📌 **Prerequisito**: È necessario possedere un account su **AniList**. Se non ne hai ancora uno, puoi [crearlo gratuitamente qui](https://anilist.co/signup).

---

## ⚡ Installazione Rapida in 2 Passaggi

### Passo 1: Installa l'estensione Userscript per il tuo browser

Scegli il tuo browser per scaricare l'estensione con 1 click dallo store ufficiale:

| Browser | Estensione Consigliata | Link Download Ufficiale |
| :--- | :--- | :--- |
| 🍏 **Safari** (macOS / iOS) | **Userscripts** *(Open Source, Consigliata)* | [👉 Scarica da Mac App Store](https://apps.apple.com/it/app/userscripts/id1463298887) <br> *Alternativa GitHub:* [quoid/userscripts](https://github.com/quoid/userscripts/releases) |
| 🌐 **Google Chrome** / Brave / Edge | **Tampermonkey** *(La più usata)* | [👉 Scarica da Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |

---

### Passo 2: Installa gli Script

Installa uno o entrambi gli script con 1 solo click:

| Script | Scopo | Sito Target | Link Rapido Installazione |
| :--- | :--- | :--- | :--- |
| **`manage-anilist.js`** | Sincronizza progresso e stato da AnimeUnity ad AniList | `animeunity.so` | [👉 **Installa manage-anilist.js**](https://raw.githubusercontent.com/pallax03/my-userscripts/master/manage-anilist.js) |
| **`list-anilist.js`** | Aggiungi e sincronizza anime in 1 click dalla lista di un amico | `anilist.co` | [👉 **Installa list-anilist.js**](https://raw.githubusercontent.com/pallax03/my-userscripts/master/list-anilist.js) |

> **Vantaggio Token Condiviso**: Entrambi gli script condividono la stessa chiave del token AniList. Effettua l'accesso una sola volta ed entrambi funzioneranno all'istante!

---

## 🔑 Configurazione del Token AniList (Zero Sforzo)

1. Apri una qualsiasi serie su AnimeUnity.
2. In alto a destra nella navbar (oppure nel pannello sotto la copertina), clicca su **`🔑 Connetti AniList`**.
3. Clicca sul link **[Apri Autorizzazione AniList OAuth](https://anilist.co/api/v2/oauth/authorize?client_id=43750&response_type=token)**.
4. Premi **Authorize**: verrai reindirizzato a una pagina che mostrerà a schermo il tuo codice token (o lo troverai nell'URL come `access_token=...`).
5. Incolla il token nel popup dello script e premi **"Salva & Connetti"**.

> 💡 **Scorciatoia One-Click**: Puoi configurare il token anche semplicemente visitando una volta l'URL:  
> `https://www.animeunity.so/anime/qualsiasi-cosa?al_token=IL_TUO_TOKEN`  
> Lo script lo salverà in locale e pulirà l'URL all'istante.

---

## ✨ Funzionalità & QoL (Quality of Life)

### 👤 Profilo & Navbar (Desktop & Mobile)
- **Desktop**: Rimpiazza il pulsante generico di login in alto a destra con il tuo **Avatar AniList**, username e menu a tendina.
- **Mobile**: Aggiunge automaticamente il widget compatto direttamente nella barra superiore (accanto alla lente di ricerca), accessibile senza aprire cassetti o menu complessi.
- **Menu a Tendina**: Link diretto alla tua pagina pubblica AniList, gestione token e disconnessione istantanea con pulizia della sessione.

### 🎛️ Gestione Serie Integrata
- **Stato**: Cambia al volo tra *Watching*, *Plan to Watch*, *Completed*, *Paused*, *Dropped*, *Rewatching*.
- **Voto Personale**: Selettore rapido di voto (da 1 a 10 con stelle ★) sincronizzato con AniList.
- **Mini Progress Bar**: Visualizza la percentuale di avanzamento e gli episodi visti (es. `Progresso: 4 / 12 ep - 33%`).
- **Pulsanti Step +/-**: Regola il progresso con 1 click direttamente dall'intestazione della card senza dover aprire selettori.
- **Cestino**: Rimuovi la serie dal tuo profilo AniList con richiesta di conferma.

### 📺 Controllo Episodi & Avanzamento Rapido
- **Pulizia grafica episodi visti**: Rimosso l'azzurro pastello accecante di default di AnimeUnity in favore di un tema scuro coerente (`#17212e`).
- **Glow & Badge per l'ultimo episodio**: L'ultimo episodio visto risalta con **effetto glow luminoso**, leggero ingrandimento e un **badge con la spunta "✓"**.
- **Pulsanti Intelligenti (+1 e -1)**:
  - Sotto la griglia trovi sia `[ ✓ Segna Episodio {X} completato (+1) ]` sia `[ ↶ Torna a Ep. {X-1} (-1) ]` se hai sbagliato a cliccare.
  - **Riconoscimento Parità Episodi**: Il pulsante "+1" scompare automaticamente se sei già in pari con gli episodi usciti su AnimeUnity, mostrando un badge pulito (*"✓ Sei in pari con gli episodi"*).
  - **Auto-Completamento & Date**: Segnando l'ultimo episodio della serie, lo script imposta automaticamente lo stato a **Completed** su AniList e registra la data odierna di fine (`completedAt`). Inoltre salva in automatico la data di inizio (`startedAt`) non appena inizi a guardare la serie!

### 🔍 Risoluzione Intelligente dei Titoli
- **Pulizia Automatica**: Elimina dal titolo stringhe fastidiose come `(ITA)`, `(SUB ITA)`, `ITA`, `Season 2` per matchare AniList al primo colpo.
- **Override Manuale**: Se una serie è uno spin-off o ha un titolo completamente differente, clicca sull'icona **`🔗`** e incolla l'URL o l'ID AniList numerico (salvato in locale per sempre).

### ⌨️ Scorciatoie da Tastiera
| Scorciatoia | Azione |
| :---: | :--- |
| `Shift + S` | Segna il **prossimo episodio (+1)** come visto su AniList |
| `Shift + Z` | Torna indietro di **1 episodio (-1)** su AniList |

---

## 👥 Funzionalità: `list-anilist.js` (AniList Friend List Quick Add)

Quando visiti il profilo di un amico (`https://anilist.co/user/<username>/animelist`):
- **Memoria dell'Ultima Azione**: Il pulsante ricorda l'ultimo stato che hai selezionato (*Pianifica*, *In corso*, *Completato*, ecc.). Un semplice click sul pulsante principale aggiunge istantaneamente l'anime usando quella preferenza con **1 singolo click**.
- **Dropdown Interattivo degli Stati (`▾`)**: Clicca la freccetta per scegliere qualsiasi altro stato o rimuovere la serie. Selezionando un nuovo stato, questo diventa automaticamente la tua nuova azione predefinita per i click successivi.
- **Auto-Completamento su Completato**: Selezionando *Completato*, lo script imposta automaticamente tutti gli episodi come visti, compilando sia la data d'inizio che di fine.
- **Badge di Stato in Tempo Reale**: Gli anime già presenti nella tua collezione vengono contrassegnati da badge verdi discreti (es. `✓ In corso` o `✓ Completato`), prevenendo duplicati accidentali.
- **Filtro "Nascondi già in lista"**: Barra fluttuante in basso con checkbox per nascondere tutti i titoli che hai già aggiunto, permettendoti di esplorare rapidamente solo le nuove serie consigliate dal tuo amico!


---

## 🔒 Privacy & Sicurezza

- **Zero credenziali esposte**: Il token personale non è presente nel codice sorgente e viene salvato esclusivamente nel `localStorage` del browser dell'utente.
- **Storage Condiviso Cross-Script**: Usa convenzioni standard (`GM_getValue` e `localStorage`), permettendo a futuri script per altri siti di condividere lo stesso login senza duplicare l'accesso.
- **Nessuna violazione di copyright**: Lo script non scarica, ospita o distribuisce video protetti da copyright. Si limita a interagire con il Document Object Model (DOM) locale e con le API pubbliche e lecite di AniList.

---

## 📄 Licenza

Distribuito con licenza MIT. Libero per uso personale e contributi della community.

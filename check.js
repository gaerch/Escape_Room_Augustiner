
const STORAGE_KEY = "augustiner_escape_expert_v3";
const ASSETS = {
  start: { hero: "assets/00_intro_hero.svg" },
  stations: {
    1: { hero: "assets/01_klosterarchiv.svg" },
    2: { hero: "assets/02_muenchner_spurensuche.svg" },
    3: {
      hero: "assets/03_siegel_des_brauers.svg",
      options: {
        wrong1: "assets/03b_emblem_wa_hopfen.svg",
        correct: "assets/03a_emblem_jw_abtsstab.svg",
        wrong2: "assets/03c_emblem_aj_bierkrug.svg",
        wrong3: "assets/03d_emblem_mw_loewe.svg"
      }
    },
    4: {
      hero: "assets/04_lagerkeller_szene.svg",
      icons: {
        glocke: "assets/04a_objekt_glocke.svg",
        schlegel: "assets/04b_objekt_schlegel.svg",
        zapfhahn: "assets/04c_objekt_zapfhahn.svg",
        mark200: "assets/04d_objekt_fassmarkierung_200.svg",
        holzkeil: "assets/04e_objekt_holzkeil.svg"
      }
    },
    5: { hero: "assets/05_holzfass_logik.svg" },
    6: { hero: "assets/06_ritual_des_anstichs.svg" }
  },
  finale: { hero: "assets/07_finale_hirschfass.svg" }
};
const LETTERS = ["H","I","R","S","C","H"];
const STATIONS = [
  { id:1, title:"Station 1 – Das Klosterarchiv", letter:"H", hints:["Sie müssen zwei Dinge gleichzeitig zuordnen: Datum und Schublade. Beginnen Sie mit den beiden 19.-Jahrhundert-Dokumenten und arbeiten Sie sich dann nach links und rechts vor.","Die Schubladenfolge ist streng: In I liegt das älteste Dokument, in II das um 34 Jahre jüngere. Der Kellerkaufvertrag ist das ältere der beiden 19.-Jahrhundert-Stücke, die Warenzeichenrolle das jüngste Stück ganz rechts."] },
  { id:2, title:"Station 2 – Münchner Spurensuche", letter:"I", hints:["Zwei Orte sind reine Ablenker: die offene Außenfläche und die Betriebszone. Konzentrieren Sie sich auf Ursprung, Keller, exklusive Räume und großen Saal.","Der historische Ursprung kommt zuerst. Der 1862 erworbene Ort liegt direkt vor den Wagner Salons; der Festsaal ist das Ziel."] },
  { id:3, title:"Station 3 – Das Siegel des Brauers", letter:"R", hints:["Ein korrektes historisches Zeichen besteht nicht nur aus den Initialen, sondern auch aus dem richtigen Symbol und dem passenden Randtext.","Gesucht ist kein Tier- oder Hopfenmotiv. Das linke Initial liegt alphabetisch 13 Stellen vor dem rechten; der Rahmen verweist auf ein eingetragenes Zeichen, nicht auf ein Fest oder einen Ort."] },
  { id:4, title:"Station 4 – Der alte Lagerkeller", letter:"S", hints:["Das Finden der Objekte ist nur Teil eins. Notieren Sie danach die Messingzahlen und ordnen Sie die Gegenstände nach ihrer Funktion im Ablauf.","Zuerst kommt die bloße Mengenangabe. Der Holzkeil steht direkt vor dem Schlegel, der Zapfhahn direkt danach, und die Glocke beendet die Folge."] },
  { id:5, title:"Station 5 – Die Holzfass-Logik", letter:"C", hints:["Nicht alle Begriffe sind Fässer. Einer bezeichnet das Gestell, drei echte Fassgrößen; zwei Literangaben sind bewusst falsche Fährten.","Der Hase ist das kleinste Fass. Der Hirsch fasst doppelt so viel wie die Sau. Der Ganter ist kein Fass und bekommt deshalb keine Literzahl."] },
  { id:6, title:"Station 6 – Das Ritual des Anstichs", letter:"H", hints:["Sie brauchen fünf reale Handlungsschritte; zwei Karten sind reine Dekoration und gehören nicht in die Reihenfolge.","Erst steht das Fass, dann sitzt der Hahn, dann kommt der Schlag. Das Signal folgt nach der Technik, der Ausschank ganz am Ende."] }
];

let timerRef = null;
const initialState = () => ({
  gameStarted:false,
  currentStation:1,
  unlockedStations:[1],
  solvedStations:[],
  collectedLetters:[],
  hintUsage:{1:[],2:[],3:[],4:[],5:[],6:[]},
  elapsedSeconds:0,
  finalSolved:false,
  stationData:{
    s1:{
      chronik:{date:"",drawer:""},
      brauhaus:{date:"",drawer:""},
      keller:{date:"",drawer:""},
      marke:{date:"",drawer:""}
    },
    s2:{slots:["","","",""] , code:""},
    s3:{left:"",right:"",symbol:"",border:""},
    s4:{found:[], code:""},
    s5:{Hase:"",Sau:"",Hirsch:"",Ganter:"", code:""},
    s6:{slots:["","","","",""]},
    finalInput:""
  }
});
let state = loadState();

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? deepMerge(initialState(), JSON.parse(raw)) : initialState();
  }catch{ return initialState(); }
}
function deepMerge(base, incoming){
  if(Array.isArray(base)) return Array.isArray(incoming) ? incoming : base;
  if(typeof base === "object" && base && typeof incoming === "object" && incoming){
    const out = {...base};
    Object.keys(incoming).forEach(k=>{
      out[k] = k in base ? deepMerge(base[k], incoming[k]) : incoming[k];
    });
    return out;
  }
  return incoming ?? base;
}
function resetGame(){
  state = initialState();
  saveState();
  clearInterval(timerRef);
  render();
}
function formatTime(sec){
  const m = String(Math.floor(sec/60)).padStart(2,"0");
  const s = String(sec%60).padStart(2,"0");
  return `${m}:${s}`;
}
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), 1700);
}
function isSolved(id){ return state.solvedStations.includes(id); }
function unlockNext(id){
  const next = id + 1;
  if(next<=6 && !state.unlockedStations.includes(next)) state.unlockedStations.push(next);
}
function solveStation(id, feedback){
  if(isSolved(id)) return;
  state.solvedStations.push(id);
  state.collectedLetters.push(STATIONS[id-1].letter);
  unlockNext(id);
  state.currentStation = id===6 ? 7 : Math.min(id+1, 6);
  saveState();
  toast(`Messingbuchstabe ${STATIONS[id-1].letter} gesichert.`);
  setStationFeedback(true, feedback);
  render();
}
function setStationFeedback(good, text){
  const b = document.getElementById("feedback");
  if(!b) return;
  b.className = `feedback ${good?"good":"bad"}`;
  b.style.display = "block";
  b.textContent = text;
}
function startTimer(){
  clearInterval(timerRef);
  timerRef = setInterval(()=>{
    if(state.gameStarted && !state.finalSolved){
      state.elapsedSeconds++;
      saveState();
      const t = document.getElementById("timer");
      if(t) t.textContent = formatTime(state.elapsedSeconds);
    }
  },1000);
}

const app = document.getElementById("app");
function render(){
  if(!state.gameStarted){ renderStart(); return; }
  renderGame();
}
function renderStart(){
  app.innerHTML = `
    <section class="panel hero" aria-labelledby="game-title">
      <div class="hero-top"><span>München · Braukunst · Rätselreise</span></div>
      <div class="hero-media">
        <img src="${ASSETS.start.hero}" alt="Geheimakte zum verschwundenen Hirschfass mit Fass, Karte und Archivmotiven" loading="eager" />
      </div>
      <h1 id="game-title">Das verschwundene Hirschfass</h1>
      <p><strong>Eine digitale Rätselreise durch München, Braukunst und Holzfass-Tradition.</strong></p>
      <p>Kurz vor dem feierlichen Anstich ist das symbolische Hirschfass verschwunden. Folgen Sie den Spuren aus Archiv, Stadt, Siegel und Lagerkeller – und rekonstruieren Sie das Ritual, bevor der Abend ohne Fass endet.</p>
      <div class="hero-actions">
        <button class="btn-primary" id="startBtn">Spiel starten</button>
        <button class="btn-link" id="guideBtn">Anleitung</button>
      </div>
    </section>
  `;
  document.getElementById("startBtn").onclick = ()=>{
    state.gameStarted = true;
    saveState();
    startTimer();
    render();
  };
  document.getElementById("guideBtn").onclick = ()=> document.getElementById("guideDialog").showModal();
}
function renderGame(){
  const solvedCount = state.solvedStations.length;
  const currentProgress = Math.round((solvedCount/6)*100);
  app.innerHTML = `
    <header class="panel header">
      <div class="brandline">
        <div class="coin">JW</div>
        <div class="brandtext">
          <strong>Das verschwundene Hirschfass</strong>
          <small>Expert Edition</small>
        </div>
      </div>
      <div class="metric">
        <span class="label">Timer</span>
        <span class="value" id="timer">${formatTime(state.elapsedSeconds)}</span>
      </div>
      <div class="metric">
        <span class="label">Fortschritt</span>
        <span class="value">${solvedCount}/6 Stationen</span>
      </div>
      <div class="row" style="justify-content:flex-end">
        <button id="guideHead">Anleitung</button>
        <button id="reset" class="btn-danger">Spiel zurücksetzen</button>
      </div>
    </header>
    <div class="layout">
      <aside class="panel nav">
        <div class="progressbox">
          <strong>Ihr Fortschritt</strong>
          <div class="subtext">Jede Station bringt einen Messingbuchstaben.</div>
          <div class="progressbar"><div class="progressfill" style="width:${currentProgress}%"></div></div>
        </div>
        ${STATIONS.map(s=>{
          const unlocked = state.unlockedStations.includes(s.id);
          return `<button class="station-tab ${state.currentStation===s.id?"active":""} ${!unlocked?"locked":""}" ${!unlocked?"disabled":""} data-st="${s.id}">
            <span>${s.title}</span>
            <span class="mini">${isSolved(s.id)?"Gelöst":"Offen"}</span>
          </button>`;
        }).join("")}
        <button class="station-tab ${state.currentStation===7?"active":""} ${state.solvedStations.length<6?"locked":""}" ${state.solvedStations.length<6?"disabled":""} data-st="7">
          <span>Finale – Das verschwundene Hirschfass</span>
          <span class="mini">${state.finalSolved?"Abgeschlossen":"Bereit"}</span>
        </button>
        <div class="letters">
          <strong>Gesammelte Buchstaben</strong>
          <div class="plate-wrap">
            ${Array.from({length:6}).map((_,i)=>`<div class="plate ${state.collectedLetters[i]?"":"empty"}">${state.collectedLetters[i]||"?"}</div>`).join("")}
          </div>
        </div>
      </aside>
      <main class="panel content" id="main"></main>
    </div>
  `;
  document.querySelectorAll(".station-tab[data-st]").forEach(btn=>btn.onclick=()=>{ state.currentStation = Number(btn.dataset.st); saveState(); render(); });
  document.getElementById("guideHead").onclick = ()=> document.getElementById("guideDialog").showModal();
  document.getElementById("reset").onclick = ()=>{ if(confirm("Möchten Sie den gesamten Spielstand wirklich zurücksetzen?")) resetGame(); };
  renderStation();
}
function renderHintBox(stationId){
  const station = STATIONS[stationId-1];
  const used = state.hintUsage[stationId] || [];
  return `
    <section class="hint-box">
      <strong>Hinweise</strong>
      ${[0,1].map(i=>`
        <div>
          <button data-hint="${i}" data-station="${stationId}">Hinweis ${i+1} öffnen</button>
          ${used.includes(i)?`<div class="hint-content">${station.hints[i]}</div>`:""}
        </div>
      `).join("")}
    </section>
  `;
}
function bindHints(stationId){
  document.querySelectorAll(`[data-station="${stationId}"][data-hint]`).forEach(btn=>btn.onclick=()=>{
    const i = Number(btn.dataset.hint);
    const arr = state.hintUsage[stationId];
    if(!arr.includes(i)) arr.push(i);
    saveState();
    render();
  });
}
function stationHero(id, alt){
  return `<div class="station-hero"><img src="${ASSETS.stations[id].hero}" alt="${alt}" loading="eager" /></div>`;
}
function moveItem(arr, idx, dir){
  const j = idx + dir;
  if(j<0 || j>=arr.length) return;
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
}
function renderStation(){
  if(state.currentStation===7){ renderFinale(); return; }
  const m = document.getElementById("main");
  const id = state.currentStation;

  if(id===1){
    const docs = [
      {key:"chronik", title:"Dokument A – Klosterchronik", label:"geistlicher Ursprung an der Neuhauser Gasse"},
      {key:"brauhaus", title:"Dokument B – Brauhausregister", label:"urkundlich belegtes Brauhaus"},
      {key:"keller", title:"Dokument C – Kellerkaufvertrag", label:"Erwerb des Lagerkellers"},
      {key:"marke", title:"Dokument D – Warenzeichenrolle", label:"Eintragung des historischen Zeichens"}
    ];
    const dates = ["1294","1328","1862","1887"];
    const drawers = ["I","II","III","IV"];
    m.innerHTML = `
      <section class="station-card">
        <span class="station-badge"><span class="coin" style="width:28px;height:28px;font-size:.8rem">1</span> Archivkombinatorik</span>
        ${stationHero(1,"Illustration des Klosterarchivs mit Datumsplaketten und Hinweiszetteln")}
        <h2>Station 1 – Das Klosterarchiv</h2>
        <p class="desc">Jetzt wird wirklich kombiniert: Jedes Dokument braucht <strong>ein Datum</strong> und <strong>eine Schublade</strong>. Erst wenn beides stimmt, springt die Messingschublade auf.</p>
        <div class="section-grid">
          <div class="box">
            <strong>Archivdokumente</strong>
            <div class="archive-grid" style="margin-top:12px">
              ${docs.map(doc=>`
                <div class="archive-doc">
                  <strong>${doc.title}</strong>
                  <span class="label">${doc.label}</span>
                  <label>Datumsplakette
                    <select data-s1-date="${doc.key}">
                      <option value="">Bitte wählen</option>
                      ${dates.map(d=>`<option value="${d}" ${state.stationData.s1[doc.key].date===d?"selected":""}>${d}</option>`).join("")}
                    </select>
                  </label>
                  <label style="margin-top:8px;display:block">Schublade
                    <select data-s1-drawer="${doc.key}">
                      <option value="">Bitte wählen</option>
                      ${drawers.map(d=>`<option value="${d}" ${state.stationData.s1[doc.key].drawer===d?"selected":""}>${d}</option>`).join("")}
                    </select>
                  </label>
                </div>
              `).join("")}
            </div>
          </div>
          <div class="box">
            <strong>Notizzettel aus dem Archiv</strong>
            <div class="clue-list" style="margin-top:12px">
              <div class="clue">In Schublade I liegt das älteste Dokument.</div>
              <div class="clue">Das Dokument in Schublade II ist genau 34 Jahre jünger als das in Schublade I.</div>
              <div class="clue">Der Kellerkaufvertrag ist das ältere der beiden 19.-Jahrhundert-Dokumente.</div>
              <div class="clue">Die jüngste Spur liegt unmittelbar rechts vom Kellerkaufvertrag.</div>
              <div class="clue">Die Warenzeichenrolle liegt weder in I noch in III.</div>
              <div class="clue">Das Brauhausregister liegt links vom Kellerkaufvertrag, aber nicht ganz links.</div>
            </div>
          </div>
        </div>
        <div class="row" style="justify-content:flex-start"><button class="btn-primary" id="check1">Archiv prüfen</button></div>
        <div id="feedback" class="feedback ${isSolved(1)?"good":"bad"}" style="display:${isSolved(1)?"block":"none"}">${isSolved(1)?"Korrekt. Aus Datum und Schubladenlage ergibt sich die erste Messingplatte: H.":""}</div>
        ${renderHintBox(1)}
      </section>`;
    document.querySelectorAll("[data-s1-date]").forEach(sel=>sel.onchange=()=>{ state.stationData.s1[sel.dataset.s1Date].date=sel.value; saveState(); });
    document.querySelectorAll("[data-s1-drawer]").forEach(sel=>sel.onchange=()=>{ state.stationData.s1[sel.dataset.s1Drawer].drawer=sel.value; saveState(); });
    document.getElementById("check1").onclick=()=>{
      const vals = Object.values(state.stationData.s1);
      const datesChosen = vals.map(v=>v.date);
      const drawersChosen = vals.map(v=>v.drawer);
      if(datesChosen.includes("") || drawersChosen.includes("")) return setStationFeedback(false,"Noch nicht vollständig. Jedes Dokument braucht Datum und Schublade.");
      if(new Set(datesChosen).size!==4 || new Set(drawersChosen).size!==4) return setStationFeedback(false,"Jede Datumsplakette und jede Schublade darf nur einmal verwendet werden.");
      const s = state.stationData.s1;
      const ok = s.chronik.date==="1294" && s.chronik.drawer==="I" && s.brauhaus.date==="1328" && s.brauhaus.drawer==="II" && s.keller.date==="1862" && s.keller.drawer==="III" && s.marke.date==="1887" && s.marke.drawer==="IV";
      ok ? solveStation(1,"Korrekt. Aus Datum und Schubladenlage ergibt sich die erste Messingplatte: H.") : setStationFeedback(false,"Mindestens eine Kombination ist noch falsch. Prüfen Sie insbesondere die beiden 19.-Jahrhundert-Stücke.");
    };
    bindHints(1);
    return;
  }

  if(id===2){
    const locations = [
      {id:"stammhaus", name:"Stammhaus", meta:"Plaque 7 – historischer Ursprung"},
      {id:"keller", name:"Augustiner-Keller", meta:"Plaque 2 – 1862 erworbener Lagerkeller"},
      {id:"wagner", name:"Wagner Salons", meta:"Plaque 4 – kleinere exklusive Räume"},
      {id:"festsaal", name:"Festsaal", meta:"Plaque 9 – großer Saal"},
      {id:"biergarten", name:"Biergarten", meta:"Plaque 5 – offene Außenfläche"},
      {id:"brauereihof", name:"Brauereihof", meta:"Plaque 8 – Betriebszone"}
    ];
    m.innerHTML = `
      <section class="station-card">
        <span class="station-badge"><span class="coin" style="width:28px;height:28px;font-size:.8rem">2</span> Routenlogik</span>
        ${stationHero(2,"Illustration einer stilisierten Münchner Spurensuche mit Karte und Ortsmarken")}
        <h2>Station 2 – Münchner Spurensuche</h2>
        <p class="desc">Vier Orte gehören in die Route, zwei sind nur Ablenkung. Stellen Sie die richtige Reihenfolge zusammen und leiten Sie daraus den Plaque-Code ab.</p>
        <div class="code-lock">
          <div class="box">
            <strong>Route zusammenstellen</strong>
            <div class="slot-grid" style="margin-top:12px">
              ${[0,1,2,3].map(i=>`
                <div class="route-slot">
                  <strong>Stopp ${i+1}</strong>
                  <select data-s2-slot="${i}">
                    <option value="">Ort wählen</option>
                    ${locations.map(loc=>`<option value="${loc.id}" ${state.stationData.s2.slots[i]===loc.id?"selected":""}>${loc.name}</option>`).join("")}
                  </select>
                </div>`).join("")}
            </div>
          </div>
          <div class="box">
            <strong>Kartenlegende</strong>
            <div class="clue-list" style="margin-top:12px">
              ${locations.map(loc=>`<div class="clue"><strong>${loc.name}</strong><br><span class="tiny">${loc.meta}</span></div>`).join("")}
            </div>
          </div>
        </div>
        <div class="section-grid" style="margin-top:12px">
          <div class="box">
            <strong>Rätselhinweise</strong>
            <div class="clue-list" style="margin-top:12px">
              <div class="clue">Weder die Außenfläche noch die Betriebszone gehören zur Route.</div>
              <div class="clue">Der erste Stopp ist der historische Ursprung im Zentrum.</div>
              <div class="clue">Der 1862 erworbene Ort liegt unmittelbar vor dem einzigen Stopp, der nach einer Familie benannt ist.</div>
              <div class="clue">Die Route endet im größten Saal des Abends.</div>
            </div>
          </div>
          <div class="box">
            <strong>Plaque-Code</strong>
            <div class="step-note">Nehmen Sie nach korrekter Route die vier Plaque-Zahlen in genau dieser Reihenfolge.</div>
            <label style="margin-top:12px;display:block">4-stelliger Code
              <input id="s2code" maxlength="4" inputmode="numeric" value="${state.stationData.s2.code}" style="width:100%">
            </label>
          </div>
        </div>
        <div class="row" style="justify-content:flex-start"><button class="btn-primary" id="check2">Route prüfen</button></div>
        <div id="feedback" class="feedback ${isSolved(2)?"good":"bad"}" style="display:${isSolved(2)?"block":"none"}">${isSolved(2)?"Die Route stimmt. Der Plaque-Code öffnet die nächste Schicht und gibt I frei.":""}</div>
        ${renderHintBox(2)}
      </section>`;
    document.querySelectorAll("[data-s2-slot]").forEach(sel=>sel.onchange=()=>{ state.stationData.s2.slots[Number(sel.dataset.s2Slot)] = sel.value; saveState(); });
    document.getElementById("s2code").oninput=(e)=>{ state.stationData.s2.code=e.target.value.replace(/\D/g,"").slice(0,4); e.target.value=state.stationData.s2.code; saveState(); };
    document.getElementById("check2").onclick=()=>{
      const slots = state.stationData.s2.slots;
      if(slots.includes("")) return setStationFeedback(false,"Die Route ist noch unvollständig.");
      if(new Set(slots).size!==4) return setStationFeedback(false,"Jeder Stopp darf nur einmal vorkommen.");
      const okRoute = JSON.stringify(slots)===JSON.stringify(["stammhaus","keller","wagner","festsaal"]);
      const okCode = state.stationData.s2.code === "7249";
      okRoute && okCode ? solveStation(2,"Die Route stimmt. Der Plaque-Code öffnet die nächste Schicht und gibt I frei.") : setStationFeedback(false, okRoute ? "Die Route passt, aber der Plaque-Code noch nicht." : "Die Route ist noch nicht korrekt.");
    };
    bindHints(2);
    return;
  }

  if(id===3){
    const initials = ["A","J","M","W"];
    const symbols = ["Abtsstab","Hopfenzweig","Löwenkopf","Bierkrug"];
    const borders = ["Historisches Warenzeichen","Kellerwappen","Festbier-Siegel","Hofmarke"];
    m.innerHTML = `
      <section class="station-card">
        <span class="station-badge"><span class="coin" style="width:28px;height:28px;font-size:.8rem">3</span> Siegelrekonstruktion</span>
        ${stationHero(3,"Illustration zum Siegel des Brauers mit Wappen- und Markenmotiven")}
        <h2>Station 3 – Das Siegel des Brauers</h2>
        <p class="desc">Hier reicht kein Bauchgefühl mehr. Rekonstruieren Sie das historische Zeichen aus vier Komponenten: linkes Initial, rechtes Initial, Symbol und Randtext.</p>
        <div class="section-grid">
          <div class="box">
            <strong>Siegelprägestation</strong>
            <div class="builder-grid" style="margin-top:12px">
              <label>Linkes Initial
                <select id="s3left"><option value="">Bitte wählen</option>${initials.map(v=>`<option value="${v}" ${state.stationData.s3.left===v?"selected":""}>${v}</option>`).join("")}</select>
              </label>
              <label>Rechtes Initial
                <select id="s3right"><option value="">Bitte wählen</option>${initials.map(v=>`<option value="${v}" ${state.stationData.s3.right===v?"selected":""}>${v}</option>`).join("")}</select>
              </label>
              <label>Mittleres Symbol
                <select id="s3symbol"><option value="">Bitte wählen</option>${symbols.map(v=>`<option value="${v}" ${state.stationData.s3.symbol===v?"selected":""}>${v}</option>`).join("")}</select>
              </label>
              <label>Randtext
                <select id="s3border"><option value="">Bitte wählen</option>${borders.map(v=>`<option value="${v}" ${state.stationData.s3.border===v?"selected":""}>${v}</option>`).join("")}</select>
              </label>
            </div>
          </div>
          <div class="box">
            <strong>Archivvermerke</strong>
            <div class="clue-list" style="margin-top:12px">
              <div class="clue">Das korrekte Zeichen trägt kein Tier und keinen Hopfen.</div>
              <div class="clue">Das linke Initial steht alphabetisch 13 Stellen vor dem rechten.</div>
              <div class="clue">Das kirchliche Symbol steht zwischen den Initialen.</div>
              <div class="clue">Der Rand nennt eine rechtliche Markierung, kein Event und keinen Ort.</div>
            </div>
            <div class="meta-tag">Nur eine Kombination ergibt ein stimmiges historisches Zeichen.</div>
          </div>
        </div>
        <div class="row" style="justify-content:flex-start"><button class="btn-primary" id="check3">Siegel prägen</button></div>
        <div id="feedback" class="feedback ${isSolved(3)?"good":"bad"}" style="display:${isSolved(3)?"block":"none"}">${isSolved(3)?"Das Siegel ist konsistent rekonstruiert. Aus dem Prägestempel fällt der Buchstabe R.":""}</div>
        ${renderHintBox(3)}
      </section>`;
    ["left","right","symbol","border"].forEach(k=>{
      const idMap={left:"s3left",right:"s3right",symbol:"s3symbol",border:"s3border"};
      document.getElementById(idMap[k]).onchange=(e)=>{ state.stationData.s3[k]=e.target.value; saveState(); };
    });
    document.getElementById("check3").onclick=()=>{
      const s = state.stationData.s3;
      if(Object.values(s).includes("")) return setStationFeedback(false,"Noch nicht vollständig. Vier Komponenten müssen gesetzt werden.");
      const ok = s.left==="J" && s.right==="W" && s.symbol==="Abtsstab" && s.border==="Historisches Warenzeichen";
      ok ? solveStation(3,"Das Siegel ist konsistent rekonstruiert. Aus dem Prägestempel fällt der Buchstabe R.") : setStationFeedback(false,"Diese Kombination wirkt heraldisch interessant, aber historisch nicht stimmig.");
    };
    bindHints(3);
    return;
  }

  if(id===4){
    const objects=[
      {id:"glocke",label:"Glocke",icon:ASSETS.stations[4].icons.glocke,style:"left:12%; top:18%; width:7%; height:11%;",num:"4",type:"Signalsymbol"},
      {id:"schlegel",label:"Schlegel",icon:ASSETS.stations[4].icons.schlegel,style:"left:69%; top:24%; width:10%; height:10%;",num:"7",type:"Schlagwerkzeug"},
      {id:"zapfhahn",label:"Messingzapfhahn",icon:ASSETS.stations[4].icons.zapfhahn,style:"left:66%; top:55%; width:7%; height:10%;",num:"9",type:"Flussöffner"},
      {id:"mark200",label:"Fassmarkierung 200",icon:ASSETS.stations[4].icons.mark200,style:"left:18%; top:45%; width:18%; height:17%;",num:"3",type:"Mengenspur"},
      {id:"holzkeil",label:"Holzkeil",icon:ASSETS.stations[4].icons.holzkeil,style:"left:80%; top:76%; width:9%; height:7%;",num:"2",type:"Vorbereitungsteil"}
    ];
    const allFound = state.stationData.s4.found.length===5;
    m.innerHTML = `
      <section class="station-card">
        <span class="station-badge"><span class="coin" style="width:28px;height:28px;font-size:.8rem">4</span> Kelleranalyse</span>
        ${stationHero(4,"Illustration des alten Lagerkellers mit Fässern, Glocke, Werkzeugen und versteckten Objekten")}
        <h2>Station 4 – Der alte Lagerkeller</h2>
        <p class="desc">Teil eins: Finden Sie alle relevanten Objekte. Teil zwei: Ordnen Sie die entdeckten Messingzahlen nach der richtigen Funktionsfolge und knacken Sie den Zahlencode.</p>
        <div class="target-list">${objects.map(o=>`<span class="target ${state.stationData.s4.found.includes(o.id)?"done":""}"><img src="${o.icon}" alt="" loading="lazy" />${o.label}</span>`).join("")}</div>
        <div class="scene-wrap" aria-label="Kellerszene">
          <img class="cellar-bg" src="${ASSETS.stations[4].hero}" alt="Stilisierter alter Lagerkeller mit Fässern, Regal und versteckten Objekten" loading="eager" />
          ${objects.map(o=>`<button class="hidden-item ${state.stationData.s4.found.includes(o.id)?"found":""}" style="${o.style}" data-find="${o.id}" aria-label="${o.label}">${o.label}</button>`).join("")}
        </div>
        ${allFound ? `
          <div class="section-grid" style="margin-top:12px">
            <div class="box">
              <strong>Entdeckte Messingzahlen</strong>
              <div class="evidence-grid" style="margin-top:12px">
                ${objects.map(o=>`<div class="found-clue"><strong>${o.label}</strong><small>${o.type}</small><small>Messingzahl: ${o.num}</small></div>`).join("")}
              </div>
            </div>
            <div class="box">
              <strong>Reihenfolgeregeln</strong>
              <div class="clue-list" style="margin-top:12px">
                <div class="clue">Die reine Mengenspur kommt zuerst.</div>
                <div class="clue">Das Vorbereitungsteil steht direkt vor dem Schlagwerkzeug.</div>
                <div class="clue">Der Flussöffner folgt unmittelbar auf das Schlagwerkzeug.</div>
                <div class="clue">Das Signalsymbol beendet die Folge.</div>
              </div>
              <label style="margin-top:12px;display:block">5-stelliger Kellercode
                <input id="s4code" maxlength="5" inputmode="numeric" value="${state.stationData.s4.code}" style="width:100%">
              </label>
            </div>
          </div>` : `<div class="meta-tag" style="margin-top:12px">Erst nach allen fünf Funden erscheinen die Messingzahlen.</div>`}
        <div id="feedback" class="feedback ${isSolved(4)?"good":"bad"}" style="display:${isSolved(4)?"block":"none"}">${isSolved(4)?"Genau so. Der Kellercode rastet ein und gibt S frei.":""}</div>
        ${renderHintBox(4)}
      </section>`;
    document.querySelectorAll("[data-find]").forEach(b=>b.onclick=()=>{
      const item = b.dataset.find;
      if(!state.stationData.s4.found.includes(item)){
        state.stationData.s4.found.push(item);
        saveState();
        toast(`${b.ariaLabel} gefunden.`);
        renderStation();
      }
    });
    if(allFound){
      document.getElementById("s4code").oninput=(e)=>{ state.stationData.s4.code=e.target.value.replace(/\D/g,"").slice(0,5); e.target.value=state.stationData.s4.code; saveState(); };
      const codeOk = state.stationData.s4.code === "32794";
      if(codeOk && !isSolved(4)) solveStation(4,"Genau so. Der Kellercode rastet ein und gibt S frei.");
    }
    bindHints(4);
    return;
  }

  if(id===5){
    const opts = ["15 Liter","100 Liter","200 Liter","Ausschankgestell","30 Liter","50 Liter"];
    m.innerHTML = `
      <section class="station-card">
        <span class="station-badge"><span class="coin" style="width:28px;height:28px;font-size:.8rem">5</span> Fasslogik</span>
        ${stationHero(5,"Illustration zur Holzfass-Logik mit Fassgrößen, Schlegel und Glocke")}
        <h2>Station 5 – Die Holzfass-Logik</h2>
        <p class="desc">Vier Begriffe, sechs mögliche Zuordnungen – zwei davon sind falsche Fährten. Weisen Sie jeder Bezeichnung die korrekte Bedeutung zu und leiten Sie danach den dreistelligen Fasscode ab.</p>
        <div class="section-grid">
          <div class="box">
            <strong>Zuordnung</strong>
            <div class="clue-list" style="margin-top:12px">
              ${["Hase","Sau","Hirsch","Ganter"].map(name=>`
                <div class="match-row"><strong>${name}</strong>
                  <select data-s5="${name}">
                    <option value="">Bitte wählen</option>
                    ${opts.map(v=>`<option value="${v}" ${state.stationData.s5[name]===v?"selected":""}>${v}</option>`).join("")}
                  </select>
                </div>`).join("")}
            </div>
          </div>
          <div class="box">
            <strong>Hinweiszettel</strong>
            <div class="clue-list" style="margin-top:12px">
              <div class="clue">Genau drei Begriffe bezeichnen Fässer; einer bezeichnet das Gestell des Ausschanks.</div>
              <div class="clue">Der Hase ist das kleinste Fass.</div>
              <div class="clue">Der Hirsch fasst doppelt so viel wie die Sau.</div>
              <div class="clue">30 und 50 Liter tauchen in diesem Set nur als falsche Spuren auf.</div>
            </div>
            <div class="step-note" style="margin-top:12px">Fasscode-Regel: <strong>letzte Ziffer des kleinsten Fasses</strong> – <strong>erste Ziffer des mittleren Fasses</strong> – <strong>erste Ziffer des größten Fasses</strong></div>
            <label style="margin-top:12px;display:block">3-stelliger Fasscode
              <input id="s5code" maxlength="3" inputmode="numeric" value="${state.stationData.s5.code}" style="width:100%">
            </label>
          </div>
        </div>
        <div class="row" style="justify-content:flex-start"><button class="btn-primary" id="check5">Fasslogik prüfen</button></div>
        <div id="feedback" class="feedback ${isSolved(5)?"good":"bad"}" style="display:${isSolved(5)?"block":"none"}">${isSolved(5)?"Sauber gelöst. Der Fasscode ist korrekt und die Platte C wird freigegeben.":""}</div>
        ${renderHintBox(5)}
      </section>`;
    document.querySelectorAll("[data-s5]").forEach(sel=>sel.onchange=()=>{ state.stationData.s5[sel.dataset.s5]=sel.value; saveState(); });
    document.getElementById("s5code").oninput=(e)=>{ state.stationData.s5.code=e.target.value.replace(/\D/g,"").slice(0,3); e.target.value=state.stationData.s5.code; saveState(); };
    document.getElementById("check5").onclick=()=>{
      const s = state.stationData.s5;
      const chosen = [s.Hase,s.Sau,s.Hirsch,s.Ganter];
      if(chosen.includes("")) return setStationFeedback(false,"Noch nicht vollständig. Vier Begriffe, vier Zuordnungen.");
      if(new Set(chosen).size!==4) return setStationFeedback(false,"Jede Zuordnung darf nur einmal genutzt werden.");
      const okMap = s.Hase==="15 Liter" && s.Sau==="100 Liter" && s.Hirsch==="200 Liter" && s.Ganter==="Ausschankgestell";
      const okCode = s.code === "512";
      okMap && okCode ? solveStation(5,"Sauber gelöst. Der Fasscode ist korrekt und die Platte C wird freigegeben.") : setStationFeedback(false, okMap ? "Die Zuordnung passt, aber der Fasscode noch nicht." : "Mindestens eine Zuordnung ist noch falsch.");
    };
    bindHints(5);
    return;
  }

  if(id===6){
    const steps = [
      "Fass auf den Ganter setzen",
      "Zapfhahn ansetzen",
      "Mit dem Schlegel einschlagen",
      "Glocke läuten",
      "Ausschank beginnen",
      "Siegel polieren",
      "Archiv schließen"
    ];
    m.innerHTML = `
      <section class="station-card">
        <span class="station-badge"><span class="coin" style="width:28px;height:28px;font-size:.8rem">6</span> Ritualmatrix</span>
        ${stationHero(6,"Illustration zum Ritual des Anstichs mit Fass, Ganter und Ausschank")}
        <h2>Station 6 – Das Ritual des Anstichs</h2>
        <p class="desc">Hier zählt die echte Ablauflogik. Wählen Sie für jede Position genau einen Schritt. Zwei Karten sind falsche Spuren und dürfen nirgendwo auftauchen.</p>
        <div class="section-grid">
          <div class="box">
            <strong>Ritualreihenfolge</strong>
            <div class="slot-grid" style="margin-top:12px">
              ${[0,1,2,3,4].map(i=>`
                <div class="route-slot">
                  <strong>Schritt ${i+1}</strong>
                  <select data-s6="${i}">
                    <option value="">Bitte wählen</option>
                    ${steps.map(step=>`<option value="${step}" ${state.stationData.s6.slots[i]===step?"selected":""}>${step}</option>`).join("")}
                  </select>
                </div>`).join("")}
            </div>
          </div>
          <div class="box">
            <strong>Regeln</strong>
            <div class="clue-list" style="margin-top:12px">
              <div class="clue">Weder Polieren noch Archivarbeit gehören zum eigentlichen Anstichritual.</div>
              <div class="clue">Bevor der Hahn sitzt, darf nichts geschlagen werden.</div>
              <div class="clue">Die Glocke kommt erst nach der technischen Arbeit.</div>
              <div class="clue">Erst nach dem Signal beginnt der Ausschank.</div>
            </div>
          </div>
        </div>
        <div class="row" style="justify-content:flex-start"><button class="btn-primary" id="check6">Ritual prüfen</button></div>
        <div id="feedback" class="feedback ${isSolved(6)?"good":"bad"}" style="display:${isSolved(6)?"block":"none"}">${isSolved(6)?"Das Ritual sitzt. Der letzte Buchstabe H gleitet aus dem Verschluss.":""}</div>
        ${renderHintBox(6)}
      </section>`;
    document.querySelectorAll("[data-s6]").forEach(sel=>sel.onchange=()=>{ state.stationData.s6.slots[Number(sel.dataset.s6)] = sel.value; saveState(); });
    document.getElementById("check6").onclick=()=>{
      const slots = state.stationData.s6.slots;
      if(slots.includes("")) return setStationFeedback(false,"Noch nicht vollständig. Fünf Schritte werden gebraucht.");
      if(new Set(slots).size!==5) return setStationFeedback(false,"Jeder Schritt darf nur einmal gesetzt werden.");
      const target = [
        "Fass auf den Ganter setzen",
        "Zapfhahn ansetzen",
        "Mit dem Schlegel einschlagen",
        "Glocke läuten",
        "Ausschank beginnen"
      ];
      const ok = target.every((step,i)=>step===slots[i]);
      ok ? solveStation(6,"Das Ritual sitzt. Der letzte Buchstabe H gleitet aus dem Verschluss.") : setStationFeedback(false,"Die Reihenfolge ist noch nicht schankfertig.");
    };
    bindHints(6);
    return;
  }
}
function renderFinale(){
  const m = document.getElementById("main");
  if(state.finalSolved){
    m.innerHTML = `
      <section class="success">
        <div class="finale-hero"><img src="${ASSETS.finale.hero}" alt="Finale Illustration mit leuchtendem Hirschfass" loading="eager" /></div>
        <h2>Anstich gelungen</h2>
        <div class="keg" aria-hidden="true"><div class="foam"></div></div>
        <p>Sie haben alle Spuren entschlüsselt und das verschwundene Hirschfass rechtzeitig gefunden. Aus Archiv, Stadt, Siegel, Keller und Ritual wurde wieder ein Ganzes. München kann feiern.</p>
        <div class="row"><button class="btn-primary" id="again">Noch einmal spielen</button></div>
      </section>`;
    document.getElementById("again").onclick=()=>{ if(confirm("Neues Spiel starten und alles zurücksetzen?")) resetGame(); };
    return;
  }
  m.innerHTML = `
    <section class="station-card">
      <span class="station-badge"><span class="coin" style="width:28px;height:28px;font-size:.8rem">F</span> Finales Schloss</span>
      <div class="finale-hero"><img src="${ASSETS.finale.hero}" alt="Finale Illustration mit leuchtendem Hirschfass" loading="eager" /></div>
      <h2>Finale – Das verschwundene Hirschfass</h2>
      <p class="desc">Sechs Messingbuchstaben liegen vor Ihnen. Setzen Sie sie in die richtige Reihenfolge. Nur das richtige Wort öffnet den Weg zum finalen Anstich.</p>
      <div class="final-box">
        <div class="plate-wrap">${LETTERS.map(l=>`<button class="plate" data-add="${l}" aria-label="Buchstabe ${l} wählen">${l}</button>`).join("")}</div>
        <label>Lösungswort
          <input id="finalInput" maxlength="6" autocomplete="off" value="${state.stationData.finalInput}" style="width:100%;text-transform:uppercase" />
        </label>
        <div class="row" style="justify-content:flex-start">
          <button id="clearFinal">Leeren</button>
          <button id="checkFinal" class="btn-primary">Finale prüfen</button>
        </div>
        <div id="feedback" class="feedback bad" style="display:none"></div>
      </div>
    </section>`;
  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{
    if(state.stationData.finalInput.length<6){
      state.stationData.finalInput += b.dataset.add;
      saveState();
      document.getElementById("finalInput").value = state.stationData.finalInput;
    }
  });
  document.getElementById("finalInput").oninput = (e)=>{
    state.stationData.finalInput = e.target.value.toUpperCase().replace(/[^A-ZÄÖÜ]/g,"").slice(0,6);
    e.target.value=state.stationData.finalInput;
    saveState();
  };
  document.getElementById("clearFinal").onclick = ()=>{ state.stationData.finalInput=""; saveState(); renderFinale(); };
  document.getElementById("checkFinal").onclick = ()=>{
    if(state.stationData.finalInput === "HIRSCH"){
      state.finalSolved = true;
      saveState();
      toast("Geschafft. Der digitale Anstich läuft.");
      renderFinale();
    } else {
      setStationFeedback(false,"Noch nicht ganz. Die Buchstaben sind vollständig – aber noch nicht richtig geordnet.");
    }
  };
}
const guideDialog = document.getElementById("guideDialog");
document.getElementById("closeGuide").onclick = ()=>guideDialog.close();

startTimer();
render();

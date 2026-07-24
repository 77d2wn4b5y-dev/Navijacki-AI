const state = { tone: 'duhovit', lastAnalysis: null };

const $ = (selector) => document.querySelector(selector);
const message = $('#message');
const results = $('#results');
const template = $('#replyTemplate');

const dictionaries = {
  fudbal: ['fudbal', 'gol', 'golman', 'liga', 'kup', 'derbi', 'penal', 'ofsajd', 'marakana', 'superliga', 'liga šampiona', 'napadač', 'teren'],
  košarka: ['košarka', 'basket', 'evroliga', 'aba', 'trojka', 'koš', 'faul', 'centar', 'plej', 'parket', 'pionir', 'arena', 'skok'],
  evropa: ['evropa', 'evroliga', 'liga šampiona', 'uefa', 'final four', 'fajnal for'],
  titule: ['titula', 'titule', 'šampion', 'trofej', 'kup'],
  sudije: ['sudija', 'sudije', 'penal', 'faul', 'krađa', 'pokradeni'],
  rezultat: ['pobeda', 'poraz', 'izgubili', 'dobili', 'rezultat', 'razbili', 'petarda'],
  finansije: ['dug', 'dugovi', 'pare', 'budžet', 'država', 'sponzor'],
};

const switchPhrases = ['nije bitan fudbal', 'pričajmo o košarci', 'pređimo na košarku', 'šta ćemo sa košarkom', 'a košarka', 'a fudbal', 'ma pusti fudbal', 'ma pusti košarku'];
const mockingWords = ['haha', 'hahaha', 'raspad', 'smešni', 'jadni', 'nikad', 'bruk', 'blam', 'razbili', 'gazi'];
const aggressiveWords = ['glup', 'idiot', 'mrzim', 'uništi', 'sramota'];

function countMatches(text, words) {
  return words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
}

function detectSport(text) {
  const value = text.toLowerCase();
  const footballScore = countMatches(value, dictionaries.fudbal);
  const basketballScore = countMatches(value, dictionaries.košarka);
  if (footballScore && basketballScore) return 'oba';
  if (basketballScore > footballScore) return 'košarka';
  if (footballScore > basketballScore) return 'fudbal';
  return 'nepoznato';
}

function sportLabel(sport) {
  return ({ fudbal: 'Fudbal', košarka: 'Košarka', oba: 'Fudbal i košarka', nepoznato: 'Nije jasno' })[sport] || sport;
}

function detectTopic(text) {
  const value = text.toLowerCase();
  const scores = Object.entries(dictionaries)
    .filter(([key]) => !['fudbal', 'košarka'].includes(key))
    .map(([key, words]) => [key, countMatches(value, words)])
    .sort((a, b) => b[1] - a[1]);
  const winner = scores[0];
  if (!winner || winner[1] === 0) return 'Opšta prozivka';
  return ({ evropa: 'Evropa', titule: 'Titule i trofeji', sudije: 'Sudije', rezultat: 'Rezultat', finansije: 'Finansije kluba' })[winner[0]];
}

function analyzeMessage(text) {
  const value = text.toLowerCase();
  const detected = detectSport(value);
  const topic = detectTopic(value);
  const changedTopic = switchPhrases.some((phrase) => value.includes(phrase)) || detected === 'oba';
  const mockScore = countMatches(value, mockingWords);
  const aggression = countMatches(value, aggressiveWords);
  const exclamations = (value.match(/!/g) || []).length;
  const caps = text.replace(/[^A-ZČĆŽŠĐ]/g, '').length;
  let tone = 'Navijačko zadirkivanje';
  if (aggression > 0) tone = 'Preterano oštar';
  else if (mockScore > 1 || exclamations > 2 || caps > 8) tone = 'Podsmevanje';
  else if (value.includes('?')) tone = 'Provokativno pitanje';

  let score = 3 + mockScore + Math.min(exclamations, 2) + (changedTopic ? 2 : 0) + Math.min(aggression, 2);
  score = Math.max(1, Math.min(10, score));

  let advice = 'Najbolje prolazi kratak i duhovit odgovor.';
  if (changedTopic) advice = 'Primećena je promena sporta ili teme — vrati ga na prvobitnu raspravu.';
  else if (topic === 'Sudije' || topic === 'Titule i trofeji') advice = 'Koristi miran odgovor i traži tačan podatak, sezonu ili takmičenje.';
  else if (tone === 'Preterano oštar') advice = 'Ne uzvraćaj uvredom. Smiri ton i poklopi ga humorom.';

  return { detected, topic, changedTopic, tone, score, advice };
}

function context() {
  const chosenSport = $('#sport').value;
  const analysis = analyzeMessage(message.value.trim());
  if (chosenSport !== 'auto') analysis.detected = chosenSport;
  return {
    myClub: $('#myClub').value,
    rival: $('#rivalClub').value,
    friend: $('#friendName').value.trim() || 'majstore',
    incoming: message.value.trim(),
    persona: $('#persona').value,
    ...analysis,
  };
}

const toneOpeners = {
  duhovit: ['', 'Polako, ', 'Dobro je, '],
  cinjenice: ['Činjenice su jednostavne: ', 'Bez navijačke magle: ', 'Hajde precizno: '],
  ostar: ['', 'Da skratimo: ', 'Lepo zvuči, ali '],
  kulturan: ['', 'Pošteno, ali ', 'Bez ljutnje: '],
  istorijski: ['Kad već otvaramo arhivu: ', 'Istorija se ne piše jednom porukom: ', 'Da pogledamo širu sliku: '],
  grupa: ['Ljudi, imamo novu disciplinu: ', 'Prenos uživo: ', 'Ekskluzivno za grupu: '],
};

function baseReplies(ctx) {
  const switchLines = [
    `${ctx.friend}, sport se ne menja usred rasprave samo zato što rezultat više ne odgovara.`,
    `Završimo prvo ${ctx.detected === 'košarka' ? 'košarku' : 'fudbal'}, pa onda otvaramo rezervnu temu.`,
    `Menjaš sport brže nego TV kanal — prvo odgovori na ono što si već otvorio.`,
  ];
  if (ctx.changedTopic) return switchLines;

  const byTone = {
    duhovit: [
      `${ctx.friend}, toliko pratiš ${ctx.myClub} da ćemo ti uskoro poslati člansku kartu.`,
      `Više vremena trošiš na ${ctx.myClub} nego na ${ctx.rival}. To više nije rivalstvo, to je pretplata.`,
      `Dobra prozivka. Još samo da joj dodamo jednu činjenicu i biće kompletna.`,
    ],
    cinjenice: [
      `Pošalji tačan podatak, sezonu i takmičenje. Onda možemo ozbiljno da poredimo.`,
      `Jedna utakmica ne briše sezonu, kao što jedna pobeda ne rešava celu istoriju.`,
      `Rezultat je činjenica, ali su važni i period, takmičenje i kontekst.`,
    ],
    ostar: [
      `Kad ponestanu argumenti, ostanu velika slova, stikeri i promena teme.`,
      `Ne brini za moj klub. Objasni prvo zašto ti je moj klub glavna tema posle svake utakmice.`,
      `Javi se kad budeš imao podatak, a ne samo navijački slogan.`,
    ],
    kulturan: [
      `Čestitam kada je zasluženo, ali ja ostajem uz ${ctx.myClub} i kada pobedi i kada izgubi.`,
      `Rivalstvo je najbolje kada ostane na šali i dobrim argumentima.`,
      `Možemo da se ne slažemo, ali hajde bez preterivanja i sa tačnim podacima.`,
    ],
    istorijski: [
      `Jedan rezultat je trenutak, a istorija kluba su decenije, trofeji, generacije i utakmice.`,
      `Arhiva je bolji sudija od navijačkog pamćenja — navedimo sezonu i takmičenje.`,
      `${ctx.myClub} ima dovoljno istorije da nema potrebe da se bilo šta izmišlja ili ulepšava.`,
    ],
    grupa: [
      `${ctx.friend} je upravo aktivirao rezervni sport jer glavni argument više nije dostupan.`,
      `Stručni štab javlja: 5% činjenica, 95% navijačkog samopouzdanja.`,
      `Imamo promenu taktike — sa rezultata se prelazi na parole bez zaustavljanja igre.`,
    ],
  };
  return byTone[state.tone] || byTone.duhovit;
}

function applyPersona(text, persona, ctx) {
  const wrappers = {
    normalan: (value) => value,
    komentator: (value) => `Ulazimo u završnicu rasprave! ${value}`,
    advokat: (value) => `Poštovani protivniče, ${value.toLowerCase()} Molim da sledeći navod potkrepite dokazom.`,
    profesor: (value) => `Lekcija dana: ${value}`,
    trener: (value) => `Taktičko uputstvo: ${value} Držimo se teme i ne menjamo formaciju usred napada.`,
    novinar: (value) => `Prema nezvaničnim informacijama iz Viber redakcije: ${value}`,
  };
  return wrappers[persona](text, ctx);
}

function renderAnalysis(analysis) {
  state.lastAnalysis = analysis;
  $('#analysisPanel').classList.remove('hidden');
  $('#iqScore').textContent = `${analysis.score}/10`;
  $('#topicValue').textContent = analysis.topic;
  $('#sportValue').textContent = sportLabel(analysis.detected);
  $('#toneValue').textContent = analysis.tone;
  $('#switchValue').textContent = analysis.changedTopic ? 'Da — beži sa teme' : 'Nije primećena';
  $('#analysisAdvice').textContent = analysis.advice;
}

function saveHistory(ctx, replies) {
  const history = JSON.parse(localStorage.getItem('navijacki-history') || '[]');
  history.unshift({
    date: new Date().toLocaleString('sr-RS'),
    friend: ctx.friend,
    message: ctx.incoming,
    topic: ctx.topic,
    sport: sportLabel(ctx.detected),
    reply: replies[0],
  });
  localStorage.setItem('navijacki-history', JSON.stringify(history.slice(0, 20)));
  renderHistory();
}

function renderHistory() {
  const list = $('#historyList');
  const history = JSON.parse(localStorage.getItem('navijacki-history') || '[]');
  if (!history.length) {
    list.innerHTML = '<p class="empty-history">Još nema sačuvanih rasprava.</p>';
    return;
  }
  list.innerHTML = history.slice(0, 5).map((item) => `
    <article class="history-item">
      <div><strong>${escapeHtml(item.friend)}</strong><span>${escapeHtml(item.date)}</span></div>
      <p>${escapeHtml(item.message)}</p>
      <small>${escapeHtml(item.sport)} · ${escapeHtml(item.topic)}</small>
    </article>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function generate() {
  const ctx = context();
  if (!ctx.incoming) {
    results.innerHTML = '<div class="card empty-state">Prvo nalepi njegovu poruku sa Vibera.</div>';
    message.focus();
    return;
  }

  renderAnalysis(ctx);
  const raw = baseReplies(ctx);
  const openers = toneOpeners[state.tone];
  const generated = raw.map((reply, index) => applyPersona(`${openers[index % openers.length]}${reply}`, ctx.persona, ctx));
  results.innerHTML = '';

  generated.forEach((text, index) => {
    const node = template.content.cloneNode(true);
    node.querySelector('.reply-number').textContent = index + 1;
    node.querySelector('.reply-text').textContent = text;
    const copyButton = node.querySelector('.copy-button');
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyButton.textContent = 'Kopirano ✓';
        copyButton.classList.add('copied');
        setTimeout(() => { copyButton.textContent = 'Kopiraj'; copyButton.classList.remove('copied'); }, 1600);
      } catch {
        window.prompt('Kopiraj odgovor:', text);
      }
    });
    results.appendChild(node);
  });

  saveHistory(ctx, generated);
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateDetectedSport() {
  const chosen = $('#sport').value;
  const detected = chosen === 'auto' ? detectSport(message.value) : chosen;
  $('#detectedSport').textContent = `Sport: ${sportLabel(detected)}`;
}

document.querySelectorAll('.tone').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tone').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.tone = button.dataset.tone;
  });
});

message.addEventListener('input', () => {
  $('#charCount').textContent = `${message.value.length}/600`;
  updateDetectedSport();
});

$('#analyze').addEventListener('click', () => {
  if (!message.value.trim()) return message.focus();
  renderAnalysis(context());
});
$('#generate').addEventListener('click', generate);
$('#sport').addEventListener('change', updateDetectedSport);
$('#clearHistory').addEventListener('click', () => {
  localStorage.removeItem('navijacki-history');
  renderHistory();
});

['myClub', 'rivalClub', 'sport', 'friendName', 'persona'].forEach((id) => {
  const el = document.getElementById(id);
  const saved = localStorage.getItem(`navijacki-${id}`);
  if (saved) el.value = saved;
  el.addEventListener('change', () => localStorage.setItem(`navijacki-${id}`, el.value));
});

updateDetectedSport();
renderHistory();
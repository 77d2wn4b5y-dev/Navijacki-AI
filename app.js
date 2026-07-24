const state = {
  tone: 'duhovit',
};

const $ = (selector) => document.querySelector(selector);
const message = $('#message');
const results = $('#results');
const template = $('#replyTemplate');

const footballWords = ['fudbal', 'gol', 'golman', 'liga', 'kup', 'derbi', 'penal', 'ofsajd', 'zvezda', 'partizan', 'marakana', 'javor', 'superliga', 'liga šampiona'];
const basketballWords = ['košarka', 'basket', 'evroliga', 'aba', 'trojka', 'koš', 'faul', 'centar', 'plej', 'parket', 'pionir', 'arena'];

function detectSport(text) {
  const value = text.toLowerCase();
  const footballScore = footballWords.filter((word) => value.includes(word)).length;
  const basketballScore = basketballWords.filter((word) => value.includes(word)).length;

  if (footballScore && basketballScore) return 'oba';
  if (basketballScore > footballScore) return 'košarka';
  if (footballScore > basketballScore) return 'fudbal';
  return 'nepoznato';
}

function sportLabel(sport) {
  if (sport === 'fudbal') return 'fudbal';
  if (sport === 'košarka') return 'košarka';
  if (sport === 'oba') return 'fudbal i košarka';
  return 'sport nije jasno prepoznat';
}

const replies = {
  duhovit: [
    ({ friend, rival }) => `${friend}, dobro je što toliko pratiš moj klub. Još malo pa ti šaljemo člansku kartu.`,
    ({ rival }) => `Više pratiš nas nego ${rival}. To više nije rivalstvo, to je pretplata.`,
    ({ detected }) => detected === 'oba'
      ? `Aha, danas igramo kombinovani sport: kad ne ide fudbal, prelazimo na košarku.`
      : `Polako, sačuvaj malo materijala i za sledeću utakmicu.`,
    ({ detected }) => detected === 'košarka'
      ? `Vidim da je fudbal odjednom završena tema. Dobro došli na parket.`
      : `Je l' košarka ostavljena za rezervni argument ako ovo ne prođe?`,
    () => `Prevod poruke: 5% činjenica, 95% navijačkog optimizma.`,
  ],
  cinjenice: [
    ({ myClub, rival, detected }) => `Navijanje je jedno, a istorija drugo. Hajde da poredimo ${myClub} i ${rival} kroz proverljive rezultate u ${sportLabel(detected)}.`,
    () => `Jedna utakmica ne briše celu sezonu, kao što ni jedna pobeda ne rešava raspravu o istoriji kluba.`,
    ({ detected }) => detected === 'oba'
      ? `Možemo oba sporta, ali redom: prvo završimo temu koju si otvorio, pa onda prelazimo na drugu.`
      : `Pošalji tačan podatak, sezonu i takmičenje. Na činjenice se odgovara činjenicama.`,
    ({ myClub }) => `${myClub} ima dovoljno istorije da ne moram da je ulepšavam. Dovoljno je da otvorimo arhivu.`,
    () => `Rezultat se pamti, ali se kontekst proverava: sastavi, forma, takmičenje i period.`,
  ],
  ostar: [
    ({ friend }) => `${friend}, kad ponestanu argumenti, ostanu velika slova i mnogo stikera.`,
    ({ detected }) => detected === 'oba'
      ? `Nemoj da menjaš sport usred rasprave. Završimo prvo onaj u kom si počeo da gubiš argumente.`
      : `Javi se kad budeš imao podatak, a ne samo navijački slogan.`,
    () => `Toliko se baviš mojim klubom da sam počeo da sumnjam za koga zapravo navijaš.`,
    ({ detected }) => detected === 'košarka'
      ? `Čim fudbal zaboli, odjednom svi postanu košarkaški analitičari.`
      : `Je l' prelazimo na košarku čim ovde ponestane materijala?`,
    () => `Ne brini za moj klub. Objasni prvo zašto ti je moj klub glavna tema posle svake utakmice.`,
  ],
  kulturan: [
    ({ friend }) => `${friend}, lepo je rivalstvo, ali hajde da ostane na šali i dobrim argumentima.`,
    ({ detected }) => detected === 'oba'
      ? `Možemo i fudbal i košarku, samo da ne menjamo temu kad rezultat ne odgovara.`
      : `Čestitam kad je zasluženo. Za ostalo ćemo se zadirkivati posle sledeće utakmice.`,
    () => `Svako voli svoj klub. Zato su derbiji zanimljivi, samo bez preterivanja.`,
    ({ myClub }) => `Ja ostajem uz ${myClub}, i kad pobedi i kad izgubi. To je cela poenta navijanja.`,
    () => `Dobar fudbal i dobra košarka su za poštovanje, bez obzira na boje.`,
  ],
};

function context() {
  const chosenSport = $('#sport').value;
  const detectedFromMessage = detectSport(message.value.trim());
  const detected = chosenSport === 'auto' ? detectedFromMessage : chosenSport;

  return {
    myClub: $('#myClub').value,
    rival: $('#rivalClub').value,
    sport: chosenSport,
    detected,
    friend: $('#friendName').value.trim() || 'majstore',
    incoming: message.value.trim(),
  };
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function updateDetectedSport() {
  const chosen = $('#sport').value;
  const detected = chosen === 'auto' ? detectSport(message.value) : chosen;
  $('#detectedSport').textContent = `Sport: ${sportLabel(detected)}`;
}

function generate() {
  const ctx = context();
  if (!ctx.incoming) {
    results.innerHTML = '<div class="card empty-state">Prvo nalepi njegovu poruku sa Vibera.</div>';
    message.focus();
    return;
  }

  results.innerHTML = '';
  const selected = shuffle(replies[state.tone]).slice(0, 3);
  selected.forEach((factory, index) => {
    const node = template.content.cloneNode(true);
    node.querySelector('.reply-number').textContent = index + 1;
    const text = factory(ctx);
    node.querySelector('.reply-text').textContent = text;
    const copyButton = node.querySelector('.copy-button');
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyButton.textContent = 'Kopirano ✓';
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.textContent = 'Kopiraj';
          copyButton.classList.remove('copied');
        }, 1600);
      } catch {
        window.prompt('Kopiraj odgovor:', text);
      }
    });
    results.appendChild(node);
  });
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

$('#generate').addEventListener('click', generate);
$('#sport').addEventListener('change', updateDetectedSport);

['myClub', 'rivalClub', 'sport', 'friendName'].forEach((id) => {
  const el = document.getElementById(id);
  const saved = localStorage.getItem(`navijacki-${id}`);
  if (saved) el.value = saved;
  el.addEventListener('change', () => localStorage.setItem(`navijacki-${id}`, el.value));
});

updateDetectedSport();
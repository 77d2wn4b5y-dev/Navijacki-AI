const state = {
  tone: 'duhovit',
};

const $ = (selector) => document.querySelector(selector);
const message = $('#message');
const results = $('#results');
const template = $('#replyTemplate');

const replies = {
  duhovit: [
    ({ friend, rival }) => `${friend}, dobro je što toliko pratiš moj klub. Još malo pa ti šaljemo člansku kartu.`,
    ({ rival }) => `Više pratiš nas nego ${rival}. To više nije rivalstvo, to je pretplata.`,
    () => `Polako, sačuvaj malo materijala i za sledeću utakmicu. Ne mora sve u jednom poluvremenu.`,
    () => `Hvala na detaljnoj analizi. Stručni štab je već zakazao sastanak zbog tvoje Viber poruke.`,
    () => `Prevod poruke: 5% činjenica, 95% navijačkog optimizma.`,
  ],
  cinjenice: [
    ({ myClub, rival, sport }) => `Navijanje je jedno, a istorija drugo. Hajde da poredimo ${myClub} i ${rival} kroz proverljive rezultate u ${sport === 'fudbal' ? 'fudbalu' : 'košarci'}, bez parole i buke.`,
    () => `Jedna utakmica ne briše celu sezonu, kao što ni jedna pobeda ne rešava raspravu o istoriji kluba.`,
    () => `Pošalji tačan podatak, sezonu i takmičenje. Na parole se odgovara parolama, a na činjenice činjenicama.`,
    ({ myClub }) => `${myClub} ima dovoljno istorije da ne moram da je ulepšavam. Dovoljno je da otvorimo arhivu.`,
    () => `Rezultat se pamti, ali se kontekst proverava: sastavi, forma, takmičenje i period.`,
  ],
  ostar: [
    ({ friend }) => `${friend}, kad ponestanu argumenti, ostanu velika slova i mnogo stikera.`,
    () => `Javi se kad budeš imao podatak, a ne samo navijački slogan.`,
    () => `Toliko se baviš mojim klubom da sam počeo da sumnjam za koga zapravo navijaš.`,
    () => `Dobra prozivka. Još samo da joj dodamo činjenicu i biće kompletna.`,
    () => `Ne brini za moj klub. Objasni prvo zašto ti je moj klub glavna tema posle svake utakmice.`,
  ],
  kulturan: [
    ({ friend }) => `${friend}, lepo je rivalstvo, ali hajde da ostane na šali i dobrim argumentima.`,
    () => `Čestitam kad je zasluženo. Za ostalo ćemo se zadirkivati posle sledeće utakmice.`,
    () => `Svako voli svoj klub. Zato su derbiji zanimljivi, samo bez preterivanja.`,
    ({ myClub }) => `Ja ostajem uz ${myClub}, i kad pobedi i kad izgubi. To je cela poenta navijanja.`,
    () => `Možemo da se ne slažemo, ali dobar fudbal i dobra košarka su uvek za poštovanje.`,
  ],
};

function context() {
  return {
    myClub: $('#myClub').value,
    rival: $('#rivalClub').value,
    sport: $('#sport').value,
    friend: $('#friendName').value.trim() || 'majstore',
    incoming: message.value.trim(),
  };
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
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
});

$('#generate').addEventListener('click', generate);

['myClub', 'rivalClub', 'sport', 'friendName'].forEach((id) => {
  const el = document.getElementById(id);
  const saved = localStorage.getItem(`navijacki-${id}`);
  if (saved) el.value = saved;
  el.addEventListener('change', () => localStorage.setItem(`navijacki-${id}`, el.value));
});

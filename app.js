const entradaUrlServidor = document.getElementById('serverUrl');
const botaoConectar = document.getElementById('connectBtn');
const elementoStatus = document.getElementById('status');
const listaMusicasEl = document.getElementById('songList');
const audioEl = document.getElementById('audio');
const tocandoAgoraEl = document.getElementById('nowPlaying');

// Define os botões
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const retrocederBtn = document.getElementById('retroceder-btn');
const progredirBtn = document.getElementById('progredir-btn');
const progressotempo = document.getElementById('progressotempo');
const time = document.getElementById('time');
const volumeSlider = document.getElementById('volume-slider');

function retroceder10Segundos() {
    audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
}

function progredir10Segundos() {
    audioEl.currentTime = Math.min(audioEl.duration, audioEl.currentTime + 10);
}

volumeSlider.addEventListener('input', () => {
    // Define o volume do áudio com o valor do slider
    // O valor do slider já é entre 0 e 1 por causa do HTML
    audioEl.volume = volumeSlider.value;
});

// Opcional: define o volume inicial do slider para o volume atual do áudio
// Isso é útil se o seu áudio começar com um volume diferente de 1
audioEl.volume = 1; // Exemplo: volume inicial em 50%
volumeSlider.value = audioEl.volume;

// O botão de pause deve começar invisível
if (pauseBtn) {
    pauseBtn.style.display = 'none';
}

// Event listeners para os botões de play e pause
if (playBtn && pauseBtn) {
    playBtn.addEventListener('click', () => {
        audioEl.play();
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
    });
    
    pauseBtn.addEventListener('click', () => {
        audioEl.pause();
        playBtn.style.display = 'block';
        pauseBtn.style.display = 'none';
    });
}

// Event listeners para os botões de retroceder e progredir

audioEl.addEventListener('timeupdate', () => {
    progressotempo.max = audioEl.duration;
    progressotempo.value = audioEl.currentTime;
    let minutes = Math.floor(audioEl.currentTime / 60);
    let seconds = Math.floor(audioEl.currentTime % 60).toString ().padStart( 2, "0");
    time.textContent = `${minutes}:${seconds}`;
})


// compatibilidade: lê 'urlServidor' (novo) ou 'serverUrl' (antigo)
const urlSalva = localStorage.getItem('urlServidor') ?? localStorage.getItem('serverUrl');
if (urlSalva) entradaUrlServidor.value = urlSalva;

function juntarUrl(base, relativo) {
    try {
        return new URL(relativo, base).href;
    } catch {
        return base.replace(/\/+$/, '') + '/' + relativo.replace(/^\/+/, '');
    }
}

async function buscarJSON(url) {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return resposta.json();
}

function definirStatus(mensagem) {
    elementoStatus.textContent = mensagem;
}



botaoConectar.addEventListener('click', async () => {
    const base = entradaUrlServidor.value.trim().replace(/\/$/, '');
    if (!base) {
        definirStatus('Informe a URL do servidor.');
        return;
    }

    // salva usando a nova chave e também a antiga (compat)
    localStorage.setItem('urlServidor', base);
    localStorage.setItem('serverUrl', base);

    definirStatus('Conectando…');
    try {
        const saude = await buscarJSON(juntarUrl(base, '/api/saude'));
        definirStatus(`Conectado. ${saude.count} músicas disponíveis.`);
        const musicas = await buscarJSON(juntarUrl(base, '/api/musicas'));
        renderizarMusicas(base, musicas);
    } catch (erro) {
        definirStatus('Falha ao conectar. Verifique a URL e a rede.');
        console.error(erro);
    }
});

function renderizarMusicas(base, musicas) {
    listaMusicasEl.innerHTML = '';
    if (!musicas.length) {
        listaMusicasEl.innerHTML = '<li>Nenhuma música encontrada no servidor.</li>';
        return;
    }

    musicas.forEach(musica => {
        const li = document.createElement('li');

        const blocoMeta = document.createElement('div');
        blocoMeta.className = 'meta';

        const tituloEl = document.createElement('div');
        tituloEl.className = 'title';
        tituloEl.textContent = musica.title || '(Sem título)';

        const artistaEl = document.createElement('div');
        artistaEl.className = 'artist';
        artistaEl.textContent = musica.artist || 'Desconhecido';

        blocoMeta.appendChild(tituloEl);
        blocoMeta.appendChild(artistaEl);

        const botaoTocar = document.createElement('img');
        botaoTocar.src = '/static/assets/play_list.png';
        botaoTocar.className = 'botao-tocar-lista'; // Adiciona uma classe para estilização (opcional, mas recomendado)
        botaoTocar.addEventListener('click', () => tocarMusica(base, musica));

        li.appendChild(blocoMeta);
        li.appendChild(botaoTocar);
        listaMusicasEl.appendChild(li);
    });
}

function tocarMusica(base, musica) {
    const url = musica.url?.startsWith('http') ? musica.url : juntarUrl(base, musica.url);
    audioEl.src = url;
    audioEl.play().catch(console.error);
    // Move a lógica de exibição para cá, pois é aqui que a música começa
    if (playBtn && pauseBtn) {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
    }
    tocandoAgoraEl.textContent = `${musica.title}`;
}

const historyListEl = document.getElementById('historyList');
let history = [];
 
function tocarMusica(base, musica) {
  const url = musica.url?.startsWith('http') ? musica.url : juntarUrl(base, musica.url);
  audioEl.src = url;
  audioEl.play().catch(console.error);
  tocandoAgoraEl.textContent = `${musica.title}`;
 
  // --- Histórico ---
  history.push(musica);
  renderizarHistorico();
 
  // --- Mais tocadas ---
  const key = musica.title || musica.url;
  contagemTocadas[key] = (contagemTocadas[key] || 0) + 1;

}
 
function renderizarHistorico() {
  historyListEl.innerHTML = '';
  history.slice().reverse().forEach(musica => { // reverse para mostrar a última primeiro
    const li = document.createElement('li');
    li.textContent = `${musica.title} — ${musica.artist}`;
    historyListEl.appendChild(li);
  });
}
 
const historyLink = document.getElementById('historyLink');
const historyPanel = document.getElementById('historyPanel');
 
// clique no menu abre/fecha histórico
historyLink.addEventListener('click', (e) => {
  e.preventDefault();
  historyPanel.classList.toggle('active');
});
 
// --- MAIS TOCADAS --- //
const topLink = document.getElementById('topLink');
const topPanel = document.getElementById('topPanel');
const topList = document.getElementById('topList');
 
let contagemTocadas = {}; // { "idOuTitulo": numeroDeVezes }
 
// abre/fecha aba
topLink.addEventListener('click', (e) => {
  e.preventDefault();
  topPanel.classList.toggle('active');
  renderizarTopMusicas();
});
 
function renderizarTopMusicas() {
 topList.innerHTML = '';
 
  const entradas = Object.entries(contagemTocadas);
  if (!entradas.length) {
    topList.innerHTML = '<li>Nenhuma musica tocada ainda.</li>';
    return;
    }
  entradas.sort((a, b) => b[1] - a[1]); // ordena decrescente
  entradas.forEach(([titulo, vezes]) => { // pega as top 10
    const li = document.createElement('li');
    li.textContent = `${titulo} — ${vezes}x`;
    topList.appendChild(li);
  });
}
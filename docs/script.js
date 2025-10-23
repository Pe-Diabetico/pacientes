
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQBmT5r5c8iFCq4RPwcuYk8PYBrYNRnVSt9Idh8Z7g1gtJjIWp3WBUpJZ21iTnjtLp6kNRoAR1JkGJg/pub?output=csvhttps://script.google.com/macros/s/AKfycbw3s5iZo7o4x6VboT4EiDK0mKR5bHkKhAVErcp8cpMyw7DUWlUratk_FV2N25q0LEIytA/exec'; 
// Estado global para armazenar os pacientes e o índice atual
const state = {
  paciente: null,
  allPatients: [],
  currentIndex: 0
};


// Nova função para carregar dados da planilha
// CÓDIGO CORRIGIDO (substitua a função inteira no seu script.js)
async function loadData() {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    const data = await response.json();

    if (!Array.isArray(data)) throw new Error("Resposta não é um array JSON");

    // Converte o JSON para o formato esperado pelo visualizador
    state.allPatients = data.map(p => ({
      nome: p.nome,
      sobrenome: p.sobrenome,
      idade: +p.idade || 0,
      sexo: p.sexo,
      tempo: +p.tempo_diabetes_anos || 0,
      hba1c: +p.hba1c_perc || 0,
      imc: +p.imc || 0,
      neuropatia: p.neuropatia_s_n === 'Sim',
      dap: p.dap_s_n === 'Sim',
      deformidade: p.deformidade_s_n === 'Sim',
      ulc_prev: p.ulcera_previa_s_n === 'Sim',
      amp_prev: p.amputacao_previa_s_n === 'Sim',
      has: p.has_s_n === 'Sim',
      tab: p.tabagismo_s_n === 'Sim',
      alc: p.alcool_s_n === 'Sim',
      atividade: p.atividade_fisica_s_n === 'Sim',
      vel: +p.velocidade_marcha_m_s || 0,
      passos: +p.contagem_passos || 0,
      acc: +p.aceleracao_vertical_rms || 0,
      ori: +p.orientacao_pe_graus || 0,
      ppp_esq: +p.pressao_pico_esq_kpa || 0,
      ppp_dir: +p.pressao_pico_dir_kpa || 0,
      temp_esq: +p.temperatura_esq_c || 0,
      temp_dir: +p.temperatura_dir_c || 0,
      risco_calc: +p.risco_modelo_rf || 0
    }));

    if (state.allPatients.length > 0) {
      showPatient(0);
    } else {
      alert("Nenhum paciente encontrado.");
    }

  } catch (err) {
    console.error("Erro ao carregar JSON:", err);
    alert("Falha ao carregar dados do Apps Script. Verifique se o link está correto e publicado.");
  }
}


// Nova função para analisar o texto CSV
function parseCSV(text) {
  // Trata diferentes quebras de linha e remove linhas vazias extras
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== ''); 
  if (lines.length < 2) return []; // Se não tiver cabeçalho + dados, retorna vazio
  
  const headers = lines[0].split(',').map(h => h.trim());

  // Mapeia os nomes das colunas da sua planilha para os nomes internos do script
  const columnMap = {
    nome: headers.indexOf('nome'),
    sobrenome: headers.indexOf('sobrenome'),
    idade: headers.indexOf('idade'),
    sexo: headers.indexOf('sexo'),
    tempo: headers.indexOf('tempo_diabetes_anos'),
    hba1c: headers.indexOf('hba1c_perc'),
    imc: headers.indexOf('imc'),
    neuropatia: headers.indexOf('neuropatia_s_n'),
    deformidade: headers.indexOf('deformidade_s_n'),
    ulc_prev: headers.indexOf('ulcera_previa_s_n'),
    amp_prev: headers.indexOf('amputacao_previa_s_n'),
    dap: headers.indexOf('dap_s_n'),
    has: headers.indexOf('has_s_n'),
    tab: headers.indexOf('tabagismo_s_n'),
    alc: headers.indexOf('alcool_s_n'),
    atividade: headers.indexOf('atividade_fisica_s_n'),
    vel: headers.indexOf('velocidade_marcha_m_s'),
    passos: headers.indexOf('contagem_passos'),
    acc: headers.indexOf('aceleracao_vertical_rms'),
    ori: headers.indexOf('orientacao_pe_graus'),
    ppp_esq: headers.indexOf('pressao_pico_esq_kpa'),
    ppp_dir: headers.indexOf('pressao_pico_dir_kpa'),
    temp_esq: headers.indexOf('temperatura_esq_c'),
    temp_dir: headers.indexOf('temperatura_dir_c'),
    risco_calc: headers.indexOf('risco_modelo_rf') 
  };

  // Verifica se a coluna de risco foi encontrada
  if (columnMap.risco_calc === -1) {
      console.error(`Erro no parseCSV: A coluna de risco ('risco_modelo_rf') não foi encontrada nos cabeçalhos do CSV: ${headers.join(', ')}`);
      alert("Erro: A coluna com o risco calculado não foi encontrada. Execute o script Python primeiro ou verifique o nome da coluna.");
      return []; // Retorna vazio para evitar erros posteriores
  }

  const patients = [];
  for (let i = 1; i < lines.length; i++) {
    // Tratamento mais robusto para CSV, considerando vírgulas dentro de aspas (embora improvável aqui)
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '')); // Remove aspas extras
    
    // Converte 's'/'sim' para true, qualquer outra coisa para false
    const toBool = (val) => val ? (val.trim().toLowerCase() === 's' || val.trim().toLowerCase() === 'sim') : false;
    // Converte para número, tratando valor vazio ou não-numérico como NaN inicialmente
    const toNum = (val) => {
        if (val === null || val === undefined || val.trim() === '') return NaN; // Trata vazio como NaN
        const num = parseFloat(val.trim());
        return isNaN(num) ? NaN : num; // Retorna NaN se não for um número válido
    };

    const p = {
      nome: values[columnMap.nome] || '?', // Default se ausente
      sobrenome: values[columnMap.sobrenome] || '',
      idade: toNum(values[columnMap.idade]),
      sexo: values[columnMap.sexo] || '?',
      tempo: toNum(values[columnMap.tempo]),
      hba1c: toNum(values[columnMap.hba1c]),
      imc: toNum(values[columnMap.imc]),
      neuropatia: toBool(values[columnMap.neuropatia]),
      dap: toBool(values[columnMap.dap]),
      deformidade: toBool(values[columnMap.deformidade]),
      ulc_prev: toBool(values[columnMap.ulc_prev]),
      amp_prev: toBool(values[columnMap.amp_prev]),
      has: toBool(values[columnMap.has]),
      tab: toBool(values[columnMap.tab]),
      alc: toBool(values[columnMap.alc]),
      atividade: toBool(values[columnMap.atividade]),
      vel: toNum(values[columnMap.vel]),
      passos: toNum(values[columnMap.passos]),
      acc: toNum(values[columnMap.acc]),
      ori: toNum(values[columnMap.ori]),
      temp_esq: toNum(values[columnMap.temp_esq]),
      temp_dir: toNum(values[columnMap.temp_dir]),
      ppp_esq: toNum(values[columnMap.ppp_esq]),
      ppp_dir: toNum(values[columnMap.ppp_dir]),
      risco_calc: toNum(values[columnMap.risco_calc]) // <-- ADICIONADO
    };
    
    // Substituir NaN por 0 (ou outra estratégia) após leitura
    Object.keys(p).forEach(key => {
        if (typeof p[key] === 'number' && isNaN(p[key])) {
            p[key] = 0; // Ou talvez deixar como '—' na UI? Por ora, 0.
        }
    });

    patients.push(p);
  }
  return patients;
}

// Funções de navegação
function nextPatient() {
  if (state.allPatients.length === 0) return;
  state.currentIndex = (state.currentIndex + 1) % state.allPatients.length;
  showPatient(state.currentIndex);
}

function prevPatient() {
  if (state.allPatients.length === 0) return;
  state.currentIndex = (state.currentIndex - 1 + state.allPatients.length) % state.allPatients.length;
  showPatient(state.currentIndex);
}

// Define o paciente atual e atualiza a UI
function showPatient(index) {
  state.paciente = state.allPatients[index];
  atualizarUI();
}

// Função que desenha os dados na tela (MODIFICADA)
function atualizarUI() {
  const p = state.paciente;
  
  // Reseta a UI se não houver paciente (estado inicial)
  if (!p) {
    document.getElementById('avatar').textContent = 'CP';
    document.getElementById('p_nome').textContent = 'Nome: —';
    document.getElementById('p_demo').textContent = 'idade — • sexo — • imc —';
    document.getElementById('p_clin').textContent = 'Tempo DM — • HbA1c —';
    
    document.getElementById('etiologia').innerHTML='';
    document.getElementById('habitos').innerHTML='';
    document.getElementById('sensors').innerHTML='';

    const fillOr = (id,val)=>document.getElementById(id).textContent = val===undefined?'—':val;
    ['f_idade','f_sexo','f_imc','f_tempo','f_hba1c','f_vel','f_passos','f_acc','f_ori','f_defo','f_has','f_tab','f_alc','f_atividade','f_ulc','f_amp'].forEach(i=>fillOr(i,'—'));
    ['temp-esq','temp-dir','temp-ass','ppp-esq','ppp-dir'].forEach(i=>document.getElementById(i)&&(document.getElementById(i).textContent='—'));
    document.getElementById('score').textContent='—';
    document.getElementById('score-label').textContent='—';
    document.getElementById('badge-neuro').textContent='Neuropatia: —';
    document.getElementById('badge-dap').textContent='DAP: —';
    document.getElementById('meter-fill').style.width='0%';
    document.getElementById('ppp-bar').style.width='0%';
    return;
  }

  // Preenche o card do paciente
  document.getElementById('avatar').textContent = p.nome ? (p.nome[0]+p.sobrenome[0]) : '??';
  document.getElementById('p_nome').textContent = `Nome: ${p.nome} ${p.sobrenome}`;
  document.getElementById('p_demo').textContent = `idade ${p.idade} • sexo ${p.sexo} • imc ${p.imc}`;
  document.getElementById('p_clin').textContent = `Tempo DM ${p.tempo} anos • HbA1c ${p.hba1c}%`;

  // Limpa e preenche os chips
  const etiologia = document.getElementById('etiologia'); etiologia.innerHTML='';
  const habitos = document.getElementById('habitos'); habitos.innerHTML='';
  const sensors = document.getElementById('sensors'); sensors.innerHTML='';

  // etiologia chips
  etiologia.appendChild(chip('Neuropatia', p.neuropatia));
  etiologia.appendChild(chip('DAP', p.dap));
  etiologia.appendChild(chip('Deformidade', p.deformidade));
  etiologia.appendChild(chip('Úlcera prévia', p.ulc_prev));
  etiologia.appendChild(chip('Amputação prévia', p.amp_prev));

  // habitos
  habitos.appendChild(chip('HAS', p.has));
  habitos.appendChild(chip('Tabagismo', p.tab));
  habitos.appendChild(chip('Álcool', p.alc));
  habitos.appendChild(chip('Atividade física', p.atividade));

  // sensores
  sensors.appendChild(chip(`Velocidade ${p.vel} m/s`, true));
  sensors.appendChild(chip(`Passos ${p.passos}`, true));
  sensors.appendChild(chip(`PPP E ${p.ppp_esq} kPa`, true));
  sensors.appendChild(chip(`PPP D ${p.ppp_dir} kPa`, true));

  // preencher features
  const fillOr = (id,val)=>document.getElementById(id).textContent = val===undefined?'—':val;
  const simNao = (val) => val ? 'Sim' : 'Não';
  document.getElementById('badge-neuro').textContent = `Neuropatia: ${simNao(p.neuropatia)}`;
  document.getElementById('badge-dap').textContent = `DAP: ${simNao(p.dap)}`;

  // --- Mostrar o Risco Pré-Calculado ---
  const riscoPreCalculado = p.risco_calc; // Valor lido da planilha (0 a 1)
  
  // Criar o objeto esperado pela função mostrarRisco
  const risco = { 
      scaled: Math.round((riscoPreCalculado || 0) * 100) // Converte para 0 a 100 e trata NaN/undefined
  };
  
  mostrarRisco(risco); // Chama a função que atualiza o medidor de risco
}

// Função chip 
function chip(text, active) {
  const d = document.createElement('div');
  d.className = 'chip';
  d.textContent = text;
  // Destaca chips "ativos" (condições presentes ou dados de sensor)
  if(active) {
      d.style.background = 'rgba(110, 231, 183, 0.1)'; // Tom verde
      d.style.color = '#6ee7b7';
  }
  return d;
}

// Função para mostrar o risco no medidor 
function mostrarRisco(r) {
  // Garante que pct é um número válido entre 0 e 100
  const pct = Math.min(100, Math.max(0, r.scaled || 0)); 
  
  document.getElementById('score').textContent = pct + '%';
  const label = pct < 30 ? 'Baixo' : (pct < 60 ? 'Moderado' : 'Alto');
  document.getElementById('score-label').textContent = label;
  document.getElementById('meter-fill').style.width = pct + '%';

  const fill = document.getElementById('meter-fill');
  if(pct < 30) fill.style.background = 'linear-gradient(90deg,#34d399,#60a5fa)';
  else if(pct < 60) fill.style.background = 'linear-gradient(90deg,#f59e0b,#f97316)';
  else fill.style.background = 'linear-gradient(90deg,#f97316,#ef4444)';
}

// listeners 
document.addEventListener('DOMContentLoaded', function() {
  // Conecta os novos botões
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  if(prevBtn) prevBtn.addEventListener('click', prevPatient);
  if(nextBtn) nextBtn.addEventListener('click', nextPatient);

  // Carrega os dados da planilha ao iniciar
  loadData();
});
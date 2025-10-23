document.addEventListener('DOMContentLoaded', () => {

    // 1. Objeto de Dados
    // Armazena todo o texto de justificativa para ser usado no modal.
    const featureData = {
        'demografia': {
            title: 'I. Dados Demográficos e Antropométricos',
            features: [
                { 
                    name: 'idade (Idade do paciente em anos)', 
                    desc: 'A idade é um componente demográfico padrão utilizado em estudos clínicos e em modelos de machine learning (ML) para classificar a progressão do DM e a neuropatia periférica (NP) (Chauhan et al., 2023). A prevalência de DM e o risco de NP tendem a aumentar com o avanço da idade (Ferreira, 2017). Estudos frequentemente observam uma faixa etária predominante de 60 a 79 anos em portadores de DM (Tavares et al., 2016). A idade está incluída nas quatro "características não-pressóricas" utilizadas para treinar modelos de ML (Chauhan et al., 2023).' 
                },
                { 
                    name: 'sexo (Sexo biológico do paciente - M ou F)', 
                    desc: 'O sexo é uma característica demográfica padrão. Em estudos realizados, observou-se uma maior prevalência de indivíduos diabéticos do sexo feminino, como o estudo que encontrou 71,7% de participantes do sexo feminino (Tavares et al., 2016).' 
                },
                { 
                    name: 'imc (Índice de Massa Corporal do paciente)', 
                    desc: 'O IMC (Body Mass Index - BMI) é uma variável antropométrica padrão e uma característica demográfica incluída nos dados de participantes em estudos clínicos (Castillo-Morquecho et al., 2024), sendo também listado como Característica Demográfica em abordagens de aprendizado de máquina (Sheikh et al., 2025). O IMC é deduzido a partir de dados de massa e altura, que são considerados "características não-pressóricas" para o treinamento de modelos de ML (Chauhan et al., 2023).' 
                }
            ]
        },
        'glicemia': {
            title: 'II. Variáveis Clínicas e de Controle Glicêmico',
            features: [
                { 
                    name: 'tempo_diabetes_anos (Duração do Diabetes em anos)', 
                    desc: 'O tempo de diagnóstico do DM é um fator clínico importante. Segundo (Tavares et al., 2016), um tempo de diagnóstico maior que 10 anos é um fator de risco complementar para o surgimento de complicações nos pés. O tempo de DM é frequentemente incluído nas Características Demográficas em estudos de ML (Sheikh et al., 2025).' 
                },
                { 
                    name: 'hba1c_perc (Nível percentual de Hemoglobina Glicada)', 
                    desc: 'A Hemoglobina Glicada (HbA1c) é um método diagnóstico padrão para DM (Castillo-Morquecho et al., 2024). Níveis de HbA1c correlacionam-se com a neuropatia diabética periférica (Casadei et al., 2021 citado em Castillo-Morquecho et al., 2024) e com o risco de doenças cardiovasculares (Au Yeung et al., 2018 citado em Castillo-Morquecho et al., 2024). Assim como a idade, o HbA1c é considerado uma "característica não-pressórica" fundamental para o treinamento de algoritmos de machine learning (Chauhan et al., 2023).' 
                }
            ]
        },
        'etiologia': {
            title: 'III. Fatores de Risco Etiológicos Primários',
            features: [
                { 
                    name: 'neuropatia_s_n (Neuropatia Periférica - NP)', 
                    desc: 'A Neuropatia Diabética (ND), especialmente a sensitiva e motora, é o maior fator de risco para a ulceração e amputação. Segundo (Borges, 2023), a Neuropatia Periférica Sensitiva no Pé Diabético pode causar lesões precursoras de úlceras. A neuropatia periférica causa a perda gradual da sensibilidade tátil e dolorosa no pé, tornando o diabético vulnerável a pequenos traumas (Ferreira, 2017). O objetivo de alguns estudos de ML é classificar indivíduos com DM com ou sem neuropatia periférica (Chauhan et al., 2023).' 
                },
                { 
                    name: 'dap_s_n (Doença Arterial Periférica - DAP)', 
                    desc: 'A DAP é um dos fatores etiológicos do pé diabético (Borges, 2023). O pé diabético é definido pela presença de neuropatia, infecção, alterações neurológicas e Doença Arterial Periférica (DAP) (Tavares et al., 2016). A DAP (vasculopatia) reduz o fluxo sanguíneo, o que prejudica a cicatrização e, em associação com traumas e infecção, pode levar à gangrena (Tavares et al., 2016). A DAP é monitorada por dispositivos, sendo utilizada para determinar a progressão dessa condição no paciente (Peterson et al., 2021 citado em Borges, 2023).' 
                }
            ]
        },
        'historico': {
            title: 'IV. Fatores de Risco Biomecânicos e Histórico de Lesões',
            features: [
                { 
                    name: 'deformidade_s_n (Deformidade no pé)', 
                    desc: 'A neuropatia motora gera deformidades ósseas, como dedos em garra ou em martelo, resultando em pressão plantar (PP) anormal nessas regiões (Borges, 2023); (Tavares et al., 2016). A presença de deformidades ósseas é um dos fatores verificados durante o exame clínico dos pés para identificar úlceras e amputações (Tavares et al., 2016).' 
                },
                { 
                    name: 'ulcera_previa_s_n (Úlcera prévia no pé)', 
                    desc: 'Ter um histórico de úlcera no pé é um fator de risco complementar (Tavares et al., 2016). Segundo (Iversen et al., 2009 citado em Khandakar et al., 2022), o histórico de úlcera no pé aumenta a mortalidade entre indivíduos com diabetes. Pacientes com úlceras ativas nos pés são frequentemente excluídos de estudos de pesquisa (Moreira et al., 2020). O desenvolvimento de úlceras precede 85% das amputações (Ferreira, 2017).' 
                },
                { 
                    name: 'amputacao_previa_s_n (Amputação prévia)', 
                    desc: 'O histórico de amputação prévia é um fator de risco complementar (Tavares et al., 2016). Pacientes que já tiveram amputações são classificados em um risco mais elevado (Tavares et al., 2016). Amputações são uma complicação grave e, em alguns estudos de pesquisa, constituem um critério de exclusão.' 
                }
            ]
        },
        'sistemico': {
            title: 'V. Complicações Microvasculares Sistêmicas',
            features: [
                { 
                    name: 'retinopatia_s_n (Retinopatia diabética)', 
                    desc: 'O DM compõe um grupo de doenças metabólicas associadas a disfunções e insuficiência de diferentes órgãos, incluindo o sistema oftalmológico (Tavares et al., 2016). A retinopatia é uma complicação microvascular. A Inteligência Artificial (IA) tem sido utilizada para prever e diagnosticar a Retinopatia Diabética (Huang et al., 2024).' 
                },
                { 
                    name: 'nefropatia_s_n (Nefropatia diabética)', 
                    desc: 'O DM pode evoluir com complicações renais (Moreira et al., 2020). As complicações da DM podem atingir o sistema renal (Tavares et al., 2016). A nefropatia é uma complicação microvascular. Modelos de machine learning são desenvolvidos para prever e diagnosticar a Nefropatia Diabética (Huang et al., 2024).' 
                }
            ]
        },
        'habitos': {
            title: 'VI. Fatores de Risco Sistêmicos e Hábitos de Vida',
            features: [
                { 
                    name: 'has_s_n (Hipertensão Arterial Sistêmica - HAS)', 
                    desc: 'A HAS é uma comorbidade frequentemente presente em pacientes com DM. A hipertensão arterial sistêmica é considerada um fator de risco complementar para o pé diabético. Sua alta prevalência nos diabéticos é um fator de risco para doenças cardiovasculares e comprometimento microvascular, sendo também listada entre as comorbidades usadas como fatores preditivos em modelos de Inteligência Artificial para a Úlcera no Pé Diabético (DFU) (Chemello et al., 2022).' 
                },
                { 
                    name: 'tabagismo_s_n (Tabagismo)', 
                    desc: 'O uso do tabaco é um fator de risco complementar investigado. O tabaco aumenta a ocorrência de alterações macrovasculares, propiciando o surgimento de úlceras e comprometendo o prognóstico de úlceras já existentes. Estudos encontraram associação estatística significativa entre o uso de tabaco e o risco de úlceras. O tabaco (uso de tabaco) é listado como uma das principais causas de mortalidade prematura e é um fator avaliado no estilo de vida dos pacientes.' 
                },
                { 
                    name: 'alcool_s_n (Consumo de Álcool)', 
                    desc: 'O consumo de álcool é uma prática de estilo de vida pesquisada para verificar o risco de complicações. O estilo de vida (que pode incluir hábitos de alcoolismo) é um fator considerado na avaliação periódica de pacientes com risco de úleras ativas (Lourenço, 2018).' 
                },
                { 
                    name: 'atividade_fisica_s_n (Atividade Física)', 
                    desc: 'A prática de atividade física é uma variável de estilo de vida investigada. Caminhar é amplamente recomendado como estratégia de reabilitação para melhorar a saúde em pessoas com DM (Chen et al., 2021). A velocidade de marcha, que está ligada à intensidade da atividade, é uma informação que pode ser monitorada para garantir que o paciente não exceda a intensidade recomendada (Chen et al., 2021).' 
                }
            ]
        },
        'marcha': {
            title: 'VII. Parâmetros Biomecânicos e Cinematográficos da Marcha',
            features: [
                { 
                    name: 'velocidade_marcha_m_s (Velocidade média)', 
                    desc: 'A velocidade de marcha (gait velocity) é um parâmetro espacial crucial no diagnóstico e reabilitação, sendo calculada por sistemas de palmilhas (Zhang et al., 2023). Uma menor velocidade de marcha é relatada na literatura como uma das alterações resultantes da neuropatia, interferindo no desempenho motor (Ferreira, 2017). Estudos de machine learning (ML) utilizam a classificação da intensidade da marcha em diferentes velocidades (e.g., 0.8 m/s, 1.6 m/s, 2.4 m/s) como variável preditiva (Chen et al., 2021).' 
                },
                { 
                    name: 'contagem_passos (Número estimado de passos diários)', 
                    desc: 'A medição de pressão plantar em condições dinâmicas permite o monitoramento do volume da marcha e das atividades diárias (Razak et al., 2012). O aumento da duração da caminhada (e consequentemente o número de passos) aumenta a carga repetitiva sobre os tecidos plantares, elevando o risco de úlceras (Chen et al., 2021). O número de passos ou a duração da fase de apoio são parâmetros temporais fornecidos por sistemas de palmilhas (Zhang et al., 2023).' 
                },
                { 
                    name: 'aceleracao_vertical_rms e orientacao_pe_graus', 
                    desc: 'Sistemas de palmilhas inteligentes frequentemente utilizam Sensores Inerciais (UMIs), como acelerômetros e giroscópios, para monitorar o movimento, a orientação, a postura e os padrões de marcha. A presença de deformidades e a neuropatia motora prejudicam o equilíbrio. Embora acelerômetros e giroscópios adicionem complexidade, eles fornecem informações em tempo real sobre movimentos, orientação, postura e padrões de marcha (Borges, 2023). A aceleração vertical (ou Força de Reação do Solo Vertical) é um marcador cinemático importante. A medição de ângulos (orientação do pé) é um parâmetro cinemático que pode ser usado em modelos de regressão.' 
                }
            ]
        },
        'pressao': {
            title: 'VIII. Variáveis de Pressão Plantar',
            features: [
                { 
                    name: 'pressao_pico_esq_kpa e pressao_pico_dir_kpa (Pico máximo de pressão - PPP)', 
                    desc: 'O Pico de Pressão Plantar (PPP) elevado é um forte fator de risco para o desenvolvimento de úlceras plantares (Ferreira, 2017). A PPP excessiva, decorrente de alterações biomecânicas ou deformidades, é uma preocupação central no PD. Valores de PPP são medidos em unidades de pressão (kPa). O PPP é uma das 18 "características relacionadas à pressão" (pressure features) extraídas de palmilhas sensorizadas para treinar modelos preditivos de machine learning (Chauhan et al., 2023). Limiares como 200 kPa são considerados consensuais na literatura para definir o risco de sobrepressão (Castro-Martins, 2024).' 
                },
                { 
                    name: 'pressao_integral_esq_kpa_s e pressao_integral_dir_kpa_s (Pressão Integral no Tempo - PTI)', 
                    desc: 'O PTI (Pressure-Time Integral) ou Integral Força-Tempo (FTI) quantifica a carga de pressão acumulada durante o apoio (Chen et al., 2021). O PTI é um recurso extraído dos dados de pressão. A análise do PTI para cada região plantar é uma das 18 "características de pressão" utilizadas para o treinamento de algoritmos de ML (Chauhan et al., 2023). Estudos mostram que o FTI (relação entre força exercida contra o chão e tempo integral) era mais intenso em pacientes com Neuropatia Periférica (NP) (Ferreira, 2017).' 
                }
            ]
        },
        'sensores': {
            title: 'IX. Assimetria e Condições Ambientais Locais',
            features: [
                { 
                    name: 'temperatura_esq_c e temperatura_dir_c (Temperatura da pele)', 
                    desc: 'A Neuropatia Periférica (NP) e as alterações vasculares podem causar termorregulação irregular. A medição contínua da temperatura plantar é uma estratégia essencial de monitoramento. A temperatura pode ser vista como uma característica confiável para o PD, pois úlceras podem ser precedidas por aumento da temperatura devido à inflamação e autólise enzimática. Sensores de temperatura são componentes padrão de palmilhas inteligentes.' 
                },
                { 
                    name: 'temp_assimetria_c (Diferença absoluta de temperatura)', 
                    desc: 'A diferença de temperatura (assimetria) entre os pés (TCI - Temperature Change Index) é um dos sinais mais importantes para o despiste de úlceras. Um aumento de temperatura maior ou igual a 2,2 ºC em relação ao pé contralateral ou à medida basal é considerado um fator que precede o início de inflamação/ulceração iminente (Borges, 2023); (Lourenço, 2018). A diferença de temperatura é uma variável utilizada para reduzir a dimensionalidade dos dados em estudos de machine learning (Castillo-Morquecho et al., 2024).' 
                },
                { 
                    name: 'umidade_esq_perc e umidade_dir_perc (Umidade relativa)', 
                    desc: 'O aumento da umidade é um fator de risco que pode originar o desenvolvimento de fungos e bactérias, meio propício para úlceras (Lourenço, 2018). Sistemas de palmilhas inteligentes incluem sensores de umidade para monitorar as condições internas do calçado (Kosaji et al., 2025); (Everett et al., 2022). Modelos de patentes preveem a inclusão de sensores fisiológicos como pressão, temperatura e umidade (Everett et al., 2022).' 
                }
            ]
        },
        'alvo': {
            title: 'X. Variável Alvo (Target)',
            features: [
                { 
                    name: 'risco_ulcera_calc (Classificação calculada do risco de úlcera)', 
                    desc: 'Esta variável representa a saída esperada dos modelos de classificação e o objetivo principal do sistema, que é a prevenção e detecção precoce de úlceras no pé diabético (Borges, 2023). A classificação pode ser binária (risco baixo ou alto) ou mais estratificada (Khandakar et al., 2022). O uso de algoritmos de machine learning visa classificar o risco de úlcera com alta acurácia, utilizando as características biomecânicas, térmicas e clínicas coletadas (Chauhan et al., 2023).' 
                }
            ]
        }
    };

    // 2. Seleção dos Elementos do DOM
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalList = document.getElementById('modal-features-list');
    const closeBtn = document.querySelector('.close-btn');
    const detailBtns = document.querySelectorAll('.details-btn');

    // 3. Função para abrir o Modal
    const openModal = (featureKey) => {
        const data = featureData[featureKey];
        if (!data) return; // Segurança

        // Popula o título
        modalTitle.textContent = data.title;

        // Limpa a lista antiga
        modalList.innerHTML = '';

        // Popula a lista de características
        data.features.forEach(feature => {
            // Regex para encontrar citações (ex: (Autor et al., 2023) ou (Autor, 2023))
            // e envolvê-las em tags <em> para estilização
            const regex = /\(([^)]+,\s*\d{4}[^)]*)\)/g;
            const formattedDesc = feature.desc.replace(regex, '<em>($1)</em>');

            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${feature.name}</strong>
                <p>${formattedDesc}</p>
            `;
            modalList.appendChild(li);
        });

        // Exibe o modal
        modal.style.display = 'block';
    };

    // 4. Função para fechar o Modal
    const closeModal = () => {
        modal.style.display = 'none';
    };

    // 5. Adiciona Event Listeners
    // Adiciona evento de clique para cada botão "Ver Detalhes"
    detailBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const featureKey = btn.closest('.feature-card').dataset.featureKey;
            openModal(featureKey);
        });
    });

    // Adiciona evento de clique para o botão de fechar (X)
    closeBtn.addEventListener('click', closeModal);

    // Adiciona evento de clique para fechar o modal clicando fora dele
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

});
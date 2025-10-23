import gspread
import pandas as pd
import joblib
import numpy as np
from google.oauth2.service_account import Credentials
from gspread.utils import rowcol_to_a1 
import warnings

# Ignorar FutureWarnings do gspread ou pandas, se houver
warnings.simplefilter(action='ignore', category=FutureWarning)

# --- Configurações ---
PLANILHA_ID = '1EcnXDdDtrK5Qvtyy3-npivIFtj57Fwwtbg_YpyahCNU'
NOME_ABA = 'Pacientes_simulados'
ARQUIVO_CREDENCIAL = 'credentials.json' 
MODELO_PATH = "modelo_rf_v1.joblib"
FEATURES_PATH = "features_v1.joblib"
SCALER_PATH = "scaler_v1.joblib"             # <-- ADICIONADO
NUMERIC_FEATURES_PATH = "numeric_features_v1.joblib" # <-- ADICIONADO
NOVA_COLUNA_RISCO = 'risco_modelo_rf' 

# --- Autenticação com Google Sheets ---
print("Autenticando com Google API...")
try:
    scopes = ['https://www.googleapis.com/auth/spreadsheets']
    creds = Credentials.from_service_account_file(ARQUIVO_CREDENCIAL, scopes=scopes)
    gc = gspread.authorize(creds)
    print("Autenticação bem-sucedida.")
except Exception as e:
    print(f"Erro na autenticação: {e}")
    print("Verifique se o arquivo 'credentials.json' está correto e na raiz do projeto.")
    exit()

# --- Carregar Planilha e Dados ---
print(f"Abrindo planilha ID: {PLANILHA_ID}...")
try:
    spreadsheet = gc.open_by_key(PLANILHA_ID)
    worksheet = spreadsheet.worksheet(NOME_ABA)
    print(f"Aba '{NOME_ABA}' encontrada. Carregando dados...")
    
    dados_pacientes_lista = worksheet.get_all_records() 
    if not dados_pacientes_lista:
        print("Erro: A planilha parece estar vazia.")
        exit()
        
    df_pacientes = pd.DataFrame(dados_pacientes_lista)
    # Gspread pode ler colunas vazias como ''. Substituir por NaN para tratamento numérico
    df_pacientes.replace('', np.nan, inplace=True) 
    print(f"Dados carregados com sucesso ({len(df_pacientes)} pacientes).")
    
    headers_originais = worksheet.row_values(1) 
    
except gspread.exceptions.SpreadsheetNotFound:
    print(f"Erro: Planilha com ID '{PLANILHA_ID}' não encontrada.")
    print("Verifique se o ID está correto e se a conta de serviço tem permissão.")
    exit()
except gspread.exceptions.WorksheetNotFound:
    print(f"Erro: Aba '{NOME_ABA}' não encontrada na planilha.")
    exit()
except Exception as e:
    print(f"Erro ao carregar dados da planilha: {e}")
    exit()

# --- Carregar Modelo e Artefatos de Pré-processamento ---
print(f"Carregando modelo e artefatos de pré-processamento...")
try:
    modelo = joblib.load(MODELO_PATH)
    features_necessarias = joblib.load(FEATURES_PATH)
    scaler = joblib.load(SCALER_PATH)                     # <-- ADICIONADO
    numeric_feature_names = joblib.load(NUMERIC_FEATURES_PATH) # <-- ADICIONADO
    print("Modelo e artefatos carregados.")
except FileNotFoundError as e:
    print(f"Erro: Arquivo não encontrado ({e}).")
    print("Certifique-se que modelo_rf_v1.joblib, features_v1.joblib, scaler_v1.joblib e numeric_features_v1.joblib estão na raiz.")
    exit()
except Exception as e:
    print(f"Erro ao carregar artefatos: {e}")
    exit()

# --- Preparar Dados para o Modelo (Baseado em prever_novos_pacientes.py) ---
print("Preparando dados para o modelo...")
df_processado = df_pacientes.copy()

# 0. Garantir tipos corretos ANTES da engenharia/conversão
# Colunas que deveriam ser numéricas (exceto S/N e sexo por enquanto)
colunas_para_num = [col for col in df_processado.columns if col not in ['id', 'nome', 'sobrenome', 'sexo'] and not col.endswith('_s_n')]
for col in colunas_para_num:
     df_processado[col] = pd.to_numeric(df_processado[col], errors='coerce')

# 1. Converter 'sexo' (como em prever_novos_pacientes.py)
if 'sexo' in df_processado.columns:
    print("Convertendo coluna 'sexo' (M=0, F=1)...")
    df_processado['sexo'] = df_processado['sexo'].map({'M': 0, 'F': 1, 'm': 0, 'f': 1}).astype(float) # Garante float e trata minúsculas
    # Se houver outros valores ou NaN, serão convertidos para NaN aqui, tratados depois.
else:
     # Verificar se 'sexo' é uma feature necessária pelo modelo
     if 'sexo' in features_necessarias:
          print("Aviso: A coluna 'sexo' é necessária para o modelo mas não foi encontrada na planilha.")
          # Você pode decidir parar (exit()) ou tentar continuar (pode dar erro depois)

# 2. Converter colunas '_s_n' (Sim/Não) para numérico (1/0)
colunas_sn = [col for col in df_processado.columns if col.endswith('_s_n')]
print(f"Convertendo colunas Sim/Não: {colunas_sn}")
for col in colunas_sn:
    # Trata 's', 'S', 'sim', 'Sim' como 1, todo o resto (incluindo NaN/vazio) como 0
    df_processado[col] = df_processado[col].apply(lambda x: 1 if str(x).strip().lower() in ['s', 'sim'] else 0).astype(float)

# 3. Engenharia de Features (como em prever_novos_pacientes.py)
print("Aplicando engenharia de features...")
try:
    df_processado['pressao_pico_media'] = df_processado[['pressao_pico_esq_kpa', 'pressao_pico_dir_kpa']].mean(axis=1)
    df_processado['pressao_assimetria_kpa'] = (df_processado['pressao_pico_esq_kpa'] - df_processado['pressao_pico_dir_kpa']).abs()
    df_processado['pressao_integral_media'] = df_processado[['pressao_integral_esq_kpa_s', 'pressao_integral_dir_kpa_s']].mean(axis=1)
    df_processado['temperatura_media'] = df_processado[['temperatura_esq_c', 'temperatura_dir_c']].mean(axis=1)
    df_processado['umidade_media'] = df_processado[['umidade_esq_perc', 'umidade_dir_perc']].mean(axis=1)
except KeyError as e:
    print(f"Erro na engenharia de features: Coluna {e} não encontrada.")
    print("Verifique se as colunas de pressão, temperatura e umidade existem na planilha.")
    exit()

# 4. Tratar valores ausentes (NaN) - Estratégia: Imputação com a mediana
#    Deve ser feito DEPOIS da engenharia e conversões, caso elas gerem NaNs
print("Tratando valores ausentes (NaN) com a mediana...")
cols_com_nan_antes = df_processado.columns[df_processado.isnull().any()].tolist()
if cols_com_nan_antes:
    print(f"Colunas com valores ausentes antes da imputação: {cols_com_nan_antes}")
    # Calcula a mediana apenas para colunas numéricas que realmente existem no df_processado
    medianas = df_processado.select_dtypes(include=np.number).median()
    df_processado.fillna(medianas, inplace=True)
    # Verifica se ainda há NaNs (pode acontecer se uma coluna não numérica tiver NaN ou se uma numérica só tiver NaNs)
    cols_com_nan_depois = df_processado.columns[df_processado.isnull().any()].tolist()
    if cols_com_nan_depois:
         print(f"Aviso: Ainda existem valores ausentes após imputação com mediana nas colunas: {cols_com_nan_depois}. Preenchendo com 0.")
         # Como último recurso, preenche com 0 (ou outra estratégia se preferir)
         df_processado.fillna(0, inplace=True)
    else:
         print("Valores ausentes preenchidos com mediana.")
else:
    print("Nenhum valor ausente encontrado.")

# 5. Selecionar e ordenar as features EXATAMENTE como no treino
print(f"Selecionando e ordenando as features: {features_necessarias}")
try:
    # Garante que só pegamos colunas que existem APÓS todo o processamento
    features_presentes = [f for f in features_necessarias if f in df_processado.columns]
    if len(features_presentes) != len(features_necessarias):
         ausentes = set(features_necessarias) - set(features_presentes)
         print(f"Erro Crítico: Features necessárias para o modelo estão faltando APÓS pré-processamento: {ausentes}")
         exit()
    
    df_features_final = df_processado[features_necessarias]
except KeyError as e:
    print(f"Erro Crítico: Coluna necessária '{e}' não encontrada após pré-processamento.")
    exit()

# 6. Aplicar o SCALER CARREGADO usando a lista EXATA carregada
print(f"Aplicando scaler nas colunas numéricas: {numeric_feature_names}")
try:
    # Garante que só tentamos escalar colunas que existem E estão na lista numérica
    numeric_features_presentes = [f for f in numeric_feature_names if f in df_features_final.columns]
    if len(numeric_features_presentes) != len(numeric_feature_names):
         ausentes = set(numeric_feature_names) - set(numeric_features_presentes)
         print(f"Aviso: Features numéricas esperadas pelo scaler não foram encontradas: {ausentes}. Ignorando-as no scaling.")
    
    if numeric_features_presentes: # Só aplica se houver colunas numéricas a escalar
        df_features_final[numeric_features_presentes] = scaler.transform(df_features_final[numeric_features_presentes]) 
        print("Scaling aplicado.")
    else:
        print("Nenhuma coluna numérica encontrada para aplicar o scaler.")

except ValueError as e:
    print(f"Erro ao aplicar o scaler: {e}")
    print("Verifique se as colunas em 'numeric_features_v1.joblib' correspondem às colunas numéricas usadas no treino.")
    exit()
except Exception as e:
    print(f"Erro inesperado durante a aplicação do scaler: {e}")
    exit()

print("Dados preparados.")

# --- Fazer Previsões ---
print("Calculando probabilidades de risco com o modelo...")
try:
    probabilidades_risco = modelo.predict_proba(df_features_final)[:, 1]
    print("Cálculo concluído.")
except Exception as e:
    print(f"Erro durante a predição: {e}")
    exit()

# --- Adicionar Resultados à Planilha ---
print(f"Adicionando/Atualizando coluna '{NOVA_COLUNA_RISCO}' na planilha...")

# Verifica se a coluna já existe para atualizar ou adicionar
if NOVA_COLUNA_RISCO in headers_originais:
    indice_nova_coluna = headers_originais.index(NOVA_COLUNA_RISCO) + 1
    print(f"Coluna '{NOVA_COLUNA_RISCO}' já existe (coluna {rowcol_to_a1(1, indice_nova_coluna)[:-1]}). Atualizando valores.")
else:
    indice_nova_coluna = len(headers_originais) + 1
    print(f"Coluna '{NOVA_COLUNA_RISCO}' não encontrada. Adicionando na coluna {rowcol_to_a1(1, indice_nova_coluna)[:-1]}.")
    try:
        worksheet.update_cell(1, indice_nova_coluna, NOVA_COLUNA_RISCO)
        print("Cabeçalho adicionado.")
    except Exception as e:
        print(f"Erro ao adicionar cabeçalho: {e}")
        exit()

letra_nova_coluna = rowcol_to_a1(1, indice_nova_coluna)[:-1] 

try:
    valores_para_atualizar = [[p] for p in probabilidades_risco] 
    range_para_atualizar = f'{letra_nova_coluna}2:{letra_nova_coluna}{len(df_pacientes) + 1}'
    
    worksheet.update(range_para_atualizar, valores_para_atualizar, value_input_option='USER_ENTERED')
    
    print(f"Coluna '{letra_nova_coluna}' atualizada com os riscos calculados.")
    print("Script concluído com sucesso!")

except Exception as e:
    print(f"Erro ao atualizar a planilha: {e}")
    print("Verifique as permissões da conta de serviço na planilha (precisa de edição).")
# analise_modelagem_v3.py
# Script atualizado para o gerador de pacientes v3 (baseado na literatura)

import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, f1_score, roc_auc_score, confusion_matrix
import numpy as np
import joblib

# --- 1. Carregamento dos Dados ---
try:
    df_500 = pd.read_csv("pacientes_simulados_v3_literatura.csv", sep=';', decimal=',')
    df_1000 = pd.read_csv("novos_1000_pacientes.csv", sep=';', decimal=',')
    # Combina os dois DataFrames
    df = pd.concat([df_500, df_1000], ignore_index=True)
    print(f"Dados combinados com sucesso: {df.shape[0]} pacientes e {df.shape[1]} colunas.") # Total 1500
except FileNotFoundError as e:
    print(f"Erro: Arquivo não encontrado - {e}")
    print("Certifique-se que ambos os arquivos CSV existem.")
    exit()
except Exception as e:
     print(f"Erro ao carregar ou concatenar arquivos: {e}")
     exit()

print(f"Dados carregados com sucesso: {df.shape[0]} pacientes e {df.shape[1]} colunas.")

# --- 2. Pré-processamento e Engenharia de Features ---

# Converter 'sexo' para numérico
df['sexo'] = df['sexo'].map({'M': 0, 'F': 1})

# Engenharia de Features: Criar médias e assimetrias
# A literatura sugere que a assimetria (diferença entre pés) é um forte preditor.
# A média pode reduzir o ruído e a dimensionalidade.

# Média dos Picos de Pressão
df['pressao_pico_media'] = df[['pressao_pico_esq_kpa', 'pressao_pico_dir_kpa']].mean(axis=1)
# Assimetria de Pressão (Absoluta)
df['pressao_assimetria_kpa'] = (df['pressao_pico_esq_kpa'] - df['pressao_pico_dir_kpa']).abs()
# Média da Integral Pressão-Tempo (PTI)
df['pressao_integral_media'] = df[['pressao_integral_esq_kpa_s', 'pressao_integral_dir_kpa_s']].mean(axis=1)
# Média da Temperatura
df['temperatura_media'] = df[['temperatura_esq_c', 'temperatura_dir_c']].mean(axis=1)
# Média da Umidade
df['umidade_media'] = df[['umidade_esq_perc', 'umidade_dir_perc']].mean(axis=1)

# --- 3. Análise Exploratória (Atualizada) ---

# Descrever as features de sensores mais relevantes
print("\n--- Estatísticas dos Sensores (Dados Brutos) ---")
sensor_features_v3 = [
    'pressao_pico_media', 'pressao_assimetria_kpa', 'pressao_integral_media',
    'temperatura_media', 'temp_assimetria_c', 'velocidade_marcha_m_s'
]
print(df[sensor_features_v3].describe().to_markdown(floatfmt=".2f"))

# Plotar a distribuição da Assimetria de Temperatura (um preditor chave)
sns.histplot(data=df, x='temp_assimetria_c', hue='risco_ulcera_calc', kde=True, multiple="stack")
plt.axvline(x=2.2, color='red', linestyle='--', label='Limiar Crítico (2.2°C)')
plt.legend()
plt.title('Distribuição da Assimetria de Temperatura por Risco')
plt.show()

# --- 4. Preparação para Modelagem ---

# Lidar com valores ausentes (embora o script de geração não crie NaNs, é uma boa prática)
df.fillna(df.median(numeric_only=True), inplace=True)

# Definir features numéricas (para escalar) e categóricas (já são 0/1)
features_num = [
    'idade', 'tempo_diabetes_anos', 'hba1c_perc', 'imc', 'velocidade_marcha_m_s',
    
    # Features UMI adicionadas
    'contagem_passos', 'aceleracao_vertical_rms', 'orientacao_pe_graus',
    
    # Features de engenharia existentes
    'pressao_pico_media', 'pressao_integral_media',
    'temperatura_media', 'temp_assimetria_c', 'umidade_media',
    'pressao_assimetria_kpa'
]

features_cat = [
    'sexo', 'neuropatia_s_n', 'deformidade_s_n', 'ulcera_previa_s_n',
    'amputacao_previa_s_n', 'dap_s_n', 'retinopatia_s_n', 'nefropatia_s_n',
    'has_s_n', 'tabagismo_s_n', 'alcool_s_n', 'atividade_fisica_s_n'
]

# Escalar apenas as features numéricas
scaler = StandardScaler()
df[features_num] = scaler.fit_transform(df[features_num])
print("\nFeatures numéricas escaladas com StandardScaler.")

# Definir colunas a remover para criar X
colunas_remover = [
    'id', 'nome', 'sobrenome',
    # Remover colunas originais de sensores que foram substituídas por features de engenharia
    'pressao_pico_esq_kpa', 'pressao_pico_dir_kpa', 
    'pressao_integral_esq_kpa_s', 'pressao_integral_dir_kpa_s',
    'temperatura_esq_c', 'temperatura_dir_c', 
    'umidade_esq_perc', 'umidade_dir_perc'
]

# Definir X (features) e y (target)
target = 'risco_ulcera_calc'
X = df.drop(columns=colunas_remover + [target])
y = df[target]

print(f"\nFeatures (X) prontas para o modelo ({X.shape[1]} colunas):")
print(X.columns.to_list())
print(f"\nTarget (y): {target}")

# --- 5. Treinamento e Avaliação do Modelo ---

# Split (Treino 70%, Teste 30%)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)

print(f"\nDados divididos: {len(y_train)} para treino, {len(y_test)} para teste.")
print(f"Distribuição do target no treino (antes SMOTE): \n{y_train.value_counts(normalize=True)}")

# Balanceamento de Classes (SMOTE) apenas no treino
smote = SMOTE(random_state=42)
X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)

print(f"\nDistribuição do target no treino (depois SMOTE): \n{y_train_bal.value_counts(normalize=True)}")

# Modelo: Random Forest Classifier
rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1, max_depth=10)
rf.fit(X_train_bal, y_train_bal)

# --- 6. Resultados ---

print("\n" + "="*30)
print("AVALIAÇÃO NO TREINO (BALANCEADO)")
print("="*30)
y_train_pred = rf.predict(X_train_bal)
y_train_proba = rf.predict_proba(X_train_bal)[:, 1]
print(classification_report(y_train_bal, y_train_pred))
print(f'F1 treino:    {f1_score(y_train_bal, y_train_pred):.4f}')
print(f'ROC AUC treino: {roc_auc_score(y_train_bal, y_train_proba):.4f}')
print("Matriz de Confusão (Treino):")
print(confusion_matrix(y_train_bal, y_train_pred))

print("\n" + "="*30)
print("AVALIAÇÃO NO TESTE (DADOS REAIS)")
print("="*30)
y_test_pred = rf.predict(X_test)
y_test_proba = rf.predict_proba(X_test)[:, 1]
print(classification_report(y_test, y_test_pred))
print(f'F1 teste:    {f1_score(y_test, y_test_pred):.4f}')
print(f'ROC AUC teste: {roc_auc_score(y_test, y_test_proba):.4f}')
print("Matriz de Confusão (Teste):")
print(confusion_matrix(y_test, y_test_pred))

# Exibir Features Mais Importantes
print("\n" + "="*30)
print("FEATURES MAIS IMPORTANTES")
print("="*30)
feature_importances = pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False)
print(feature_importances.head(15).to_markdown(floatfmt=".4f"))

# --- ETAPA DE SALVAMENTO DO MODELO ---
print("\n" + "="*30)
print("SALVANDO O MODELO E ARTEFATOS...")
print("="*30)

# Salva o modelo treinado
joblib.dump(rf, 'modelo_rf_v1.joblib')

# Salva o scaler (ESSENCIAL para pré-processar novos dados)
joblib.dump(scaler, 'scaler_v1.joblib')

# Salva a lista de colunas (ESSENCIAL para garantir a ordem correta)
joblib.dump(X.columns, 'features_v1.joblib')
joblib.dump(features_num, 'numeric_features_v1.joblib')

print("Modelo, Scaler e Lista de Features salvos com sucesso!")
print("  - modelo_rf_v1.joblib")
print("  - scaler_v1.joblib")
print("  - features_v1.joblib")
print("  - numeric_features_v1.joblib")
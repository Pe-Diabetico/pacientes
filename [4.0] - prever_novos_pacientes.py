# prever_novos_pacientes.py

import pandas as pd
import joblib
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# --- 1. Carregar Artefatos Salvos ---
try:
    model = joblib.load('modelo_rf_v1.joblib')
    scaler = joblib.load('scaler_v1.joblib')
    feature_names = joblib.load('features_v1.joblib')
    numeric_feature_names = joblib.load('numeric_features_v1.joblib') # ADICIONAR ESTA LINHA
    print("Modelo, Scaler, Lista de Features e Lista de Features Numéricas carregados com sucesso.")
except FileNotFoundError as e:
    print(f"Erro: Não foi possível carregar os artefatos salvos ({e}).")
    # ...(resto do bloco try/except)
    print("Certifique-se de que os arquivos ... e 'numeric_features_v1.joblib' estão no mesmo diretório.") # AJUSTAR MENSAGEM
    exit()

# --- 2. Carregar Novos Dados ---
file_path = "novos_100_pacientes.csv"
try:
    df_new = pd.read_csv(file_path, sep=';', decimal=',')
    print(f"\nArquivo '{file_path}' carregado com {df_new.shape[0]} novos pacientes.")
except FileNotFoundError:
    print(f"Erro: Arquivo '{file_path}' não encontrado.")
    print("Certifique-se de que o arquivo com os novos pacientes existe.")
    exit()

# Guardar IDs e nomes para referência
ids_nomes = df_new[['id', 'nome', 'sobrenome']].copy()

# --- 3. Pré-processamento dos Novos Dados ---
# Aplicar EXATAMENTE as mesmas etapas do script de treinamento

# Converter 'sexo'
df_new['sexo'] = df_new['sexo'].map({'M': 0, 'F': 1})

# Engenharia de Features
df_new['pressao_pico_media'] = df_new[['pressao_pico_esq_kpa', 'pressao_pico_dir_kpa']].mean(axis=1)
df_new['pressao_assimetria_kpa'] = (df_new['pressao_pico_esq_kpa'] - df_new['pressao_pico_dir_kpa']).abs()
df_new['pressao_integral_media'] = df_new[['pressao_integral_esq_kpa_s', 'pressao_integral_dir_kpa_s']].mean(axis=1)
df_new['temperatura_media'] = df_new[['temperatura_esq_c', 'temperatura_dir_c']].mean(axis=1)
df_new['umidade_media'] = df_new[['umidade_esq_perc', 'umidade_dir_perc']].mean(axis=1)

# Lidar com possíveis valores ausentes (usar mediana, embora improvável aqui)
df_new.fillna(df_new.median(numeric_only=True), inplace=True)

# Separar target real
target = 'risco_ulcera_calc'
y_new_true = df_new[target]

# Selecionar e ordenar as features EXATAMENTE como no treino
try:
    X_new = df_new[feature_names]
except KeyError as e:
    print(f"Erro: Coluna necessária '{e}' não encontrada nos novos dados.")
    print("Verifique se o arquivo CSV contém todas as colunas esperadas pelo modelo.")
    exit()

# Aplicar o SCALER CARREGADO usando a lista EXATA carregada
try:
    # USA a lista carregada 'numeric_feature_names' diretamente
    X_new[numeric_feature_names] = scaler.transform(X_new[numeric_feature_names]) # MODIFICAR ESTA LINHA
    print("\nNovos dados pré-processados e escalados usando o scaler carregado.")
except ValueError as e:
    print(f"Erro ao aplicar o scaler: {e}")
    print("Isso pode ocorrer se o número de features numéricas nos novos dados não corresponder ao esperado pelo scaler.")
    exit()
except Exception as e:
    print(f"Erro inesperado durante a aplicação do scaler: {e}")
    exit()

# --- 4. Fazer Previsões ---
y_new_pred = model.predict(X_new)
y_new_proba = model.predict_proba(X_new)[:, 1] # Probabilidade de ser classe 1 (Alto Risco)

print("\nPrevisões realizadas nos novos dados.")

# --- 5. Avaliar e Mostrar Resultados ---

print("\n" + "="*30)
print("AVALIAÇÃO NOS NOVOS 100 PACIENTES")
print("="*30)

# Métricas gerais
print(classification_report(y_new_true, y_new_pred))
print(f"Acurácia: {accuracy_score(y_new_true, y_new_pred):.4f}")
print("Matriz de Confusão:")
print(confusion_matrix(y_new_true, y_new_pred))

# Adicionar previsões ao DataFrame para análise
results_df = ids_nomes.copy()
results_df['Risco_Real'] = y_new_true
results_df['Risco_Previsto'] = y_new_pred
results_df['Prob_Alto_Risco'] = y_new_proba
results_df['Acertou'] = (results_df['Risco_Real'] == results_df['Risco_Previsto'])

print("\n--- Detalhes das Previsões ---")
print(results_df.head().to_markdown(index=False)) # Mostra os 5 primeiros

# Mostrar pacientes classificados incorretamente
erros = results_df[results_df['Acertou'] == False]
if not erros.empty:
    print("\n--- Pacientes Classificados Incorretamente ---")
    print(erros.to_markdown(index=False))
else:
    print("\n--- Todos os pacientes foram classificados corretamente! ---")

# Opcional: Salvar resultados em um novo CSV
# results_df.to_csv("resultados_previsao_100_pacientes.csv", index=False, sep=';', decimal=',')
# print("\nResultados detalhados salvos em 'resultados_previsao_100_pacientes.csv'")
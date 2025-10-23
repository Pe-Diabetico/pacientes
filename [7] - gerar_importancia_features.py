import joblib
import matplotlib.pyplot as plt
import os
import pandas as pd

# Caminhos
MODELO_PATH = "modelo_rf_v1.joblib"
FEATURES_PATH = "features_v1.joblib"
OUTPUT_PATH = os.path.join("docs", "features_importance.png")

# Criar pasta docs se não existir
os.makedirs("docs", exist_ok=True)

# Carregar modelo e lista de features
modelo = joblib.load(MODELO_PATH)
features = joblib.load(FEATURES_PATH)

# Verificar se o modelo possui atributo de importância
if not hasattr(modelo, "feature_importances_"):
    raise AttributeError("O modelo carregado não possui atributo 'feature_importances_'.")

# Obter importâncias e ordenar
importances = modelo.feature_importances_
df_import = pd.DataFrame({
    "Feature": features,
    "Importância": importances
}).sort_values("Importância", ascending=True)

# Plot
plt.figure(figsize=(10, 12))
plt.barh(df_import["Feature"], df_import["Importância"])
plt.xlabel("Importância")
plt.ylabel("Feature")
plt.title("Importância das Features - Modelo Random Forest v1")
plt.tight_layout()

# Salvar gráfico
plt.savefig(OUTPUT_PATH, dpi=300)
plt.close()

print(f"✅ Gráfico de importância salvo em: {OUTPUT_PATH}")

import os
import gspread
import pandas as pd
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials

# Carregar variáveis do .env
load_dotenv()

# Configurações
SHEET_ID = os.getenv("SHEET_ID")                  # ID da planilha
SHEET_NAME = "Pacientes_reais"                    # Nome da aba no Google Sheets
OUTPUT_CSV = os.getenv("PACIENTES_REAIS")         # Caminho para salvar o CSV
CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS") # Caminho das credenciais

# Escopos necessários para leitura do Sheets
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

# Autenticação via Service Account
creds = Credentials.from_service_account_file(CREDENTIALS_PATH, scopes=SCOPES)
client = gspread.authorize(creds)

# Ler aba Pacientes_reais da planilha
sheet = client.open_by_key(SHEET_ID)
worksheet = sheet.worksheet(SHEET_NAME)
data = worksheet.get_all_records()

# Converter em DataFrame e salvar CSV
df = pd.DataFrame(data)
df.to_csv(OUTPUT_CSV, index=False, sep=";", decimal=",")

print(f" '{OUTPUT_CSV}' salvo com {len(df)} linhas da aba '{SHEET_NAME}'.")

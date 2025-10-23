import os
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

# Configurações do ambiente
SHEET_ID = os.getenv("SHEET_ID")  # ID da planilha
SHEET_NAME = "Pacientes_simulados"          # Nome da aba
CSV_PATH = os.getenv("PACIENTES_SIMULADOS")  # CSV local
CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS")  # Caminho das credenciais Google

# Escopos necessários para editar planilhas e acessar Drive
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

# Autenticação via Service Account
creds = Credentials.from_service_account_file(CREDENTIALS_PATH, scopes=SCOPES)
client = gspread.authorize(creds)

# Ler o CSV local
df = pd.read_csv(CSV_PATH, sep=";", decimal=",")

# Abrir planilha e aba
sheet = client.open_by_key(SHEET_ID)
worksheet = sheet.worksheet(SHEET_NAME)

# Limpar dados antigos
worksheet.clear()

# Enviar cabeçalho + dados
worksheet.update([df.columns.values.tolist()] + df.values.tolist())

print(f"{len(df)} pacientes enviados para a aba '{SHEET_NAME}' da planilha.")

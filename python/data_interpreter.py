import pandas as pd
from gpt4all import GPT4All
from pathlib import Path

CSV_PATH = r"C:\Users\User\Downloads\2020_OrcamentoDespesa\2020_OrcamentoDespesa.csv"

# --- Inicialização segura do modelo local ---
MODEL_PATH = Path.home() / "AppData" / "Local" / "nomic.ai" / "GPT4All"
MODEL_NAME = "Nous-Hermes-2-Mistral-7B-DPO.Q4_0.gguf"

try:
    model = GPT4All(MODEL_NAME, model_path=MODEL_PATH, allow_download=False, device="cpu")
except Exception as e:
    print(f"Erro ao carregar o modelo local: {e}")
    model = None


def answer_with_ai(question):
    print(f"DEBUG -> Pergunta recebida: {question}")

    try:
        df = pd.read_csv(
            CSV_PATH,
            sep=";",              # usa separador correto
            encoding="latin-1",   # evita erro UTF-8
            on_bad_lines="skip",  # ignora linhas corrompidas
            engine="python"
        )

        print(f"DEBUG -> Linhas totais no CSV: {len(df)}")

        # Cria uma resposta básica de busca textual
        relevant_rows = df[df.apply(lambda row: row.astype(str).str.contains(question, case=False).any(), axis=1)]

        print(f"DEBUG -> Linhas relevantes encontradas: {len(relevant_rows)}")

        if relevant_rows.empty:
            context = "Nenhuma informação correspondente encontrada no CSV."
        else:
            context = relevant_rows.to_string(index=False)[:5000]  # limita o contexto para não travar o modelo

        if model is None:
            print("DEBUG -> Modelo não foi carregado.")
            return {"success": False, "error": "Modelo local não foi carregado."}

        prompt = (
            f"Base de dados:\n{context}\n\n"
            f"Pergunta: {question}\n\n"
            "Responda de forma objetiva com base nos dados acima."
        )

        print("DEBUG -> Enviando prompt para o modelo local...")
        response = model.generate(prompt, max_tokens=250)
        print(f"DEBUG -> Resposta do modelo: {response[:300]}")  # mostra parte da resposta

        return {"success": True, "answer": response.strip()}

    except Exception as e:
        print(f"DEBUG -> Exceção capturada: {e}")
        return {"success": False, "error": str(e)}

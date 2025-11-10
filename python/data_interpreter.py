import pandas as pd
from gpt4all import GPT4All
from pathlib import Path
import re

CSV_PATH = r"C:\Users\User\Downloads\2020_OrcamentoDespesa\2020_OrcamentoDespesa.csv"

# Caminho do modelo
MODEL_PATH = Path.home() / "AppData" / "Local" / "nomic.ai" / "GPT4All"
MODEL_NAME = "Nous-Hermes-2-Mistral-7B-DPO.Q4_0.gguf"

try:
    model = GPT4All(MODEL_NAME, model_path=MODEL_PATH, allow_download=False, device="cpu")
except Exception as e:
    print(f"Erro ao carregar o modelo local: {e}")
    model = None


def extract_keywords(question):
    """Extrai palavras-chave relevantes da pergunta."""
    stopwords = {"o", "a", "os", "as", "de", "da", "do", "em", "no", "na", "quanto", "foi", "qual", "que", "um", "uma"}
    words = re.findall(r"\b\w+\b", question.lower())
    keywords = [w for w in words if w not in stopwords and len(w) > 2]
    return keywords


def answer_with_ai(question):
    print(f"DEBUG -> Pergunta recebida: {question}")

    try:
        df = pd.read_csv(CSV_PATH, sep=";", encoding="latin-1", on_bad_lines="skip", engine="python")
        print(f"DEBUG -> Linhas totais no CSV: {len(df)}")

        # Extrair palavras-chave
        keywords = extract_keywords(question)
        print(f"DEBUG -> Palavras-chave extraídas: {keywords}")

        if not keywords:
            return {"success": False, "error": "Nenhuma palavra-chave útil encontrada."}

        # Busca aproximada
        mask = df.apply(lambda row: any(
            kw in row.astype(str).str.lower().to_string() for kw in keywords
        ), axis=1)

        relevant_rows = df[mask]
        print(f"DEBUG -> Linhas relevantes encontradas: {len(relevant_rows)}")

        if relevant_rows.empty:
            context = "Nenhuma informação correspondente encontrada no CSV."
        else:
            # Limita a quantidade de linhas (ex: 10 primeiras relevantes)
            context = relevant_rows.head(10).to_string(index=False)

        if model is None:
            return {"success": False, "error": "Modelo local não foi carregado."}

        # Evita prompts longos demais (reduz o texto se necessário)
        if len(context) > 4000:
            context = context[:4000] + "\n[Texto truncado para caber no limite do modelo]"

        prompt = (
            f"Você é um assistente de dados. Analise as informações abaixo e responda de forma direta e explicativa.\n\n"
            f"Pergunta: {question}\n\n"
            f"Trechos relevantes dos dados:\n"
            f"{context}\n\n"
            f"Com base nesses dados, elabore uma resposta:"
        )

        print("DEBUG -> Enviando prompt para o modelo local...")
        response = model.generate(prompt, max_tokens=250)
        print(f"DEBUG -> Resposta do modelo: {response[:200]}...")

        return {"success": True, "answer": response.strip()}

    except Exception as e:
        print(f"DEBUG -> Exceção capturada: {e}")
        return {"success": False, "error": str(e)}

import pandas as pd
import os
import json
import chardet
from openai import OpenAI

os.environ["OPENAI_API_KEY"] = "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"

client = OpenAI()


def answer_with_ai(question, csv_path):
    # Detectar a codificação automaticamente
    with open(csv_path, "rb") as f:
        result = chardet.detect(f.read(50000))
    encoding = result["encoding"] or "utf-8"

    df = pd.read_csv(csv_path, encoding=encoding, sep=";")


    # Converte parte dos dados para texto legível
    # (evita mandar o CSV inteiro para a IA, o que seria caro)
    amostra = df.head(50).to_dict(orient="records")

    # Cria o contexto que a IA vai ler
    contexto = (
        "Você é uma IA especialista em finanças públicas.\n"
        "Responda perguntas sobre o orçamento com base nestes dados.\n"
        "Aqui está uma amostra dos registros do arquivo CSV:\n\n"
        f"{json.dumps(amostra, ensure_ascii=False, indent=2)}\n\n"
        "Agora, com base nesses dados, responda claramente à seguinte pergunta:\n"
        f"Pergunta: {question}"
    )

    # Envia para o modelo GPT interpretar
    resposta = client.chat.completions.create(
        model="gpt-4o-mini",  # pode usar outro modelo, ex: 'gpt-4-turbo'
        messages=[
            {"role": "system", "content": "Você é um assistente de análise de dados."},
            {"role": "user", "content": contexto}
        ],
        temperature=0.2
    )

    return {
        "success": True,
        "answer_text": resposta.choices[0].message.content.strip(),
        "language": "pt"
    }

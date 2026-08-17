from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

model = OllamaLLM(model="llama3.2")

template = """
You are an expert in answering questions about a pizza restaurant.

Here are some relevant reviews: {reviews}

Here is the question to answer: {question}
"""
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model


def ask(question: str) -> dict:
    reviews = retriever.invoke(question)
    answer = chain.invoke({"reviews": reviews, "question": question})
    sources = [
        {
            "content": doc.page_content,
            "rating": doc.metadata.get("rating"),
            "date": doc.metadata.get("date"),
        }
        for doc in reviews
    ]
    return {"answer": answer, "sources": sources}

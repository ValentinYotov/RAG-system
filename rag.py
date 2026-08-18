from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

model = OllamaLLM(model="llama3.2")

template = """
You are an expert in answering questions about a pizza restaurant.

Here are some relevant reviews: {reviews}

Here is the restaurant information: {restaurant}

Here is the menu: {menu}

Here is the question to answer: {question}
"""
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model


def _group_context(docs) -> tuple[str, str, str]:
    reviews = []
    restaurant = []
    menu = []

    for doc in docs:
        source = doc.metadata.get("source")
        if source == "menu":
            menu.append(doc.page_content)
        elif source == "restaurant":
            restaurant.append(doc.page_content)
        elif source == "reviews" or "rating" in doc.metadata:
            reviews.append(doc.page_content)

    return (
        "\n\n".join(reviews) or "No relevant reviews found.",
        "\n\n".join(restaurant) or "No relevant restaurant information found.",
        "\n\n".join(menu) or "No relevant menu items found.",
    )


def ask(question: str) -> dict:
    docs = retriever.invoke(question)
    reviews, restaurant, menu = _group_context(docs)
    answer = chain.invoke(
        {
            "reviews": reviews,
            "restaurant": restaurant,
            "menu": menu,
            "question": question,
        }
    )
    sources = [
        {
            "content": doc.page_content,
            "rating": doc.metadata.get("rating"),
            "date": doc.metadata.get("date"),
            "source": doc.metadata.get("source"),
        }
        for doc in docs
    ]
    return {"answer": answer, "sources": sources}

from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriver


model = OllamaLLM(model = "llama3.2")

template = """
You are an expert in answerting questions about a pizza restaurant

Here are some relevant reviews: {reviews}

Here is the question: {question}
"""

prompt = ChatPromptTemplate.from_template(template)

chain = prompt | model

while True:
    question = input("Ask a question about the pizza restaurant(q to quit): ")

    if question.lower() == "q":
        break
    reviews = retriver.invoke(question)
    result = chain.invoke({ "reviews": reviews, "question":question })
    print(result)
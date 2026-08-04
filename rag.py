"""
rag.py — Retrieval-Augmented Q&A over a meeting transcript.

Phase 1 (do once, slow):  transcript -> split -> embed -> store in Chroma
Phase 2 (repeat, cheap):  question -> retrieve nearest chunks -> Mistral answers
"""

import os

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Small, fast, CPU-friendly embedding model (~80 MB, downloaded once from HF Hub).
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def get_embeddings() -> HuggingFaceEmbeddings:
    """Local embedding model. Turns text into vectors. No API key needed."""
    return HuggingFaceEmbeddings(model_name=EMBED_MODEL)


def get_llm() -> ChatMistralAI:
    """The model that writes the answers. Needs MISTRAL_API_KEY."""
    return ChatMistralAI(
        model="mistral-small-latest",
        mistral_api_key=os.getenv("MISTRAL_API_KEY"),
        temperature=0.2,
    )


def build_vectorstore(transcript: str, job_id: str | None = None) -> Chroma:
    """Split the transcript, embed the pieces, load them into Chroma. Expensive: call once.

    Without a job_id (Streamlit path) the store is in-memory, as before.
    With a job_id (API path) the store is persisted to disk under a
    job-scoped collection name, so a later stateless HTTP request can
    reload it via load_vectorstore() instead of rebuilding it.
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = splitter.split_text(transcript)

    kwargs = {"collection_name": "meeting_transcript"}
    if job_id:
        kwargs["collection_name"] = f"meeting_{job_id}"
        kwargs["persist_directory"] = f"./chroma_db/{job_id}"

    vectorstore = Chroma.from_texts(
        texts=chunks,
        embedding=get_embeddings(),
        **kwargs,
    )
    return vectorstore


def load_vectorstore(job_id: str) -> Chroma:
    """Reload a previously persisted store for job_id (stateless HTTP path)."""
    return Chroma(
        collection_name=f"meeting_{job_id}",
        persist_directory=f"./chroma_db/{job_id}",
        embedding_function=get_embeddings(),
    )


def build_qa_chain(vectorstore: Chroma):
    """Wire retriever -> prompt -> Mistral -> string. Returns a chain you can .invoke()."""
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a meeting assistant. Answer the question using ONLY the meeting "
                "context provided below. If the answer is not in the context, say you don't "
                "know based on the transcript — do not make things up.\n\nContext:\n{context}",
            ),
            ("human", "{question}"),
        ]
    )

    def format_docs(docs) -> str:
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain


def answer_question(chain, question: str) -> str:
    return chain.invoke(question)

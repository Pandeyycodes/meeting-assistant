"""
app.py — Streamlit UI for the AI Meeting Assistant.
Run with:  streamlit run app.py
"""

import os
import time
from dotenv import load_dotenv
import streamlit as st

load_dotenv()

from audio_processor import download_youttube_audio, convert_to_wav, chunk_audio
from transcriber import transcribe_all
from Summerize import summarize, generate_title
from rag import build_vectorstore, build_qa_chain, answer_question
from exporter import export_txt, export_pdf

st.set_page_config(
    page_title="Meeting Assistant",
    page_icon="◆",
    layout="centered",
    initial_sidebar_state="expanded",
)

# ── Styling: minimal, neutral, one accent ─────────────────────────────────────
st.markdown(
    """
    <style>
    #MainMenu, footer, header {visibility: hidden;}
    .block-container {padding-top: 2.5rem; max-width: 860px;}
    html, body, [class*="css"] {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    h1 {font-weight: 660; letter-spacing: -0.025em; font-size: 2rem; margin-bottom: 0.2rem;}

    .stButton > button, .stDownloadButton > button {
        border-radius: 8px; font-weight: 550; box-shadow: none;
        border: 1px solid rgba(120,120,130,0.28);
        transition: border-color .15s ease, background .15s ease;
    }
    .stButton > button[kind="primary"] {
        background: #4f46e5; border-color: #4f46e5; color: #fff;
    }
    .stButton > button[kind="primary"]:hover { background: #4338ca; border-color: #4338ca; }
    .stDownloadButton > button:hover { border-color: #4f46e5; color: #4f46e5; }

    .stTabs [data-baseweb="tab-list"] { gap: 1.6rem; border-bottom: 1px solid rgba(120,120,130,0.18); }
    .stTabs [data-baseweb="tab"] { padding: 0.45rem 0; font-weight: 550; }
    .stTabs [aria-selected="true"] { color: #4f46e5; }

    [data-testid="stMetricValue"] { font-size: 1.35rem; font-weight: 650; }
    .muted { color: #6b7280; font-size: 0.92rem; }
    hr { margin: 1.4rem 0; border-color: rgba(120,120,130,0.16); }

    .empty {
        border: 1px dashed rgba(120,120,130,0.35);
        border-radius: 12px; padding: 2.6rem 2rem; text-align: center;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("Meeting Assistant")
st.markdown('<p class="muted">Transcribe a recording, summarize it, and ask questions about it.</p>',
            unsafe_allow_html=True)
st.markdown("<hr>", unsafe_allow_html=True)

for key in ("transcript", "summary", "title", "qa_chain"):
    st.session_state.setdefault(key, None)


def resolve_audio_path(youtube_url, uploaded_file):
    if youtube_url:
        return download_youttube_audio(youtube_url)
    if uploaded_file is not None:
        os.makedirs("uploads", exist_ok=True)
        path = os.path.join("uploads", uploaded_file.name)
        with open(path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        return path
    return None


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.subheader("Input")
    source = st.radio("Source", ["Upload file", "YouTube URL"])

    youtube_url, uploaded_file = None, None
    if source == "YouTube URL":
        youtube_url = st.text_input("YouTube URL", placeholder="https://...")
    else:
        uploaded_file = st.file_uploader("Audio file", type=["mp3", "wav", "m4a", "webm"])

    translate = st.checkbox("Translate to English")
    st.write("")
    process = st.button("Process", type="primary", use_container_width=True)

    st.write("")
    if os.getenv("MISTRAL_API_KEY"):
        st.caption("● API key detected")
    else:
        st.caption("⚠ MISTRAL_API_KEY not set — summary & Q&A will fail.")


# ── Processing: live progress bar updated between each step ────────────────────
if process:
    audio_path = resolve_audio_path(youtube_url, uploaded_file)
    if not audio_path:
        st.sidebar.error("Provide a file or URL first.")
    else:
        bar = st.progress(0.0)
        label = st.empty()
        try:
            label.markdown("**Converting audio** to 16 kHz mono WAV…")
            bar.progress(0.15)
            wav_path = convert_to_wav(audio_path, audio_path)

            label.markdown("**Splitting** audio into chunks…")
            bar.progress(0.30)
            chunks = chunk_audio(wav_path)

            label.markdown(f"**Transcribing** {len(chunks)} chunk(s) with Whisper… *(this is the slow step)*")
            bar.progress(0.45)
            transcript = transcribe_all(chunks, translate=translate)
            st.session_state.transcript = transcript

            label.markdown("**Summarizing** with Mistral…")
            bar.progress(0.75)
            st.session_state.summary = summarize(transcript)
            st.session_state.title = generate_title(transcript)

            label.markdown("**Building** the Q&A index…")
            bar.progress(0.90)
            vectorstore = build_vectorstore(transcript)
            st.session_state.qa_chain = build_qa_chain(vectorstore)

            bar.progress(1.0)
            label.markdown("**Done.**")
            time.sleep(0.4)
            bar.empty()
            label.empty()
        except Exception as e:
            bar.empty()
            label.empty()
            st.error(f"Something went wrong: {e}")


# ── Results ─────────────────────────────────────────────────────────────────
if st.session_state.transcript:
    st.subheader(st.session_state.title or "Meeting")

    words = len(st.session_state.transcript.split())
    mins = max(1, round(words / 130))  # ~130 wpm speaking estimate
    m1, m2, m3 = st.columns(3)
    m1.metric("Words", f"{words:,}")
    m2.metric("Est. length", f"~{mins} min")
    m3.metric("Q&A index", "Ready" if st.session_state.qa_chain else "—")

    st.write("")
    tab_summary, tab_transcript, tab_ask = st.tabs(["Summary", "Transcript", "Ask"])

    with tab_summary:
        st.markdown(st.session_state.summary or "_No summary available._")

    with tab_transcript:
        st.text_area("Transcript", st.session_state.transcript, height=440, label_visibility="collapsed")

    with tab_ask:
        st.markdown('<p class="muted">Answers come only from this transcript.</p>', unsafe_allow_html=True)
        question = st.text_input("Question", placeholder="What were the action items?",
                                 label_visibility="collapsed")
        if st.button("Ask") and question:
            if st.session_state.qa_chain is None:
                st.error("Q&A index isn't built. Re-process the meeting.")
            else:
                with st.spinner("Thinking…"):
                    answer = answer_question(st.session_state.qa_chain, question)
                st.markdown(answer)

    st.markdown("<hr>", unsafe_allow_html=True)
    st.markdown('<p class="muted">Export</p>', unsafe_allow_html=True)
    safe_name = (st.session_state.title or "meeting").replace(" ", "_")[:40]
    col1, col2 = st.columns(2)
    with col1:
        st.download_button("Download .txt",
                           data=export_txt(st.session_state.title or "Meeting",
                                           st.session_state.summary or "",
                                           st.session_state.transcript),
                           file_name=f"{safe_name}.txt", mime="text/plain",
                           use_container_width=True)
    with col2:
        st.download_button("Download .pdf",
                           data=export_pdf(st.session_state.title or "Meeting",
                                           st.session_state.summary or "",
                                           st.session_state.transcript),
                           file_name=f"{safe_name}.pdf", mime="application/pdf",
                           use_container_width=True)
else:
    st.markdown(
        '<div class="empty"><p class="muted" style="margin:0;">'
        'Upload a file or paste a YouTube URL in the sidebar, then press <b>Process</b>.'
        '</p></div>',
        unsafe_allow_html=True,
    )
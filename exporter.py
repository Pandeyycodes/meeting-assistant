"""
exporter.py — Save the meeting results as a .txt or .pdf file.

export_txt  -> returns a UTF-8 string (keeps all characters, incl. Hindi)
export_pdf  -> returns PDF bytes (English summary; see _sanitize note below)
"""

from fpdf import FPDF


def export_txt(title: str, summary: str, transcript: str) -> str:
    """Plain-text export. UTF-8, so it preserves any language."""
    return (
        f"{title}\n"
        f"{'=' * len(title)}\n\n"
        f"SUMMARY\n-------\n{summary}\n\n"
        f"FULL TRANSCRIPT\n---------------\n{transcript}\n"
    )


def _sanitize(text: str) -> str:
    """
    fpdf2's built-in fonts only support Latin-1. LLM output often contains
    smart quotes, em-dashes and bullets, so we swap those for ASCII equivalents
    and drop anything else that can't be encoded. (Devanagari/Hindi won't render
    in the PDF without adding a Unicode .ttf font — out of scope for this basic version.)
    """
    replacements = {
        "\u2022": "-",   # bullet
        "\u2013": "-",   # en dash
        "\u2014": "-",   # em dash
        "\u2018": "'", "\u2019": "'",   # curly single quotes
        "\u201c": '"', "\u201d": '"',   # curly double quotes
        "\u2026": "...",  # ellipsis
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return text.encode("latin-1", "replace").decode("latin-1")


def export_pdf(title: str, summary: str, transcript: str) -> bytes:
    """PDF export using fpdf2. Returns raw bytes ready for a download button."""
    pdf = FPDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.multi_cell(0, 10, _sanitize(title))
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 10, "Summary", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 6, _sanitize(summary))
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 10, "Full Transcript", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, _sanitize(transcript))

    return bytes(pdf.output())

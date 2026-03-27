from docx import Document
try:
    doc = Document("cs history.docx")
    text = '\n'.join([para.text for para in doc.paragraphs])
    with open("cs_history.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("SUCCESS")
except Exception as e:
    print("ERROR:", e)

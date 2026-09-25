from docx import Document

doc = Document('Capstone Proposal.docx')
for paragraph in doc.paragraphs:
    print(paragraph.text)

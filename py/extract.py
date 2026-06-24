import re
try:
    with open('tunnel.log', 'r', encoding='utf-16le', errors='ignore') as f:
        text = f.read()
except:
    with open('tunnel.log', 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
matches = re.findall(r'[a-zA-Z0-9-]+\.lhr\.life|[a-zA-Z0-9-]+\.localhost\.run', text)
print("EXTRACTED_URLS:", matches)

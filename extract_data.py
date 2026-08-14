import re

with open('db/GSandbox-pp_1-2026_07_29_18_23_56-dump.sql', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Find project_categories data
cat_match = re.search(r'COPY public\.project_categories.*?FROM stdin;\n(.*?)\n\\\.', content, re.DOTALL)
if cat_match:
    print("=== PROJECT CATEGORIES ===")
    print(cat_match.group(1)[:5000])

# Find projects data
proj_match = re.search(r'COPY public\.projects.*?FROM stdin;\n(.*?)\n\\\.', content, re.DOTALL)
if proj_match:
    print("\n=== PROJECTS ===")
    print(proj_match.group(1)[:10000])

# Find plans data
plans_match = re.search(r'COPY public\.plans.*?FROM stdin;\n(.*?)\n\\\.', content, re.DOTALL)
if plans_match:
    print("\n=== PLANS ===")
    print(plans_match.group(1)[:5000])
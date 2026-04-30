import re

def check_div_balance(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Remove strings and comments to avoid false positives
    content = re.sub(r'\'\'\'(.*?)\'\'\'', '', content, flags=re.DOTALL)
    content = re.sub(r'"""(.*?)"""', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    stack = []
    # Find all <div...>, <div.../>, or </div>
    tags = re.findall(r'<(/?div)([^>]*?)(/?)>', content)
    
    for tag_type, attrs, self_close in tags:
        if tag_type == 'div':
            if self_close == '/':
                # Self-closing
                continue
            else:
                stack.append('div')
        elif tag_type == '/div':
            if stack:
                stack.pop()
            else:
                print("Extra closing div found")
                
    print(f"Stack size at end: {len(stack)}")
    if stack:
        print(f"Unclosed divs count: {len(stack)}")

check_div_balance('/Users/sureshkumar/hack_block/src/components/DashboardView.jsx')

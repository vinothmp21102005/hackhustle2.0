import re

def check_div_balance(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 1
        # Find all <div or </div
        # This is a bit naive because of self-closing and attributes, but let's try
        
        # Matches <div (not followed by / or part of another tag name)
        open_tags = re.findall(r'<div(?![a-zA-Z0-9])', line)
        for _ in open_tags:
            # Check if it's self-closing on the same line
            if not re.search(r'<div[^>]*/>', line):
                stack.append(line_num)
        
        # Matches </div>
        close_tags = re.findall(r'</div\s*>', line)
        for _ in close_tags:
            if stack:
                stack.pop()
            else:
                print(f"Extra closing div at line {line_num}")
                
    if stack:
        print(f"Unclosed divs starting at lines: {stack}")
    else:
        print("All divs balanced (ignoring multi-line self-closing)")

check_div_balance('/Users/sureshkumar/hack_block/src/components/DashboardView.jsx')

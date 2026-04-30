
def check_balance(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    stack = []
    line_num = 1
    col_num = 1
    
    for i, char in enumerate(content):
        if char == '\n':
            line_num += 1
            col_num = 1
            continue
        
        if char == '{':
            stack.append(('{', line_num, col_num))
        elif char == '}':
            if not stack:
                print(f"Extra '}}' at {line_num}:{col_num}")
            else:
                top, l, c = stack.pop()
                if top != '{':
                    print(f"Mismatch: expected '{top}' (from {l}:{c}), found '}}' at {line_num}:{col_num}")
        
        elif char == '(':
            stack.append(('(', line_num, col_num))
        elif char == ')':
            if not stack:
                print(f"Extra ')' at {line_num}:{col_num}")
            else:
                top, l, c = stack.pop()
                if top != '(':
                    print(f"Mismatch: expected '{top}' (from {l}:{c}), found ')' at {line_num}:{col_num}")
        
        col_num += 1
    
    while stack:
        top, l, c = stack.pop()
        print(f"Unclosed '{top}' from {l}:{c}")

check_balance('/Users/sureshkumar/hack_block/src/components/DashboardView.jsx')

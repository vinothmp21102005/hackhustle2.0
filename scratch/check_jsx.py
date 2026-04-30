
import re

def check_jsx_balance(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Simple regex to find JSX tags, excluding self-closing ones and comments
    # This is a bit naive but should help find obvious div mismatches
    tags = re.findall(r'<(div|/div|tbody|/tbody|table|/table|tr|/tr|th|/th|td|/td|AreaChart|/AreaChart|ResponsiveContainer|/ResponsiveContainer|Area|/Area|LineChart|/LineChart|Line|/Line|XAxis|/XAxis|YAxis|/YAxis|CartesianGrid|/CartesianGrid|Tooltip|/Tooltip|defs|/defs|linearGradient|/linearGradient|stop|/stop)(?:\s+[^>]*)?(/?|)>', content)
    
    stack = []
    for tag_name, self_closing in tags:
        if self_closing == '/':
            # It's a self-closing tag like <div /> or <Area />
            # Wait, the regex captures the name and the slash.
            # Example: <div /> -> ('div', '/')
            # Example: <div> -> ('div', '')
            # Example: </div> -> ('/div', '')
            continue
        
        if tag_name.startswith('/'):
            # Closing tag
            actual_name = tag_name[1:]
            if not stack:
                print(f"Extra closing tag: </{actual_name}>")
            else:
                top = stack.pop()
                if top != actual_name:
                    print(f"Mismatch: expected </{top}>, found </{actual_name}>")
        else:
            # Opening tag
            stack.append(tag_name)
    
    while stack:
        top = stack.pop()
        print(f"Unclosed opening tag: <{top}>")

check_jsx_balance('/Users/sureshkumar/hack_block/src/components/DashboardView.jsx')

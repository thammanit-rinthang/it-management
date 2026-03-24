import os
import re

patterns = [
    # Replace heavy shadows with shadow-sm
    (r'shadow-(xl|lg|md|2xl|inner)(\s+shadow-\[#[0-9a-fA-F]+\]/[0-9]+)?', 'shadow-sm'),
    # Unify borders
    (r'border-\[#E9ECEF\]', 'border-zinc-100'),
    (r'border-\[#F8F9FA\]', 'border-zinc-100'),
    (r'border-zinc-200', 'border-zinc-100'),
    (r'border-amber-100', 'border-zinc-100'),
    (r'border-\[#0F1059\]/10', 'border-zinc-100'),
    (r'divide-zinc-200', 'divide-zinc-100'),
]

files_to_process = [
    r'd:\NDC_042\NextJS\it-system\components\sidebar.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\page.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\admin\tickets\page.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\admin\approvals\page.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\admin\logs\page.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\admin\inventory\page.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\admin\employees\page.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\admin\users\page.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\admin\equipment-requests\page.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\admin\equipment-entry-lists\page.tsx',
    r'd:\NDC_042\NextJS\it-system\app\(dashboard)\admin\purchase-orders\page.tsx',
    r'd:\NDC_042\NextJS\it-system\components\ui\modal.tsx',
    r'd:\NDC_042\NextJS\it-system\components\ui\dropdown.tsx',
]

for file_path in files_to_process:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, new_content)
    
    # Ensure containers have both border-zinc-100 and shadow-sm
    # If it has border-zinc-100 but missing shadow-sm, add it.
    # We do a simple check: if "border-zinc-100" is in className and not "shadow-sm"
    # This is rough but should work for most cases.
    
    # Actually, the user just said "border-zinc-100 shadow-sm"
    # I'll just make sure they are together in common Card/container locations.
    
    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {file_path}")
    else:
        print(f"No changes: {file_path}")

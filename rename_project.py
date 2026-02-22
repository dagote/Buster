#!/usr/bin/env python3
"""
Comprehensive project rename: Bitcino -> Buster
"""
import os

# Define replacements
replacements = [
    ('Bitcino', 'Buster'),
    ('bitcino', 'buster'),
    ('BitcinoBetEscrow', 'BusterGame'),
    ('bitcino-contract', 'buster-contract'),
    ('bitcino-frontend', 'buster-frontend'),
]

# Files to process
extensions = {'.md', '.py', '.js', '.json', '.sol', '.bat', '.ps1', '.txt', '.yml', '.yaml', '.env'}
skip_dirs = {'.git', '__pycache__', 'node_modules', 'artifacts', 'cache', 'build', 'dist', '.venv', 'venv'}

def process_files(directory):
    for root, dirs, files in os.walk(directory):
        # Skip certain directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions) or file == '.gitignore':
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    original = content
                    for old, new in replacements:
                        content = content.replace(old, new)
                    
                    if content != original:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"✅ {filepath}")
                except Exception as e:
                    pass

process_files('.')
print("\n✨ Project rename complete!")

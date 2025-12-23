#!/usr/bin/env python3
"""
Script to convert all remaining HTML templates to JS
Run this with: python3 TEMPLATE_CONVERSION_SCRIPT.py
"""
import os
import glob
import re

def escape_for_template_literal(content):
    """Escape content for JS template literal"""
    # Order matters: backslash first, then others
    content = content.replace('\\', '\\\\')
    content = content.replace('`', '\\`')
    content = content.replace('$', '\\$')
    return content

def convert_template(html_file):
    """Convert a single HTML template to JS"""
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    escaped_content = escape_for_template_literal(html_content)
    js_content = f'export default `{escaped_content}`;\n'
    
    js_file = html_file.replace('.html', '.js')
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    return js_file

def update_imports(html_file, js_file):
    """Update imports in JS files"""
    dir_name = os.path.dirname(html_file)
    html_name = os.path.basename(html_file)
    js_name = os.path.basename(js_file)
    
    # Find JS files in the same directory
    for js_import_file in glob.glob(f'{dir_name}/*.js'):
        if js_import_file == js_file:
            continue
            
        try:
            with open(js_import_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Update import statements
            old_import = f"from './{html_name}'"
            new_import = f"from './{js_name}'"
            
            if old_import in content:
                content = content.replace(old_import, new_import)
                with open(js_import_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  Updated import in: {js_import_file}")
        except Exception as e:
            print(f"  Warning: Could not update {js_import_file}: {e}")

def main():
    os.chdir('/Users/ryan/jellyfin-web')
    
    # Find all remaining .template.html files
    template_files = glob.glob('src/**/*.template.html', recursive=True)
    
    if not template_files:
        print("No template files found to convert!")
        return
    
    print(f"Found {len(template_files)} template files to convert\n")
    
    for html_file in sorted(template_files):
        print(f"Converting: {html_file}")
        
        try:
            js_file = convert_template(html_file)
            print(f"  Created: {js_file}")
            
            update_imports(html_file, js_file)
            
            os.remove(html_file)
            print(f"  Deleted: {html_file}")
            print()
            
        except Exception as e:
            print(f"  ERROR: {e}\n")
            continue
    
    print(f"\n✅ Conversion complete! Converted {len(template_files)} files.")
    print("\nNext steps:")
    print("1. Remove the HTML plugin from vite.config.ts")
    print("2. Run: npm run build")
    print("3. Test the application")

if __name__ == '__main__':
    main()


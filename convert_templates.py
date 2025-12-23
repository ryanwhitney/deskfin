#!/usr/bin/env python3
import os
import glob
import re

# Find all .template.html files
template_files = glob.glob('src/**/*.template.html', recursive=True)

print(f"Found {len(template_files)} template files to convert")

for html_file in template_files:
    # Read the HTML content
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Escape backslashes, backticks, and dollar signs for template literal
    escaped_content = html_content.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')
    
    # Create JS file content
    js_content = f'export default `{escaped_content}`;\n'
    
    # Write to .js file
    js_file = html_file.replace('.html', '.js')
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Converted: {html_file} -> {js_file}")
    
    # Find and update imports
    dir_name = os.path.dirname(html_file)
    base_name = os.path.basename(html_file)
    
    # Search for JS files that import this template
    for js_import_file in glob.glob(f'{dir_name}/**/*.js', recursive=True):
        if js_import_file == js_file:
            continue
        
        try:
            with open(js_import_file, 'r', encoding='utf-8') as f:
                js_import_content = f.read()
            
            # Replace the import
            old_import = f"from './{base_name}'"
            new_import = f"from './{base_name.replace('.html', '.js')}'"
            
            if old_import in js_import_content:
                updated_content = js_import_content.replace(old_import, new_import)
                with open(js_import_file, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                print(f"  Updated import in: {js_import_file}")
        except Exception as e:
            pass
    
    # Delete the old HTML file
    os.remove(html_file)
    print(f"  Deleted: {html_file}")

print(f"\nConversion complete! Converted {len(template_files)} files.")


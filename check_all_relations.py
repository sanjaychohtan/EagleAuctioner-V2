
import os
import re

entities_dir = './backend/src/main/java/com/eagleauctioner/entity/'
entities = [f for f in os.listdir(entities_dir) if f.endswith('.java')]

print(f"Scanned {len(entities)} files.")

entity_to_file = {}
entity_to_audited = {}
entity_content = {}

# Pass 1: Parse entities
for entity_file in entities:
    with open(os.path.join(entities_dir, entity_file), 'r') as f:
        content = f.read()
        entity_name = entity_file.replace('.java', '')
        entity_to_file[entity_name] = entity_file
        entity_to_audited[entity_name] = '@Audited' in content
        entity_content[entity_name] = content

# Print all audited entities
audited = [name for name, is_audited in entity_to_audited.items() if is_audited]
print(f"Audited entities ({len(audited)}): {sorted(audited)}")

# Pass 2: Check relations
report = []

for entity_name, is_audited in entity_to_audited.items():
    if not is_audited:
        continue
    
    content = entity_content[entity_name]
    
    # Improved regex to find relations
    # Matches @Annotation and then looks for private field
    # We'll split the content into fields to make it safer
    
    # Find all fields
    # Look for relation annotations
    # We'll use a more direct approach: find all occurrences of annotations + fields
    # We can use findall with re.DOTALL to find blocks like @Annotation ... private Type name;
    
    # Let's try a regex that matches the annotation block followed by the field
    # This is a bit complex. Let's simplify:
    # Find all lines, and if it's a field declaration, check previous lines for annotations.
    
    lines = content.splitlines()
    for i, line in enumerate(lines):
        if 'private' in line and ';' in line and 'static' not in line:
            # Check for relation annotations in previous lines (up to 3 lines up)
            has_relation_annotation = False
            for j in range(max(0, i-3), i):
                if '@OneToOne' in lines[j] or '@ManyToOne' in lines[j] or '@OneToMany' in lines[j] or '@ManyToMany' in lines[j]:
                    has_relation_annotation = True
                    break
            
            if has_relation_annotation:
                # Extract type and name
                match = re.search(r'private\s+(\w+)\s+(\w+);', line)
                if match:
                    target_type = match.group(1)
                    field_name = match.group(2)
                    
                    if target_type in entity_to_audited:
                        if not entity_to_audited[target_type]:
                            # Target not audited!
                            if f'@Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)' not in content:
                                report.append({
                                    "entity": entity_name,
                                    "field": field_name,
                                    "target": target_type,
                                    "file": entity_to_file[entity_name]
                                })

print("\nReport:")
print("Entity | Field | Target Entity | Target Audited? | Required Fix | File")
print("---|---|---|---|---|---")
for r in report:
    print(f"{r['entity']} | {r['field']} | {r['target']} | No | @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED) | {r['file']}")

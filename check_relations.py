
import os
import re

entities_dir = './backend/src/main/java/com/eagleauctioner/entity/'
entities = [f for f in os.listdir(entities_dir) if f.endswith('.java')]

entity_classes = set()
for entity_file in entities:
    with open(os.path.join(entities_dir, entity_file), 'r') as f:
        content = f.read()
        if '@Entity' in content:
            entity_classes.add(entity_file.replace('.java', ''))

audited_entities = set()
for entity_file in entities:
    with open(os.path.join(entities_dir, entity_file), 'r') as f:
        content = f.read()
        if '@Audited' in content:
            audited_entities.add(entity_file.replace('.java', ''))

print(f"Audited entities: {audited_entities}")

report = []
fixes = []

for entity_file in entities:
    entity_name = entity_file.replace('.java', '')
    if entity_name not in audited_entities:
        continue
        
    with open(os.path.join(entities_dir, entity_file), 'r') as f:
        content = f.read()
        
    # Find relations
    relations = re.findall(r'@(OneToOne|ManyToOne|OneToMany|ManyToMany).*private\s+(\w+)\s+(\w+);', content, re.DOTALL)
    
    for rel_type, target_entity, field_name in relations:
        # Check if target is an entity
        if target_entity in entity_classes:
            # Check if target is audited
            if target_entity not in audited_entities:
                # Check if it's already marked as NOT_AUDITED
                if f'@Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)' not in content:
                    report.append(f"{entity_name} -> {target_entity} ({rel_type})")
                    fixes.append((entity_file, target_entity, field_name))

print("\nReport:")
for line in report:
    print(line)

print("\nPotential fixes:")
for fix in fixes:
    print(fix)

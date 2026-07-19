#!/bin/bash
while read line; do
  table=$(echo "$line" | awk '{print $3}')
  column=$(echo "$line" | awk '{print $6}')
  
  # Search for the column in the CREATE TABLE or ALTER TABLE of that table in previous migrations
  res=$(grep -riE "(CREATE TABLE IF NOT EXISTS ${table} |ALTER TABLE ${table} .* ADD COLUMN .* ${column})" ./backend/src/main/resources/db/migration/V[1-9]*.sql ./backend/src/main/resources/db/migration/V1[0-7]*.sql -A 20 | grep -iE "\b${column}\b" | grep -iE "NUMERIC|DECIMAL")
  if [ -z "$res" ]; then
    echo "MISSING: $table . $column"
  else
    echo "FOUND: $table . $column"
  fi
done < <(grep -oP 'ALTER TABLE \w+ ALTER COLUMN \w+' ./backend/src/main/resources/db/migration/V18__money_architecture_alignment.sql)

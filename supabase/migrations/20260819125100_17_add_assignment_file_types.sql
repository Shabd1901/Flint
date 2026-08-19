ALTER TABLE assignments ADD COLUMN allowed_file_types TEXT[] DEFAULT '{pdf,csv,doc,md,xlsx}';

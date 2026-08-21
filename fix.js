const fs = require('fs');
let c = fs.readFileSync('supabase/migrations/COMPLETE_SCHEMA.sql', 'utf8');

c = c.replace('CREATE POLICY "Candidate access own exam_attempts" ON exam_attempts FOR ALL USING (candidate_id = auth.uid());',
'CREATE POLICY "Candidate select own exam_attempts" ON exam_attempts FOR SELECT USING (candidate_id = auth.uid());\nCREATE POLICY "Candidate insert own exam_attempts" ON exam_attempts FOR INSERT WITH CHECK (candidate_id = auth.uid());');

c = c.replace('CREATE POLICY "Candidate access own exam_answers" ON exam_answers FOR ALL USING (\r\n    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid())\r\n);',
'CREATE POLICY "Candidate select own exam_answers" ON exam_answers FOR SELECT USING (\r\n    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid())\r\n);\r\nCREATE POLICY "Candidate insert own exam_answers" ON exam_answers FOR INSERT WITH CHECK (\r\n    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid() AND exam_attempts.status = \'in_progress\')\r\n);\r\nCREATE POLICY "Candidate update own exam_answers" ON exam_answers FOR UPDATE USING (\r\n    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid() AND exam_attempts.status = \'in_progress\')\r\n);');

c = c.replace('CREATE POLICY "Candidate access own exam_answers" ON exam_answers FOR ALL USING (\n    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid())\n);',
'CREATE POLICY "Candidate select own exam_answers" ON exam_answers FOR SELECT USING (\n    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid())\n);\nCREATE POLICY "Candidate insert own exam_answers" ON exam_answers FOR INSERT WITH CHECK (\n    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid() AND exam_attempts.status = \'in_progress\')\n);\nCREATE POLICY "Candidate update own exam_answers" ON exam_answers FOR UPDATE USING (\n    EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = attempt_id AND exam_attempts.candidate_id = auth.uid() AND exam_attempts.status = \'in_progress\')\n);');

c = c.replace('CREATE POLICY "Candidate access own assignment_submissions" ON assignment_submissions FOR ALL USING (candidate_id = auth.uid());',
'CREATE POLICY "Candidate select own assignment_submissions" ON assignment_submissions FOR SELECT USING (candidate_id = auth.uid());\nCREATE POLICY "Candidate insert own assignment_submissions" ON assignment_submissions FOR INSERT WITH CHECK (candidate_id = auth.uid());');

c = c.replace('CREATE POLICY "Candidate access own contest_attempts" ON contest_attempts FOR ALL USING (candidate_id = auth.uid());',
'CREATE POLICY "Candidate select own contest_attempts" ON contest_attempts FOR SELECT USING (candidate_id = auth.uid());\nCREATE POLICY "Candidate insert own contest_attempts" ON contest_attempts FOR INSERT WITH CHECK (candidate_id = auth.uid());');

c = c.replace('CREATE POLICY "Candidate access own code_submissions" ON code_submissions FOR ALL USING (\r\n    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid())\r\n);',
'CREATE POLICY "Candidate select own code_submissions" ON code_submissions FOR SELECT USING (\r\n    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid())\r\n);\r\nCREATE POLICY "Candidate insert own code_submissions" ON code_submissions FOR INSERT WITH CHECK (\r\n    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid() AND contest_attempts.status = \'in_progress\')\r\n);');

c = c.replace('CREATE POLICY "Candidate access own code_submissions" ON code_submissions FOR ALL USING (\n    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid())\n);',
'CREATE POLICY "Candidate select own code_submissions" ON code_submissions FOR SELECT USING (\n    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid())\n);\nCREATE POLICY "Candidate insert own code_submissions" ON code_submissions FOR INSERT WITH CHECK (\n    EXISTS (SELECT 1 FROM contest_attempts WHERE contest_attempts.id = contest_attempts_id AND contest_attempts.candidate_id = auth.uid() AND contest_attempts.status = \'in_progress\')\n);');

c = c.replace('CREATE POLICY "Users access own profile" ON profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());',
'CREATE POLICY "Users select own profile" ON profiles FOR SELECT USING (id = auth.uid());');

c = c.replace('GRANT ALL ON SCHEMA public TO anon;\r\nGRANT ALL ON SCHEMA public TO authenticated;',
'GRANT USAGE ON SCHEMA public TO anon;\r\nGRANT USAGE ON SCHEMA public TO authenticated;');
c = c.replace('GRANT ALL ON SCHEMA public TO anon;\nGRANT ALL ON SCHEMA public TO authenticated;',
'GRANT USAGE ON SCHEMA public TO anon;\nGRANT USAGE ON SCHEMA public TO authenticated;');

c = c.replace('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;\r\nGRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;\r\nGRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;',
'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;\r\nGRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;\r\nGRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;\r\nGRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;\r\nGRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;\r\nGRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;');

c = c.replace('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;\nGRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;\nGRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;',
'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;\nGRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;\nGRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;\nGRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;\nGRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;\nGRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;');

c = c.replace('CREATE POLICY "Public Read Assignment Files" ON storage.objects\nFOR SELECT\nUSING (bucket_id = \'assignment-submissions\');', 'CREATE POLICY "Users can list their own assignment files" ON storage.objects\nFOR SELECT\nUSING (bucket_id = \'assignment-submissions\' AND auth.uid() = owner);');
c = c.replace('CREATE POLICY "Public Read Exam Files" ON storage.objects\nFOR SELECT\nUSING (bucket_id = \'exam-uploads\');', 'CREATE POLICY "Users can list their own exam files" ON storage.objects\nFOR SELECT\nUSING (bucket_id = \'exam-uploads\' AND auth.uid() = owner);');
c = c.replace('CREATE POLICY "Public Read Assignment Files"\r\nON storage.objects FOR SELECT\r\nUSING (bucket_id = \'assignment-submissions\');', 'CREATE POLICY "Users can list their own assignment files" ON storage.objects\r\nFOR SELECT\r\nUSING (bucket_id = \'assignment-submissions\' AND auth.uid() = owner);');
c = c.replace('CREATE POLICY "Public Read Exam Files" ON storage.objects\r\nFOR SELECT USING (bucket_id = \'exam-uploads\');', 'CREATE POLICY "Users can list their own exam files" ON storage.objects\r\nFOR SELECT USING (bucket_id = \'exam-uploads\' AND auth.uid() = owner);');

fs.writeFileSync('supabase/migrations/COMPLETE_SCHEMA.sql', c);

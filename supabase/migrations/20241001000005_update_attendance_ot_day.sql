ALTER TABLE ""attendance"" DROP CONSTRAINT IF EXISTS attendance_attendance_type_check;
ALTER TABLE ""attendance"" ADD CONSTRAINT attendance_attendance_type_check CHECK (attendance_type IN ('full_day', 'half_day', 'hourly', 'absent', 'ot_day'));

CAMPUSDESK - ORGANIZED FILE STRUCTURE

Open index.html with Live Server.

LOGIN
Username: admin
Password: admin123

CSS FILES (css folder)
- common.css      Shared layout, fonts, buttons, tables and responsive rules
- login.css       Login page design
- dashboard.css  Dashboard quick-access cards
- course.css     Course cards and course section
- student.css    Student list styles
- attendance.css Attendance styles
- result.css     Result and subject styles
- fees.css       Fees section styles
- components.css Shared UI components and modal styles

JAVASCRIPT FILES (js folder)
- app.js          Main setup, shared data, login, navigation, events and storage
- dashboard.js    Dashboard functions
- course.js       Course functions
- student.js      Student functions
- attendance.js   Attendance functions
- result.js       Result, subject marks and download functions
- fees.js         Fees functions

Script order in index.html matters: app.js loads first, then feature files.
Data is saved in this browser using LocalStorage. This is a learning/demo app.

RESULTS UPDATE
- Select 1 to 8 subjects and enter each subject name and marks.
- Store results year-wise (2020 onward; year list expands automatically for current and saved years).
- Automatically calculates CGPA and PASS/FAIL (40% passing per subject).
- Download Result PDF opens the print dialog; choose Save as PDF. Edit and Delete actions are available for each subject record.

FEES UPDATE
- Fee records have a separate year selector and are stored year-wise. Edit and Delete actions are available for each fee record.

Note: CGPA uses a simple grade-point scale based on percentage (90+=10, 80+=9, 70+=8, 60+=7, 50+=6, 40+=5, below 40=0). This is a demo calculation with equal subject weight; change the scale/credits if your college follows a different grading rule.

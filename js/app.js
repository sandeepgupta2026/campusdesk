// ============================================================
// 1. DATA, STORAGE AND COMMON HELPERS
// ============================================================
const STORAGE_KEY = "campusdesk_new_v1";
const defaultData = {
  courses: [
    { id: "c1", name: "BSc Computer Science", code: "BSc CS", duration: 3 },
    { id: "c2", name: "Bachelor of Computer Applications", code: "BCA", duration: 3 },
    { id: "c3", name: "Bachelor of Business Administration", code: "BBA", duration: 3 },
    { id: "c4", name: "Biotechnology", code: "Biotech", duration: 3 },
    { id: "c5", name: "Bachelor of Technology", code: "BTech", duration: 4 }
  ], students: [], attendance: [], results: [], fees: []
};

const $ = (selector) => document.querySelector(selector);
let db = loadData();
let currentPage = "dashboard";
let selectedCourse = null;
let selectedYear = 1;
let selectedRecordYear = new Date().getFullYear();

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(defaultData); }
  catch { return structuredClone(defaultData); }
}
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2300);
}
function courseById(id) { return db.courses.find(course => course.id === id); }
function courseCode(id) { return courseById(id)?.code || "Unknown"; }
function courseYears(id) { return Number(courseById(id)?.duration || 3); }
function studentsForCourse(id) { return db.students.filter(student => student.courseId === id).length; }
function setPage(page) {
  currentPage = page;
  selectedCourse = null;
  document.querySelectorAll(".nav-btn").forEach(button => button.classList.toggle("active", button.dataset.page === page));
  render();
}
function render() {
  const pageInfo = {
    dashboard: ["Dashboard", "Choose a section to manage your college records."],
    courses: ["Courses", "Add, edit and view the courses offered by your college."],
    students: ["Students", "Select a course and year to manage students."],
    attendance: ["Attendance", "Mark and view attendance course-wise."],
    results: ["Results", "Add marks and view results course-wise."],
    fees: ["Fees", "Manage paid and pending fees course-wise."]
  };
  $("#pageTitle").textContent = pageInfo[currentPage][0];
  $("#pageSubtitle").textContent = pageInfo[currentPage][1];
  $("#today").textContent = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const pages = { dashboard: dashboardView, courses: coursesView, students: studentsView, attendance: attendanceView, results: resultsView, fees: feesView };
  $("#content").innerHTML = pages[currentPage]();
}
// ============================================================
// 2. PAGE VIEWS (DASHBOARD, COURSES, STUDENTS, ATTENDANCE, RESULTS, FEES)
// ============================================================
function dashboardView() {
  const items = [
    ["courses", "▤", "Courses", "Add or view courses", "quick-purple"],
    ["students", "♙", "Students", "Add and manage students", "quick-blue"],
    ["attendance", "✓", "Attendance", "Mark present or absent", "quick-green"],
    ["results", "▣", "Results", "Add and view marks", "quick-orange"],
    ["fees", "₹", "Fees", "Paid and pending fees", "quick-pink"]
  ];
  return `<div class="quick-grid dashboard-quick">${items.map(item => `
    <button class="quick-card ${item[4]}" data-go="${item[0]}">
      <span class="quick-icon">${item[1]}</span><b>${item[2]}</b><small>${item[3]}</small>
      <span class="quick-arrow">Open section →</span>
    </button>`).join("")}</div>`;
}
function courseTiles() {
  if (!db.courses.length) return emptyState("No courses added yet", "Use Add Course to create your first course.");
  return `<div class="course-grid">${db.courses.map(course => `
    <div class="course-tile">
      <button class="course-open" data-course-action="open" data-id="${course.id}">
        <span class="course-code">${safe(course.code)}</span><h4>${safe(course.name)}</h4>
        <p>${course.duration} year programme</p><div class="count">${studentsForCourse(course.id)} students</div>
      </button>
      <div class="course-actions">
        <button type="button" class="btn small secondary" data-action="edit-course" data-id="${course.id}">✎ Edit Course</button>
        <button type="button" class="btn small danger" data-action="delete-course" data-id="${course.id}">Delete</button>
      </div>
    </div>`).join("")}</div>`;
}
function coursesView() {
  return `<div class="card"><div class="section-title"><div><h3>Course List</h3><p>Click a course name to open it. Use Edit Course to change its details.</p></div><button class="btn" data-action="add-course">+ Add Course</button></div>${courseTiles()}</div>`;
}
function coursePicker(section) {
  return `<div class="card"><div class="section-title"><div><h3>Select Course</h3><p>Choose a course to continue to ${section}.</p></div></div>${courseTiles()}</div>`;
}
function emptyState(title, description) { return `<div class="empty"><b>${title}</b>${description}</div>`; }
function yearButtons() {
  return `<div class="year-row">${Array.from({ length: courseYears(selectedCourse) }, (_, index) => {
    const year = index + 1;
    const suffix = year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";
    return `<button class="year-btn ${selectedYear === year ? "active" : ""}" data-year="${year}">${year}${suffix} Year</button>`;
  }).join("")}</div>`;
}
function currentStudents() {
  return db.students.filter(student => student.courseId === selectedCourse && Number(student.year) === selectedYear);
}
function studentsView() {
  if (!selectedCourse) return coursePicker("student management");
  return `<div class="card"><div class="section-title"><div><h3>${safe(courseCode(selectedCourse))} — Students</h3><p>Select year, then add or manage students.</p></div><button class="btn secondary" data-action="back-courses">← All Courses</button></div>
    ${yearButtons()}<div class="toolbar"><button class="btn" data-action="add-student">+ Add Student</button><input id="studentSearch" placeholder="Search name, roll number or phone..."></div>
    <div id="studentTable">${studentTable(currentStudents())}</div></div>`;
}
function studentTable(list) {
  if (!list.length) return emptyState("No students in this year", "Click Add Student to register the first student.");
  return `<div class="table-wrap"><table><thead><tr><th>Roll No.</th><th>Student Name</th><th>Phone</th><th>Email</th><th>Action</th></tr></thead><tbody>
    ${list.map(student => `<tr><td>${safe(student.roll)}</td><td><b>${safe(student.name)}</b></td><td>${safe(student.phone || "-")}</td><td>${safe(student.email || "-")}</td><td><div class="action-row"><button class="btn small secondary" data-action="edit-student" data-id="${student.id}">Edit</button><button class="btn small danger" data-action="delete-student" data-id="${student.id}">Delete</button></div></td></tr>`).join("")}
    </tbody></table></div>`;
}
function attendanceView() {
  if (!selectedCourse) return coursePicker("attendance");
  const today = new Date().toISOString().slice(0, 10);
  const students = currentStudents();
  return `<div class="card"><div class="section-title"><div><h3>${safe(courseCode(selectedCourse))} — Attendance</h3><p>Choose year and mark attendance for a date.</p></div><button class="btn secondary" data-action="back-courses">← All Courses</button></div>
    ${yearButtons()}<div class="toolbar"><input type="date" id="attendanceDate" value="${today}"><button class="btn" data-action="save-attendance">Save Attendance</button><button class="btn secondary" data-action="show-attendance">Show Records</button></div>
    ${students.length ? `<div class="table-wrap"><table><thead><tr><th>Roll No.</th><th>Student</th><th>Attendance</th></tr></thead><tbody>${students.map(student => `<tr><td>${safe(student.roll)}</td><td>${safe(student.name)}</td><td><select class="att-status" data-student="${student.id}"><option>Present</option><option>Absent</option></select></td></tr>`).join("")}</tbody></table></div>` : emptyState("No students found", "Add students to this course and year first.")}
    <div id="attendanceRecords"></div></div>`;
}
function resultsView() {
  if (!selectedCourse) return coursePicker("results");
  return `<div class="card"><div class="section-title"><div><h3>${safe(courseCode(selectedCourse))} — Results</h3><p>Add marks and view results for each year.</p></div><button class="btn secondary" data-action="back-courses">← All Courses</button></div>
    ${yearButtons()}<div class="toolbar"><button class="btn" data-action="add-result">+ Add Result</button><button class="btn secondary" data-action="show-results">Show Results</button></div><div id="resultRecords">${emptyState("No result selected", "Add a result or click Show Results.")}</div></div>`;
}
function feesView() {
  if (!selectedCourse) return coursePicker("fees");
  return `<div class="card"><div class="section-title"><div><h3>${safe(courseCode(selectedCourse))} — Fees</h3><p>Manage fee details by academic year.</p></div><button class="btn secondary" data-action="back-courses">← All Courses</button></div>
    ${yearButtons()}<div class="toolbar"><button class="btn" data-action="add-fee">+ Add Fee</button><button class="btn secondary" data-action="show-fees">Show Fees</button></div><div id="feeRecords">${emptyState("No fee records", "Add a fee record or click Show Fees.")}</div></div>`;
}
// ============================================================
// 3. FORMS AND USER ACTIONS
// ============================================================
function openModal(title, html) { $("#modalTitle").textContent = title; $("#modalBody").innerHTML = html; $("#modalBackdrop").classList.add("show"); }
function closeModal() { $("#modalBackdrop").classList.remove("show"); }
function field(label, name, type = "text", value = "", required = true) {
  return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${safe(value)}" ${required ? "required" : ""}></div>`;
}
function form(fields) {
  return `<form id="dataForm"><div class="form-grid">${fields}</div><div class="modal-actions"><button type="button" class="btn ghost" id="cancelModal">Cancel</button><button class="btn" type="submit">Save</button></div></form>`;
}
function courseForm(course = null) {
  return form(field("Course Name", "name", "text", course?.name || "") + field("Course Code (e.g. BCA)", "code", "text", course?.code || "") + field("Duration (years)", "duration", "number", course?.duration || 3) + `<input type="hidden" name="formType" value="course"><input type="hidden" name="editId" value="${course?.id || ""}">`);
}
function handleAction(action, element) {
  const recordId = element.dataset.id;
  if (action === "add-course") openModal("Add New Course", courseForm());
  if (action === "edit-course") {
    const course = courseById(recordId);
    if (course) openModal("Edit Course", courseForm(course));
  }
  if (action === "delete-course") {
    const relatedStudents = db.students.some(student => student.courseId === recordId);
    if (relatedStudents) { notify("Delete this course's students first."); return; }
    if (confirm("Delete this course?")) {
      db.courses = db.courses.filter(course => course.id !== recordId);
      saveData(); render(); notify("Course deleted");
    }
  }
  if (action === "back-courses") { selectedCourse = null; render(); }
  if (action === "add-student") openStudentForm();
  if (action === "edit-student") openStudentForm(db.students.find(student => student.id === recordId));
  if (action === "delete-student" && confirm("Delete this student and their attendance, result and fee records?")) {
    db.students = db.students.filter(student => student.id !== recordId);
    db.attendance = db.attendance.filter(item => item.studentId !== recordId);
    db.results = db.results.filter(item => item.studentId !== recordId);
    db.fees = db.fees.filter(item => item.studentId !== recordId);
    saveData(); render(); notify("Student deleted");
  }
  if (action === "save-attendance") saveAttendance();
  if (action === "show-attendance") showAttendance();
  if (action === "add-result") openResultForm();
  if (action === "show-results") showResults();
  if (action === "edit-result") editResult(recordId);
  if (action === "delete-result" && confirm("Delete this subject result?")) {
    db.results = db.results.filter(item => item.id !== recordId);
    saveData(); showResults(); notify("Result deleted");
  }
  if (action === "download-results") downloadResults();
  if (action === "download-result-pdf") downloadResultPDF();
  if (action === "add-fee") openFeeForm();
  if (action === "show-fees") showFees();
  if (action === "edit-fee") editFee(recordId);
  if (action === "delete-fee" && confirm("Delete this fee record?")) {
    db.fees = db.fees.filter(item => item.id !== recordId);
    saveData(); showFees(); notify("Fee record deleted");
  }
}
function openStudentForm(student = null) {
  openModal(student ? "Edit Student" : "Add Student", form(
    field("Student Name", "name", "text", student?.name || "") + field("Roll Number", "roll", "text", student?.roll || "") +
    field("Phone Number", "phone", "tel", student?.phone || "", false) + field("Email", "email", "email", student?.email || "", false) +
    `<input type="hidden" name="formType" value="student"><input type="hidden" name="editId" value="${student?.id || ""}">`
  ));
}
function openResultForm() {
  const students = currentStudents();
  if (!students.length) { notify("Add students first"); return; }
  const options = students.map(student => `<option value="${student.id}">${safe(student.roll)} — ${safe(student.name)}</option>`).join("");
  const subjectFields = [1,2,3,4].map(number => `
    <div class="field subject-entry" data-subject-entry="${number}" ${number === 4 ? 'hidden' : ''}>
      <label>Subject ${number} Name</label>
      <input name="subject${number}" type="text" placeholder="e.g. CS Major / Cyber Security / Mathematics" ${number <= 3 ? "required" : ""}>
    </div>
    <div class="field subject-entry" data-subject-entry="${number}" ${number === 4 ? 'hidden' : ''}>
      <label>Subject ${number} Marks</label>
      <input name="marks${number}" type="number" min="0" max="100" placeholder="e.g. 99" ${number <= 3 ? "required" : ""}>
    </div>`).join("");
  openModal("Add Student Result", form(`
    <div class="field full"><label>Student</label><select name="studentId" required>${options}</select></div>
    <div class="field full"><label>Number of Subjects</label><select name="subjectCount" id="subjectCount"><option value="3">3 Subjects</option><option value="4">4 Subjects</option></select></div>
    ${subjectFields}
    <p class="form-hint field full">Enter 3 or 4 subjects. You can edit subject names and marks later.</p>
    <input type="hidden" name="formType" value="result">
  `));
}
function openFeeForm() {
  const students = currentStudents();
  if (!students.length) { notify("Add students first"); return; }
  const options = students.map(student => `<option value="${student.id}">${safe(student.roll)} — ${safe(student.name)}</option>`).join("");
  openModal("Add Fee Record", form(`<div class="field full"><label>Student</label><select name="studentId" required>${options}</select></div>` + field("Total Fee", "amount", "number", 0) + field("Paid Amount", "paid", "number", 0) + field("Due Date", "dueDate", "date", new Date().toISOString().slice(0, 10), false) + `<input type="hidden" name="formType" value="fee">`));
}
// ============================================================
// 4. ATTENDANCE, RESULTS AND FEES OPERATIONS
// ============================================================
function saveAttendance() {
  const date = $("#attendanceDate")?.value;
  if (!date) { notify("Select a date"); return; }
  const selects = [...document.querySelectorAll(".att-status")];
  if (!selects.length) { notify("No students to mark"); return; }
  selects.forEach(select => {
    db.attendance = db.attendance.filter(item => !(item.studentId === select.dataset.student && item.date === date));
    db.attendance.push({ id: makeId(), studentId: select.dataset.student, date, status: select.value, courseId: selectedCourse, year: selectedYear });
  });
  saveData(); notify("Attendance saved successfully");
}
function showAttendance() {
  const records = db.attendance.filter(item => item.courseId === selectedCourse && Number(item.year) === selectedYear)
    .sort((a,b) => b.date.localeCompare(a.date));
  if (!records.length) {
    $("#attendanceRecords").innerHTML = emptyState("No attendance records", "Save attendance to see records here.");
    return;
  }
  const grouped = records.reduce((groups, record) => {
    (groups[record.date] ||= []).push(record);
    return groups;
  }, {});
  $("#attendanceRecords").innerHTML = `<h3 class="records-heading">Attendance History</h3>` +
    Object.entries(grouped).map(([date, dayRecords]) => `
      <section class="attendance-date-group">
        <div class="attendance-date-divider"><span>${date}</span></div>
        <div class="table-wrap"><table><thead><tr><th>Student</th><th>Roll No.</th><th>Status</th></tr></thead><tbody>
          ${dayRecords.map(record => {
            const student = db.students.find(item => item.id === record.studentId) || {};
            return `<tr><td>${safe(student.name)}</td><td>${safe(student.roll)}</td><td><span class="badge ${record.status.toLowerCase()}">${record.status}</span></td></tr>`;
          }).join("")}
        </tbody></table></div>
      </section>`).join("");
}
function showResults() {
  const records = db.results.filter(item => item.courseId === selectedCourse && Number(item.year) === selectedYear);
  const rows = records.map(record => {
    const student = db.students.find(item => item.id === record.studentId) || {};
    const percent = record.maximum ? Math.round(record.marks / record.maximum * 100) : 0;
    const grade = percent >= 80 ? "A" : percent >= 60 ? "B" : percent >= 40 ? "C" : "Needs Improvement";
    return `<tr><td>${safe(student.name)} (${safe(student.roll)})</td><td>${safe(record.subject)}</td><td>${record.marks}/${record.maximum}</td><td>${percent}%</td><td><span class="badge">${grade}</span></td><td><button class="btn small secondary" data-action="edit-result" data-id="${record.id}">Edit</button></td></tr>`;
  }).join("");
  $("#resultRecords").innerHTML = records.length
    ? `<div class="toolbar result-download"><button class="btn success" data-action="download-results">↓ Download Result</button></div>
       <div class="table-wrap"><table><thead><tr><th>Student</th><th>Subject</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : emptyState("No results found", "Add result records to see them here.");
}
function editResult(recordId) {
  const record = db.results.find(item => item.id === recordId);
  if (!record) return;
  const student = db.students.find(item => item.id === record.studentId);
  if (!student) return;
  const options = currentStudents().map(item => `<option value="${item.id}" ${item.id === record.studentId ? "selected" : ""}>${safe(item.roll)} — ${safe(item.name)}</option>`).join("");
  openModal("Edit Result Subject", form(`
    <div class="field full"><label>Student</label><select name="studentId" required>${options}</select></div>
    ${field("Subject Name", "subject", "text", record.subject)}
    ${field("Maximum Marks", "maximum", "number", record.maximum)}
    ${field("Obtained Marks", "marks", "number", record.marks)}
    <input type="hidden" name="formType" value="result"><input type="hidden" name="editId" value="${record.id}">
  `));
}
function downloadResults() {
  const records = db.results.filter(item => item.courseId === selectedCourse && Number(item.year) === selectedYear);
  if (!records.length) { notify("No results to download"); return; }
  const lines = [["Student Name","Roll Number","Course","Year","Subject","Obtained Marks","Maximum Marks","Percentage","Grade"]];
  records.forEach(record => {
    const student = db.students.find(item => item.id === record.studentId) || {};
    const percent = record.maximum ? Math.round(record.marks / record.maximum * 100) : 0;
    const grade = percent >= 80 ? "A" : percent >= 60 ? "B" : percent >= 40 ? "C" : "Needs Improvement";
    lines.push([student.name || "", student.roll || "", courseCode(selectedCourse), selectedYear, record.subject, record.marks, record.maximum, `${percent}%`, grade]);
  });
  const csv = lines.map(row => row.map(value => `"${String(value).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${courseCode(selectedCourse).replace(/\s+/g,"-")}-year-${selectedYear}-results.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  notify("Result file downloaded");
}
function showFees() {
  const records = db.fees.filter(item => item.courseId === selectedCourse && Number(item.year) === selectedYear);
  $("#feeRecords").innerHTML = records.length ? `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Total Fee</th><th>Paid</th><th>Fee Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>${records.map(record => { const student = db.students.find(item => item.id === record.studentId) || {}; const paid = Number(record.paid); const total = Number(record.amount); return `<tr><td>${safe(student.name)} (${safe(student.roll)})</td><td>₹${total}</td><td>₹${paid}</td><td>₹${Math.max(0,total-paid)}</td><td><span class="badge ${paid >= total ? "paid" : "pending"}">${paid >= total ? "Paid" : "Pending"}</span></td><td><button class="btn small secondary" data-action="edit-fee" data-id="${record.id}">Edit</button></td></tr>`; }).join("")}</tbody></table></div>` : emptyState("No fee records", "Add fee records to see them here.");
}
function editFee(recordId) {
  const fee = db.fees.find(item => item.id === recordId);
  if (!fee) return;
  const options = currentStudents().map(student => `<option value="${student.id}" ${student.id === fee.studentId ? "selected" : ""}>${safe(student.roll)} — ${safe(student.name)}</option>`).join("");
  openModal("Edit Fee Record", form(`<div class="field full"><label>Student</label><select name="studentId" required>${options}</select></div>` + field("Total Fee", "amount", "number", fee.amount) + field("Paid Amount", "paid", "number", fee.paid) + field("Due Date", "dueDate", "date", fee.dueDate || "", false) + `<input type="hidden" name="formType" value="fee"><input type="hidden" name="editId" value="${fee.id}">`));
}
// Save submitted forms: course, student, multi-subject result and fee.
function saveForm(formElement) {
  const data = Object.fromEntries(new FormData(formElement));
  if (data.formType === "course") {
    const duplicate = db.courses.some(course => course.code.toLowerCase() === data.code.trim().toLowerCase() && course.id !== data.editId);
    if (duplicate) { notify("Course code already exists"); return; }
    const courseData = { name: data.name.trim(), code: data.code.trim(), duration: Math.max(1, Number(data.duration) || 3) };
    if (data.editId) Object.assign(courseById(data.editId), courseData);
    else db.courses.push({ id: makeId(), ...courseData });
    saveData(); closeModal(); render(); notify(data.editId ? "Course updated" : "Course added");
  }
  if (data.formType === "student") {
    const duplicate = db.students.some(student => student.courseId === selectedCourse && student.roll.toLowerCase() === data.roll.trim().toLowerCase() && student.id !== data.editId);
    if (duplicate) { notify("Roll number already exists in this course"); return; }
    const studentData = { name: data.name.trim(), roll: data.roll.trim(), phone: data.phone, email: data.email };
    if (data.editId) Object.assign(db.students.find(student => student.id === data.editId), studentData);
    else db.students.push({ id: makeId(), courseId: selectedCourse, year: selectedYear, ...studentData });
    saveData(); closeModal(); render(); notify(data.editId ? "Student updated" : "Student added");
  }
  if (data.formType === "result") {
    const count = Number(data.subjectCount), examYear = Number(data.examYear);
    if (!Number.isInteger(examYear) || examYear < 2000 || examYear > 2100) { notify("Enter a valid exam year"); return; }
    if (data.editId) {
      const marks=Number(data.marks), maximum=Number(data.maximum);
      if (!data.subject.trim() || maximum<=0 || marks<0 || marks>maximum) { notify("Enter valid subject and marks"); return; }
      const record=db.results.find(item=>item.id===data.editId);
      if(record) Object.assign(record,{studentId:data.studentId,subject:data.subject.trim(),maximum,marks,examYear});
      selectedRecordYear=examYear;
      saveData(); closeModal(); showResults(); notify("Subject result updated");
    } else {
      if(count<1||count>8){notify("Choose 1 to 8 subjects");return;}
      const groupId=makeId(), newRecords=[];
      for(let number=1;number<=count;number++){
        const subject=String(data[`subject${number}`]||"").trim(), marks=Number(data[`marks${number}`]);
        if(!subject||data[`marks${number}`]===""||marks<0||marks>100){notify(`Enter valid details for Subject ${number}`);return;}
        newRecords.push({id:makeId(),groupId,studentId:data.studentId,courseId:selectedCourse,year:selectedYear,examYear,subject,maximum:100,marks});
      }
      db.results.push(...newRecords); selectedRecordYear=examYear; saveData(); closeModal(); showResults(); notify(`${count} subject results saved`);
    }
  }
  if (data.formType === "fee") {
    const amount = Number(data.amount), paid = Number(data.paid);
    if (!Number.isFinite(amount) || !Number.isFinite(paid) || amount <= 0 || paid < 0 || paid > amount) { notify("Enter valid fee amounts"); return; }
    const feeYear=Number(data.feeYear);
    if(!Number.isInteger(feeYear)||feeYear<2000||feeYear>2100){notify("Enter a valid fee year");return;}
    const feeData = { studentId: data.studentId, courseId: selectedCourse, year: selectedYear, recordYear: feeYear, amount, paid, dueDate: data.dueDate };
    selectedRecordYear=feeYear;
    if (data.editId) Object.assign(db.fees.find(item => item.id === data.editId), feeData);
    else db.fees.push({ id: makeId(), ...feeData });
    saveData(); closeModal(); showFees(); notify(data.editId ? "Fee updated" : "Fee record saved");
  }
}

// ============================================================
// 5. LOGIN, LOGOUT AND EVENT LISTENERS
// ============================================================
// Login and logout: demo credentials are admin / admin123.
$("#loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const username = $("#loginUsername").value.trim();
  const password = $("#loginPassword").value;
  if (username === "admin" && password === "admin123") {
    sessionStorage.setItem("campusdeskLoggedIn", "yes");
    $("#loginScreen").hidden = true;
    $("#appShell").hidden = false;
    $("#loginError").textContent = "";
    render();
    notify("Login successful");
  } else {
    $("#loginError").textContent = "Incorrect username or password. Please try again.";
  }
});
$("#logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("campusdeskLoggedIn");
  $("#appShell").hidden = true;
  $("#loginScreen").hidden = false;
  $("#loginPassword").value = "";
  notify("Logged out successfully");
});
if (sessionStorage.getItem("campusdeskLoggedIn") === "yes") {
  $("#loginScreen").hidden = true;
  $("#appShell").hidden = false;
}

document.addEventListener("click", event => {
  const nav = event.target.closest(".nav-btn");
  if (nav) { setPage(nav.dataset.page); return; }
  const go = event.target.closest("[data-go]");
  if (go) { setPage(go.dataset.go); return; }
  const year = event.target.closest("[data-year]");
  if (year) { selectedYear = Number(year.dataset.year); render(); return; }
  const course = event.target.closest("[data-course-action]");
  if (course) { selectedCourse = course.dataset.id; selectedYear = 1; render(); return; }
  const action = event.target.closest("[data-action]");
  if (action) { handleAction(action.dataset.action, action); return; }
  if (event.target.id === "cancelModal" || event.target.id === "closeModal") closeModal();
});
document.addEventListener("submit", event => {
  if (event.target.id === "dataForm") { event.preventDefault(); saveForm(event.target); }
});
document.addEventListener("change", event => {
  if (event.target.id === "resultYearFilter" || event.target.id === "feeYearFilter") { selectedRecordYear=Number(event.target.value); if(currentPage==="results") showResults(); if(currentPage==="fees") showFees(); return; }
  if (event.target.id === "subjectCount") {
    const count = Number(event.target.value);
    document.querySelectorAll("[data-subject-entry]").forEach(field => {
      const show = Number(field.dataset.subjectEntry) <= count;
      field.hidden = !show;
      const input = field.querySelector("input");
      if (input) input.required = show;
    });
  }
});
document.addEventListener("input", event => {
  if (event.target.id === "studentSearch") {
    const query = event.target.value.toLowerCase();
    const filtered = currentStudents().filter(student => [student.name, student.roll, student.phone].some(value => String(value || "").toLowerCase().includes(query)));
    $("#studentTable").innerHTML = studentTable(filtered);
  }
});
$("#modalBackdrop").addEventListener("click", event => { if (event.target.id === "modalBackdrop") closeModal(); });
$("#closeModal").addEventListener("click", closeModal);

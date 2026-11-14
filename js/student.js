/* Student section: functions used by the student page. */

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

function openStudentForm(student = null) {
  openModal(student ? "Edit Student" : "Add Student", form(
    field("Student Name", "name", "text", student?.name || "") + field("Roll Number", "roll", "text", student?.roll || "") +
    field("Phone Number", "phone", "tel", student?.phone || "", false) + field("Email", "email", "email", student?.email || "", false) +
    `<input type="hidden" name="formType" value="student"><input type="hidden" name="editId" value="${student?.id || ""}">`
  ));
}


/* Attendance section: functions used by the attendance page. */

function attendanceView() {
  if (!selectedCourse) return coursePicker("attendance");
  const today = new Date().toISOString().slice(0, 10);
  const students = currentStudents();
  return `<div class="card"><div class="section-title"><div><h3>${safe(courseCode(selectedCourse))} — Attendance</h3><p>Choose year and mark attendance for a date.</p></div><button class="btn secondary" data-action="back-courses">← All Courses</button></div>
    ${yearButtons()}<div class="toolbar"><input type="date" id="attendanceDate" value="${today}"><button class="btn" data-action="save-attendance">Save Attendance</button><button class="btn secondary" data-action="show-attendance">Show Records</button></div>
    ${students.length ? `<div class="table-wrap"><table><thead><tr><th>Roll No.</th><th>Student</th><th>Attendance</th></tr></thead><tbody>${students.map(student => `<tr><td>${safe(student.roll)}</td><td>${safe(student.name)}</td><td><select class="att-status" data-student="${student.id}"><option>Present</option><option>Absent</option></select></td></tr>`).join("")}</tbody></table></div>` : emptyState("No students found", "Add students to this course and year first.")}
    <div id="attendanceRecords"></div></div>`;
}

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


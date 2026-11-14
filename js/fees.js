/* Fees section: functions used by the fees page. */

function feesView() {
  if (!selectedCourse) return coursePicker("fees");
  return `<div class="card"><div class="section-title"><div><h3>${safe(courseCode(selectedCourse))} — Fees</h3><p>Manage fee details by academic year.</p></div><button class="btn secondary" data-action="back-courses">← All Courses</button></div>
    ${yearButtons()}<div class="toolbar"><label>Fee year <select id="feeYearFilter">${availableRecordYears().map(y=>`<option value="${y}" ${selectedRecordYear===y?"selected":""}>${y}</option>`).join("")}</select></label><button class="btn" data-action="add-fee">+ Add Fee</button><button class="btn secondary" data-action="show-fees">Show Fees</button></div><div id="feeRecords">${emptyState("No fee records", "Add a fee record or click Show Fees.")}</div></div>`;
}

function feeYearOptions(){return availableRecordYears().map(y=>`<option value="${y}" ${selectedRecordYear===y?"selected":""}>${y}</option>`).join("");}

function openFeeForm() {
  const students = currentStudents();
  if (!students.length) { notify("Add students first"); return; }
  const options = students.map(student => `<option value="${student.id}">${safe(student.roll)} — ${safe(student.name)}</option>`).join("");
  openModal("Add Fee Record", form(`<div class="field full"><label>Student</label><select name="studentId" required>${options}</select></div>` + field("Total Fee", "amount", "number", 0) + field("Paid Amount", "paid", "number", 0) + `<div class="field"><label>Fee Year</label><select name="feeYear">${feeYearOptions()}</select></div>` + field("Due Date", "dueDate", "date", new Date().toISOString().slice(0, 10), false) + `<input type="hidden" name="formType" value="fee">`));
}

function showFees() {
  const records = db.fees.filter(item => item.courseId === selectedCourse && Number(item.year) === selectedYear && Number(item.recordYear ?? item.feeYear ?? item.year) === selectedRecordYear);
  $("#feeRecords").innerHTML = records.length ? `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Year</th><th>Total Fee</th><th>Paid</th><th>Fee Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>${records.map(record => { const student = db.students.find(item => item.id === record.studentId) || {}; const paid = Number(record.paid); const total = Number(record.amount); return `<tr><td>${safe(student.name)} (${safe(student.roll)})</td><td>${record.recordYear || selectedRecordYear}</td><td>₹${total}</td><td>₹${paid}</td><td>₹${Math.max(0,total-paid)}</td><td><span class="badge ${paid >= total ? "paid" : "pending"}">${paid >= total ? "Paid" : "Pending"}</span></td><td><button class="btn small secondary" data-action="edit-fee" data-id="${record.id}">Edit</button><button class="btn small danger" data-action="delete-fee" data-id="${record.id}">Delete</button></td></tr>`; }).join("")}</tbody></table></div>` : emptyState("No fee records", "Add fee records to see them here.");
}

function editFee(recordId) {
  const fee = db.fees.find(item => item.id === recordId);
  if (!fee) return;
  const options = currentStudents().map(student => `<option value="${student.id}" ${student.id === fee.studentId ? "selected" : ""}>${safe(student.roll)} — ${safe(student.name)}</option>`).join("");
  openModal("Edit Fee Record", form(`<div class="field full"><label>Student</label><select name="studentId" required>${options}</select></div>` + field("Total Fee", "amount", "number", fee.amount) + field("Paid Amount", "paid", "number", fee.paid) + field("Due Date", "dueDate", "date", fee.dueDate || "", false) + `<div class="field"><label>Fee Year</label><select name="feeYear">${availableRecordYears().map(y=>`<option value="${y}" ${Number(fee.recordYear ?? fee.feeYear ?? selectedRecordYear)===y?"selected":""}>${y}</option>`).join("")}</select></div><input type="hidden" name="formType" value="fee"><input type="hidden" name="editId" value="${fee.id}">`));
}


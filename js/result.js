/* Result section: functions used by the result page. */

function availableRecordYears() {
  const latestSaved = Math.max(0, ...db.results.map(record => Number(record.examYear ?? record.recordYear ?? record.year) || 0), ...db.fees.map(record => Number(record.recordYear ?? record.feeYear) || 0));
  const lastYear = Math.max(new Date().getFullYear(), latestSaved, 2026);
  return Array.from({ length: lastYear - 2020 + 1 }, (_, index) => 2020 + index);
}
function resultYearOptions(){return availableRecordYears().map(y=>`<option value="${y}" ${selectedRecordYear===y?"selected":""}>${y}</option>`).join("");}
function resultsView(){if(!selectedCourse)return coursePicker("results");return `<div class="card"><div class="section-title"><div><h3>${safe(courseCode(selectedCourse))} — Results</h3><p>Save results year-wise with CGPA and pass/fail status.</p></div><button class="btn secondary" data-action="back-courses">← All Courses</button></div>${yearButtons()}<div class="toolbar"><label>Result year <select id="resultYearFilter">${resultYearOptions()}</select></label><button class="btn" data-action="add-result">+ Add Result</button><button class="btn secondary" data-action="show-results">Show Results</button></div><div id="resultRecords">${emptyState("No result selected","Add a result or click Show Results.")}</div></div>`;}
function openResultForm(){const students=currentStudents();if(!students.length){notify("Add students first");return;}const options=students.map(st=>`<option value="${st.id}">${safe(st.roll)} — ${safe(st.name)}</option>`).join("");const subjects=Array.from({length:8},(_,i)=>i+1).map(n=>`<div class="field subject-entry" data-subject-entry="${n}" ${n>3?'hidden':''}><label>Subject ${n} Name</label><input name="subject${n}" placeholder="Subject name" ${n<=3?'required':''}></div><div class="field subject-entry" data-subject-entry="${n}" ${n>3?'hidden':''}><label>Subject ${n} Marks</label><input name="marks${n}" type="number" min="0" max="100" ${n<=3?'required':''}></div>`).join("");openModal("Add Student Result",form(`<div class="field full"><label>Student</label><select name="studentId" required>${options}</select></div><div class="field"><label>Exam Year</label><select name="examYear">${resultYearOptions()}</select></div><div class="field"><label>Number of Subjects</label><select name="subjectCount" id="subjectCount">${Array.from({length:8},(_,i)=>`<option value="${i+1}" ${i===2?'selected':''}>${i+1} Subjects</option>`).join("")}</select></div>${subjects}<p class="form-hint field full">40 marks is the passing mark. CGPA is calculated automatically from all saved exam years up to the selected year.</p><input type="hidden" name="formType" value="result">`));}
// Grade-point scale (10-point system). Each subject currently has equal weight (1 credit).
// If the college uses subject-wise credits, add a credit field and use it in weightedAverage().
function gradePoint(m) {
  const percentage = Number(m);
  if (!Number.isFinite(percentage)) return 0;
  if (percentage >= 90) return 10;
  if (percentage >= 80) return 9;
  if (percentage >= 70) return 8;
  if (percentage >= 60) return 7;
  if (percentage >= 50) return 6;
  if (percentage >= 40) return 5;
  return 0;
}
function percentageOf(record) {
  const maximum = Number(record.maximum) || 100;
  return maximum > 0 ? (Number(record.marks) / maximum) * 100 : 0;
}
function recordYear(record) {
  return Number(record.examYear ?? record.recordYear ?? record.year ?? 0);
}
function grouped(records) {
  const map = new Map();
  records.forEach(record => {
    const key = `${record.groupId || `${record.studentId}-${record.year ?? ''}`}::${recordYear(record)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(record);
  });
  return [...map.values()];
}
function cgpaFor(studentId, throughYear) {
  // Cumulative grade point average includes this and all earlier exam years,
  // never later/future years. Each saved subject currently has equal credit.
  const records = db.results.filter(record =>
    record.courseId === selectedCourse &&
    record.studentId === studentId &&
    recordYear(record) > 0 && recordYear(record) <= Number(throughYear)
  );
  if (!records.length) return 0;
  const totalGradePoints = records.reduce((sum, record) => sum + gradePoint(percentageOf(record)), 0);
  return totalGradePoints / records.length;
}
function showResults() {
  const records = db.results.filter(record =>
    record.courseId === selectedCourse &&
    Number(record.year) === selectedYear &&
    recordYear(record) === Number(selectedRecordYear)
  );
  const groups = grouped(records);
  if (!groups.length) {
    $('#resultRecords').innerHTML = `<div class="toolbar"><button class="btn success" data-action="download-result-pdf">Download Result PDF</button></div>` + emptyState('No results for this year', 'Add a result for the selected year.');
    return;
  }
  const rows = groups.map(group => {
    const student = db.students.find(item => item.id === group[0].studentId) || {};
    const cgpa = cgpaFor(group[0].studentId, selectedRecordYear);
    const passed = group.every(record => percentageOf(record) >= 40);
    return `<tr><td><b>${safe(student.name)}</b><br>${safe(student.roll)}</td><td>${recordYear(group[0])}</td><td>${group.map(record => `${safe(record.subject)}: ${record.marks}/${record.maximum || 100}`).join('<br>')}</td><td>${cgpa.toFixed(2)}</td><td><span class="badge ${passed ? 'paid' : 'pending'}">${passed ? 'PASS' : 'FAIL'}</span></td><td>${group.map(record => `<button class="btn small secondary" data-action="edit-result" data-id="${record.id}">Edit</button><button class="btn small danger" data-action="delete-result" data-id="${record.id}">Delete</button>`).join(' ')}</td></tr>`;
  }).join('');
  $('#resultRecords').innerHTML = `<div class="toolbar"><button class="btn success" data-action="download-result-pdf">Download Result PDF</button></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Year</th><th>Subjects & Marks</th><th>CGPA</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function downloadResultPDF() {
  const records = db.results.filter(record =>
    record.courseId === selectedCourse &&
    Number(record.year) === selectedYear &&
    recordYear(record) === Number(selectedRecordYear)
  );
  if (!records.length) { notify('No result records for this year'); return; }
  const html = grouped(records).map(group => {
    const student = db.students.find(item => item.id === group[0].studentId) || {};
    const cgpa = cgpaFor(group[0].studentId, selectedRecordYear);
    const passed = group.every(record => percentageOf(record) >= 40);
    return `<section><h1>CampusDesk — Student Result</h1><h2>${safe(courseCode(selectedCourse))}</h2><p>Course Year: ${selectedYear} | Exam Year: ${recordYear(group[0])}</p><p>Student: ${safe(student.name)} | Roll: ${safe(student.roll)}</p><table><tr><th>Subject</th><th>Max</th><th>Marks</th><th>Status</th></tr>${group.map(record => `<tr><td>${safe(record.subject)}</td><td>${record.maximum || 100}</td><td>${record.marks}</td><td>${percentageOf(record) >= 40 ? 'PASS' : 'FAIL'}</td></tr>`).join('')}</table><h3>CGPA: ${cgpa.toFixed(2)} | ${passed ? 'PASS' : 'FAIL'}</h3><p>Calculation: 10-point grade scale; equal subject credits.</p></section>`;
  }).join('');
  const printWindow = window.open('', '_blank');
  if (!printWindow) { notify('Allow pop-ups to print the PDF'); return; }
  printWindow.document.write(`<html><head><title>Results ${selectedRecordYear}</title><style>body{font-family:Arial;padding:25px}section{max-width:800px;margin:auto;page-break-after:always}h1,h2{text-align:center}table{width:100%;border-collapse:collapse}td,th{border:1px solid #555;padding:9px;text-align:left}</style></head><body>${html}<script>window.onload=()=>window.print()<\/script></body></html>`);
  printWindow.document.close();
}

function editResult(recordId) {
  const record = db.results.find(item => item.id === recordId);
  if (!record) return;
  const student = db.students.find(item => item.id === record.studentId);
  if (!student) return;
  const options = currentStudents().map(item => `<option value="${item.id}" ${item.id === record.studentId ? "selected" : ""}>${safe(item.roll)} — ${safe(item.name)}</option>`).join("");
  openModal("Edit Result Subject", form(`
    <div class="field full"><label>Student</label><select name="studentId" required>${options}</select></div>
    <div class="field"><label>Exam Year</label><select name="examYear">${Array.from({length:7},(_,i)=>2020+i).map(y=>`<option value="${y}" ${Number(record.examYear ?? selectedRecordYear)===y?"selected":""}>${y}</option>`).join("")}</select></div>
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


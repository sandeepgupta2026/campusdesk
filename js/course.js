/* Course section: functions used by the course page. */

function courseById(id) { return db.courses.find(course => course.id === id); }

function courseCode(id) { return courseById(id)?.code || "Unknown"; }

function courseYears(id) { return Number(courseById(id)?.duration || 3); }

function studentsForCourse(id) { return db.students.filter(student => student.courseId === id).length; }

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

function courseForm(course = null) {
  return form(field("Course Name", "name", "text", course?.name || "") + field("Course Code (e.g. BCA)", "code", "text", course?.code || "") + field("Duration (years)", "duration", "number", course?.duration || 3) + `<input type="hidden" name="formType" value="course"><input type="hidden" name="editId" value="${course?.id || ""}">`);
}


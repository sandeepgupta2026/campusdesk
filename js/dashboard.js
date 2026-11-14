/* Dashboard section: functions used by the dashboard page. */

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


render();

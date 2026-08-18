/* Injects the shared sidebar into every page. Each page sets
   <body data-page="dashboard"> (etc) to control which link is highlighted. */
(function () {
  const links = [
    { page: 'dashboard', href: '/index.html', icon: '⌂', label: 'Dashboard' },
    { page: 'library', href: '/library.html', icon: '📚', label: 'Curriculum Library' },
    { page: 'resources', href: '/resources.html', icon: '🔖', label: 'Resources' },
    { page: 'lessons', href: '/lessons.html', icon: '🗓', label: 'Lesson Planner' },
    { page: 'actionlab', href: '/actionlab.html', icon: '⚙', label: 'ActionLab' },
    { page: 'journal', href: '/journal.html', icon: '📝', label: 'Reflection Journal' },
    { page: 'vault', href: '/vault.html', icon: '🗄', label: 'Vault' },
    { page: 'habits', href: '/habits.html', icon: '🔥', label: 'Habit Tracker' },
  ];

  function render() {
    const current = document.body.dataset.page;
    const root = document.getElementById('sidebar-root');
    if (!root) return;
    const linksHtml = links
      .map(
        (l) => `<a class="nav-link ${l.page === current ? 'active' : ''}" href="${l.href}">
          <span class="nav-icon">${l.icon}</span>${l.label}
        </a>`
      )
      .join('');
    root.innerHTML = `
      <div class="sidebar">
        <div class="sidebar-brand">My Curriculum
          <span>Personal learning tracker</span>
        </div>
        ${linksHtml}
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', render);
})();

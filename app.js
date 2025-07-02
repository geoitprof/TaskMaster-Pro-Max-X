// Enhanced Task Management System
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.currentSort = 'createdAt-desc';
        this.searchQuery = '';
        this.editingTaskId = null;
        this.currentPage = 1;
        this.tasksPerPage = 5;
        this.confirmCallback = null;
        this.initializeEventListeners();
        this.render();
    }

    initializeEventListeners() {
        // Add task
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.currentPage = 1; // Reset to first page when searching
            this.render();
        });

        // Sort functionality
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.currentPage = 1; // Reset to first page when sorting
            this.render();
        });

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Modal events
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('saveEditBtn').addEventListener('click', () => this.saveEdit());
        // Confirmation modal events
        document.getElementById('closeConfirmModal').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('cancelConfirmBtn').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('okConfirmBtn').addEventListener('click', () => {
            if (this.confirmCallback) this.confirmCallback();
            this.closeConfirmModal();
        });
        // Click outside modal to close
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) {
                this.closeModal();
            }
        });
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('confirmModal')) {
                this.closeConfirmModal();
            }
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-mode');
                document.getElementById('themeLabel').textContent = 'Dark';
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                document.getElementById('themeLabel').textContent = 'Light';
                localStorage.setItem('darkMode', 'false');
            }
        });

        // Load saved theme
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').checked = true;
            document.getElementById('themeLabel').textContent = 'Dark';
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('prioritySelect').value;
        const text = input.value.trim();

        if (!text) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        const task = {
            id: this.generateId(),
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        input.value = '';
        document.getElementById('prioritySelect').value = 'low';
        this.currentPage = 1; // Reset to first page when adding
        this.render();
        this.showNotification('Task added successfully!', 'success');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.render();
            this.showNotification(task.completed ? 'Task completed! 🎉' : 'Task marked as pending', 'success');
        }
    }

    deleteTask(id) {
        this.showConfirmModal('Delete Task', 'Are you sure you want to delete this task?', () => {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            // Adjust current page if necessary
            const totalPages = this.getTotalPages();
            if (this.currentPage > totalPages && totalPages > 0) {
                this.currentPage = totalPages;
            }
            this.render();
            this.showNotification('Task deleted successfully!', 'success');
        });
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            document.getElementById('editTaskInput').value = task.text;
            document.getElementById('editPrioritySelect').value = task.priority;
            document.getElementById('editModal').style.display = 'block';
        }
    }

    saveEdit() {
        const text = document.getElementById('editTaskInput').value.trim();
        const priority = document.getElementById('editPrioritySelect').value;

        if (!text) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = text;
            task.priority = priority;
            this.saveTasks();
            this.render();
            this.closeModal();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingTaskId = null;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.currentPage = 1;
        this.render();
    }

    getFilteredTasks() {
        let filtered = this.tasks;
        // Filter
        switch (this.currentFilter) {
            case 'completed':
                filtered = filtered.filter(t => t.completed);
                break;
            case 'pending':
                filtered = filtered.filter(t => !t.completed);
                break;
            case 'high':
                filtered = filtered.filter(t => t.priority === 'high');
                break;
            case 'medium':
                filtered = filtered.filter(t => t.priority === 'medium');
                break;
            case 'low':
                filtered = filtered.filter(t => t.priority === 'low');
                break;
            default:
                break;
        }
        // Search
        if (this.searchQuery) {
            filtered = filtered.filter(t => t.text.toLowerCase().includes(this.searchQuery));
        }
        return filtered;
    }

    getSortedTasks(tasks) {
        const sorted = [...tasks];
        switch (this.currentSort) {
            case 'createdAt-asc':
                sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'createdAt-desc':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'priority-desc':
                sorted.sort((a, b) => this.priorityValue(b.priority) - this.priorityValue(a.priority));
                break;
            case 'priority-asc':
                sorted.sort((a, b) => this.priorityValue(a.priority) - this.priorityValue(b.priority));
                break;
            case 'alphabetical-asc':
                sorted.sort((a, b) => a.text.localeCompare(b.text));
                break;
            case 'alphabetical-desc':
                sorted.sort((a, b) => b.text.localeCompare(a.text));
                break;
            case 'completed-first':
                sorted.sort((a, b) => (b.completed === a.completed) ? 0 : b.completed ? 1 : -1);
                break;
            case 'pending-first':
                sorted.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
                break;
            default:
                break;
        }
        return sorted;
    }

    priorityValue(priority) {
        switch (priority) {
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    }

    getPaginatedTasks(tasks) {
        const start = (this.currentPage - 1) * this.tasksPerPage;
        return tasks.slice(start, start + this.tasksPerPage);
    }

    getTotalPages() {
        const filtered = this.getFilteredTasks();
        return Math.max(1, Math.ceil(filtered.length / this.tasksPerPage));
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        let filtered = this.getFilteredTasks();
        filtered = this.getSortedTasks(filtered);
        const totalTasks = filtered.length;
        const totalPages = this.getTotalPages();
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        const paginated = this.getPaginatedTasks(filtered);

        if (paginated.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No tasks found!</h3>
                    <p>${this.currentFilter === 'all' && !this.searchQuery ? 'Add your first task to get started' : 'Try adjusting your search, filter, or sort.'}</p>
                </div>
            `;
            this.renderPagination(0, 0, 0);
            return;
        }

        container.innerHTML = paginated.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="taskManager.toggleTask('${task.id}')">
                <div class="task-content">
                    <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                    <div class="task-meta">
                        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                        <span>Created: ${this.formatDate(task.createdAt)}</span>
                        ${task.completedAt ? `<span>Completed: ${this.formatDate(task.completedAt)}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" title="Edit Task" onclick="taskManager.editTask('${task.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm0 0V17h4" /></svg>
                    </button>
                    <button class="action-btn delete-btn" title="Delete Task" onclick="taskManager.deleteTask('${task.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        `).join('');
        this.renderPagination(this.currentPage, totalPages, totalTasks);
    }

    renderPagination(current, total, totalTasks) {
        const pag = document.getElementById('pagination');
        if (total <= 1) {
            pag.innerHTML = '';
            return;
        }
        let html = '';
        html += `<button class="pagination-btn" ${current === 1 ? 'disabled' : ''} onclick="taskManager.gotoPage(1)">&laquo;</button>`;
        html += `<button class="pagination-btn" ${current === 1 ? 'disabled' : ''} onclick="taskManager.gotoPage(${current - 1})">&lsaquo;</button>`;
        html += `<span class="pagination-info">Page ${current} of ${total} (${totalTasks} tasks)</span>`;
        html += `<button class="pagination-btn" ${current === total ? 'disabled' : ''} onclick="taskManager.gotoPage(${current + 1})">&rsaquo;</button>`;
        html += `<button class="pagination-btn" ${current === total ? 'disabled' : ''} onclick="taskManager.gotoPage(${total})">&raquo;</button>`;
        pag.innerHTML = html;
    }

    gotoPage(page) {
        this.currentPage = page;
        this.render();
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    render() {
        this.renderTasks();
        this.updateStats();
    }

    showNotification(message, type = 'success') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e53935' : '#4caf50'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 2px 8px rgba(10,34,89,0.13);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Data export/import for testing purposes
    exportData() {
        return JSON.stringify(this.tasks, null, 2);
    }

    importData(jsonData) {
        try {
            this.tasks = JSON.parse(jsonData);
            this.saveTasks();
            this.render();
            this.showNotification('Data imported successfully!', 'success');
        } catch (error) {
            this.showNotification('Invalid data format!', 'error');
        }
    }

    // Clear all tasks (for testing)
    clearAllTasks() {
        this.showConfirmModal('Clear All Tasks', 'Are you sure you want to delete all tasks? This cannot be undone!', () => {
            this.tasks = [];
            this.saveTasks();
            this.render();
            this.showNotification('All tasks cleared!', 'success');
        });
    }

    // Get statistics for reporting
    getDetailedStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const priorityStats = {
            high: this.tasks.filter(t => t.priority === 'high').length,
            medium: this.tasks.filter(t => t.priority === 'medium').length,
            low: this.tasks.filter(t => t.priority === 'low').length
        };

        return {
            total,
            completed,
            pending,
            completionRate,
            priorityStats
        };
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'block';
        this.confirmCallback = onConfirm;
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.confirmCallback = null;
    }
}

// Initialize the application
let taskManager;
document.addEventListener('DOMContentLoaded', function() {
    taskManager = new TaskManager();
    // Add some sample data for demonstration (only if no existing data)
    if (taskManager.tasks.length === 0) {
        const sampleTasks = [
            { id: 'sample1', text: 'Complete SDLC project documentation', priority: 'high', completed: false, createdAt: new Date().toISOString(), completedAt: null },
            { id: 'sample2', text: 'Review and test application features', priority: 'medium', completed: true, createdAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date().toISOString() },
            { id: 'sample3', text: 'Prepare presentation slides', priority: 'medium', completed: false, createdAt: new Date(Date.now() - 172800000).toISOString(), completedAt: null }
        ];
        taskManager.tasks = sampleTasks;
        taskManager.saveTasks();
        taskManager.render();
    }
    // PDF Report Download
    document.getElementById('downloadReportBtn').addEventListener('click', function() {
        const stats = taskManager.getDetailedStats();
        const tasks = taskManager.tasks;
        const doc = new window.jspdf.jsPDF();
        let y = 15;
        doc.setFontSize(18);
        doc.text('TaskMaster Pro Max X - Report', 10, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`Total Tasks: ${stats.total}`, 10, y);
        y += 7;
        doc.text(`Completed: ${stats.completed}`, 10, y);
        y += 7;
        doc.text(`Pending: ${stats.pending}`, 10, y);
        y += 7;
        doc.text(`Completion Rate: ${stats.completionRate}%`, 10, y);
        y += 10;
        doc.text('Tasks:', 10, y);
        y += 7;
        tasks.forEach((task, idx) => {
            if (y > 270) { doc.addPage(); y = 15; }
            doc.text(`${idx+1}. [${task.completed ? '✔' : ' '}] ${task.text} (${task.priority})`, 10, y);
            y += 7;
        });
        doc.save('TaskMasterProMaxX_Report.pdf');
    });
}); 
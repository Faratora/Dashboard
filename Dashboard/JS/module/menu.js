import { $, log } from './utils.js';
import { renderProjects } from './projects.js';
import { renderEmployees } from './employees.js';

export function initNavigation() {
    const navProjects = $('#nav-projects');
    const navEmployees = $('#nav-employees');
    const projectsContent = $('#projects-content');
    const employeesContent = $('#employees-content');

    if (!navProjects || !navEmployees || !projectsContent || !employeesContent) {
        log('Navigation elements not found');
        return;
    }

    navProjects.addEventListener('click', (e) => {
        e.preventDefault();
        projectsContent.style.display = 'block';
        employeesContent.style.display = 'none';
        navProjects.classList.add('active');
        navEmployees.classList.remove('active');
        log('Switched to Projects view');
        renderProjects();
    });

    navEmployees.addEventListener('click', (e) => {
        e.preventDefault();
        projectsContent.style.display = 'none';
        employeesContent.style.display = 'block';
        navEmployees.classList.add('active');
        navProjects.classList.remove('active');
        log('Switched to Employees view');
        
        const filterableColumns = ['name', 'surname', 'age', 'position', 'salary', 'estimatedPayment', 'project', 'estimatedIncome'];
        const thead = $('#employees-thead');
        filterableColumns.forEach((column) => {
            window[`filter_${column}`] = '';
            
            if (thead) {
                const th = thead.querySelector(`th[data-filter="${column}"]`);
                if (th) {
                    const filterIcon = th.querySelector('.filter-icon');
                    if (filterIcon) {
                        filterIcon.style.color = '';
                    }
                }
            }
        });
        
        const clearBtn = $('#clear-employee-filters-btn');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        renderEmployees();
    });

    function configureAddButton(buttonId, mode, openModalFn) {
        const button = $(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                const panelTitle = $('#panel-title');
                const projectFormFields = $('#project-form-fields');
                const employeeFormFields = $('#employee-form-fields');
                const submitBtn = $('#submit-btn');

                panelTitle.textContent = mode === 'project' ? 'Add New Project' : 'Add New Employee';
                projectFormFields.style.display = mode === 'project' ? 'block' : 'none';
                employeeFormFields.style.display = mode === 'project' ? 'none' : 'block';
                submitBtn.textContent = mode === 'project' ? 'Add Project' : 'Add Employee';

                if (openModalFn && typeof openModalFn === 'function') {
                    openModalFn();
                } else {
                    log(`openModalFn is not a function: ${openModalFn}`);
                }
            });
        }
    }

    configureAddButton('#add-project-btn', 'project', window.openAddProjectModal);
    configureAddButton('#add-employee-btn', 'employee', window.openAddEmployeeModal);
    
    log(`openAddProjectModal: ${typeof window.openAddProjectModal}`);
    log(`openAddEmployeeModal: ${typeof window.openAddEmployeeModal}`);
}

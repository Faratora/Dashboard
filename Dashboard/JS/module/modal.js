import { $, log } from './utils.js';
import { validateProject, validateEmployee } from './validator.js';
import { getProjects, getEmployees } from './dataStorage.js';

let editMode = null;
let editingId = null;
let currentProjectId = null;

function populateEmployeeProjectSelect() {
    const projectSelect = $('#employee-project');
    if (!projectSelect) return;

    projectSelect.innerHTML = '<option value="">Unassigned</option>';
    const projects = getProjects();
    projects.forEach((project) => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.projectName;
        projectSelect.appendChild(option);
    });
}

function openEmployeesModal(projectId) {
    const modalBackdrop = $('#employees-modal-backdrop');
    const modal = $('#employees-modal');
    const modalTitle = $('#employees-modal-title');
    const tbody = $('#project-employees-tbody');

    if (!modalBackdrop || !modal || !modalTitle || !tbody) {
        log('Employees modal elements not found');
        return;
    }

    currentProjectId = projectId;
    const projects = getProjects();
    const project = projects.find((p) => p.id === projectId);

    if (project) {
       log(`Opening employees modal for project: ${project.projectName}`);
        modalTitle.textContent = `Employees on ${project.projectName}`;
    }
// ${project.projectName}
    tbody.innerHTML = '';
    const allEmployees = getEmployees();
    const employees = allEmployees.filter((e) => e.project === project.id);

    if (employees.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="9" style="text-align: center; padding: 20px;">No employees assigned</td></tr>';
    } else {
        employees.forEach((employee) => {
            const capacity = employee.capacity || 1;
            const fit = employee.fit || 1;
            const vacationDays = employee.vacationDays || 0;
            
            // Vacation coefficient: (20 - vacationDays) / 20
            const vacationCoefficient = (20 - vacationDays) / 20;
            
            // Effective capacity: capacity × fit × vacation coefficient (3 decimal places)
            const effectiveCapacity = capacity * fit * vacationCoefficient;
            
            // Get project budget for revenue calculation
            const budget = project.budget || 0;
            const totalCapacity = project.employeeCapacity || 0;
            
            // Capacity for revenue = max(project capacity, sum of effective capacities of all employees)
            // We'll calculate this after summing all effective capacities
            // For now, calculate revenue per effective capacity unit
            // Revenue = (budget / capacityForRevenue) × effectiveCapacity
            
            // Cost: based on assigned capacity (salary)
            const cost = employee.salary || 0;
            
            // Revenue allocation: proportional to effective capacity
            // We need total effective capacity of all employees in this project
            const totalEffectiveCapacity = employees.reduce((sum, emp) => {
                const cap = emp.capacity || 1;
                const f = emp.fit || 1;
                const vac = emp.vacationDays || 0;
                return sum + cap * f * ((20 - vac) / 20);
            }, 0);
            
            const capacityForRevenue = Math.max(totalCapacity, totalEffectiveCapacity);
            let revenue = 0;
            if (capacityForRevenue > 0) {
                const revenuePerUnit = budget / capacityForRevenue;
                revenue = revenuePerUnit * effectiveCapacity;
            }
            
            // Profit = revenue - cost
            const profit = revenue - cost;
            
            // Profit color class
            const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="#" class="employee-link" data-id="${employee.id}">${employee.name} ${employee.surname}</a></td>
                <td>${capacity.toFixed(2)}</td>
                <td>${fit.toFixed(2)}</td>
                <td>${vacationDays}</td>
                <td>${effectiveCapacity.toFixed(3)}</td>
                <td>$${revenue.toFixed(2)}</td>
                <td>$${cost.toFixed(2)}</td>
                <td class="${profitClass}">$${profit.toFixed(2)}</td>
                <td>
                    <button class="modal-edit-employee change-btn" data-id="${employee.id}">Change</button>
                    <button class="modal-unassign-employee unassign-btn" data-id="${employee.id}">Unassign</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    modalBackdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        // Edit button handlers
        tbody.querySelectorAll('.modal-edit-employee').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const empId = e.target.dataset.id;
                const employee = allEmployees.find((emp) => emp.id === empId);
                if (employee) {
                    closeEmployeesModal();
                    window.openAddEmployeeEditModal(employee);
                }
            });
        });

        // Unassign button handlers
        tbody.querySelectorAll('.modal-unassign-employee').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const empId = e.target.dataset.id;
                if (window.editEmployeeCallback) {
                    const employee = allEmployees.find((emp) => emp.id === empId);
                    if (employee) {
                        window.editEmployeeCallback(empId, { ...employee, project: '' });
                    }
                }
                // Refresh modal
                openEmployeesModal(projectId);
            });
        });

        // Employee name click handler (could show details or edit)
        tbody.querySelectorAll('.employee-link').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const empId = e.target.dataset.id;
                const employee = allEmployees.find((emp) => emp.id === empId);
                if (employee) {
                    closeEmployeesModal();
                    window.openAddEmployeeEditModal(employee);
                }
            });
        });
    }, 0);
}

function closeEmployeesModal() {
    const modalBackdrop = $('#employees-modal-backdrop');
    const modal = $('#employees-modal');

    if (modalBackdrop && modal) {
        modalBackdrop.classList.add('hidden');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        currentProjectId = null;
    }
}

export function initModal() {
    const backdrop = $('#panel-backdrop');
    const panel = $('#add-project-panel');
    const closeBtn = $('#panel-close-btn');
    const cancelBtn = $('#cancel-panel-btn');
    const submitBtn = $('#submit-btn');
    const form = $('#add-project-form');
    const projectFormFields = $('#project-form-fields');
    const employeeFormFields = $('#employee-form-fields');

    if (!backdrop || !panel || !closeBtn || !cancelBtn || !submitBtn || !form) {
        log('Panel elements not found');
        return;
    }

    // Filter modal elements
    const filterBackdrop = $('#filter-backdrop');
    const filterModal = $('#filter-modal');
    const filterInput = $('#filter-input');
    const filterApplyBtn = $('#filter-apply-btn');
    const filterCancelBtn = $('#filter-cancel-btn');
    const filterModalClose = $('#filter-modal-close');
    let currentFilterColumn = null;

    const openFilterModal = (column, headerText) => {
        currentFilterColumn = column;
        const filterModalTitle = $('#filter-modal-title');
        if (filterModalTitle) {
            filterModalTitle.textContent = headerText || `Filter by ${column}`;
        }
        filterInput.value = '';
        filterInput.focus();
        filterBackdrop.classList.remove('hidden');
        filterModal.classList.remove('hidden');
    };

    const closeFilterModal = () => {
        filterBackdrop.classList.add('hidden');
        filterModal.classList.add('hidden');
        currentFilterColumn = null;
    };

    const applyFilter = () => {
        const filterValue = filterInput.value.trim();
        if (currentFilterColumn) {
            const filterEvent = new CustomEvent('applyColumnFilter', {
                detail: { column: currentFilterColumn, value: filterValue }
            });
            window.dispatchEvent(filterEvent);
        }
        closeFilterModal();
    };

    // Filter modal event listeners
    if (filterModalClose) {
        filterModalClose.addEventListener('click', closeFilterModal);
    }
    if (filterBackdrop) {
        filterBackdrop.addEventListener('click', closeFilterModal);
    }
    if (filterCancelBtn) {
        filterCancelBtn.addEventListener('click', closeFilterModal);
    }
    if (filterApplyBtn) {
        filterApplyBtn.addEventListener('click', applyFilter);
    }
    if (filterInput) {
        filterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                applyFilter();
            } else if (e.key === 'Escape') {
                closeFilterModal();
            }
        });
    }

    const openPanel = (mode = 'add') => {
        editMode = mode;
        const panelTitle = $('#panel-title');

        const allInputs = document.querySelectorAll('#add-project-form input, #add-project-form select');
        allInputs.forEach((input) => {
            input.style.borderColor = '#ddd';
            input.style.boxShadow = 'none';
        });
        const allErrors = document.querySelectorAll('.field-error');
        allErrors.forEach((err) => err.remove());

        backdrop.classList.remove('hidden');
        panel.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        if (projectFormFields && projectFormFields.style.display !== 'none') {
            panelTitle.textContent = mode === 'edit' ? 'Edit Project' : 'Add New Project';
            submitBtn.textContent = mode === 'edit' ? 'Update Project' : 'Add Project';
            // Run initial validation to set button state
            validateProject();
        } else if (employeeFormFields && employeeFormFields.style.display !== 'none') {
            panelTitle.textContent = mode === 'edit' ? 'Edit Employee' : 'Add New Employee';
            submitBtn.textContent = mode === 'edit' ? 'Update Employee' : 'Add Employee';
            // Run initial validation to set button state
            validateEmployee();
        }

        log('Panel opened in ' + mode + ' mode');
    };

    const closePanel = () => {
        editMode = null;
        editingId = null;
        backdrop.classList.add('hidden');
        panel.classList.add('hidden');
        form.reset();
        document.body.style.overflow = '';
        log('Panel closed');
    };

    const handleSubmit = () => {
        log('Form submit triggered');

        if (projectFormFields && projectFormFields.style.display !== 'none') {
            log('checking project form');
            if (!validateProject()) {
                log('project validation failed, returning');
                return;
            }
            log('project validation passed');

            const companyName = $('#company-name').value.trim();
            const projectName = $('#project-name').value.trim();
            const budget = $('#project-budget').value;
            const employeeCapacity = $('#employee-capacity').value;

            const projectData = {
                companyName: companyName,
                projectName: projectName,
                budget: parseFloat(budget),
                employeeCapacity: parseInt(employeeCapacity, 10),
            };

            if (editMode === 'edit' && editingId && window.editProjectCallback) {
                log('Editing project: ' + editingId);
                window.editProjectCallback(editingId, projectData);
            } else if (window.addProjectCallback) {
                log('Adding project: ' + JSON.stringify(projectData));
                window.addProjectCallback(projectData);
            } else {
                log('addProjectCallback not found');
            }
        } else if (employeeFormFields && employeeFormFields.style.display !== 'none') {
            if (!validateEmployee()) {
                return;
            }

            const name = $('#employee-name').value.trim();
            const surname = $('#employee-surname').value.trim();
            const birthDate = $('#employee-age').value;
            const position = $('#employee-position').value;
            const salary = $('#employee-salary').value;

            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }

            const projectSelect = $('#employee-project');
            const employeeData = {
                name: name,
                surname: surname,
                age: age,
                birthDate: birthDate,
                position: position,
                salary: parseFloat(salary),
                capacity: 1,
                fit: 1,
                vacationDays: 0,
                project: projectSelect ? projectSelect.value : '',
            };

            if (editMode === 'edit' && editingId && window.editEmployeeCallback) {
                log('Editing employee: ' + editingId);
                window.editEmployeeCallback(editingId, employeeData);
            } else if (window.addEmployeeCallback) {
                log('Adding employee: ' + JSON.stringify(employeeData));
                window.addEmployeeCallback(employeeData);
            } else {
                log('addEmployeeCallback not found');
            }
        }

        closePanel();
    };

    closeBtn.addEventListener('click', closePanel);
    cancelBtn.addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);
    submitBtn.addEventListener('click', handleSubmit);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
            closePanel();
        }
    });

    // Employees modal close buttons
    const employeesModalCloseX = $('#employees-modal-close-x');
    const employeesModalCloseBtn = $('#employees-modal-close-btn');
    const employeesModalBackdrop = $('#employees-modal-backdrop');

    if (employeesModalCloseX) {
        employeesModalCloseX.addEventListener('click', closeEmployeesModal);
    }
    if (employeesModalCloseBtn) {
        employeesModalCloseBtn.addEventListener('click', closeEmployeesModal);
    }
    if (employeesModalBackdrop) {
        employeesModalBackdrop.addEventListener('click', closeEmployeesModal);
    }

    // Listen for showProjectEmployees event
    window.addEventListener('showProjectEmployees', (e) => {
        log('showProjectEmployees event received for project: ' + e.detail.projectId);
        openEmployeesModal(e.detail.projectId);
    });

    // Filter modal event listeners
    if (filterBackdrop && filterModal && filterInput && filterApplyBtn && filterCancelBtn) {
        // Open filter modal on filter icon click
        document.querySelectorAll('th.filterable .filter-icon').forEach((icon) => {
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const th = icon.closest('th');
                const column = th.dataset.filter || th.dataset.sort;
                const headerText = th.textContent.replace('⌕', '').replace('⇅', '').trim();
                openFilterModal(column, headerText);
            });
        });
    }

    window.openAddProjectModal = () => openPanel('add');
window.openAddProjectEditModal = (project) => {
    // Ensure project form fields are visible
    const projectFormFields = $('#project-form-fields');
    const employeeFormFields = $('#employee-form-fields');
    if (projectFormFields && employeeFormFields) {
        projectFormFields.style.display = 'block';
        employeeFormFields.style.display = 'none';
    }
    openPanel('edit');
    editingId = project.id;
    $('#project-name').value = project.projectName;
    $('#company-name').value = project.companyName;
    $('#project-budget').value = project.budget;
    $('#employee-capacity').value = project.employeeCapacity;
};
    window.openAddEmployeeModal = () => {
        populateEmployeeProjectSelect();
        openPanel('add');
    };
    window.openAddEmployeeEditModal = (employee) => {
        // Ensure employee form fields are visible
        const projectFormFields = $('#project-form-fields');
        const employeeFormFields = $('#employee-form-fields');
        if (projectFormFields && employeeFormFields) {
            projectFormFields.style.display = 'none';
            employeeFormFields.style.display = 'block';
        }
        openPanel('edit');
        editingId = employee.id;
        $('#employee-name').value = employee.name;
        $('#employee-surname').value = employee.surname;
        $('#employee-age').value = employee.age;
        $('#employee-position').value = employee.position;
        const projectSelect = $('#employee-project');
        if (projectSelect) {
            projectSelect.value = employee.project || '';
        }
        $('#employee-salary').value = employee.salary;
    };

    // Assign Employee Modal
    const assignBackdrop = $('#assign-backdrop');
    const assignModal = $('#assign-modal');
    const assignEmployeeName = $('#assign-employee-name');
    const assignCurrentCapacity = $('#assign-current-capacity');
    const assignAvailableCapacity = $('#assign-available-capacity');
    const assignProjectSelect = $('#assign-project-select');
    const assignCapacitySlider = $('#assign-capacity-slider');
    const assignCapacityValue = $('#assign-capacity-value');
    const assignFitSlider = $('#assign-fit-slider');
    const assignFitValue = $('#assign-fit-value');
    const assignEffectiveCapacity = $('#assign-effective-capacity');
    const assignPredictedCapacity = $('#assign-predicted-capacity');
    const assignConfirmBtn = $('#assign-btn-confirm');
    const assignCancelBtn = $('#assign-btn-cancel');
    const assignModalClose = $('#assign-modal-close');

    let currentAssignEmployeeId = null;
    let currentAssignEmployee = null;
    let currentTotalCapacity = 0;

    const updateAssignCalculations = () => {
        const assignedCapacity = parseFloat(assignCapacitySlider.value) || 0;
        const fitCoefficient = parseFloat(assignFitSlider.value) || 1;
        const effectiveCapacity = assignedCapacity * fitCoefficient;
        const predictedTotal = currentTotalCapacity + effectiveCapacity;

        if (assignCapacityValue) assignCapacityValue.textContent = assignedCapacity.toFixed(1);
        if (assignFitValue) assignFitValue.textContent = fitCoefficient.toFixed(1);
        if (assignEffectiveCapacity) assignEffectiveCapacity.textContent = effectiveCapacity.toFixed(3);
        if (assignPredictedCapacity) assignPredictedCapacity.textContent = predictedTotal.toFixed(2);
        if (assignAvailableCapacity) {
            const available = Math.max(0, 1.5 - currentTotalCapacity);
            assignAvailableCapacity.textContent = `Available capacity: ${available.toFixed(2)}`;
        }
    };

    const openAssignModal = (employeeId) => {
        const employees = getEmployees();
        currentAssignEmployee = employees.find((e) => e.id === employeeId);
        currentAssignEmployeeId = employeeId;

        if (!currentAssignEmployee) return;

        currentTotalCapacity = parseFloat(currentAssignEmployee.assignedCapacity || 0);

        if (assignEmployeeName) {
            assignEmployeeName.textContent = `${currentAssignEmployee.name} ${currentAssignEmployee.surname}`;
        }

        if (assignCurrentCapacity) {
            assignCurrentCapacity.textContent = `Current total capacity: ${currentTotalCapacity.toFixed(2)} / 1.5`;
        }

        if (assignCapacitySlider) {
            assignCapacitySlider.value = currentAssignEmployee.capacity || 0.5;
        }
        if (assignFitSlider) {
            assignFitSlider.value = currentAssignEmployee.fit || 1.0;
        }

        if (assignProjectSelect) {
            const projects = getProjects();
            assignProjectSelect.innerHTML = '<option value="">-- Select Project --</option>';
            projects.forEach((project) => {
                const option = document.createElement('option');
                option.value = project.projectName;
                option.textContent = project.projectName;
                if (currentAssignEmployee.project === project.projectName) {
                    option.selected = true;
                }
                assignProjectSelect.appendChild(option);
            });
        }

        updateAssignCalculations();

        if (assignBackdrop) assignBackdrop.classList.remove('hidden');
        if (assignModal) assignModal.classList.remove('hidden');
    };

    const closeAssignModal = () => {
        if (assignBackdrop) assignBackdrop.classList.add('hidden');
        if (assignModal) assignModal.classList.add('hidden');
        currentAssignEmployeeId = null;
        currentAssignEmployee = null;
    };

    const handleAssignConfirm = () => {
        if (!currentAssignEmployee) return;

        const assignedCapacity = parseFloat(assignCapacitySlider.value) || 0;
        const fitCoefficient = parseFloat(assignFitSlider.value) || 1;
        const project = assignProjectSelect.value;

        const updatedEmployee = {
            ...currentAssignEmployee,
            capacity: assignedCapacity,
            fit: fitCoefficient,
            assignedCapacity: currentTotalCapacity + (assignedCapacity * fitCoefficient),
            project: project,
        };

        window.dispatchEvent(new CustomEvent('assignEmployee', {
            detail: { employeeId: currentAssignEmployeeId, employeeData: updatedEmployee }
        }));

        closeAssignModal();
    };

    if (assignCapacitySlider) {
        assignCapacitySlider.addEventListener('input', updateAssignCalculations);
    }
    if (assignFitSlider) {
        assignFitSlider.addEventListener('input', updateAssignCalculations);
    }
    if (assignConfirmBtn) {
        assignConfirmBtn.addEventListener('click', handleAssignConfirm);
    }
    if (assignCancelBtn) {
        assignCancelBtn.addEventListener('click', closeAssignModal);
    }
    if (assignModalClose) {
        assignModalClose.addEventListener('click', closeAssignModal);
    }
    if (assignBackdrop) {
        assignBackdrop.addEventListener('click', closeAssignModal);
    }

    window.addEventListener('showAssignEmployee', (e) => {
        const { employeeId } = e.detail;
        log('Opening assign modal for employee: ' + employeeId);
        openAssignModal(employeeId);
    });

    // Availability Modal
    const availabilityBackdrop = $('#availability-backdrop');
    const availabilityModal = $('#availability-modal');
    const availabilityModalTitle = $('#availability-modal-title');
    const availabilityMonth = $('#availability-month');
    const availabilityWorkingDays = $('#availability-working-days');
    const availabilityVacationDays = $('#availability-vacation-days');
    const calendarMonthYear = $('#calendar-month-year');
    const calendarGrid = $('#calendar-grid');
    const prevMonthBtn = $('#prev-month-btn');
    const nextMonthBtn = $('#next-month-btn');
    const setVacationBtn = $('#set-vacation-btn');
    const availabilityModalClose = $('#availability-modal-close');

    let currentAvailabilityEmployeeId = null;
    let currentAvailabilityEmployee = null;
    let currentCalendarMonth = null;
    let currentCalendarYear = null;
    let selectedVacationDays = [];
    let originalVacationDays = [];

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getWorkingDays = (month, year) => {
        let count = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
        }
        return count;
    };

    const renderCalendar = () => {
        if (!calendarGrid) return;

        calendarGrid.innerHTML = '';

        // Add day headers
        dayNames.forEach((day) => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
        const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
        const startDay = firstDay.getDay();

        // Empty cells for days before the first day
        for (let i = 0; i < startDay; i++) {
            const emptyCell = document.createElement('div');
            calendarGrid.appendChild(emptyCell);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;

            const date = new Date(currentCalendarYear, currentCalendarMonth, day);
            const dayOfWeek = date.getDay();
            const dateString = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Weekend
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayCell.classList.add('weekend');
            }

            // Vacation day
            const isVacation = selectedVacationDays.includes(dateString);
            if (isVacation) {
                dayCell.classList.add('vacation');
            }

            dayCell.addEventListener('click', () => {
                if (dayCell.classList.contains('vacation')) {
                    dayCell.classList.remove('vacation');
                    selectedVacationDays = selectedVacationDays.filter(d => d !== dateString);
                } else if (!dayCell.classList.contains('weekend')) {
                    dayCell.classList.add('vacation');
                    selectedVacationDays.push(dateString);
                }
                updateVacationCount();
                updateWorkingDays();
            });

            calendarGrid.appendChild(dayCell);
        }

        if (calendarMonthYear) {
            calendarMonthYear.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
        }
    };

    const openAvailabilityModal = (employeeId) => {
        const employees = getEmployees();
        currentAvailabilityEmployee = employees.find((e) => e.id === employeeId);
        currentAvailabilityEmployeeId = employeeId;

        if (!currentAvailabilityEmployee) return;

        log('Opening availability modal for employee: ' + employeeId);
        log('Employee vacationDays:', currentAvailabilityEmployee.vacationDays);

        // Set employee name
        if (availabilityModalTitle) {
            availabilityModalTitle.textContent = `${currentAvailabilityEmployee.name} ${currentAvailabilityEmployee.surname} - Availability`;
        }

        // Get current period
        const monthSelect = $('#month-select');
        const yearSelect = $('#year-select');
        const currentMonth = parseInt(monthSelect?.value || 4) - 1; // April by default
        const currentYear = parseInt(yearSelect?.value || 2026);

        currentCalendarMonth = currentMonth;
        currentCalendarYear = currentYear;

        // Set month info
        if (availabilityMonth) {
            availabilityMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        }

        // Get vacation days for current employee and save original
        originalVacationDays = Array.isArray(currentAvailabilityEmployee.vacationDays) 
            ? [...currentAvailabilityEmployee.vacationDays] 
            : [];
        selectedVacationDays = [...originalVacationDays];

        log('Loaded vacation days:', selectedVacationDays);

        // Update working days to reflect vacation selection
        updateWorkingDays();

        if (availabilityVacationDays) {
            availabilityVacationDays.textContent = `Vacation Days: ${selectedVacationDays.length} days selected`;
        }

        renderCalendar();

        if (availabilityBackdrop) availabilityBackdrop.classList.remove('hidden');
        if (availabilityModal) availabilityModal.classList.remove('hidden');
    };

    const closeAvailabilityModal = () => {
        if (availabilityBackdrop) availabilityBackdrop.classList.add('hidden');
        if (availabilityModal) availabilityModal.classList.add('hidden');
        currentAvailabilityEmployeeId = null;
        currentAvailabilityEmployee = null;
    };

    const handleSetVacation = () => {
        if (!currentAvailabilityEmployee) return;

        log('Setting vacation days:', selectedVacationDays);

        const updatedEmployee = {
            ...currentAvailabilityEmployee,
            vacationDays: selectedVacationDays,
        };

        window.dispatchEvent(new CustomEvent('setVacation', {
            detail: { employeeId: currentAvailabilityEmployeeId, employeeData: updatedEmployee }
        }));

        closeAvailabilityModal();
    };

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentCalendarMonth--;
            if (currentCalendarMonth < 0) {
                currentCalendarMonth = 11;
                currentCalendarYear--;
            }
            renderCalendar();
            updateVacationCount();
            updateWorkingDays();
            updateMonthInfo();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentCalendarMonth++;
            if (currentCalendarMonth > 11) {
                currentCalendarMonth = 0;
                currentCalendarYear++;
            }
            renderCalendar();
            updateVacationCount();
            updateWorkingDays();
            updateMonthInfo();
        });
    }

    if (setVacationBtn) {
        setVacationBtn.addEventListener('click', handleSetVacation);
    }

    if (availabilityModalClose) {
        availabilityModalClose.addEventListener('click', closeAvailabilityModal);
    }

    if (availabilityBackdrop) {
        availabilityBackdrop.addEventListener('click', closeAvailabilityModal);
    }

    const updateVacationCount = () => {
        if (availabilityVacationDays) {
            availabilityVacationDays.textContent = `Vacation Days: ${selectedVacationDays.length} days selected`;
        }
    };

    const updateWorkingDays = () => {
        if (availabilityWorkingDays) {
            const totalDays = getWorkingDays(currentCalendarMonth, currentCalendarYear);
            const remainingDays = totalDays - selectedVacationDays.length;
            availabilityWorkingDays.textContent = `Working Days: ${remainingDays}/${totalDays} days`;
        }
    };

    const updateMonthInfo = () => {
        if (availabilityMonth) {
            availabilityMonth.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
        }
        updateWorkingDays();
    };

    window.addEventListener('showAvailabilityCalendar', (e) => {
        const { employeeId } = e.detail;
        log('Opening availability calendar for employee: ' + employeeId);
        openAvailabilityModal(employeeId);
    });
}

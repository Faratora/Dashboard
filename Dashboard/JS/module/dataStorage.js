import { $, log, generateId, formatCurrency, escapeHtml } from './utils.js';

const STORAGE_KEY = 'monthlyData';

// Calculate weekdays in the current month
function getWeekdaysInMonth() {
    const period = getCurrentPeriod();
    const [year, month] = period.split('-').map(Number);
    // month is 1-indexed in our data, but Date expects 0-indexed
    const date = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let weekdays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        date.setDate(day);
        const dayOfWeek = date.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            weekdays++;
        }
    }
    return weekdays;
}

// Count vacation days that fall on weekdays in the current month
function getWeekdayVacationDays(vacationDays, year, month) {
    if (!Array.isArray(vacationDays) || vacationDays.length === 0) {
        return 0;
    }
    let weekdayVacations = 0;
    for (const vacDay of vacationDays) {
        const vacDate = new Date(vacDay);
        // Check if this vacation day is in the current month
        if (vacDate.getFullYear() === year && vacDate.getMonth() + 1 === month) {
            const dayOfWeek = vacDate.getDay();
            // Only count if it's a weekday (Mon-Fri)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                weekdayVacations++;
            }
        }
    }
    return weekdayVacations;
}

export function getCurrentPeriod() {
    const monthSelect = $('#month-select');
    const yearSelect = $('#year-select');
    const month = monthSelect ? monthSelect.value : null;
    const year = yearSelect ? yearSelect.value : null;

    if (!month || !year) {
        return new Date().getFullYear() + '-' + (new Date().getMonth() + 1);
    }
    return `${year}-${month}`;
}

export function getMonthData() {
    const data = loadData();
    const period = getCurrentPeriod();
    if (!data.monthlyData[period]) {
        data.monthlyData[period] = { employees: [], projects: [] };
        saveData(data);
    }
    return data.monthlyData[period];
}

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return { monthlyData: {} };
        }
    }
    return { monthlyData: {} };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addProject(projectData) {
    log('addProject called');
    const data = loadData();
    const period = getCurrentPeriod();
    log('Period: ' + period);

    if (!data.monthlyData[period]) {
        data.monthlyData[period] = { employees: [], projects: [] };
    }

    const newProject = {
        id: generateId(),
        companyName: projectData.companyName,
        projectName: projectData.projectName,
        budget: parseFloat(projectData.budget) || 0,
        employeeCapacity: parseInt(projectData.employeeCapacity) || 0,
        employees: [],
        estimatedIncome: 0,
    };

    data.monthlyData[period].projects.push(newProject);
    saveData(data);

    return newProject;
}

export function deleteProject(id) {
    const data = loadData();
    const period = getCurrentPeriod();
    // Find project to get its name before deleting
    const project = data.monthlyData[period].projects.find((p) => p.id === id);
    const projectName = project ? project.projectName : null;
    
    data.monthlyData[period].projects = data.monthlyData[period].projects.filter((p) => p.id !== id);
    // Unassign employees from this project (match by project name, not id)
    if (projectName) {
        data.monthlyData[period].employees = data.monthlyData[period].employees.filter((e) => e.project !== projectName);
    }
    saveData(data);
}

export function updateProject(id, projectData) {
    const data = loadData();
    const period = getCurrentPeriod();
    const project = data.monthlyData[period].projects.find((p) => p.id === id);
    if (project) {
        Object.assign(project, projectData);
        saveData(data);
    }
}

export function getProjects() {
    return getMonthData().projects;
}

export function addEmployee(employeeData) {
    log('addEmployee called');
    const data = loadData();
    const period = getCurrentPeriod();

    if (!data.monthlyData[period]) {
        data.monthlyData[period] = { employees: [], projects: [] };
    }

    const newEmployee = {
        id: generateId(),
        name: employeeData.name,
        surname: employeeData.surname,
        age: parseInt(employeeData.age),
        birthDate: employeeData.birthDate,
        position: employeeData.position,
        salary: parseFloat(employeeData.salary) || 0,
        capacity: 1,
        fit: 1,
        vacationDays: [],
        project: employeeData.project || '',
        assignedCapacity: 0,
    };

    data.monthlyData[period].employees.push(newEmployee);
    saveData(data);

    return newEmployee;
}

export function deleteEmployee(id) {
    const data = loadData();
    const period = getCurrentPeriod();
    data.monthlyData[period].employees = data.monthlyData[period].employees.filter((e) => e.id !== id);
    saveData(data);
}

export function updateEmployee(id, employeeData) {
    const data = loadData();
    const period = getCurrentPeriod();
    const employeeIndex = data.monthlyData[period].employees.findIndex((e) => e.id === id);
    if (employeeIndex !== -1) {
        Object.assign(data.monthlyData[period].employees[employeeIndex], employeeData);
        saveData(data);
    }
}

export function getEmployees() {
    const period = getCurrentPeriod();
    const monthData = getMonthData();
    const employees = [...monthData.employees];

    // Calculate estimatedIncome for each employee using weekday-based vacation calculation
    const projects = getProjects();
    const [currentYear, currentMonth] = period.split('-').map(Number);
    const weekdaysInMonth = getWeekdaysInMonth();

    return employees.map((emp) => {
        if (!emp.project) {
            // Bench cost: salary × 0.5 for unassigned employees
            const benchCost = (emp.salary || 0) * 0.5;
            // Bench profit = 0 revenue - bench cost = negative profit
            const benchProfit = 0 - benchCost;
            return { ...emp, estimatedIncome: 0, estimatedPayment: benchCost, profit: benchProfit };
        }

        const project = projects.find((p) => p.projectName === emp.project);
        if (!project) {
            // Bench cost: salary × 0.5 for employees without valid project
            const benchCost = (emp.salary || 0) * 0.5;
            const benchProfit = 0 - benchCost;
            return { ...emp, estimatedIncome: 0, estimatedPayment: benchCost, profit: benchProfit };
        }

        // Calculate total effective capacity for the project using weekday-based calculation
        const projectEmployees = employees.filter((e) => e.project === emp.project);
        const totalEffectiveCapacity = projectEmployees.reduce((sum, e) => {
            const capacity = e.capacity || 1;
            const fit = e.fit || 1;
            const weekdayVacations = getWeekdayVacationDays(e.vacationDays, currentYear, currentMonth);
            const vacationCoefficient = weekdaysInMonth > 0 
                ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth 
                : 0;
            return sum + capacity * fit * vacationCoefficient;
        }, 0);

        // Capacity for revenue = max(project capacity, total effective capacity used)
        const projectCapacity = project.employeeCapacity || 0;
        const capacityForRevenue = Math.max(projectCapacity, totalEffectiveCapacity);

        // If no capacity, no revenue
        if (capacityForRevenue === 0) {
            // Cost: salary × max(0.5, capacity) even when no revenue
            const empCapacity = emp.capacity || 1;
            const cost = (emp.salary || 0) * Math.max(0.5, empCapacity);
            // Profit = 0 revenue - cost
            const profit = 0 - cost;
            return { ...emp, estimatedIncome: 0, estimatedPayment: cost, profit };
        }

        // Revenue per effective capacity = budget ÷ capacity for revenue
        const revenuePerEffectiveCapacity = project.budget / capacityForRevenue;

        // Calculate this employee's effective capacity using weekday-based calculation
        const empCapacity = emp.capacity || 1;
        const empFit = emp.fit || 1;
        const empWeekdayVacations = getWeekdayVacationDays(emp.vacationDays, currentYear, currentMonth);
        const empVacationCoefficient = weekdaysInMonth > 0 
            ? (weekdaysInMonth - empWeekdayVacations) / weekdaysInMonth 
            : 0;
        const empEffectiveCapacity = empCapacity * empFit * empVacationCoefficient;

        // Employee's revenue = revenue per effective capacity × employee's effective capacity
        const estimatedIncome = revenuePerEffectiveCapacity * empEffectiveCapacity;
        
        // Cost: salary × max(0.5, capacity) for assigned employees
        const cost = (emp.salary || 0) * Math.max(0.5, empCapacity);
        const estimatedPayment = cost;

        // Profit = revenue - cost
        const profit = estimatedIncome - cost;

        return { ...emp, estimatedIncome, estimatedPayment, profit };
    });
}

export { formatCurrency, escapeHtml, getWeekdaysInMonth, getWeekdayVacationDays };

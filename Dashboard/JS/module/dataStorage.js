import { $, log, generateId, formatCurrency, escapeHtml } from './utils.js';

const STORAGE_KEY = 'monthlyData';


function getWeekdaysInMonth() {
    const period = getCurrentPeriod();
    const [year, month] = period.split('-').map(Number);
    
    const date = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let weekdays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        date.setDate(day);
        const dayOfWeek = date.getDay();
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            weekdays++;
        }
    }
    return weekdays;
}


function getWeekdayVacationDays(vacationDays, year, month) {
    if (!Array.isArray(vacationDays) || vacationDays.length === 0) {
        return 0;
    }
    let weekdayVacations = 0;
    for (const vacDay of vacationDays) {
        const vacDate = new Date(vacDay);
        
        if (vacDate.getFullYear() === year && vacDate.getMonth() + 1 === month) {
            const dayOfWeek = vacDate.getDay();
            
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
        // Fallback to current date
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        return `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    }
    return `${year}-${month}`;
}

export function getMonthData() {
    const data = loadData();
    const period = getCurrentPeriod();
    const monthData = data.monthlyData?.[period];
    
    if (!monthData) {
        // Initialize empty structure for this period
        console.warn('[DataStorage] No data for period:', period);
        const emptyData = { projects: [], employees: [] };
        if (data.monthlyData) {
            data.monthlyData[period] = emptyData;
            saveData(data);
        }
        return emptyData;
    }
    return monthData;
}

function loadData() {
<<<<<<< HEAD
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
               
                const period = getCurrentPeriod();
                if (!parsed.monthlyData[period]) {
                    parsed.monthlyData[period] = initializeSampleData();
                    saveData(parsed);
                }
                return parsed;
            } catch {
                const period = getCurrentPeriod();
                return { monthlyData: { [period]: initializeSampleData() } };
=======
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
           
            const period = getCurrentPeriod();
            if (!parsed.monthlyData[period]) {
                
                parsed.monthlyData[period] = initializeSampleData();
                saveData(parsed);
>>>>>>> parent of 6989b6e (fix: Initializing sample data when localStorage is empty + IndexedDB error handling)
            }
        }
        
        const period = getCurrentPeriod();
        return { monthlyData: { [period]: initializeSampleData() } };
    } catch (error) {
        console.error('[DataStorage] localStorage error:', error);
        // Fallback: return empty data structure
        const period = getCurrentPeriod();
        return { monthlyData: { [period]: { projects: [], employees: [] } } };
    }
<<<<<<< HEAD
}

function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('[DataStorage] Failed to save data:', error);
    }
=======
    
    const period = getCurrentPeriod();
    return { monthlyData: { [period]: initializeSampleData() } };
>>>>>>> parent of 6989b6e (fix: Initializing sample data when localStorage is empty + IndexedDB error handling)
}

function initializeSampleData() {
    const sampleProjects = [
        {
            id: generateId(),
            companyName: 'TechCorp Inc.',
            projectName: 'E-Commerce Platform',
            budget: 150000,
            employeeCapacity: 3,
            estimatedIncome: 0,
        },
        {
            id: generateId(),
            companyName: 'DataFlow Systems',
            projectName: 'Analytics Dashboard',
            budget: 85000,
            employeeCapacity: 2,
            estimatedIncome: 0,
        },
    ];

    const sampleEmployees = [
        {
            id: generateId(),
            name: 'John',
            surname: 'Smith',
            age: 28,
            birthDate: '1996-03-15',
            position: 'Senior',
            salary: 5500,
            capacity: 1,
            fit: 1,
            vacationDays: [],
            project: 'E-Commerce Platform',
            assignedCapacity: 0,
        },
        {
            id: generateId(),
            name: 'Sarah',
            surname: 'Johnson',
            age: 32,
            birthDate: '1992-07-22',
            position: 'Lead',
            salary: 7200,
            capacity: 1,
            fit: 1,
            vacationDays: [],
            project: 'E-Commerce Platform',
            assignedCapacity: 0,
        },
        {
            id: generateId(),
            name: 'Mike',
            surname: 'Williams',
            age: 25,
            birthDate: '1999-11-08',
            position: 'Middle',
            salary: 4200,
            capacity: 1,
            fit: 1,
            vacationDays: [],
            project: 'Analytics Dashboard',
            assignedCapacity: 0,
        },
        {
            id: generateId(),
            name: 'Emily',
            surname: 'Brown',
            age: 30,
            birthDate: '1994-05-30',
            position: 'Senior',
            salary: 5800,
            capacity: 1,
            fit: 1,
            vacationDays: [],
            project: '',
            assignedCapacity: 0,
        },
    ];

    return {
        projects: sampleProjects,
        employees: sampleEmployees,
    };
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
    
    const project = data.monthlyData[period].projects.find((p) => p.id === id);
    const projectName = project ? project.projectName : null;
    
    data.monthlyData[period].projects = data.monthlyData[period].projects.filter((p) => p.id !== id);
    
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

export function addAssignment(id, projectName, capacity, fit) {
    const data = loadData();
    const period = getCurrentPeriod();
    const employee = data.monthlyData[period].employees.find((e) => e.id === id);
    
    if (!employee) return null;

    if (!employee.assignments) {
        employee.assignments = [];
    }

    const existingAssignmentIndex = employee.assignments.findIndex((a) => a.projectName === projectName);
    
    if (existingAssignmentIndex !== -1) {
        employee.assignments[existingAssignmentIndex] = { projectName, capacity, fit };
    } else {
        employee.assignments.push({ projectName, capacity, fit });
    }

    saveData(data);
    return employee;
}

export function removeAssignment(id, projectName) {
    const data = loadData();
    const period = getCurrentPeriod();
    const employee = data.monthlyData[period].employees.find((e) => e.id === id);
    
    if (!employee) return null;

    if (employee.assignments) {
        employee.assignments = employee.assignments.filter((a) => a.projectName !== projectName);
    }

    saveData(data);
    return employee;
}

function calculateTotalAssignedCapacity(employee, currentYear, currentMonth, weekdaysInMonth) {
   
    if (!employee.project) {
        return 0;
    }

    const capacity = employee.capacity || 1;
    const fit = employee.fit || 1;
    const weekdayVacations = getWeekdayVacationDays(employee.vacationDays || [], currentYear, currentMonth);
    const vacationCoefficient = weekdaysInMonth > 0
        ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth
        : 0;

   
    return capacity * fit * vacationCoefficient;
}

export function getEmployees() {
    const period = getCurrentPeriod();
    const monthData = getMonthData();
    const employees = [...monthData.employees];

    
    const projects = getProjects();
    const [currentYear, currentMonth] = period.split('-').map(Number);
    const weekdaysInMonth = getWeekdaysInMonth();

    return employees.map((emp) => {
       
        const assignedCapacity = calculateTotalAssignedCapacity(emp, currentYear, currentMonth, weekdaysInMonth);
        
        let age = emp.age;
        if (emp.birthDate) {
            const birth = new Date(emp.birthDate);
            const today = new Date();
            age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
        }

        const assignments = emp.assignments || [];
        
        if (assignments.length === 0) {
            
            const benchCost = (emp.salary || 0) * 0.5;
            const benchProfit = 0 - benchCost;
            return { ...emp, age, assignedCapacity: 0, estimatedIncome: 0, estimatedPayment: benchCost, profit: benchProfit };
        }

        const totalProfit = assignments.reduce((sum, assignment) => {
            const project = projects.find((p) => p.projectName === assignment.projectName);
            if (!project) return sum;

            const projectEmployees = employees.flatMap(e => (e.assignments || []).map(a => ({
                ...e,
                assignedProject: a.projectName,
                capacity: a.capacity,
                fit: a.fit,
                vacationDays: e.vacationDays
            }))).filter(e => e.assignedProject === assignment.projectName);
            
            const totalEffectiveCapacity = projectEmployees.reduce((sum, e) => {
                const weekdayVacations = getWeekdayVacationDays(e.vacationDays, currentYear, currentMonth);
                const vacationCoefficient = weekdaysInMonth > 0 
                    ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth 
                    : 0;
                return sum + (e.capacity || 1) * (e.fit || 1) * vacationCoefficient;
            }, 0);

            const projectCapacity = project.employeeCapacity || 0;
            const capacityForRevenue = Math.max(projectCapacity, totalEffectiveCapacity);

            if (capacityForRevenue === 0) {
                return sum;
            }

            const revenuePerEffectiveCapacity = project.budget / capacityForRevenue;

            const empEffectiveCapacity = assignment.capacity * assignment.fit * 
                (weekdaysInMonth > 0 ? (weekdaysInMonth - getWeekdayVacationDays(emp.vacationDays, currentYear, currentMonth)) / weekdaysInMonth : 0);

            const estimatedIncome = revenuePerEffectiveCapacity * empEffectiveCapacity;
            const cost = (emp.salary || 0) * Math.max(0.5, assignment.capacity);
            const profit = estimatedIncome - cost;

            return sum + profit;
        }, 0);

        const totalEstimatedIncome = assignments.reduce((sum, assignment) => {
            const project = projects.find((p) => p.projectName === assignment.projectName);
            if (!project) return sum;
        
            const projectEmployees = employees.flatMap(e => (e.assignments || []).map(a => ({
                ...e,
                assignedProject: a.projectName,
                capacity: a.capacity,
                fit: a.fit,
                vacationDays: e.vacationDays
            }))).filter(e => e.assignedProject === assignment.projectName);
            
            const totalEffectiveCapacity = projectEmployees.reduce((sum, e) => {
                const weekdayVacations = getWeekdayVacationDays(e.vacationDays, currentYear, currentMonth);
                const vacationCoefficient = weekdaysInMonth > 0 
                    ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth 
                    : 0;
                return sum + (e.capacity || 1) * (e.fit || 1) * vacationCoefficient;
            }, 0);

            const projectCapacity = project.employeeCapacity || 0;
            const capacityForRevenue = Math.max(projectCapacity, totalEffectiveCapacity);

            if (capacityForRevenue === 0) return sum;

            const revenuePerEffectiveCapacity = project.budget / capacityForRevenue;

            const empEffectiveCapacity = assignment.capacity * assignment.fit * 
                (weekdaysInMonth > 0 ? (weekdaysInMonth - getWeekdayVacationDays(emp.vacationDays, currentYear, currentMonth)) / weekdaysInMonth : 0);

            return sum + (revenuePerEffectiveCapacity * empEffectiveCapacity);
        }, 0);

        const totalCost = (emp.salary || 0) * Math.max(0.5, assignedCapacity);

        return { ...emp, age, assignedCapacity, estimatedIncome: totalEstimatedIncome, estimatedPayment: totalCost, profit: totalProfit };
    });
}

function calculateAssignedCapacity(employee, currentYear, currentMonth, weekdaysInMonth) {
   
    if (!employee.project) {
        return 0;
    }

    const capacity = employee.capacity || 1;
    const fit = employee.fit || 1;
    const weekdayVacations = getWeekdayVacationDays(employee.vacationDays || [], currentYear, currentMonth);
    const vacationCoefficient = weekdaysInMonth > 0
        ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth
        : 0;

   
    return capacity * fit * vacationCoefficient;
}

export { formatCurrency, escapeHtml, getWeekdaysInMonth, getWeekdayVacationDays };

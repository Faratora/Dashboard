import { $, log } from './utils.js';

export function validateProject() {
    let isValid = true;
    clearValidationErrors();
    
    const projectName = $('#project-name');
    const companyName = $('#company-name');
    const projectBudget = $('#project-budget');
    const employeeCapacity = $('#employee-capacity');
    
    if (!projectName || !projectName.value.trim()) {
        showFieldError(projectName, 'Project Name is required');
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(projectName.value.trim())) {
        showFieldError(projectName, 'Project Name must contain only letters');
        isValid = false;
    }
    
    if (!companyName || !companyName.value.trim()) {
        showFieldError(companyName, 'Company Name is required');
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(companyName.value.trim())) {
        showFieldError(companyName, 'Company Name must contain only letters');
        isValid = false;
    }
    
    if (!projectBudget || !projectBudget.value) {
        showFieldError(projectBudget, 'Budget is required');
        isValid = false;
    } else if (parseFloat(projectBudget.value) <= 0) {
        showFieldError(projectBudget, 'Budget must be greater than 0');
        isValid = false;
    }
    
    if (!employeeCapacity || !employeeCapacity.value) {
        showFieldError(employeeCapacity, 'Employee Capacity is required');
        isValid = false;
    } else if (parseInt(employeeCapacity.value, 10) <= 0) {
        showFieldError(employeeCapacity, 'Employee Capacity must be greater than 0');
        isValid = false;
    }
    
    if (!isValid) {
        log('Project validation failed');
    }
    
    return isValid;
}

export function validateEmployee() {
    let isValid = true;
    clearValidationErrors();
    
    const name = $('#employee-name');
    const surname = $('#employee-surname');
    const birthDate = $('#employee-age');
    const position = $('#employee-position');
    const salary = $('#employee-salary');
    
    if (!name || !name.value.trim()) {
        showFieldError(name, 'Name is required');
        isValid = false;
    } else if (name.value.trim().length < 3) {
        showFieldError(name, 'Name must be at least 3 characters');
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(name.value.trim())) {
        showFieldError(name, 'Name must contain only letters');
        isValid = false;
    }
    
    if (!surname || !surname.value.trim()) {
        showFieldError(surname, 'Surname is required');
        isValid = false;
    } else if (surname.value.trim().length < 3) {
        showFieldError(surname, 'Surname must be at least 3 characters');
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(surname.value.trim())) {
        showFieldError(surname, 'Surname must contain only letters');
        isValid = false;
    }
    
    if (!birthDate || !birthDate.value) {
        showFieldError(birthDate, 'Date of Birth is required');
        isValid = false;
    } else {
        const birth = new Date(birthDate.value);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        if (age < 18) {
            showFieldError(birthDate, 'Employee must be at least 18 years old');
            isValid = false;
        }
    }
    
    if (!position || !position.value) {
        showFieldError(position, 'Position is required');
        isValid = false;
    }
    
    if (!salary || !salary.value) {
        showFieldError(salary, 'Salary is required');
        isValid = false;
    } else if (parseFloat(salary.value) < 0) {
        showFieldError(salary, 'Salary must be non-negative');
        isValid = false;
    }
    
    if (!isValid) {
        log('Employee validation failed');
    }
    
    return isValid;
}

function showFieldError(field, message) {
    if (!field) return;
    
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = 'color: #cc0000; font-size: 12px; margin-top: 4px; font-weight: bold;';
    errorDiv.textContent = message;
    
    field.parentElement.appendChild(errorDiv);
    field.style.borderColor = '#cc0000';
    
    const handler = function() {
        field.style.borderColor = '#ddd';
        field.style.boxShadow = 'none';
        const error = field.parentElement.querySelector('.field-error');
        if (error) {
            error.remove();
        }
    };
    
    field.addEventListener('input', handler);
    field.addEventListener('change', handler);
}

function clearValidationErrors() {
    const errors = document.querySelectorAll('.field-error');
    errors.forEach(e => e.remove());
    
    const inputs = document.querySelectorAll('#add-project-form input, #add-project-form select');
    inputs.forEach(input => {
        input.style.borderColor = '#ddd';
    });
}

export function setupInputRestrictions() {
    const letterFields = [
        'project-name',
        'company-name', 
        'employee-name',
        'employee-surname'
    ];
    
    letterFields.forEach(id => {
        const field = $(`#${id}`);
        if (field) {
            field.addEventListener('keydown', (e) => {
                const key = e.key;
                if (/[0-9]/.test(key)) {
                    e.preventDefault();
                    showFieldError(field, 'Numbers are not allowed');
                }
            });
            
            field.addEventListener('input', (e) => {
                const oldValue = e.target.value;
                const newValue = oldValue.replace(/[0-9]/g, '');
                if (oldValue !== newValue) {
                    e.target.value = newValue;
                    showFieldError(field, 'Numbers are not allowed');
                } else if (/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(newValue) && newValue.length >= 3) {
                    const error = field.parentElement.querySelector('.field-error');
                    if (error && error.textContent === 'Numbers are not allowed') {
                        error.remove();
                        field.style.borderColor = '#ddd';
                    }
                }
            });
        }
    });
    
    setupRealTimeValidation();
}

function setupRealTimeValidation() {
    const projectFields = ['project-name', 'company-name', 'project-budget', 'employee-capacity'];
    const employeeFields = ['employee-name', 'employee-surname', 'employee-age', 'employee-position', 'employee-salary'];
    
    projectFields.forEach(id => {
        const field = $(`#${id}`);
        if (field) {
            field.addEventListener('input', () => validateProject());
            field.addEventListener('blur', () => validateProject());
        }
    });
    
    employeeFields.forEach(id => {
        const field = $(`#${id}`);
        if (field) {
            field.addEventListener('input', () => validateEmployee());
            field.addEventListener('blur', () => validateEmployee());
        }
    });
}
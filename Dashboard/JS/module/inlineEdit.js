import { $, log } from './utils.js';
import { getEmployees } from './dataStorage.js';

let renderEmployeesCallback = null;


export function setRenderCallback(renderFn) {
    renderEmployeesCallback = renderFn;
}

const POSITIONS = ['Junior', 'Middle', 'Senior', 'Lead', 'Architect', 'BO'];


export function handleInlineEdit(employeeId, field, employee) {
    log(`Inline edit started for employee ${employeeId}, field: ${field}`);

    const row = $(`tr[data-id="${employeeId}"]`);
    if (!row) return;

    const cell = row.querySelector(field === 'position' ? '.position-cell' : '.salary-cell');
    if (!cell) return;

    
    cell.classList.add('editing');

    const currentValue = field === 'position' ? employee.position : employee.salary;

    let input;
    if (field === 'position') {
        
        input = document.createElement('select');
        input.className = 'edit-input';

        POSITIONS.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos;
            option.textContent = pos;
            if (pos === currentValue) {
                option.selected = true;
            }
            input.appendChild(option);
        });
    } else {
        
        input = document.createElement('input');
        input.type = 'number';
        input.className = 'edit-input';
        input.value = currentValue;
        input.step = '0.01';
        input.min = '0';
    }

    const pencil = cell.querySelector('.edit-pencil');
    if (pencil) pencil.style.display = 'none';

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();

    const removeEditing = () => {
        cell.classList.remove('editing');
    };

    const saveEdit = () => {
        const newValue = field === 'position' ? input.value : parseFloat(input.value);

        if (field === 'position' && newValue) {
            const updatedEmployee = { ...employee, position: newValue };
            window.dispatchEvent(new CustomEvent('inlineEditEmployee', {
                detail: { employeeId, employeeData: updatedEmployee }
            }));
        } else if (field === 'salary' && newValue >= 0) {
            const updatedEmployee = { ...employee, salary: newValue };
            window.dispatchEvent(new CustomEvent('inlineEditEmployee', {
                detail: { employeeId, employeeData: updatedEmployee }
            }));
        }
    };

    input.addEventListener('blur', () => {
        saveEdit();
        removeEditing();
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
            removeEditing();
        } else if (e.key === 'Escape') {
            removeEditing();
            if (renderEmployeesCallback) {
                renderEmployeesCallback();
            }
        }
    });
}

/*
 * Attaches pencil click listeners to employee table
 */
export function initInlineEditListeners() {
    document.addEventListener('click', (e) => {
        
        if (e.target.classList.contains('edit-pencil')) {
            e.stopPropagation();
            const field = e.target.dataset.field;
            const employeeId = e.target.dataset.id;

            const employees = getEmployees();
            const employee = employees.find(emp => emp.id === employeeId);

            if (employee) {
                handleInlineEdit(employeeId, field, employee);
            }
        }
        
        else if (e.target.classList.contains('position-value') || e.target.closest('.position-cell')) {
            const positionCell = e.target.closest('.position-cell');
            if (!positionCell) return;
            
            
            if (e.target.classList.contains('edit-pencil')) return;
            if (positionCell.querySelector('.edit-input')) return;
            
            const employeeId = positionCell.closest('tr')?.dataset.id;
            if (!employeeId) return;

            const employees = getEmployees();
            const employee = employees.find(emp => emp.id === employeeId);

            if (employee && employee.position) {
                handleInlineEdit(employeeId, 'position', employee);
            }
        }
    });
}

export { POSITIONS };

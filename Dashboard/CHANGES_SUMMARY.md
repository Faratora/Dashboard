# Fix: Employee Filters Only Apply on Manual Search (⌕) Click

## Problem
When clicking the Employees navigation button, the Employees window was opening with previously applied column filters already active. The filtering behavior was not intuitive - filters should only apply when the user explicitly clicks the search (⌕) button and confirms the filter.

## Root Cause
Column-specific filter values (`window.filter_*`) were persisting in memory across page navigation. When `renderEmployees()` was called (on initial load or nav button click), it would read these persisted filter values and apply them automatically via `sortAndFilterEmployees()`.

## Solution
Modified two files to clear column filters when the Employees view is loaded:

### 1. JS/module/employees.js
**Function:** `initEmployees()`
- Added code to clear all column filter values (`window.filter_name`, `window.filter_surname`, etc.)
- Added code to reset filter icon colors (removes green color from ⌕ icons)
- This ensures clean initial state on page load

### 2. JS/module/menu.js  
**Function:** `initNavigation()` → Employees nav button click handler
- Added code to clear all column filter values when switching to Employees view
- Added code to reset filter icon colors
- Added code to hide the "Clear Filters" button (✕) since no filters are active
- This ensures filters are cleared each time user navigates to Employees, giving them a clean slate

## Behavior After Fix

| Action | Result |
|--------|--------|
| Click Employees nav button | Shows ALL employees, no filters applied |
| Click ⌕ on column header | Opens filter modal |
| Type filter and click Apply | Filter is applied, ⌕ icon turns green |
| Switch to Projects then back to Employees | Filters are cleared, all employees shown again |
| Click ✕ Clear Filters button | All filters cleared (sort state remains) |

## Files Modified
- `JS/module/employees.js` - Added filter clearing in `initEmployees()`
- `JS/module/menu.js` - Added filter clearing in Employees nav button handler

## Testing
Manual testing steps:
1. Open the application
2. Navigate to Employees → all employees shown (no filters)
3. Click ⌕ on a column header (e.g., Name)
4. Type a filter value and click Apply → table filtered, icon turns green
5. Click Projects nav button → switch to Projects view
6. Click Employees nav button → ALL employees shown again, filter cleared, icon no longer green

## Compatibility
- No breaking changes to existing functionality
- Sort state continues to persist across navigation (as expected)
- Clear Filters (✕) button continues to work as before
- All other filter interactions (project filter, inline edit, etc.) unaffected

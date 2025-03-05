import { SecurityCategory } from "../types/security";
import { loadAllSecurityChecklists } from "./checklist-loader";

// Initialize with empty categories that will be populated asynchronously
export const initialSecurityData: SecurityCategory[] = [];

// Load security checklists asynchronously
async function initializeSecurityData() {
  try {
    const checklists = await loadAllSecurityChecklists();
    // Replace all items in the array while keeping the same reference
    initialSecurityData.splice(0, initialSecurityData.length, ...checklists);
    console.log('Security checklists loaded successfully:', 
      checklists.length, 'checklists,',
      checklists.reduce((total, cat) => total + cat.items.length, 0), 'items');
  } catch (error) {
    console.error('Failed to initialize security checklists:', error);
  }
}

// Call the initialization function when the module is loaded
initializeSecurityData();


import { SecurityCategory } from '../types/security';

// Function to load a JSON checklist file
export async function loadSecurityChecklist(checklistId: string): Promise<SecurityCategory> {
  try {
    const data = await import(`./checklists/${checklistId}.json`);
    return data as unknown as SecurityCategory;
  } catch (error) {
    console.error(`Failed to load security checklist ${checklistId}:`, error);
    throw new Error(`Failed to load security checklist ${checklistId}`);
  }
}

// Load all security checklists
export async function loadAllSecurityChecklists(): Promise<SecurityCategory[]> {
  const checklistFiles = [
    'authentication',
    'browsing',
    'email',
    'mobile',
    'social',
    'wallet',
    'os',
    'defi',
    'jobs',
    'developers'
  ];
  
  try {
    const checklists = await Promise.all(
      checklistFiles.map(async (file) => {
        try {
          return await loadSecurityChecklist(file);
        } catch (error) {
          console.error(`Error loading checklist ${file}:`, error);
          // Return a minimal valid category to prevent application crash
          return {
            id: file,
            title: `${file.charAt(0).toUpperCase() + file.slice(1)} Security`,
            description: 'Error loading checklist',
            icon: 'alert-triangle',
            items: []
          };
        }
      })
    );
    
    return checklists;
  } catch (error) {
    console.error('Failed to load security checklists:', error);
    return [];
  }
}

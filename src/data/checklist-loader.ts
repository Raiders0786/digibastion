
import { SecurityCategory } from '../types/security';

// Function to load a JSON checklist file
export async function loadSecurityChecklist(checklistId: string): Promise<SecurityCategory> {
  try {
    const data = await import(`./checklists/${checklistId}.json`);
    return data as unknown as SecurityCategory;
  } catch (error) {
    console.error(`Failed to load security checklist ${checklistId}:`, error);
    return {
      id: checklistId,
      title: `Failed to load ${checklistId}`,
      description: 'Error loading checklist data. Please check the console for details.',
      icon: 'alert-triangle',
      items: []
    };
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
  
  const checklists = await Promise.all(
    checklistFiles.map(file => loadSecurityChecklist(file))
  );
  
  return checklists;
}

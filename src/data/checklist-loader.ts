
import { SecurityCategory } from '../types/security';

// Function to load a JSON checklist file
export async function loadSecurityChecklist(checklistId: string): Promise<SecurityCategory> {
  try {
    // Use dynamic import with explicit path to ensure proper loading
    // This helps Vite/Webpack resolve the files correctly
    let data;
    
    // Handle each category explicitly to avoid path resolution issues
    switch(checklistId) {
      case 'authentication':
        data = await import('./checklists/authentication.json');
        break;
      case 'browsing':
        data = await import('./checklists/browsing.json');
        break;
      case 'email':
        data = await import('./checklists/email.json');
        break;
      case 'mobile':
        data = await import('./checklists/mobile.json');
        break;
      case 'social':
        data = await import('./checklists/social.json');
        break;
      case 'wallet':
        data = await import('./checklists/wallet.json');
        break;
      case 'os':
        data = await import('./checklists/os.json');
        break;
      case 'defi':
        data = await import('./checklists/defi.json');
        break;
      case 'jobs':
        data = await import('./checklists/jobs.json');
        break;
      case 'developers':
        data = await import('./checklists/developers.json');
        break;
      default:
        throw new Error(`Unknown category: ${checklistId}`);
    }
    
    return data.default as SecurityCategory;
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
    
    // Log successful loading for debugging
    console.log('Security checklists loaded successfully:', 
      checklists.length, 'checklists,',
      checklists.reduce((total, cat) => total + cat.items.length, 0), 'items');
    
    return checklists;
  } catch (error) {
    console.error('Failed to load security checklists:', error);
    return [];
  }
}

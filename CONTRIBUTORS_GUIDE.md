
# Contributor's Guide to Digibastion

Thank you for your interest in contributing to Digibastion! This guide will help you make contributions even if you have little to no coding experience.

## How to Contribute

### Adding Security Tools

To add a new security tool to our collection:

1. Navigate to `src/data/links/json/` and find the appropriate category file (e.g., `applicationSecurity.json`)
2. Open the file and add your new tool following this template:

```json
{
  "title": "Your Tool Name",
  "url": "https://tool-website.com",
  "description": "A brief description of the tool (200 characters or less)",
  "tags": ["relevant", "tags", "here"],
  "lastReviewed": "YYYY-MM-DD",
  "active": true
}
```

3. Add this entry to the "tools" array in the JSON file
4. Save the file and submit your PR!

### Adding Security Checklist Items

To add a new checklist item:

1. Navigate to `src/data/checklists/` and open the relevant checklist file (e.g., `email.json`)
2. Add your new item following this template:

```json
{
  "id": "unique-id",
  "title": "Short Title",
  "description": "Brief one-line description",
  "completed": false,
  "level": "essential", // or "recommended" or "optional"
  "details": "More detailed explanation of the security measure",
  "links": [
    { "text": "Resource Name", "url": "https://resource-url.com" }
  ]
}
```

3. Add this entry to the "items" array
4. Save the file and submit your PR!

### Creating a New Category

To create an entirely new category:

1. For security tools: Create a new file in `src/data/links/json/` named `yourCategoryName.json`
2. For security checklists: Create a new file in `src/data/checklists/` named `yourCategoryName.json`
3. Use the following template, filling in your own content:

#### For Security Tools:
```json
{
  "name": "Your Category Name",
  "description": "A description of what this category covers",
  "tools": [
    {
      "title": "First Tool Name",
      "url": "https://tool-website.com",
      "description": "Tool description",
      "tags": ["tag1", "tag2"],
      "lastReviewed": "YYYY-MM-DD",
      "active": true
    }
    // Add more tools as needed
  ]
}
```

#### For Security Checklists:
```json
{
  "id": "your-category-id",
  "title": "Your Category Title",
  "description": "Brief description of the category",
  "icon": "icon-name", // Choose from Lucide icon names
  "longDescription": "A longer, more detailed description of what this category covers",
  "items": [
    {
      "id": "item-1",
      "title": "First Item Title",
      "description": "Brief description",
      "completed": false,
      "level": "essential",
      "details": "Detailed explanation"
    }
    // Add more items as needed
  ]
}
```

4. After creating the file, you need to add it to the loader lists:
   - For security tools: Add your filename to `categoryFiles` in `src/data/links/loaders.ts`
   - For security checklists: Add your filename to `checklistFiles` in `src/data/checklist-loader.ts`

### Contributing Articles

To add a new article:

1. Create a new file in `src/data/articles/json/` named `your-article-slug.json`
2. Use the following template:

```json
{
  "title": "Your Article Title",
  "category": "Category Name",
  "readTime": "X min read",
  "sections": [
    {
      "type": "introduction",
      "title": "Introduction",
      "content": "Your introduction paragraph goes here."
    },
    {
      "type": "section",
      "title": "First Section Title",
      "content": "Section content goes here."
    },
    {
      "type": "tip",
      "title": "Pro Tip",
      "content": "Your tip content goes here."
    }
    // Add more sections as needed
  ]
}
```

3. Add your article metadata to `src/data/articles/index.json`

## Testing Your Changes

After making your changes, it's a good idea to verify they appear correctly:

1. If you're familiar with GitHub, create a fork and run the project locally
2. If not, you can simply create a pull request and our team will review your changes

## Need Help?

If you're stuck or have questions, feel free to:
- Open an issue on GitHub describing your problem
- Reach out to the team at raiders@digibastion.com

Thank you for helping improve Digibastion!

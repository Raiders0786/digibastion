# Guide for Updating Existing Content

This guide provides instructions for contributors who want to update or improve existing content in the Digibastion project.

## Table of Contents

- [Updating Security Items](#updating-security-items)
- [Improving Existing Categories](#improving-existing-categories)
- [Enhancing Tool References](#enhancing-tool-references)
- [Updating Blog/Article Content](#updating-blogarticle-content)
- [Workflow for Contributors](#workflow-for-contributors)
- [Validation and Testing](#validation-and-testing)

## Updating Security Items

Security items are the core of our checklist. To update an existing item:

1. **Locate the Item**: Find the relevant category file in `src/data/categories/`.

2. **Make Your Improvements**:
   - Update the description to be more clear
   - Add new references or resources
   - Enhance the actions with more detailed steps
   - Update priority level if needed (must be one of: 'essential', 'recommended', 'advanced')

3. **Maintain Structure**: Ensure you preserve the required properties:
   ```typescript
   {
     id: 'existing-id', // DO NOT CHANGE existing IDs
     title: 'Updated Title',
     priority: 'essential', 
     description: 'Improved description',
     level: 'essential', // Must match priority
     details: 'Enhanced detailed explanation',
     // Other properties...
   }
   ```

4. **Run Validation**: After updating, run `npm run validate` to ensure your changes maintain data integrity.

## Improving Existing Categories

To improve an entire category:

1. **Update Category Metadata**: You can enhance the category description or long description to provide better context.

2. **Reorganize Items**: You may reorder items to improve the logical flow (by modifying their array order).

3. **Split or Combine Items**: If an item covers too many concepts, consider splitting it. If multiple items overlap significantly, consider combining them.

4. **Update Threat Level Mappings**: After modifying items, check `src/data/threatProfiles.ts` to ensure threat level mappings are still appropriate.

## Enhancing Tool References

To update tool references in the resource links:

1. **Locate Tool Categories**: Find the appropriate file in `src/data/links/categories/`.

2. **Update Tool Information**:
   - Ensure URLs are current and working
   - Update descriptions to be more accurate or comprehensive
   - Add new tags to improve searchability
   - Update "lastReviewed" date

3. **Verify Active Status**: Set the `active` property to `false` if a tool is deprecated or no longer recommended.

## Updating Blog/Article Content

To update existing blog posts or articles:

1. **Locate the Article**: Find the article in `src/data/articles.tsx`.

2. **Improve Content**:
   - Update information to reflect current best practices
   - Fix any factual errors or outdated references
   - Enhance explanations or add clarifying examples
   - Update links to point to more current resources

3. **Maintain JSX Format**: Remember that article content is in JSX format, so use React elements for formatting.

## Workflow for Contributors

Follow this general workflow when updating content:

1. **Create a Feature Branch**: 
   ```bash
   git checkout -b update/descriptive-name
   ```

2. **Make Focused Changes**: Keep your updates focused on a specific category or topic.

3. **Test Your Changes**: Run the application locally to see how your changes look:
   ```bash
   npm run dev
   ```

4. **Run Validation**: Ensure data integrity:
   ```bash
   npm run validate
   ```

5. **Submit a Pull Request**: Provide a clear description of your changes and why they improve the project.

## Validation and Testing

Before submitting changes:

1. **Check for Type Errors**: Run TypeScript validation:
   ```bash
   npm run type-check
   ```

2. **Verify Build**: Ensure the application builds successfully:
   ```bash
   npm run build
   ```

3. **Visual Inspection**: Manually check how your changes look in the UI.

4. **Data Integrity**: Use the validation utilities in `src/utils/validateData.ts` to check for data consistency issues.

5. **Cross-Reference**: Ensure your changes don't conflict with related content in other sections.

Thank you for contributing to making Digibastion more comprehensive and accurate!

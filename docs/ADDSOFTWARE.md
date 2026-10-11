# Add Software

1. Create a new folder for the software in `src/markdown/software`.
2. Add the markdown files for the software within that folder. The page template reads two fields from the top of each file:

   ```
   ---
   title: ""
   slug: "/software/link_to_software"
   ---
   ```

3. Open `src/data/site/software.js`.
4. Add the item to an existing category or create a new category:

   ```javascript
   {
     name: '',
     description: '',
   },
   ```

   The software list links each item to `/software/<slug>/`. The slug is derived from `name` (spaces and slashes become hyphens, lower case), so `Volume Rover` links to `/software/volume-rover/`. Two optional fields change that:

   - `slug`: use this slug instead of the derived one.
   - `href`: link to an external page instead (opens in a new tab); no markdown page is needed.

5. Make the markdown `slug` match the link: `/software/<slug>`.
6. Run `npm test` (it checks that every item without `href` has a page), then follow the build and deployment instructions in README.md.

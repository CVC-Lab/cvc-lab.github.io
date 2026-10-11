# Add Project Page

1. Create a new folder for the project in `src/markdown/projects`.
2. Add a markdown file for the project within that folder. The page template reads two fields from the top of the file:

   ```
   ---
   title: ""
   slug: "/projects/link_to_project"
   ---
   ```

3. Add the tile image (`.png`, `.jpg` or `.jpeg`) directly in `src/images/project_tiles/`, `src/images/publications/` or `src/images/projects/`. Tile images are resolved by `src/hooks/useCardImages.js`, which only looks directly inside those three directories; an image anywhere else must be added by path to the `listed` filter in that file, or the tile shows no image.
4. Open `src/data/site/projects.js`.
5. Add an entry to the list:

   ```javascript
   {
     name: '',
     description: '',
     img_name: 'project_tiles/file_name', // path under src/images, without the extension
     link: '/projects/link_to_project/',
     tags: [], // free-text labels shown on the tile and matched by the search box
     themes: ['Healthcare AI'], // required: one or more of 'Healthcare AI', 'World Models', 'AI for Science'
     date: 'YYYY-MM-DD',
   },
   ```

   - `themes` selects the tabs on `/projects/` where the tile appears.
   - `date` orders the tiles (newest first); projects dated before 2023 are listed under past projects.
   - Optional `featuredRank` (1, 2, 3, ...) puts the tile in the featured row at the top of `/projects/`, in that order.

6. Run `npm test` (it checks the fields, the themes, the link and the image), then follow the build and deployment instructions in README.md.

# Add News

1. If the item gets its own page, add a markdown file in `src/markdown/news` (or `src/markdown/seminars` for a seminar). The page template reads two fields from the top of the file:

   ```
   ---
   title: ""
   slug: "/link_to_news"
   ---
   ```

2. Open `src/data/site/news.js`.
3. Add an entry to the list:

   ```javascript
   {
     name: '',
     description: '',
     category: 'news', // 'news' or 'seminars'; it selects the tab on /news/
     link: '/link_to_news/', // internal path with a trailing slash, or null when there is no page
     date: 'YYYY-MM-DD',
   },
   ```

   An entry may also set `featured: true`, which highlights it in the list.

4. Run `npm test` (it checks the date format and that internal links resolve), then follow the build and deployment instructions in README.md.

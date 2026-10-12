# Add People

1. Add the portrait to `src/images/people/`. Without a portrait, leave `image` out (or use `placeholder.png`) and the card shows the placeholder.
2. Open `src/data/site/people.js`.
3. Add an entry to the list:

   ```javascript
   {
     name: '',
     image: 'file_name.png', // file name inside src/images/people
     position: 'PhD Student',
     status: 'current', // 'current' or 'alumni'; it selects the tab on /people/
     url: 'https://...', // optional profile page; the name on /people/ links to it
   },
   ```

4. The group a person appears in on `/people/` is derived from `position` by `groupKeyFor()` in `src/components/cards.js`: positions mentioning "graduate" (but not "undergraduate") or "PhD" go to Graduate Students, `Undergraduate Student` and `High School Student` to their own groups, "Director" or "Principal Investigator" to Principal Investigator, "Researcher" (but not "Postdoctoral") or "Research Scientist" to Researchers, and everything else to Staff & Postdocs. Within a group, people are sorted by `POSITION_ORDER` in the same file, then by name.
5. Run `npm test` (it checks the status and that the portrait exists), then follow the build and deployment instructions in README.md.

This application runs with nodejs in terminal.

Get started:
- In your terminal, `cd` to this directory and run command `npm i` to install dependencies.
- After finished installing, run command `node buildSiteMap <domain> <max_depth>` to run this application.
    - For example, `node buildSiteMap www.mozilla.org 2`
- The app will log each fetched link.
- If errors occur, each error will be logged in the errors.txt in this directory.
- A json file named sitemap.json will be created in this directory after the site map is built successfully.

Note:
- This application is single-threaded. 
- I suggest running the application with small max_depth, i.e. max_depth < 3, with large sites.


Author: Huiling Wu
Email: huwu55@gmail.com
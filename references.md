Non-exhaustive list of references for refactoring Floorplan
=========

*Michael Adams, unquietwiki.com; Winter/Spring 2018 (Updated May 2020)*

## Materials

### Books & References

- "Learning NodeJS Development" by Andrew Mead; 2018 edition
- http://2ality.com/index.html
- http://eloquentjavascript.net/
- http://exploringjs.com/
- https://developer.mozilla.org/en-US/docs/Web/JavaScript
- https://en.wikibooks.org/wiki/JavaScript/
- https://github.com/AlbertoMontalesi/JavaScript-es6-and-beyond-ebook
- https://www.javascriptmancy.com/
- https://www.w3schools.com/

### General

- http://blog.revathskumar.com/2016/02/browserify-with-gulp.html
- http://rkulla.blogspot.com/2014/04/using-browserify-with-jquery-backbonejs.html
- https://benmccormick.org/2015/07/06/backbone-and-es6-classes-revisited/
- https://codeburst.io/es5-vs-es6-with-example-code-9901fa0136fc
- https://css-tricks.com/using-svg/
- https://dmitripavlutin.com/6-ways-to-declare-javascript-functions/
- https://esdiscuss.org/topic/moduleimport
- https://hacks.mozilla.org/2015/08/es6-in-depth-subclassing/
- https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/
- https://medium.com/@timoxley/named-exports-as-the-default-export-api-670b1b554f65
- https://medium.com/making-internets/why-using-chain-is-a-mistake-9bc1f80d51ba
- https://medium.freecodecamp.org/here-are-examples-of-everything-new-in-ecmascript-2016-2017-and-2018-d52fa3b5a70e
- https://stackoverflow.com/questions/9329446/for-each-over-an-array-in-javascript
- https://stackoverflow.com/questions/16646526/what-is-the-difference-between-el-and-el-in-backbone-js-views?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
- https://stackoverflow.com/questions/30767928/accesing-handlebars-variable-via-javascript
- https://stackoverflow.com/questions/34338411/how-to-import-jquery-using-es6-syntax
- https://stackoverflow.com/questions/42637630/does-jshint-support-async-await
- https://www.codeproject.com/Articles/1237571/Build-a-Prototype-Web-Based-Diagramming-App-with-S
- https://www.sitepoint.com/preparing-ecmascript-6-let-const/
- https://zendev.com/2018/05/09/understanding-spread-operator-in-javascript.html

### Express / Feathers / Handlebars

- http://derpturkey.com/handlebars-templates-with-express-4/
- http://expressjs.com/en/guide/writing-middleware.html
- http://handlebarsjs.com/
- https://blog.risingstack.com/your-first-node-js-http-server/
- https://docs.feathersjs.com/api/express.html
- https://expressjs.com/en/guide/migrating-4.html
- https://github.com/barc/express-hbs
- https://gorrion.io/blog/use-feathersjs-to-build-rest-and-socket-io-api/
- https://www.terlici.com/2014/09/29/express-router.html

### Other Dependencies

- https://standardjs.com/ (JavaScript Standard Style)
- http://backbonejs.org/ (front-end events)
- https://parceljs.org/ (front-end packaging)
- http://svgjs.com/ (not really used ATM)
- http://www.camintejs.com/ (database ORM)
- https://github.com/ajacksified/Mediator.js (async events)
- https://github.com/benmosher/eslint-plugin-import (linter)
- https://github.com/blueimp (multiple deps)
- https://github.com/DylanPiercey/join-url (url fixing)
- https://github.com/lorenwest/node-config/ (NodeJS configuration)
- https://github.com/marcuswestin/store.js/ (was used before)
- https://github.com/moxystudio/js-proper-url-join (supposed to fix URLs)
- https://github.com/senchalabs/connect (NodeJS middleware)
- https://github.com/sindresorhus/got (HTTP request)
- https://github.com/winstonjs/winston/ (NodeJS logger)
- https://jquery.com/ & https://jqueryui.com/ (front-end visuals)

## Database

### Database format from Ben Hutchinson

From May 2018...

"desk is a non-negative integer (it's the index into the SEATS subarray found at the top of each SVG file in views/maps)
tags is an array of strings which indicates which departments the person belongs to (see enumeration of possible values in TAG_NAMES in public/scripts/ListPane.js)"

{
   "_id":ObjectId("5201db41f5f4be9ae57e37a9"),
   "fullname":"Ben Hutchison",
   "desk":71,
   "office":"mv3",
   "email":"ben",
   "title":"Senior Software Engineer",
   "tags":[
      "eng"
   ],
   "linkedInId":"in/aldaviva",
   "mobilePhone":"REDACTED",
   "workPhone":"REDACTED"
}

### Proposed Caminite Schema (needs work)

const people = schema.define('People', {
  fullname: { type: schema.String, limit: 255 },
  desk: { type: schema.String, limit: 255 },
  office: { type: schema.String, limit: 255 },
  email: { type: schema.String, limit: 255 },
  title: { type: schema.String, limit: 255 },
  tags: { type: schema.String, limit: 255 },
  linkedInId: { type: schema.String, limit: 255 },
  mobilePhone: { type: schema.String, limit: 255 },
  workPhone: { type: schema.String, limit: 255 }
})

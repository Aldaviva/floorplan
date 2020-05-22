# Floorplan

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/1c0bf95e2fdc495da0f117f6f0b33302)](https://app.codacy.com/manual/unquietwiki/floorplan?utm_source=github.com&utm_medium=referral&utm_content=unquietwiki/floorplan&utm_campaign=Badge_Grade_Dashboard)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Apache License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Where do people sit in what offices? What's that person's name, whose face I remember but never really met? I've heard of this person, but I don't know their face. Where are the different teams grouped? What is A2's email address? Originally designed for use at [Blue Jeans](https://www.bluejeans.com/), but modified by others as well.

![Floorplan](https://aldaviva.com/portfolio/artwork/floorplan.jpg)
![Floorplan Admin](https://aldaviva.com/portfolio/artwork/floorplan-admin.jpg)

## Prerequisites

* [Node &ge; 12+](https://nodejs.org/)
* [MongoDB &ge; 3.6+](https://www.mongodb.com/download-center?jmp=nav#community)
* [Graphicsmagick](http://www.graphicsmagick.org/) or [Imagemagick](https://www.imagemagick.org/)

## Install

1. Use the appropriate shell (On Windows, use the Node.JS command prompt), to chdir to where you want to run this software. Clone the GitHub repository, and install the dependencies.

```bash
// git clone https://github.com/Aldaviva/floorplan.git (Original)
git clone https://github.com/unquietwiki/floorplan.git (This fork)
cd floorplan
npm install
```

1. Copy the example configuration file to your own version for modification.

    cp config/default.example.json config/default.json

1. You may edit the configuration file and change any settings you want, although the server will run with the default settings.

    * **`baseURL`** is the expected location to be displaying this content. It's passed along to the HTML template files as a "base" value.
    * **`companyName`** is the company / organization for the map software user.
    * **`dbHost`** is the host on which the MongoDB server runs. Useful if you have a MongoDB server on a different computer. With the default value of `"localhost"`, the MongoDB server is on the same computer as Floorplan.
    * **`dbName`** is the name of the MongoDB database that will be used to store people added to Floorplan. Useful if you want to run multiple different Floorplan instances on the same MongoDB server. With the default value of `"floorplan"`, people documents will be stored in the `people` collection of the `floorplan` database in your MongoDB server.
    * **`dbPort`** is the TCP port on which the MongoDB server listens. Useful if you have a non-default MongoDB configuration. With the default value of `27017`, Floorplan will connect to a MongoDB server with a default configuration.
    * **`dirData`** is the directory you keep photos and such in. It defaults to `"/opt/floorplan/data"`.
    * **`dirMaps`** is the directory you keep map / layout files in. It defaults to `"/opt/floorplan/data/maps/default"`.
    * **`dirPublic`** is the directory you keep styles and front-end files in. It defaults to `"/opt/floorplan/public"`.
    * **`dirRoot`** is the directory you're going to be running Floorplan in. It defaults to `"/opt/floorplan"`.
    * **`logFile`** is the location of the logfile for the server. It defaults to `"/var/log/floorplan.log"`.
    * **`logLevel`** is set per [Winston logging levels](https://github.com/winstonjs/winston/tree/3.0.0#logging-levels)
    * **`wwwPort`** is the TCP port you wish to run the NodeJS instance on. It defaults to `"3001"`.
    * **`supportContact`** is an email/phone number of someone you'd like to respond to problems with the application / map content.
    * **`depTeams`** is an array of department / team `ID`s, with additional `name` parameters.
    * **`offices`** is an array of `officeID` locations, with additional parameters for `name`, `address`, `phone`, `fax`, and `email`.

1. Set permissions so the server can write to the directories where CSS stylesheets and people's photos are saved. Adjust this per your configuration needs.

    chmod +rwx data/photos

1. If you want to connect to the database yourself, you can run
        mongo floorplan
            > db.people.find()

## Run

[`nodemon`](https://nodemon.io/) is used to check for changes in certain filetypes, and auto-restarts Node when changes are detected. If any of the JS files are changed, you'll need to stop and restart Parcel / Node (at least until [the Parcel API](https://parceljs.org/api.html) middleware is made use-of).

npm start

Use `Ctrl+C` to stop.

## Usage

### Viewing the Floorplan

Go to [`http://localhost:3001`](http://localhost:3001) in your web browser. You should see a blue page that says "MV" in the top left.

### Adding people

Go to [`http://localhost:3001/admin/`](http://localhost:3001/admin/) in your web browser. You should see a white page that says "add person" in the top left.

Fill in the person's full name and any other details you want to set, then click the blue Save button.

Now when you view the Floorplan, the new person should appear in the list to the left and, if you assigned an office and seat, their photo will appear in their seating position.

### Adding offices

1. Go to the directory you specified for `dirMaps`.
2. Copy or edit the SVG files here.
3. Restart the server for your changes to take effect.

* The SVG files define
  * the dimensions of the office using the [`/svg/@viewBox`](http://zvon.org/comp/r/ref-SVG_1_1_Full.html#Attributes~viewBox) attribute (`minX`, `minY`, `width`, `height`). (0,0) is the top-left corner of the SVG canvas.
  * the size and positions of the seats (`minX`, `minY`) using the JavaScript `<script>` elemnent to define `this.SEATS.mv.iconSize` and `this.SEATS.mv.seatPositions`. If you change the name of the office from `"mv"`, make sure you change it here too.
  * the `polygon.background` element is the shape of the office footprint, which turns white in the Admin UI's seat choosing interface so the page isn't visible through the walls.
  * the `g.walls` and child `g.innerWalls` groups are the shapes that define where the walls of the office are, with differing style.
  * the `g.roomNames` group shows text on the Floorplan. Multiline text uses `tspan` elements for positioning. `g.room` groups optionally shows detailed conference room information, some of which (`endpoint:id`, `.statusBadge`) rely on external systems to work.
  * `g.seats` and `g.photos` are always empty, and will be populated by the client-side presentation layer to show where people sit.
  * `.arrow` links in some maps are used to navigate between offices that are spatially local to each other.
* Map styles are set in `src/less/imports/Map.less`, including the way walls and text are rendered.
* The total number of offices is defined in `src/less/imports/definitions.less`.
* The number of columns for the office changer links is defined in `src/less/imports/ListPane.less`.
* The Admin UI office chooser is defined in `data/views/admin.hbs`.

### Aldaviva's SVG maintenance process

1. Copy an existing SVG file
1. Open the SVG in Adobe Illustrator to set the walls and seating positions visually. The seats can just be squares for now. Room areas can be any shapes you want.
1. Export the SVG from Illustrator without overwriting my SVG using the View Code button
1. Set the `viewBox` attribute value's top left position, width, and height to be the same as the Illustrator artboard.
1. Copy the `g.walls` and `g.innerWalls` groups into my SVG
1. Copy the `rect` elements you made for the seating positions into a text editor, preferrably one with column editing like Sublime Text, and convert their `x` and `y` attributes into a JavaScript array of `[x, y]` pairs:

#### Temporary SVG code generated by Illustrator for seat rectangles

```html
<g class="seats">
    <rect width="20" height="20" x="146.363" y="927.371" />
    <rect width="20" height="20" x="847.134" y="813.174" />
</g>
```

#### JavaScript seats object array

```javascript
this.SEATS.mv = {
    iconSize: 20,
    seatPositions: [
        [146.363, 927.371],
        [847.134, 813.174]
    ]
}
```

1. Set the `g.room .roomArea` to be the room area shapes you made.
2. Change the `g.roomNames` text, restart the server, and line up the text coordinates using your browser's Developer Tools for fine positioning.

## Work-in-Progress

* Finish implementing Caminite schema from [references.md](references.md).
* Validate Aldaviva's SVG process, and see if also doable in LibreOffice / other SVG apps.
* Verify use of Imagemagick vs Graphicsmagick.
* Make it easier to add seats to the SVG files (maybe separate out into another Mongo table?).

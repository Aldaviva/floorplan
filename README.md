Floorplan
=========

Where do people sit in the offices of Blue Jeans Network? What's that person's name, whose face I remember but never really met? I've heard of this person, but I don't know their face. Where are the different teams grouped? What is A2's email address?

### Floorplan view
![Floorplan](https://aldaviva.com/portfolio/artwork/floorplan.jpg)

### Administrative view
![Floorplan Admin](https://aldaviva.com/portfolio/artwork/floorplan-admin.jpg)

## Buzzwords

* Backbone
* Express
* GraphicsMagick
* Handlebars
* jQuery
* LESS
* Mongo
* Node
* Q
* SVG

## Prerequisites

* [Node &ge; 0.10](https://nodejs.org/)
* [NPM](https://www.npmjs.com/get-npm)
* [MongoDB &ge; 2.4](https://www.mongodb.com/download-center?jmp=nav#community)

## Install

1. Clone the GitHub repository

        git clone https://github.com/Aldaviva/floorplan.git
        cd floorplan
        
1. Install dependencies

        make install-deps
    
    This installs [Graphicsmagick](http://www.graphicsmagick.org/) and several NPM modules.
        
1. Create a configuration file based on the example

        cp config.example.json config.json

1. You may edit the configuration file and change any settings you want, although the server will run with the default settings.

    * **`wwwPort`** is the TCP port on which the Floorplan HTTP server listens. Useful if you want the server to listen on a different port, like `80` or `8080`. With the default value of `3000`, you can access the Floorplan web interface by going to `http://127.0.0.1:3000/`.
    * **`dbHost`** is the host on which the MongoDB server runs. Useful if you have a MongoDB server on a different computer. With the default value of `"127.0.0.1"`, the MongoDB server is on the same computer as Floorplan.
    * **`dbPort`** is the TCP port on which the MongoDB server listens. Useful if you have a non-default MongoDB configuration. With the default value of `27017`, Floorplan will connect to a MongoDB server with a default configuration.
    * **`dbName`** is the name of the MongoDB database that will be used to store people added to Floorplan. Useful if you want to run multiple different Floorplan instances on the same MongoDB server. With the default value of `"floorplan"`, people documents will be stored in the `people` collection of the `floorplan` database in your MongoDB server.
    
        If you want to connect to the database yourself, you can run
        
            mongo floorplan
            > db.people.find()
    * **`mountPoint`** is the HTTP path under which the Floorplan web interface will be served. Useful if you want to reverse-proxy the Floorplan server through another HTTP server like Apache or Nginx due to TLS or a desire to serve multiple services on port 80. With the default value of `"/"`, you can access the Floorplan web interface by going to `http://127.0.0.1:3000/`, but if you changed `mountPoint` to `/floorplan`, you would have to go to `http://127.0.0.1:3000/floorplan`.

## Run

    node index.js
    
Use `Ctrl+C` to stop.    
    
## Usage

### Viewing the Floorplan
Go to [`http://127.0.0.1:3000`](http://127.0.0.1:3000) in your web browser. You should see a blue page that says "MV" in the top left.

### Adding people
Go to [http://127.0.0.1:3000/admin/`](http://127.0.0.1:3000/admin/) in your web browser. You should see a white page that says "add person" in the top left.

Fill in the person's full name and any other details you want to set, then click the blue Save button.

Now when you view the Floorplan, the new person should appear in the list to the left and, if you assigned an office and seat, their photo will appear in their seating position.

### Adding offices
1. Go to the `views/maps` directory.
2. Copy or edit the SVG files here.
3. Restart the server for your changes to take effect.

* The SVG files define 
    * the dimensions of the office using the [`/svg/@viewBox`](http://zvon.org/comp/r/ref-SVG_1_1_Full.html#Attributes~viewBox) attribute (`minX`, `minY`, `width`, `height`). (0,0) is the top-left corner of the SVG canvas.
    * the size and positions of the seats (`minX`, `minY`) using the JavaScript `<script>` elemnent to define `this.SEATS.mv.iconSize` and `this.SEATS.mv.seatPositions`. If you change the name of the office from `"mv"`, make sure you change it here too.
    * the `polygon.background` element is the shape of the office footprint, which turns white in the Admin UI's seat choosing interface so the page isn't visible through the walls.
    * the `g.walls` and child `g.innerWalls` groups are the shapes that define where the walls of the office are, with differing styles
    * the `g.roomNames` group shows text on the Floorplan. Multiline text uses `tspan` elements for positioning. `g.room` groups optionally shows detailed conference room information, some of which (`endpoint:id`, `.statusBadge`) rely on external systems to work.
    * `g.seats` and `g.photos` are always empty, and will be populated by the client-side presentation layer to show where people sit.
    * `.arrow` links in some maps are used to navigate between offices that are spatially local to each other.
* Map styles are set in `public/styles/Map.less`, including the way walls and text are rendered.
* The street address and optional Yelp review link are defined in `public/scripts/IntroView.js`.
* The office changer links in the top left are defined in `public/scripts/ListPane.js`.
    * The total number of offices is defined in `public/styles/definitions.less`.
    * The number of columns for the office changer links is defined in `public/styles/ListPane.less`.
* The Admin UI office chooser is defined in `views/admin.hbs`.

I find that the easiest way to generate the SVG files is to

1. Copy an existing SVG file
1. Open the SVG in Adobe Illustrator to set the walls and seating positions visually. The seats can just be squares for now. Room areas can be any shapes you want.
1. Export the SVG from Illustrator without overwriting my SVG using the View Code button
1. Set the `viewBox` attribute value's top left position, width, and height to be the same as the Illustrator artboard.
1. Copy the `g.walls` and `g.innerWalls` groups into my SVG
1. Copy the `rect` elements you made for the seating positions into a text editor, preferrably one with column editing like Sublime Text, and convert their `x` and `y` attributes into a JavaScript array of `[x, y]` pairs:

    **Temporary SVG code generated by Illustrator for seat rectangles**
    
        <g class="seats">
            <rect width="20" height="20" x="146.363" y="927.371" />
            <rect width="20" height="20" x="847.134" y="813.174" />
        </g>
    
    **JavaScript seats object array**
        
        this.SEATS.mv = {
            iconSize: 20,
            seatPositions: [
                [146.363, 927.371],
                [847.134, 813.174]
            ]
        };
1. Set the `g.room .roomArea` to be the room area shapes you made.
1. Change the `g.roomNames` text, restart the server, and line up the text coordinates using your browser's Developer Tools for fine positioning.
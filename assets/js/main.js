// EventBus, as described at http://vuetips.com/global-event-bus
const EventBus = new Vue();

Object.defineProperties(Vue.prototype, {
  $bus: {
    get: function () {
      return EventBus
    }
  }
})

// VUE COMPONENTS

// Main Navigation
Vue.component('nav-main', {
  props: [],
  template: `
    <div id="nav-main">
      <input id="uploadImage" type="file" style="display:none" accept="image/*" v-on:change="$emit('takephoto', $event)" capture="camera">
      <label for="uploadImage" class="button-left-large card-1 ">
        <img src="assets/img/icons/camera.svg" alt="Camera" height="40" width="40">
      </label>
      <router-link to="/map" class="button-left-med card-1 ">
        <img src="assets/img/icons/map.svg" alt="Camera" height="30" width="30">
      </router-link>
      <router-link to="/take" class="button-left-med card-1 ">
        <img src="assets/img/icons/take.svg" alt="Camera" height="30" width="30">
      </router-link>
      <router-link to="/" class="button-left-med card-1 ">
        <img src="assets/img/icons/question.svg" alt="Camera" height="30" width="30">
      </router-link>
    </div>
  `
})

// Map Navigation
Vue.component('nav-map', {
  props: [],
  template: `
    <div id="nav-map">
      <div class="btn-column-set right">
          <button class="btn-column btn-top card-1" v-on:click="$bus.$emit('change-activelevel', $event.target.value)" value="0">B</button>
          <button class="btn-column card-1" v-on:click="$bus.$emit('change-activelevel', $event.target.value)" value="1">2</button>
          <button class="btn-column card-1" v-on:click="$bus.$emit('change-activelevel', $event.target.value)" value="2">3</button>
          <button class="btn-column card-1" v-on:click="$bus.$emit('change-activelevel', $event.target.value)" value="3">3M</button>
          <button class="btn-column card-1" v-on:click="$bus.$emit('change-activelevel', $event.target.value)" value="4">4</button>
          <button class="btn-column card-1" v-on:click="$bus.$emit('change-activelevel', $event.target.value)" value="5">5</button>
          <button class="btn-column btn-bottom card-1" v-on:click="$bus.$emit('change-activelevel', $event.target.value)" value="6">6</button>
      </div>
      <div class="btn-column-set right">
          <button class="btn-column btn-top card-1" v-on:click="$bus.$emit('change-zoom', $event.target.value)" value="1">+</button>
          <button class="btn-column btn-bottom card-1" v-on:click="$bus.$emit('change-zoom', $event.target.value)" value="-1">-</button>
      </div>
    </div>
  `
})

// Photostream Panel - Lives on Separate Route
const PhotostreamPanel = Vue.component('photostream-panel', {
  props: ['images'],
  watch: {
    images: function(newImages) {

    }
  },
  created() {
    var comp = this;
    setInterval( function() {comp.$bus.$emit('fetch-photostreamdata')}, 5000 ); // triggers fetch photostream every 5 seconds
  },
  template: `
    <div id="photostream-panel">
      <h1>image list</h1>
      <image-single v-for="image in images" v-bind:image="image"/>
    </div>
  `
})

// Single Image Component - used in Photostream
const ImageSingle = Vue.component('image-single', {
  props: ['image'],
  computed: {
    imagetransform: function() {
      var range = 400;
      var anglerange = 10;
      var rand = {};
      rand.x = Math.round((Math.random()-0.5) * range) + 'px';
      rand.y = Math.round((Math.random()-0.5) * range) + 'px';
      rand.rotate = Math.round((Math.random()-0.5) * anglerange) + 'deg';
      return rand;
    },
    styleObject: function() {
      var style = {
        'z-index': this.image.time,
        transform: `rotate(${this.imagetransform.rotate}) translate( ${this.imagetransform.x}, ${this.imagetransform.y} )`
      }
      return style;
    }
  },
  template: `
    <img class="card-3 image-single" v-bind:style="styleObject" v-bind:src=" 'https://gsappeoys.s3.amazonaws.com/userimg/' + image.url"/>
  `
})

// Map Panel
const MapPanel = Vue.component('map-panel', {
  props: ['places', 'images', 'objects', 'placeactive', 'zoomincrement'],
  data: function () {
    return {
      map: null,
      activelayer: null,
      tileLayer: null,
      featureGroups: [],
      imageLayer: null,
      imgPaths: [
        'assets/img/maplayers/1.svg',
        'assets/img/maplayers/2.svg',
        'assets/img/maplayers/3.svg',
        'assets/img/maplayers/3m.svg',
        'assets/img/maplayers/4.svg',
        'assets/img/maplayers/5.svg',
        'assets/img/maplayers/6.svg',
        'assets/img/maplayers/ext_f.svg',
        'assets/img/maplayers/ext_p.svg',
        'assets/img/maplayers/ext_a.svg'
      ],
      bounds: [[0,0],[4800, 4800]],
      icons: {}
    }
  },
  created() {
    // event bus listeners
    this.$bus.$on('change-activelevel', ($event) => {
      console.log($event)
      this.activelayer = $event;
      this.changeActiveLayer();
    });
    this.$bus.$on('change-zoom', ($event) => {
      if ($event == 1) {
        this.map.zoomIn()
      } else if ($event == -1) {
        this.map.zoomOut()
      }
    })
    //this.timer = setInterval( this.updateImages, 5000 )
  },
  watch: {
    zoomincrement: function(newZoomincrement) {
      //console.log("zoomincrement changed");
      //console.log(newZoomincrement.target.value);

    },
    placeactive: function(newPlaceactive) {
      //console.log("placeactive changed")
      //console.log(newPlaceactive)
      this.changeMap([newPlaceactive.x, newPlaceactive.y], newPlaceactive.zoom, newPlaceactive.layerindex);
    },
    activelayer: function(newActiveLayer) {
      //console.log("placeactive changed")
      //console.log(newPlaceactive)
      this.changeActiveLayer;
    },
    objects: {
      handler: function(newObjects) {
        this.populateMap();
      },
      deep: true
    },
    $route: function(to, from) {
      // watch for changes to the route
    }
  },
  template: '<div id="map-panel"></div>', // v-on:change-activelevel="activelevel = $event"
  mounted() {
    this.initMap();
  },
  updated() {
    populateMap();
  },
  methods: {
    populateMap: function() {
      var objects = this.objects
      var activelayer = this.activelayer
      // resize icon on zoom?? see here https://stackoverflow.com/questions/46015066/leaflet-custom-icon-resize-on-zoom-performance-icon-vs-divicon
      var iconBaseUrl = 'https://gsappeoys.s3.amazonaws.com/objects/'
      //console.log('populatemap')
      //console.log(objects)
      // loop through objects and render to map for each at current position
      //console.log(objects)
      objects.forEach( (obj) => {
        //console.log(obj)
        //console.log(this.activelayer)

          this.icons[obj.name] = L.icon({
            iconUrl: iconBaseUrl + obj.url,
            iconSize:     [obj.size, obj.size], // size of the icon
            //iconAnchor:   [22, 94] // point of the icon which will correspond to marker's location
            //popupAnchor:  [-3, -76]
          })

          // add to map
          //L.marker(position, {icon: this.icons[obj.name]}).addTo(this.featureGroups[obj.layer]); // as icon, scaleless
          // [[-26.5,-25], [1021.5,1023]]

          // using x, y as centerpoint, draws square image of dimensions obj.size x obj.size
          var imgScale = Number(obj.size) / 2;
          var imgBounds = [ this.xy(Number(obj.x) - imgScale, Number(obj.y) + imgScale) , this.xy( Number(obj.x) + imgScale , Number(obj.y) - imgScale) ];

          L.imageOverlay( iconBaseUrl + obj.url, imgBounds , {interactive: true}).on('click',  onMapClick).addTo(this.featureGroups[obj.layer]).bringToFront(); // as image overlay, scaled
          //console.log(obj.name)

          function onMapClick(e) {
            console.log(obj.name)
            console.log(e)
          }

      })

    },
    updatePlaceActive: function(payload) {
      //console.log(payload)
    },
    initMap() {
      this.map = L.map('map-panel', {
        crs: L.CRS.Simple,          // simple crs overrides geographic lat-lng
        zoomSnap: 0.1,             // zoom increment
        zoomControl: false,         // hide zoom control
        attributionControl: false,  // hide attribution
        minZoom: -4,     // minzoom (farthest out)
        renderer: L.svg()

        //maxBounds: this.bounds          // prevent pan past image bounds
        //maxBoundsViscosity: 1.0     // prevent rubber-band behavior when attempting to pan past bounds
      })

      // add all image layers and layergroups
      this.imgPaths.forEach( (e, i) => {
        var layer = L.imageOverlay(e, this.bounds);  // add image underlay layer (with bounds)
        var featureGroup = L.featureGroup([layer]).addTo(this.map);
        this.featureGroups.push(featureGroup);
        //this.layers.push(layer);
      })

      //var layer0 = L.imageOverlay(this.imgPaths[0], this.bounds).addTo(this.map);  // add image underlay layer (with bounds)

      //var svglayer = L.svg({ padding: 0.0 }).addTo(this.map);  // add svg layer for d3 to draw into. padding set to zero to ensure proper alignment

      var pk1 = this.xy(2300,2700); // specify a point using xy wrapper (see above)
      var pk2 = this.xy(25,240);
      //L.marker(pk1).addTo(this.map); // add a leaflet marker at a specified point

      var corner1 = this.xy(this.bounds[1]),
      corner2 = this.xy(this.bounds[0])
      //bounds = L.latLngBounds(corner1, corner2);
      // bounds are in the format [ymin, xmin], [ymax, xmax]

      // render deafult map
      this.map.fitBounds(this.bounds, {paddingBottomRight: [0,50], paddingTopLeft: [60,0]} );

      //console.log(this.bounds)
      if (this.$route.params.zoom && this.$route.params.x && this.$route.params.y && this.$route.params.level) {


        this.changeMap([Number(this.$route.params.x), Number(this.$route.params.y)], Number(this.$route.params.zoom), Number(this.$route.params.layer))
        //console.log(coords)
        //this.map.setView(coords, Number(this.$route.params.zoom));  // set map view to center and zoom using specified point
        //this.activeLayer = this.$route.params.level;
        //this.map.fitBounds(this.bounds, {paddingBottomRight: [0,50], paddingTopLeft: [60,0]} );



      }


      //this.map.setView(pk1, -4);  // set map view to center and zoom using specified point
    },
    changeMap(center, zoom, layer) {
      this.map.flyTo(this.xy(center), zoom);
      this.changeActiveLayer(layer);
    },
    changeActiveLayer() {
      var activeindex = this.activelayer;
        this.featureGroups.forEach( (e, i) => {
          if (i == activeindex) {
            e.setStyle( {opacity: 1.0, fillOpacity: 1.0} ) // this is the active layer, set opacity to 1.0
          } else if ( i > activeindex) {
            e.setStyle( {opacity: 0.1, fillOpacity: 0.1} )// these are on top of the active layer, set opacity to 0
          } else {
            e.setStyle( {opacity: 0.2, fillOpacity: 0.2} ); // everything else to 0.2
          }
        })
    },
    xy(x,y) {
      // wrapper to convert photoshop-style [x, y] or x, y coordinates to Leaflet latLng
      var yx = L.latLng;
      if (L.Util.isArray(x)) {
          return yx(this.bounds[1][0] - x[1], x[0]);
      }
      return yx(this.bounds[1][0] - y, x);
    }
  }
})

// List of Objects, for Takeion
const ObjectsList = Vue.component('objects-list', {
  props: ['username','objects', 'takeobject'],
  template: `
  <div>
    <div id="objects-list">
      <div v-for="(object, index) in objects"  class="object-single">
        <div class="obj-title">{{object.name.toLowerCase()}}</div>
        <img class="obj-image" :src=" 'assets/img/objects/' + (Number(index) + 1) + '.svg' " v-on:click="$emit('take', $event)">
        <router-link class="btn-nav-inpanel" :to=" '/take/' + object.name ">Take me!</router-link>
      </div>
    </div>
    <div class="panel-note">
      swipe left and right to scroll through objects
    </div>
  </div>
    `
})

// Single Object profile, activated when a person scans a link
const ObjectSingle = Vue.component('object-single', {
  props: ['name', 'objects'],
  computed: {
    object: function() {
      var found = this.objects.find( (el) => {
        return el.name.toLowerCase() == this.name
      })
      return found
    }
  },
  template: `
  <div id="object-single" class="text-panel">
      <img class="card-3 image-single" v-bind:src=" 'https://gsappeoys.s3.amazonaws.com/objects/' + object.url"/>
      <input id="take" type="file" style="display:none" accept="image/*" v-on:change="$emit('takephoto', $event)" capture="camera">
      <img src="assets/img/icons/take.svg" v-on:click="$emit('take', $event)" alt="Camera" height="40" width="40">
  </div>`
})

// stars feedback
const FeedbackLayer = Vue.component('feedback-layer', {
  props: ['feedbackon'],
  data: function () {
      return {
        two: {},
        characters: []
      }
  },
  watch: {
    feedbackon: function(newFeedbackon) {
      //console.log("zoomincrement changed");
      //console.log(newZoomincrement.target.value);
      var add = this.add
      if (newFeedbackon == true) {
        setInterval(function(){ add('*') }, 50);
      }
    }
  },
  template: `
  <div id="feedback-layer">
  </div>`,
  created() {
    // main event listeners live here
    this.$bus.$on('trigger-confetti', (duration) => {
      var add = this.add;

      var interval = setInterval(function() {
         add('*')
      }, 10)

      setTimeout(function(){
        window.clearInterval(interval);
      }, duration);

    });
  },
  mounted() {

              var type = 'canvas';
              this.two = new Two({
                type: Two.Types[type],
                fullscreen: true,
                autostart: true
              }).appendTo(document.getElementById('feedback-layer'));

              var characters = this.characters = [];
              var gravity = new Two.Vector(0, -0.16);

              /*$(window)
                .bind('keydown', function(e) {
                  var character = String.fromCharCode(e.which);
                  add('*');
                })
                .bind('touchstart', function() {
                  var r = Math.random();
                  var character = String.fromCharCode(Math.floor(r*26) + (r>0.5?97:65));
                  add('*s');
                });*/

              this.two
                .bind('resize', function() {
                  //directions.translation.set(this.two.width / 2, this.two.height / 2);
                })
                .bind('update', function() {
                  for (var i = 0; i < characters.length; i++) {

                    var text = characters[i];
                    text.translation.addSelf(text.velocity);
                    text.rotation += text.velocity.r;

                    text.velocity.addSelf(gravity);
                    if (text.velocity.y > 0 && text.translation.y > this.two.height)  {
                      this.two.scene.remove(text);
                      characters.splice(i, 1);
                   }
                  }
                });
  },
  methods: {
    add: function(msg) {
      var x = Math.random() * this.two.width / 2 + this.two.width / 4;
      var y = this.two.height * 1.25;

      var styles = {
        family: 'ForeignFamiliar, sans-serif',
        size: 20,
        leading: 50,
        weight: 900
      };

      var text = this.two.makeText(msg, x, y, styles);
      text.size *= 2;
      text.fill = '#ffff00';

      text.velocity = new Two.Vector();
      text.velocity.x = 5 * (Math.random() - 0.5);
      text.velocity.y = -(Math.random()*5);
      text.velocity.r = Math.random() * Math.PI / 32;
      this.characters.push(text);
    }
  }
})

// Taken Object, displays when you've decided to take somebody
const TakeObject = Vue.component('take-object', {
  template: `
  <div id="take-object" class='text-panel'>
      <p>You're taking {{$route.params.name}}!</p>
      <p>Next you'll enter your name, where you're from, and your email address and take a picture of yourself with your new object. Once we have your info, you and your object are free to go!</p>
      <p>Then in two weeks we'll send you an email to remind you to send back a picture of your object in its new context.</p>
      <p>When it's time to do that, simply point your phone camera at the object's tag, and it will take you to a page where you can take and upload the photo.</p>

      <div class="btn-panel-nav">
        <router-link class="btn-nav-standalone" :to=" '/takeform/' + $route.params.name ">OK!</router-link>
        <router-link class="btn-nav-standalone" to="/">No Thanks</router-link>
      </div>
  </div>`
})

// Manifesto Panel, displays manifesto text
const ManifestoPanel = Vue.component('manifesto-panel', {
  props: ['texts'],
  template: `
  <div id="manifesto" class='text-panel'>
      <h1>{{texts[0].title}}</h1>
      <p style="white-space: pre-line">{{texts[0].body}}</p>
    </div>`
})

// Landing Page, includes basic instructions and manifesto
const LandingPage = Vue.component('landing-page', {
  props: ['texts'],
  template: `
  <div id="welcome-page" class="text-panel">
      <h2>Welcome</h2>
      <p>Welcome to FREE STUFF. We're glad you're here.</p>
      <p>You Can:</p>
      <router-link class="link-fullwidth" to="/take">Take a Citizen</router-link>
      <p>Or use the app to navigate the show and take pictures:</p>
      <router-link class="link-fullwidth" to="/map">Map/Camera</router-link>
      <p>Or read the manifesto:</p>
      <router-link class="link-fullwidth" to="/manifesto">Manifesto</router-link>
    </div>
  </div>`
})

// User name form
const SignIn = Vue.component('sign-in', {
  mounted () {
    var mymap = L.map('mapid').setView([51.505, -0.09], 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'your.mapbox.access.token'
    }).addTo(mymap);
  },
  template: `
  <div id="signin-page" class="text-panel">
    <h2>Name:</h2>
    <input class="form-input" type="text">
    <h2>Email* (Optional):</h2>
    <input class="form-input" type="email">
    <p>*We'll email you in two weeks to remind you to send a photo of your object in its new home</p>
    <h2>From:</h2>
    <input class="hidden" id="geoloc" type="text" value="" />
    <div id="mapid"></div>
    <input id="uploadImage" type="file" style="display:none" accept="image/*" v-on:change="$emit('takephoto', $event)" capture="camera">
    <label for="uploadImage" >
      <div class="btn-upload">Tap to Take a Picture of You and Your object</div>
    </label>
    <router-link class="btn-nav-standalone" to="/">Never Mind</router-link>
    <router-link class="btn-nav-standalone" to="/" v-on:change="$bus.$emit('change-username', $event.target.value)">Done!</router-link>
  </div>`
})


//v-on:change="$bus.$emit('change-username', $event.target.value)"

// ------
// ROUTES
// ------

const routes = [
  { path: '/photostream', component: PhotostreamPanel, props: true },
  { path: '/map', component: MapPanel, props: true },
  { path: '/map/:zoom/:x/:y/:level', component: MapPanel, props: true},
  { path: '/obj/:name', component: ObjectSingle, props: true},
  { path: '/manifesto', component: ManifestoPanel, props: true},
  { path: '/takeform/:name', component: SignIn, props: true},
  { path: '/take/:name', component: TakeObject, props: true},
  { path: '/', component: ObjectsList, props: true }
]

// vue router
const router = new VueRouter({
  routes // short for `routes: routes`
})

// --------------------
// PRIMARY VUE INSTANCE
// --------------------

const app = new Vue({
  router,
  data: {
      username: "",
      takeobject: {},
      feedbackon: false,
      uniquer: new Date().getMilliseconds(),
      activecomponent: 'places-panel',
      activeobject: null,
      places: [
        { id: 0, text: 'Front Lawn' },
        { id: 1, text: 'Elevator' },
        { id: 2, text: 'Bar' }
      ],
      images: [],
      places: [],
      objects: [],
      texts: [],
      datasource: null,
      placeactive: null,
      activelevel: 10,
      albumBucketName: 'gsappeoys',
      bucketRegion: 'us-east-1',
      IdentityPoolId: 'us-east-1:da00b7ff-2fbc-43a7-ae5b-253008e5fc7e',
      s3: null,
      imgPath: 'assets/img/mapimage.jpg',
      bounds: [[0,0],[498, 500]],
      zoomincrement: null,
      sheetsapi: {
        base: 'https://sheets.googleapis.com/v4/spreadsheets/',
        sheetID: '1fr7N6ye2I_GyoeSPv9W4m3IAg3NOXOLV_r0ObEI9RZQ',
        key: 'AIzaSyCzBbXOY1Rc8-h1Q0hrJdTdnW1twXkJZR0'
      },
      code: {}
    },
  computed: {
    userID: function() {
      return this.username + this.uniquer
    }
  },
  created() {
    // main event listeners live here
    this.$bus.$on('change-username', ($event) => {
      this.username = $event;
      this.$bus.$emit('trigger-confetti', 300)
    });

    this.$bus.$on('change-takeobject', (object) => {
      this.takeobject = object;
      this.$bus.$emit('trigger-confetti', 1000)
    });

    this.$bus.$on('fetch-photostreamdata', () => {
      this.updateImages();
    });

    this.$bus.$on('found-object', (codename) => {
      var user = null;
      var date = new Date();
      var timestamp = Math.round(new Date()).toString();
      timestamp = timestamp.substr(timestamp.length - 8);

      if(this.username.length > 0) {
        user = this.username;
      } else {
        user = 'somebody';
      }

      var message = user + ' found ' + codename;
      alert(message)
      app.postData('messages', {"message": message, "time": timestamp});

    });

  },
  mounted() {
    this.initData();
    this.initCameraUpload();
  },
  methods: {
    postData: function(table, data) {
      var url = null
        , imagereceiverurl = 'https://script.google.com/macros/s/AKfycbwPMltS2_65fRt1AUty662FUSxb-Q7WKGjPfdVSow/exec'
        , messagereceiverurl = 'https://script.google.com/macros/s/AKfycbyDDN1QfDmpcMQT6cf6dAKEAhMX5Xxh111s5w6FO7esmjyOWfo/exec'

      if (table == 'messages') {
        url = messagereceiverurl;
        alert('message receive url')
        alert(url)
        console.log(data)
      } else if (table == 'images') {
        url = imagereceiverurl;
      }

      // adds a new row with the data passed to the function.
      // google app script location, see https://medium.com/@dmccoy/how-to-submit-an-html-form-to-google-sheets-without-google-forms-b833952cc175
      var jqxhr = $.ajax({
        url: url,
        method: "GET",
        dataType: "json",
        data: data
      })
    },
    updateImages: function() {
      this.datasource.fetch();
    },
    initData: function() {
      /* fetches data from google sheet */
      var url = "https://docs.google.com/spreadsheets/d/1fr7N6ye2I_GyoeSPv9W4m3IAg3NOXOLV_r0ObEI9RZQ/edit?usp=sharing"
      Tabletop.init( { key: url,
                       callback: (data, tabletop) => {
                         this.datasource = tabletop;
                         this.images = tabletop.models.images.elements.reverse();
                         //this.likes = tabletop.models.likes.elements;
                         this.messages = tabletop.models.messages.elements;
                         this.places = tabletop.models.places.elements;
                         this.objects = tabletop.models.objects.elements;
                         this.texts = tabletop.models.texts.elements;
                         //console.log(this.texts)
                       },
                       simpleSheet: true } )
    },
    initCameraUpload: function() {
      // set connection credentials
      AWS.config.update({
        region: this.bucketRegion,
        credentials: new AWS.CognitoIdentityCredentials({
          IdentityPoolId: this.IdentityPoolId
        })
      });

      // create s3 object and store on main app data
      this.s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        params: {Bucket: this.albumBucketName}
      });
    },
    postImage: function(e) {
      var date = new Date();
      var timestamp = Math.round(new Date()).toString();
      timestamp = timestamp.substr(timestamp.length - 8);
      var uploaduser = this.username || 'nouser';
      var key = uploaduser.toLowerCase() + timestamp + '.jpg';

      var comp = this;

      loadImage( e.target.files[0], (img) => {

          if ( document.getElementById("canvas") ) {
            document.getElementById("canvas").remove();
          }

          var canvas = document.body.appendChild(img)
          canvas.setAttribute("id", "canvas");
          var ctx = canvas.getContext('2d');
          var finalFile = canvas.toDataURL("image/jpeg");
          var canvasImageData = ctx.getImageData(0,0,500,500);
          var blobData = dataURItoBlob(finalFile); // for upload to s3

          // UNUSED gets qr code from image
          var code = jsQR(canvasImageData.data, 500,500);


          if (code) {
            var codename = code.data.split('/').slice(-1)[0];
            comp.$bus.$emit('found-object', codename)
          } else {
            // upload image itself to s3
            app.s3.upload({
             Key: 'userimg/' + key,
             Body: blobData,
             ACL: 'public-read'
            }, function(err, data) {
             if (err) {
               //alert('There was an error uploading your photo: ', err.message);
             }
             // SUCCESSFUL UPLOAD

             // alert('Successfully uploaded photo.');
             // post image data to google sheet
             app.postData('images', {"url": key, "name": uploaduser, "time": timestamp});

             // show confetti
             comp.$bus.$emit('trigger-confetti', 400)
            });
          }
        },
        {canvas: true, cover: true, crop: true, orientation: true, maxWidth: 500, maxHeight: 500}
      );

      function dataURItoBlob(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
           array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
      }

     }
  }
}).$mount('#app-root')

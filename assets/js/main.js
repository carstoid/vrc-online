// --------------
// VUE COMPONENTS
// --------------

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

const SearchPanel = Vue.component('search-panel', {
  data: function () {
    return {
      view: 'projects',
      searchstring: ''
    }
  },
  props: ['images','projects', 'creators'],
  template: `
    <div>
      <div>
        <div>
          <input v-model="searchstring" placeholder="search...">
          <br>
          <input type="radio" id="projects" value="projects" v-model="view">
          <label for="projects">Projects</label>
          <input type="radio" id="creators" value="creators" v-model="view">
          <label for="creators">Creators</label>
        </div>
      </div>
      <project-list v-if=" view === 'projects' " v-bind:projects="projects" v-bind:searchstring="searchstring" ></project-list>
      <creator-list v-if=" view === 'creators' " v-bind:creators="creators" v-bind:searchstring="searchstring" ></creator-list>
    </div>
    `
})

const CreatorList = Vue.component('creator-list', {
  props: ['searchstring', 'creators'],
  computed: {
    creatorsfiltered: function() {
      if (this.searchstring.length < 1) {
        return Shuffle(this.creators).slice(0, 50)
      } else {
        var options = {
          extract: function(el) { return el.name + el.altnames; }
        };
        var results = fuzzy.filter(this.searchstring, this.creators, options);
        var matches = results.map(function(el) { return el.original; });
        return matches
      }

      function Shuffle(o) {
        for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
      };

    }
  },
  template: `
    <div>
      <ul id="creator-list" class="list-container">
        <li v-for="creator in creatorsfiltered">
          <router-link class="" :to=" '/creator/' + creator.id ">{{ creator.name }}</router-link>
        </li>
      </ul>
    </div>
    `
})
//       <p>showing {{creatorsfiltered.length}} <span v-if="searchstring.length < 1">random</span> creators</p>


// List of Projects
const ProjectList = Vue.component('project-list', {
  props: ['searchstring', 'projects'],
  computed: {
    projectsfiltered: function() {
      if (this.searchstring.length < 1) {
        return Shuffle(app.projects).slice(0, 50)
      } else {
        var options = {
          extract: function(el) { return el.name + el.altnames; }
        };
        var results = fuzzy.filter(this.searchstring, this.projects, options);
        var matches = results.map(function(el) { return el.original; });
        return matches
      }

      function Shuffle(o) {
      	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      	return o;
      };

    }
  },
  template: `
    <div>
      <ul id="project-list" class="list-container">
        <li v-for="project in projectsfiltered" class="list-item">
          <router-link class="" :to=" '/project/' + project.id ">{{ project.name }}</router-link>
        </li>
      </ul>
    </div>
    `
})

const CreatorSingle = Vue.component('creator-single', {
  //props: ['creators', 'images'],
  computed: {
    creator: function() {

      var found = app.creators.find( (el) => {
        return el.id == this.$route.params.id
      })
      return found
    },
    projects: function() {
      var projectids = this.creator.projects.split(",");
      var projectspopulated = projectids.map( (e) => {
        var found = app.projects.find( (el) => {
          return el.id == e;
        })
        return found
      })
      return projectspopulated;
    }
  },
  template: `
  <div>
    <h2>{{ creator.name }}</h2>
    <p>{{ creator.note }}</p>
    <!--<p>{{ creator.roles }}</p>-->
    <p>{{ creator.nationalities }}, {{ creator.yearborn }} → {{ creator.yeardied }}</p>
    <p>ULAN ID: <a target="_blank" :href=" 'http://www.getty.edu/vow/ULANFullDisplay?find=' + creator.ulan + '&role=&nation=&prev_page=1&subjectid=' + creator.ulan">{{creator.ulan}}</a></p>
    <br>
    <br>
    <ul class="list-container">
      <li v-for="project in projects" class="project">
        <router-link class="" :to=" '/project/' + project.id ">{{ project.name }}</router-link>
      </li>
    </ul>
  </div>`
})

const ProjectSingle = Vue.component('project-single', {
  //props: ['projects', 'images'],
  computed: {
    project: function() {
      var found = app.projects.find( (el) => {
        return el.id == this.$route.params.id
      })
      return found
    },
    creators: function() {
      var creatorids = this.project.creators.split(",");
      var creatorspopulated = creatorids.map( (e) => {
        var found = app.creators.find( (el) => {
          return el.id == e;
        })
        return found
      })
      return creatorspopulated;
    },
  },
  template: `
  <div>
    <div class="info-panel">
      <h2>{{ project.name }}</h2>
      <p v-if=" project.altnames "><em>Also known as {{ project.altnames }}</em></p>
      <p>{{ project.locationtext }}. {{ project.yearbegin }} → {{ project.yearend }}</p>
      <!--<p>{{ project.note }}</p>-->
      <h3>Creators:</h3>
      <ul class="list-container">
        <li v-for="creator in creators" class="creator">
          <router-link :to=" '/creator/' + creator.id ">{{ creator.name }}</router-link>
        </li>
      </ul>
    </div>
    <div class="image-panel">
      <div class="image-list-container">
        <div v-for="imageid in project.assets.split(',')">
          <router-link class="" :to=" '/image/' + imageid ">
            <object :data=" 'https://vrc-images.s3.amazonaws.com/thumb/' + imageid + '.jpg' " :alt=" imageid + '.jpg' " ></object>
          </router-link>
        </div>
      </div>
    </div>
  </div>`
})

/*
<div  v-if=" project.types ">
  <p>Project Types:</p>
  <li v-for="type in project.types.split(',')">
    {{ type }}
  </li>
</div>

*/


const ImageSingle = Vue.component('image-single', {
  computed: {
    image: function() {
        var found = app.images.find( (el) => {
          return el.id == this.$route.params.id
        })
        return found
    },
    project: function() {
      var projectids = this.image.projects.split(",");
      var projectspopulated = projectids.map( (e) => {
        var found = app.projects.find( (el) => {
          return el.id == e;
        })
        return found
      })
      return projectspopulated[0];
    },
    creators: function() {
      var creatorids = this.image.creators.replace(" ", "").split(",");
      var creatorspopulated = creatorids.map( (e) => {
        var found = app.creators.find( (el) => {
          return el.id == e;
        })
        return found
      })
      return creatorspopulated;
    },
  },
  template: `
  <div v-if=" image && creators && project ">
    <div class="info-panel">
      <router-link :to=" '/project/' + project.id "><h2>{{ project.name }}</h2></router-link>
      <ul class="list-container">
        <li v-for="creator in creators">
          <router-link v-if="creator.id != null "  :to=" '/creator/' + creator.id ">{{ creator.name }}</router-link>
        </li>
      </ul>
      <!--<p>{{image.collection}}</p>-->
      <p>{{image.date}}</p>
      <p>Image Type: {{image.type}} / {{image.subtype}}</p>
      <p>Source: {{image.source}}</p>
      <p>Avery Library Call No.: <a target="_blank" :href=" 'https://clio.columbia.edu/quicksearch?q=' + image.sourcecall.replace() + '&commit=Search' ">{{image.sourcecall}}</a></p>
    </div>
    <div class="image-panel">
      <img v-bind:src=" 'https://vrc-images.s3.amazonaws.com/display/' + image.id + '.jpg' "/>
    </div>
  </div>
  `
})

// above, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace for call number cleaning


// ------
// ROUTES
// ------

const routes = [
  { path: '/photostream', component: PhotostreamPanel, props: true },

  { path: '/image/:id', component: ImageSingle, props: true},
  { path: '/creator/:id', component: CreatorSingle, props: true},
  { path: '/project/:id', component: ProjectSingle, props: true},

  { path: '/', component: SearchPanel, props: true }
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
      images: null, // image data
      creators: null, // creator data
      projects: null, // project data
      datasource: null, // placeholder for the tabletop object
    },
  computed: {
  },
  created() {
    // main event listeners live here
  /*  this.$bus.$on('change-username', ($event) => {
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
*/
  },
  mounted() {
    this.initData();
  },
  methods: {
    updateData: function() {
      this.datasource.fetch();
    },
    initData: function() {
      console.log('searching data')

      // urls to csv of each sheet in master data
      var imagesurl =   "https://docs.google.com/spreadsheets/d/e/2PACX-1vTANif4hgyQ1FQVlREjshM9Q0nIjQ-qEi0sB6233e_90YdVbePfFv__UgSoeny1EEm2pJNsBinjbTIZ/pub?gid=1902032170&single=true&output=csv"
      var creatorsurl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTANif4hgyQ1FQVlREjshM9Q0nIjQ-qEi0sB6233e_90YdVbePfFv__UgSoeny1EEm2pJNsBinjbTIZ/pub?gid=842699387&single=true&output=csv"
      var projectsurl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTANif4hgyQ1FQVlREjshM9Q0nIjQ-qEi0sB6233e_90YdVbePfFv__UgSoeny1EEm2pJNsBinjbTIZ/pub?gid=1710277834&single=true&output=csv"

      // parse each csv with papa parse
      Papa.parse(imagesurl, {
      	download: true,
        header: true,
        complete: function(results, file) {
          app.images = results.data;
        }
      })

      Papa.parse(creatorsurl, {
      	download: true,
        header: true,
        complete: function(results, file) {
          app.creators = results.data;
        }
      })

      Papa.parse(projectsurl, {
      	download: true,
        header: true,
        complete: function(results, file) {
          app.projects = results.data;
        }
      })

      // then data is available on this.images, this.creators, this.projects

    }
  }
}).$mount('#app-root')

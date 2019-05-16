(function (window, document, undefined) {
    //ensure strict mode
    'use strict';
    var canvas;
	var vertexColors= THREE.VertexColors
    var scene, camera, renderer, controls, manager; // , stats;
    var windowW = window.innerWidth;
    var sceneW = window.innerWidth; //      size of the whole screen, /1.8; would set it to be a little bit bigger than a half
    var windowH = window.innerHeight;
    var raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 0.1;
    var mouse = new THREE.Vector2();
    var parseDate = d3.time.format("%m/%d/%Y").parse;
    var sats = [];
	var newSats = []; //the array holding all the satellite data after parsing csv
    function onMouseMove(event) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = (event.clientX / sceneW) * 2 - 1;
        mouse.y = -(event.clientY / windowH) * 2 + 1;
    }
	
    // Three.js setup procedure
    function setupScene() {
        scene = new THREE.Scene();
        canvas = document.getElementById("scene");
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(sceneW, windowH);
        renderer.setClearColor(0x000000, 1);
        camera = new THREE.PerspectiveCamera(60, sceneW / windowH, 0.5, 10000);
        camera.position.z = 22;
        renderer.shadowMap.enabled = false;
        manager = new THREE.LoadingManager();
        manager.onLoad = function () {
            render();
        };
    }
	
    //Three.OrbitControls setup procedure
    function setupControls() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.04;
        controls.rotateSpeed = 0.2;
        controls.enableDamping = true;
        controls.dampingFactor = 0.3;
        controls.enablePan = false;
    }
	
    //Create sphere geometry and put the earth outline image onto it
    function createEarth() {
        var planet = new THREE.SphereGeometry(10, 128, 128);
        //planet.rotateX((-23.4 * Math.PI) / 180); //use this to rotate the globe so the poles are where they are in reality
        var planetMat = new THREE.MeshBasicMaterial({color: 0xffffff});
        var TextureLoader = new THREE.TextureLoader(manager);
        TextureLoader.load('img/marble.jpg', function (texture) {
            texture.anisotropy = 8;
            planetMat.map = texture;
            planetMat.needsUpdate = false;
        });
        var outlineMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.BackSide});
        var outlineMesh = new THREE.Mesh(planet, outlineMaterial);
        outlineMesh.scale.multiplyScalar(1.004);
        var planetMesh = new THREE.Mesh(planet, planetMat);
        planetMesh.add(outlineMesh);
        // displays x, y, and z axes
        // var axes = new THREE.AxisHelper( 50 );
        // axes.rotateX((-23.4 * Math.PI)/180);
        // planetMesh.add( axes );
        scene.add(planetMesh);
    }

	
	// creates a ground site at a specified latitude and longitude
	function groundSite() {
		var r = (1.403+6378)*10/6378;
		var lat = 41.76
		var lon = -111.82
		var phi   = (90-lat)*(Math.PI/180)
		var theta = (lon+180)*(Math.PI/180)

		var x = -((r) * Math.sin(phi)*Math.cos(theta))
		var y = ((r) * Math.cos(phi))
		var z = ((r) * Math.sin(phi)*Math.sin(theta))
		var geometry = new THREE.BoxGeometry(.03, .03, 2);
		var material = new THREE.MeshBasicMaterial({color: 0xffff00});
		var cube = new THREE.Mesh( geometry, material );
		cube.position.set(x, y, z);
		cube.lookAt(new THREE.Vector3(0, 0, 0));
		scene.add(cube);
		
		r = 10;
		lat = 28.57
		lon = -80.65
		phi   = (90-lat)*(Math.PI/180)
		theta = (lon+180)*(Math.PI/180)

		x = -((r) * Math.sin(phi)*Math.cos(theta))
		y = ((r) * Math.cos(phi))
		z = ((r) * Math.sin(phi)*Math.sin(theta))
		geometry = new THREE.BoxGeometry(.03, .03, 2);
		material = new THREE.MeshBasicMaterial({color: 0xffff00});
		cube = new THREE.Mesh( geometry, material );
		cube.position.set(x, y, z);
		cube.lookAt(new THREE.Vector3(0, 0, 0));
		scene.add(cube);
	}
	
    // Populate the sats array, calculate orbital elements, put into scene
    /*function createSatellites() {
        var color = d3.scale.category20c();
        for (var i = 0; i < sats.length; i++) {
            sats[i].xRad = sats[i].sma;
            sats[i].yRad = sats[i].sma * Math.sqrt(1 - (sats[i].ecc * sats[i].ecc));
            sats[i].mat = new THREE.LineBasicMaterial({ color: color(sats[i].Purpose), opacity: 0.5, transparent: true });
            sats[i].curve = new THREE.EllipseCurve(0, 0, 10 / 6378000 * sats[i].xRad, 10 / 6378000 * sats[i].yRad, 0, 2 * Math.PI, false, (sats[i].raan * Math.PI) / 180);
            sats[i].path = new THREE.Path(sats[i].curve.getPoints(200));
            sats[i].path.autoClose = true;
            sats[i].geo = sats[i].path.createPointsGeometry(50);
            sats[i].geo.rotateX((sats[i].incl * Math.PI) / 180);
            sats[i].geo.rotateZ((sats[i].raan * Math.PI) / 180);
            sats[i].geo.rotateX(Math.PI / 2);
            sats[i].geo.rotateX((-23.4 * Math.PI) / 180);
            sats[i].mesh = new THREE.Line(sats[i].geo, sats[i].mat);
            scene.add(sats[i].mesh);
            //console.log(sats);
        }
    }*/
	
    // Show FPS stats in the corner
    /*function createStats() {
        stats = new Stats();
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);
    }*/
	
	// creates the path of the satellite based on the information in the csv
	function satPath() {
		var OL = 1440;
		var NS = 7 * OL;
		var material = new THREE.LineBasicMaterial({color: 0x0000ff});
		//https://stackoverflow.com/questions/26790345/vertex-colors-in-three-line
		// tween.js			https://gist.github.com/vincent/4ce2f9f37b1ac846f84c
		var geometry = new THREE.Geometry();
		var group = new THREE.Group();
		var prev = 0, current;
		var r, lat, lon, x, y, z;
		var satName = newSats[0].name
		for (var i = 0; i < NS; i++) {
			if (newSats[i].name != satName) {
				satName = newSats[i].name
				var line = new THREE.Line( geometry, material );
				group.add(line);
				scene.add(group);
				group = new THREE.Group();
				var geometry = new THREE.Geometry();
				var material = new THREE.LineBasicMaterial({color: 0x0000ff});
			}
			current = newSats[i].horizon;
			if (newSats[i].second > 30) {
				newSats[i].second = 0;
				newSats[i].minute += 1;
			}
			else {
				newSats[i].second = 0;
			}
			r = ((newSats[i].elevation+6378)*10/6378)
			lat = newSats[i].latitude
			lon = newSats[i].longitude
			var phi   = (90-lat)*(Math.PI/180)
			var theta = (lon+180)*(Math.PI/180)

			x = -((r) * Math.sin(phi)*Math.cos(theta))
			z = ((r) * Math.sin(phi)*Math.sin(theta))
			y = ((r) * Math.cos(phi))
			// if the satellite path becomes visible to the groundsite's position, change the path color to red
			if (current == 1 && prev == 0) {
				geometry.vertices.push(new THREE.Vector3(x, y, z));
				var line = new THREE.Line( geometry, material );
				//line.rotateX((-23.4 * Math.PI) / 180); //use this if the globe is rotated to show the true position of the poles
				group.add( line );
				var material = new THREE.LineBasicMaterial({color: 0xff0000});
				var geometry = new THREE.Geometry();
				geometry.vertices.push(new THREE.Vector3( x, y, z));
			}
			// if we transition from a visible path to not being in line of site of the satellite, change back to a blue path
			else if (current == 0 && prev == 1) {
				geometry.vertices.push(new THREE.Vector3( x, y, z));
				var line = new THREE.Line(geometry, material);
				//line.rotateX((-23.4 * Math.PI) / 180); //use this if the globe is rotated to show the true position of the poles
				group.add(line);
				var material = new THREE.LineBasicMaterial({color: 0x0000ff});
				var geometry = new THREE.Geometry();
				geometry.vertices.push(new THREE.Vector3(x, y, z));
			}
			else {
				geometry.vertices.push(new THREE.Vector3(x, y, z));
			}
			prev = current;
		}
		var line = new THREE.Line(geometry, material);
		group.add(line);
		//line.rotateX((-23.4 * Math.PI) / 180); //use this if the globe is rotated to show the true position of the poles
		scene.add(group);	
	}
	
    // Draw a line along the Y axis (shows the poles)
    function createDistanceLine() {
        var lineMat = new THREE.LineBasicMaterial({
            color: 0xFFC400
        });
        var distanceGeo = new THREE.Geometry();
        distanceGeo.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 15, 0));
		distanceGeo.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -15, 0));
        var line = new THREE.Line(distanceGeo, lineMat);
		//line.rotateX((-23.4 * Math.PI) / 180); //use this if the globe is rotated to show the true position of the poles
        scene.add(line);
    }
    
    function addTag(property, name) {
        d3.select(".tags")
            .append("div")
            .classed("tag", true)
            .style("float", "left")
            .style("padding", 3 + "px")
            .style("margin", 1 + "px")
            .style("background-color", "white")
            .style("cursor", "pointer")
            .html(property + ": " + name);
        d3.select(".reset")
            .style("opacity", 1)
            .on('mouseenter', function () {
            d3.select(this).style("color", "#ff0000");
        })
            .on('mouseleave', function () {
            d3.select(this).style("color", "#ffffff");
        })
            .on('click', function () {
            d3.selectAll(".tag").remove();
            sats.forEach(function (e) {
                e.mat.visible = true;
            });
            d3.select("body").selectAll("svg").selectAll("path").classed("noClick", false);
            d3.select(".reset").style("opacity", 0.1);
        });
    }
	
    function init() {
        window.addEventListener('mousemove', onMouseMove, false);
        window.onkeyup = function (e) {
            var key = e.keyCode ? e.keyCode : e.which;
            if (key == 32) {
                controls.autoRotate = !controls.autoRotate;
            }
        };
        setupScene();
        setupControls();
        createEarth();
        //createSatellites();
        //createStats();
		satPath();
		groundSite();
		splash();
        //createDistanceLine();
    }
	
	function splash() {
        d3.select(".btn")
            .on("click", function () {
            d3.select(".splash").remove();
        });
    }

    function checkForRaycasts() {
        raycaster.setFromCamera(mouse, camera);
        for (var i = 1; i < scene.children.length; i++) {
            scene.children[i].material.opacity = 0.5;
        }
        //calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects(scene.children);
        //only first intersect
        if (intersects.length != 0) {
            if (print)
                //console.log(intersects);
            print = false;
            if (intersects[0].object.type == "Line") {
                // intersects[0].object.material.color.set( 0xffff00 );
                intersects[0].object.material.opacity = 1.0;
            }
        }
    }
	
    function render() {
        requestAnimationFrame(render);
        controls.update();
        //stats.begin();
        if (mouse.x < sceneW) {
            //checkForRaycasts();
        }
        renderer.render(scene, camera);
        //stats.end();
    }
	
	// pulls the satellite data from the .csv and populates a list with it
	d3.csv('data/position.csv', function (d) {
        return {
			name: d.name,
			latitude: +d.latitude,
            longitude: +d.longitude,
            elevation: +d.elevation,
			year: +d.year,
			month: +d.month,
			day: +d.day,
			hour: +d.hour,
			minute: +d.minute,
			second: +d.second,
            horizon: d.horizon
        };
    }, function (data) {
        newSats = data.slice(); //copy 
		init();
    });
	
	//https://d3-wiki.readthedocs.io/zh_CN/master/CSV/
   /* d3.csv('satellites.csv', function (d) {
        return {
            norad: d.norad,
            name: d.name,
            date: parseDate(d.launch_date),
            sma: +d.sma,
            ecc: +d.ecc,
            incl: +d.incl,
            raan: +d.raan,
            Country: d.country,
            owner: d.owner,
            Users: d.users,
            Purpose: d.purpose,
            apogee: +d.apogee,
            perigee: +d.perigee,
            mass: +d.mass,
            contractor: d.contractor,
            contractor_country: d.contractor_country,
            launch_site: d.launch_site,
            launch_vehicle: d.launch_vehicle
        };
    }, function (data) {
        sats = data.slice(); //copy 
        init();
    });*/
})(window, document);

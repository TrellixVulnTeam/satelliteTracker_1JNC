(function (window, document, undefined) {
    var canvas;
    var scene, camera, renderer, controls, manager, light;
    var windowW = window.innerWidth; //size of the whole window
    var sceneW = window.innerWidth / .83; //size of the scene, dividing innerWidth by .83 moves the globe to the right
    var windowH = window.innerHeight;//width of the window
	
    var raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 0.1;
	
    var mouse = new THREE.Vector2(); //used to calculate the current position of the mouse in 2D space
	var numCraft; // number of satellites
	var numOrbitalPts; //number of points for each satellite path
	var rawSatData = []; //the array holding all the satellite data after parsing the csv
	var spacecraft = []; //an array of the names of the satellites (for ease of use across multiple functions)
	var satTime; // the first datetime in the satellite data. Used to calculate an index in updateSat() and visibilitychange eventlistener
	var sites = []; //the array holding all the groundsite data after parsing the csv
	var sunArr = []; //the array holding the position of the sun over a 24 hour period
	var sunPos = []; //the array of x,y,z positions for the light representing the sun
	//var sunSprite; //sprite used to show the spot on the earth that the sun is directly above. Not currently used
	//var mul = 10.2/20; //mul is a multiplier to put the sunSprite just above the surface of the globe
	var satDict = {}; // dictionary of satellite paths
	var satImg = {}; // dictionary of satellite sprites
	var groundSites = {}; // dictionary of groundsite markers
	var clickedObj = null; // the line that is currently clicked
	
     // Three.js setup procedure
    function setupScene() {
        scene = new THREE.Scene();
        canvas = document.getElementById("scene");
        renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
        renderer.setSize(sceneW, windowH);
        renderer.setClearColor(0x000000, 1);
        camera = new THREE.PerspectiveCamera(60, sceneW / windowH, 0.5, 501000);
        camera.position.z = 22;
        renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        manager = new THREE.LoadingManager();
        manager.onLoad = function () {openSideBar();render();};
    } 

    //Three.OrbitControls setup procedure
    function setupControls() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0.16;
        controls.rotateSpeed = 0.2;
        controls.enableDamping = true;
        controls.dampingFactor = 0.5;
        controls.enablePan = false;
		controls.minDistance = 20.5;
		controls.maxDistance = 1000;
    }	
	
	function openSideBar() {
		setTimeout(function(){
			//makes the sidebar with all of the groundsites and spacecraft visible
			document.getElementById("gsTitle").style.width = "20%";
			document.getElementById("gsTitle").style.height = "16%"
			document.getElementById("gsTitle").style.top = "0%";
			document.getElementById("gsTitle").visible = true;
			document.getElementById("gsnav").style.width = "20%";
			document.getElementById("gsnav").style.height = "22%"
			document.getElementById("gsnav").style.top = "16%";
			document.getElementById("gsnav").visible = true;
			document.getElementById("spacecraftTitle").style.width = "20%";
			document.getElementById("spacecraftTitle").style.height = "16%"
			document.getElementById("spacecraftTitle").style.top = "38%";
			document.getElementById("spacecraftTitle").visible = true;
			document.getElementById("craftnav").style.width = "20%";
			document.getElementById("craftnav").style.height = "48%";
			document.getElementById("craftnav").style.top = "54%";
			document.getElementById("craftnav").visible = true;
		}, 500);
		setTimeout(function() {
			//opens the 'About' section in the upper right part of the screen
			document.getElementById("check").checked = true;
			document.getElementById("about").style.opacity = "1";
		}, 1400);
		//added the 'loaded' class to the body, getting rid of the loading screen
		$('body').addClass('loaded');
	}
	
	//the following function moves the satellites and light along their paths in real time
	function updateOrbits() {
		var d = Date.now();
		//this gives us the index of the orbital point we are headed towards
		var timeDiff = Math.floor((d-satTime)/60000);
		//minuteFraction is how far into the current minute we are. It is used to calculate the updated satellite position.
		var minuteFraction = ((d-satTime)/60000 - timeDiff);
		for ( var i = 0; i < numCraft; i++) {
			var satName = rawSatData[i*numOrbitalPts].name;
			//this gets the next position in the satDict library, subtracts current position, and multiplies by minuteFraction
			//before adding that value back to the current position. That gives us the correct position at the current time.
			satImg[satName].position.x = ((satDict[satName].geometry.vertices[timeDiff].x-satDict[satName].geometry.vertices[timeDiff-1].x)*minuteFraction + satDict[satName].geometry.vertices[timeDiff-1].x);
			satImg[satName].position.y = ((satDict[satName].geometry.vertices[timeDiff].y-satDict[satName].geometry.vertices[timeDiff-1].y)*minuteFraction + satDict[satName].geometry.vertices[timeDiff-1].y);
			satImg[satName].position.z = ((satDict[satName].geometry.vertices[timeDiff].z-satDict[satName].geometry.vertices[timeDiff-1].z)*minuteFraction + satDict[satName].geometry.vertices[timeDiff-1].z);
			if (satName != "ISS (ZARYA)") {
				var r = ((rawSatData[i*numOrbitalPts].elevation+6378)*10/6378)/12;
				if (r > 10) r = 10;
				satImg[satName].scale = (r, r, 1);
			}
			/*else {
				var place = i*numOrbitalPts + timeDiff-1;
				lla = ((rawSatData[place+1].latitude - rawSatData[place].latitude)*minuteFraction + rawSatData[place].latitude);
				llo = ((rawSatData[place+1].longitude - rawSatData[place].longitude)*minuteFraction + rawSatData[place].longitude);
				console.log(lla, llo);
			}*/
		}
		light.position.x = (sunPos[timeDiff+1].x - sunPos[timeDiff].x)*minuteFraction + sunPos[timeDiff].x;
		light.position.y = (sunPos[timeDiff+1].y - sunPos[timeDiff].y)*minuteFraction + sunPos[timeDiff].y;
		light.position.z = (sunPos[timeDiff+1].z - sunPos[timeDiff].z)*minuteFraction + sunPos[timeDiff].z;
		/*sunSprite.position.x = light.position.x*mul;
		sunSprite.position.y = light.position.y*mul;
		sunSprite.position.z = light.position.z*mul;*/
	}
	
	//determines whether a certain groundsite checkbox is checked. Used in the addVisiblePath function
	function searchBox(k, boxes) {
		for (var i = 0; i < boxes.length; i++) {
			if (boxes[i] == k) return true;
		}
		return false;
	}
	
	//changes the parts of the satellite paths red that are visible to currently active groundsites.
	//also changes red sections back to blue for groundsites that are deselected
	function addVisiblePath(checkboxes) {
		for (var i = 0; i < numCraft; i++) {
			var pathColor = 0x0000ff;
			var satName = rawSatData[i*numOrbitalPts].name;
			var prev = 0;
			for (var j = 0; j < numOrbitalPts - 1; j++) {
				var index = i*numOrbitalPts+j;
				var current = 0;
				if (searchBox(0, checkboxes)) {
					current += rawSatData[index].h1;
				}
				if (searchBox(1, checkboxes)) {
					current += rawSatData[index].h2;
				}
				if (searchBox(2, checkboxes)) {
					current += rawSatData[index].h3;
				}
				if (searchBox(3, checkboxes)) {
					current += rawSatData[index].h4;
				}
				if (searchBox(4, checkboxes)) {
					current += rawSatData[index].h5;
				}
				if (searchBox(5, checkboxes)) {
					current += rawSatData[index].h6;
				}
				if (searchBox(6, checkboxes)) {
					current += rawSatData[index].h7;
				}
				if (searchBox(7, checkboxes)) {
					current += rawSatData[index].h8;
				}
				if (searchBox(8, checkboxes)) {
					current += rawSatData[index].h9;
				}
				if (searchBox(9, checkboxes)) {
					current += rawSatData[index].h10;
				}
				if (searchBox(10, checkboxes)) {
					current += rawSatData[index].h11;
				}
				if (searchBox(11, checkboxes)) {
					current += rawSatData[index].h12;
				}
				if (searchBox(12, checkboxes)) {
					current += rawSatData[index].h13;
				}
				if (searchBox(13, checkboxes)) {
					current += rawSatData[index].h14;
				}
				if (searchBox(14, checkboxes)) {
					current += rawSatData[index].h15;
				}
				if (current > 0 && prev == 0) {
					pathColor = 0xff0000;
					satDict[satName].geometry.colors[j] = new THREE.Color(pathColor);
					satDict[satName].geometry.colorsNeedUpdate = true;
				}
				else if (current == 0 && prev > 0) {
					pathColor = 0x0000ff;
					satDict[satName].geometry.colors[j] = new THREE.Color(pathColor);
					satDict[satName].geometry.colorsNeedUpdate = true;
				}
				else {
					satDict[satName].geometry.colors[j] = new THREE.Color(pathColor);
					satDict[satName].geometry.colorsNeedUpdate = true;
				}
				prev = current;
			}
		}
	}
	
	//used for when the 'All' button is checked for either the GroundSites or Spacecraft section.
	function checkAll(check, cl) {
		var checkboxes = document.getElementsByClassName(cl);
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].className == 'spacecraftCheck') {
				if (check) {
					checkboxes[i].checked = true;
					satDict[checkboxes[i].name].visible = true;
					satImg[checkboxes[i].name].visible = true;
				}
				else {
					checkboxes[i].checked = false;
					satDict[checkboxes[i].name].visible = false;
					satDict[checkboxes[i].name].material.opacity = 0.4;
					satImg[checkboxes[i].name].visible = false;
				}
			}
			else {
				if (check) {
					checkboxes[i].checked = true;
					groundSites[checkboxes[i].name].visible = true;
				}
				else {
					checkboxes[i].checked = false;
					groundSites[checkboxes[i].name].visible = false;
				}
			}
		}
		if (cl == 'gsCheck') {
			var activeGS = [];
			for (var i = 0; i < checkboxes.length; i++) {
				if (checkboxes[i].checked) {
					activeGS.push(i);
				}
			}
			addVisiblePath(activeGS);
		}
	}
	
	//used for when one checkbox is clicked in the GroundSites or Spacecraft sections
	function checkboxClick(name, check, cl) {
		var allButton;
		if (cl == 'spacecraftCheck') {
			var sat = satDict[name];
			var img = satImg[name];
			if (check) {
				sat.visible = true;
				img.visible = true;
			}
			else {
				sat.visible = false;
				img.visible = false;
				sat.material.opacity = 0.4;
			}
			allButton = 'allCheck';
		}
		else {
			var gs = groundSites[name];
			if (check) {
				gs.visible = true;
			}
			else {
				gs.visible = false;
			}
			allButton = 'gsAll';
		}
		var checkboxes = document.getElementsByClassName(cl);
		checkForAllChecked(checkboxes,allButton,cl);
	}

	//takes the previously checked checkbox, and determines whether all of the checkboxes in that section are checked
	function checkForAllChecked(checkboxes, buttonName, cl) {
		var numChecked = 0;
		var allButton = document.getElementById(buttonName);
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].className == cl) {
				if (checkboxes[i].checked == true) {
					numChecked += 1;
				}
			}
		}
		if (numChecked == checkboxes.length) {
			allButton.checked = true;
		}
		else {
			allButton.checked = false;
		}
		if (cl == 'gsCheck') {
			var activeGS = [];
			for (var i = 0; i < checkboxes.length; i++) {
				if (checkboxes[i].checked) {
					activeGS.push(i);
				}
			}
			addVisiblePath(activeGS);
		}
	}
	
	//creates all of the spacecraft elements of the sidebar
	function craftList() {
		var text = "";
		for (var i = 0; i < spacecraft.length; i++) {
			text += "<label>" + spacecraft[i] + "<input type=" + "\"" + "checkbox" + "\"" + " id=" + "\"" + spacecraft[i] + "\"" + "class=" + "\"" + "spacecraftCheck" + "\"" + " name =" + "\"" + spacecraft[i] + "\"" + "></label><hr>"
		}
		document.getElementById("listCraft").innerHTML = text;
	}
	
	//creates all of the groundsite elements of the sidebar
	function gsList() {
		var text = "";
		
		for (var i = 0; i < sites.length; i++) {
			text += "<label>" + sites[i].name + "<input type=" + "\"" + "checkbox" + "\"" + " id=" + "\"" + sites[i].name + "\"" + "class=" + "\"" + "gsCheck" + "\"" + " name =" + "\"" + sites[i].name + "\"" + "></label><hr>"
		}
		document.getElementById("listgs").innerHTML = text;
	}
		
    //Creates the earth, starfield, and lights
    function createEarth() {
        var planet = new THREE.SphereGeometry(10, 128, 128);
		var planetMat = new THREE.MeshPhongMaterial();
        var TextureLoader = new THREE.TextureLoader(manager);
        TextureLoader.load('img/marble.png', function (texture) {
            texture.anisotropy = 8;
            planetMat.map = texture;
			planetMat.shininess = 0;
			planetMat.roughness = 1;
            planetMat.needsUpdate = false;
        });
        var outlineMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.BackSide});
        var outlineMesh = new THREE.Mesh(planet, outlineMaterial);
        outlineMesh.scale.multiplyScalar(1.003);
        var planetMesh = new THREE.Mesh(planet, planetMat);
        planetMesh.add(outlineMesh);
		planetMesh.name = "globe";
		planetMesh.castShadow = true;
		planetMesh.receiveShadow = true;
        scene.add(planetMesh);
		
		var cloudGeo = new THREE.SphereGeometry(10.08,64,64);
		var cloudMat = new THREE.MeshPhongMaterial({color: 0xffffff, transparent: true, opacity: .7});
		TextureLoader.load('img/clouds.png', function (texture) {
            texture.anisotropy = 8;
            cloudMat.map = texture;
			cloudMat.shininess = 0;
            cloudMat.needsUpdate = false;
			
        });
		var clouds = new THREE.Mesh(cloudGeo, cloudMat);
		clouds.castShadow = true;
		clouds.receiveShadow = true;
		scene.add(clouds);
		
		var stars = new THREE.SphereGeometry(500000, 64, 64);
		var starsMat = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.BackSide});
		TextureLoader.load('img/milkyWay.jpg', function (texture) {
			texture.anisotropy = 8;
			starsMat.map = texture;
			starsMat.needsUpdate = false;
		});
		var starsMesh = new THREE.Mesh(stars, starsMat);
		scene.add(starsMesh);
		
		//adds an ambient light so the dark side of the earth can be seen. Also adds a directional light
		//to act as the sun.
		scene.add(new THREE.AmbientLight(0x202020));
		light = new THREE.DirectionalLight(0xeeeeff, 1.6);
		
		// I don't know why you have to subtract a month off, but you do in order to get the
		//correct date. You also need to subtract 6 hours in order to get the correct UTC time
		var d = new Date(rawSatData[0].year, rawSatData[0].month - 1, 
		rawSatData[0].day, rawSatData[0].hour - 6, rawSatData[0].minute - 1);
		satTime = d = d.getTime();
		
		var currentTime = Date.now();
		var timeDiff = Math.floor((currentTime-d)/60000) - 1;
		//positions the directional light so it is above the same point on the earth as the sun
		var r, lat, lon, x, y, z;
		r = 20;
		for (var i = 0; i < numOrbitalPts; i++) {
			lat = sunArr[i].lat;
			lon = sunArr[i].lon;
			var phi = (90-lat)*(Math.PI/180);
			var theta = (lon+180)*(Math.PI/180);

			x = -((r) * Math.sin(phi)*Math.cos(theta));
			z = ((r) * Math.sin(phi)*Math.sin(theta));
			y = ((r) * Math.cos(phi));
			var vert = new THREE.Vector3(x, y, z);
			sunPos.push(vert);
			if (i == timeDiff) {
				light.position.set(x,y,z);
			}
		}
		light.shadowMapVisible = true;
		light.castShadow = true;
		scene.add(light);
    }
	
	//creates all of the groundsite markers
	function groundSite() {
		var r = 10;
		for (var i = 0; i < sites.length; i++) {
			var lat = sites[i].latidute;
			var lon = sites[i].longitude;
			var phi   = (90-lat)*(Math.PI/180);
			var theta = (lon+180)*(Math.PI/180);
			var x = -((r) * Math.sin(phi)*Math.cos(theta));
			var y = ((r) * Math.cos(phi));
			var z = ((r) * Math.sin(phi)*Math.sin(theta));
			var geometry = new THREE.BoxGeometry(.04, .04, 3);
			var material = new THREE.MeshBasicMaterial({color: 0xffff00});
			var cube = new THREE.Mesh(geometry, material);
			//creates an elongated yellow cube to show the location of the groundsite
			cube.position.set(x, y, z);
			//rotates the cube to radiate out from the center of the globe
			cube.lookAt(new THREE.Vector3(0, 0, 0));
			cube.visible = false;
			var gName = sites[i].name;
			groundSites[gName] = cube;			
			scene.add(cube);
		}
	}
	
	// creates the path of the satellites based on the information in the csv
	function satPath() {
		//number of spacecraft to be shown
		numCraft = rawSatData.length/numOrbitalPts;
		var r, lat, lon, x, y, z, phi, theta;
		var timeDiff;
		for (var i = 0; i < numCraft; i++) {
			var material = new THREE.LineBasicMaterial({color: 0xffffff, vertexColors: THREE.VertexColors, transparent: true});
			var geometry = new THREE.Geometry();
			var satName = rawSatData[i*numOrbitalPts].name;
			var prev = 0;
			for (var j = 0; j < numOrbitalPts; j++) {
				var current = 0;
				var index = i*numOrbitalPts+j;
				if (rawSatData[index].second > 30) {
				rawSatData[index].second = 0;
				rawSatData[index].minute += 1;
				}
				else {
					rawSatData[index].second = 0;
				}
				
				//this just grabs the first element of the time array and spits out timeDiff, which
				// is the index of the next orbital point from where we currently are
				if (i == 0 && j == 0) {
					var currentTime = Date.now();
					timeDiff = Math.floor((currentTime-satTime)/60000);
				}

				r = ((rawSatData[index].elevation+6378)*10/6378);
				lat = rawSatData[index].latitude;
				lon = rawSatData[index].longitude;
				phi = (90-lat)*(Math.PI/180);
				theta = (lon+180)*(Math.PI/180);

				x = -((r) * Math.sin(phi)*Math.cos(theta));
				z = ((r) * Math.sin(phi)*Math.sin(theta));
				y = ((r) * Math.cos(phi));
				
				var vert = new THREE.Vector3(x, y, z);
				
				geometry.colors[j] = new THREE.Color(0x0000ff);
				geometry.vertices.push(vert);
				prev = current;
				
				if (j == timeDiff) {
					//this adds the satellite sprites at the location on each path where the satellite
					//should be in real time.
					if (satName == "ISS (ZARYA)") {
						var spriteMap = new THREE.TextureLoader().load( 'img/iss.png' );
						var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
						var sprite = new THREE.Sprite( spriteMaterial);
						sprite.scale.set(1, 1, 1);
						sprite.position.set(x, y, z);
						scene.add( sprite );
						sprite.visible = false;
					}
					else {
						
						var imgLoc = 'img/satellite.png';
						var spriteMap = new THREE.TextureLoader().load( imgLoc );
						var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff} );
						var sprite = new THREE.Sprite( spriteMaterial );
						var imgScale = r/12;
						if (imgScale > 10) {
							imgScale = 10;
						}
						
						//the sprite is scaled accordingly to how far away it is from the earth.
						//This just makes it easier to see. It should update position and scale 
						//in the updateSat() function
						sprite.scale.set(imgScale, imgScale, 1);
						sprite.position.set(x, y, z);
						scene.add( sprite );
						sprite.visible = false;
					}
					sprite.name = satName;
					//adds the sprite to a dictionary for ease of use later
					satImg[satName] = sprite;
				}
			}
			// creates the line using the orbital points we gave it and adds the line to the scene.
			// the line is not visible when the app first starts.
			var line = new THREE.Line( geometry, material );
			line.name = satName;
			scene.add(line);
			line.visible = false;
			// adds the line to a dictionary for easy access later
			satDict[satName] = line;
			//spacecraft is a list of spacecraft names that makes it easier to set up the checkboxes
			//and their functionality
			spacecraft.push(satName);
		}
	}
	
	
    function init() {
        
        window.onkeyup = function (e) {
            var key = e.keyCode ? e.keyCode : e.which;
            if (key == 32) {
                controls.autoRotate = !controls.autoRotate;
            }
        };
        setupScene();
        setupControls();
        createEarth();
		satPath();
		groundSite();
		gsList();
		craftList();
    }
	
	//checks to see if the mouse is hovering over an element on the canvas
    function checkForRaycasts() {
        raycaster.setFromCamera(mouse, camera);
        for (var i = 1; i < scene.children.length; i++) {
			if (scene.children[i].type == "Line") {
				if (scene.children[i].name == clickedObj) {continue;}
				scene.children[i].material.opacity = 0.4;
			}
        }
        //calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects(scene.children);
        //only first intersect
        if (intersects.length != 0) {
			if (mouse.x > -.68) {
				if (intersects[0].object.type == "Line") {
					intersects[0].object.material.opacity = 1.0;
				}
				else if (intersects[0].object.type == "Sprite") {
					//console.log(intersects[0].object.name);
				}
			}
        }
    }
	
    function render() {
        requestAnimationFrame(render);
		try {
			updateOrbits();
		}
		catch(e) {}
        controls.update();
        if (mouse.x < sceneW) {
            checkForRaycasts();
        }
        renderer.render(scene, camera);
    }
	
	//https://d3-wiki.readthedocs.io/zh_CN/master/CSV/
	//grabs the data regarding the sun's location in a 24 hour period
	d3.csv('data/sun.csv', function (d) {
        return {
			lat: +d.lat,
			lon: +d.lon,
        };
    }, function (data) {
        sunArr = data.slice(); 
    });
	
	//grabs the data regarding the groundsite locations
	d3.csv('data/groundData.csv', function (d) {
        return {
			name: d.name,
			latidute: +d.lat,
			longitude: +d.lon,
        };
    }, function (data) {
        sites = data.slice();
    });
	
	//reads in an integer that is the total number of orbital points each satellite path has
	d3.csv('data/orbitLength.csv', function (d) {
        return {
			l: +d.len
        };
    }, function (data) {
        numOrbitalPts = data.slice();
		numOrbitalPts = numOrbitalPts[0].l;
    });
	
	//grabs the data regarding each satellite's location at each minute over a 24 hour period
	d3.csv('data/satelliteData.csv', function (d) {
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
            h1: +d.h1,
			h2: +d.h2,
			h3: +d.h3,
			h4: +d.h4,
			h5: +d.h5,
			h6: +d.h6,
			h7: +d.h7,
			h8: +d.h8,
			h9: +d.h9,
			h10: +d.h10,
			h11: +d.h11,
			h12: +d.h12,
			h13: +d.h13,
			h14: +d.h14,
			h15: +d.h15
        };
    }, function (data) {
        rawSatData = data.slice();
		init();
    });
	
	document.querySelector('#gsAll').onclick = function (ev) {
		try{checkAll(ev.target.checked, 'gsCheck');}
		catch(e) {}
	}
	document.querySelector('#gsAll').onkeyup = function (ev) {
		try{ev.preventDefault();}
		catch(e) {}
	}
	document.querySelector('#listgs').onclick = function (ev) {
		try{checkboxClick(ev.target.name,ev.target.checked,'gsCheck');}
		catch(e) {}
	}
	document.querySelector('#listgs').onkeyup = function (ev) {
		try{ev.preventDefault();}
		catch(e) {}
	}
	document.querySelector('#allCheck').onclick = function (ev) {
		try{checkAll(ev.target.checked, 'spacecraftCheck');}
		catch(e) {}
	}
	document.querySelector('#allCheck').onkeyup = function (ev) {
		try{ev.preventDefault();}
		catch(e) {}
	}
	document.querySelector('#listCraft').onclick = function (ev) {
		try{checkboxClick(ev.target.name,ev.target.checked,'spacecraftCheck');}
		catch(e) {}
	}
	document.querySelector('#listCraft').onkeyup = function (ev) {
		try{ev.preventDefault();}
		catch(e) {}
	}
	
	document.addEventListener( 'click', function(ev) {
		raycaster.setFromCamera(mouse, camera);
		for (var i = 1; i < scene.children.length; i++) {
			if (scene.children[i].type == "Line") {
				if (scene.children[i].name == clickedObj) {continue;}
				scene.children[i].material.opacity = 0.4;
			}
		}
		//calculate objects intersecting the picking ray
		var intersects = raycaster.intersectObjects(scene.children);
		if (mouse.x > -.68) {
			//only first intersect
			if (intersects.length != 0) {
				if (intersects[0].object.type == "Line") {
					if (intersects[0].object.material.opacity == 1.0) {
						intersects[0].object.material.opacity = 0.4;
						clickedObj = null;
					}
					else {
					intersects[0].object.material.opacity = 1.0;
					clickedObj = intersects[0].object.name;
					}	
				}
				else if (intersects[0].object.type == "Sprite") {
					console.log(intersects[0].object.name, "sprite");
				}
			}
		}
	}, false);
	
	//prevents the arrow keys from being used
	window.addEventListener("keydown", function(e) {
			// space and arrow keys
			if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
				e.preventDefault();
			}
		}, false);
	window.addEventListener( 'resize', function (){
		try{
			camera.aspect = window.innerWidth/.83/window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth/.83,window.innerHeight);
		}
		catch(e) {}
	}, false );
	window.addEventListener('mousemove', function (ev) {
		try{
			// calculate mouse position in normalized device coordinates
			// (-1 to +1) for both components
			mouse.x = ((ev.clientX - renderer.domElement.offsetLeft)/renderer.domElement.clientWidth)*2-1;
			mouse.y = - ((ev.clientY - renderer.domElement.offsetTop)/renderer.domElement.clientHeight)*2+1;
		}
        catch(e) {}
    }, false);
})(window, document);
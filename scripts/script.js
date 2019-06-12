(function (window, document, undefined) {
    var canvas;
    var scene, camera, renderer, controls, manager;
    var windowW = window.innerWidth;
    var sceneW = window.innerWidth / .8; //size of the whole screen, adding /.8; after innerWidth moves the globe to the right
    var windowH = window.innerHeight;
	
    var raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 0.1;
	var divisor = 3400; //the divisor variable is set to 3400 because we expect the whole thing to run at about 3400/60 = ~57 fps
    var mouse = new THREE.Vector2();
	var numCraft;
	var len;
	var rawSatData = []; //the array holding all the satellite data after parsing the csv
	var spacecraft = []; //an array of the names of the satellites (for ease of use across multiple functions)
	var satTime;
	var sites = []; //the array holding all the groundsite data after parsing the csv
	var satDict = {}; // dictionary of satellite paths
	var satImg = {}; // dictionary of satellite sprites
	var groundSites = {}; // dictionary of groundsite markers
	
    function onMouseMove(event) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = (event.clientX / sceneW) * 2 - 1;
        mouse.y = -(event.clientY / windowH) * 2 + 1;
    }

	window.addEventListener( 'resize', onWindowResize, false );
	window.addEventListener('mousemove', onMouseMove, false);
	document.addEventListener('visibilitychange', function () {
	  if (!document.hidden) {
		  var d = Date.now();
			var timeDiff = Math.floor((d-satTime)/60000);
			for ( var i = 0; i < numCraft; i++) {
				var satName = rawSatData[i*len[0].l].name;
				satImg[satName].position.x = satDict[satName].geometry.vertices[timeDiff-1].x;
				satImg[satName].position.y = satDict[satName].geometry.vertices[timeDiff-1].y;
				satImg[satName].position.z = satDict[satName].geometry.vertices[timeDiff-1].z;	
			}
		}
	}, false)
	
	function openSideBar() {
		setTimeout(function(){
		document.getElementById("gsTitle").style.width = "20%";
		document.getElementById("gsTitle").style.height = "20%"
		document.getElementById("gsTitle").style.top = "0%";
		document.getElementById("gsTitle").visible = true;
		document.getElementById("gsnav").style.width = "20%";
		document.getElementById("gsnav").style.height = "22%"
		document.getElementById("gsnav").style.top = "14%";
		document.getElementById("gsnav").visible = true;
		document.getElementById("spacecraftTitle").style.width = "20%";
		document.getElementById("spacecraftTitle").style.height = "20%"
		document.getElementById("spacecraftTitle").style.top = "37%";
		document.getElementById("spacecraftTitle").visible = true;
		document.getElementById("craftnav").style.width = "20%";
		document.getElementById("craftnav").style.height = "49%";
		document.getElementById("craftnav").style.top = "51%";
		document.getElementById("craftnav").visible = true;
		}, 500);
		setTimeout(function() {
			document.getElementById("check").checked = true;
			document.getElementById("about").style.opacity = "1";
		}, 1400);
		$('body').addClass('loaded');
	}

	document.querySelector('#gsAll').onclick = function (ev) {
		checkAll(ev.target.checked, 'gsCheck');
	}
	document.querySelector('#gsAll').onkeyup = function (ev) {
		ev.preventDefault();
	}
	document.querySelector('#listgs').onclick = function (ev) {
		checkClick(ev.target.name,ev.target.checked,'gsCheck');
	}
	document.querySelector('#listgs').onkeyup = function (ev) {
		ev.preventDefault();
	}
	document.querySelector('#allCheck').onclick = function (ev) {
		checkAll(ev.target.checked, 'spacecraftCheck');
	}
	document.querySelector('#allCheck').onkeyup = function (ev) {
		ev.preventDefault();
	}
	document.querySelector('#listCraft').onclick = function (ev) {
		checkClick(ev.target.name,ev.target.checked,'spacecraftCheck');
	}
	document.querySelector('#listCraft').onkeyup = function (ev) {
		ev.preventDefault();
	}
	
	//the following function moves the satellites along the path in real time
	function updateSat() {
		var d = Date.now();
		
		//this gives us the index of the orbital point we are headed towards
		var timeDiff = Math.floor((d-satTime)/60000);
		for ( var i = 0; i < numCraft; i++) {
			var satName = rawSatData[i*len[0].l].name;
			// updates the position of the satellite to be be an addition 1/3400 closer to the next orbital point
			satImg[satName].position.x+= (satDict[satName].geometry.vertices[timeDiff].x - satImg[satName].position.x)/divisor;
			satImg[satName].position.y+= (satDict[satName].geometry.vertices[timeDiff].y - satImg[satName].position.y)/divisor;
			satImg[satName].position.z+= (satDict[satName].geometry.vertices[timeDiff].z - satImg[satName].position.z)/divisor;
			if (satName != "ISS ZARYA") {
				var r = ((rawSatData[i*len[0].l].elevation+6378)*10/6378)/12;
				if (r > 10) r = 10;
				satImg[satName].scale = (r, r, 1);
			}
		}
		divisor -= 1;
		if (divisor == 0) { divisor = 3400;}
	}
	
	function searchBox(k, boxes) {
		for (var i = 0; i < boxes.length; i++) {
			if (boxes[i] == k) return true;
		}
		return false;
	}
	
	function addVisiblePath(checkboxes) {
		for (var i = 0; i < numCraft; i++) {
			var pathColor = 0x0000ff;
			var satName = rawSatData[i*len[0].l].name;
			var prev = 0;
			for (var j = 0; j < len[0].l - 1; j++) {
				var current = 0;
				if (searchBox(0, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h1;
				}
				if (searchBox(1, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h2;
				}
				if (searchBox(2, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h3;
				}
				if (searchBox(3, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h4;
				}
				if (searchBox(4, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h4;
				}
				if (searchBox(5, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h6;
				}
				if (searchBox(6, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h7;
				}
				if (searchBox(7, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h8;
				}
				if (searchBox(8, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h9;
				}
				if (searchBox(9, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h10;
				}
				if (searchBox(10, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h11;
				}
				if (searchBox(11, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h12;
				}
				if (searchBox(12, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h13;
				}
				if (searchBox(13, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h14;
				}
				if (searchBox(14, checkboxes)) {
					current += rawSatData[i*len[0].l+j].h15;
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
	
	function checkClick(name, check, cl) {
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
	
	function craftList() {
		var text = "";
		for (var i = 0; i < spacecraft.length; i++) {
			text += "<label>" + spacecraft[i] + "<input type=" + "\"" + "checkbox" + "\"" + " id=" + "\"" + spacecraft[i] + "\"" + "class=" + "\"" + "spacecraftCheck" + "\"" + " name =" + "\"" + spacecraft[i] + "\"" + "></label><hr>"
		}
		document.getElementById("listCraft").innerHTML = text;
	}
	
	function gsList() {
		var text = "";
		
		for (var i = 0; i < sites.length; i++) {
			text += "<label>" + sites[i].name + "<input type=" + "\"" + "checkbox" + "\"" + " id=" + "\"" + sites[i].name + "\"" + "class=" + "\"" + "gsCheck" + "\"" + " name =" + "\"" + sites[i].name + "\"" + "></label><hr>"
		}
		document.getElementById("listgs").innerHTML = text;
	}
	
    // Three.js setup procedure
    function setupScene() {
        scene = new THREE.Scene();
        canvas = document.getElementById("scene");
        renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
        renderer.setSize(sceneW, windowH);
        renderer.setClearColor(0x000000, 1);
        camera = new THREE.PerspectiveCamera(60, sceneW / windowH, 0.5, 10000);
        camera.position.z = 22;
		camera.position.y = 13;
        renderer.shadowMap.enabled = false;
        manager = new THREE.LoadingManager();
        manager.onLoad = function () {openSideBar();render();};
    }
	
	function onWindowResize(){
		camera.aspect = window.innerWidth/.77/window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth/.77,window.innerHeight);
	}
	
    //Three.OrbitControls setup procedure
    function setupControls() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0.04;
        controls.rotateSpeed = 0.2;
        controls.enableDamping = true;
        controls.dampingFactor = 0.3;
        controls.enablePan = false;
		controls.minDistance = 20.5;
		controls.maxDistance = 850;
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
        scene.add(planetMesh);
    }
	
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
		numCraft = rawSatData.length/len[0].l;
		var r, lat, lon, x, y, z;
		var timeDiff;
		for (var i = 0; i < numCraft; i++) {
			var material = new THREE.LineBasicMaterial({color: 0xffffff, vertexColors: THREE.VertexColors, transparent: true});
			var geometry = new THREE.Geometry();
			var satName = rawSatData[i*len[0].l].name;
			var prev = 0;
			for (var j = 0; j < len[0].l; j++) {
				var current = 0;
				if (rawSatData[i*len[0].l+j].second > 30) {
				rawSatData[i*len[0].l+j].second = 0;
				rawSatData[i*len[0].l+j].minute += 1;
				}
				else {
					rawSatData[i*len[0].l+j].second = 0;
				}
				
				//this just grabs the first element of the time array and spits out timeDiff, which
				// is the index of the next orbital point from where we currently are
				if (i == 0 && j == 0) {
					// I don't know why you have to subtract a month off, but you do in order to get the
					//correct date. You also need to subtract 6 hours in order to get the correct UTC time
					var d = new Date(rawSatData[i*len[0].l+j].year, rawSatData[i*len[0].l+j].month - 1, 
					rawSatData[i*len[0].l+j].day, rawSatData[i*len[0].l+j].hour - 6, rawSatData[i*len[0].l+j].minute - 1);
					d = d.getTime();
					satTime = d;
					var currentTime = Date.now();
					timeDiff = Math.floor((currentTime-satTime)/60000);
				}

				r = ((rawSatData[i*len[0].l+j].elevation+6378)*10/6378);
				lat = rawSatData[i*len[0].l+j].latitude;
				lon = rawSatData[i*len[0].l+j].longitude;
				var phi = (90-lat)*(Math.PI/180);
				var theta = (lon+180)*(Math.PI/180);

				x = -((r) * Math.sin(phi)*Math.cos(theta));
				z = ((r) * Math.sin(phi)*Math.sin(theta));
				y = ((r) * Math.cos(phi));
				
				var vert = new THREE.Vector3(x, y, z);
				
				geometry.colors[j] = new THREE.Color(0x0000ff);
				geometry.vertices.push(vert);
				prev = current;
				
				if (j == timeDiff - 1) {
					//this adds the satellite sprites at the location on each path where the satellite
					//should be in real time. I kind of manually moved the location by subtracting 1 from
					// the timeDiff index, as that seemed to correctly place the satellite sprite.
					if (satName == "ISS (ZARYA)") {
						var spriteMap = new THREE.TextureLoader().load( 'img/iss1.png' );
						var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
						var sprite = new THREE.Sprite( spriteMaterial);
						sprite.scale.set(1, 1, 1);
						sprite.position.set(x, y, z);
						scene.add( sprite );
						sprite.visible = false;
					}
					else {
						// I was going to have some fun and have each satellite image randomly selected to 
						//give some variety, but I commented out the code so it just uses the sat3.png image
						//var img =  Math.floor(Math.random() * 3) + 1;
						//var imgLoc = 'img/sat' + img + '.png'
						var spriteMap = new THREE.TextureLoader().load( /*imgLoc*/ 'img/sat3.png' );
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
		satPath();
		groundSite();
		gsList();
		craftList();
    }
	
    function checkForRaycasts() {
        raycaster.setFromCamera(mouse, camera);
        for (var i = 1; i < scene.children.length; i++) {
			if (scene.children[i].type == "Line") {
				scene.children[i].material.opacity = 0.4;
			}
        }
        //calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects(scene.children);
        //only first intersect
        if (intersects.length != 0) {
            if (intersects[0].object.type == "Line") {
                intersects[0].object.material.opacity = 1.0;
            }
			else if (intersects[0].object.type == "Sprite") {
                console.log(intersects[0].object.name);
            }
        }
    }
	
    function render() {
        requestAnimationFrame(render);
		updateSat();
        controls.update();
        if (mouse.x < sceneW) {
            checkForRaycasts();
        }
        renderer.render(scene, camera);
    }
	
	d3.csv('data/groundData.csv', function (d) {
        return {
			name: d.name,
			latidute: +d.lat,
			longitude: +d.lon,
        };
    }, function (data) {
        sites = data.slice(); //copy 
    });
	
	d3.csv('data/orbitLength.csv', function (d) {
        return {
			l: +d.len
        };
    }, function (data) {
        len = data.slice(); //copy 
    });
	
	// pulls the satellite data from the .csv and populates a list with it
	//https://d3-wiki.readthedocs.io/zh_CN/master/CSV/
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
        rawSatData = data.slice(); //copy
		init();
    });
	

})(window, document);

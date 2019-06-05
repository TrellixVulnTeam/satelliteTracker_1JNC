/*
TODO:
tab for instructions/explanation:
	https://www.w3schools.com/howto/howto_js_tabs.asp
	https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_tabs_fade

show satellite current position, along with updated positions as time goes on
// tween.js			https://gist.github.com/vincent/4ce2f9f37b1ac846f84c

add/remove groundsites. For adding, I may be able to just hold the orbital data in
python and just rerun the above_horizon on them based on the new groundsite information
I guess I'll need to do this for removing as well, because I will need to keep the 
above_horizon data for the other groundsites. I guess I could just create arrays for each
groundsite and add a 1 if a spacecraft is above the horizon and a 0 if it isn't. I can then
add the arrays together to a final array to send off to the javascript portion. That way,
if I'm just removing one groundsite out of five, for example, it would just mean not adding
the 1s from that groundsite's array to the final array. This could speed things up.
*/
(function (window, document, undefined) {
    //ensure strict mode
    'use strict';
    var canvas;
    var scene, camera, renderer, controls, manager; // , stats;
    var windowW = window.innerWidth;
    var sceneW = window.innerWidth / .8; //      size of the whole screen, adding /.8; after innerWidth moves the globe to the right
    var windowH = window.innerHeight;
	
    var raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 0.1;
	
    var mouse = new THREE.Vector2();
    var parseDate = d3.time.format("%m/%d/%Y").parse;
    var groundSites = {};
	var OL;
	var numCraft;
	var spacecraft = [];
	var len;
	var sites = [];
	var satDict = {};
	var rawSatData = []; //the array holding all the satellite data after parsing csv
	
	
    function onMouseMove(event) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = (event.clientX / sceneW) * 2 - 1;
        mouse.y = -(event.clientY / windowH) * 2 + 1;
    }

	window.addEventListener( 'resize', onWindowResize, false );
	
	function openSideBar() {
		setTimeout(function(){
		document.getElementById("gsTitle").style.width = "20%";
		document.getElementById("gsTitle").style.height = "20%"
		document.getElementById("gsTitle").style.top = "0%";
		document.getElementById("gsTitle").visible = true;
		document.getElementById("gsnav").style.width = "20%";
		document.getElementById("gsnav").style.height = "20%"
		document.getElementById("gsnav").style.top = "17%";
		document.getElementById("gsnav").visible = true;
		document.getElementById("spacecraftTitle").style.width = "20%";
		document.getElementById("spacecraftTitle").style.height = "20%"
		document.getElementById("spacecraftTitle").style.top = "37%";
		document.getElementById("spacecraftTitle").visible = true;
		document.getElementById("craftnav").style.width = "20%";
		document.getElementById("craftnav").style.height = "46%";
		document.getElementById("craftnav").style.top = "54%";
		document.getElementById("craftnav").visible = true;
		}, 500);
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
	
	function searchBox(k, boxes) {
		for (var i = 0; i < boxes.length; i++) {
			if (boxes[i] == k) return true;
		}
		return false;
	}
	
	function addVisiblePath(checkboxes) {
		for (var i = 0; i < numCraft; i++) {
			var pathColor = 0x0000ff;
			var satName = rawSatData[i*OL].name;
			var prev = 0;
			for (var j = 0; j < OL - 1; j++) {
				var current = 0;
				if (searchBox(0, checkboxes)) {
					current += rawSatData[i*OL+j].h1;
				}
				if (searchBox(1, checkboxes)) {
					current += rawSatData[i*OL+j].h2;
				}
				if (searchBox(2, checkboxes)) {
					current += rawSatData[i*OL+j].h3;
				}
				if (searchBox(3, checkboxes)) {
					current += rawSatData[i*OL+j].h4;
				}
				if (searchBox(4, checkboxes)) {
					current += rawSatData[i*OL+j].h4;
				}
				if (searchBox(5, checkboxes)) {
					current += rawSatData[i*OL+j].h6;
				}
				if (searchBox(6, checkboxes)) {
					current += rawSatData[i*OL+j].h7;
				}
				if (searchBox(7, checkboxes)) {
					current += rawSatData[i*OL+j].h8;
				}
				if (searchBox(8, checkboxes)) {
					current += rawSatData[i*OL+j].h9;
				}
				if (searchBox(9, checkboxes)) {
					current += rawSatData[i*OL+j].h10;
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
				}
				else {
					checkboxes[i].checked = false;
					satDict[checkboxes[i].name].visible = false;
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
			if (check) {
				sat.visible = true;
			}
			else {
				sat.visible = false;
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
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.05;
        controls.rotateSpeed = 0.2;
        controls.enableDamping = true;
        controls.dampingFactor = 0.3;
        controls.enablePan = false;
		controls.minDistance = 20.5;
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
			var geometry = new THREE.BoxGeometry(.03, .03, 2);
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
		//list of orbital points per spacecraft
		OL = len[0].l;
		//number of spacecraft to be shown
		numCraft = rawSatData.length/OL;
		var r, lat, lon, x, y, z;
		
		for (var i = 0; i < numCraft; i++) {
			var material = new THREE.LineBasicMaterial({color: 0xffffff, vertexColors: THREE.VertexColors, transparent: true});
			var geometry = new THREE.Geometry();
			var satName = rawSatData[i*OL].name;
			var prev = 0;
			for (var j = 0; j < OL - 1; j++) {
				var current = 0;
				if (rawSatData[i*OL+j].second > 30) {
				rawSatData[i*OL+j].second = 0;
				rawSatData[i*OL+j].minute += 1;
				}
				else {
					rawSatData[i*OL+j].second = 0;
				}

				r = ((rawSatData[i*OL+j].elevation+6378)*10/6378);
				lat = rawSatData[i*OL+j].latitude;
				lon = rawSatData[i*OL+j].longitude;
				var phi = (90-lat)*(Math.PI/180);
				var theta = (lon+180)*(Math.PI/180);

				x = -((r) * Math.sin(phi)*Math.cos(theta));
				z = ((r) * Math.sin(phi)*Math.sin(theta));
				y = ((r) * Math.cos(phi));
				
				geometry.colors[j] = new THREE.Color(0x0000ff);
				geometry.vertices.push(new THREE.Vector3(x, y, z));
				prev = current;
			}
			var line = new THREE.Line( geometry, material );
			line.name = satName;
			scene.add(line);
			line.visible = false;
			satDict[satName] = line;
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
            scene.children[i].material.opacity = 0.5;
        }
        //calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects(scene.children);
        //only first intersect
        if (intersects.length != 0) {
            if (print) print = false;
            if (intersects[0].object.type == "Line") {
                intersects[0].object.material.opacity = 1.0;
            }
        }
    }
	
    function render() {
        requestAnimationFrame(render);
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
			h10: +d.h10
        };
    }, function (data) {
        rawSatData = data.slice(); //copy
		init();
    });
	

})(window, document);

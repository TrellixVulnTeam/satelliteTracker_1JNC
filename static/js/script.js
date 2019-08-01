(function (window, document, undefined) {
	var thing;
    var canvas;	
	var bitmap = document.createElement('canvas');
	var tooltipSprite, g = bitmap.getContext('2d', {antialias: true, depth: false});
    var scene, camera, renderer, controls, manager, light;
    var windowW = window.innerWidth; //size of the whole window
    var sceneW = window.innerWidth / .83; //size of the scene, dividing innerWidth by .83 moves the globe to the right
    var windowH = window.innerHeight;//width of the window
	
    var raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 0.1;
	
	//https://github.com/typeiii/jquery-csv
	
    var mouse = new THREE.Vector2(); //used to calculate the current position of the mouse in 2D space
	var numCraft; // number of satellites
	var numOrbitalPts; //number of points for each satellite path
	var satData = []; //the array holding all the satellite data after parsing the csv
	var spacecraft = []; //an array of the names of the satellites (for ease of use across multiple functions)
	var satTime; // the first datetime in the satellite data. Used to calculate an index in updateSat() and visibilitychange eventlistener
	var sites = []; //the array holding all the groundsite data after parsing the csv
	var sunArr = []; //the array holding the latitude and longitude of the subsolar points over a 24 hour period
	var sunPos = []; //the array of x,y,z positions for the light representing the sun
	var satDict = {}; // dictionary of satellite paths
	var satImg = {}; // dictionary of satellite sprites
	var groundSites = {}; // dictionary of groundsite markers
	var clickedObj = null; // the line that is currently clicked
	var uniforms;
	var clickLoc = new THREE.Vector2();
	horizon = [];
	
     // Three.js setup procedure
    function setupScene() {
		//https://stackoverflow.com/questions/12380072/threejs-render-text-in-canvas-as-texture-and-then-apply-to-a-plane
		//https://codepen.io/anon/pen/RzOEPg
        scene = new THREE.Scene();
        canvas = document.getElementById("scene");
		
		bitmap.width = 1024;
		bitmap.height = 1024;
		g.font = 'Bold 25px Arial';
		var texture = new THREE.Texture(bitmap);
		texture.needsUpdate = true;
		//var spriteMap = new THREE.TextureLoader().load( tex );
		var spriteMaterial = new THREE.SpriteMaterial( { map: texture, sizeAttenuation: false} );
		tooltipSprite = new THREE.Sprite( spriteMaterial);
		tooltipSprite.visible = false;
		scene.add(tooltipSprite);
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
			document.getElementById("craftnav").style.height = "46%";
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
			var satName = satData[i][0];
			//this gets the next position in the satDict dictionary, subtracts the current position to get the distance between the two, and multiplies by minuteFraction
			//before adding that new value back to the current position. That gives us the correct position at the current time.
			satImg[satName].position.x = ((satDict[satName].geometry.vertices[timeDiff+1].x-satDict[satName].geometry.vertices[timeDiff].x)*minuteFraction + satDict[satName].geometry.vertices[timeDiff].x);
			satImg[satName].position.y = ((satDict[satName].geometry.vertices[timeDiff+1].y-satDict[satName].geometry.vertices[timeDiff].y)*minuteFraction + satDict[satName].geometry.vertices[timeDiff].y);
			satImg[satName].position.z = ((satDict[satName].geometry.vertices[timeDiff+1].z-satDict[satName].geometry.vertices[timeDiff].z)*minuteFraction + satDict[satName].geometry.vertices[timeDiff].z);
			//if the satellite is not the ISS, update the satellite sprite's size based on its current distance from the earth
			if (satName != "ISS (ZARYA)") {
				var r = ((satData[i][1][timeDiff][2]+6378)*10/6378)/12;
				if (r > 10) r = 10;
				satImg[satName].scale = (r, r, 1);
			}
			else {
				for (var j = 0; j < numOrbitalPts.length; j++) {
					console.log(satData[i]);
				}

				//just for verification purposes, the following outputs the ISS' current latitude and longitude to check against other sources
				lla = ((satData[i][1][(timediff+1)][0] - satData[i][1][timediff][0])*minuteFraction + satData[i][1][timediff][0]);
				llo = ((satData[i][1][(timediff+1)][1] - satData[i][1][timediff][1])*minuteFraction + satData[i][1][timediff][1]);
				console.log("right: ", lla, llo);
			}
		}
		light.position.x = (sunPos[timeDiff].x - sunPos[timeDiff-1].x)*minuteFraction + sunPos[timeDiff-1].x;
		light.position.y = (sunPos[timeDiff].y - sunPos[timeDiff-1].y)*minuteFraction + sunPos[timeDiff-1].y;
		light.position.z = (sunPos[timeDiff].z - sunPos[timeDiff-1].z)*minuteFraction + sunPos[timeDiff-1].z;
		//updates the earth's day/night shader to be consistent with the sun's position
		uniforms.sunDirection.value.copy(light.position);
		uniforms.sunDirection.value.normalize();
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
			var satName = spacecraft[i];
			var prev = 0;
			for (var j = 0; j < numOrbitalPts; j++) {
				var current = 0;
				for (var k = 0; k < horizon[i].length; k++) {
					if (searchBox(0, checkboxes)) {
						current += horizon[i][k][j];
					}
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
					tooltipSprite.visible = false;
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
				tooltipSprite.visible = false;
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
			if (checkboxes[i].className == cl && checkboxes[i].checked == true) {
				numChecked += 1;
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
			text += "<label>" + sites[i][0] + "<input type=" + "\"" + "checkbox" + "\"" + " id=" + "\"" + sites[i][0] + "\"" + "class=" + "\"" + "gsCheck" + "\"" + " name =" + "\"" + sites[i][0] + "\"" + "></label><hr>"
		}
		document.getElementById("listgs").innerHTML = text;
	}
		
    //Creates the earth, starfield, and lights
    function createEarth() {
		/*the directional light acts like the sun. The intensity doesn't matter now that the day/night 
		shader is in place. I have added the light's intensity to the shader as commented out sections,
		as I didn't like how the light interacted with the shader.*/
		light = new THREE.DirectionalLight(0xeeeeff, 1);
		
		var currentTime = Date.now();
		var timeDiff = Math.floor((currentTime-satTime)/60000) - 1;
		//positions the directional light so it is above the same point on the earth as the sun
		var r, lat, lon, x, y, z;
		r = 20;
		for (var i = 0; i < sunArr.length; i++) {
			lat = sunArr[i][0];
			lon = sunArr[i][1];
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
		
		var TextureLoader = new THREE.TextureLoader(manager);
		
		//used for the shader to show the parts of the earth where it is currently day and night
		uniforms = {
				sunDirection: {
					value: light.position
				},
				/*sunIntensity: {
					value: light.intensity
				},*/
				dayTexture: {
					value: TextureLoader.load('static/img/marble.png', function (texture) {
							texture.anisotropy = 8;
							planetMat.map = texture;
							planetMat.shininess = 0;
							planetMat.roughness = 1;
							planetMat.needsUpdate = false;
						})
				},
				nightTexture: {
					value: TextureLoader.load('static/img/earthNight.jpg', function (texture) {
							texture.anisotropy = 8;
							planetMat.map = texture;
							planetMat.shininess = 0;
							planetMat.roughness = 1;
							planetMat.needsUpdate = false;
						})
				}
			};
		
        var planet = new THREE.SphereGeometry(10, 128, 128);
		var planetMat = new THREE.ShaderMaterial({
			//for more information on why the shader is done this way: 
			//https://stackoverflow.com/questions/56977686/creating-a-day-night-shader-that-follows-a-light-souce/
			uniforms: uniforms,
			vertexShader: `
				varying vec2 vUv;
				varying vec3 vNormal;
				varying vec3 vSunDir;
				uniform vec3 sunDirection;
				void main() {
					vUv = uv;
					vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
					vNormal = normalMatrix * normal;
					vSunDir = mat3(viewMatrix) * sunDirection;
					gl_Position = projectionMatrix * mvPosition;
				}
			`,
			fragmentShader: `
				uniform sampler2D dayTexture;
				uniform sampler2D nightTexture;
				
				//uniform float sunIntensity;
				varying vec2 vUv;
				varying vec3 vNormal;
				varying vec3 vSunDir;
				void main(void) {
					vec3 dayColor = texture2D(dayTexture, vUv).rgb;
					vec3 nightColor = texture2D(nightTexture, vUv).rgb;
					float cosineAngleSunToNormal = dot(normalize(vNormal), normalize(vSunDir));
					cosineAngleSunToNormal = clamp(cosineAngleSunToNormal * 30.0, -1.0, 1.0);
					float mixAmount = cosineAngleSunToNormal * 0.5 + 0.5;
					vec3 color = mix(nightColor, dayColor, mixAmount); //*sunIntensity
					gl_FragColor = vec4(color, 1.0);
				}
			`
		});
        
		//creates an atmosphere-like effect around the edges of the globe
        var outlineMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.BackSide});
        var outlineMesh = new THREE.Mesh(planet, outlineMaterial);
        outlineMesh.scale.multiplyScalar(1.003);
        var planetMesh = new THREE.Mesh(planet, planetMat);
        planetMesh.add(outlineMesh);
		planetMesh.name = "globe";
		planetMesh.castShadow = true;
		planetMesh.receiveShadow = true;
        scene.add(planetMesh);
		
		//creates a transparent sphere just larger than the earth to show the clouds
		var cloudGeo = new THREE.SphereGeometry(10.08,64,64);
		var cloudMat = new THREE.MeshPhongMaterial({color: 0xffffff, transparent: true, opacity: .7});
		TextureLoader.load('static/img/clouds.png', function (texture) {
            texture.anisotropy = 8;
            cloudMat.map = texture;
			cloudMat.shininess = 0;
            cloudMat.needsUpdate = false;
			
        });
		var clouds = new THREE.Mesh(cloudGeo, cloudMat);
		scene.add(clouds);
		
		//creates a large sphere and projects the texture on the inside to create a starry background
		var stars = new THREE.SphereGeometry(500000, 64, 64);
		var starsMat = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.BackSide});
		TextureLoader.load('static/img/milkyWay.jpg', function (texture) {
			//the higher the anisotropy is basically just makes the texture more crisp from glancing angles.
			//Must be in power of 2, higher than 16 is unnecessary
			texture.anisotropy = 8;
			starsMat.map = texture;
			starsMat.needsUpdate = false;
		});
		var starsMesh = new THREE.Mesh(stars, starsMat);
		scene.add(starsMesh);
    }
	
	//creates all of the groundsite markers
	function groundSite() {
		var r = 10;
		for (var i = 0; i < sites.length; i++) {
			var lat = sites[i][1][0];
			var lon = sites[i][1][1];
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
			var gName = sites[i][0];
			groundSites[gName] = cube;			
			scene.add(cube);
		}
	}
	
	// creates the path of the satellites based on the information in the csv
	function satPath() {
		//this just grabs the first element of the time array and spits out timeDiff, which
		// is the index of the next orbital point from where we currently are
		var currentTime = Date.now();
		var timeDiff = Math.floor((currentTime-satTime)/60000);
		var r, lat, lon, x, y, z, phi, theta;
		for (var i = 0; i < numCraft; i++) {
			var material = new THREE.LineBasicMaterial({color: 0xffffff, vertexColors: THREE.VertexColors, transparent: true});
			var geometry = new THREE.Geometry();
			var satName = spacecraft[i];
			for (var j = 0; j < numOrbitalPts; j++) {				
				
				r = ((satData[i][1][j][2]+6378)*10/6378);
				lat = satData[i][1][j][0];
				lon = satData[i][1][j][1];
				phi = (90-lat)*(Math.PI/180);
				theta = (lon+180)*(Math.PI/180);

				x = -((r) * Math.sin(phi)*Math.cos(theta));
				z = ((r) * Math.sin(phi)*Math.sin(theta));
				y = ((r) * Math.cos(phi));
				
				var vert = new THREE.Vector3(x, y, z);
				
				geometry.colors[j] = new THREE.Color(0x0000ff);
				geometry.vertices.push(vert);
				
				if (j == timeDiff) {
					//this adds the satellite sprites at the location on each path where the satellite
					//should be in real time.
					if (satName == "ISS (ZARYA)") {
						var spriteMap = new THREE.TextureLoader().load( 'static/img/iss.png' );
						var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
						var sprite = new THREE.Sprite( spriteMaterial);
						sprite.scale.set(1, 1, 1);
						sprite.position.set(x, y, z);
						sprite.renderOrder = 1;
						scene.add( sprite );
						sprite.visible = false;
					}
					else {
						
						var imgLoc = 'static/img/satellite.png';
						var spriteMap = new THREE.TextureLoader().load( imgLoc );
						var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff} );
						var sprite = new THREE.Sprite( spriteMaterial );
						var imgScale = r/12;
						if (imgScale > 10) {
							imgScale = 10;
						}
						//the sprite is scaled accordingly to how far away it is from the earth.
						//This just makes it easier to see. Position and scale are updated in the updateSat() function
						sprite.scale.set(imgScale, imgScale, 1);
						sprite.position.set(x, y, z);
						sprite.renderOrder = 100;
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
			//line.renderOrder = 1;
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
	
	$.getJSON('http://api.ipstack.com/check?access_key=f8bb83b83559e3d5f53b98987b95f25a', function(data) {
		var t = new Date();
		fetch('/comm', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify ({
				"latitude": data['latitude'],
				"longitude": data['longitude'],
				/*need to check how long ago the data was calculated, and if it is within 6 hours of now.
				If it is, we need to send "true" as the value for "run", meaning it has been run within the
				last 6 hours. Otherwise, send "false".
				*/
				"run": "false"
			})
		}).then(res => res.json())
		.then(function (jsonData) {
			numCraft = jsonData.numSats;
			numOrbitalPts = jsonData.OP;
			spacecraft = jsonData.satKeys;
			var tm = jsonData.time;
			//to get the correct UTC time for satTime, subtract a month and a day, add 18 hours and 1 minute
			satTime = new Date(tm[0], tm[1]-1, tm[2]-1, tm[3]+18, tm[4]+1, tm[5]).getTime();
			sites = jsonData.sites;
			sunArr = jsonData.sun;
			
			for (var i = 0; i < spacecraft.length; i++) {
				var craft = jsonData[spacecraft[i]];
				pos = craft.pos;
				pos = [spacecraft[i], pos];
				satData.push(pos);
				h = craft.horizon;
				for (var j = 0; j < h.length; j++) {
					h[j] = h[j][1];
				}
				horizon.push(h);
			}
			console.log(satTime);
			init();
		});
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
	
	document.addEventListener( 'mousedown', function(ev) {
		try {
			clickLoc.x = ((ev.clientX - renderer.domElement.offsetLeft)/renderer.domElement.clientWidth)*2-1;
			clickLoc.y = ((ev.clientY - renderer.domElement.offsetTop)/renderer.domElement.clientHeight)*2+1;
		}
		catch(e) {}
	}, false);	
	document.addEventListener( 'mouseup', function(ev) {
		try {
			xLoc = ((ev.clientX - renderer.domElement.offsetLeft)/renderer.domElement.clientWidth)*2-1;
			yLoc = - ((ev.clientY - renderer.domElement.offsetTop)/renderer.domElement.clientHeight)*2+1;		
			if (clickLoc.x == xLoc && Math.abs((clickLoc.y + yLoc) - 2) < .001) {
				raycaster.setFromCamera(mouse, camera);
				//calculate objects intersecting the picking ray
				var intersects = raycaster.intersectObjects(scene.children);
				if (mouse.x > -.68) {
					//only first intersect
					if (intersects.length != 0) {
						//console.log(intersects[0].point);
						if (intersects[0].object.type == "Line" || intersects[0].object.type == "Sprite") {
							clickedObj = intersects[0].object.name;
							satDict[clickedObj].material.opacity = 1.0;
							/*the bitmap canvas contents will be used for a texture. The name of the
							clicked spacecraft image or path will be used as the contents of the bitmap canvas.*/
							metrics = g.measureText(clickedObj);
							g.clearRect(0,0,bitmap.width, bitmap.height);
							g.fillStyle = 'white';
							g.fillText(clickedObj, (bitmap.width/2)-(metrics.width/2), (bitmap.height/2));
							g.strokeStyle = 'black';
							g.strokeText(clickedObj, (bitmap.width/2)-(metrics.width/2), (bitmap.height/2));
							tooltipSprite.material.map.needsUpdate = true;
							//renders the sprite after the orbit paths so the sprite doesn't cut out any
							// of the visible satellite paths
							tooltipSprite.renderOrder = 100;
							tooltipSprite.position.copy(intersects[0].point);
							tooltipSprite.visible = true;
						}
						else {
							for (var i = 1; i < scene.children.length; i++) {
								if (scene.children[i].type == "Line") {
									scene.children[i].material.opacity = 0.4;
								}
							}
							clickedObj = null;
							tooltipSprite.visible = false;
						}
					}
				}
			}
		}
		catch(e) {}
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
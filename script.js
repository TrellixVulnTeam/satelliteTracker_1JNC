(function (window, document, undefined) {
    var camera, fakeCamera, controls, scene, renderer, labelRenderer;
    var  moon, light;
    var angle = 0;
    var angle2 = 0;
    var textureLoader;
    var manager = new THREE.LoadingManager();
    manager.onLoad = function() {openSideBar;}
    var target = new THREE.Vector3();
    var arrowH;

    //for debugging
    var nodeConsole = require('console');
    var myConsole = new nodeConsole.Console(process.stdout, process.stderr);


    function buildScene() {
        scene = new THREE.Scene();
        
        light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(0,0,0);
        sun = createSun("img/sun.jpg", 1009.2984);
        moon = createMoon("img/moon.jpg", .2725, 10);
        earth = createEarth("img/earth.jpg", "img/earthNight.jpg", null, 1, 23455);
        
        starField = createStarScape("img/milkyWay.jpg");

        //light.shadow.bias = 0.00005;
        light.castShadow = true;
        light.shadow.camera.near = 0.5;       
        light.shadow.camera.far = 500000;
        light.target = earth;
        scene.add(light);
        light.add(starField);
        light.add(sun);

        ambLight = new THREE.AmbientLight( 0x202020 );
        scene.add(ambLight);

        
        sun.attach(earth);

        var camGyro = new THREE.Gyroscope();
        camGyro.add(camera);

        earth.add(camGyro);
        earth.attach(moon);
    }

    function init() {
        can = document.getElementById("scene");
        renderer = new THREE.WebGLRenderer({canvas: can, antialias: true});
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        labelRenderer = new THREE.CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        document.body.appendChild(labelRenderer.domElement);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200000);
        camera.layers.enableAll();
        camera.position.set(-10, 3, 0);
        camera.lookAt(0, 0, 0);

        buildScene();

        fakeCamera = camera.clone();
        fakeCamera.layers.enableAll();
        controls = new THREE.OrbitControls(fakeCamera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = false;
    }

    function animate(time) {

        angle = (angle + .002) % (2 * Math.PI);
        rotateBody(earth, angle, earth.userData["distanceToParent"]);
        target = earth.position;
        angle2 = (angle2 + .007) % (2 * Math.PI);
        rotateBody(moon, -1*angle2, moon.userData["distanceToParent"]);
        camera.copy(fakeCamera);

        render();
        requestAnimationFrame(animate);

        function rotateBody(body, angle, radius) {
            //body.rotation.y = angle;
            body.position.x = radius * Math.cos(angle);
            //body.position.y = radius * Math.sin(angle);
            body.position.z = radius * Math.sin(angle);
        }
    }

    function render() {
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }

    function createMoon(texturePath, radius, distance) {
        var geometry = new THREE.SphereGeometry(radius, 32, 32);
        const texture = new THREE.TextureLoader().load( texturePath );
        const material = new THREE.MeshLambertMaterial({ map:texture });
        const body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        body.receiveShadow = true;
        body.position.set(0, 0, 0);
        body.userData = {"distanceToParent" : distance};
        //body.scale.set(.3, .3, .3);
        body.name = "Moon";
        body.layers.set(1);
        //body.add(makeTextLabel(name));
        return body;
    }

    function createEarth(dayTexture, nightTexture, cloudTexture, radius, distance) {
        textureLoader = new THREE.TextureLoader(manager);
        //used for the shader to show the parts of the earth where it is currently day and night
		uniforms = {
            sunDirection: {
                value: moon.position
            },
            /*sunIntensity: {
                value: light.intensity
            },*/
            dayTexture: {
                value: textureLoader.load(dayTexture, function (texture) {
                        texture.anisotropy = 8;
                        material.map = texture;
                        material.shininess = 0;
                        material.roughness = 1;
                        material.needsUpdate = false;
                    })
            },
            nightTexture: {
                value: textureLoader.load(nightTexture, function (texture) {
                        texture.anisotropy = 8;
                        material.map = texture;
                        material.shininess = 0;
                        material.roughness = 1;
                        material.needsUpdate = false;
                    })
            }
        };

        var geometry = new THREE.SphereGeometry(radius, 64, 64);
        const material = new THREE.ShaderMaterial({
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
			`,
		});

        const body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        body.receiveShadow = true;
        body.position.set(0, 0, distance);
        body.userData = {"distanceToParent" : distance};
        //body.scale.set(.3, .3, .3);
        body.name = "Earth"
        body.layers.set(1);
        //body.add(makeTextLabel(name));
        return body;

    }

    function createSun(texturePath, radius) {
        var geometry = new THREE.SphereGeometry(radius, 32, 32);
        const texture = new THREE.TextureLoader().load( texturePath );
        const material = new THREE.MeshStandardMaterial({map: texture, emissive: new THREE.Color(0xffffff), emissiveMap: texture, emissiveIntensity: 1});
        const body = new THREE.Mesh(geometry, material);
        body.name = "Sun";
        body.layers.set(1);
        body.position.set(0,0,0)
        return body;
    }

    function createStarScape(texturePath) {
        var geometry = new THREE.SphereGeometry(500000, 32, 32);
        const texture = new THREE.TextureLoader().load(texturePath);
        const starMat = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture, side: THREE.BackSide});
        const starField = new THREE.Mesh(geometry, starMat);
        starField.layers.set(1);
        starField.name = "Stars";

        return starField;
    }

    function createSolarPlane() {
        var solarPlane = new THREE.GridHelper(5, 10);
        solarPlane.add(makeTextLabel("solar plane"));
        return solarPlane;
    }

    function makeTextLabel(label) {
        var text = document.createElement('div');
        text.style.color = 'rgb(255, 255, 255)';
        text.textContent = label;
        return new THREE.CSS2DObject(text);
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

    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize(){
        fakeCamera.aspect = window.outerWidth/window.innerHeight;
        fakeCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth,window.innerHeight);
    }

    init();
    animate();
})(window, document);
(function (window, document, undefined) {
    THREE = require('./three.js/build/three.js');
    CSS2DRenderer = require('./three.js/examples/js/renderers/CSS2DRenderer.js');
    Gyroscope = require('./three.js/examples/js/controls/OrbitControls.js');


    var camera, fakeCamera, controls, scene, renderer, labelRenderer;
    var  moon, sun, earth, eclipse, light;
    var angle = 0;
    var angle2 = 0;
    var textureLoader;
    var manager = new THREE.LoadingManager();
    manager.onLoad = function() {openSideBar;}
    var localSun = new THREE.Vector3(0, 0, -23481);

    //used to send logs to VSCode console
    var nodeConsole = require('console');
    var myConsole = new nodeConsole.Console(process.stdout, process.stderr);


    /**
     * @param scene  main scene that is added to the window. Everything else will be attached to the scene in some way
     * @param light  a directional light to serve as sunlight in the scene
     * @param sun  a mesh object that acts as a visual representation of the sun
     * @param earth  a mesh showing the landmasses and oceans of earth, will be updated to show realtime position relative to the sun
     * @param moon  a mesh that orbits the earth, will be updated to show position in real time
     * @param starfield  sphere mesh with a texture of a starscape on the inside, meant to add star visuals
     * @param camera  used along with fakeCamera to allow the camera to focus on the earth instead of the sun
     * @param fakeCamera  used along with fakeCamera to allow the camera to focus on the earth instead of the sun
     * @param ambLight  an ambient light set so that the unlit sides of the moon and earth are still visible
     */
    function buildScene() {
        scene = new THREE.Scene();
        
        light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(0,0,0);

        sun = createSun("img/sun.jpg", 109.2984);
        
        moon = createMoon("img/moon.jpg", .2725, 60.33);
        
        earth = createEarth("img/earth.jpg", "img/earthNight.jpg", null, 1, localSun.z);

        eclipse = createEclipseSphere(1.01, localSun.z);

        
        
        starField = createStarScape("img/milkyWay.jpg");

        /*var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(new THREE.Vector3( 0, 0, 0));
        var dotMaterial = new THREE.PointsMaterial( { size: 1, sizeAttenuation: false } );
        var dot = new THREE.Points( dotGeometry, dotMaterial );*/

        //light.shadow.bias = 0.00005;

        ambLight = new THREE.AmbientLight( 0x909090 ); // soft white light
        scene.add( ambLight );

        light.castShadow = true;
        light.shadow.camera.near = 0.5;       
        light.shadow.camera.far = 500000;
        light.target = earth;
        scene.add(light);
        light.add(starField);
        light.add(sun);

        ambLight = new THREE.AmbientLight( 0x202020 );
        scene.add(ambLight);

        /*myConsole.log(shaderEarth.position, sun.position);
        myConsole.log(sun.worldToLocal(shaderEarth.position));*/
        light.add(earth);
        light.add(eclipse);

        earth.add(camera);
        earth.add(moon);
        
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

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 875000);
        camera.layers.enableAll();
        camera.position.set(-10, 3, 0);
        camera.lookAt(0, 0, 0);

        buildScene();
        

        fakeCamera = camera.clone();
        fakeCamera.layers.enableAll();
        controls = new THREE.OrbitControls(fakeCamera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = false;
        controls.minDistance = 1.5;
        controls.maxDistance = 100;
    }

    function animate(time) {

        angle = (angle + .0002) % (2 * Math.PI);
        rotateBody(earth, 3*angle, earth.userData["distanceToParent"]);
        rotateBody(eclipse, 3*angle, eclipse.userData["distanceToParent"]);
        localSun.copy(earth.position).multiplyScalar(-1);
        angle2 = (angle2 + .007) % (2 * Math.PI);
        moon.rotation.y += (.0035 % (2 * Math.PI));
        rotateBody(moon, -1*angle2, moon.userData["distanceToParent"]);
        rotateBody(sun, -2*angle, .0001);
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
                value: localSun
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
        body.position.set(0, 0, distance);
        body.userData = {"distanceToParent" : distance};
        //body.scale.set(.3, .3, .3);
        body.name = "Earth";
        body.layers.set(1);
        //body.add(makeTextLabel(name));

        return body;

    }

    function createEclipseSphere(radius, distance) {
        const eclispeGeometry = new THREE.SphereGeometry(radius, 64, 64);
        const eclipseMaterial = new THREE.ShadowMaterial();
        eclipseMaterial.opacity = 0.75;
        const body = new THREE.Mesh(eclispeGeometry, eclipseMaterial);
        body.receiveShadow = true;
        body.position.set(0, 0, distance);
        body.userData = {"distanceToParent" : distance};
        body.name = "Eclipse";
        body.layers.set(1);

        return body;
    }

    function createSun(texturePath, radius) {
        var geometry = new THREE.SphereGeometry(radius, 32, 32);
        const texture = new THREE.TextureLoader().load( texturePath );
        const material = new THREE.MeshStandardMaterial({map: texture, emissive: new THREE.Color(0xffffff), emissiveMap: texture, emissiveIntensity: 1});
        const body = new THREE.Mesh(geometry, material);
        body.name = "Sun";
        body.layers.set(1);
        body.position.set(0,0,.0001)
        return body;
    }

    function createStarScape(texturePath) {
        var geometry = new THREE.SphereGeometry(850000, 32, 32);
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
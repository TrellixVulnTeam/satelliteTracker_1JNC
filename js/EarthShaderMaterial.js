import {mergeUniforms} from '../three.js/build/three.js'
import { UniformsLib } from '../three.js/build/three.js'

export default {

    uniforms = {
        sunDirection: {
            value: light.position
        },
        /*sunIntensity: {
            value: light.intensity
        },*/
        dayTexture: {
            value: TextureLoader.load(dayTexture, function (texture) {
                    texture.anisotropy = 8;
                    planetMat.map = texture;
                    planetMat.shininess = 0;
                    planetMat.roughness = 1;
                    planetMat.needsUpdate = false;
                })
        },
        nightTexture: {
            value: TextureLoader.load(nightTexture, function (texture) {
                    texture.anisotropy = 8;
                    planetMat.map = texture;
                    planetMat.shininess = 0;
                    planetMat.roughness = 1;
                    planetMat.needsUpdate = false;
                })
        },
        lights: {value: UniformsLib.lights}
    },
    
    vertexShader: `
        #include <common>
        #include <shadowmap_pars_vertex>
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vSunDir;
        uniform vec3 sunDirection;
        void main() {
            #include <begin_vertex>
            #include <project_vertex>
            #include <worldpos_vertex>
            #include <shadowmap_vertex>
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalMatrix * normal;
            vSunDir = mat3(viewMatrix) * sunDirection;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        #include <common>
        #include <packing>
        #include <bsdfs>
        #include <lights_pars_begin>
        #include <shadowmap_pars_fragment>
        #include <shadowmask_pars_fragment>
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        
        //uniform float sunIntensity;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vSunDir;
        void main(void) {
            float shadowPower = 1.0;
            vec3 shadowColor = vec3(0, 0, 0);
            vec3 dayColor = texture2D(dayTexture, vUv).rgb;
            vec3 nightColor = texture2D(nightTexture, vUv).rgb;
            float cosineAngleSunToNormal = dot(normalize(vNormal), normalize(vSunDir));
            cosineAngleSunToNormal = clamp(cosineAngleSunToNormal * 30.0, -1.0, 1.0);
            float mixAmount = cosineAngleSunToNormal * 0.5 + 0.5;
            vec3 color = mix(nightColor, dayColor, mixAmount); //*sunIntensity
            gl_FragColor = vec4(mix(color, shadowColor, (1.0 - getShadowMask() ) * shadowPower), 1.0);
        }
    `,
}
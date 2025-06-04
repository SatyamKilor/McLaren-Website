import './style.css'
import gsap from "gsap";
import ScrollSmoother from "./gsap/ScrollSmoother";
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);


const customScroll = document.querySelector(".scrollBar");

let isSyncingScroll = false;

// Sync window scroll → customScroll
window.addEventListener('scroll', () => {
  if (isSyncingScroll) return; // avoid loop

  isSyncingScroll = true;

  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const scrollPercent = scrollTop / docHeight;

  // Update custom scrollbar scrollTop
  const customScrollHeight = customScroll.scrollHeight - customScroll.clientHeight;
  customScroll.scrollTop = scrollPercent * customScrollHeight;

  isSyncingScroll = false;
});

// Sync customScroll → window scroll
customScroll.addEventListener("scroll", () => {
  if (isSyncingScroll) return; // avoid loop

  isSyncingScroll = true;

  const scrollTop = customScroll.scrollTop;
  const scrollHeight = customScroll.scrollHeight - customScroll.clientHeight;
  const scrollPercent = scrollTop / scrollHeight;

  // Update window scrollY
  const docHeight = document.body.scrollHeight - window.innerHeight;
  window.scrollTo(0, scrollPercent * docHeight);
  isSyncingScroll = false;
});

window.addEventListener("load", () => {
  ScrollTrigger.create({
    trigger: ".main",
    start: "top top",
    end: "bottom top",
    pin: ".main",
    pinSpacing: false,
    markers: false
  });

  gsap.to('.loader',{
    y:"-100%",
    duration:1,
    delay: 2,
    onComplete: () => {
      document.querySelector('.loader').style.display = 'none';
    }
  });


  gsap.from('#logo',{
    top: "45%",
    left:"50%",
    height:"500px",
    duration:1,
    delay: 2,
    onComplete: ()=>{
      const AnimationTL = gsap.timeline();

        AnimationTL.to('.ri-menu-line',
          {
            top: "6%",
            duration: 0.5,
            ease: 'power2.inOut',
          },'a');

        AnimationTL.to('.heroSec h2',{
          y:0,
          opacity:1,
          duration:1.2,
          ease: 'expo.out'
        }, 'a');

        AnimationTL.to('.heroSec h1',{
          y:0,
          opacity:1,
          duration:1.2,
          ease: 'expo.out'
        }, 'a');

        AnimationTL.to('.heroSec button', {
          opacity: 1,
          duration: 0.4,
          ease: 'expo.out'
        }, 'a')
        .to('.heroSec button', {
        scale: 1,
        duration: 0.8,
        delay: 0.2,
        ease: 'expo.out'
      }, 'a');
    
        AnimationTL.to('.footer',{
          opacity:1,
          y: 0,
          duration:0.4,
          ease: 'expo.out'
        }, 'a');
      }
    });
});

const scrollBar = document.querySelector('.scrollBar');

let isDragging = false;
let startY;
let startScrollY;

scrollBar.addEventListener('mousedown', (e) => {
  isDragging = true;
  startY = e.clientY;
  startScrollY = window.scrollY;
  document.body.style.userSelect = 'none';  // prevent text selection during drag
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const deltaY = e.clientY - startY;

  // Calculate scroll ratio
  const scrollHeight = document.body.scrollHeight - window.innerHeight;
  const trackHeight = scrollBar.clientHeight;

  // Map the drag distance to page scroll
  const scrollDelta = (deltaY / trackHeight) * -scrollHeight *2;

  window.scrollTo(0, startScrollY + scrollDelta);
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  document.body.style.userSelect = '';
});




//THREE JS
const scene = new THREE.Scene();
const canvas = document.querySelector('#webgl');
let mixer;


//renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


//camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 0;
camera.position.y = 1.5;
camera.position.z = 7.2;

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 3 );
				hemiLight.position.set( 0, 20, 0 );
				scene.add( hemiLight );


const loader = new GLTFLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
loader.setDRACOLoader(dracoLoader);

const floorShader = {
  uniforms: {
    color: { value: new THREE.Color(0xfafafa) },
    opacity: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec3 color;
    uniform float opacity;

    void main() {
      float dist = distance(vUv, vec2(0.5, 0.5));
      float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
      gl_FragColor = vec4(color, alpha * opacity);
    }
  `,
  transparent: true,
  depthWrite: false
};


// Visible floor with soft blur
const baseFloor = new THREE.Mesh(
  new THREE.CircleGeometry(25, 128),
  new THREE.ShaderMaterial(floorShader)
);
baseFloor.rotation.x = -Math.PI / 2;
baseFloor.receiveShadow = false;
scene.add(baseFloor);

// Invisible mesh that only receives shadows
const shadowCatcher = new THREE.Mesh(
  new THREE.CircleGeometry(25, 64),
  new THREE.ShadowMaterial({ opacity: 0.4 })
);
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.receiveShadow = true;
scene.add(shadowCatcher);

// Load model
loader.load('/models/carWithAnimation.glb', (gltf) => {
  let model = gltf.scene;
  scene.add(model);

  
model.traverse(function(object)
  {
    if(object.isMesh)
      {
        object.castShadow = true;
        object.receiveShadow = true;

        object.material.metalness = 1;
				object.material.roughness = 0.3;
				object.material.transparent = false;
				object.material.opacity = 1;
				object.material.color.set( 1, 1, 1 );
      }
  });
    
camera.lookAt(model.position);

mixer = new THREE.AnimationMixer(model);

let animationAction1 = mixer.clipAction(gltf.animations[0]);
animationAction1.play();

let animationAction2 = mixer.clipAction(gltf.animations[1]);
animationAction2.play();

let animationAction3 = mixer.clipAction(gltf.animations[2]);
animationAction3.play();

let animationAction4 = mixer.clipAction(gltf.animations[3]);
animationAction4.play();

let animationAction5 = mixer.clipAction(gltf.animations[4]);
animationAction5.play();

let animationAction6 = mixer.clipAction(gltf.animations[5]);
animationAction6.play();

let animationAction7 = mixer.clipAction(gltf.animations[6]);
animationAction7.play();

let animationAction8 = mixer.clipAction(gltf.animations[7]);
animationAction8.play();


const duration = animationAction1.getClip().duration;
gsap.to(model.scale, {
  scrollTrigger: {
    trigger: "#webgl",
    start: "top top",
    end: "bottom top",
    scrub: true,
    markers: false
  },
  x: 1.1,
  y: 1.1,
  z: 1.1,
});

gsap.to({}, {
  scrollTrigger: {
    trigger: "#webgl",
    start: "top top",
    end: "bottom top",
    scrub: true,
    markers: false,
    onUpdate: self => {
      const progress = self.progress;
      mixer.setTime(duration * progress);
    }
  }
});

gsap.to('#textLineHighlight', {
  scrollTrigger: {
    trigger: "#webgl",
    start: "top -60%",
    end: "bottom top",
    scrub: true,
    markers: false
  },
  opacity: 1,
  ease: 'expoScale(0.5,7,none)'
});

gsap.to('#doorText', {
  scrollTrigger: {
    trigger: "#webgl",
    start: "top -60%",
    end: "bottom top",
    scrub: true,
    markers: false
  },
  opacity: 1,
  ease: 'expoScale(0.5,7,none)'
});

gsap.to('#textLineHighlight2', {
  scrollTrigger: {
    trigger: "#webgl",
    start: "top -60%",
    end: "bottom top",
    scrub: true,
    markers: false
  },
  opacity: 1,
  ease: 'expoScale(0.5,7,none)'
});

gsap.to('#headlightText', {
  scrollTrigger: {
    trigger: "#webgl",
    start: "top -60%",
    end: "bottom top",
    scrub: true,
    markers: false
  },
  opacity: 1,
  ease: 'expoScale(0.5,7,none)'
});

});


new RGBELoader()
  .setPath('/textures/')
  .load('lobe.hdr', function(texture)
  {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.environmentIntensity = 0.5;
  })



// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 0); 
light.lookAt(0, 0, 0); 

light.castShadow = true; 
scene.add(light);

// const helper = new THREE.CameraHelper(light.shadow.camera);
// scene.add(helper);

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};
animate();

// Handle window resize
window.addEventListener('resize', () => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});



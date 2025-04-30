import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const materials = [
  new THREE.MeshBasicMaterial({color: 0xff0000}),
  new THREE.MeshBasicMaterial({color: 0x00ff00}),
  new THREE.MeshBasicMaterial({color: 0x0000ff}),
  new THREE.MeshBasicMaterial({color: 0xffff00}),
  new THREE.MeshBasicMaterial({color: 0xff00ff}),
  new THREE.MeshBasicMaterial({color: 0x00ffff}),
];
const cube = new THREE.Mesh(geometry, materials);
scene.add(cube);

camera.position.z = 3;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

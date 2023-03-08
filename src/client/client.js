import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GUI } from 'dat.gui';
import * as CANNON from 'cannon-es';
import CannonDebugRenderer from './utils/cannonDebugRenderer';
import { randFloat } from 'three/src/math/MathUtils';
var centerSphereRadius = 65;
var centerSphereLargeRadius = 65;
var centerSphereY = 0;
var rodLengthShort = 330;
var rodLengthLong = 500;
var origin = new THREE.Vector3(0, centerSphereY, 0);
var endBallRadius = 30;
var numberOfCircles = 5;
const normalMaterial = new THREE.MeshNormalMaterial();
const phongMaterial = new THREE.MeshPhongMaterial();
function makeManyCircles(numCircles) {
    var vector = new THREE.Vector3();
    var circles = [];
    for (let i = 0, l = numCircles; i < l; i++) {
        const phi = Math.acos(-1 + (2 * i) / l);
        const theta = Math.sqrt(l * Math.PI) * phi;
        if (randFloat(0, 1) > 0.5) {
            var rodLength = rodLengthShort;
        }
        else {
            var rodLength = rodLengthLong;
        }
        var extrudeSettings = { depth: rodLength, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        var myShape = makeCircle(10);
        var extrudedGeometry = new THREE.ExtrudeGeometry(myShape, extrudeSettings);
        const object = new THREE.Mesh(extrudedGeometry, normalMaterial);
        object.position.setFromSphericalCoords(centerSphereRadius, phi, theta);
        vector.copy(object.position).multiplyScalar(2);
        object.lookAt(vector);
        console.log("Circles: " + object.position);
        circles.push(object);
    }
    return circles;
}
function calcPosFromLatLon(phi, theta, scale) {
    let lat = (90 - phi) * (Math.PI / 180);
    let lon = (theta + 180) * (Math.PI / 180);
    const x = -(Math.sin(lat) * Math.cos(lon));
    const z = Math.sin(lat) * Math.sin(lon);
    const y = Math.cos(lat);
    console.log("x: " + x + " y: " + y + " z: " + z);
    return new THREE.Vector3(x * scale, y * scale, z * scale);
}
function makeMoonBody(moon) {
    const moonShape = new CANNON.Sphere(endBallRadius);
    const moonBody = new CANNON.Body({ mass: 2, shape: moonShape });
    moonBody.position.x = moon.position.x;
    moonBody.position.y = moon.position.y;
    moonBody.position.z = moon.position.z;
    moonBody.quaternion.set(moon.quaternion.x, moon.quaternion.y, moon.quaternion.z, moon.quaternion.w);
    return moonBody;
}
function makeCircleBody(circle, height) {
    const circleShape = new CANNON.Cylinder(10, 10, height);
    const circleBody = new CANNON.Body({ mass: 0.5, shape: circleShape });
    circleBody.shapeOffsets;
    circleBody.position.x = circle.position.x;
    circleBody.position.y = circle.position.y;
    circleBody.position.z = circle.position.z;
    circleBody.quaternion.set(circle.quaternion.x, circle.quaternion.y, circle.quaternion.z, circle.quaternion.w);
    console.log(circleBody.quaternion);
    console.log(circle.quaternion);
    return circleBody;
}
function makeCircle(radius) {
    const circleRadius = radius;
    const circleShape = new THREE.Shape()
        .moveTo(0, circleRadius)
        .quadraticCurveTo(circleRadius, circleRadius, circleRadius, 0)
        .quadraticCurveTo(circleRadius, -circleRadius, 0, -circleRadius)
        .quadraticCurveTo(-circleRadius, -circleRadius, -circleRadius, 0)
        .quadraticCurveTo(-circleRadius, circleRadius, 0, circleRadius);
    return circleShape;
}
function makeMoon(moonPosition) {
    const ball1Geometry = new THREE.SphereGeometry(endBallRadius);
    const ball1Mesh = new THREE.Mesh(ball1Geometry, normalMaterial);
    ball1Mesh.castShadow = true;
    ball1Mesh.position.copy(moonPosition);
    return ball1Mesh;
}
const scene = new THREE.Scene();
const axesHelper = new THREE.AxesHelper(500);
scene.add(axesHelper);
const light1 = new THREE.SpotLight();
light1.position.set(500, 1000, 1000);
light1.angle = Math.PI / 4;
light1.penumbra = 0.5;
light1.castShadow = true;
light1.shadow.mapSize.width = 1024;
light1.shadow.mapSize.height = 1024;
light1.shadow.camera.near = 150;
light1.shadow.camera.far = 3000;
scene.add(light1);
const light2 = new THREE.SpotLight();
light2.position.set(-500, 1000, 1000);
light2.angle = Math.PI / 4;
light2.penumbra = 0.5;
light2.castShadow = true;
light2.shadow.mapSize.width = 1024;
light2.shadow.mapSize.height = 1024;
light2.shadow.camera.near = 150;
light2.shadow.camera.far = 300;
scene.add(light2);
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.y = 400;
camera.position.z = 700;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.y = 2;
const world = new CANNON.World();
world.gravity.set(0, -1, 0);
//world.broadphase = new CANNON.NaiveBroadphase() //
//world.solver.iterations = 10
//world.allowSleep = true
const centerSphereGeometry = new THREE.SphereGeometry(centerSphereRadius - 3);
const centerSphereMesh = new THREE.Mesh(centerSphereGeometry, normalMaterial);
centerSphereMesh.castShadow = true;
centerSphereMesh.position.add(origin);
// Comment out the following lines to see z fighting
centerSphereMesh.material.polygonOffset = true;
centerSphereMesh.material.polygonOffsetUnits = 1;
centerSphereMesh.material.polygonOffsetFactor = 1;
centerSphereMesh.translateY(800);
scene.add(centerSphereMesh);
const centerSphereShape = new CANNON.Sphere(centerSphereRadius - 3);
const centerSphereBody = new CANNON.Body({ mass: 1 });
centerSphereBody.addShape(centerSphereShape);
centerSphereBody.position.x = centerSphereMesh.position.x;
centerSphereBody.position.y = centerSphereMesh.position.y;
centerSphereBody.position.z = centerSphereMesh.position.z;
centerSphereBody.quaternion.x = centerSphereMesh.quaternion.x;
centerSphereBody.quaternion.y = centerSphereMesh.quaternion.y;
centerSphereBody.quaternion.z = centerSphereMesh.quaternion.z;
centerSphereBody.quaternion.w = centerSphereMesh.quaternion.w;
world.addBody(centerSphereBody);
var circlesMoonsBodies = [];
var myCircleList = makeManyCircles(numberOfCircles);
myCircleList.forEach((circle, index) => {
    // create a ball on the end of the circle
    circle.geometry.computeBoundingSphere();
    var boundingSphere = circle.geometry.boundingSphere;
    var circleSize = (boundingSphere === null || boundingSphere === void 0 ? void 0 : boundingSphere.radius) || 0;
    console.log("Circle Size: " + circleSize);
    if (circleSize > 200) {
        var rodLength = rodLengthLong;
    }
    else {
        var rodLength = rodLengthShort;
    }
    var neededPos = centerSphereRadius + rodLength + endBallRadius;
    var scaleFactor = neededPos / circle.position.length();
    var endBallPos = new THREE.Vector3().addScaledVector(circle.position, scaleFactor);
    var moon = makeMoon(endBallPos);
    moon.name = "moon" + index;
    circle.name = "circle" + index;
    //onsole.log(circle.quaternion)
    var moonBody = makeMoonBody(moon);
    var circleBody = makeCircleBody(circle, rodLength);
    console.log(circleBody);
    circlesMoonsBodies.push({ circle: circle.clone(), circleBody: circleBody, moon: moon.clone(), moonBody: moonBody });
});
circlesMoonsBodies.forEach((circlesMoonsBody, i) => {
    // attempt to move everyhing up some
    circlesMoonsBodies[i].circle.translateY(800);
    circlesMoonsBodies[i].moon.translateY(800);
    circlesMoonsBodies[i].circleBody.position.y += 800;
    circlesMoonsBodies[i].moonBody.position.y += 800;
    scene.add(circlesMoonsBodies[i].circle);
    scene.add(circlesMoonsBodies[i].moon);
    //world.addBody(circlesMoonsBodies[i].circleBody)
    world.addBody(circlesMoonsBodies[i].moonBody);
    world.addConstraint(new CANNON.LockConstraint(circlesMoonsBodies[i].circleBody, circlesMoonsBodies[i].moonBody));
    //world.addConstraint(new CANNON.LockConstraint(circlesMoonsBodies[i].circleBody, centerSphereBody))
});
console.log(scene);
const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
planeMesh.rotateX(-Math.PI / 2);
planeMesh.receiveShadow = true;
scene.add(planeMesh);
const planeShape = new CANNON.Plane();
const planeBody = new CANNON.Body({ mass: 0 });
planeBody.addShape(planeShape);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(planeBody);
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}
const stats = Stats();
document.body.appendChild(stats.dom);
const gui = new GUI();
const physicsFolder = gui.addFolder('Physics');
physicsFolder.add(world.gravity, 'x', -100.0, 100.0, 1);
physicsFolder.add(world.gravity, 'y', -100.0, 100.0, 1);
physicsFolder.add(world.gravity, 'z', -100.0, 100.0, 1);
physicsFolder.open();
const clock = new THREE.Clock();
const cannonDebugRenderer = new CannonDebugRenderer(scene, world);
console.log(world);
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    let delta = clock.getDelta();
    if (delta > 0.1)
        delta = 0.1;
    world.step(delta);
    cannonDebugRenderer.update();
    centerSphereMesh.position.set(centerSphereBody.position.x, centerSphereBody.position.y, centerSphereBody.position.z);
    centerSphereMesh.quaternion.set(centerSphereBody.quaternion.x, centerSphereBody.quaternion.y, centerSphereBody.quaternion.z, centerSphereBody.quaternion.w);
    circlesMoonsBodies.forEach((circleMoon, index) => {
        circlesMoonsBodies[index].circle.position.set(circleMoon.circleBody.position.x, circleMoon.circleBody.position.y, circleMoon.circleBody.position.z);
        circlesMoonsBodies[index].circle.quaternion.set(circleMoon.circleBody.quaternion.x, circleMoon.circleBody.quaternion.y, circleMoon.circleBody.quaternion.z, circleMoon.circleBody.quaternion.w);
        circlesMoonsBodies[index].moon.position.set(circleMoon.moonBody.position.x, circleMoon.moonBody.position.y, circleMoon.moonBody.position.z);
        circlesMoonsBodies[index].moon.quaternion.set(circleMoon.moonBody.quaternion.x, circleMoon.moonBody.quaternion.y, circleMoon.moonBody.quaternion.z, circleMoon.moonBody.quaternion.w);
    });
    render();
    stats.update();
}
function render() {
    renderer.render(scene, camera);
}
animate();

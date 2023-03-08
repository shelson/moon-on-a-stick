"use strict";
exports.__esModule = true;
var THREE = require("three");
var OrbitControls_1 = require("three/examples/jsm/controls/OrbitControls");
var stats_module_1 = require("three/examples/jsm/libs/stats.module");
var dat_gui_1 = require("dat.gui");
var CANNON = require("cannon-es");
var cannonDebugRenderer_1 = require("./utils/cannonDebugRenderer");
var MathUtils_1 = require("three/src/math/MathUtils");
var centerSphereRadius = 65;
var centerSphereLargeRadius = 65;
var centerSphereY = 0;
var rodLengthShort = 330;
var rodLengthLong = 500;
var origin = new THREE.Vector3(0, centerSphereY, 0);
var endBallRadius = 30;
var numberOfCircles = 5;
var normalMaterial = new THREE.MeshNormalMaterial();
var phongMaterial = new THREE.MeshPhongMaterial();
function makeManyCircles(numCircles) {
    var vector = new THREE.Vector3();
    var circles = [];
    for (var i = 0, l = numCircles; i < l; i++) {
        var phi = Math.acos(-1 + (2 * i) / l);
        var theta = Math.sqrt(l * Math.PI) * phi;
        if ((0, MathUtils_1.randFloat)(0, 1) > 0.5) {
            var rodLength = rodLengthShort;
        }
        else {
            var rodLength = rodLengthLong;
        }
        var extrudeSettings = { depth: rodLength, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        var myShape = makeCircle(10);
        var extrudedGeometry = new THREE.ExtrudeGeometry(myShape, extrudeSettings);
        var object = new THREE.Mesh(extrudedGeometry, normalMaterial);
        object.position.setFromSphericalCoords(centerSphereRadius, phi, theta);
        vector.copy(object.position).multiplyScalar(2);
        object.lookAt(vector);
        console.log("Circles: " + object.position);
        circles.push(object);
    }
    return circles;
}
function calcPosFromLatLon(phi, theta, scale) {
    var lat = (90 - phi) * (Math.PI / 180);
    var lon = (theta + 180) * (Math.PI / 180);
    var x = -(Math.sin(lat) * Math.cos(lon));
    var z = Math.sin(lat) * Math.sin(lon);
    var y = Math.cos(lat);
    console.log("x: " + x + " y: " + y + " z: " + z);
    return new THREE.Vector3(x * scale, y * scale, z * scale);
}
function makeMoonBody(moon) {
    var moonShape = new CANNON.Sphere(endBallRadius);
    var moonBody = new CANNON.Body({ mass: 2, shape: moonShape });
    moonBody.position.x = moon.position.x;
    moonBody.position.y = moon.position.y;
    moonBody.position.z = moon.position.z;
    moonBody.quaternion.set(moon.quaternion.x, moon.quaternion.y, moon.quaternion.z, moon.quaternion.w);
    return moonBody;
}
function makeCircleBody(circle, height) {
    var circleShape = new CANNON.Cylinder(10, 10, height);
    var circleBody = new CANNON.Body({ mass: 0.5, shape: circleShape });
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
    var circleRadius = radius;
    var circleShape = new THREE.Shape()
        .moveTo(0, circleRadius)
        .quadraticCurveTo(circleRadius, circleRadius, circleRadius, 0)
        .quadraticCurveTo(circleRadius, -circleRadius, 0, -circleRadius)
        .quadraticCurveTo(-circleRadius, -circleRadius, -circleRadius, 0)
        .quadraticCurveTo(-circleRadius, circleRadius, 0, circleRadius);
    return circleShape;
}
function makeMoon(moonPosition) {
    var ball1Geometry = new THREE.SphereGeometry(endBallRadius);
    var ball1Mesh = new THREE.Mesh(ball1Geometry, normalMaterial);
    ball1Mesh.castShadow = true;
    ball1Mesh.position.copy(moonPosition);
    return ball1Mesh;
}
var scene = new THREE.Scene();
var axesHelper = new THREE.AxesHelper(500);
scene.add(axesHelper);
var light1 = new THREE.SpotLight();
light1.position.set(500, 1000, 1000);
light1.angle = Math.PI / 4;
light1.penumbra = 0.5;
light1.castShadow = true;
light1.shadow.mapSize.width = 1024;
light1.shadow.mapSize.height = 1024;
light1.shadow.camera.near = 150;
light1.shadow.camera.far = 3000;
scene.add(light1);
var light2 = new THREE.SpotLight();
light2.position.set(-500, 1000, 1000);
light2.angle = Math.PI / 4;
light2.penumbra = 0.5;
light2.castShadow = true;
light2.shadow.mapSize.width = 1024;
light2.shadow.mapSize.height = 1024;
light2.shadow.camera.near = 150;
light2.shadow.camera.far = 300;
scene.add(light2);
var camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.y = 400;
camera.position.z = 700;
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
var controls = new OrbitControls_1.OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.y = 2;
var world = new CANNON.World();
world.gravity.set(0, -1, 0);
//world.broadphase = new CANNON.NaiveBroadphase() //
//world.solver.iterations = 10
//world.allowSleep = true
var centerSphereGeometry = new THREE.SphereGeometry(centerSphereRadius - 3);
var centerSphereMesh = new THREE.Mesh(centerSphereGeometry, normalMaterial);
centerSphereMesh.castShadow = true;
centerSphereMesh.position.add(origin);
// Comment out the following lines to see z fighting
centerSphereMesh.material.polygonOffset = true;
centerSphereMesh.material.polygonOffsetUnits = 1;
centerSphereMesh.material.polygonOffsetFactor = 1;
centerSphereMesh.translateY(800);
scene.add(centerSphereMesh);
var centerSphereShape = new CANNON.Sphere(centerSphereRadius - 3);
var centerSphereBody = new CANNON.Body({ mass: 1 });
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
myCircleList.forEach(function (circle, index) {
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
circlesMoonsBodies.forEach(function (circlesMoonsBody, i) {
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
var planeGeometry = new THREE.PlaneGeometry(1000, 1000);
var planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
planeMesh.rotateX(-Math.PI / 2);
planeMesh.receiveShadow = true;
scene.add(planeMesh);
var planeShape = new CANNON.Plane();
var planeBody = new CANNON.Body({ mass: 0 });
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
var stats = (0, stats_module_1["default"])();
document.body.appendChild(stats.dom);
var gui = new dat_gui_1.GUI();
var physicsFolder = gui.addFolder('Physics');
physicsFolder.add(world.gravity, 'x', -100.0, 100.0, 1);
physicsFolder.add(world.gravity, 'y', -100.0, 100.0, 1);
physicsFolder.add(world.gravity, 'z', -100.0, 100.0, 1);
physicsFolder.open();
var clock = new THREE.Clock();
var cannonDebugRenderer = new cannonDebugRenderer_1["default"](scene, world);
console.log(world);
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    var delta = clock.getDelta();
    if (delta > 0.1)
        delta = 0.1;
    world.step(delta);
    cannonDebugRenderer.update();
    centerSphereMesh.position.set(centerSphereBody.position.x, centerSphereBody.position.y, centerSphereBody.position.z);
    centerSphereMesh.quaternion.set(centerSphereBody.quaternion.x, centerSphereBody.quaternion.y, centerSphereBody.quaternion.z, centerSphereBody.quaternion.w);
    circlesMoonsBodies.forEach(function (circleMoon, index) {
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

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import * as CANNON from 'cannon-es'
import CannonDebugRenderer from './utils/cannonDebugRenderer'
import CannonUtils from './utils/cannonUtils'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { Vec3 } from 'cannon-es'
import { CircleGeometry, SphereGeometry } from 'three'
import { randFloat } from 'three/src/math/MathUtils'


var centerSphereRadius = 65
var centerSphereLargeRadius = 65
var centerSphereY = 0
var rodLengthShort = 330
var rodLengthLong = 500
var origin = new THREE.Vector3(0, centerSphereY, 0)
var endBallRadius = 30
var numberOfCircles = 5

const normalMaterial = new THREE.MeshNormalMaterial()
const phongMaterial = new THREE.MeshPhongMaterial()

function drawCylinder(vstart: THREE.Vector3, vend: THREE.Vector3): THREE.Mesh {
    var HALF_PI = Math.PI * .5;
    var distance = vstart.distanceTo(vend);
    var position  = vend.clone().add(vstart).divideScalar(2);

    var material = new THREE.MeshLambertMaterial({color:0x0000ff});
    var cylinder = new THREE.CylinderGeometry(5,10,distance,10,10,false);
    cylinder.rotateX(Math.PI/2);

    var orientation = new THREE.Matrix4();//a new orientation matrix to offset pivot
    var offsetRotation = new THREE.Matrix4();//a matrix to fix pivot rotation
    var offsetPosition = new THREE.Matrix4();//a matrix to fix pivot position
    orientation.lookAt(vstart,vend,new THREE.Vector3(0,1,0));//look at destination
    offsetRotation.makeRotationZ(HALF_PI);//rotate 90 degs on X
    orientation.multiply(offsetRotation);//combine orientation with rotation transformations

    cylinder.applyMatrix4(orientation)

    var mesh = new THREE.Mesh(cylinder,material);
    mesh.position.set(position.x,position.y,position.z)
    return mesh
}

function makeRodBody(vstart: THREE.Vector3, vend: THREE.Vector3): CANNON.Body {

    var distance = vstart.distanceTo(vend);
    console.log("distance: " + distance)
    var position  = vend.clone().add(vstart).divideScalar(2);
    // We can work out the quaternion using THREE
    var orientation = new THREE.Matrix4();//a new orientation matrix to offset pivot
    var offsetRotation = new THREE.Matrix4();//a matrix to fix pivot rotation
    var offsetPosition = new THREE.Matrix4();//a matrix to fix pivot position
    orientation.lookAt(vstart, vend, new THREE.Vector3(0,1,0));//look at destination
    offsetRotation.makeRotationX(Math.PI / 2);//rotate 90 degs on X
    orientation.multiply(offsetRotation);//combine orientation with rotation transformations
    var quaternionThing = new THREE.Quaternion().setFromRotationMatrix(orientation)
    const rodShape = new CANNON.Cylinder(5, 10, distance - centerSphereRadius- endBallRadius + 13)
    var rodBody = new CANNON.Body({ mass: 3 });
    rodBody.addShape(rodShape);
    //rodBody.shapeOrientations[0].setFromAxisAngle(new CANNON.Vec3(1,0,0), Math.PI/2)
    //rodBody.shapeOffsets[0].set(0, 0, -10)
    rodBody.position.x = rod.position.x
    rodBody.position.y = rod.position.y
    rodBody.position.z = rod.position.z
    rodBody.quaternion.set(quaternionThing.x, quaternionThing.y, quaternionThing.z, quaternionThing.w)
    return rodBody
}

function makeMoonBody(moon: THREE.Mesh): CANNON.Body {
    const moonShape = new CANNON.Sphere(endBallRadius)
    const moonBody = new CANNON.Body({ mass: 3, shape: moonShape })
    moonBody.position.x = moon.position.x
    moonBody.position.y = moon.position.y
    moonBody.position.z = moon.position.z
    moonBody.quaternion.set(moon.quaternion.x, moon.quaternion.y, moon.quaternion.z, moon.quaternion.w)
    return moonBody
}

function makeMoon(moonPosition: THREE.Vector3): THREE.Mesh {
    const ball1Geometry = new THREE.SphereGeometry(endBallRadius)
    const ball1Mesh = new THREE.Mesh(ball1Geometry, normalMaterial)
    ball1Mesh.castShadow = true
    ball1Mesh.position.copy(moonPosition)
    return ball1Mesh
}


const scene = new THREE.Scene()
const axesHelper = new THREE.AxesHelper(500)
scene.add(axesHelper)

const light1 = new THREE.SpotLight()
light1.position.set(500, 1000, 1000)
light1.angle = Math.PI / 4
light1.penumbra = 0.5
light1.castShadow = true
light1.shadow.mapSize.width = 1024
light1.shadow.mapSize.height = 1024
light1.shadow.camera.near = 150
light1.shadow.camera.far = 3000
scene.add(light1)

const light2 = new THREE.SpotLight()
light2.position.set(-500, 1000, 1000)
light2.angle = Math.PI / 4
light2.penumbra = 0.5
light2.castShadow = true
light2.shadow.mapSize.width = 1024
light2.shadow.mapSize.height = 1024
light2.shadow.camera.near = 150
light2.shadow.camera.far = 300
scene.add(light2)

const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 2000)
camera.position.y = 400
camera.position.z =700

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.screenSpacePanning = true
controls.target.y = 2

const world = new CANNON.World()
world.gravity.set(0, -1, 0)
//world.broadphase = new CANNON.NaiveBroadphase() //
//world.solver.iterations = 10
//world.allowSleep = true

const centerSphereGeometry = new THREE.SphereGeometry(centerSphereRadius-10)
const centerSphereMesh = new THREE.Mesh(centerSphereGeometry, normalMaterial)
centerSphereMesh.castShadow = true
centerSphereMesh.position.add(origin)
// Comment out the following lines to see z fighting
centerSphereMesh.material.polygonOffset = true;
centerSphereMesh.material.polygonOffsetUnits = 1;
centerSphereMesh.material.polygonOffsetFactor = 1;
scene.add(centerSphereMesh)

const centerSphereShape = new CANNON.Sphere(centerSphereRadius)
const centerSphereBody = new CANNON.Body({ mass: 1 })
centerSphereBody.addShape(centerSphereShape)
centerSphereBody.position.x = centerSphereMesh.position.x
centerSphereBody.position.y = centerSphereMesh.position.y
centerSphereBody.position.z = centerSphereMesh.position.z
centerSphereBody.quaternion.x = centerSphereMesh.quaternion.x
centerSphereBody.quaternion.y = centerSphereMesh.quaternion.y
centerSphereBody.quaternion.z = centerSphereMesh.quaternion.z
centerSphereBody.quaternion.w = centerSphereMesh.quaternion.w
centerSphereBody.collisionResponse = false
centerSphereBody.linearFactor.set(0, 0, 0)
world.addBody(centerSphereBody)

const HangerShape = new CANNON.Sphere(10)
const HangerBody = new CANNON.Body({ mass: 0 })
HangerBody.addShape(HangerShape)
HangerBody.position.x = 0
HangerBody.position.y = 600
HangerBody.position.z = 0
world.addBody(HangerBody)

var distanceConstraint = new CANNON.DistanceConstraint(centerSphereBody, HangerBody, 600)
world.addConstraint(distanceConstraint)

interface CirclesMoonsBodies {
    rod: THREE.Mesh,
    rodBody: CANNON.Body,
    moon: THREE.Mesh,
    moonBody: CANNON.Body
}

var circlesMoonsBodies: CirclesMoonsBodies[] = []

for(var i=1; i<=numberOfCircles; i++) {
    var distanceAmount = randFloat(0, 1)
    var rodLength = 330
    if(distanceAmount < 0.5) {
        rodLength = 330
    }
    var direction = new THREE.Vector3().randomDirection()
    var moonPosition = new THREE.Vector3().addScaledVector(direction, rodLength)
    var moon = makeMoon(moonPosition)
    var rod = drawCylinder(centerSphereMesh.position, moonPosition)
    console.log("Distance to centre: " + moon.position.distanceTo(centerSphereMesh.position))
    var rodBody = makeRodBody(centerSphereMesh.position, moonPosition)
    circlesMoonsBodies.push({rod, rodBody, moon, moonBody: makeMoonBody(moon)})
}


circlesMoonsBodies.forEach((circlesMoonsBody, i) => {
    scene.add(circlesMoonsBodies[i].rod)
    circlesMoonsBodies[i].rodBody.collisionResponse = false
    world.addBody(circlesMoonsBodies[i].rodBody)
    //console.log("RodMesh: " + circlesMoonsBodies[i].rod.position.x + " " + circlesMoonsBodies[i].rod.position.y + " " + circlesMoonsBodies[i].rod.position.z)
    //console.log("RodBody: " + circlesMoonsBodies[i].rodBody.position.x + " " + circlesMoonsBodies[i].rodBody.position.y + " " + circlesMoonsBodies[i].rodBody.position.z)
    scene.add(circlesMoonsBodies[i].moon)
    //console.log("MoonMesh: " + circlesMoonsBodies[i].moon.position.x + " " + circlesMoonsBodies[i].moon.position.y + " " + circlesMoonsBodies[i].moon.position.z)
    
    circlesMoonsBodies[i].moonBody.collisionResponse = false
    //world.addBody(circlesMoonsBodies[i].moonBody)
    //console.log("MoonBody: " + circlesMoonsBodies[i].moonBody.position.x + " " + circlesMoonsBodies[i].moonBody.position.y + " " + circlesMoonsBodies[i].moonBody.position.z)
    //
    //world.addConstraint(
    //var foo = new CANNON.LockConstraint(circlesMoonsBodies[i].rodBody, circlesMoonsBodies[i].moonBody, { maxForce: 100000000 })
    var vR2M = circlesMoonsBodies[i].moonBody.position.vsub(rodBody.position)
    console.log("Vector from rod to moon: " + vR2M)
    console.log("Distance from rod to moon: " + vR2M.length())
    var vM2R = rodBody.position.vsub(circlesMoonsBodies[i].moonBody.position)
    console.log("Vector from moon to rod: " + vM2R)
    console.log("Distance from moon to rod: " + vM2R.length())
    var vR2CscaleFactor = (vR2M.length() - centerSphereRadius) / vR2M.length()
    console.log("Scale factor: " + vR2CscaleFactor)
    var vC2RscaleFactor = (endBallRadius)/ vM2R.length()
    console.log("Scale factor:  " + vC2RscaleFactor)
    var newVC2R = vM2R.scale(vC2RscaleFactor)
    console.log("New vector from moon to rod length: " + newVC2R.length())


    //var bar = new CANNON.PointToPointConstraint(circlesMoonsBodies[i].rodBody, new CANNON.Vec3(0, 150, 0), centerSphereBody, new CANNON.Vec3(0,0,0), Number.MAX_VALUE)
    var bar = new CANNON.LockConstraint(circlesMoonsBodies[i].rodBody, centerSphereBody, {
        maxForce: Number.MAX_VALUE
    })
    bar.collideConnected = false
    world.addConstraint(bar)
    console.log(bar)

    var foo = new CANNON.PointToPointConstraint(circlesMoonsBodies[i].rodBody, new CANNON.Vec3(0, -150, 0), circlesMoonsBodies[i].moonBody, new CANNON.Vec3(0,0,0))
    foo.collideConnected = false
    //world.addConstraint(foo)
    console.log(foo)

})


console.log(scene)

const planeGeometry = new THREE.PlaneGeometry(1000, 1000)
planeGeometry.rotateX(-Math.PI / 2)
planeGeometry.translate(0, -600, 0)
const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial)
planeMesh.receiveShadow = true
scene.add(planeMesh)
const planeShape = new CANNON.Plane()
const planeBody = new CANNON.Body({ mass: 0 })
planeBody.addShape(planeShape)
planeBody.shapeOffsets[0].y = -600
planeBody.shapeOrientations[0].setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
world.addBody(planeBody)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const physicsFolder = gui.addFolder('Physics')
physicsFolder.add(world.gravity, 'x', -100.0, 100.0, 1)
physicsFolder.add(world.gravity, 'y', -100.0, 100.0, 1)
physicsFolder.add(world.gravity, 'z', -100.0, 100.0, 1)
physicsFolder.open()

const clock = new THREE.Clock()

const cannonDebugRenderer = new CannonDebugRenderer(scene, world)

console.log(world)

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    let delta = clock.getDelta()
    if (delta > 0.1) delta = 0.1
    world.step(delta)
    cannonDebugRenderer.update()

    centerSphereMesh.position.set(centerSphereBody.position.x, centerSphereBody.position.y, centerSphereBody.position.z)
    centerSphereMesh.quaternion.set(centerSphereBody.quaternion.x, centerSphereBody.quaternion.y, centerSphereBody.quaternion.z, centerSphereBody.quaternion.w)

    //console.log(circlesMoonsBodies[0].rod.position.x)
    //console.log(circlesMoonsBodies[0].rodBody.position.x)
    circlesMoonsBodies.forEach((circleMoon, index) => {
        //circlesMoonsBodies[index].rod.position.set(circleMoon.rodBody.position.x, circleMoon.rodBody.position.y, circleMoon.rodBody.position.z)
        //circlesMoonsBodies[index].rod.quaternion.set(circleMoon.rodBody.quaternion.y, circleMoon.rodBody.quaternion.x, circleMoon.rodBody.quaternion.z, circleMoon.rodBody.quaternion.w)
        //circlesMoonsBodies[index].moon.position.set(circleMoon.moonBody.position.x, circleMoon.moonBody.position.y, circleMoon.moonBody.position.z)
        //circlesMoonsBodies[index].moon.quaternion.set(circleMoon.moonBody.quaternion.x, circleMoon.moonBody.quaternion.y, circleMoon.moonBody.quaternion.z, circleMoon.moonBody.quaternion.w)
    })

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()

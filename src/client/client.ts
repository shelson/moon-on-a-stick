import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import * as CANNON from 'cannon-es'
import CannonDebugRenderer from './utils/cannonDebugRenderer'
import { randFloat } from 'three/src/math/MathUtils'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { Blending } from 'three'
import { MeshStandardMaterial, Mesh, SphereGeometry, BoxGeometry } from 'three';
import { CSG } from 'three-csg-ts';

const params = {
    exportASCII: exportASCII,
    exportBinary: exportBinary
};

var centerSphereRadius = 65
var centerSphereLargeRadius = 65
var centerSphereY = 0
var rodLengthShort = 330
var rodLengthLong = 500
var origin = new THREE.Vector3(0, centerSphereY, 0)
var endBallRadius = 30
var numberOfCircles = 2

const normalMaterial = new THREE.MeshNormalMaterial()
const phongMaterial = new THREE.MeshPhongMaterial()

const exporter = new STLExporter();

function exportASCII() {

    const result = exporter.parse( makeCenterMesh() );
    saveString( result, 'box.stl' );

}

function exportBinary() {

    var result = new String()
    //result = exporter.parse( centerSphereMesh, { binary: true } );
    //saveArrayBuffer( result, 'box.stl' );

}

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

function save( blob: Blob, filename: string ) {

    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();

}

function saveString( text: string, filename: string ) {

    save( new Blob( [ text ], { type: 'text/plain' } ), filename );

}

function saveArrayBuffer( buffer: Blob, filename: string ) {

    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );

}

function makeCenterMesh(): THREE.Mesh {
    const csg = new THREE.SphereGeometry(centerSphereRadius)
    var cmesh = new THREE.Mesh(csg, normalMaterial)
    var circles = makeTangentCircles()
    
    var resMesh = subtractHole(cmesh, circles[0])
    circles.forEach((circle) => {
        resMesh = subtractHole(resMesh, circle)
    })

    return resMesh
}

function subtractHole(src: THREE.Mesh, hole: THREE.Mesh): THREE.Mesh {
    // Make sure the .matrix of each mesh is current
    src.updateMatrix();
    hole.updateMatrix();

    const subRes = CSG.subtract(src, hole);
    
    return subRes
}

function makeCircle(radius: number): THREE.Shape {
    const circleRadius = radius;
    const circleShape = new THREE.Shape()
        .moveTo( 0, circleRadius )
        .quadraticCurveTo( circleRadius, circleRadius, circleRadius, 0 )
        .quadraticCurveTo( circleRadius, - circleRadius, 0, - circleRadius )
        .quadraticCurveTo( - circleRadius, - circleRadius, - circleRadius, 0 )
        .quadraticCurveTo( - circleRadius, circleRadius, 0, circleRadius )
    return circleShape
}

function makeTangentCircles(): THREE.Mesh[] {
    var vector = new THREE.Vector3()
    var circles = []

    for ( let i = 0, l = moonsRods.rods.length; i < l; i ++ ) {

        var rodLength = 20
    
        var extrudeSettings = { depth: rodLength, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

        var myShape = makeCircle(8)
        var extrudedGeometry = new THREE.ExtrudeGeometry( myShape, extrudeSettings );
        const object = new THREE.Mesh( extrudedGeometry, normalMaterial );


        object.position.copy( new THREE.Vector3().addScaledVector(moonsRods.rods[i].clone().position.normalize(), centerSphereRadius))
        console.log(object.position)
        vector.copy( object.position ).multiplyScalar( -2 );
        object.up = new THREE.Vector3(0,1,0)
        object.lookAt( vector );
        console.log("Circles: " + object.position)

        circles.push( object );
    }
    return circles
}


function drawCylinder(vstart: THREE.Vector3, vend: THREE.Vector3, type: number): THREE.Mesh {
    var HALF_PI = Math.PI * .5;
    var distance = vstart.distanceTo(vend);
    var position  = vend.clone().add(vstart).divideScalar(2);

    if (type == 0) {
        var material = new THREE.MeshLambertMaterial({color:0x0000ff});
    } else {
        var material = new THREE.MeshLambertMaterial({color:0xff0000});
    }
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
    mesh.userData.type = type
    mesh.userData.mass = 1
    return mesh
}

function makeMoon(moonPosition: THREE.Vector3): THREE.Mesh {
    const ball1Geometry = new THREE.SphereGeometry(endBallRadius)
    const ball1Mesh = new THREE.Mesh(ball1Geometry, normalMaterial)
    ball1Mesh.castShadow = true
    ball1Mesh.position.copy(moonPosition)
    ball1Mesh.userData.mass = 5
    ball1Mesh.userData.type = 0
    return ball1Mesh
}

function centreOfMass(balls: THREE.Mesh[]): THREE.Vector3 {
    var totalMass = 0
    var totalX = 0
    var totalY = 0
    var totalZ = 0
    balls.forEach((ball) => {
        if(ball.userData.type == 0) {
            totalMass += ball.userData.mass
            totalX += ball.userData.mass * ball.position.x
            totalY += ball.userData.mass * ball.position.y
            totalZ += ball.userData.mass * ball.position.z
        }
    })
    return new THREE.Vector3(totalX / totalMass, totalY / totalMass, totalZ / totalMass)
}

function rebalance(centerSphere: THREE.Mesh): void {
    reBuildSphere(centerSphere)
    var com = centreOfMass(centerSphere.children.map((child) => child as THREE.Mesh))
    console.log("Centre of mass: ")
    console.log(com)
    var comQuaternion = new THREE.Quaternion();
    comQuaternion.setFromUnitVectors(com.normalize(), new THREE.Vector3(0, -1, 0))
    console.log("Centre of mass quaternion: ")
    console.log(comQuaternion)
    console.log(centerSphere.rotation)
    centerSphere.applyQuaternion(comQuaternion)
    console.log(centerSphere.rotation)
}

function resetComRod(centerSphere: THREE.Mesh): void {
    centerSphere.children.forEach((child) => {
        if(child.userData.type == 1) {
            centerSphere.remove(child)
        }
    })
    var com = centreOfMass(moonsRods.rods.concat(moonsRods.moons))

    var comRod = drawCylinder(centerSphereMesh.position, com, 1)
    centerSphere.add(comRod)

}

function checkDistances(suggestedSpot: THREE.Vector3): boolean {
    moonsRods.moons.forEach((moon) => {
        var distance = suggestedSpot.distanceTo(moon.position)
        if(distance < 1000) {
            console.log("Too close to another moon")
            return false
        }
    })
    return true
}


function addBall(centerSphere: THREE.Mesh): void {
    var distanceAmount = randFloat(0, 1)
    var rodLength = 500 + centerSphereRadius + endBallRadius
    if(distanceAmount < 0.8) {
        rodLength = 330 + centerSphereRadius + endBallRadius
    }
    var direction = new THREE.Vector3(randFloat(-1, 1), randFloat(-1, 1), randFloat(-1, 1)).normalize()
    var distanceOkay = false
    var moonPosition = new THREE.Vector3
    while(!distanceOkay) {
        moonPosition = new THREE.Vector3().addScaledVector(direction, rodLength)
        distanceOkay = checkDistances(moonPosition)
    }

    var moon = makeMoon(moonPosition)
    var rod = drawCylinder(centerSphere.position, moonPosition, 0)
    moonsRods.rods.push(rod)
    moonsRods.moons.push(moon)
    reBuildSphere(centerSphere)
}

function resetSphere(centerSphere: THREE.Mesh): void {
    centerSphere.clear()
    moonsRods.rods = []
    moonsRods.moons = []
    centerSphere.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 0), 0)
}

function reBuildSphere(centerSphere: THREE.Mesh): void {
    centerSphere.clear()
    centerSphere.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 0), 0)
    moonsRods.moons.forEach((moon) => {
        centerSphere.add(moon)
    })
    moonsRods.rods.forEach((rod) => {
        centerSphere.add(rod)
    })
    resetComRod(centerSphere)
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
//world.allowSleep = true
world.gravity.set(0, -1, 0)
//world.broadphase = new CANNON.NaiveBroadphase() //
//world.solver.iterations = 10
//world.allowSleep = true

const centerSphereGeometry = new THREE.SphereGeometry(centerSphereRadius)
const centerSphereMesh = new THREE.Mesh(centerSphereGeometry, normalMaterial)
centerSphereMesh.castShadow = true
centerSphereMesh.position.add(origin)

interface MoonsRods {
    rods: THREE.Mesh[],
    moons: THREE.Mesh[]
}

var moonsRods: MoonsRods = {rods: [], moons: []}

for(var i=1; i<=numberOfCircles; i++) {
    addBall(centerSphereMesh)
}

console.log("Centre of mass: ")
console.log(centreOfMass(moonsRods.rods.concat(moonsRods.moons)))

scene.add(centerSphereMesh)


console.log(scene)

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
const buttonFolder = gui.addFolder('Stuff')
buttonFolder.add({ addBall: () => addBall(centerSphereMesh) }, 'addBall')
buttonFolder.add({ rebalance: () => rebalance(centerSphereMesh) }, 'rebalance')
buttonFolder.add({ reset: () => resetSphere(centerSphereMesh) }, 'reset')
buttonFolder.add( params, 'exportBinary' ).name( 'Export STL (Binary)' );
buttonFolder.add( params, 'exportASCII' ).name( 'Export STL (Ascii)' );
buttonFolder.open()

const clock = new THREE.Clock()

const cannonDebugRenderer = new CannonDebugRenderer(scene, world)

console.log(world)

var hasRun = 0

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    let delta = clock.getDelta()
    if (delta > 0.1) delta = 0.1
    world.step(delta)
    cannonDebugRenderer.update()
    
    if(Math.floor(clock.elapsedTime) == 2) {
        if(hasRun == 0) {
            hasRun = 1
            var com = centreOfMass(moonsRods.rods.concat(moonsRods.moons))
            console.log("Centre of mass: ")
            console.log(com)
            var comQuaternion = new THREE.Quaternion();
            comQuaternion.setFromUnitVectors(com.normalize(), new THREE.Vector3(0, -1, 0))
            console.log("Centre of mass quaternion: ")
            console.log(comQuaternion)
            console.log(centerSphereMesh.rotation)
            centerSphereMesh.applyQuaternion(comQuaternion)
            console.log(centerSphereMesh.rotation)
        }
    }

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()

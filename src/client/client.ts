import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import * as CANNON from 'cannon-es'
import CannonDebugRenderer from './utils/cannonDebugRenderer'
import { randFloat } from 'three/src/math/MathUtils'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { CSG } from 'three-csg-ts';

var centerSphereRadius = 50
var centerSphereLargeRadius = 65
var centerSphereY = 0
var rodLengthShort = 330
var rodLengthLong = 500
var origin = new THREE.Vector3(0, centerSphereY, 0)
var endBallRadius = 62
var numberOfCircles = 2

const normalMaterial = new THREE.MeshNormalMaterial()

const exporter = new STLExporter();


class MoonsRods {
    private rods: THREE.Mesh[]
    private moons: THREE.Mesh[]

    public constructor() {
        this.rods = []
        this.moons = []
    }

    public addRod(rod: THREE.Mesh) {
        this.rods.push(rod)
    }

    public addMoon(moon: THREE.Mesh) {
        this.moons.push(moon)
    }

    public getRods(): THREE.Mesh[] {
        return this.rods
    }

    public getMoons(): THREE.Mesh[] {
        return this.moons
    }

    public clearMoons() {
        this.moons = []
    }

    public clearRods() {
        this.rods = []
    }
}

var moonsRods = new MoonsRods()

function exportASCII(centerSphere: THREE.Mesh) {

    centerSphere.children.forEach((child) => {
        var position = child.clone().position
        if (child.userData.type == 1) {
            console.log("Moon: " + position.x + " " + position.y + " " + position.z)
        }
        if (child.userData.type == 2) {
            console.log("COM: " + position.x + " " + position.y + " " + position.z)
        }
    })

    return

}

interface ApiObject {
    objData: string
}

async function getCenterObj(jsonData: string) {

    fetch("https://ballsballsdockerrenderer.azurewebsites.net/api/makemeacenterballman", {
      method: 'POST',
      body: jsonData,
      headers: {'Content-Type': 'application/json'} 
    })

    .then((resp) => resp.json())
    .then((json) => {
        console.log(json)
        if(json.status == "error") {
            console.log(json.message)
        } else {
            saveString( json.objData, 'centersphere.obj' )
        }
    })
    .catch(error => {
        console.log(error)
    })
}

function exportObj(centerSphere: THREE.Mesh) {
    //result = exporter.parse( centerSphereMesh, { binary: true } );
    //saveArrayBuffer( result, 'box.stl' );
    var moonsData = new Array<Array<number>>();
    var comData = new Array<number>();

    centerSphere.children.forEach((child) => {
        var position = child.clone().position
        if (child.userData.type == 1) {
            moonsData.push([position.x, position.y, position.z])
            console.log("Moon: " + position.x + " " + position.y + " " + position.z)
        }
        if (child.userData.type == 2) {
            comData = [position.x, position.y, position.z]
            console.log("COM: " + position.x + " " + position.y + " " + position.z)
        }
    })

    console.log(JSON.stringify({moons: moonsData, com: comData}))

    const jsonData = JSON.stringify({moons: moonsData, com: comData})
    getCenterObj(jsonData)
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

function drawCylinder(vstart: THREE.Vector3, vend: THREE.Vector3, radius: number): THREE.Mesh {
    var HALF_PI = Math.PI * .5;
    var distance = vstart.distanceTo(vend);
    var position  = vend.clone().add(vstart).divideScalar(2);

    // lazy way to guess when it's the com, to make it red
    if (radius < 8 && radius > 0) {
        var material = new THREE.MeshLambertMaterial({color:0x0000ff});
    } else {
        var material = new THREE.MeshLambertMaterial({color:0xff0000});
    }
    var cylinder = new THREE.CylinderGeometry(radius, radius,distance,30,30,false);
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

function makeMoon(moonPosition: THREE.Vector3): THREE.Mesh {
    const ball1Geometry = new THREE.SphereGeometry(endBallRadius)
    const ball1Mesh = new THREE.Mesh(ball1Geometry, normalMaterial)
    ball1Mesh.castShadow = true
    ball1Mesh.position.copy(moonPosition)
    ball1Mesh.userData.type = 0
    return ball1Mesh
}

function centreOfMass(balls: THREE.Mesh[]): THREE.Vector3 {
    var totalMass = 0
    var totalX = 0
    var totalY = 0
    var totalZ = 0
    balls.forEach((ball) => {
        if(ball.userData.type == 0 || ball.userData.type == 1) {
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
    var comQuaternion = new THREE.Quaternion();
    comQuaternion.setFromUnitVectors(com.normalize(), new THREE.Vector3(0, -1, 0))
    centerSphere.applyQuaternion(comQuaternion)
}

function resetComRod(centerSphere: THREE.Mesh): void {
    centerSphere.children.forEach((child) => {
        if(child.userData.type == 2) {
            centerSphere.remove(child)
        }
    })
    var com = centreOfMass(moonsRods.getRods().concat(moonsRods.getMoons()))

    var comRod = drawCylinder(centerSphereMesh.position, com, 6)
    comRod.userData.mass = 0
    comRod.userData.type = 2
    centerSphere.add(comRod)

}

function checkDistances(suggestedSpot: THREE.Vector3): boolean {
    var retval = true
    try {
        moonsRods.getMoons().forEach((moon) => {
            var distance = suggestedSpot.distanceTo(moon.position)
            if(distance < 300) {
                throw("Too close to another moon")  
            }
        })
    }catch(err) {
        retval = false
    }
    return retval
}


function addBall(centerSphere: THREE.Mesh, position: String): void {
    var distanceAmount = randFloat(0, 1)
    var cutoff = 0.4
    if (position == "high") {
        cutoff = 0.8
    }
    console.log(distanceAmount)
    console.log("centerSphereRadius: " + centerSphereRadius)
    console.log("endBallRadius: " + endBallRadius)
    var centreTocentre = 500 + (centerSphereRadius - (centerSphereRadius - 20)) + (endBallRadius - (endBallRadius - 20))
    if(distanceAmount < cutoff) {
        centreTocentre = 330 + (centerSphereRadius - (centerSphereRadius - 20)) + (endBallRadius - (endBallRadius - 20))
    }
    console.log("c2c: " + centreTocentre)
    var mass = 124
    var type = 1
    if(position == "high"){
        var yValue = randFloat(0.5, 1)
    } else {
        var yValue = randFloat(-1, -0.25)
        mass = 800
    }
    var direction = new THREE.Vector3(randFloat(-1, 1), yValue, randFloat(-1, 1)).normalize()
    var distanceOkay = false
    var moonPosition = new THREE.Vector3
    var numAttempts = 0
    try {
        while(!distanceOkay) {
            numAttempts += 1
            moonPosition = new THREE.Vector3().addScaledVector(direction, centreTocentre)
            distanceOkay = checkDistances(moonPosition)
            if(numAttempts > 100) {
                console.log("Too many attempts to find a spot")
                throw("E_TOOMANYATTEMPTS")
            }
        }
    }catch(err) {
        console.log("Can't find a space, stop trying")
        return
    }
    console.log("moonPosition: " + moonPosition.x + ", " + moonPosition.y + ", " + moonPosition.z)

    var moon = makeMoon(moonPosition)
    console.log("mass: " + mass)
    moon.userData.mass = mass
    moon.userData.type = type
    var rod = drawCylinder(centerSphere.position, moonPosition, 10.25/2)
    rod.userData.mass = 0.3
    rod.userData.type = 0
    moonsRods.addRod(rod)
    moonsRods.addMoon(moon)
    reBuildSphere(centerSphere)
}

function resetSphere(centerSphere: THREE.Mesh): void {
    centerSphere.clear()
    moonsRods.clearRods()
    moonsRods.clearMoons()
    centerSphere.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 0), 0)
}

function reBuildSphere(centerSphere: THREE.Mesh): void {
    centerSphere.clear()
    centerSphere.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 0), 0)
    moonsRods.getMoons().forEach((moon) => {
        centerSphere.add(moon)
    })
    moonsRods.getRods().forEach((rod) => {
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

for(var i=1; i<=numberOfCircles; i++) {
    addBall(centerSphereMesh, new String("low"))
}

scene.add(centerSphereMesh)

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
buttonFolder.add({ addBallHigh: () => addBall(centerSphereMesh, new String("high")) } , 'addBallHigh')
buttonFolder.add({ addBallLow: () => addBall(centerSphereMesh, new String("low")) } , 'addBallLow')
buttonFolder.add({ rebalance: () => rebalance(centerSphereMesh) }, 'rebalance')
buttonFolder.add({ reset: () => resetSphere(centerSphereMesh) }, 'reset')
buttonFolder.add( { exportObj: () => exportObj(centerSphereMesh)}, 'exportObj')
buttonFolder.add({ exportAscii: () => exportASCII(centerSphereMesh)}, 'exportAscii')
buttonFolder.open()

const clock = new THREE.Clock()

const cannonDebugRenderer = new CannonDebugRenderer(scene, world)

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
            var com = centreOfMass(moonsRods.getRods().concat(moonsRods.getMoons()))
            var comQuaternion = new THREE.Quaternion();
            comQuaternion.setFromUnitVectors(com.normalize(), new THREE.Vector3(0, -1, 0))
            centerSphereMesh.applyQuaternion(comQuaternion)
        }
    }

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()

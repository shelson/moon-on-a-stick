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
var numberOfCircles = 2

const normalMaterial = new THREE.MeshNormalMaterial()
const phongMaterial = new THREE.MeshPhongMaterial()

function makeManyCircles(numCircles: number): THREE.Mesh[] {
    var vector = new THREE.Vector3()
    var circles = []

    
    
    for ( let i = 0, l = numCircles; i < l; i ++ ) {
        const phi = Math.acos( - 1 + ( 2 * i ) / l );
        const theta = Math.sqrt( l * Math.PI ) * phi;

        if(randFloat(0,1) > 0.5) {
            var rodLength = rodLengthLong
        } else {
            var rodLength = rodLengthShort
        }
        console.log("phi: " + phi + " theta: " + theta + " rodLength: " + rodLength)
        var extrudeSettings = { depth: rodLength, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

        var myShape = makeCircle(10)
        var extrudedGeometry = new THREE.ExtrudeGeometry( myShape, extrudeSettings );
        const object = new THREE.Mesh( extrudedGeometry, normalMaterial );

        object.position.setFromSphericalCoords( centerSphereRadius, phi, theta )

        vector.copy( object.position ).multiplyScalar( 2 );

        object.lookAt( vector );
        console.log("Circles: " + object.position.x + " " + object.position.y + " " + object.position.z)

        circles.push( object );
    }
    return circles
}

function calcPosFromLatLon(phi: number, theta: number, scale: number): THREE.Vector3 {
    let lat = (90 - phi) * (Math.PI/180);
    
    let lon = (theta + 180) * (Math.PI/180);
    
    const x = -(Math.sin(lat)* Math.cos(lon))
    const z = Math.sin(lat) * Math.sin(lon)
    const y = Math.cos(lat)
    console.log("x: " + x + " y: " + y + " z: " + z)
    return new THREE.Vector3(x * scale , y * scale, z * scale)
}

function makeMoonBody(moon: THREE.Mesh): CANNON.Body {
    const moonShape = new CANNON.Sphere(endBallRadius)
    const moonBody = new CANNON.Body({ mass: 2, shape: moonShape })
    moonBody.position.x = moon.position.x
    moonBody.position.y = moon.position.y
    moonBody.position.z = moon.position.z
    moonBody.quaternion.set(moon.quaternion.x, moon.quaternion.y, moon.quaternion.z, moon.quaternion.w)
    return moonBody
}

function makeRodBody(circle: THREE.Mesh, height: number): CANNON.Body {
    // It's actually a box ;)
    const halfExtents = new CANNON.Vec3(10, height, 10)
    const boxShape = new CANNON.Box(halfExtents)
    const rodBody = new CANNON.Body({ mass: 0.5, shape: boxShape })
    rodBody.position.x = circle.position.x
    rodBody.position.y = circle.position.y
    rodBody.position.z = circle.position.z
    rodBody.quaternion.set(circle.quaternion.x, circle.quaternion.y, circle.quaternion.z, circle.quaternion.w)
    return rodBody
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

const centerSphereShape = new CANNON.Sphere(centerSphereRadius-10)
const centerSphereBody = new CANNON.Body({ mass: 1 })
centerSphereBody.addShape(centerSphereShape)
centerSphereBody.position.x = centerSphereMesh.position.x
centerSphereBody.position.y = centerSphereMesh.position.y
centerSphereBody.position.z = centerSphereMesh.position.z
centerSphereBody.quaternion.x = centerSphereMesh.quaternion.x
centerSphereBody.quaternion.y = centerSphereMesh.quaternion.y
centerSphereBody.quaternion.z = centerSphereMesh.quaternion.z
centerSphereBody.quaternion.w = centerSphereMesh.quaternion.w
world.addBody(centerSphereBody)

interface CirclesMoonsBodies {
    circle: THREE.Mesh,
    rodBody: CANNON.Body,
    moon: THREE.Mesh,
    moonBody: CANNON.Body
}

var circlesMoonsBodies: CirclesMoonsBodies[] = []

var myCircleList = makeManyCircles(numberOfCircles)
myCircleList.forEach((circle, index) => {
    // create a ball on the end of the circle
    circle.geometry.computeBoundingSphere()
    var boundingSphere = circle.geometry.boundingSphere
    var circleSize = boundingSphere?.radius || 0
    console.log("Circle Size: " + circleSize)
    if(circleSize > 200) {
        var rodLength = rodLengthLong
    } else {
        var rodLength = rodLengthShort
    }
    var neededPos = centerSphereRadius + rodLength + endBallRadius
    var scaleFactor = neededPos / circle.position.length()
    var endBallPos = new THREE.Vector3().addScaledVector(circle.position, scaleFactor)
    var moon = makeMoon(endBallPos)
    moon.name = "moon" + index
    circle.name = "circle" + index
    //onsole.log(circle.quaternion)
    var moonBody = makeMoonBody(moon)
    var rodBody = makeRodBody(circle, rodLength)
    console.log(rodBody)
    circlesMoonsBodies.push({circle: circle.clone(), rodBody: rodBody, moon: moon.clone(), moonBody: moonBody})
})

circlesMoonsBodies.forEach((circlesMoonsBody, i) => {
    // attempt to move everyhing up some
    //circlesMoonsBodies[i].circle.translateY(800)
    //circlesMoonsBodies[i].moon.translateY(800)
    //circlesMoonsBodies[i].rodBody.position.y += 800
    //circlesMoonsBodies[i].moonBody.position.y += 800
    circlesMoonsBodies[i].rodBody.updateBoundingRadius()
    circlesMoonsBodies[i].circle.geometry.computeBoundingSphere()
    console.log("three: " + circlesMoonsBodies[i].circle.position.x + " " + circlesMoonsBodies[i].circle.position.y + " " + circlesMoonsBodies[i].circle.position.z)
    console.log("cannon: " + circlesMoonsBodies[i].rodBody.position.x + " " + circlesMoonsBodies[i].rodBody.position.y + " " + circlesMoonsBodies[i].rodBody.position.z)
    scene.add(circlesMoonsBodies[i].circle)
    scene.add(circlesMoonsBodies[i].moon)
    world.addBody(circlesMoonsBodies[i].rodBody)
    world.addBody(circlesMoonsBodies[i].moonBody)
    //world.addConstraint(new CANNON.LockConstraint(circlesMoonsBodies[i].rodBody, circlesMoonsBodies[i].moonBody))
    //world.addConstraint(new CANNON.LockConstraint(circlesMoonsBodies[i].rodBody, centerSphereBody))
})


console.log(scene)

const planeGeometry = new THREE.PlaneGeometry(1000, 1000)
const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial)
planeMesh.rotateX(-Math.PI / 2)
planeMesh.receiveShadow = true
planeMesh.translateY(-1000)
//scene.add(planeMesh)
const planeShape = new CANNON.Plane()
const planeBody = new CANNON.Body({ mass: 0 })
planeBody.addShape(planeShape)
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
planeBody.position.addScaledVector(1000, new CANNON.Vec3(0, -1, 0))
//world.addBody(planeBody)

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

    circlesMoonsBodies.forEach((circleMoon, index) => {
        circlesMoonsBodies[index].circle.position.set(circleMoon.rodBody.position.x, circleMoon.rodBody.position.y, circleMoon.rodBody.position.z)
        circlesMoonsBodies[index].circle.quaternion.set(circleMoon.rodBody.quaternion.x, circleMoon.rodBody.quaternion.y, circleMoon.rodBody.quaternion.z, circleMoon.rodBody.quaternion.w)
        circlesMoonsBodies[index].moon.position.set(circleMoon.moonBody.position.x, circleMoon.moonBody.position.y, circleMoon.moonBody.position.z)
        circlesMoonsBodies[index].moon.quaternion.set(circleMoon.moonBody.quaternion.x, circleMoon.moonBody.quaternion.y, circleMoon.moonBody.quaternion.z, circleMoon.moonBody.quaternion.w)
    })

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()

import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { COLORS } from './utils/constants'

gsap.registerPlugin(ScrollTrigger)

// --- SCENE
const size = { width: 0, height: 0 }

const scene = new THREE.Scene()
scene.background = new THREE.Color(COLORS.background)
scene.fog = new THREE.Fog(COLORS.background, 15, 20)

// --- RENDERER
const renderer = new THREE.WebGLRenderer({
  antialias: true
})

renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 5
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const container = document.querySelector('.canvas')
container.appendChild(renderer.domElement)

// --- CAMERA
const camera = new THREE.PerspectiveCamera(40, size.width / size.height, 0.1, 100)
camera.position.set(0, 1, 5)
const cameraTarget = new THREE.Vector3(0, 1, 0)

scene.add(camera)

// --- LIGHTS
const directionalLight = new THREE.DirectionalLight(COLORS.light, 2)
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 10
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(2, 5, 3)

scene.add(directionalLight)

const hemisphereLight = new THREE.HemisphereLight(COLORS.sky, COLORS.ground, 0.5)
scene.add(hemisphereLight)

// --- FLOOR
const plane = new THREE.PlaneGeometry(100, 100)
const floorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.ground })
const floor = new THREE.Mesh(plane, floorMaterial)
floor.receiveShadow = true
floor.rotateX(-Math.PI * 0.5)

scene.add(floor)

// --- ON RESIZE
const onResize = () => {
  size.width = container.clientWidth
  size.height = container.clientHeight

  camera.aspect = size.width / size.height
  camera.updateProjectionMatrix()

  renderer.setSize(size.width, size.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

window.addEventListener('resize', onResize)
onResize()

// --- GLTF LOADER
const toLoad = [
  { name: 'bear', group: new THREE.Group(), file: './assets/bear-model.gltf' },
  { name: 'dog', group: new THREE.Group(), file: './assets/dog-model.gltf' }
]

const models = {}

const setupAnimation = () => {
  models.bear.position.x = 5
  models.dog.position.x = -5

  ScrollTrigger.matchMedia({ '(prefers-reduced-motion: no-preference)': desktopAnimation })
}

const desktopAnimation = () => {
  const section = 0
  const tl = gsap.timeline({
    defaults: {
      duration: 1,
      ease: 'power2.inOut'
    },
    scrollTrigger: {
      trigger: '.page',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.1
    }
  })

  tl.to(models.bear.position, { x: 1 }, section)
}

const LoadingManager = new THREE.LoadingManager(() => {
  setupAnimation()
})
const gltfLoader = new GLTFLoader(LoadingManager)

toLoad.forEach(item => {
  gltfLoader.load(item.file, (model) => {
    // enable shadows
    model.scene.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.receiveShadow = true
        child.castShadow = true
      }
    })

    item.group.add(model.scene)
    scene.add(item.group)
    models[item.name] = item.group
  })
})

// --- TICK
const tick = () => {
  camera.lookAt(cameraTarget)
  renderer.render(scene, camera)
  window.requestAnimationFrame(() => tick())
}

tick()

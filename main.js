import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Scene, Camera, Renderer 초기화
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // 하늘색 배경

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 1.6, 0); // 사람 눈높이

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 조명 추가
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// 바닥 생성 (회색 평면)
const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.2
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // 바닥이 수평이 되도록 회전
floor.receiveShadow = true;
scene.add(floor);

// 벽 4개 생성 (큐브로 경계)
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.7
});

// 벽 높이와 두께
const wallHeight = 3;
const wallThickness = 0.2;
const roomSize = 10;

// 북쪽 벽
const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(roomSize, wallHeight, wallThickness),
    wallMaterial
);
northWall.position.set(0, wallHeight / 2, -roomSize / 2);
northWall.castShadow = true;
scene.add(northWall);

// 남쪽 벽
const southWall = new THREE.Mesh(
    new THREE.BoxGeometry(roomSize, wallHeight, wallThickness),
    wallMaterial
);
southWall.position.set(0, wallHeight / 2, roomSize / 2);
southWall.castShadow = true;
scene.add(southWall);

// 서쪽 벽
const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, roomSize),
    wallMaterial
);
westWall.position.set(-roomSize / 2, wallHeight / 2, 0);
westWall.castShadow = true;
scene.add(westWall);

// 동쪽 벽
const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, roomSize),
    wallMaterial
);
eastWall.position.set(roomSize / 2, wallHeight / 2, 0);
eastWall.castShadow = true;
scene.add(eastWall);

// 참고용 큐브 추가 (방 중앙에)
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff6347 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 0.5, -3);
cube.castShadow = true;
scene.add(cube);

// PointerLockControls 설정 (1인칭 시점)
const controls = new PointerLockControls(camera, renderer.domElement);

// 클릭하면 포인터 락 활성화
renderer.domElement.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    console.log('Controls locked');
});

controls.addEventListener('unlock', () => {
    console.log('Controls unlocked');
});

scene.add(controls.getObject());

// 윈도우 리사이즈 처리
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);

    // 큐브 회전 (시각적 효과)
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();

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

// 키보드 입력 상태 추적
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// 이동 속도
const moveSpeed = 5.0;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// 플레이어 충돌 반경
const playerRadius = 0.3;

// 방 경계 (벽 안쪽)
const roomBounds = {
    minX: -roomSize / 2 + wallThickness / 2 + playerRadius,
    maxX: roomSize / 2 - wallThickness / 2 - playerRadius,
    minZ: -roomSize / 2 + wallThickness / 2 + playerRadius,
    maxZ: roomSize / 2 - wallThickness / 2 - playerRadius
};

// 키보드 이벤트 리스너
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.backward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.backward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = false;
            break;
    }
});

// 윈도우 리사이즈 처리
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 시간 추적 (프레임 독립적인 이동)
let prevTime = performance.now();

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000; // 초 단위로 변환

    // 큐브 회전 (시각적 효과)
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // 컨트롤이 잠겨있을 때만 이동 가능
    if (controls.isLocked) {
        // 이동 방향 계산
        direction.z = Number(keys.forward) - Number(keys.backward);
        direction.x = Number(keys.right) - Number(keys.left);
        direction.normalize(); // 대각선 이동 시 속도가 빨라지는 것 방지

        // 속도 계산
        velocity.z = direction.z * moveSpeed * delta;
        velocity.x = direction.x * moveSpeed * delta;

        // 카메라의 현재 위치 저장
        const controlsObject = controls.getObject();
        const newPosition = controlsObject.position.clone();

        // 이동 적용 (카메라가 보는 방향 기준)
        if (keys.forward || keys.backward) {
            controls.moveForward(-velocity.z);
        }
        if (keys.left || keys.right) {
            controls.moveRight(velocity.x);
        }

        // 충돌 검사 및 경계 제한
        const pos = controlsObject.position;

        // X축 경계 체크
        if (pos.x < roomBounds.minX) {
            pos.x = roomBounds.minX;
        } else if (pos.x > roomBounds.maxX) {
            pos.x = roomBounds.maxX;
        }

        // Z축 경계 체크
        if (pos.z < roomBounds.minZ) {
            pos.z = roomBounds.minZ;
        } else if (pos.z > roomBounds.maxZ) {
            pos.z = roomBounds.maxZ;
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
}

animate();

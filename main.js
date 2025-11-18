import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Scene, Camera, Renderer 초기화
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // 하늘색 배경

// 게임 컨테이너 가져오기
const gameContainer = document.getElementById('game-container');
const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight * 0.7; // 하단 70%

const camera = new THREE.PerspectiveCamera(
    75,
    gameWidth / gameHeight,
    0.1,
    1000
);
camera.position.set(0, 1.6, 0); // 사람 눈높이

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(gameWidth, gameHeight);
renderer.shadowMap.enabled = true;
gameContainer.appendChild(renderer.domElement);

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

// 적(빨간 큐브) 2개 추가
const enemies = [];
const enemyGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

// 적 1
const enemy1 = new THREE.Mesh(enemyGeometry, enemyMaterial);
enemy1.position.set(-3, 0.4, -3);
enemy1.castShadow = true;
scene.add(enemy1);
enemies.push(enemy1);

// 적 2
const enemy2 = new THREE.Mesh(enemyGeometry, enemyMaterial);
enemy2.position.set(3, 0.4, 2);
enemy2.castShadow = true;
scene.add(enemy2);
enemies.push(enemy2);

// 적 이동 속도
const enemySpeed = 1.5;

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

// 미니맵 설정
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');

// 미니맵 크기 설정
const minimapSize = 300;
minimapCanvas.width = minimapSize;
minimapCanvas.height = minimapSize;

// 미니맵 스케일 (3D 공간 -> 2D 미니맵)
const mapScale = minimapSize / (roomSize * 1.2);

// 미니맵 그리기 함수
function drawMinimap(playerX, playerZ) {
    // 캔버스 초기화
    minimapCtx.fillStyle = '#2a2a2a';
    minimapCtx.fillRect(0, 0, minimapSize, minimapSize);

    // 중심점 계산
    const centerX = minimapSize / 2;
    const centerY = minimapSize / 2;

    // 바닥 그리기 (회색)
    minimapCtx.fillStyle = '#555555';
    const floorSize = roomSize * mapScale;
    minimapCtx.fillRect(
        centerX - floorSize / 2,
        centerY - floorSize / 2,
        floorSize,
        floorSize
    );

    // 벽 그리기 (밝은 회색)
    minimapCtx.strokeStyle = '#cccccc';
    minimapCtx.lineWidth = 3;
    minimapCtx.strokeRect(
        centerX - floorSize / 2,
        centerY - floorSize / 2,
        floorSize,
        floorSize
    );

    // 큐브 그리기 (토마토색)
    const cubeX = centerX + (0 * mapScale);
    const cubeZ = centerY + (-3 * mapScale);
    minimapCtx.fillStyle = '#ff6347';
    minimapCtx.fillRect(cubeX - 5, cubeZ - 5, 10, 10);

    // 적들 그리기 (주황색 사각형)
    minimapCtx.fillStyle = '#ff8800';
    enemies.forEach((enemy) => {
        const enemyMapX = centerX + (enemy.position.x * mapScale);
        const enemyMapZ = centerY + (enemy.position.z * mapScale);
        minimapCtx.fillRect(enemyMapX - 4, enemyMapZ - 4, 8, 8);
    });

    // 플레이어 위치 그리기 (빨간 점)
    const playerMapX = centerX + (playerX * mapScale);
    const playerMapZ = centerY + (playerZ * mapScale);

    minimapCtx.fillStyle = '#ff0000';
    minimapCtx.beginPath();
    minimapCtx.arc(playerMapX, playerMapZ, 6, 0, Math.PI * 2);
    minimapCtx.fill();

    // 플레이어 방향 표시 (작은 선)
    const controlsObject = controls.getObject();
    const lookDirection = new THREE.Vector3(0, 0, -1);
    lookDirection.applyQuaternion(controlsObject.quaternion);

    minimapCtx.strokeStyle = '#ff0000';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(playerMapX, playerMapZ);
    minimapCtx.lineTo(
        playerMapX + lookDirection.x * 15,
        playerMapZ + lookDirection.z * 15
    );
    minimapCtx.stroke();
}

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
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight * 0.7;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
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

    // 적 AI - 플레이어를 향해 이동
    const playerPos = controls.getObject().position;
    enemies.forEach((enemy) => {
        // 플레이어 방향 계산
        const direction = new THREE.Vector3();
        direction.subVectors(playerPos, enemy.position);
        direction.y = 0; // Y축 이동 방지 (같은 높이 유지)
        direction.normalize();

        // 적 이동
        const moveDistance = enemySpeed * delta;
        const newX = enemy.position.x + direction.x * moveDistance;
        const newZ = enemy.position.z + direction.z * moveDistance;

        // 벽 충돌 체크 (적도 벽을 통과하지 못하게)
        const enemyRadius = 0.4;
        const enemyBounds = {
            minX: -roomSize / 2 + wallThickness / 2 + enemyRadius,
            maxX: roomSize / 2 - wallThickness / 2 - enemyRadius,
            minZ: -roomSize / 2 + wallThickness / 2 + enemyRadius,
            maxZ: roomSize / 2 - wallThickness / 2 - enemyRadius
        };

        // X축 이동 및 경계 체크
        if (newX >= enemyBounds.minX && newX <= enemyBounds.maxX) {
            enemy.position.x = newX;
        }

        // Z축 이동 및 경계 체크
        if (newZ >= enemyBounds.minZ && newZ <= enemyBounds.maxZ) {
            enemy.position.z = newZ;
        }

        // 적이 플레이어를 향하도록 회전
        enemy.rotation.y += 0.02;
    });

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

    // 미니맵 업데이트
    const controlsObject = controls.getObject();
    drawMinimap(controlsObject.position.x, controlsObject.position.z);
}

animate();

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

// 적 관련 변수
let enemies = [];
const enemyGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const enemySpeed = 1.5;

// 난이도 설정
let currentDifficulty = null;
const difficultySettings = {
    easy: { enemyCount: 2, enemyHealth: 3 },
    normal: { enemyCount: 3, enemyHealth: 4 },
    hard: { enemyCount: 4, enemyHealth: 6 }
};

// 적 생성 함수
function createEnemies(difficulty) {
    // 기존 적 제거
    enemies.forEach(enemy => scene.remove(enemy));
    enemies = [];

    const settings = difficultySettings[difficulty];
    const positions = [
        { x: -3, z: -3 },
        { x: 3, z: 2 },
        { x: -3, z: 3 },
        { x: 3, z: -2 }
    ];

    for (let i = 0; i < settings.enemyCount; i++) {
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial.clone());
        enemy.position.set(positions[i].x, 0.4, positions[i].z);
        enemy.castShadow = true;
        enemy.health = settings.enemyHealth;
        enemy.lastAttackTime = 0;
        scene.add(enemy);
        enemies.push(enemy);
    }

    updateHealthUI();
}

// 아이템 관련 변수
let items = [];
const itemGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const itemMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffff00,
    emissiveIntensity: 0.3
});
const itemPickupDistance = 2.0;

// 인벤토리 시스템
let inventory = [];

// 무기 관련 변수
let weaponMesh = null;
const weaponGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16);
const weaponMaterial = new THREE.MeshStandardMaterial({
    color: 0x0066ff,
    emissive: 0x0033ff,
    emissiveIntensity: 0.2
});
let equippedWeapon = null;
let attackPower = 1;

// 열쇠 관련 변수
let keyMesh = null;
const keyGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
const keyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffaa00,
    emissiveIntensity: 0.4,
    metalness: 0.8
});

// 보물상자 관련 변수
let treasureMesh = null;
const treasureGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
const treasureMaterial = new THREE.MeshStandardMaterial({
    color: 0x9932cc,
    emissive: 0x6a0dad,
    emissiveIntensity: 0.3,
    metalness: 0.5
});

// 게임 상태
let hasKey = false;
let gameCleared = false;
let gameStarted = false;

// 게임 오브젝트 생성 함수
function createGameObjects() {
    // 아이템 생성
    items.forEach(item => scene.remove(item));
    items = [];

    const item1 = new THREE.Mesh(itemGeometry, itemMaterial.clone());
    item1.position.set(-2, 0.3, 2);
    item1.castShadow = true;
    item1.itemName = '황금 구슬';
    scene.add(item1);
    items.push(item1);

    const item2 = new THREE.Mesh(itemGeometry, itemMaterial.clone());
    item2.position.set(2, 0.3, -2);
    item2.castShadow = true;
    item2.itemName = '마법의 구슬';
    scene.add(item2);
    items.push(item2);

    // 무기 생성
    if (weaponMesh) scene.remove(weaponMesh);
    weaponMesh = new THREE.Mesh(weaponGeometry, weaponMaterial.clone());
    weaponMesh.position.set(0, 0.4, 3);
    weaponMesh.rotation.z = Math.PI / 2;
    weaponMesh.castShadow = true;
    weaponMesh.weaponName = '검';
    scene.add(weaponMesh);

    // 열쇠 생성
    if (keyMesh) scene.remove(keyMesh);
    keyMesh = new THREE.Mesh(keyGeometry, keyMaterial.clone());
    keyMesh.position.set(-4, 0.25, 0);
    keyMesh.rotation.x = Math.PI;
    keyMesh.castShadow = true;
    keyMesh.keyName = '금색 열쇠';
    scene.add(keyMesh);

    // 보물상자 생성
    if (treasureMesh) scene.remove(treasureMesh);
    treasureMesh = new THREE.Mesh(treasureGeometry, treasureMaterial.clone());
    treasureMesh.position.set(4, 0.6, 0);
    treasureMesh.castShadow = true;
    scene.add(treasureMesh);
}

// 체력 시스템
let playerHealth = 5;
const maxPlayerHealth = 5;
const enemyAttackDistance = 1.5; // 적이 공격할 수 있는 거리
const enemyAttackCooldown = 1000; // 1초마다 공격

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

// 체력바 업데이트 함수
function updateHealthUI() {
    const healthBoxes = document.querySelectorAll('#player-health .health-box');
    healthBoxes.forEach((box, index) => {
        if (index < playerHealth) {
            box.classList.remove('empty');
        } else {
            box.classList.add('empty');
        }
    });

    const enemyCount = enemies.length;
    document.getElementById('enemy-count').textContent = enemyCount;
}

// 인벤토리 UI 업데이트 함수
function updateInventoryUI() {
    const inventoryItems = document.getElementById('inventory-items');
    inventoryItems.innerHTML = '';

    if (inventory.length === 0) {
        inventoryItems.innerHTML = '<span style="color: #888;">비어있음</span>';
    } else {
        inventory.forEach((itemName) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.textContent = itemName;
            inventoryItems.appendChild(itemDiv);
        });
    }
}

// 무기 UI 업데이트 함수
function updateWeaponUI() {
    const weaponDisplay = document.getElementById('weapon-display');
    if (equippedWeapon) {
        weaponDisplay.innerHTML = `<span class="weapon-equipped">${equippedWeapon}</span>`;
    } else {
        weaponDisplay.textContent = '없음';
    }
}

// 아이템 습득 함수
function pickupItem() {
    const playerPos = controls.getObject().position;

    // 열쇠 습득 체크
    if (keyMesh && !hasKey) {
        const distance = playerPos.distanceTo(keyMesh.position);
        if (distance <= itemPickupDistance) {
            hasKey = true;
            scene.remove(keyMesh);
            inventory.push(keyMesh.keyName);
            updateInventoryUI();
            console.log(`${keyMesh.keyName} 습득! 보물상자를 열 수 있습니다!`);
            return;
        }
    }

    // 보물상자 상호작용 체크 (열쇠가 필요)
    if (treasureMesh && hasKey && !gameCleared) {
        const distance = playerPos.distanceTo(treasureMesh.position);
        if (distance <= itemPickupDistance) {
            gameCleared = true;
            showGameOver('게임 클리어!', true);
            controls.unlock();
            return;
        }
    }

    // 무기 습득 체크
    if (weaponMesh && !equippedWeapon) {
        const distance = playerPos.distanceTo(weaponMesh.position);
        if (distance <= itemPickupDistance) {
            equippedWeapon = weaponMesh.weaponName;
            attackPower = 1.5; // 공격력 1.5배
            scene.remove(weaponMesh);
            weapon = weaponMesh;
            updateWeaponUI();
            console.log(`${weaponMesh.weaponName} 습득! 공격력이 증가했습니다!`);
            return;
        }
    }

    // 가까운 아이템 찾기
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const distance = playerPos.distanceTo(item.position);

        if (distance <= itemPickupDistance) {
            // 아이템 습득
            inventory.push(item.itemName);
            scene.remove(item);
            items.splice(i, 1);
            updateInventoryUI();

            // 시각적 피드백 (콘솔)
            console.log(`${item.itemName} 습득!`);
            break; // 한 번에 하나씩만 습득
        }
    }
}

// 플레이어 공격 함수
function attackEnemy() {
    const playerPos = controls.getObject().position;
    const playerDirection = new THREE.Vector3(0, 0, -1);
    playerDirection.applyQuaternion(controls.getObject().quaternion);

    // 레이캐스터로 앞쪽의 적 감지
    const raycaster = new THREE.Raycaster(playerPos, playerDirection);
    const intersects = raycaster.intersectObjects(enemies);

    if (intersects.length > 0) {
        const hitEnemy = intersects[0].object;
        const distance = intersects[0].distance;

        // 공격 거리 체크 (3 유닛 이내)
        if (distance <= 3) {
            // 공격력 적용 (무기 장착 시 1.5배)
            hitEnemy.health -= attackPower;

            // 적이 죽었으면 제거
            if (hitEnemy.health <= 0) {
                scene.remove(hitEnemy);
                const index = enemies.indexOf(hitEnemy);
                if (index > -1) {
                    enemies.splice(index, 1);
                }
                updateHealthUI();

                // 모든 적을 처치하면 승리
                if (enemies.length === 0) {
                    setTimeout(() => {
                        showGameOver('승리!', true);
                    }, 100);
                }
            }

            // 시각적 피드백 (잠시 색 변경)
            hitEnemy.material.color.setHex(0xffaa00);
            setTimeout(() => {
                if (hitEnemy.health > 0) {
                    hitEnemy.material.color.setHex(0xff0000);
                }
            }, 100);
        }
    }
}

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

    // 아이템 그리기 (노란색 원)
    minimapCtx.fillStyle = '#ffd700';
    items.forEach((item) => {
        const itemMapX = centerX + (item.position.x * mapScale);
        const itemMapZ = centerY + (item.position.z * mapScale);
        minimapCtx.beginPath();
        minimapCtx.arc(itemMapX, itemMapZ, 4, 0, Math.PI * 2);
        minimapCtx.fill();
    });

    // 무기 그리기 (파란색 사각형)
    if (weaponMesh && !equippedWeapon) {
        const weaponMapX = centerX + (weaponMesh.position.x * mapScale);
        const weaponMapZ = centerY + (weaponMesh.position.z * mapScale);
        minimapCtx.fillStyle = '#0066ff';
        minimapCtx.fillRect(weaponMapX - 4, weaponMapZ - 4, 8, 8);
    }

    // 열쇠 그리기 (황금색 삼각형)
    if (keyMesh && !hasKey) {
        const keyMapX = centerX + (keyMesh.position.x * mapScale);
        const keyMapZ = centerY + (keyMesh.position.z * mapScale);
        minimapCtx.fillStyle = '#ffd700';
        minimapCtx.beginPath();
        minimapCtx.moveTo(keyMapX, keyMapZ - 5); // 위쪽 꼭짓점
        minimapCtx.lineTo(keyMapX - 4, keyMapZ + 3); // 왼쪽 아래
        minimapCtx.lineTo(keyMapX + 4, keyMapZ + 3); // 오른쪽 아래
        minimapCtx.closePath();
        minimapCtx.fill();
    }

    // 보물상자 그리기 (보라색 사각형)
    if (treasureMesh && !gameCleared) {
        const treasureMapX = centerX + (treasureMesh.position.x * mapScale);
        const treasureMapZ = centerY + (treasureMesh.position.z * mapScale);
        minimapCtx.fillStyle = '#9932cc';
        minimapCtx.fillRect(treasureMapX - 6, treasureMapZ - 6, 12, 12);
    }

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
        case 'Space':
            event.preventDefault();
            if (controls.isLocked) {
                attackEnemy();
            }
            break;
        case 'KeyE':
            if (controls.isLocked) {
                pickupItem();
            }
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

    // 아이템 떠다니는 효과
    items.forEach((item) => {
        item.position.y = 0.3 + Math.sin(time * 0.002) * 0.1;
        item.rotation.y += 0.02;
    });

    // 무기 떠다니는 효과
    if (weaponMesh && !equippedWeapon) {
        weaponMesh.position.y = 0.4 + Math.sin(time * 0.003) * 0.1;
        weaponMesh.rotation.y += 0.01;
    }

    // 열쇠 떠다니는 효과
    if (keyMesh && !hasKey) {
        keyMesh.position.y = 0.25 + Math.sin(time * 0.0025) * 0.15;
        keyMesh.rotation.y += 0.015;
    }

    // 보물상자 빛나는 효과
    if (treasureMesh && !gameCleared) {
        treasureMesh.rotation.y += 0.005;
        // 보물상자 발광 효과
        const glowIntensity = 0.3 + Math.sin(time * 0.002) * 0.2;
        treasureMesh.material.emissiveIntensity = glowIntensity;
    }

    // 적 AI - 플레이어를 향해 이동 및 공격 (게임이 시작되고 클리어되지 않았을 때만)
    if (gameStarted && !gameCleared) {
        const playerPos = controls.getObject().position;
        enemies.forEach((enemy) => {
            // 플레이어 방향 계산
            const direction = new THREE.Vector3();
            direction.subVectors(playerPos, enemy.position);
            direction.y = 0; // Y축 이동 방지 (같은 높이 유지)

            // 플레이어와의 거리 계산
            const distanceToPlayer = direction.length();
            direction.normalize();

            // 플레이어 공격 (일정 거리 이내일 때)
            if (distanceToPlayer <= enemyAttackDistance) {
                if (time - enemy.lastAttackTime >= enemyAttackCooldown) {
                    playerHealth -= 1;
                    enemy.lastAttackTime = time;
                    updateHealthUI();

                    // 플레이어 체력이 0이 되면 게임 오버
                    if (playerHealth <= 0) {
                        showGameOver('게임 오버!', false);
                        controls.unlock();
                    }
                }
            } else {
                // 공격 범위 밖이면 플레이어를 향해 이동
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
            }

            // 적이 플레이어를 향하도록 회전
            enemy.rotation.y += 0.02;
        });
    }

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

// 게임오버/승리 모달 표시 함수
function showGameOver(message, isVictory) {
    gameCleared = true;
    const modal = document.getElementById('game-over-modal');
    const titleElement = document.getElementById('game-over-text');

    titleElement.textContent = message;
    if (isVictory) {
        titleElement.classList.add('victory');
    } else {
        titleElement.classList.remove('victory');
    }

    modal.classList.remove('hidden');
}

// 게임 시작 함수 (난이도 선택 시 호출)
window.startGame = function(difficulty) {
    currentDifficulty = difficulty;

    // 난이도 선택 모달 숨기기
    document.getElementById('difficulty-modal').classList.add('hidden');

    // 게임 상태 초기화
    playerHealth = maxPlayerHealth;
    inventory = [];
    equippedWeapon = null;
    attackPower = 1;
    hasKey = false;
    gameCleared = false;
    gameStarted = true;

    // 플레이어 위치 초기화
    controls.getObject().position.set(0, 1.6, 0);

    // 게임 오브젝트 생성
    createGameObjects();
    createEnemies(difficulty);

    // UI 업데이트
    updateHealthUI();
    updateInventoryUI();
    updateWeaponUI();
};

// 게임 재시작 함수
window.restartGame = function() {
    // 게임오버 모달 숨기기
    document.getElementById('game-over-modal').classList.add('hidden');

    // 난이도 선택 모달 표시
    document.getElementById('difficulty-modal').classList.remove('hidden');

    // 게임 상태 초기화
    gameStarted = false;
    gameCleared = false;
};

// 게임 시작 시 UI 초기화 (처음에는 난이도 선택 모달만 표시)
updateHealthUI();
updateInventoryUI();
updateWeaponUI();

animate();

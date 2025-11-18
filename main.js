import * as THREE from 'three';

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

// 지형 생성 (마인크래프트 스타일 블록)
const terrainTiles = [];
const tileSize = 2;
const tilesPerSide = 5;
const blockHeight = 0.5; // 각 블록의 높이

// 높이 맵 정의 (각 위치의 블록 개수)
const heightMap = [
    [0, 0, 1, 0, 0],
    [0, 1, 2, 1, 0],
    [1, 2, 3, 2, 1],
    [0, 1, 2, 1, 0],
    [0, 0, 1, 0, 0]
];

// 블록 재질 생성 (면마다 다른 색상)
function createBlockMaterials(isTopBlock) {
    // 6개 면: right, left, top, bottom, front, back
    const grassTop = new THREE.MeshStandardMaterial({
        color: 0x4caf50, // 초록색 풀
        roughness: 0.8
    });
    const dirt = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // 갈색 흙
        roughness: 0.9
    });

    if (isTopBlock) {
        // 가장 위 블록: 윗면 초록색, 측면 갈색
        return [
            dirt,      // right
            dirt,      // left
            grassTop,  // top (초록색)
            dirt,      // bottom
            dirt,      // front
            dirt       // back
        ];
    } else {
        // 중간 블록: 모든 면 갈색
        return [
            dirt,      // right
            dirt,      // left
            dirt,      // top
            dirt,      // bottom
            dirt,      // front
            dirt       // back
        ];
    }
}

// 지형 블록 생성
for (let x = 0; x < tilesPerSide; x++) {
    for (let z = 0; z < tilesPerSide; z++) {
        const numBlocks = heightMap[z][x];

        // 타일 위치 계산 (중심을 원점으로)
        const offsetX = (x - tilesPerSide / 2 + 0.5) * tileSize;
        const offsetZ = (z - tilesPerSide / 2 + 0.5) * tileSize;

        // 해당 위치에 블록 쌓기
        for (let h = 0; h < numBlocks; h++) {
            const blockY = h * blockHeight;
            const isTopBlock = (h === numBlocks - 1);

            const blockGeometry = new THREE.BoxGeometry(tileSize, blockHeight, tileSize);
            const blockMaterials = createBlockMaterials(isTopBlock);
            const block = new THREE.Mesh(blockGeometry, blockMaterials);

            block.position.set(offsetX, blockY + blockHeight / 2, offsetZ);
            block.receiveShadow = true;
            block.castShadow = true;

            // 최상단 블록에만 높이 정보 저장
            if (isTopBlock) {
                block.userData.height = blockY + blockHeight;
                block.userData.minX = offsetX - tileSize / 2;
                block.userData.maxX = offsetX + tileSize / 2;
                block.userData.minZ = offsetZ - tileSize / 2;
                block.userData.maxZ = offsetZ + tileSize / 2;
                terrainTiles.push(block);
            }

            scene.add(block);
        }
    }
}

// 지형 높이 가져오기 함수
function getTerrainHeight(x, z) {
    for (const tile of terrainTiles) {
        if (x >= tile.userData.minX && x <= tile.userData.maxX &&
            z >= tile.userData.minZ && z <= tile.userData.maxZ) {
            return tile.userData.height; // 블록 위
        }
    }
    return 0; // 기본 높이
}

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
const enemySpeed = 0.8; // 적 이동 속도 감소

// 마인크래프트 스타일 적 캐릭터 생성 함수
function createEnemyCharacter() {
    const enemy = new THREE.Group();

    // 재질 정의
    const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const darkRedMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000 });

    // 머리 (0.4 x 0.4 x 0.4)
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.4),
        redMaterial
    );
    head.position.y = 0.6;
    head.castShadow = true;
    enemy.add(head);

    // 몸통 (0.4 x 0.6 x 0.3)
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.6, 0.3),
        darkRedMaterial
    );
    body.position.y = 0.1;
    body.castShadow = true;
    enemy.add(body);

    // 왼쪽 팔 (0.2 x 0.5 x 0.2)
    const leftArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        redMaterial
    );
    leftArm.position.set(-0.3, 0.15, 0);
    leftArm.castShadow = true;
    enemy.add(leftArm);

    // 오른쪽 팔 (0.2 x 0.5 x 0.2)
    const rightArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        redMaterial
    );
    rightArm.position.set(0.3, 0.15, 0);
    rightArm.castShadow = true;
    enemy.add(rightArm);

    // 왼쪽 다리 (0.2 x 0.5 x 0.2)
    const leftLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        darkRedMaterial
    );
    leftLeg.position.set(-0.1, -0.45, 0);
    leftLeg.castShadow = true;
    enemy.add(leftLeg);

    // 오른쪽 다리 (0.2 x 0.5 x 0.2)
    const rightLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        darkRedMaterial
    );
    rightLeg.position.set(0.1, -0.45, 0);
    rightLeg.castShadow = true;
    enemy.add(rightLeg);

    // 애니메이션용 부위 저장
    enemy.userData.leftArm = leftArm;
    enemy.userData.rightArm = rightArm;
    enemy.userData.leftLeg = leftLeg;
    enemy.userData.rightLeg = rightLeg;

    return enemy;
}

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
        const enemy = createEnemyCharacter();
        enemy.position.set(positions[i].x, 0.4, positions[i].z);
        enemy.health = settings.enemyHealth;
        enemy.lastAttackTime = 0;
        enemy.userData.walkCycle = 0; // 걷기 애니메이션용
        scene.add(enemy);
        enemies.push(enemy);
    }

    updateHealthUI();
}

// 아이템 관련 변수
let items = [];
const itemPickupDistance = 2.0;

// 인벤토리 시스템
let inventory = [];

// 마인크래프트 스타일 황금 코인 생성 함수
function createGoldenCoin() {
    const coin = new THREE.Group();

    // 코인 본체 (얇은 원통)
    const coinBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    coinBody.castShadow = true;
    coin.add(coinBody);

    // 코인 테두리 강조
    const coinRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.03, 8, 16),
        new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            metalness: 0.9,
            roughness: 0.1
        })
    );
    coinRim.rotation.x = Math.PI / 2;
    coinRim.castShadow = true;
    coin.add(coinRim);

    return coin;
}

// 무기 관련 변수
let weaponMesh = null;
let equippedWeapon = null;
let attackPower = 1;
let playerWeaponMesh = null; // 플레이어가 들고 있는 검
let isAttacking = false; // 공격 애니메이션 중인지 여부

// 마인크래프트 스타일 검 생성 함수
function createSword() {
    const sword = new THREE.Group();

    // 검날 (은색, 긴 박스)
    const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.6, 0.02),
        new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    blade.position.y = 0.3;
    blade.castShadow = true;
    sword.add(blade);

    // 가드 (금색 십자가)
    const guard = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.05, 0.05),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.6,
            roughness: 0.4
        })
    );
    guard.position.y = 0;
    guard.castShadow = true;
    sword.add(guard);

    // 손잡이 (갈색)
    const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.25, 0.06),
        new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8
        })
    );
    handle.position.y = -0.125;
    handle.castShadow = true;
    sword.add(handle);

    // 손잡이 끝 (금색)
    const pommel = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.08, 0.1),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.6,
            roughness: 0.4
        })
    );
    pommel.position.y = -0.29;
    pommel.castShadow = true;
    sword.add(pommel);

    return sword;
}

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

// 마인크래프트 스타일 보물상자 생성 함수
function createTreasureChest() {
    const chest = new THREE.Group();

    // 상자 하단 (갈색 나무)
    const chestBottom = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.6, 0.7),
        new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8
        })
    );
    chestBottom.position.y = -0.2;
    chestBottom.castShadow = true;
    chest.add(chestBottom);

    // 상자 상단 뚜껑 (갈색 나무)
    const chestTop = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.4, 0.7),
        new THREE.MeshStandardMaterial({
            color: 0xa0522d,
            roughness: 0.8
        })
    );
    chestTop.position.y = 0.3;
    chestTop.castShadow = true;
    chest.add(chestTop);

    // 금속 띠 (앞면)
    const metalBand1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.1, 0.05),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.2
        })
    );
    metalBand1.position.set(0, 0, 0.37);
    metalBand1.castShadow = true;
    chest.add(metalBand1);

    // 금속 띠 (뒷면)
    const metalBand2 = metalBand1.clone();
    metalBand2.position.z = -0.37;
    chest.add(metalBand2);

    // 자물쇠 (금색)
    const lock = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.25, 0.15),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
            metalness: 0.9,
            roughness: 0.2
        })
    );
    lock.position.set(0, 0.1, 0.42);
    lock.castShadow = true;
    chest.add(lock);

    return chest;
}

// 게임 상태
let hasKey = false;
let gameCleared = false;
let gameStarted = false;

// 게임 오브젝트 생성 함수
function createGameObjects() {
    // 아이템 생성
    items.forEach(item => scene.remove(item));
    items = [];

    const item1 = createGoldenCoin();
    item1.position.set(-2, 0.3, 2);
    item1.itemName = '황금 코인';
    scene.add(item1);
    items.push(item1);

    const item2 = createGoldenCoin();
    item2.position.set(2, 0.3, -2);
    item2.itemName = '황금 코인';
    scene.add(item2);
    items.push(item2);

    // 무기 생성
    if (weaponMesh) scene.remove(weaponMesh);
    weaponMesh = createSword();
    weaponMesh.position.set(0, 0.4, 3);
    weaponMesh.rotation.z = Math.PI / 2; // 누워있는 상태
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
    treasureMesh = createTreasureChest();
    treasureMesh.position.set(4, 0.6, 0);
    scene.add(treasureMesh);
}

// 체력 시스템
let playerHealth = 5;
const maxPlayerHealth = 5;
const enemyAttackDistance = 0.8; // 적이 공격할 수 있는 거리 (더 짧게 조정)
const enemyAttackCooldown = 1000; // 1초마다 공격

// 플레이어 위치 및 방향 관리
const playerPosition = new THREE.Vector3(0, 1.6, 0);
let playerRotation = 0; // Y축 회전 (라디안)
let playerVelocityY = 0; // Y축 속도 (점프/낙하)
let isOnGround = false; // 지면에 있는지 여부

// 점프 관련 상수
const gravity = -15; // 중력 가속도
const jumpSpeed = 6; // 점프 속도
const playerEyeHeight = 1.6; // 플레이어 눈 높이

// 카메라 위치 업데이트 함수 (1인칭 시점)
function updateCameraPosition() {
    // 카메라를 플레이어 위치에 배치
    camera.position.copy(playerPosition);
    camera.rotation.y = playerRotation;
}

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
    // 열쇠 습득 체크
    if (keyMesh && !hasKey) {
        const distance = playerPosition.distanceTo(keyMesh.position);
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
        const distance = playerPosition.distanceTo(treasureMesh.position);
        if (distance <= itemPickupDistance) {
            gameCleared = true;
            showGameOver('게임 클리어!', true);
            return;
        }
    }

    // 무기 습득 체크
    if (weaponMesh && !equippedWeapon) {
        const distance = playerPosition.distanceTo(weaponMesh.position);
        if (distance <= itemPickupDistance) {
            equippedWeapon = weaponMesh.weaponName;
            attackPower = 1.5; // 공격력 1.5배
            scene.remove(weaponMesh);

            // 플레이어 손에 검 추가
            playerWeaponMesh = createSword();
            playerWeaponMesh.position.set(0.3, -0.3, -0.5); // 카메라 기준 오른쪽 아래 앞
            playerWeaponMesh.rotation.set(0, 0, Math.PI / 4); // 45도 기울임
            playerWeaponMesh.scale.set(0.8, 0.8, 0.8); // 약간 작게
            camera.add(playerWeaponMesh);

            updateWeaponUI();
            console.log(`${weaponMesh.weaponName} 습득! 공격력이 증가했습니다!`);
            return;
        }
    }

    // 가까운 아이템 찾기
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const distance = playerPosition.distanceTo(item.position);

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
    if (isAttacking) return; // 이미 공격 중이면 무시

    // 검 휘두르기 애니메이션
    if (playerWeaponMesh) {
        isAttacking = true;
        const originalRotationX = playerWeaponMesh.rotation.x;
        const swingDuration = 200; // 200ms
        const swingAngle = Math.PI / 2; // 90도 회전
        const startTime = Date.now();

        const swingAnimation = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / swingDuration, 1);

            if (progress < 0.5) {
                // 전반부: 검을 뒤로 당김
                playerWeaponMesh.rotation.x = originalRotationX - swingAngle * (progress * 2);
            } else {
                // 후반부: 검을 앞으로 휘두름
                playerWeaponMesh.rotation.x = originalRotationX - swingAngle + swingAngle * ((progress - 0.5) * 2);
            }

            if (progress < 1) {
                requestAnimationFrame(swingAnimation);
            } else {
                playerWeaponMesh.rotation.x = originalRotationX;
                isAttacking = false;
            }
        };

        swingAnimation();
    }

    // 플레이어가 바라보는 방향 계산
    const playerDirection = new THREE.Vector3(
        Math.sin(playerRotation),
        0,
        Math.cos(playerRotation)
    );
    playerDirection.normalize();

    // 레이캐스터로 앞쪽의 적 감지
    const raycaster = new THREE.Raycaster(playerPosition, playerDirection);
    const intersects = raycaster.intersectObjects(enemies);

    if (intersects.length > 0) {
        const hitEnemy = intersects[0].object;
        const distance = intersects[0].distance;

        // 공격 거리 체크 (3 유닛 이내)
        if (distance <= 3) {
            // 공격력 적용 (무기 장착 시 1.5배)
            hitEnemy.health -= attackPower;
            console.log(`적 공격! 남은 체력: ${hitEnemy.health}`);

            // 적이 죽었으면 제거
            if (hitEnemy.health <= 0) {
                scene.remove(hitEnemy);
                const index = enemies.indexOf(hitEnemy);
                if (index > -1) {
                    enemies.splice(index, 1);
                }
                updateHealthUI();
                console.log('적 처치!');

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
    const lookDirectionX = Math.sin(playerRotation);
    const lookDirectionZ = Math.cos(playerRotation);

    minimapCtx.strokeStyle = '#ff0000';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(playerMapX, playerMapZ);
    minimapCtx.lineTo(
        playerMapX + lookDirectionX * 15,
        playerMapZ + lookDirectionZ * 15
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
    if (!gameStarted || gameCleared) return;

    switch (event.code) {
        case 'ArrowUp':
            keys.forward = true;
            break;
        case 'ArrowDown':
            keys.backward = true;
            break;
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'Space':
            event.preventDefault();
            // 지면에 있을 때만 점프 가능
            if (isOnGround) {
                playerVelocityY = jumpSpeed;
                isOnGround = false;
            }
            break;
        case 'KeyA':
            event.preventDefault();
            attackEnemy();
            break;
        case 'KeyE':
            pickupItem();
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
            keys.forward = false;
            break;
        case 'ArrowDown':
            keys.backward = false;
            break;
        case 'ArrowLeft':
            keys.left = false;
            break;
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
        // 보물상자 위아래 떠다니는 효과
        treasureMesh.position.y = 0.6 + Math.sin(time * 0.002) * 0.05;
    }

    // 적 AI - 플레이어를 향해 이동 및 공격 (게임이 시작되고 클리어되지 않았을 때만)
    if (gameStarted && !gameCleared) {
        enemies.forEach((enemy) => {
            // 플레이어 방향 계산
            const direction = new THREE.Vector3();
            direction.subVectors(playerPosition, enemy.position);
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

                // 걷기 애니메이션 (팔다리 흔들기)
                enemy.userData.walkCycle += delta * 5; // 걷기 주기
                const swing = Math.sin(enemy.userData.walkCycle) * 0.3;

                if (enemy.userData.leftArm) {
                    enemy.userData.leftArm.rotation.x = swing;
                    enemy.userData.rightArm.rotation.x = -swing;
                    enemy.userData.leftLeg.rotation.x = -swing;
                    enemy.userData.rightLeg.rotation.x = swing;
                }
            }

            // 적이 플레이어를 향하도록 회전
            const targetRotation = Math.atan2(direction.x, direction.z);
            enemy.rotation.y = targetRotation;
        });
    }

    // 플레이어 이동 및 회전 (게임 시작 시에만)
    if (gameStarted && !gameCleared) {
        // 화살표 키에 따라 이동 방향과 회전 설정
        let moveX = 0;
        let moveZ = 0;

        if (keys.forward) {
            moveZ = -moveSpeed * delta;
            playerRotation = Math.PI; // 위쪽(북쪽)을 바라봄
        }
        if (keys.backward) {
            moveZ = moveSpeed * delta;
            playerRotation = 0; // 아래쪽(남쪽)을 바라봄
        }
        if (keys.left) {
            moveX = -moveSpeed * delta;
            playerRotation = Math.PI / 2; // 왼쪽(서쪽)을 바라봄
        }
        if (keys.right) {
            moveX = moveSpeed * delta;
            playerRotation = -Math.PI / 2; // 오른쪽(동쪽)을 바라봄
        }

        // 새 위치 계산
        const newX = playerPosition.x + moveX;
        const newZ = playerPosition.z + moveZ;

        // 경계 체크하며 이동
        if (newX >= roomBounds.minX && newX <= roomBounds.maxX) {
            playerPosition.x = newX;
        }
        if (newZ >= roomBounds.minZ && newZ <= roomBounds.maxZ) {
            playerPosition.z = newZ;
        }

        // 중력 적용
        playerVelocityY += gravity * delta;

        // Y축 이동
        playerPosition.y += playerVelocityY * delta;

        // 현재 위치의 지형 높이 가져오기
        const terrainHeight = getTerrainHeight(playerPosition.x, playerPosition.z);
        const groundLevel = terrainHeight + playerEyeHeight;

        // 지면 충돌 체크
        if (playerPosition.y <= groundLevel) {
            playerPosition.y = groundLevel;
            playerVelocityY = 0;
            isOnGround = true;
        } else {
            isOnGround = false;
        }

        // 카메라 위치 업데이트
        updateCameraPosition();
    }

    prevTime = time;
    renderer.render(scene, camera);

    // 미니맵 업데이트
    drawMinimap(playerPosition.x, playerPosition.z);
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

    // 플레이어가 들고 있던 검 제거
    if (playerWeaponMesh) {
        camera.remove(playerWeaponMesh);
        playerWeaponMesh = null;
    }
    isAttacking = false;

    // 플레이어 위치 및 방향 초기화
    const startX = 0;
    const startZ = 0;
    const terrainHeight = getTerrainHeight(startX, startZ);
    playerPosition.set(startX, terrainHeight + playerEyeHeight, startZ);
    playerRotation = 0;
    playerVelocityY = 0;
    isOnGround = true;
    updateCameraPosition();

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

    // 플레이어가 들고 있던 검 제거
    if (playerWeaponMesh) {
        camera.remove(playerWeaponMesh);
        playerWeaponMesh = null;
    }
    isAttacking = false;

    // 게임 상태 초기화
    gameStarted = false;
    gameCleared = false;
};

// 게임 시작 시 UI 초기화 (처음에는 난이도 선택 모달만 표시)
updateHealthUI();
updateInventoryUI();
updateWeaponUI();

// 초기 카메라 위치 설정
updateCameraPosition();

animate();

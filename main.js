import * as THREE from 'three';

// Scene, Camera, Renderer 초기화
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // 하늘색 배경

// 게임 컨테이너 가져오기
const gameContainer = document.getElementById('game-container');
const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight; // 전체 화면

const camera = new THREE.PerspectiveCamera(
    90,  // 시야각을 90도로 넓게 변경
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
const blockHeight = 0.5; // 각 블록의 높이
const blockSize = 2; // 각 블록의 크기

// 언덕 색상 정의
const hillColors = [
    { top: 0x4caf50, side: 0x8b4513 },   // 초록-갈색
    { top: 0x9e9e9e, side: 0x616161 },   // 회색 돌
    { top: 0xffeb3b, side: 0xfbc02d },   // 노랑색 모래
    { top: 0x795548, side: 0x5d4037 },   // 갈색 나무
];

// 블록 재질 생성 함수
function createBlockMaterials(isTopBlock, colorIndex) {
    const colors = hillColors[colorIndex % hillColors.length];

    const topMaterial = new THREE.MeshStandardMaterial({
        color: colors.top,
        roughness: 0.8
    });
    const sideMaterial = new THREE.MeshStandardMaterial({
        color: colors.side,
        roughness: 0.9
    });

    if (isTopBlock) {
        return [sideMaterial, sideMaterial, topMaterial, sideMaterial, sideMaterial, sideMaterial];
    } else {
        return [sideMaterial, sideMaterial, sideMaterial, sideMaterial, sideMaterial, sideMaterial];
    }
}

// 언덕 정의 (위치와 높이) - 마인크래프트식 블록 무더기
const hills = [
    { x: -12, z: -12, height: 7, colorIndex: 0, size: 3 },  // 왼쪽 위 - 초록 - 3x3
    { x: 12, z: -12, height: 5, colorIndex: 1, size: 2 },   // 오른쪽 위 - 회색 - 2x2
    { x: -12, z: 12, height: 6, colorIndex: 2, size: 3 },   // 왼쪽 아래 - 노랑 - 3x3
    { x: 12, z: 12, height: 7, colorIndex: 3, size: 2 },    // 오른쪽 아래 - 갈색 - 2x2
    { x: 0, z: -12, height: 5, colorIndex: 0, size: 2 },    // 위 중앙 - 초록 - 2x2
];

// 마인크래프트식 언덕 블록 생성 (무더기처럼 쌓기)
hills.forEach(hill => {
    // 각 층마다 블록 생성
    for (let h = 0; h < hill.height; h++) {
        const blockY = h * blockHeight;
        const isTopBlock = (h === hill.height - 1);

        // 층이 올라갈수록 크기가 작아지는 피라미드 형태
        const layerSize = Math.max(1, hill.size - Math.floor(h / 2));
        const offset = (hill.size - layerSize) * blockSize / 2;

        // 해당 층의 블록들 생성
        for (let x = 0; x < layerSize; x++) {
            for (let z = 0; z < layerSize; z++) {
                const blockGeometry = new THREE.BoxGeometry(blockSize, blockHeight, blockSize);
                const blockMaterials = createBlockMaterials(isTopBlock && x === Math.floor(layerSize/2) && z === Math.floor(layerSize/2), hill.colorIndex);
                const block = new THREE.Mesh(blockGeometry, blockMaterials);

                const posX = hill.x + (x - layerSize/2 + 0.5) * blockSize;
                const posZ = hill.z + (z - layerSize/2 + 0.5) * blockSize;

                block.position.set(posX, blockY + blockHeight / 2, posZ);
                block.receiveShadow = true;
                block.castShadow = true;

                // 모든 블록에 충돌 감지 데이터 저장
                block.userData.isHill = true;
                block.userData.height = blockY + blockHeight;
                block.userData.minX = posX - blockSize / 2;
                block.userData.maxX = posX + blockSize / 2;
                block.userData.minZ = posZ - blockSize / 2;
                block.userData.maxZ = posZ + blockSize / 2;
                terrainTiles.push(block);

                scene.add(block);
            }
        }
    }
});

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
const roomSize = 30; // 맵 크기 확대

// 바닥 생성 (풀밭)
const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a8f3a, // 진한 초록색 풀
    roughness: 0.9
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // 수평으로 회전
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

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

// 플레이어 캐릭터
let playerCharacter = null;

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

// 마인크래프트 스타일 플레이어 캐릭터 생성 함수
function createPlayerCharacter() {
    const player = new THREE.Group();

    // 재질 정의
    const blueMaterial = new THREE.MeshStandardMaterial({ color: 0x3366ff });
    const darkBlueMaterial = new THREE.MeshStandardMaterial({ color: 0x2255ee });
    const lightBlueMaterial = new THREE.MeshStandardMaterial({ color: 0x1144dd });

    // 머리 (0.4 x 0.4 x 0.4)
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.4),
        blueMaterial
    );
    head.position.y = 0.6;
    head.castShadow = true;
    player.add(head);

    // 몸통 (0.4 x 0.6 x 0.3)
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.6, 0.3),
        darkBlueMaterial
    );
    body.position.y = 0.1;
    body.castShadow = true;
    player.add(body);

    // 왼쪽 팔 (0.2 x 0.5 x 0.2)
    const leftArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        lightBlueMaterial
    );
    leftArm.position.set(-0.3, 0.15, 0);
    leftArm.castShadow = true;
    player.add(leftArm);

    // 오른쪽 팔 (0.2 x 0.5 x 0.2)
    const rightArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        lightBlueMaterial
    );
    rightArm.position.set(0.3, 0.15, 0);
    rightArm.castShadow = true;
    player.add(rightArm);

    // 왼쪽 다리 (0.2 x 0.5 x 0.2)
    const leftLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        lightBlueMaterial
    );
    leftLeg.position.set(-0.1, -0.45, 0);
    leftLeg.castShadow = true;
    player.add(leftLeg);

    // 오른쪽 다리 (0.2 x 0.5 x 0.2)
    const rightLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        lightBlueMaterial
    );
    rightLeg.position.set(0.1, -0.45, 0);
    rightLeg.castShadow = true;
    player.add(rightLeg);

    // 애니메이션용 부위 저장
    player.userData.leftArm = leftArm;
    player.userData.rightArm = rightArm;
    player.userData.leftLeg = leftLeg;
    player.userData.rightLeg = rightLeg;
    player.userData.walkCycle = 0;

    return player;
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
        { x: -8, z: -8 },
        { x: 8, z: 6 },
        { x: -8, z: 8 },
        { x: 8, z: -6 }
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
            emissive: 0xffd700,
            emissiveIntensity: 0.5,
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

// 마인크래프트 스타일 수정 생성 함수
function createCrystal() {
    const crystal = new THREE.Group();

    const crystalMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9
    });

    // 중앙 크리스탈 (팔각형 기둥)
    const mainCrystal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8),
        crystalMaterial
    );
    mainCrystal.castShadow = true;
    crystal.add(mainCrystal);

    // 상단 뾰족한 부분
    const topPyramid = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.3, 8),
        crystalMaterial
    );
    topPyramid.position.y = 0.45;
    topPyramid.castShadow = true;
    crystal.add(topPyramid);

    // 하단 뾰족한 부분
    const bottomPyramid = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.2, 8),
        crystalMaterial
    );
    bottomPyramid.position.y = -0.4;
    bottomPyramid.rotation.z = Math.PI;
    bottomPyramid.castShadow = true;
    crystal.add(bottomPyramid);

    return crystal;
}

// 마인크래프트 스타일 요술지팡이 생성 함수
function createMagicWand() {
    const wand = new THREE.Group();

    // 지팡이 손잡이 (갈색 나무)
    const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
        new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9
        })
    );
    handle.castShadow = true;
    wand.add(handle);

    // 상단 보석 (보라색)
    const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({
            color: 0x9b59b6,
            emissive: 0x9b59b6,
            emissiveIntensity: 0.5,
            metalness: 0.3,
            roughness: 0.2
        })
    );
    gem.position.y = 0.35;
    gem.castShadow = true;
    wand.add(gem);

    // 보석 주변 작은 별들
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const star = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.03, 0.03),
            new THREE.MeshBasicMaterial({
                color: 0xffff00
            })
        );
        star.position.set(
            Math.cos(angle) * 0.15,
            0.35 + Math.sin(angle) * 0.15,
            Math.sin(angle) * 0.15
        );
        star.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        wand.add(star);
    }

    return wand;
}

// 특수 효과 관련 변수
let goldenParticles = null;
let sunMesh = null;
let moonMesh = null;
let stars = null;
let clouds = [];
let hasUsedCoin = false;
let hasUsedCrystal = false;
let hasUsedWand = false;

// 황금 파티클 생성 함수
function createGoldenParticles() {
    const particleCount = 3000;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * roomSize;
        positions[i * 3 + 1] = 0.05;
        positions[i * 3 + 2] = (Math.random() - 0.5) * roomSize;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5
    });

    return new THREE.Points(geometry, material);
}

// 태양 생성 함수
function createSun() {
    const sun = new THREE.Group();

    // 태양 본체
    const sunBody = new THREE.Mesh(
        new THREE.SphereGeometry(3, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 1
        })
    );
    sun.add(sunBody);

    // 태양 광채 (더 큰 반투명 구)
    const sunGlow = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0xffdd00,
            transparent: true,
            opacity: 0.3
        })
    );
    sun.add(sunGlow);

    sun.position.set(15, 20, -15);

    return sun;
}

// 달 생성 함수
function createMoon() {
    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0xf0f0f0,
            emissive: 0xcccccc,
            emissiveIntensity: 0.5
        })
    );
    moon.position.set(-15, 25, -15);
    return moon;
}

// 별들 생성 함수
function createStars() {
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = Math.random() * 30 + 15;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.9
    });

    return new THREE.Points(geometry, material);
}

// 구름 생성 함수
function createCloud() {
    const cloud = new THREE.Group();

    // 여러 개의 구를 조합하여 구름 만들기
    for (let i = 0; i < 5; i++) {
        const puff = new THREE.Mesh(
            new THREE.SphereGeometry(0.8 + Math.random() * 0.4, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            })
        );
        puff.position.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        cloud.add(puff);
    }

    return cloud;
}

// 여러 구름 생성 함수
function createClouds() {
    const cloudArray = [];
    for (let i = 0; i < 8; i++) {
        const cloud = createCloud();
        cloud.position.set(
            (Math.random() - 0.5) * 40,
            15 + Math.random() * 5,
            (Math.random() - 0.5) * 40
        );
        cloud.userData.speed = 0.5 + Math.random() * 0.5;
        cloudArray.push(cloud);
        scene.add(cloud);
    }
    return cloudArray;
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

    // 검날 (은색, 긴 박스) - BasicMaterial로 변경하여 조명 없이도 보이게
    const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.6, 0.02),
        new THREE.MeshBasicMaterial({
            color: 0xcccccc
        })
    );
    blade.position.y = 0.3;
    sword.add(blade);

    // 가드 (금색 십자가)
    const guard = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.05, 0.05),
        new THREE.MeshBasicMaterial({
            color: 0xffd700
        })
    );
    guard.position.y = 0;
    sword.add(guard);

    // 손잡이 (갈색)
    const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.25, 0.06),
        new THREE.MeshBasicMaterial({
            color: 0x8b4513
        })
    );
    handle.position.y = -0.125;
    sword.add(handle);

    // 손잡이 끝 (금색)
    const pommel = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.08, 0.1),
        new THREE.MeshBasicMaterial({
            color: 0xffd700
        })
    );
    pommel.position.y = -0.29;
    sword.add(pommel);

    return sword;
}

// 열쇠 관련 변수
let keyMesh = null;

// 마인크래프트 스타일 황금 열쇠 생성 함수
function createGoldenKey() {
    const key = new THREE.Group();

    const keyMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 0.4,
        metalness: 0.8,
        roughness: 0.2
    });

    // 손잡이 (원형 고리)
    const handleRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.04, 8, 16),
        keyMaterial
    );
    handleRing.rotation.y = Math.PI / 2;
    handleRing.castShadow = true;
    key.add(handleRing);

    // 목 부분 (긴 막대)
    const shaft = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.5, 0.06),
        keyMaterial
    );
    shaft.position.set(0, -0.35, 0);
    shaft.castShadow = true;
    key.add(shaft);

    // 머리 부분 (이빨)
    const keyHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.08, 0.06),
        keyMaterial
    );
    keyHead.position.set(0, -0.6, 0);
    keyHead.castShadow = true;
    key.add(keyHead);

    // 이빨 1
    const tooth1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.12, 0.06),
        keyMaterial
    );
    tooth1.position.set(-0.08, -0.66, 0);
    tooth1.castShadow = true;
    key.add(tooth1);

    // 이빨 2
    const tooth2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.08, 0.06),
        keyMaterial
    );
    tooth2.position.set(0.08, -0.68, 0);
    tooth2.castShadow = true;
    key.add(tooth2);

    return key;
}

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
    item1.position.set(-6, 0.3, 6);
    item1.itemName = '황금 코인';
    scene.add(item1);
    items.push(item1);

    const item2 = createCrystal();
    item2.position.set(6, 0.3, -6);
    item2.itemName = '마법 수정';
    scene.add(item2);
    items.push(item2);

    const item3 = createMagicWand();
    item3.position.set(0, 0.3, -10);
    item3.itemName = '요술지팡이';
    scene.add(item3);
    items.push(item3);

    // 무기 생성
    if (weaponMesh) scene.remove(weaponMesh);
    weaponMesh = createSword();
    weaponMesh.position.set(0, 0.4, 10);
    weaponMesh.rotation.z = Math.PI / 2; // 누워있는 상태
    weaponMesh.weaponName = '검';
    scene.add(weaponMesh);

    // 열쇠 생성
    if (keyMesh) scene.remove(keyMesh);
    keyMesh = createGoldenKey();
    keyMesh.position.set(-12, 0.5, 0);
    keyMesh.keyName = '금색 열쇠';
    scene.add(keyMesh);

    // 보물상자 생성
    if (treasureMesh) scene.remove(treasureMesh);
    treasureMesh = createTreasureChest();
    treasureMesh.position.set(12, 0.6, 0);
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
let playerPitch = 0; // X축 회전 (상하 각도, 라디안)
let playerVelocityY = 0; // Y축 속도 (점프/낙하)
let isOnGround = false; // 지면에 있는지 여부

// 점프 관련 상수
const gravity = -15; // 중력 가속도
const jumpSpeed = 6; // 점프 속도
const playerEyeHeight = 1.6; // 플레이어 눈 높이

// 카메라 위치 업데이트 함수 (3인칭 시점)
function updateCameraPosition() {
    // 카메라를 플레이어 뒤에서 따라가도록 배치
    camera.position.set(
        playerPosition.x,
        playerPosition.y + 3,
        playerPosition.z + 5
    );
    camera.lookAt(playerPosition);
}

// 미니맵 설정
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');

// 미니맵 크기 설정
const minimapSize = 180;
minimapCanvas.width = minimapSize;
minimapCanvas.height = minimapSize;

// 미니맵 스케일 (3D 공간 -> 2D 미니맵)
const mapScale = minimapSize / (roomSize * 1.2);

// 체력바 업데이트 함수
function updateHealthUI() {
    // 플레이어 체력 업데이트
    const healthBoxes = document.querySelectorAll('#player-health .health-box');
    healthBoxes.forEach((box, index) => {
        if (index < playerHealth) {
            box.classList.remove('empty');
        } else {
            box.classList.add('empty');
        }
    });

    // 적 수 업데이트
    const enemyCount = enemies.length;
    document.getElementById('enemy-count').textContent = enemyCount;

    // 적 체력바 업데이트
    const healthBar = document.getElementById('health-bar');

    // 기존 적 체력바 제거
    const existingEnemyHealths = healthBar.querySelectorAll('.enemy-health-section');
    existingEnemyHealths.forEach(section => section.remove());

    // 각 적의 체력바 생성
    enemies.forEach((enemy, index) => {
        const enemyHealthSection = document.createElement('div');
        enemyHealthSection.className = 'enemy-health-section';
        enemyHealthSection.style.marginTop = '10px';

        const label = document.createElement('div');
        label.className = 'health-label';
        label.textContent = `적 ${index + 1} 체력`;
        enemyHealthSection.appendChild(label);

        const healthContainer = document.createElement('div');
        healthContainer.className = 'health-container';

        // 적의 최대 체력만큼 체력바 생성
        const maxHealth = difficultySettings[currentDifficulty]?.enemyHealth || 3;
        for (let i = 0; i < maxHealth; i++) {
            const box = document.createElement('div');
            box.className = 'health-box enemy';
            if (i >= enemy.health) {
                box.classList.add('empty');
            }
            healthContainer.appendChild(box);
        }

        enemyHealthSection.appendChild(healthContainer);
        healthBar.appendChild(enemyHealthSection);
    });
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
            console.log('검 생성:', playerWeaponMesh);
            console.log('검 자식 객체 수:', playerWeaponMesh.children.length);

            // 플레이어 오른팔에 검 장착
            playerWeaponMesh.position.set(0, -0.3, 0); // 손 위치 조정
            playerWeaponMesh.rotation.set(0, 0, -Math.PI / 2); // 손에 쥔 각도
            playerCharacter.userData.rightArm.add(playerWeaponMesh);

            console.log('검이 플레이어 오른팔에 추가됨');
            console.log('검 로컬 위치:', playerWeaponMesh.position);
            console.log('검 월드 위치:', playerWeaponMesh.getWorldPosition(new THREE.Vector3()));

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
    console.log('=== 공격 시도 ===');
    console.log('플레이어 위치:', playerPosition.x, playerPosition.y, playerPosition.z);
    console.log('플레이어 회전:', playerRotation);
    console.log('적 수:', enemies.length);

    if (isAttacking) {
        console.log('이미 공격 중입니다.');
        return;
    }

    // 검 휘두르기 애니메이션
    if (playerWeaponMesh) {
        console.log('검 휘두르기 애니메이션 시작');
        isAttacking = true;
        const originalRotationZ = playerWeaponMesh.rotation.z;
        const swingDuration = 250;
        const swingAngle = Math.PI * 0.6;
        const startTime = Date.now();

        const swingAnimation = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / swingDuration, 1);

            if (progress < 0.4) {
                playerWeaponMesh.rotation.z = originalRotationZ - swingAngle * 0.3 * (progress / 0.4);
            } else if (progress < 0.7) {
                const swingProgress = (progress - 0.4) / 0.3;
                playerWeaponMesh.rotation.z = originalRotationZ - swingAngle * 0.3 + swingAngle * swingProgress;
            } else {
                const returnProgress = (progress - 0.7) / 0.3;
                playerWeaponMesh.rotation.z = originalRotationZ + swingAngle * 0.7 - swingAngle * 0.7 * returnProgress;
            }

            if (progress < 1) {
                requestAnimationFrame(swingAnimation);
            } else {
                playerWeaponMesh.rotation.z = originalRotationZ;
                isAttacking = false;
                console.log('검 휘두르기 애니메이션 종료');
            }
        };

        swingAnimation();
    } else {
        console.log('플레이어가 검을 들고 있지 않습니다.');
    }

    // 거리 기반 공격 시스템 (더 안정적)
    const attackDistance = 4; // 공격 거리
    const attackAngle = Math.PI / 4; // 45도 각도 범위

    console.log('모든 적 검사 시작...');

    let hitEnemy = null;
    let minDistance = Infinity;

    enemies.forEach((enemy, index) => {
        // 적과의 거리 계산
        const distance = playerPosition.distanceTo(enemy.position);
        console.log(`적 ${index + 1}: 위치(${enemy.position.x.toFixed(2)}, ${enemy.position.z.toFixed(2)}), 거리: ${distance.toFixed(2)}`);

        if (distance <= attackDistance) {
            // 플레이어에서 적으로의 방향 벡터
            const toEnemy = new THREE.Vector3();
            toEnemy.subVectors(enemy.position, playerPosition);
            toEnemy.y = 0;
            toEnemy.normalize();

            // 플레이어가 바라보는 방향
            const playerDir = new THREE.Vector3(
                -Math.sin(playerRotation),
                0,
                -Math.cos(playerRotation)
            );
            playerDir.normalize();

            // 두 벡터 사이의 각도 계산
            const angle = playerDir.angleTo(toEnemy);
            console.log(`  -> 각도 차이: ${(angle * 180 / Math.PI).toFixed(2)}도`);

            // 각도 범위 내에 있고 가장 가까운 적 선택
            if (angle <= attackAngle && distance < minDistance) {
                hitEnemy = enemy;
                minDistance = distance;
                console.log(`  -> 공격 대상으로 선정!`);
            }
        }
    });

    if (hitEnemy) {
        // 공격력 적용
        hitEnemy.health -= attackPower;
        console.log(`*** 적 공격 성공! ***`);
        console.log(`데미지: ${attackPower}, 남은 체력: ${hitEnemy.health}`);

        // 적이 죽었으면 제거
        if (hitEnemy.health <= 0) {
            scene.remove(hitEnemy);
            const index = enemies.indexOf(hitEnemy);
            if (index > -1) {
                enemies.splice(index, 1);
            }
            updateHealthUI();
            console.log('*** 적 처치! ***');
            // 모든 적을 처치해도 게임이 끝나지 않음 (보물상자를 열어야 함)
        } else {
            // 체력바 업데이트
            updateHealthUI();
        }

        // 시각적 피드백 (적 몸통 색 변경)
        const body = hitEnemy.children.find(child =>
            child.geometry &&
            child.geometry.type === 'BoxGeometry' &&
            Math.abs(child.position.y - 0.1) < 0.01
        );
        if (body) {
            const originalColor = body.material.color.getHex();
            body.material.color.setHex(0xffaa00);
            setTimeout(() => {
                if (hitEnemy.health > 0) {
                    body.material.color.setHex(originalColor);
                }
            }, 100);
        }
    } else {
        console.log('공격 범위 내에 적이 없습니다.');
    }
    console.log('=== 공격 종료 ===\n');
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

    // 플레이어 공격 범위 표시 (부채꼴)
    // Three.js 좌표계에서 미니맵 좌표계로 변환
    const lookDirectionX = -Math.sin(playerRotation);
    const lookDirectionZ = -Math.cos(playerRotation);
    const attackRange = 3 * mapScale; // 공격 거리 3 유닛
    const attackAngle = Math.PI / 6; // 30도 (좌우 15도씩)

    // 공격 범위 부채꼴 그리기 (반투명 빨간색)
    minimapCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    minimapCtx.beginPath();
    minimapCtx.moveTo(playerMapX, playerMapZ);

    // 부채꼴의 시작 각도 계산 (playerRotation을 기준으로)
    // Canvas에서는 각도 0이 오른쪽(+X)이므로 조정 필요
    const canvasAngle = Math.atan2(lookDirectionZ, lookDirectionX);
    const startAngle = canvasAngle - attackAngle / 2;
    const endAngle = canvasAngle + attackAngle / 2;

    minimapCtx.arc(playerMapX, playerMapZ, attackRange, startAngle, endAngle);
    minimapCtx.closePath();
    minimapCtx.fill();

    // 공격 범위 테두리 (빨간색 선)
    minimapCtx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(playerMapX, playerMapZ);
    minimapCtx.arc(playerMapX, playerMapZ, attackRange, startAngle, endAngle);
    minimapCtx.closePath();
    minimapCtx.stroke();

    // 플레이어 방향 표시 (중앙 선)
    minimapCtx.strokeStyle = '#ff0000';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(playerMapX, playerMapZ);
    minimapCtx.lineTo(
        playerMapX + lookDirectionX * attackRange,
        playerMapZ + lookDirectionZ * attackRange
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

// 이전 키 상태 추적 (방향 전환 감지용)
const prevKeys = {
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
        case 'KeyU':
            // 카메라 각도를 위로
            playerPitch = Math.max(-Math.PI / 3, playerPitch - 0.05);
            break;
        case 'KeyD':
            // 카메라 각도를 아래로
            playerPitch = Math.min(Math.PI / 3, playerPitch + 0.05);
            break;
        case 'Digit1':
            event.preventDefault();
            // 황금 코인을 가지고 있으면 사용 (여러 번 가능)
            if (inventory.includes('황금 코인')) {
                if (goldenParticles) {
                    scene.remove(goldenParticles);
                }
                goldenParticles = createGoldenParticles();
                scene.add(goldenParticles);
                console.log('황금 파티클이 바닥에 생성되었습니다!');
            }
            break;
        case 'Digit2':
            event.preventDefault();
            // 마법 수정을 가지고 있으면 사용 (여러 번 가능)
            if (inventory.includes('마법 수정')) {
                if (sunMesh) {
                    scene.remove(sunMesh);
                }
                sunMesh = createSun();
                scene.add(sunMesh);
                console.log('하늘에 태양이 생성되었습니다!');
            }
            break;
        case 'Digit3':
            event.preventDefault();
            // 요술지팡이를 가지고 있으면 사용 (여러 번 가능)
            if (inventory.includes('요술지팡이')) {
                // 하늘을 밤하늘로 변경
                scene.background = new THREE.Color(0x000033);
                if (moonMesh) {
                    scene.remove(moonMesh);
                }
                if (stars) {
                    scene.remove(stars);
                }
                // 달 생성
                moonMesh = createMoon();
                scene.add(moonMesh);
                // 별들 생성
                stars = createStars();
                scene.add(stars);
                console.log('밤하늘이 되었습니다! 달과 별이 나타났습니다!');
            }
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
    const newHeight = window.innerHeight;

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
        item.position.y = 0.8 + Math.sin(time * 0.002) * 0.1;
        item.rotation.y += 0.02;
        // 맥박 애니메이션
        const pulse = 1 + Math.sin(time * 0.002) * 0.1;
        item.scale.set(pulse, pulse, pulse);
    });

    // 무기 떠다니는 효과
    if (weaponMesh && !equippedWeapon) {
        weaponMesh.position.y = 0.9 + Math.sin(time * 0.003) * 0.1;
        weaponMesh.rotation.y += 0.01;
        // 맥박 애니메이션
        const weaponPulse = 1 + Math.sin(time * 0.002) * 0.1;
        weaponMesh.scale.set(weaponPulse, weaponPulse, weaponPulse);
    }

    // 열쇠 떠다니는 효과
    if (keyMesh && !hasKey) {
        keyMesh.position.y = 0.8 + Math.sin(time * 0.0025) * 0.15;
        keyMesh.rotation.y += 0.015;
        // 맥박 애니메이션
        const keyPulse = 1 + Math.sin(time * 0.002) * 0.1;
        keyMesh.scale.set(keyPulse, keyPulse, keyPulse);
    }

    // 보물상자 빛나는 효과
    if (treasureMesh && !gameCleared) {
        treasureMesh.rotation.y += 0.005;
        // 보물상자 위아래 떠다니는 효과
        treasureMesh.position.y = 1.0 + Math.sin(time * 0.002) * 0.05;
        // 맥박 애니메이션
        const treasurePulse = 1 + Math.sin(time * 0.002) * 0.08;
        treasureMesh.scale.set(treasurePulse, treasurePulse, treasurePulse);
    }

    // 태양 회전 효과
    if (sunMesh) {
        sunMesh.rotation.y += 0.003;
        // 태양 광채 펄스 효과
        const glowScale = 1 + Math.sin(time * 0.001) * 0.1;
        if (sunMesh.children[1]) {
            sunMesh.children[1].scale.set(glowScale, glowScale, glowScale);
        }
    }

    // 구름 이동 효과
    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed * delta;
        // 맵 밖으로 나가면 반대편에서 다시 시작
        if (cloud.position.x > 25) {
            cloud.position.x = -25;
        }
    });

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

                // 블록 충돌 체크 함수
                const checkBlockCollision = (x, z) => {
                    for (const tile of terrainTiles) {
                        if (tile.userData.isHill &&
                            x >= tile.userData.minX && x <= tile.userData.maxX &&
                            z >= tile.userData.minZ && z <= tile.userData.maxZ) {
                            return true; // 충돌!
                        }
                    }
                    return false;
                };

                // X축 이동 및 경계 체크
                if (newX >= enemyBounds.minX && newX <= enemyBounds.maxX &&
                    !checkBlockCollision(newX, enemy.position.z)) {
                    enemy.position.x = newX;
                }

                // Z축 이동 및 경계 체크
                if (newZ >= enemyBounds.minZ && newZ <= enemyBounds.maxZ &&
                    !checkBlockCollision(enemy.position.x, newZ)) {
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
        // 이동 처리
        let moveX = 0;
        let moveZ = 0;

        if (keys.forward) {
            moveZ = -moveSpeed * delta; // 위로 이동
        }
        if (keys.backward) {
            moveZ = moveSpeed * delta; // 아래로 이동
        }
        if (keys.left) {
            moveX = -moveSpeed * delta; // 왼쪽으로 이동
        }
        if (keys.right) {
            moveX = moveSpeed * delta; // 오른쪽으로 이동
        }

        // 이동 방향이 있을 때만 회전 (부드러운 회전)
        if (moveX !== 0 || moveZ !== 0) {
            // 이동 방향에 따른 목표 회전 각도 계산
            const targetRotation = Math.atan2(-moveX, -moveZ);

            // 부드러운 회전 (마인크래프트 스타일)
            const rotationSpeed = 8; // 회전 속도
            let rotationDiff = targetRotation - playerRotation;

            // 각도 차이를 -PI ~ PI 범위로 정규화 (최단 경로로 회전)
            while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
            while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;

            // 부드럽게 회전
            playerRotation += rotationDiff * rotationSpeed * delta;

            // 각도를 -PI ~ PI 범위로 유지
            while (playerRotation > Math.PI) playerRotation -= 2 * Math.PI;
            while (playerRotation < -Math.PI) playerRotation += 2 * Math.PI;
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

        // 플레이어 캐릭터 위치 및 회전 동기화
        if (playerCharacter) {
            playerCharacter.position.copy(playerPosition);
            playerCharacter.position.y -= (playerEyeHeight - 0.7); // 발이 지면에 오도록 조정
            playerCharacter.rotation.y = playerRotation;

            // 이동 중일 때만 걷기 애니메이션
            if (moveX !== 0 || moveZ !== 0) {
                playerCharacter.userData.walkCycle += delta * 5;
                const swing = Math.sin(playerCharacter.userData.walkCycle) * 0.3;

                playerCharacter.userData.leftArm.rotation.x = swing;
                playerCharacter.userData.rightArm.rotation.x = -swing;
                playerCharacter.userData.leftLeg.rotation.x = -swing;
                playerCharacter.userData.rightLeg.rotation.x = swing;
            }
        }
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

    // 특수 효과 초기화
    hasUsedCoin = false;
    hasUsedCrystal = false;
    hasUsedWand = false;

    // 하늘색 초기화
    scene.background = new THREE.Color(0x87ceeb);

    if (goldenParticles) {
        scene.remove(goldenParticles);
        goldenParticles = null;
    }
    if (sunMesh) {
        scene.remove(sunMesh);
        sunMesh = null;
    }
    if (moonMesh) {
        scene.remove(moonMesh);
        moonMesh = null;
    }
    if (stars) {
        scene.remove(stars);
        stars = null;
    }
    // 기존 구름 제거
    clouds.forEach(cloud => scene.remove(cloud));
    clouds = [];

    // 새로운 구름 생성
    clouds = createClouds();

    // 플레이어가 들고 있던 검 제거
    if (playerWeaponMesh) {
        if (playerCharacter && playerCharacter.userData.rightArm) {
            playerCharacter.userData.rightArm.remove(playerWeaponMesh);
        }
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

    // 플레이어 캐릭터 생성 및 추가
    if (playerCharacter) {
        scene.remove(playerCharacter);
    }
    playerCharacter = createPlayerCharacter();
    scene.add(playerCharacter);

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
        if (playerCharacter && playerCharacter.userData.rightArm) {
            playerCharacter.userData.rightArm.remove(playerWeaponMesh);
        }
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

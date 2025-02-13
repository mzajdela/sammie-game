// Game setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// Load images
const catImg = new Image();
catImg.src = "cat.jpg";  // Ensure you have this file
const treatImg = new Image();
treatImg.src = "treat.jpg";  // Ensure you have this file
const hatImg = new Image();
hatImg.src = "hat.jpg";  // Add your hat image here
const bowImg = new Image();
bowImg.src = "bow.jpg";  // Add your bow image here

// JSONBin API Setup
const binId = "67ae3f5ce41b4d34e48caea7";
const apiKey = "$2a$10$wrO6nVh76pu42GLeSBtn1OlxlHKOYYSSjIJE0KlRa/c1XerQOQjMa";
const binUrl = `https://api.jsonbin.io/v3/b/${binId}`;

// Get player name
let playerName = prompt("Enter your name:");
if (!playerName) playerName = "Guest";

// Game variables
const cat = { x: canvas.width / 2 - 50, y: canvas.height - 80, width: 100, height: 80, speed: 10 };
const treats = [];
let treatSpeed = 3;
let maxTreatSpeed = 8;  // Maximum fall speed
let score = 0;
let gameOver = false;
let treatSpawnRate = 100; // Lower = More treats, Higher = Fewer treats
let treatSpawnCounter = 0; // Counts frames for treat spawn control
let showHat = false; // Track whether to show the hat
let showBow = false; // Track whether to show the bow
let leaderboard = [];

// Handle keyboard input
const keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// Handle mobile touch input
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

leftBtn.addEventListener("touchstart", () => keys["ArrowLeft"] = true);
leftBtn.addEventListener("touchend", () => keys["ArrowLeft"] = false);

rightBtn.addEventListener("touchstart", () => keys["ArrowRight"] = true);
rightBtn.addEventListener("touchend", () => keys["ArrowRight"] = false);

// Prevent touch scrolling
document.addEventListener("touchmove", function(event) {
    event.preventDefault();
}, { passive: false });

// Treat object
class Treat {
    constructor() {
        this.x = Math.random() * (canvas.width - 40);
        this.y = -40;
        this.width = 40;
        this.height = 40;
    }

    update() {
        this.y += treatSpeed;
        if (this.y > canvas.height) {
            gameOver = true; // Game over if treat reaches the bottom
        }
    }

    draw() {
        ctx.drawImage(treatImg, this.x, this.y, this.width, this.height);
    }
}

// Fetch leaderboard from JSONBin
async function fetchLeaderboard() {
    const response = await fetch(binUrl, {
        headers: {
            "X-Master-Key": apiKey,
            "X-Master-Key": apiKey
        }
    });
    const data = await response.json();
    leaderboard = Array.isArray(data.record.leaderboard) ? data.record.leaderboard : [];
}

// Update leaderboard on JSONBin
async function updateLeaderboard(name, score) {
    const playerIndex = leaderboard.findIndex(player => player.name === name);
    if (playerIndex !== -1) {
        if (score > leaderboard[playerIndex].score) {
            leaderboard[playerIndex].score = score;
        }
    } else {
        leaderboard.push({ name, score });
    }

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);

    await fetch(binUrl, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "X-Master-Key": apiKey,
            "X-Bin-Private": "false"
        },
        headers: {
            "Content-Type": "application/json",
            "X-Master-Key": apiKey
        },
        body: JSON.stringify({ leaderboard })
    });
}

// Update game logic
function update() {
    if (gameOver) {
        showGameOverScreen();
        return;
    }

    if (keys["ArrowLeft"] && cat.x > 0) cat.x -= cat.speed;
    if (keys["ArrowRight"] && cat.x < canvas.width - cat.width) cat.x += cat.speed;

    treatSpawnCounter++;
    if (treatSpawnCounter > treatSpawnRate) {
        treats.push(new Treat());
        treatSpawnCounter = 0;
    }

    treats.forEach((treat, index) => {
        treat.update();

        if (cat.x < treat.x + treat.width && cat.x + cat.width > treat.x &&
            cat.y < treat.y + treat.height && cat.y + cat.height > treat.y) {
            treats.splice(index, 1);
            score++;

            treatSpeed = Math.min(3 + Math.floor(score / 5), maxTreatSpeed);
            treatSpawnRate = Math.max(50, 100 - score * 2);

            if (score >= 10) showHat = true;
            if (score >= 25) showBow = true;
        }
    });
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(catImg, cat.x, cat.y, cat.width, cat.height);
    treats.forEach(treat => treat.draw());

    if (showHat) {
        ctx.drawImage(hatImg, cat.x + 20, cat.y - 30, 60, 40);
    }

    if (showBow) {
        ctx.drawImage(bowImg, cat.x + 20, cat.y + 60, 60, 40);
    }

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Sammie has eaten: ${score} treats`, 20, 30);

    drawLeaderboard();
}

// Draw leaderboard
function drawLeaderboard() {
    const sortedScores = leaderboard.slice(0, 3);
    ctx.fillStyle = "darkblue";
    ctx.font = "18px Arial";
    ctx.fillText(`🏆 Leaderboard 🏆`, canvas.width - 200, 30);
    let yOffset = 60;
    sortedScores.forEach((entry, index) => {
        ctx.fillText(`${index + 1}. ${entry.name}: ${entry.score}`, canvas.width - 200, yOffset);
        yOffset += 30;
    });
}

// Game over screen
function showGameOverScreen() {
    updateLeaderboard(playerName, score);

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 80, canvas.height / 2 - 30);
    ctx.font = "20px Arial";
    ctx.fillText(`Sammie ate ${score} treats!`, canvas.width / 2 - 90, canvas.height / 2);
    setTimeout(() => document.location.reload(), 2000);
}

// Game loop
async function gameLoop() {
    await fetchLeaderboard();
    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }
    loop();
}

gameLoop();



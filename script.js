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

// Load leaderboard from localStorage
let leaderboard = JSON.parse(localStorage.getItem('sammieLeaderboard')) || {};

// Load current player's high score
let playerHighScore = leaderboard[playerName] || 0;

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

// Update game logic
function update() {
    if (gameOver) {
        showGameOverScreen();
        return;
    }

    // Move cat
    if (keys["ArrowLeft"] && cat.x > 0) cat.x -= cat.speed;
    if (keys["ArrowRight"] && cat.x < canvas.width - cat.width) cat.x += cat.speed;

    // Treat spawning logic (Balanced!)
    treatSpawnCounter++;
    if (treatSpawnCounter > treatSpawnRate) {
        treats.push(new Treat());
        treatSpawnCounter = 0; // Reset counter
    }

    treats.forEach((treat, index) => {
        treat.update();

        // Check for collision
        if (cat.x < treat.x + treat.width && cat.x + cat.width > treat.x &&
            cat.y < treat.y + treat.height && cat.y + cat.height > treat.y) {
            treats.splice(index, 1);
            score++;

            // Adjust difficulty gradually (keeps game winnable!)
            treatSpeed = Math.min(3 + Math.floor(score / 5), maxTreatSpeed); // Capped speed
            treatSpawnRate = Math.max(50, 100 - score * 2); // Treats spawn faster, but not too fast

            // Update current player's high score
            if (score > playerHighScore) {
                playerHighScore = score;
                leaderboard[playerName] = playerHighScore;
                localStorage.setItem('sammieLeaderboard', JSON.stringify(leaderboard));
            }

            // Show hat after 10 treats
            if (score >= 10) {
                showHat = true;
            }

            // Show bow after 25 treats
            if (score >= 25) {
                showBow = true;
            }
        }
    });
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(catImg, cat.x, cat.y, cat.width, cat.height);
    treats.forEach(treat => treat.draw());

    // Draw hat if score >= 10
    if (showHat) {
        const hatWidth = 60;
        const hatHeight = 40;
        const hatX = cat.x + 20; // Position hat on cat's head
        const hatY = cat.y - 30; // Slightly above the cat's head
        ctx.drawImage(hatImg, hatX, hatY, hatWidth, hatHeight);
    }

    // Draw bow if score >= 25
    if (showBow) {
        const bowWidth = 60;
        const bowHeight = 40;
        const bowX = cat.x + 20; // Centered horizontally
        const bowY = cat.y + 60; // Positioned just below Sammie's chin
        ctx.drawImage(bowImg, bowX, bowY, bowWidth, bowHeight);
    }

    // Draw score
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Sammie has eaten: ${score} treats`, 20, 30);
    ctx.fillText(`High Score (${playerName}): ${playerHighScore}`, 20, 60);

    // Draw leaderboard
    drawLeaderboard();
}

// Draw leaderboard
function drawLeaderboard() {
    const sortedScores = Object.entries(leaderboard)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    ctx.fillStyle = "darkblue";
    ctx.font = "18px Arial";
    ctx.fillText(`🏆 Leaderboard 🏆`, canvas.width - 200, 30);

    let yOffset = 60;
    sortedScores.forEach(([name, highScore], index) => {
        ctx.fillText(`${index + 1}. ${name}: ${highScore}`, canvas.width - 200, yOffset);
        yOffset += 30;
    });
}

// Game over screen
function showGameOverScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 80, canvas.height / 2 - 30);
    ctx.font = "20px Arial";
    ctx.fillText(`Sammie ate ${score} treats!`, canvas.width / 2 - 90, canvas.height / 2);
    ctx.fillText(`High Score (${playerName}): ${playerHighScore}`, canvas.width / 2 - 90, canvas.height / 2 + 30);
    
    setTimeout(() => document.location.reload(), 2000); // Auto-restart after 2 seconds
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game after images load
window.onload = () => {
    gameLoop();
};


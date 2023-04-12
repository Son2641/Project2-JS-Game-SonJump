(() => {
  const gameArea = document.getElementById('game-area');
  const player = document.createElement('div');
  const scoreBoard = document.querySelector('.scoreboard');
  const newGame = document.querySelector('.newGame');
  const quitGame = document.querySelector('.quit');
  const restartGame = document.querySelector('.restart');
  const gameAreaWidth = 550;
  const gravity = 0.8;
  const platformHeight = gameArea.offsetHeight;
  const speed = 1; // the initial speed of the platforms
  const maxSpeed = 10; // the maximum speed of the platforms
  const ongoingTouches = [];
  let score = 0;
  let isGameOver = false;
  let playerLeftSpace = 50;
  let startPoint = player.bottom;
  let playerBottomSpace = startPoint;
  let platformCount = 5;
  let platforms = [];
  let upTimerId;
  let downTimerId;
  let isJumping = true;
  let isGoingLeft = false;
  let isGoingRight = false;
  let leftTimerId;
  let rightTimerId;
  let animationId;
  let initialTouchX = null;
  let initialTouchY = null;
  let movePlatformsInterval;
  let controlsEnabled = true;

  // Create Player
  const createPlayer = () => {
    gameArea.appendChild(player);
    player.classList.add('player');
    playerLeftSpace = platforms[0].left;
    player.style.left = playerLeftSpace + 'px';
    player.style.bottom = playerBottomSpace + 'px';
  };

  // Platform
  class Platform {
    constructor(newPlatformBottom) {
      this.bottom = newPlatformBottom;
      this.left = Math.random() * (gameAreaWidth - 100);
      this.visual = document.createElement('div');

      const visual = this.visual;
      visual.classList.add('platform');
      visual.style.left = this.left + 'px';
      visual.style.bottom = this.bottom + 'px';
      gameArea.appendChild(visual);
    }
  }

  // Create initial platforms
  const createPlatform = () => {
    for (let i = 0; i < platformCount; i++) {
      let platformGap = 600 / platformCount;
      let newPlatformBottom = 100 + i * platformGap;
      let newPlatform = new Platform(newPlatformBottom);
      platforms.push(newPlatform);
    }
  };

  const getPlatformPosition = (score) => {
    const basePosition = 4; // the base position of the platforms
    const platformSpeed = Math.floor((score - 1) / 4) * speed; // calculate the current platform speed based on score and speed variables
    return basePosition + platformSpeed; // return the final platform position
  };

  const increaseSpeed = () => {
    if (speed < maxSpeed) {
      speed += 0.5;
    }
  };

  setInterval(increaseSpeed, 500);

  const updateScoreDisplay = () => {
    scoreBoard.textContent = `Score: ${score * 100}`;
  };

  // Create new platforms after inital
  const movePlatforms = () => {
    if (playerBottomSpace > 200) {
      platforms.forEach((platform) => {
        platform.bottom -= getPlatformPosition(score);
        let visual = platform.visual;
        visual.style.bottom = platform.bottom + 'px';

        if (platform.bottom < 20) {
          let firstPlatform = platforms[0].visual;
          firstPlatform.classList.remove('platform');
          platforms.shift();
          score++;
          updateScoreDisplay();
          if (score === 50) {
            winGame();
          } else {
            let newPlatform = new Platform(platformHeight);
            platforms.push(newPlatform);
          }
        }
      });
    }
  };

  // Make player jump
  const jumpUp = () => {
    clearInterval(downTimerId);
    isJumping = true;
    upTimerId = setInterval(() => {
      playerBottomSpace += 10;
      player.style.bottom = playerBottomSpace + 'px';
      if (playerBottomSpace > startPoint + 150) {
        fallPlayer();
        isJumping = false;
      }
      scoreBoard.textContent = score;
    }, 20);
  };

  // Make player fall
  const fallPlayer = () => {
    clearInterval(upTimerId);
    isJumping = false;
    downTimerId = setInterval(() => {
      playerBottomSpace -= 5;
      player.style.bottom = playerBottomSpace + 'px';
      if (playerBottomSpace <= 0) {
        gameOver();
      }
      platforms.forEach((platform) => {
        if (
          playerBottomSpace >= platform.bottom &&
          playerBottomSpace <= platform.bottom + 25 &&
          playerLeftSpace + 70 >= platform.left &&
          playerLeftSpace <= platform.left + 95 &&
          !isJumping
        ) {
          startPoint = playerBottomSpace;
          jumpUp();
          isJumping = true;
        }
      });
      scoreBoard.textContent = score;
    }, 20);
  };

  // Control button
  const toggleControls = (enable) => {
    controlsEnabled = enable;
  };

  const controls = (event) => {
    if (!controlsEnabled) return;
    if (event.key === 'd' || event.key === 'ArrowRight') {
      moveRight();
    } else if (event.key === 'a' || event.key === 'ArrowLeft') {
      moveLeft();
    }
  };

  const moveRight = () => {
    if (isGoingLeft) {
      clearInterval(leftTimerId);
      isGoingLeft = false;
    }
    if (!isGoingRight) {
      isGoingRight = true;
      rightTimerId = setInterval(() => {
        if (playerLeftSpace <= 480) {
          playerLeftSpace += 6;
          player.style.left = playerLeftSpace + 'px';
        } else moveLeft();
      }, 20);
    }
  };

  const moveLeft = () => {
    if (isGoingRight) {
      clearInterval(rightTimerId);
      isGoingRight = false;
    }
    if (!isGoingLeft) {
      isGoingLeft = true;
      leftTimerId = setInterval(() => {
        if (playerLeftSpace >= 0) {
          playerLeftSpace -= 6;
          player.style.left = playerLeftSpace + 'px';
        } else moveRight();
      }, 20);
    }
  };

  const handleStart = (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      ongoingTouches.push({
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
    }
  };

  const handleEnd = (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      const idx = ongoingTouches.findIndex(
        (t) => t.identifier === touch.identifier
      );
      if (idx >= 0) {
        ongoingTouches.splice(idx, 1);
        moveStraight();
      }
    }
  };

  const handleMove = (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      const idx = ongoingTouches.findIndex(
        (t) => t.identifier === touch.identifier
      );
      if (idx >= 0) {
        const diffX = ongoingTouches[idx].clientX - touch.clientX;
        const diffY = ongoingTouches[idx].clientY - touch.clientY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > 0) {
            moveLeft();
          } else {
            moveRight();
          }
        } else {
          if (diffY > 0) {
            moveStraight();
          }
        }
        ongoingTouches[idx].clientX = touch.clientX;
        ongoingTouches[idx].clientY = touch.clientY;
      }
    }
  };

  gameArea.addEventListener('touchstart', handleStart, { passive: false });
  gameArea.addEventListener('touchend', handleEnd, { passive: false });
  gameArea.addEventListener('touchmove', handleMove, { passive: false });

  // Start Game function
  const startGame = () => {
    if (!isGameOver) {
      initGame();
    }
  };

  newGame.addEventListener('click', () => {
    isGameOver = false;
    while (gameArea.firstChild) {
      gameArea.removeChild(gameArea.firstChild);
    }
    score = 0;
    platforms = [];
    playerLeftSpace = 50;
    startPoint = 150;
    playerBottomSpace = startPoint;
    platformCount = 5;
    isJumping = true;
    isGoingLeft = false;
    isGoingRight = false;
    clearAllIntervals();
    toggleControls(true); // Enable controls
    initGame();
  });

  // Restart Game
  newGame.addEventListener('click', () => {
    isGameOver = false;
    while (gameArea.firstChild) {
      gameArea.removeChild(gameArea.firstChild);
    }
    score = 0;
    platforms = [];
    playerLeftSpace = 50;
    startPoint = 150;
    playerBottomSpace = startPoint;
    platformCount = 5;
    isJumping = true;
    isGoingLeft = false;
    isGoingRight = false;
    clearAllIntervals();
    toggleControls(true); // Enable controls
    initGame();
  });

  restartGame.addEventListener('click', () => {
    isGameOver = false;
    while (gameArea.firstChild) {
      gameArea.removeChild(gameArea.firstChild);
    }
    score = 0;
    platforms = [];
    playerLeftSpace = 50;
    startPoint = 150;
    playerBottomSpace = startPoint;
    platformCount = 5;
    isJumping = true;
    isGoingLeft = false;
    isGoingRight = false;
    clearAllIntervals();
    initGame();
  });

  // Game Loop
  const initGame = () => {
    createPlatform();
    createPlayer();
    clearAllIntervals(); // Clear the intervals before assigning new ones
    movePlatformsInterval = setInterval(movePlatforms, 30);
    jumpUp();
    toggleControls(true);
    document.addEventListener('keydown', controls);
    updateScoreDisplay(); // Display the initial score
  };

  // Game Over function
  const gameOver = () => {
    isGameOver = true;
    while (gameArea.firstChild) {
      gameArea.removeChild(gameArea.firstChild);
    }
    const gameOverMessage = document.createElement('div');
    gameOverMessage.innerHTML = `Game over! Your score was ${score * 100}.`;
    gameOverMessage.classList.add('game-over');
    gameArea.appendChild(gameOverMessage);
    clearAllIntervals();
    toggleControls(false);
  };

  // Win Game Function
  const winGame = () => {
    isGameOver = true;
    while (gameArea.firstChild) {
      gameArea.removeChild(gameArea.firstChild);
    }
    gameArea.innerHTML = `Congratulations! You won the game with a score of ${
      score * 100
    }!`;
    clearAllIntervals();
    toggleControls(false);
  };
  const clearAllIntervals = () => {
    clearInterval(movePlatformsInterval);
    clearInterval(upTimerId);
    clearInterval(downTimerId);
    clearInterval(leftTimerId);
    clearInterval(rightTimerId);
  };

  quitGame.addEventListener('click', gameOver);
  document.addEventListener('keydown', controls);
})();

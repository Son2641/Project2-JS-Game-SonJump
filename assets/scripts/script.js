(() => {
  const getElement = (selector) => document.querySelector(selector);
  const createDivWithClass = (className) => {
    const div = document.createElement('div');
    div.classList.add(className);
    return div;
  };
  const removeAllChildren = (element) => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  };
  const gameArea = getElement('#game-area');
  const player = createDivWithClass('player');
  const scoreBoard = getElement('.scoreboard');
  const newGame = getElement('.newGame');
  const quitGame = getElement('.quit');
  const restartGame = getElement('.restart');
  const instructionsButton = getElement('.instructions');
  const instructionsDiv = getElement('.instructions-container');
  // const gameAreaWidth = 530;
  const gameAreaWidth = Math.min(window.innerWidth, 530);
  const gravity = 0.8;
  const platformHeight = gameArea.offsetHeight;
  let speed = 1; // the initial speed of the platforms
  let currentSpeed = speed;
  const maxSpeed = 20; // the maximum speed of the platforms
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

  // Instructions Button
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('instructions-modal');
    const btn = document.querySelector('.instructions');
    const span = document.querySelector('.close');

    btn.onclick = () => {
      modal.style.display = 'block';
    };

    span.onclick = () => {
      modal.style.display = 'none';
    };

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    };
  });

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
    constructor(newPlatformBottom, previousPlatform) {
      this.bottom = newPlatformBottom;
      this.left = this.calculateLeftPosition(previousPlatform);
      this.visual = document.createElement('div');

      const visual = this.visual;
      visual.classList.add('platform');
      visual.style.left = this.left + 'px';
      visual.style.bottom = this.bottom + 'px';
      gameArea.appendChild(visual);
    }

    calculateLeftPosition(previousPlatform) {
      if (!previousPlatform) {
        // For the first platform, use the original random position calculation
        return Math.random() * (gameAreaWidth - 100);
      }

      // Define the minimum and maximum horizontal distance between platforms
      const minHorizontalDistance = 50;
      const maxHorizontalDistance = 180;

      // Calculate a random horizontal distance between min and max values
      const randomHorizontalDistance =
        Math.random() * (maxHorizontalDistance - minHorizontalDistance) +
        minHorizontalDistance;

      // Determine if the new platform should be placed to the left or right of the previous platform
      const direction = Math.random() > 0.5 ? -1 : 1;

      // Calculate the left position of the new platform
      let newLeftPosition =
        previousPlatform.left + direction * randomHorizontalDistance;

      // Ensure the new left position is within the game area boundaries
      newLeftPosition = Math.max(
        0,
        Math.min(newLeftPosition, gameAreaWidth - 100)
      );

      return newLeftPosition;
    }
  }

  // Create initial platforms
  const createPlatform = () => {
    let gameAreaHeight = window.innerHeight * 0.84; // adjust game area height based on screen size
    gameArea.style.height = gameAreaHeight + 'px';
    let platformGap = gameAreaHeight / platformCount;

    // Decrease the platform gap on smaller screens
    if (window.innerWidth <= 600) {
      platformGap *= 1.1;
    }

    for (let i = 0; i < platformCount; i++) {
      let newPlatformBottom = 100 + i * platformGap;
      let previousPlatform =
        platforms.length > 0 ? platforms[platforms.length - 1] : null;
      let newPlatform = new Platform(newPlatformBottom, previousPlatform);
      platforms.push(newPlatform);
    }
  };

  const getPlatformPosition = () => {
    const basePosition = 4; // the base position of the platforms
    const platformSpeed = Math.floor((score - 1) / 4) * currentSpeed; // calculate the current platform speed based on score and speed variables
    return basePosition + platformSpeed; // return the final platform position
  };

  // Speed Increase of the game
  const increaseSpeed = () => {
    if (speed < maxSpeed) {
      speed += 1;
    }
    setTimeout(increaseSpeed, 1000);
  };

  increaseSpeed();

  // Scoreboard
  const updateScoreDisplay = () => {
    scoreBoard.textContent = score * 100;
  };

  // Create new platforms after inital platforms
  const movePlatforms = () => {
    if (playerBottomSpace > 200) {
      updateScoreDisplay();
      platforms.forEach((platform) => {
        platform.bottom -= getPlatformPosition();
        let visual = platform.visual;
        visual.style.bottom = platform.bottom + 'px';

        if (platform.bottom < 20) {
          let firstPlatform = platforms[0].visual;
          firstPlatform.classList.remove('platform');
          platforms.shift();
          score++;
          console.log(score);
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
      if (playerBottomSpace > startPoint + 140) {
        fallPlayer();
        isJumping = false;
      }
    }, 20);
  };

  // Make player fall
  const fallPlayer = () => {
    clearInterval(upTimerId);
    isJumping = false;
    downTimerId = setInterval(() => {
      playerBottomSpace -= 6;
      player.style.bottom = playerBottomSpace + 'px';
      if (playerBottomSpace <= 0) {
        gameOver();
      }
      platforms.forEach((platform) => {
        if (
          playerBottomSpace >= platform.bottom &&
          // 30 = platform height
          playerBottomSpace <= platform.bottom + 30 &&
          // 70 = player width
          playerLeftSpace + 70 >= platform.left &&
          // 100 = platform width
          playerLeftSpace <= platform.left + 100 &&
          !isJumping
        ) {
          startPoint = playerBottomSpace;
          jumpUp();
          isJumping = true;
        }
      });
    }, 20);
  };

  // Keyboard Controls
  const toggleControls = (enable) => {
    controlsEnabled = enable;
  };

  const controls = (event) => {
    if (!controlsEnabled) return;
    if (event.key === 'd' || event.key === 'ArrowRight') {
      moveRight();
      updateScoreDisplay();
    } else if (event.key === 'a' || event.key === 'ArrowLeft') {
      moveLeft();
      updateScoreDisplay();
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
          playerLeftSpace += 8;
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
          playerLeftSpace -= 8;
          player.style.left = playerLeftSpace + 'px';
        } else moveRight();
      }, 20);
    }
  };

  // Touch Screen Controls
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
        }
        ongoingTouches[idx].clientX = touch.clientX;
        ongoingTouches[idx].clientY = touch.clientY;
      }
    }
  };

  // Touch Screen event listener
  gameArea.addEventListener('touchstart', handleStart, { passive: false });
  gameArea.addEventListener('touchend', handleEnd, { passive: false });
  gameArea.addEventListener('touchmove', handleMove, { passive: false });

  // Start Game function
  const startGame = () => {
    if (!isGameOver) {
      initGame();
    }
  };

  // Restart Game
  newGame.addEventListener('click', () => {
    resetGame();
    initGame();
  });

  restartGame.addEventListener('click', () => {
    resetGame();
    initGame();
  });

  const resetGame = () => {
    isGameOver = false;
    removeAllChildren(gameArea);
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
  };

  // Game Loop
  const initGame = () => {
    gameArea.appendChild(scoreBoard);
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

  // Controls and Quit game event listeners
  quitGame.addEventListener('click', gameOver);
  document.addEventListener('keydown', controls);
})();

//
// GPT Grabber - Indonesian Anagram Game for Kids
//

// --- Word Bank ---
// Add more words here to expand the game!
const words = [
  { emoji: '🍎', id: 'apel' },
  { emoji: '👀', id: 'mata' },
  { emoji: '🐈', id: 'kucing' },
  { emoji: '🐕', id: 'anjing' },
  { emoji: '🏠', id: 'rumah' },
  { emoji: '🚗', id: 'mobil' },
  { emoji: '⚽', id: 'bola' },
  { emoji: '🥛', id: 'susu' },
  { emoji: '🍞', id: 'roti' },
  { emoji: '🐟', id: 'ikan' },
  { emoji: '📖', id: 'buku' },
];

let currentWordIndex = 0;
let currentWord;
let emoji;
let scrambledLetters = [];
let answerSlots = [];

let draggedLetter = null;
let offsetX, offsetY;

let gameState = 'playing'; // 'playing', 'level_complete'
let feedbackMessage = '';
let feedbackColor;
let feedbackAlpha = 0;

// --- p5.js Core Functions ---

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');
  shuffle(words, true); // Randomize the word order
  loadWord(currentWordIndex);
}

function draw() {
  // Cheerful background
  background('#87CEEB'); // Sky Blue

  // Draw the big emoji for context
  textSize(120);
  textAlign(CENTER, CENTER);
  text(emoji, width / 2, height * 0.25);

  // Draw the answer slots
  for (const slot of answerSlots) {
    slot.draw();
  }

  // Draw the letter tiles
  for (const letter of scrambledLetters) {
    if (letter !== draggedLetter) {
      letter.draw();
    }
  }

  // Draw the letter being dragged on top of everything else
  if (draggedLetter) {
    draggedLetter.x = mouseX - offsetX;
    draggedLetter.y = mouseY - offsetY;
    draggedLetter.draw();
  }

  // Handle level complete feedback
  if (gameState === 'level_complete') {
    drawFeedback();
  }
}

// --- Game Logic ---

function loadWord(index) {
  currentWord = words[index].id.toUpperCase();
  emoji = words[index].emoji;

  // Create answer slots
  answerSlots = [];
  const slotWidth = 80;
  const slotSpacing = 20;
  const totalWidth = currentWord.length * (slotWidth + slotSpacing) - slotSpacing;
  let startX = (width - totalWidth) / 2;
  for (let i = 0; i < currentWord.length; i++) {
    answerSlots.push(new AnswerSlot(startX + i * (slotWidth + slotSpacing), height * 0.5, slotWidth, slotWidth));
  }

  // Create draggable letter tiles
  scrambledLetters = [];
  let shuffledChars = shuffle(currentWord.split(''));
  const tileWidth = 70;
  const tileSpacing = 20;
  const totalTileWidth = shuffledChars.length * (tileWidth + tileSpacing) - tileSpacing;
  let tileStartX = (width - totalTileWidth) / 2;
  for (let i = 0; i < shuffledChars.length; i++) {
    scrambledLetters.push(new LetterTile(
      shuffledChars[i],
      tileStartX + i * (tileWidth + tileSpacing),
      height * 0.75,
      tileWidth
    ));
  }
  
  gameState = 'playing';
}

function checkWinCondition() {
  // Check if all slots are filled
  if (answerSlots.every(slot => slot.letterTile !== null)) {
    let userAnswer = answerSlots.map(slot => slot.letterTile.char).join('');
    if (userAnswer === currentWord) {
      // --- WIN! ---
      gameState = 'level_complete';
      feedbackMessage = random(['Bagus!', 'Pintar!', 'Hebat!']); // Good! Smart! Great!
      feedbackColor = color(60, 180, 75, 255); // Green
      feedbackAlpha = 255;

      // Make letters in slots jump for joy
      for(const slot of answerSlots) {
        slot.letterTile.isCorrect = true;
      }
      
      // Move to the next word after a delay
      setTimeout(nextLevel, 2000);

    } else {
      // --- WRONG! ---
      feedbackMessage = 'Coba Lagi!'; // Try Again!
      feedbackColor = color(230, 25, 75, 255); // Red
      feedbackAlpha = 255;
      
      // Shake the letters
       for(const slot of answerSlots) {
        slot.letterTile.shake();
      }
    }
  }
}

function nextLevel() {
  currentWordIndex = (currentWordIndex + 1) % words.length;
  loadWord(currentWordIndex);
}

function drawFeedback() {
  // Fade out the message
  feedbackAlpha = lerp(feedbackAlpha, 0, 0.05);
  feedbackColor.setAlpha(feedbackAlpha);
  
  fill(feedbackColor);
  textSize(60);
  textAlign(CENTER, CENTER);
  text(feedbackMessage, width / 2, height / 2 + 150);
}


// --- Controls (Mouse & Touch) ---

function touchStarted() {
  // Find which letter is being picked up
  for (let i = scrambledLetters.length - 1; i >= 0; i--) {
    const letter = scrambledLetters[i];
    if (letter.isMouseOver()) {
      draggedLetter = letter;
      offsetX = mouseX - letter.x;
      offsetY = mouseY - letter.y;
      
      // If it was in a slot, remove it from there
      for (const slot of answerSlots) {
        if (slot.letterTile === draggedLetter) {
          slot.letterTile = null;
        }
      }
      
      // Bring to front by moving to end of array
      scrambledLetters.splice(i, 1);
      scrambledLetters.push(draggedLetter);
      
      break;
    }
  }
  return false; // Prevent default browser behavior
}

function touchEnded() {
  if (!draggedLetter) return;

  let droppedInSlot = false;
  for (const slot of answerSlots) {
    if (slot.isMouseOver()) {
      // If the slot is empty, drop it here
      if (slot.letterTile === null) {
        slot.letterTile = draggedLetter;
        draggedLetter.snapTo(slot.x + slot.w/2, slot.y + slot.h/2);
        droppedInSlot = true;
        break;
      } 
      // If the slot is NOT empty, swap letters
      else {
        let otherLetter = slot.letterTile;
        
        // Put the other letter back to its original home
        otherLetter.snapTo(otherLetter.homeX, otherLetter.homeY);

        // Put the dragged letter in the slot
        slot.letterTile = draggedLetter;
        draggedLetter.snapTo(slot.x + slot.w/2, slot.y + slot.h/2);
        droppedInSlot = true;
        break;
      }
    }
  }

  // If not dropped in a slot, send it home
  if (!droppedInSlot) {
    draggedLetter.snapTo(draggedLetter.homeX, draggedLetter.homeY);
  }

  draggedLetter = null;
  checkWinCondition();
  return false; // Prevent default
}

// --- Classes ---

class LetterTile {
  constructor(char, x, y, size) {
    this.char = char;
    this.homeX = x;
    this.homeY = y;
    this.x = x;
    this.y = y;
    this.size = size;
    this.isCorrect = false;

    // For animation
    this.targetX = x;
    this.targetY = y;
    this.shakeTime = 0;
  }

  draw() {
    // Smoothly move to target position (for snapping)
    this.x = lerp(this.x, this.targetX, 0.2);
    this.y = lerp(this.y, this.targetY, 0.2);
    
    let currentX = this.x;
    let currentY = this.y;
    
    // Handle shake animation
    if(this.shakeTime > 0) {
      currentX += random(-5, 5);
      this.shakeTime--;
    }
    
    // Handle correct animation
    if(this.isCorrect) {
      currentY -= (255 - feedbackAlpha) / 20;
    }

    push();
    translate(currentX, currentY);
    
    // Draw the tile
    strokeWeight(3);
    stroke('#4a4a4a');
    fill('#fff');
    if (this === draggedLetter) {
      fill('#f4b400'); // Google Yellow for highlight
      scale(1.1); // Make it bigger when dragged
    }
    rectMode(CENTER);
    rect(0, 0, this.size, this.size, 10);

    // Draw the letter
    noStroke();
    fill('#333');
    textAlign(CENTER, CENTER);
    textSize(this.size * 0.6);
    text(this.char, 0, 2);
    pop();
  }
  
  snapTo(x, y) {
    this.targetX = x;
    this.targetY = y;
  }
  
  shake() {
    this.shakeTime = 15; // Shake for 15 frames
  }

  isMouseOver() {
    return mouseX > this.x - this.size / 2 && mouseX < this.x + this.size / 2 &&
           mouseY > this.y - this.size / 2 && mouseY < this.y + this.size / 2;
  }
}

class AnswerSlot {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.letterTile = null;
  }

  draw() {
    push();
    strokeWeight(4);
    stroke(255, 150);
    fill(0, 0, 0, 50);
    rect(this.x, this.y, this.w, this.h, 10);
    pop();
  }
  
  isMouseOver() {
    return mouseX > this.x && mouseX < this.x + this.w &&
           mouseY > this.y && mouseY < this.y + this.h;
  }
}

// Utility function to shuffle an array
function shuffle(array, modify = false) {
  let a = modify ? array : array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    loadWord(currentWordIndex); // Recalculate positions on resize
}
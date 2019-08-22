// An array of all the possible items that will be shown on-screen
const ITEMS = [
    {
        src: "img/coke.webp",
        name: "Plastic Bottles",
        bin: "recycle"
    },
    {
        src: "img/soiled-napkin.png",
        name: "Soiled Napkin",
        bin: "compost"
    },
    {
        src: "img/styrofoam-container.png",
        name: "Styrofoam",
        bin: "trash"
    }
];

// Game constants
const FEEDBACK_TIMEOUT = 1500; // in MS
const BINS = ["trash", "recycle", "compost"];
const IMAGE_WIDTH = 150;

// Global variables
let possibleItems; // for items that are yet to be displayed
let score = 0;
let time = 60;
let itemsAtPlay = 0;
let timerInterval;

// get bottom shelf dimensions
let bottomShelfWidth = document.getElementById("bottom_shelf").offsetWidth;
let bottomShelfHeight = document.getElementById("bottom_shelf").offsetHeight;
let topShelfHeight = document.getElementById("top_shelf").offsetHeight;

// Bind the init function to window load
window.onload = init;

/**
 * A function to intialize the game environment.
 */
function init() {
    // hide the end game screen
    document.getElementById("game_end").style.display = "none";

    // clear any leftover images if any
    document.getElementById("bottom_shelf").innerHTML = "";

    // Shuffle ITEMS array and deep copy into possible items
    possibleItems = JSON.parse(JSON.stringify(shuffle(ITEMS)));

    // Add the first three itmems
    for (let i = 0; i < 3; i++)  {
        addItem();
        itemsAtPlay++;
    }

    // clear all possible intervals
    window.clearInterval(timerInterval);

    // start the timer
    startTimer();
}

/**
 * Show the items on screen.
 */
function addItem() {
    // if there are any items left
    if (possibleItems.length) {
        // get the last item
        let item = possibleItems.pop();

        // create an image object from item
        let image = new Image();
        image.src = item.src;
        image.width = IMAGE_WIDTH;

        // add image to screen
        let el = document.getElementById("bottom_shelf").appendChild(image);
        
        // set the bin and name property for answer checking
        image.setAttribute("bin", item.bin);
        image.setAttribute("name", item.name);

        // randomly place image in bottom shelf
        image.style.top = topShelfHeight + Math.floor(Math.random() * (bottomShelfHeight - el.naturalHeight / 2)) + "px";
        image.style.left = Math.floor(Math.random() * (bottomShelfWidth - IMAGE_WIDTH)) + "px";

        // allow the item to be draggable
        dragElement(image);
    }
    // if there are no more items left -- you have won the game
    else {
        if (!itemsAtPlay)
            endGame(true);
    }
}

/**
 * 
 * @param {Boolean} won if the user won the game
 */
function endGame(won) {
    let gameEndScreen = document.getElementById("game_end");

    // show the end game screen
    gameEndScreen.style.display = "block";

    // show end game message
    if (won)  {
        // stop timer
        window.clearInterval(timerInterval);

        // show game win text
        gameEndScreen.innerHTML = "<h1>Congratulations, you completed the game!</h1>";

        // show the user's score
        gameEndScreen.innerHTML += "<h2>Score: " + score + "</h2>";

        gameEndScreen.innerHTML += "<a href='https://twitter.com/intent/tweet?url=https%3A%2F%2Fapps.sga.umbc.edu%2Fwaste-sort&via=umbcsga&text=I%20got%20" + score + "%20on%20UMBC%20Recycle%20Sort%21%20Try%20now%3A'>Tweet Your Score</a><br><br>";
    }
    else {
        // show game lose text
        gameEndScreen.innerHTML = "<h1>Sorry, you ran out of time. Try again!</h1>";

        // show the user's score
        gameEndScreen.innerHTML += "<h2>Score: " + score + "</h2>";
    }

    // show try again button
    gameEndScreen.innerHTML += "<button onclick='init()'>Try Again?</button>";
}

function showNotification(correct, item) {
    let notification = document.getElementById("notification");

    // change the text and color based on user correctness
    if (correct) {
       notification.innerHTML = "Correct, good job! " + item.getAttribute("name") + " goes in " + item.getAttribute("bin") + ".";

       notification.style.backgroundColor = "#d4edda";
    }
    else {
        document.getElementById("notification").innerHTML = "Sorry, that's not quite it.";

        notification.style.backgroundColor = "#f8d7da";
    }
    
    // show the notifcation box
    document.getElementById("notification").style.display = "block";

    // hide the notifcation after 1.5 seconds
    setTimeout(function() {
        document.getElementById("notification").style.display = "none";
    }, FEEDBACK_TIMEOUT);
}

/**
 * Start the timer and update the timer every second.`
 */
function startTimer() {
    // reset timer to top
    time = 60;

    // countdown every second
    timerInterval = setInterval(function() {
        // update time and display
        time--;
        document.getElementById("timer").innerHTML = "Time: " + time;

        // if time is at zero
        if (!time) {
            // stop the timer
            clearInterval(interval);

            // stop the game -- the user lost
            endGame(false);
        }
    }, 1000);
}

/**
 * Update the scoreboard value.
 */
function updateScoreboard() {
    document.getElementById("score").innerHTML = "Score: " + score;
}

/**
* https://www.w3schools.com/howto/howto_js_draggable.asp
* @param {HTMLElement} elmnt 
*/
function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    elmnt.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;

        e.preventDefault();

        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;

        document.onmouseup = closeDragElement;

        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;

        e.preventDefault();

        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement(e) {
        e = e || window.event;

        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;

        // get the item element that was dragged
        let draggedItem = e.srcElement;

        // go through each of the bins and check if it has been placed
        for (let bin of BINS) {
            // collision detection between the item and the bins
            if (detectOverlap(draggedItem, document.getElementById(bin))) {
                // if the item is in the correct bin
                if (bin == draggedItem.getAttribute("bin")) {
                    showNotification(true, draggedItem);

                    // remove from items at play count
                    itemsAtPlay--;

                    // add to score for getting it right
                    score += 100;

                    // remove the item from screen
                    setTimeout(function() {
                        draggedItem.remove();
                    }, FEEDBACK_TIMEOUT);

                    // add a new item to the screen
                    addItem();
                }
                // if the item is in the wrong bin
                else {
                    // show wrong notification if not in bottom shelf
                    if (!detectOverlap(draggedItem, document.getElementById("bottom_shelf")))
                        showNotification(false);

                    // remove from score for getting it wrong
                    score -= 50;
                }

                updateScoreboard();
            }
        }
    }
}

/**
 * https://stackoverflow.com/a/29959520
 */
var detectOverlap = (function () {
    function getPositions(elem) {
        var pos = elem.getBoundingClientRect();
        return [[pos.left, pos.right], [pos.top, pos.bottom]];
    }

    function comparePositions(p1, p2) {
        var r1, r2;

        if (p1[0] < p2[0]) {
            r1 = p1;
            r2 = p2;
        } 
        else {
            r1 = p2;
            r2 = p1;
        }

        return r1[1] > r2[0] || r1[0] === r2[0];
    }

    return function (a, b) {
        var pos1 = getPositions(a),
            pos2 = getPositions(b);

        return comparePositions(pos1[0], pos2[0]) && comparePositions(pos1[1], pos2[1]);
    };
})();

/**
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * @param {array} array 
 */
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    
    return array;
}
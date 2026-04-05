
console.log("QQQ: start of connections content");
// window.alert(".... loading connections completer");

try {

(async function () {
    const TILE_SELECTOR = 'label[data-testid="card-label"]';
    const play_selector = 'button[data-testid="moment-btn-play"]'
    const submit_selector = 'button[data-testid="submit-btn"]'
    let alreadyTriggered = false;
    let didTheAutoSubmit = false;
    const preClickPause = 100;
    const highlightedDuration = 300;
    const nextTileWait = 400;
    const waitForStart = 100;
    const waitBeforeAutomating = 2000;

    function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
    }

// Inject highlight styles once
    function ensureHighlightStyle() {
	if (document.getElementById("done-at-three-helper-style")) return;

	const style = document.createElement("style");
	style.id = "done-at-three-helper-style";
	style.textContent = `
	    .done-at-three-helper-highlight {
		outline: 4px solid #ffcc00 !important;
		box-shadow: 0 0 12px #ffcc00 !important;
		transition: all 0.2s ease;
	    }
	`;
	document.head.appendChild(style);
    }

    async function flashAndClickSequence(tiles) {
	ensureHighlightStyle();

	for (const tile of tiles) {
	    console.log(`QQQ: Working on tile ${tile.textContent}`);
	    // 1. Highlight
	    console.log("QQQ: Add highlight")
	    tile.classList.add("done-at-three-helper-highlight");

	    // Optional: small pre-click pause so user sees highlight
	    await sleep(preClickPause);

	    console.log("QQQ: click")
	    // 2. Click (invoke NYT handler)
	    realClick(tile);

	    // 3. Keep tile highlighted briefly after click
	    await sleep(highlightedDuration);

	    console.log("QQQ: Remove highlight")
	    // 4. Remove highlight
	    tile.classList.remove("done-at-three-helper-highlight");

	    // 5. Wait before next tile
	    await sleep(nextTileWait);
	}
    }
    
    function realClick(el) {
	const rect = el.getBoundingClientRect();
	const x = rect.left + rect.width / 2;
	const y = rect.top + rect.height / 2;

	const opts = {
	    bubbles: true,
	    cancelable: true,
	    view: window,
	    clientX: x,
	    clientY: y
	};

	el.dispatchEvent(new PointerEvent("pointerdown", opts));
	el.dispatchEvent(new MouseEvent("mousedown", opts));

	el.dispatchEvent(new PointerEvent("pointerup", opts));
	el.dispatchEvent(new MouseEvent("mouseup", opts));

	el.dispatchEvent(new MouseEvent("click", opts));
    }

    function getUnselectedTiles() {
	return Array.from(document.querySelectorAll(TILE_SELECTOR));
    }

    async function maybeClickLastFour() {
	if (alreadyTriggered) {
	    console.log("QQQ: already did this...");
	    return;
	}
	const submitButton = document.querySelector("button[type='submit']");
	if (!submitButton) {
	    console.error("SUBMIT button not found");
	    return;
	}
	const unselectedTiles = getUnselectedTiles();
	if (!unselectedTiles) {
	    console.error("No unselected tiles");
	    return;
	}
	console.log(`QQQ: Got ${unselectedTiles.length} tiles left — auto-clicking`);

	if (unselectedTiles.length !== 4) {
	    console.log("QQQ: Have " + unselectedTiles.length + " unclicked tiles still.");
	    return;
	}
	alreadyTriggered = true;
	await flashAndClickSequence(unselectedTiles)

	if (submitButton.disabled) {
	    console.error("SUBMIT button isn't enabled");
	    return;
	}
	console.log("QQQ: - click the submit button");
	didTheAutoSubmit = true;
	realClick(submitButton);
	console.log("QQQ: + click the submit button");
    }
    async function getSubmitButton() {
	let submitButton = document.querySelector(submit_selector);
	let playButton = document.querySelector(play_selector);
	let sawPlayButton = false;
	while (true) {
	    if (submitButton) {
		break;
	    }
	    if (!submitButton && playButton && !sawPlayButton) {
		sawPlayButton = true;
		playButton.addEventListener("click",
					    () => {
						console.log("QQQ: clicked the play button");
					    });
	    }
	    console.log("QQQ: sleeping a sec");
	    await sleep(waitForStart);
	    if (!playButton) {
		playButton = document.querySelector(play_selector);
	    }
	    submitButton = document.querySelector(submit_selector);
	}
	return submitButton
    }

    let submitButton = await getSubmitButton();
    if (!submitButton) {
	console.log("QQQ: no submit button");
	return;
    }

    console.log("QQQ: - submit.addEventListener");
    // Use event delegation (important: NYT uses React, DOM updates frequently)
    submitButton.addEventListener(
	"click",
	(event) => {
	    console.log("QQQ: In a click listener!");
	    if (didTheAutoSubmit) {
		console.log("QQQ: Already clicked");
	    } else {
		// Let the game's click handler run first, then check state
		setTimeout(maybeClickLastFour, waitBeforeAutomating);
	    }
	},
	true // capture phase helps ensure we don't miss events
    );

    // And check to see if there are only four items right now

    console.log("QQQ: Done At Three Connections completer loaded");    
    setTimeout(maybeClickLastFour, 0);

    console.log("QQQ: Done At Three Connections completer loaded");
})();

console.log("QQQ: end of connections content");

} catch(e) {
    console.error(e);
}

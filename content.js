
console.log("QQQ: start of connections content");
// window.alert(".... loading connections completer");

(function () {
    const TILE_SELECTOR = 'label[data-testid="card-label"]';
    let alreadyTriggered = false;

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
	    await sleep(250);

	    console.log("QQQ: click")
	    // 2. Click (invoke NYT handler)
	    realClick(tile);

	    // 3. Keep tile highlighted briefly after click
	    await sleep(500);

	    console.log("QQQ: Remove highlight")
	    // 4. Remove highlight
	    tile.classList.remove("done-at-three-helper-highlight");

	    // 5. Wait before next tile
	    await sleep(1000);
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
	realClick(submitButton);
	console.log("QQQ: + click the submit button");
    }

    // Use event delegation (important: NYT uses React, DOM updates frequently)
    document.addEventListener(
	"click",
	(event) => {
	    console.log("QQQ: In a click listener!");
	    // Let the game's click handler run first, then check state
	    setTimeout(maybeClickLastFour, 0);
	},
	true // capture phase helps ensure we don't miss events
    );

    console.log("QQQ: Done At Three Connections completer loaded");
})();

console.log("QQQ: end of connections content");

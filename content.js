
console.log("QQQ: start of connections content");
// window.alert(".... loading connections completer");

try {

(async function () {
    const TILE_SELECTOR = 'label[data-testid="card-label"]';
    const play_selector = 'button[data-testid="moment-btn-play"]'
    const submit_selector = 'button[data-testid="submit-btn"]'

    const CATEGORIES_CONTAINER_SELECTOR = 'article[data-testid="connections-board"] > form#default-choices > fieldset > div';
    const CATEGORIES_CONTAINER_PARENT_SELECTOR = 'article[data-testid="connections-board"] > form#default-choices > fieldset > div';
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
	for (const tile of tiles) {
	    if (tile.clicked) {
		console.log(`QQQ: Tile ${tile.textContent} is already clicked`);
		tile.classList.add("done-at-three-helper-highlight");
		await sleep(preClickPause);
		tile.classList.remove("done-at-three-helper-highlight");
		continue;
	    }
		
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

    function maybeClickLastFour() {
	ensureHighlightStyle();
	// Ensure the updated dom style is processed
	setTimeout(maybeClickLastFourPart2, 0);
    }
    
    async function maybeClickLastFourPart2() {
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
	if (solvedCategoriesObserver) {
	    console.log("QQQ: stop observing");
	    solvedCategoriesObserver.disconnect();
	}
    }

    let solvedCategoriesParentObserver = null;
    let solvedCategoriesObserver = null;

    function waitForSolvedCategories(solvedCategoriesContainer) {
	if (!solvedCategoriesContainer) {
	    return false;
	}
	solvedCategoriesObserver = new MutationObserver((mutations) => {
	    console.log("QQQ: solvedCategoriesParentObserver: Changed ${mutations.length} nodes");
	    let found = false;
	    for (const mutation of mutations) {
		// Only care about added nodes
		for (const node of mutation.addedNodes) {
		    if (!(node instanceof HTMLElement)) continue;

		    // node itself is the h3
		    if (node.matches?.('h3[data-testid="solved-category-title"]')) {
			found = true;
			break;
		    }
		}
		if (found) {
		    setTimeout(maybeClickLastFour, 0);
		}
	    }
	});
	solvedCategoriesObserver.observe(solvedCategoriesContainer, {
	    childList: true,
	    subtree: true
	});
	return true;
    }

    function waitForSolvedCategoriesContainer() {
	let solvedCategoriesParent = document.querySelector(CATEGORIES_CONTAINER_PARENT_SELECTOR);
	if (!solvedCategoriesParent) {
	    solvedCategoriesParent = document;
	}
	solvedCategoriesParentObserver = new MutationObserver((mutations) => {
	    console.log(`QQQ: solvedCategoriesParentObserver: Changed ${mutations.length} nodes`);
	    let found = false;
	    for (const mutation of mutations) {
		// Only care about added nodes
		for (const node of mutation.addedNodes) {
		    if (!(node instanceof HTMLElement)) continue;
		    console.log(`QQQ: Adding node ${node.tagName}, class ${node.classList.toString()}`);

		    // node itself is div.SolvedCategories-module_flipContainer_TAG
		    if (node.tagName == "DIV" && node.classList.toString().indexOf("SolvedCategories-module_flipContainer") >= 0) {
			solvedCategoriesParentObserver.disconnect();
			setTimeout(waitForSolvedCategories, 0, node);
			found = true;
			break;
		    } else if (node.tagName == "DIV") {
			console.log(`QQQ: Skipping node with class ${node.classList.toString()}`);
		    }
		}
		// Thought: looks like the node exists
		if (found) break;
	    }
	});
	solvedCategoriesParentObserver.observe(solvedCategoriesParent, {
	    childList: true,
	    subtree: true
	});
	return true;
    }

    console.log("QQQ: Done At Three Connections completer loaded");

    const solvedCategoriesContainer = document.querySelector(CATEGORIES_CONTAINER_SELECTOR);
    if (solvedCategoriesContainer) {
	const res = waitForSolvedCategories(solvedCategoriesContainer);
	console.log(`QQQ: waitForSolvedCategories => ${res}`);
	if (res) {
	    // And check to see if there are only four items right now
	    setTimeout(maybeClickLastFour, 0);
	    return;
	}
    }
    solvedCategoriesContainerParent = document.querySelector(CATEGORIES_CONTAINER_PARENT_SELECTOR);
    if (!solvedCategoriesContainerParent) {
	
	// If there's no parent maybe we have a "Play" button. So let's wait...

	const res = waitForSolvedCategoriesContainer();
	if (!res) {
	    console.log("ERROR: ConnectionsCompleter can't find expected node where completed answers go");
	    return;
	}
    } else {
	setTimeout(maybeClickLastFour, 0);
    }

    console.log("QQQ: Done At Three Connections completer loaded");
})();

console.log("QQQ: end of connections content");

} catch(e) {
    console.error(e);
}

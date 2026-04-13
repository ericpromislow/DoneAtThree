
try {

(async function () {
    const TILE_SELECTOR = 'label[data-testid="card-label"]';
    let alreadyTriggered = false;
    const nextTileWait = 400;

    function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
    }

    const debug = false;
    const trace = false;
    function cl(...args) {
	if (debug) {
	    console.log(...args);
	}
    }
    function clt(...args) {
	if (trace) {
	    console.log(...args);
	}
    }

    const shuffleArray = function(a) {
	for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
	}
    }

    async function flashAndClickSequence(tiles) {
	const a = new Array(tiles.length);
	for (let i = 0; i < a.length; i++) {
	    a[i] = i;
	}
	shuffleArray(a);
	for (let i = 0; i < tiles.length; i++) {
	    const tile = tiles[a[i]];
	    if (tile.classList.toString().indexOf("Card-module_selected_") >= 0) {
		cl(`QQQ: tile ${i} is already selected.`);
		continue;
	    }
		
	    clt("QQQ: click")
	    // 1. Click (invoke NYT handler)
	    realClick(tile);

	    // 2. Wait before next tile
	    await sleep(nextTileWait);

	    // Just in case
	    if (tile.classList.toString().indexOf("Card-module_selected_") == -1) {
		realClick(tile);
		await sleep(nextTileWait);
	    }
	}
	// Do it once more!
	const refreshedTiles = getUnselectedTiles();
	if (refreshedTiles.some(tile => tile.classList.toString().indexOf("Card-module_selected_") == -1)) {
	    clt(`QQQ... repeating it`);
	    for (let i = 0; i < refreshedTiles.length; i++) {
		const tile = refreshedTiles[i];
		if (tile.classList.toString().indexOf("Card-module_selected_") >= 0) {
		    cl(`QQQ: tile ${i} is already selected.`);
		    continue;
		}
		
		clt("QQQ: click")
		// 1. Click (invoke NYT handler)
		realClick(tile);

		// 2. Wait before next tile
		await sleep(1);

		// Just in case
		if (tile.classList.toString().indexOf("Card-module_selected_") == -1) {
		    realClick(tile);
		    await sleep(1);
		}
	    }
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
	    clt("QQQ: already did this...");
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
	cl(`QQQ: Got ${unselectedTiles.length} tiles left — auto-clicking`);

	if (unselectedTiles.length !== 4) {
	    clt("QQQ: Have " + unselectedTiles.length + " unclicked tiles still.");
	    return;
	}
	alreadyTriggered = true;
	await flashAndClickSequence(unselectedTiles)

	if (submitButton.disabled) {
	    console.error("SUBMIT button isn't enabled");
	    return;
	}
	clt("QQQ: - click the submit button");
	realClick(submitButton);
	clt("QQQ: + click the submit button");
    }

    function selectElement(parentElement, selector, matchFunc) {
	if (matchFunc) {
	    const items = Array.from(parentElement.querySelectorAll(selector)).filter(elt => matchFunc(elt));
	    if (items.length > 0) {
		return items[0];
	    }
	    return null;
	} else {
	    return parentElement.querySelector(selector);
	}
    }

    function waitForElement(root, selector, matchFunc) {
	return new Promise((resolve, reject) => {
	    // Does the desired element exist?
	    const foundElement = selectElement(root, selector, matchFunc);
	    if (foundElement) {
		return resolve(foundElement);
	    }

	    const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
		    for (const node of mutation.addedNodes) {
			if (!(node instanceof HTMLElement)) continue;
			cl(`QQQ: waitForElement observer: Looking for selector ${selector}, got node: `, node);

			// Direct match on the node
			if (node.matches?.(selector)) {
			    cl(`QQQ: matched selector`);
			    let acceptNode = true;
			    if (matchFunc && !matchFunc(node)) {
				cl(`QQQ: failed match-func`);
				acceptNode = false;
			    }
			    if (acceptNode) {
				observer.disconnect();
				return resolve(node);
			    }
			}
			// Look to see if we're looking for a descendant of the current node
			const foundElement = selectElement(node, selector, matchFunc);
			if (foundElement) {
			    observer.disconnect();
			    return resolve(foundElement);
			}
		    }
		}
	    });
	    observer.observe(root, {
		childList: true,
		subtree: true,
	    });
	});
    }

    function haveDotsLeft() {
	const dotsSelector = 'article[data-testid="connections-board"] section span p[data-testid="mistake-text"]'
	return !! document.querySelector(dotsSelector);
    }

    async function waitForEverything() {
	const gameBoardSelector = 'article[data-testid="connections-board"]';
	const solvedCategoriesContainerParentSelector = 'article[aria-live="assertive"]';
	const solvedCategoriesContainerSelector = "ol";
	const solvedCategoriesContainerFunc = function(node) {
	    cl("QQQ: solvedCategoriesContainerFunc: node is ", node);
	    return node.classList.toString().indexOf("SolvedCategories-module_solvedCategoriesContainer_") >= 0;
	}
	try {
	    cl("QQQ: -Getting gameBoard:");
	    const gameBoard = await waitForElement(document, gameBoardSelector);
	    cl("QQQ: +Got gameBoard:", gameBoard);

	    const solvedCategoriesContainerParent = await waitForElement(gameBoard, solvedCategoriesContainerParentSelector);
	    cl("QQQ: Got solvedCategoriesContainerParent:", solvedCategoriesContainerParent);

	    const solvedCategoriesContainer = await waitForElement(solvedCategoriesContainerParent, solvedCategoriesContainerSelector, solvedCategoriesContainerFunc);
	    cl("QQQ: Got solvedCategoriesContainer:", solvedCategoriesContainer);
	    return solvedCategoriesContainer;
	} catch(ex) {
	    console.error("Error waiting for the board's container:", ex);
	}
    }

    async function getTheCategoriesParent() {
	const categoriesContainer = await waitForEverything();
	if (!categoriesContainer) {
	    console.error("categoriesContainer isn't defined... giving up");
	    return;
	}
	cl(`QQQ: getTheCategoriesParent: got categoriesContainer, is`, categoriesContainer);

	let currentGuesses = categoriesContainer.childNodes;
	switch (currentGuesses.length) {
	case 4:
	    // We're done, nothing to do
	    cl("QQQ: Got 4 solved rows, nothing left to do");
	    return;
	case 3:
	    cl("QQQ: Got 3 solved rows, try to submit the last");
	    setTimeout(maybeClickLastFour, 0);
	    return;
	}
	cl(`QQQ: Got ${currentGuesses.length} solved rows, wait for more`);
	
	const solvedCategoriesObserver = new MutationObserver((mutations) => {
	    const selector = 'h3[data-testid="solved-category-title"]';
	    cl(`QQQ: solvedCategoriesContainerObserver: Changed ${mutations.length} nodes`);
	    for (const mutation of mutations) {
		for (const node of mutation.addedNodes) {
		    if (!(node instanceof HTMLElement)) continue;
		    cl(`QQQ: solvedCategoriesObserver: Looking for selector ${selector}, got node: `, node);

		    if (node.matches?.(selector) || selectElement(node, selector, null)) {
			cl(`QQQ: solvedCategoriesObserver: Matched the selector`);
			cl(`QQQ: #children ${categoriesContainer.childNodes.length}`);
			if (categoriesContainer.childNodes.length === 3) {
			    solvedCategoriesObserver.disconnect();
			    if (haveDotsLeft()) {
				// If there are no dots it means the player made 4 wrong guesses before
				// getting 3 rows down
				setTimeout(maybeClickLastFour, 200);
			    } else {
				cl(`QQQ: haveDotsLeft() => false`);
			    }
			    return;
			}
		    }
		}
	    }
	});
	solvedCategoriesObserver.observe(categoriesContainer, {
	    childList: true,
	    subtree: true
	});
	return true;
    }

    setTimeout(getTheCategoriesParent, 0);

    cl("QQQ: Done At Three Connections completer loaded");
})();

} catch(e) {
    console.error(e);
}

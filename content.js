
try {

(async function () {
    const TILE_SELECTOR = 'label[data-testid="card-label"]';
    let alreadyTriggered = false;
    const nextTileWait = 400;

    function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function flashAndClickSequence(tiles) {
	for (let i = 0; i < tiles.length; i++) {
	    const tile = getUnselectedTiles()[i];
	    if (tile.classList.toString().indexOf("Card-module_selected_") >= 0) {
		// console.log(`QQQ: tile ${i} is already selected.`);
		continue;
	    }
		
	    // console.log("QQQ: click")
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
	    //console.log(`QQQ... repeating it`);
	    for (let i = 0; i < refreshedTiles.length; i++) {
		const tile = refreshedTiles[i];
		if (tile.classList.toString().indexOf("Card-module_selected_") >= 0) {
		    //console.log(`QQQ: tile ${i} is already selected.`);
		    continue;
		}
		
		// console.log("QQQ: click")
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
	    // console.log("QQQ: already did this...");
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
	// console.log(`QQQ: Got ${unselectedTiles.length} tiles left — auto-clicking`);

	if (unselectedTiles.length !== 4) {
	    // console.log("QQQ: Have " + unselectedTiles.length + " unclicked tiles still.");
	    return;
	}
	alreadyTriggered = true;
	await flashAndClickSequence(unselectedTiles)

	if (submitButton.disabled) {
	    console.error("SUBMIT button isn't enabled");
	    return;
	}
	// console.log("QQQ: - click the submit button");
	realClick(submitButton);
	// console.log("QQQ: + click the submit button");
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
			// console.log(`QQQ: waitForElement observer: Looking for selector ${selector}, got node: `, node);

			// Direct match on the node
			if (node.matches?.(selector)) {
			    // console.log(`QQQ: matched selector`);
			    let acceptNode = true;
			    if (matchFunc && !matchFunc(node)) {
				// console.log(`QQQ: failed match-func`);
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

    async function waitForEverything() {
	const gameBoardSelector = 'article[data-testid="connections-board"]';
	const solvedCategoriesContainerParentSelector = 'article[aria-live="assertive"]';
	const solvedCategoriesContainerSelector = "ol";
	const solvedCategoriesContainerFunc = function(node) {
	    // console.error("QQQ: solvedCategoriesContainerFunc: node is ", node);
	    return node.classList.toString().indexOf("SolvedCategories-module_solvedCategoriesContainer_") >= 0;
	}
	try {
	    const gameBoard = await waitForElement(document, gameBoardSelector);
	    // console.log("QQQ: Got gameBoard:", gameBoard);

	    const solvedCategoriesContainerParent = await waitForElement(gameBoard, solvedCategoriesContainerParentSelector);
	    // console.log("QQQ: Got solvedCategoriesContainerParent:", solvedCategoriesContainerParent);

	    const solvedCategoriesContainer = await waitForElement(solvedCategoriesContainerParent, solvedCategoriesContainerSelector, solvedCategoriesContainerFunc);
	    // console.log("QQQ: Got solvedCategoriesContainer:", solvedCategoriesContainer);
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
	// console.log(`QQQ: getTheCategoriesParent: got categoriesContainer, is`, categoriesContainer);

	let currentGuesses = categoriesContainer.childNodes;
	switch (currentGuesses.length) {
	case 4:
	    // We're done, nothing to do
	    // console.log("QQQ: Got 4 solved rows, nothing left to do");
	    return;
	case 3:
	    // console.log("QQQ: Got 3 solved rows, try to submit the last");
	    setTimeout(maybeClickLastFour, 0);
	    return;
	}
	// console.log(`QQQ: Got ${currentGuesses.length} solved rows, wait for more`);
	
	const solvedCategoriesObserver = new MutationObserver((mutations) => {
	    const selector = 'h3[data-testid="solved-category-title"]';
	    // console.log(`QQQ: solvedCategoriesContainerObserver: Changed ${mutations.length} nodes`);
	    for (const mutation of mutations) {
		for (const node of mutation.addedNodes) {
		    if (!(node instanceof HTMLElement)) continue;
		    // console.log(`QQQ: solvedCategoriesObserver: Looking for selector ${selector}, got node: `, node);

		    if (node.matches?.(selector) || selectElement(node, selector, null)) {
			// console.log(`QQQ: solvedCategoriesObserver: Matched the selector`);
			// console.log(`QQQ: #children ${categoriesContainer.childNodes.length}`);
			if (categoriesContainer.childNodes.length === 3) {
			    solvedCategoriesObserver.disconnect();
			    setTimeout(maybeClickLastFour, 0);
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

    // console.log("QQQ: Done At Three Connections completer loaded");
})();

} catch(e) {
    console.error(e);
}

function generateCombinations(inputList) {
    function recursiveCombinations(currentCombination, remainingElements, results) {
        results.push(currentCombination);

        for (let i = 0; i < remainingElements.length; i++) {
            const nextCombination = currentCombination.concat(remainingElements[i]);
            const restElements = remainingElements.slice(i + 1);
            recursiveCombinations(nextCombination, restElements, results);
        }
    }

    const allCombinations = [];
    recursiveCombinations([], inputList, allCombinations);
    return allCombinations;
}


function areElementsCompatible(element1, element2, compatibilityMap) {
    return compatibilityMap[element1][element2] && compatibilityMap[element2][element1];
}

function filterCompatibleCombinations(combinations, compatibilityMap) {
    return combinations.filter((combination) => {
        for (let i = 0; i < combination.length; i++) {
            for (let j = i + 1; j < combination.length; j++) {
                if (!areElementsCompatible(combination[i], combination[j], compatibilityMap)) {
                    return false;
                }
            }
        }
        return true;
    });
}

function findMaximumCombination(compatibleCombinations) {
    let maxLength = 0;
    let maxList = null;

    for (const list of compatibleCombinations) {
        if (list.length > maxLength) {
            maxLength = list.length;
            maxList = list;
        }
    }

    return maxList;
}

function containsElement(list, element) {
    return list.includes(element);
  }
  
function filterListsWithElement(listOfLists, element) {
    return listOfLists.filter((list) => containsElement(list, element));
}

function findMaximumCompatibleCombination(compatibilityMap, elements, original_element) {
    const combinations = generateCombinations(elements);
    const compatibleCombinations = filterCompatibleCombinations(combinations, compatibilityMap);
    const filteredCompatibleCombinations = filterListsWithElement(compatibleCombinations, original_element);

    return findMaximumCombination(filteredCompatibleCombinations)
}

module.exports = {
    findMaximumCompatibleCombination
}
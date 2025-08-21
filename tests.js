const consoleErrorStyle = "color: red; font-weight: bold;"
const consoleGoodStyle = "color: green; font-weight: bold;"

/**
 * tests to verify that the correct time signature is computed based on metric tree
 */
const TIME_SIGNATURE_TESTS = [
    {
        name: "Does She Know 21/8",
        tree: DOES_SHE_KNOW,
        expectedResult: "21/8"
    },
    {
        name: "4+4+3 11/16",
        tree: lls_11_16,
        expectedResult: "11/16"
    },
    {
        name: "Basic 3/4",
        tree: [[],[],[]],
        expectedResult: "3/4"
    },
    {
        name: "Duple Subdivided 3/4",
        tree: [[[],[]],[[],[]],[[],[]]],
        expectedResult: "3/4"
    },
    {
        name: "Quadruple Subdivided 3/4",
        tree: [
            [[],[],[],[]],
            [[],[],[],[]],
            [[],[],[],[]]
        ],
        expectedResult: "3/4"
    },
    {
        name: "Doubly duple Subdivided 3/4",
        tree: [
            [[[],[]],[[],[]]],
            [[[],[]],[[],[]]],
            [[[],[]],[[],[]]]
        ],
        expectedResult: "3/4"
    },
    {
        name: "Basic 4/4",
        tree: [[],[],[],[]],
        expectedResult: "4/4"
    },
    {
        name: "Duple then quadruple subdivided 4/4",
        tree: [
            [[[],[],[],[]],[[],[],[],[]]],
            [[[],[],[],[]],[[],[],[],[]]],
            [[[],[],[],[]],[[],[],[],[]]],
            [[[],[],[],[]],[[],[],[],[]]]
        ],
        expectedResult: "4/4"
    },
    {
        name: "Five layer binary tree",
        tree: BINARY_TREE,
        expectedResult: "2/4"
    },
    {
        name: "Threshold Concept",
        tree: THRESHOLD_CONCEPT,
        expectedResult: "76/64"
    },
    {
        name: "Threshold Detailed",
        tree: THRESHOLD_DETAILED,
        expectedResult: "76/64"
    },
    {
        name: "4+4+4+3",
        tree: [
            [[],[],[],[]],
            [[],[],[],[]],
            [[],[],[],[]],
            [[],[],[]],
        ],
        expectedResult: "15/16"
    },
    {
        name: "3+3+3+3+3",
        tree: [
            [[],[],[]],
            [[],[],[]],
            [[],[],[]],
            [[],[],[]],
            [[],[],[]]
        ],
        expectedResult: "15/8"
    },
    {
        name: "Untitled Odd Time Combo Tune",
        tree: [
            [[[],[]],[[],[]],[[],[],[]]],
            [[[],[]],[[],[],[]]],
            [[[],[]],[[],[],[]]],
        ],
        expectedResult: "17/16"
    },
    {
        name: "Untitled Odd Time Combo Tune Low-res",
        tree: [
            [[],[],[],[],[],[],[]],
            [[],[],[],[],[]],
            [[],[],[],[],[]],
        ],
        expectedResult: "17/16"
    },
    {
        name: "Quintuplet Swing 4/4",
        tree: [[[[],[],[]],[[],[]]],[[[],[],[]],[[],[]]],[[[],[],[]],[[],[]]],[[[],[],[]],[[],[]]]],
        expectedResult: "20/16"
    },
    {
        name: "3+2 5/16",
        tree: [[[[],[],[]],[[],[]]]],
        expectedResult: "5/16"
    },
    {
        name: "12/8 but in sextuplets",
        tree: [[[],[],[],[],[],[]],[[],[],[],[],[],[]],[[],[],[],[],[],[]],[[],[],[],[],[],[]]],
        expectedResult: "12/8"
    },
    {
        name: "Empty list",
        tree: [],
        expectedResult: "?"
    }
]

const GENERIC_TESTS = [
    {
        name: "mtsStringIsValid empty string",
        func: () => {
            return mtsStringIsValid("") === true;
        }
    },
    {
        name: "mtsStringIsValid single number",
        func: () => {
            return mtsStringIsValid("4") === true;
        }
    },
    {
        name: "mtsStringIsValid empty list",
        func: () => {
            return mtsStringIsValid("[]") === false;
        }
    },
    {
        name: "mtsStringIsValid asterisk without something to multiply",
        func: () => {
            return mtsStringIsValid("*[2]") === false;
        }
    },
    {
        name: "mtsStringIsValid asterisk without a multiplier",
        func: () => {
            return mtsStringIsValid("[2*]") === false;
        }
    },
    {
        name: "mtsStringIsValid good multiplier",
        func: () => {
            return mtsStringIsValid("[2*3]") === true;
        }
    },
    {
        name: "mtsStringIsValid multiple multipliers",
        func: () => {
            return mtsStringIsValid("[2*3*3]") === false;
        }
    },
    {
        name: "mtsStringIsValid number too big",
        func: () => {
            return mtsStringIsValid(`[${maxActualValue+1},3]`) === false;
        }
    },
    {
        name: "mtsStringIsValid number too small",
        func: () => {
            return mtsStringIsValid(`[${minActualValue-1},3]`) === false;
        }
    },
    {
        name: "mtsStringIsValid inconsistent depths",
        func: () => {
            return mtsStringIsValid("[[2,3],[[3,2],[2,3]]]") === false;
        }
    },
    {
        name: "mtsObjectContainsMultipleMultipliersInARow test 1",
        func: () => {
            return mtsObjectContainsMultipleMultipliersInARow([{multiplier:3}, {multiplier:3}]) === true;
        }
    },
    {
        name: "mtsObjectContainsMultipleMultipliersInARow test 2",
        func: () => {
            return mtsObjectContainsMultipleMultipliersInARow([2, {multiplier:1}]) === false;
        }
    },
    {
        name: "mtsObjectContainsMultipleMultipliersInARow test 3",
        func: () => {
            return mtsObjectContainsMultipleMultipliersInARow([[[2,3],{multiplier:2},[3,2]],{multiplier:3}]) === false;
        }
    },
    {
        name: "mtsObjectContainsMultipleMultipliersInARow test 4",
        func: () => {
            return mtsObjectContainsMultipleMultipliersInARow([[[2,3],{multiplier:2},{multiplier:7},[3,2]],{multiplier:3}]) === true;
        }
    },
    {
        name: "mtsObjectIsValid single number",
        func: () => {
            return mtsObjectIsValid(4) === true;
        }
    },
    {
        name: "mtsObjectIsValid empty list",
        func: () => {
            return mtsObjectIsValid([]) === false;
        }
    },
    {
        name: "mtsObjectIsValid nested lists",
        func: () => {
            return mtsObjectIsValid([[2,3],[3,4]]) === true;
        }
    },
    {
        name: "mtsObjectIsValid value too big",
        func: () => {
            return mtsObjectIsValid([[2,maxActualValue+1],[3,4]]) === false;
        }
    },
    {
        name: "mtsObjectIsValid value just barely small enough",
        func: () => {
            return mtsObjectIsValid([[2,maxActualValue-1],[3,4]]) === true;
        }
    },
    {
        name: "mtsObjectIsValid leaf nodes at different depths via leaf and nonleaf children on the same node",
        func: () => {
            try{
                mtsObjectUniformDepth([2,[3,4]]) === false;
                return false;
            }
            catch{
                return true;
            }
        }
    },
    {
        name: "mtsObjectIsValid leaf nodes at different depths without any nodes having a leaf and nonleaf child",
        func: () => {
            try{
                mtsObjectUniformDepth([[2,3],[[3,2],[2,3]]])
                return false;
            }
            catch{
                return true;
            }
        }
    },
    {
        name: "convertRepeatedStructureFlat shallow",
        func: () => {
            return JSON.stringify(applyMtsMultipliersFlat([3,{multiplier:3}])) === "[3,3,3]";
        }
    },
    {
        name: "convertRepeatedStructureFlat deep",
        func: () => {
            return JSON.stringify(applyMtsMultipliersFlat([[[3,3],[2,2,3]],{multiplier:2}])) 
                === "[[[3,3],[2,2,3]],[[3,3],[2,2,3]]]";
        }
    },
    {
        name: "convertRepeatedStructureRecursive shallow",
        func: () => {
            return JSON.stringify(applyMtsMultipliersRecursive([3,{multiplier:3}])) === "[3,3,3]";
        }
    },
    {
        name: "convertRepeatedStructureRecursive deep",
        func: () => {
            return JSON.stringify(applyMtsMultipliersRecursive([[[3,{multiplier:2}],[5,6],{multiplier:3}],{multiplier:2}])) 
                === "[[[3,3],[5,6],[5,6],[5,6]],[[3,3],[5,6],[5,6],[5,6]]]";
        }
    },
    {
        name: "convertMtsToNestedLists single number",
        func: () => {
            return JSON.stringify(convertMtsToNestedLists(2)) === "[[],[]]";
        }
    },
    {
        name: "convertMtsToNestedLists several numbers",
        func: () => {
            return JSON.stringify(convertMtsToNestedLists([3,4,4])) === "[[[],[],[]],[[],[],[],[]],[[],[],[],[]]]";
        }
    },
    {
        name: "convertMtsToNestedLists threshold detailed",
        func: () => {
            return JSON.stringify(convertMtsToNestedLists([[6,6,7],[6,6,7],[6,6,7],[6,6,7]])) === JSON.stringify(THRESHOLD_DETAILED);
        }
    },
    {
        name: "parseMts empty string",
        func: () => {
            return JSON.stringify(parseMts("")) === "[]";
        }
    },
    {
        name: "parseMts single number",
        func: () => {
            return JSON.stringify(parseMts("14")) === "[[[],[],[],[],[],[],[],[],[],[],[],[],[],[]]]";
        }
    },
    {
        name: "parseMts single multiplier",
        func: () => {
            return JSON.stringify(parseMts("2*3")) === "[[[],[]],[[],[]],[[],[]]]";
        }
    },
    {
        name: "parseMts two multipliers",
        func: () => {
            return JSON.stringify(parseMts("2*3+3*2")) === "[[[],[]],[[],[]],[[],[]],[[],[],[]],[[],[],[]]]";
        }
    },
    {
        name: "parseMts complex example 1",
        func: () => {
            return JSON.stringify(parseMts("[2+3*2]*2+[3+2*2]*3"))
                === "[[[[],[]],[[],[],[]],[[],[],[]]],[[[],[]],[[],[],[]],[[],[],[]]],[[[],[],[]],[[],[]],[[],[]]],[[[],[],[]],[[],[]],[[],[]]],[[[],[],[]],[[],[]],[[],[]]]]";
        }
    },
    {
        name: "parseMts 12-bar-blues",
        func: () => {
            return JSON.stringify(parseMts("[[3*4]*4]*3")) === JSON.stringify(BLUES_12_BARS);
        }
    },
    {
        name: "parseMts zero multiplier",
        func: () => {
            return JSON.stringify(parseMts("3+2*0")) === JSON.stringify([[[],[],[]]]);
        }
    },
    {
        name: "MetricTree pre-prune",
        func: () => {
            let t = new MetricTree(parseMts("1*4"));
            return t.getDepth() === 2;
        }
    },
    {
        name: "MetricTree post-prune",
        func: () => {
            let t = new MetricTree(parseMts("1*4"));
            t.pruneLeaves();
            return t.getDepth() === 1;
        }
    },
    {
        name: "GENERIC_TESTS duplicate names",
        func: () => {
            let dict = {};
            GENERIC_TESTS.forEach(item => {
                if (item.name in dict){
                    throw new Error(`Duplicate name \"${item.name}\" in GENERIC_TESTS`)
                }
                dict[item.name] = true;
            });

            return true;
        }
    }
]

function runTimeSignatureTests(){
    let passedCount = 0;
    TIME_SIGNATURE_TESTS.forEach(test => {
        let tree = new MetricTree(test.tree);
        let passed = tree.getTimeSignature() === test.expectedResult;
        if (!passed){
            console.log(`%cTest \"${test.name}\" FAILED:`, consoleErrorStyle, test);
        }
        else{
            passedCount += 1;
        }
    })
    if (passedCount === TIME_SIGNATURE_TESTS.length){
        console.log(`%c${passedCount}/${TIME_SIGNATURE_TESTS.length} time signature tests passed`, consoleGoodStyle);
    }
    else{
        console.log(`%c${TIME_SIGNATURE_TESTS.length - passedCount}/${TIME_SIGNATURE_TESTS.length} time signature tests failed`, consoleErrorStyle);
    }
}

function runGenericTests(){
    let passedCount = 0;
    GENERIC_TESTS.forEach(test => {
        try{
            if (!test.func()){
                console.log(`%cTest \"${test.name}\" FAILED:`, consoleErrorStyle, test);
            }
            else{
                passedCount += 1;
            }
        }
        catch(e){
            console.error(`Test \"${test.name}\" FAILED: ${e}`);
        }
    });
    if (passedCount === GENERIC_TESTS.length){
        console.log(`%c${passedCount}/${GENERIC_TESTS.length} generic tests passed`, consoleGoodStyle);
    }
    else{
        console.log(`%c${GENERIC_TESTS.length - passedCount}/${GENERIC_TESTS.length} generic tests failed`, consoleErrorStyle);
    }
}

function runTests(){
    runTimeSignatureTests();
    runGenericTests();
}

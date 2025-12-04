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
        tree: LLS_11_16,
        expectedResult: "11/16"
    },
    {
        name: "Basic 3/4",
        tree: "1*3",
        expectedResult: "3/4"
    },
    {
        name: "Duple Subdivided 3/4",
        tree: "2*3",
        expectedResult: "3/4"
    },
    {
        name: "Quadruple Subdivided 3/4",
        tree: "4*3",
        expectedResult: "3/4"
    },
    {
        name: "Doubly duple Subdivided 3/4",
        tree: "[2*2]*3",
        expectedResult: "3/4"
    },
    {
        name: "Basic 4/4",
        tree: "1*4",
        expectedResult: "4/4"
    },
    {
        name: "Duple then quadruple subdivided 4/4",
        tree: "[4+4]*4",
        expectedResult: "4/4"
    },
    {
        name: "Five layer binary tree",
        tree: BINARY_TREE,
        expectedResult: "2/4"
    },
    {
        name: "Eight layer binary tree",
        tree: BINARY_TREE_LARGE,
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
        tree: "4+4+4+3",
        expectedResult: "15/16"
    },
    {
        name: "3+3+3+3+3",
        tree: "3+3+3+3+3",
        expectedResult: "15/8"
    },
    {
        name: "Untitled Odd Time Combo Tune",
        tree: "[2+2+3] + [2+3] + [2+3]",
        expectedResult: "17/16"
    },
    {
        name: "Untitled Odd Time Combo Tune Low-res",
        tree: "7+5+5",
        expectedResult: "17/16"
    },
    {
        name: "Quintuplet Swing 4/4",
        tree: "[3+2]*4",
        expectedResult: "20/16"
    },
    {
        name: "3+2 5/16",
        tree: "[3+2]",
        expectedResult: "5/16"
    },
    {
        name: "12/8 but in sextuplets",
        tree: "6*4",
        expectedResult: "12/8"
    }
]

const GENERIC_TESTS = [
    {
        name: "mts empty string",
        func: () => createTreeFromMts("").equals(JSON.parse('{"children":[],"ratio":1}'))
    },
    {
        name: "mts single number",
        func: () => createTreeFromMts("4").equals(JSON.parse('{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts two numbers",
        func: () => createTreeFromMts("4+3").equals(JSON.parse('{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts brackets basic",
        func: () => createTreeFromMts("[4]").equals(JSON.parse('{"children":[{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts brackets medium",
        func: () => createTreeFromMts("[4+3]+[3+4]").equals(JSON.parse('{"children":[{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1},{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts brackets nested",
        func: () => createTreeFromMts("[[4+3]+[3+4]]+[[3+4]+[4+3]]").equals(JSON.parse('{"children":[{"children":[{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1},{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}],"ratio":1},{"children":[{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1},{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts with spaces",
        func: () => createTreeFromMts(" [4 +3 ]   +                 [ 3+ 4]").equals(JSON.parse('{"children":[{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1},{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts multiplier basic",
        func: () => createTreeFromMts("3*2").equals(JSON.parse('{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts multiplier medium",
        func: () => createTreeFromMts("4*2+3*3").equals(JSON.parse('{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts multiplier with nesting",
        func: () => createTreeFromMts("[[4+3]*2] + [[4*2]+[4+3]]").equals(createTreeFromMts("[[4+3]+[4+3]] + [[4+4]+[4+3]]"))
    },
    {
        name: "mts tuplet",
        func: () => createTreeFromMts("4:3+4").equals(JSON.parse('{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1.3333333333333333},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts tuplet + multiplier",
        func: () => createTreeFromMts("3:4*2+4*3").equals(JSON.parse('{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":0.75},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":0.75},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts with everything",
        func: () => createTreeFromMts("[[4*2+3]:12+[5:6*2+5+6+7+6+5]:48]+[[3*3]+[4*3]]").equals(JSON.parse('{"children":[{"children":[{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":0.9166666666666666},{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":0.8333333333333334},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":0.8333333333333334},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":0.8541666666666666}],"ratio":1},{"children":[{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1},{"children":[{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1},{"children":[{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1},{"children":[],"ratio":1}],"ratio":1}],"ratio":1}],"ratio":1}],"ratio":1}'))
    },
    {
        name: "mts asterisk without something to multiply",
        func: () => {
            try{
                createTreeFromMts("*[2]");
                return false;
            }
            catch{
                return true;
            }
        }
    },
    {
        name: "mts asterisk without a multiplier",
        func: () => {
            try{
                createTreeFromMts("[2*]");
                return false;
            }
            catch{
                return true;
            }
        }
    },
    {
        name: "mts multiple multipliers",
        func: () => {
            try{
                createTreeFromMts("[2*3*3]");
                return false;
            }
            catch{
                return true;
            }
        }
    },
    {
        name: "mts node number too big",
        func: () => {
            try{
                createTreeFromMts(`[${maxNodeNumber+1}+3]`);
                return false;
            }
            catch{
                return true;
            }
        }
    },
    {
        name: "mts node number too small",
        func: () => {
            try{
                createTreeFromMts(`${minNodeNumber-1}+3`);
                return false;
            }
            catch{
                return true;
            }
        }
    },
    {
        name: "mts inconsistent depths",
        func: () => {
            createTreeFromMts("[[2+3]+[[3+2]+[2+3]]]");
            return true;
        }
    },
    {
        name: "mts multiple multipliers in a row",
        func: () => {
            try{
                createTreeFromMts("2**3")
                return false;
            }
            catch{
                return true;
            }
        }
    },
    {
        name: "mts zero multiplier",
        func: () => {
            return JSON.stringify(createTreeFromMts("3+2*0")) === JSON.stringify(createTreeFromMts("3"));
        }
    },
    {
        name: "MetricTree no pruning",
        func: () => {
            let t = createTreeFromMts("1*4", false);
            return t.getMaxDepth() === 2;
        }
    },
    {
        name: "MetricTree with pruning",
        func: () => {
            let t = createTreeFromMts("1*4");
            return t.getMaxDepth() === 1;
        }
    },
    {
        name: "Prune with tuplets",
        func: () => {
            let t = createTreeFromMts("1:3+1:3");
            t.pruneLeaves();
            return t.getMaxDepth() === 2;
        }
    },
    {
        name: "Prune with n:1 where n > 1",
        func: () => {
            let t = createTreeFromMts("1+3:1");
            t.pruneLeaves();
            return t.getMaxDepth() === 2;
        }
    },
    {
        name: "Prune with variable depth",
        func: () => {
            let t = createTreeFromMts("4+[1]");
            t.pruneLeaves();
            return t.getMaxDepth() === 3;
        }
    },
    {
        name: "Prune [1]:2",
        func: () => {
            let t = createTreeFromMts("[1]:2");
            t.pruneLeaves();
            return t.getMaxDepth() === 2;
        }
    },
    {
        name: "Prune [1:2]",
        func: () => {
            let t = createTreeFromMts("[1:2]");
            t.pruneLeaves();
            return t.getMaxDepth() === 3;
        }
    },
    {
        name: "Prune complex",
        func: () => {
            let t = createTreeFromMts("4+5:1+[1]");
            t.pruneLeaves();
            return t.getMaxDepth() === 3;
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
    },
    {
        name: "Leaf node portion values",
        func: () => {
            let tree_ = new MetricTree();

            tree_.addChild(new MetricTree());
            for (let k = 0; k < 2; k++){
                const child = new MetricTree();
                for (let w = 0; w < 2; w++){
                    child.addChild(new MetricTree());
                }
                tree_.children[0].addChild(child);
            }

            const lastBeat = new MetricTree(5/4);
            const lastBeatSubDiv1 = new MetricTree(2/3);
            const lastBeatSubDiv2 = new MetricTree();
            for (let i = 0; i < 2; i++){
                lastBeatSubDiv1.addChild(new MetricTree());
                lastBeatSubDiv2.addChild(new MetricTree());
            }
            lastBeat.addChild(lastBeatSubDiv1);
            lastBeat.addChild(lastBeatSubDiv2);

            tree_.addChild(lastBeat);

            return JSON.stringify(tree_.getLeafNodeCyclePortionValues()) === JSON.stringify([0, 0.125, 0.25, 0.375, 0.5, 0.65, 0.8, 0.9]);
        }
    },
    {
        name: "Tokenizing invalid character",
        func: () => {
            try{
                parseTokens("n");
                return false;
            } 
            catch{
                return true;
            }
        }
    },
    {
        name: "Tokenizing invalid character within otherwise valid mts",
        func: () => {
            try{
                parseTokens("3+4n+3");
                return false;
            } 
            catch{
                return true;
            }
        }
    },
    {
        name: "Tokenizing max number",
        func: () => {
            try{
                parseTokens(`[${maxValueAll+1}+3]`);
                return false;
            }
            catch{
                return true;
            }
        }
    },
    {
        name: "Tokenizing complex",
        func: () => {
            return JSON.stringify(parseTokens(" [ 6+6:5 +5*2]:19 + [4*5]")) === "[{\"value\":\"[\",\"idx\":1,\"length\":1},{\"value\":6,\"idx\":3,\"length\":1},{\"value\":\"+\",\"idx\":4,\"length\":1},{\"value\":6,\"idx\":5,\"length\":1},{\"value\":\":\",\"idx\":6,\"length\":1},{\"value\":5,\"idx\":7,\"length\":1},{\"value\":\"+\",\"idx\":9,\"length\":1},{\"value\":5,\"idx\":10,\"length\":1},{\"value\":\"*\",\"idx\":11,\"length\":1},{\"value\":2,\"idx\":12,\"length\":1},{\"value\":\"]\",\"idx\":13,\"length\":1},{\"value\":\":\",\"idx\":14,\"length\":1},{\"value\":19,\"idx\":15,\"length\":2},{\"value\":\"+\",\"idx\":18,\"length\":1},{\"value\":\"[\",\"idx\":20,\"length\":1},{\"value\":4,\"idx\":21,\"length\":1},{\"value\":\"*\",\"idx\":22,\"length\":1},{\"value\":5,\"idx\":23,\"length\":1},{\"value\":\"]\",\"idx\":24,\"length\":1}]";
        }
    },
    {
        name: "Leftmost Leaf Detection depth 0",
        func: () => {
            const tree = createTreeFromMts("3+2");
            return tree.leafIsLeftmostAtDepth(0, 0, 0);
        }
    },
    {
        name: "Leftmost Leaf Detection depth 1",
        func: () => {
            const tree = createTreeFromMts("3+2");
            return tree.leafIsLeftmostAtDepth(3, 1, 0);
        }
    },
    {
        name: "Leftmost Leaf Detection depth 2",
        func: () => {
            const tree = createTreeFromMts("[3+2]+[2+3]");
            return tree.leafIsLeftmostAtDepth(3, 2, 0);
        }
    },
    {
        name: "min depth with node whose leftmost leaf is this test 1",
        func: () => {
            const tree = createTreeFromMts("[3+2]+[2+3]");
            return tree.minDepthContainingNodeWhoseLeftMostLeafIsThis(0) === 0;
        }
    },
    {
        name: "min depth with node whose leftmost leaf is this test 2",
        func: () => {
            const tree = createTreeFromMts("[3+2]+[2+3]");
            return tree.minDepthContainingNodeWhoseLeftMostLeafIsThis(3) === 2;
        }
    },
    {
        name: "min depth with node whose leftmost leaf is this test 3",
        func: () => {
            const tree = createTreeFromMts("3+3+3+3");
            return tree.minDepthContainingNodeWhoseLeftMostLeafIsThis(6) === 1;
        }
    },
    {
        name: "min depth with node whose leftmost leaf is this test 4",
        func: () => {
            const tree = createTreeFromMts("3*4");
            return tree.minDepthContainingNodeWhoseLeftMostLeafIsThis(6) === 1;
        }
    },
    {
        name: "progress subsets test 1",
        func: () => {
            const tree1 = createTreeFromMts("3");
            const tree2 = createTreeFromMts("2+3:4");
            return !listDiffsIsSubsequenceOfOther(tree1.getLeafNodeCyclePortionValues(), tree2.getLeafNodeCyclePortionValues(), tree1.getTrueWidth() / tree2.getTrueWidth());
        }
    },
    {
        name: "progress subsets test 2",
        func: () => {
            const tree1 = createTreeFromMts("3");
            const tree2 = createTreeFromMts("2+3");
            return listDiffsIsSubsequenceOfOther(tree1.getLeafNodeCyclePortionValues(), tree2.getLeafNodeCyclePortionValues(), tree1.getTrueWidth() / tree2.getTrueWidth());
        }
    },
    {
        name: "preset sameness test accounts for undefined vars in preset",
        func: () => {
            const preset = JSON.parse(JSON.stringify(presets[0]));
            return patchEquals(
                preset,
                {
                    nodeNumberMode: nodeNumberModeOptions[0],
                    hue: 30,
                    leafTempo: 160*2,
                    accentDownbeat: true,
                    pitchesHighToLow: true,
                    pitchSpread: 1.5,
                    volumeFalloff: 0.5,
                    audioSample: audioSampleOptions[0],
                    numLayersMuted: 0,
                    mtsUpper: "3+2*4",
                    mtsLower: null,
                    displayTempoMode: displayTempoOptions[1],
                    lowerTreeAudioSample: audioSampleOptions[0],
                    lowerTreeActive: false,
                    upperTreePanning: 0,
                    lowerTreeAccentDownbeat: false
                }
            )
        }
    }
]

function runTimeSignatureTests(){
    let passedCount = 0;
    TIME_SIGNATURE_TESTS.forEach(test => {
        try{
            let tree = createTreeFromMts(test.tree);
            let passed = tree.getTimeSignature() === test.expectedResult;
            if (!passed){
                console.log(`%cTest \"${test.name}\" FAILED:`, consoleErrorStyle, test);
            }
            else{
                // console.log(`%cTest \"${test.name}\" succeeded:`, consoleGoodStyle, test);
                passedCount += 1;
            }
        }
        catch(e){
            console.error(`Test \"${test.name}\" FAILED (ERROR): ${e}`);
        }
    });
    console.log(`%c${passedCount}/${TIME_SIGNATURE_TESTS.length} time signature tests passed`, consoleGoodStyle);
    if (passedCount !== TIME_SIGNATURE_TESTS.length){
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
                // console.log(`%cTest \"${test.name}\" succeeded:`, consoleGoodStyle, test);
                passedCount += 1;
            }
        }
        catch(e){
            console.error(`Test \"${test.name}\" FAILED (ERROR): ${e}`);
        }
    });
    console.log(`%c${passedCount}/${GENERIC_TESTS.length} generic tests passed`, consoleGoodStyle);
    if (passedCount !== GENERIC_TESTS.length){
        console.log(`%c${GENERIC_TESTS.length - passedCount}/${GENERIC_TESTS.length} generic tests failed`, consoleErrorStyle);
    }
}

function runTests(){
    runTimeSignatureTests();
    runGenericTests();
}

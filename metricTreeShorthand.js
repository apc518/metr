function deepCopy(obj){
    return JSON.parse(JSON.stringify(obj));
}

function makeTree(){
    let tree_ = new MetricTree();

    tree_ = createTreeFromMts("3+2");
    tree_ = createTreeFromMts("[4]");
    // tree_ = createTreeFromMts("4:3*2+4*2");
    // tree_ = createTreeFromMts("[[4*2+3]:12+[5:6*2+5]:16]+5");
    // tree_ = createTreeFromMts("[5+4+5]:16 + [5+6:5+5]:16");
    tree_ = createTreeFromMts("3:4*2+4*3");
    tree_ = createTreeFromMts("1:3+1:3");
    // tree_ = createTreeFromMts("[[2+2]+[2+2]]+[[2+2]+[2+2]]");
    // tree_ = createTreeFromMts("[[4+3]*2]     + [[4*2]+[4+3]]");
    // tree_ = createTreeFromMts("[[4+3]+[4+3]] + [[4+4]+[4+3]]");
    // tree_ = createTreeFromMts("2*3*3");
    // tree_ = createTreeFromMts("[[4*2+3]:12+[5:6*2+5+6+7+6+5]:48]+[[3*3]+[4*3]]");
    // tree_ = createTreeFromMts("3*0+2");
    // tree_ = createTreeFromMts("[2*3*3]");
    // tree_ = createTreeFromMts("4:3+4");
    // tree_ = createTreeFromMts(BINARY_TREE_LARGE);

    // tree_.addChild(new MetricTree());
    // for (let k = 0; k < 3; k++){
    //     const child = new MetricTree();
    //     for (let w = 0; w < 2; w++){
    //         child.addChild(new MetricTree());
    //     }
    //     tree_.children[0].addChild(child);
    // }

    // const lastBeat = new MetricTree(6/5);
    // const lastBeatSubDiv1 = new MetricTree(2/3);
    // const lastBeatSubDiv2 = new MetricTree();
    // for (let i = 0; i < 2; i++){
    //     lastBeatSubDiv1.addChild(new MetricTree());
    //     lastBeatSubDiv2.addChild(new MetricTree());
    // }
    // lastBeatSubDiv2.addChild(new MetricTree());
    // lastBeat.addChild(lastBeatSubDiv1);
    // lastBeat.addChild(lastBeatSubDiv2);

    // tree_.addChild(lastBeat);

    // tree_.addChild(new MetricTree(2/3));
    // tree_.addChild(new MetricTree());

    // tree_.children[0].addChild(new MetricTree())
    // tree_.children[0].addChild(new MetricTree())

    // tree_.children[1].addChild(new MetricTree())
    // tree_.children[1].addChild(new MetricTree())
    // tree_.children[1].addChild(new MetricTree())

    // tree_.addChild(new MetricTree())


    //// [5+4+5]:16 + [5+6+5]

    // const child1 = new MetricTree(7/8);
    // const child2 = new MetricTree();

    // const child1child1 = new MetricTree();
    // const child1child2 = new MetricTree();
    // const child1child3 = new MetricTree();

    // const child2child1 = new MetricTree();
    // const child2child2 = new MetricTree();
    // const child2child3 = new MetricTree();

    // Array.from({length: 5}, () => {
    //     child1child1.addChild(new MetricTree());
    //     child1child3.addChild(new MetricTree());
    //     child2child1.addChild(new MetricTree());
    //     child2child3.addChild(new MetricTree());
    // })

    // Array.from({length: 4}, () => {
    //     child1child2.addChild(new MetricTree());
    // })

    // Array.from({length: 6}, () => {
    //     child2child2.addChild(new MetricTree());
    // })

    // child1.addChild(child1child1);
    // child1.addChild(child1child2);
    // child1.addChild(child1child3);

    // child2.addChild(child2child1);
    // child2.addChild(child2child2);
    // child2.addChild(child2child3);

    // tree_.addChild(child1);
    // tree_.addChild(child2);

    return tree_;
}

const maxNodeNumber = 1000;
const minNodeNumber = 1;
const maxValueAll = 1000;
const minValueAll = 0;

const SUBTREE_SCOPE_OPEN = "[";
const SUBTREE_SCOPE_CLOSE = "]";
const ADDITION_OPERATOR = "+";
const TUPLET_OPERATOR = ":";
const MULTIPLY_OPERATOR = "*";
const DIGITS = "0123456789";

const SPACING_CHARACTERS = " "; // characters that wont be parsed into tokens but are allowed in between tokens

/**
 * Returns a list of tokens from a raw mts string.
 * 
 * Tokens have the form { value, idx, length }
 */
function parseTokens(mts){
    const tokens = [];

    for (let charIdx = 0; charIdx < mts.length; charIdx++){
        // console.log(`looking at charIdx=${charIdx} (\"${mts[charIdx]}\")`);
        if ([SUBTREE_SCOPE_OPEN, SUBTREE_SCOPE_CLOSE, ADDITION_OPERATOR, TUPLET_OPERATOR, MULTIPLY_OPERATOR].includes(mts[charIdx])){
            tokens.push({
                value: mts[charIdx],
                idx: charIdx,
                length: 1
            });
        }
        else if (DIGITS.includes(mts[charIdx])){
            let digitString = mts[charIdx];
            while (DIGITS.includes(mts[charIdx+1])){
                digitString = digitString + mts[charIdx+1];
                charIdx += 1;
            }

            const val = parseInt(digitString);

            if (typeof val !== "number"){
                throw new Error(`\"${digitString}\" at index ${charIdx - digitString.length + 1} could not be parsed as a number`);
            }
            if (val !== Math.floor(val)){
                throw new Error(`Number \"${digitString}\" at index ${charIdx - digitString.length + 1} is not an integer.`);
            }
            if (val > maxValueAll){
                throw new Error(`Number \"${digitString}\" at index ${charIdx - digitString.length + 1} is too large (max ${maxValueAll})`);
            }
            if (val < minValueAll){
                throw new Error(`Number \"${digitString}\" at index ${charIdx - digitString.length + 1} is too small (min ${minValueAll})`);
            }

            tokens.push({
                value: val,
                idx: charIdx - digitString.length + 1,
                length: digitString.length
            });
        }
        else if (!SPACING_CHARACTERS.includes(mts[charIdx])){
            throw new Error(`Invalid character \"${mts[charIdx]}\" at index ${charIdx}`);
        }
    }

    return tokens;
}

function createTreeFromMts(mts){
    const tokens = parseTokens(mts);

    // console.log("tokens:", tokens);

    let leafIndex = 0;
    
    let i = 0;

    function increment(){
        i += 1;
        // console.log(`tokens[${i}]: \"${tokens[i]?.value}\"`);
    }

    function makeTreeRecursive(tree){
        if (!tokens[i]) return;

        if (typeof tokens[i].value === "number"){
            // console.log(`Parsing i=${i}, token: ${tokens[i].value}`);
            if (i > 0 && !([ADDITION_OPERATOR, SUBTREE_SCOPE_OPEN].includes(tokens[i-1].value))){
                throw new Error("This error shouldnt be possible, please report to Andy what triggered it! Regular number parsing block entered but previous token was not addition operator or subtree scope open");
            }

            if (tokens[i].value < minNodeNumber){
                throw new Error(`Node number too small: ${tokens[i].value} at index ${tokens[i].idx} (min ${minNodeNumber})`)
            }
            
            if (tokens[i].value > maxNodeNumber){
                throw new Error(`Node number too big: ${tokens[i].value} at index ${tokens[i].idx} (max ${maxNodeNumber})`)
            }

            const child = new MetricTree();
            
            child.index = leafIndex;
            leafIndex += 1;

            Array.from({length: tokens[i].value}, () => child.addChild(new MetricTree()));
            tree.addChild(child);
        }
        else if (tokens[i].value === SUBTREE_SCOPE_OPEN){
            const child = new MetricTree();
            increment();
            makeTreeRecursive(child);
            tree.addChild(child);
        }
        else{
            throw new Error(`Expected number or open bracket at index ${tokens[i].idx}`);
        }

        increment();

        if (!tokens[i]) return;

        if (tokens[i].value === TUPLET_OPERATOR){
            increment();
            if (typeof tokens[i].value !== "number"){
                throw new Error(`Number expected after tuplet operator \"${tokens[i-1].value}\" at index ${tokens[i].idx}, instead got: \"${tokens[i].value}\"`)
            }
            const lastChild = tree.children[tree.children.length - 1];
            lastChild.ratio = lastChild.getTrueWidth() / tokens[i].value;
            increment();
        }

        if (!tokens[i]) return;
        
        if (tokens[i].value === MULTIPLY_OPERATOR){
            increment();
            if (typeof tokens[i]?.value === "number"){
                const multiplier = tokens[i].value;
                if (multiplier > 0){
                    const lastChild = tree.children[tree.children.length - 1];
                    Array.from({ length: multiplier - 1 }, () => tree.addChild(lastChild.copy()));
                }
                else if (multiplier === 0){
                    tree.children.pop();
                }

                increment();
            }
            else{
                throw new Error(`Expected number after multiplier at index ${tokens[i-1].idx}`);
            }
        }

        if (!tokens[i]) return;
        
        if (tokens[i].value === ADDITION_OPERATOR){
            // console.log(`Parsing i=${i}, token: ${tokens[i].value}`);

            increment();
            makeTreeRecursive(tree);
        }
        else if (tokens[i].value === SUBTREE_SCOPE_CLOSE){
            return;
        }
        else{
            throw new Error(`Expected scope close or addition operator at index ${tokens[i].idx}`);
        }
    }

    const createdTree = new MetricTree();

    makeTreeRecursive(createdTree);

    return createdTree;
}

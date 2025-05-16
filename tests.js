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
    }
]

function runTimeSignatureTests(){
    TIME_SIGNATURE_TESTS.forEach(test => {
        let tree = new MetricTree(test.tree);
        let passed = tree.getTimeSignature() === test.expectedResult;
        if (!passed){
            console.log(`%cTest \"${test.name}\" FAILED:`, consoleErrorStyle, test);
        }
        else{
            console.log(`%cTest \"${test.name}\" PASSED`, consoleGoodStyle)
        }
    })
}

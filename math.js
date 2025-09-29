function largestPowerOf2ThatEvenlyDividesEverything(ls){
    let power = 0;
    let iterations = 0;
    const ITERATION_LIMIT = 100;
    while (typeof ls.length === "number" && ls.length > 0 && iterations < ITERATION_LIMIT){
        if (Array.from(ls, n => n / Math.pow(2, power + 1)).every(item => Math.floor(item) === item)){
            power += 1;
        }
        else{
            break;
        }

        iterations += 1;
    }
    if (iterations >= ITERATION_LIMIT){
        throw new Error("Too many loops");
    }

    return power;
}

function factorial(n) {
    let result = 1;
    while (n > 1) {
        result = result * n;
        n -= 1;
    }
    return result;
}

/**
 * Returns a list of lists of the coeffecients of 2 and 3 respectively that add up to input `n`
 */
function getAllCoefficientSetsForTwoThree(n){
    let counts = [];
    for (let a = 0; a <= Math.ceil(n/2); a++){
        for (let b = 0; b <= Math.ceil(n/3); b++){
            if (2*a + 3*b == n){
                counts.push([a,b]);
            }
        }
    }

    return counts;
}

/**
 * Returns the number of how many unique sequences of 2s and 3s add up to input `n`
 */
function getTwoThreeSequencesCount(n){
    let counts = getAllCoefficientSetsForTwoThree(n);
    let num = 0;
    counts.forEach(ls => {
        let sum = 0;
        ls.forEach(x => {sum += x});

        let factorials_product = 1;
        ls.forEach(x => { factorials_product *= factorial(x)});

        num += factorial(sum) / factorials_product;
    });
    return num;
}

/**
 * Returns a list of all unique sequences of 2s and 3s that add up to input `n`
 */
function getAllTwoThreeSequences(n){

}
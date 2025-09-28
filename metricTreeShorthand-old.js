const validMtsCharacters = "[]*+0123456789";
const digits = "0123456789"
const maxActualValue = 1e4;
const minActualValue = 1;
const inconsistentDepthErrorMessage = "All numbers must be at the same nesting level (same depth)"

function mtsStringPreprocess(s){
    let newString = s.slice();
    let iterations = 0;
    const ITERATION_LIMIT = 1000;
    while(newString.includes("*") && iterations < ITERATION_LIMIT){
        let multiplierStartingIndex = -1;
        for (let i = 0; i < newString.length; i++){
            if (newString[i] === "*"){
                multiplierStartingIndex = i+1;
                break;
            }
        }
        let multiplierEndingIndex = -1;
        for (let i = multiplierStartingIndex; i < newString.length + 1; i++){
            if (!(digits.includes(newString[i]))){
                multiplierEndingIndex = i;
                break;
            }
        }

        let multiplier = Number(newString.slice(multiplierStartingIndex, multiplierEndingIndex));

        newString = newString.replace(`*${multiplier}`, `,{\"multiplier\":${multiplier}}`);
        iterations += 1;
    }
    if (iterations >= ITERATION_LIMIT) {
        throw new Error("Too many loops");
    }
    return "[" + newString.replaceAll("+", ",") + "]";
}

function mtsStringIsValid(s){
    if (s.length === 0) return true;

    // mark invalid if any illegal characters are present
    let chars = s.split("")
    for (let c of chars) {
        if (!validMtsCharacters.includes(c)){

            setMtsErrorMessage(`Invalid character \"${c}\"; only \"${validMtsCharacters}\" are allowed.`);
            return false;
        }
    }


    // asterisk pre-processing

    // ensure any asterisks are immediately followed by a digit and nothing else
    for (let i = 0; i < s.length - 1; i++){
        if (s[i] === "*"){
            if (!(digits.includes(s[i+1]))){
                setMtsErrorMessage(`Any asterisk must be followed by a number but \"${s[i+1]}\" follows an asterisk.`);
                return false;
            }
        }
    }

    // ensure any asterisks immediately follow either a digit or a closing square brace
    for (let i = 1; i < s.length; i++){
        if (s[i] === "*"){
            if (!(digits.includes(s[i-1]) || s[i-1] === "]")){
                setMtsErrorMessage(`Any asterisk must follow either a number or a closing square brace but \"${s[i-1]}\" precedes an asterisk.`);
                return false;
            }
        }
    }

    try{
        let mtsObject = JSON.parse(mtsStringPreprocess(s));

        if (mtsObjectContainsMultipleMultipliersInARow(mtsObject)){
            setMtsErrorMessage("Multiple multipliers in a row are not allowed.");
            return false;
        }

        let mtsObjectMultiplied = applyMtsMultipliersRecursive(mtsObject);

        mtsObjectUniformDepth(mtsObjectMultiplied);

        // do recursive check
        return mtsObjectIsValid(mtsObjectMultiplied);
    }
    catch(e){
        setMtsErrorMessage(`${e.toString().replaceAll("at line 1 column", "at index").replaceAll(" of the JSON data", "")}`);
        return false;
    }
}

function mtsObjectContainsMultipleMultipliersInARow(mtsObject){
    if (typeof mtsObject === "number"){
        return false;
    }
    else{
        for (let i = 0; i < mtsObject.length; i++){
            if (typeof mtsObject[i] === "object" &&
                            typeof mtsObject[i].multiplier === "number" &&
                            typeof mtsObject[i+1] === "object" &&
                            typeof mtsObject[i+1].multiplier === "number"){
                return true;
            }
        }

        for (let i = 0; i < mtsObject.length; i++){
            if (mtsObjectContainsMultipleMultipliersInARow(mtsObject[i])){
                return true;
            }
        }

        return false;
    }
}

/**
 * takes a post-multiplication MTS object
 */
function mtsObjectUniformDepth(mtsObject){
    if (typeof mtsObject === "number"){
        return 0;
    }
    else if (typeof mtsObject.length === "number"){
        let childDepths = Array.from(mtsObject, item => mtsObjectUniformDepth(item));
        for (let i = 0; i < childDepths.length; i++){
            if (childDepths[i] !== childDepths[0]){
                throw new Error(inconsistentDepthErrorMessage);
            }
        }

        return childDepths[0] + 1;
    }
}

/**
 * Takes a post-multiplication MTS object
 */
function mtsObjectIsValid(mtsObject){
    if (typeof mtsObject === "number"){
        if (mtsObject > maxActualValue){
            setMtsErrorMessage(`Numbers bigger than ${maxActualValue} are not supported`);
            return false;
        }
        if (mtsObject < minActualValue){
            setMtsErrorMessage(`Numbers smaller than ${minActualValue} are not supported`);
            return false;
        }
        return true;
    }
    else if (typeof mtsObject === "object"){
        if (typeof mtsObject.length === "number"){
            for (let i = 0; i < mtsObject.length; i++){
                if (!mtsObjectIsValid(mtsObject[i])){
                    return false;
                }
            }

            if (mtsObject.length < 1) {
                setMtsErrorMessage(`All layers must be non-empty.`);
                return false;
            }

            return true;
        }
        else{
            throw new Error("Object that is neither list nor number in mtsObject");
        }
    }
    else{
        throw new Error("Unexpected type for mtsObject");
    }
}



function applyMtsMultipliersFlat(ls){
    let newList = [];
    for (let i = 0; i < ls.length; i++){
        if (typeof ls[i] === "object" && typeof ls[i].multiplier === "number"){
            for (let k = 0; k < ls[i].multiplier; k++){
                newList.push(deepCopy(ls[i-1]));
            }
        }
        else if (!(typeof ls[i+1] === "object" && typeof ls[i+1].multiplier === "number")){
            newList.push(deepCopy(ls[i]));
        }
    }
    
    return newList;
}


function applyMtsMultipliersRecursive(mtsObject){
    if (typeof mtsObject === "number"){
        return mtsObject;
    }
    else if (typeof mtsObject === "object" && typeof mtsObject.length === "number"){
        return Array.from(applyMtsMultipliersFlat(mtsObject), item => applyMtsMultipliersRecursive(item));
    }
    else{
        throw new Error("Unrecognized type for mtsObject");
    }
}


function parseMts(s){
    if (s.length === 0){
        return [];
    }

    let mtsObj = JSON.parse(mtsStringPreprocess(s));

    return convertMtsToNestedLists(applyMtsMultipliersRecursive(mtsObj));
}


function convertMtsToNestedLists(mtsObject){
    if (typeof mtsObject === "number"){
        return Array.from({length: mtsObject}, () => []);
    }
    
    if (mtsObject.length > 0) {
        return Array.from(mtsObject, item => convertMtsToNestedLists(item));
    }
    else{
        console.error("something has gone wrong");
    }
}
const textFieldErrorColor = "#f88";
const textFieldOkayColor = "#fff";

const mtsInput = document.getElementById("mtsInput");
const mtsErrorMessage = document.getElementById("mtsError");

mtsInput.value = "[3,2*4]";
mtsInput.style.backgroundColor = mtsStringIsValid(mtsInput.value) ? textFieldOkayColor : textFieldErrorColor;
let mtsInputPreviousContent = mtsInput.value;

mtsInput.oninput = e => {
    // remove invalid characters immediately
    if (e.data){
        let initialCursorPosition = mtsInput.selectionStart;
        for (let i = 0; i < e.data.length; i++){
            if (!(validMtsCharacters.includes(e.data[i]))){
                mtsInput.value = mtsInputPreviousContent;
                setMtsErrorMessage(`Input \"${e.data}\" contains invalid characters. Valid characters: \"${validMtsCharacters}\"`);
                mtsInput.selectionStart = initialCursorPosition - e.data.length;
                mtsInput.selectionEnd = initialCursorPosition - e.data.length;
                return;
            }
        }
    }

    mtsInputPreviousContent = mtsInput.value.slice();
    
    mtsInput.inputIsValid = mtsStringIsValid(mtsInput.value);

    mtsInput.style.backgroundColor = mtsInput.inputIsValid ? textFieldOkayColor : textFieldErrorColor;

    if (!mtsInput.inputIsValid) return;

    setMtsErrorMessage("");

    currentPatch.tree = parseMts(mtsInput.value);
    fullRefresh();
}


function setMtsErrorMessage(s){
    mtsErrorMessage.textContent = s;
}

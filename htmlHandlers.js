const textFieldErrorColor = "#f88";
const textFieldOkayColor = "#fff";

const mtsInput = document.getElementById("mtsInput");
const mtsErrorMessage = document.getElementById("mtsError");

mtsInput.oninput = () => {
    const s = mtsInput.value;

    // remove invalid characters immediately
    for (let i = 0; i < s.length; i++){
        if (!(validMtsCharacters.includes(s[i]))){
            mtsInput.value = mtsInput.value.replaceAll(s[i], "");
        }
    }
    
    mtsInput.inputIsValid = mtsStringIsValid(mtsInput.value);

    mtsInput.style.backgroundColor = mtsInput.inputIsValid ? textFieldOkayColor : textFieldErrorColor;

    if (mtsInput.value.length < 1 || (!mtsInput.inputIsValid)) return;

    setMtsErrorMessage("");

    currentPatch.tree = parseMts(mtsInput.value);
    fullRefresh();
}

mtsInput.value = "[3,3,3,3]";
mtsInput.style.backgroundColor = mtsStringIsValid(mtsInput.value) ? textFieldOkayColor : textFieldErrorColor;

function setMtsErrorMessage(s){
    if (!runningTests){
        mtsErrorMessage.textContent = s;
    }
}

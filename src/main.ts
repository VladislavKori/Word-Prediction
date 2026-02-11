import './style.css'
import rawData from "./models/model_Разговор.json";

type ModelType = {
    wordMatrix: string[];
    transitionMatrix: number[][];
}

const data = rawData as ModelType;

const inputField = document.querySelector<HTMLInputElement>("#input")!;
const predictionField = document.querySelector<HTMLSpanElement>("#prediction")!;

let predictWord = ""; // для автокомплита на Tab
const wordMatrix = data.wordMatrix
const transitionMatrix = data.transitionMatrix

const predictNextWord = (currentWord: string): string => {
  const findedWordIndex = wordMatrix.findIndex(el => el === currentWord);
  if (findedWordIndex < 0) return "";

  const probs = transitionMatrix[findedWordIndex];
  const probability = Math.random();

  let acc = 0
  for (let j = 0; j < probs.length; j++) {
    acc += probs[j];
    if (probability <= acc) return wordMatrix[j]
  }

  return ""
}

const textCleaner = (text: string): string => {
  return text
    .replace(/[^A-Za-zА-Яа-яЁё ]/g, '')
    .toLocaleLowerCase('ru-RU');
}

function autoResize() {
  inputField.style.height = 'auto';
  inputField.style.height = inputField.scrollHeight + 'px';
}

const update = () => {
  const words = textCleaner(inputField.value).split(" ").filter(el => el.length !== 0);
  const lastWord = words[words.length - 1];
  predictWord = predictNextWord(lastWord);
  renderPredictWord(addSpaceToStartPredict(inputField.value, predictWord))
}

const renderPredictWord = (predictWord: string) => {
  const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  predictionField.innerHTML = `<span style="color:transparent">${esc(inputField.value)}</span>${esc(predictWord)}`;
  autoResize();
}

const addSpaceToStartPredict = (current: string, predict: string): string => {
  let hasEndSpace = current[current.length - 1] === " ";
  if (hasEndSpace) return predict;
  else return ` ${predict}`
}

inputField.addEventListener('input', update);
inputField.addEventListener('keydown', e => {
  if (e.key == "Tab") {
    e.preventDefault()
    inputField.value = `${inputField.value}${addSpaceToStartPredict(inputField.value, predictWord)}`;
    predictWord = ""
    renderPredictWord(predictWord)
    update()
  }
})
inputField.addEventListener('focusout', () => {
  predictWord = ""
  renderPredictWord(predictWord)
})

update();
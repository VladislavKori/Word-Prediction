import "node:process"
import fs from "node:fs"
import path from "node:path";

type TransitionRow = Map<number, number>;

type ModelType = {
    wordMatrix: string[];
    transitionMatrix: TransitionRow[];
}

const textCleaner = (text: string): string => {
    return text
        .replace(/[^\p{L}\s]+/gu, '')
        .toLocaleLowerCase('ru-RU');
}

const training = (text: string): ModelType => {
    const startTime = performance.now()

    const cleanText = textCleaner(text);
    const words = cleanText.trim().split(/\s+/);

    const wordToIndex = new Map<string, number>();
    const wordMatrix: string[] = [];
    const transitionMatrix: TransitionRow[] = [];

    const getWordIndex = (word: string): number => {
        let index = wordToIndex.get(word);

        if (index === undefined) {
            index = wordMatrix.length;
            wordToIndex.set(word, index);
            wordMatrix.push(word);
            transitionMatrix.push(new Map());
        }

        return index;
    };

    for (let i = 0; i < words.length - 1; i++) {
        const currentIndex = getWordIndex(words[i]);
        const nextIndex = getWordIndex(words[i + 1]);

        const row = transitionMatrix[currentIndex];
        row.set(nextIndex, (row.get(nextIndex) ?? 0) + 1);
    }


    for (const row of transitionMatrix) {
        let sum = 0;

        for (const value of row.values()) {
            sum += value;
        }

        if (sum === 0) continue;

        for (const [key, value] of row.entries()) {
            row.set(key, value / sum);
        }
    }

    const endTime = performance.now()
    const duration = (endTime - startTime).toFixed(4)

    console.log(`✅ Training Ended - ${duration}ms`)

    return {
        wordMatrix: wordMatrix,
        transitionMatrix: transitionMatrix,
    }
}

const testOutput = (transitionMatrix: TransitionRow[]) => {
    const startTime = performance.now()
    for (let i = 0; i < transitionMatrix.length; i++) {
        const row = transitionMatrix[i]

        let sum = 0;
        for (const value of row.values()) {
            sum += value;
        }

        if (row.size > 0 && Math.abs(sum - 1) > 1e-6) {
            console.error(`❌ Row ${i} is not normalized. Value = ${sum}`);
        }
    }
    const endTime = performance.now()
    const duration = (endTime - startTime).toFixed(4)

    console.log(`✅ Tests ended! - ${duration}ms`)
}

const toDenseMatrix = (
    sparse: Map<number, number>[],
    size: number
): number[][] => {
    const dense: number[][] = [];

    for (let i = 0; i < size; i++) {
        const row = new Array<number>(size).fill(0);

        for (const [col, value] of sparse[i]) {
            row[col] = value;
        }

        dense.push(row);
    }

    return dense;
};


const main = () => {
    const fileIndex = process.argv.findIndex(el => el === "--file")
    if (fileIndex < 0) throw new Error("--file не указан")

    const filePath = process.argv[fileIndex + 1];
    if (!filePath) throw new Error("Путь к файлу не указан")

    const data = fs.readFileSync(filePath, "utf-8");

    const result = training(data);
    testOutput(result.transitionMatrix);

    const denseMatrix = toDenseMatrix(
        result.transitionMatrix,
        result.wordMatrix.length
    );

    const filename = path.parse(filePath).name;
    fs.writeFileSync(
        `src/models/model_${filename}.json`,
        JSON.stringify({
            wordMatrix: result.wordMatrix,
            transitionMatrix: denseMatrix,
        })
    );

    console.log("✅ Model saved");
}
main();
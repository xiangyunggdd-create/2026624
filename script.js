const container = document.getElementById('visualizer-container');
const algorithmSelect = document.getElementById('algorithm-select');
const arraySizeInput = document.getElementById('array-size');
const speedInput = document.getElementById('speed');
const generateBtn = document.getElementById('generate-btn');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');

let array = [];
let bars = [];
let isSorting = false;
let shouldStop = false;

// Helpers
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getDelay() {
    // Speed input: 1 (slow) to 100 (fast)
    // Map to delay: 500ms (slow) to 1ms (fast)
    const val = parseInt(speedInput.value);
    // Formula: MaxDelay - ((val - MinVal) / (MaxVal - MinVal)) * (MaxDelay - MinDelay)
    return 500 - ((val - 1) / 99) * 495;
}

// Array Generation
function generateArray() {
    if (isSorting) return;

    const size = parseInt(arraySizeInput.value);
    array = [];
    container.innerHTML = '';

    for (let i = 0; i < size; i++) {
        // Random value between 10 and 100
        const value = Math.floor(Math.random() * 90) + 10;
        array.push(value);

        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.height = `${value}%`;
        // Dynamic width based on size
        bar.style.width = `${Math.floor(800 / size)}px`;
        container.appendChild(bar);
    }
    bars = document.querySelectorAll('.bar');
}

// Swap Function
async function swap(i, j) {
    // Visual
    bars[i].style.height = `${array[j]}%`;
    bars[j].style.height = `${array[i]}%`;

    // Data
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
}

// Algorithms
async function bubbleSort() {
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length - i - 1; j++) {
            if (!isSorting) return;

            // Highlight comparing
            bars[j].classList.add('compare');
            bars[j + 1].classList.add('compare');

            await sleep(getDelay());

            if (array[j] > array[j + 1]) {
                await swap(j, j + 1);
            }

            // Remove highlight
            bars[j].classList.remove('compare');
            bars[j + 1].classList.remove('compare');
        }
        // Mark as sorted
        bars[array.length - i - 1].classList.add('sorted');
    }
    // Final cleanup (mark all)
    bars.forEach(bar => bar.classList.add('sorted'));
}

async function selectionSort() {
    for (let i = 0; i < array.length; i++) {
        if (!isSorting) return;
        let minIdx = i;
        bars[i].classList.add('active'); // Current position

        for (let j = i + 1; j < array.length; j++) {
            if (!isSorting) return;

            bars[j].classList.add('compare');
            await sleep(getDelay());

            if (array[j] < array[minIdx]) {
                if (minIdx !== i) {
                    bars[minIdx].classList.remove('active'); // Remove highlight from old min
                }
                minIdx = j;
                bars[minIdx].classList.add('active'); // New min found
            } else {
                bars[j].classList.remove('compare');
            }
        }

        if (minIdx !== i) {
            await swap(i, minIdx);
        }

        bars[minIdx].classList.remove('active');
        bars[minIdx].classList.remove('compare');
        bars[i].classList.remove('active');
        bars[i].classList.add('sorted');
    }
    bars.forEach(bar => bar.classList.add('sorted'));
}

async function insertionSort() {
    bars[0].classList.add('sorted');

    for (let i = 1; i < array.length; i++) {
        if (!isSorting) return;

        let j = i;
        bars[i].classList.add('active');

        while (j > 0 && array[j] < array[j - 1]) {
            if (!isSorting) return;

            bars[j].classList.add('compare');
            bars[j - 1].classList.add('compare');

            await sleep(getDelay());

            await swap(j, j - 1);

            bars[j].classList.remove('compare');
            bars[j - 1].classList.remove('compare');
            j--;
        }

        bars[i].classList.remove('active');
        for (let k = 0; k <= i; k++) {
            bars[k].classList.add('sorted');
        }
    }
}

// Logic for Stop Button:
// The loops check `if (!isSorting) return;`.
// `stopSorting` sets `isSorting = false`.
// This breaks the loops.

async function startSorting() {
    if (isSorting) return;
    isSorting = true;
    shouldStop = false;

    // Disable controls
    generateBtn.disabled = true;
    startBtn.disabled = true;
    arraySizeInput.disabled = true;
    algorithmSelect.disabled = true;
    stopBtn.disabled = false;

    // Remove previous sorted classes and reset style
    bars.forEach(bar => {
        bar.className = 'bar';
    });

    const algorithm = algorithmSelect.value;

    if (algorithm === 'bubble') {
        await bubbleSort();
    } else if (algorithm === 'selection') {
        await selectionSort();
    } else if (algorithm === 'insertion') {
        await insertionSort();
    } else if (algorithm === 'merge') {
        await mergeSortCaller();
    } else if (algorithm === 'quick') {
        await quickSortCaller();
    }

    isSorting = false;
    shouldStop = false;

    // Enable controls
    generateBtn.disabled = false;
    startBtn.disabled = false;
    arraySizeInput.disabled = false;
    algorithmSelect.disabled = false;
    stopBtn.disabled = true;
}

function stopSorting() {
    if (isSorting) {
        shouldStop = true;
        isSorting = false;
    }
}

// Merge Sort Implementation
async function mergeSortCaller() {
    await mergeSort(0, array.length - 1);
    // Only mark sorted if finished naturally
    if (!isSorting) return;
    bars.forEach(bar => bar.classList.add('sorted'));
}

async function mergeSort(start, end) {
    if (start >= end || !isSorting) return;
    const mid = Math.floor((start + end) / 2);
    await mergeSort(start, mid);
    await mergeSort(mid + 1, end);
    await merge(start, mid, end);
}

async function merge(start, mid, end) {
    if (!isSorting) return;

    let left = start;
    let right = mid + 1;
    let tempArray = [];

    // Visualization: Mark the range being merged
    for (let i = start; i <= end; i++) {
        bars[i].classList.add('active');
    }

    while (left <= mid && right <= end) {
        if (!isSorting) return;

        // Highlight comparison
        bars[left].classList.add('compare');
        bars[right].classList.add('compare');
        await sleep(getDelay());

        if (array[left] <= array[right]) {
            tempArray.push(array[left]);
            left++;
        } else {
            tempArray.push(array[right]);
            right++;
        }
        // Remove highlight
        bars[left - 1 >= start ? left - 1 : start].classList.remove('compare');
        bars[right - 1 > mid ? right - 1 : mid + 1].classList.remove('compare');
    }

    while (left <= mid) {
        if (!isSorting) return;
        tempArray.push(array[left]);
        left++;
    }

    while (right <= end) {
        if (!isSorting) return;
        tempArray.push(array[right]);
        right++;
    }

    // Apply sorted values to array and visualize
    for (let i = 0; i < tempArray.length; i++) {
        if (!isSorting) return;

        array[start + i] = tempArray[i];
        bars[start + i].style.height = `${array[start + i]}%`;
        bars[start + i].classList.add('sorted');
        bars[start + i].classList.remove('active');
        await sleep(getDelay());
    }
}

// Quick Sort Implementation
async function quickSortCaller() {
    await quickSort(0, array.length - 1);
    if (!isSorting) return;
    bars.forEach(bar => bar.classList.add('sorted'));
}

async function quickSort(start, end) {
    if (start < end && isSorting) {
        const pivotIndex = await partition(start, end);
        if (pivotIndex !== undefined) {
            await quickSort(start, pivotIndex - 1);
            await quickSort(pivotIndex + 1, end);
        }
    }
}

async function partition(start, end) {
    if (!isSorting) return;

    const pivotValue = array[end];
    bars[end].classList.add('active'); // Pivot

    let i = start - 1;

    for (let j = start; j < end; j++) {
        if (!isSorting) return;

        bars[j].classList.add('compare');
        await sleep(getDelay());

        if (array[j] < pivotValue) {
            i++;
            await swap(i, j);
            bars[i].classList.add('sorted');
        }

        bars[j].classList.remove('compare');
        if (i >= start) bars[i].classList.remove('sorted');
    }

    await swap(i + 1, end);
    bars[end].classList.remove('active');

    return i + 1;
}

// Event Listeners
generateBtn.addEventListener('click', generateArray);
arraySizeInput.addEventListener('input', generateArray);
startBtn.addEventListener('click', startSorting);
stopBtn.addEventListener('click', stopSorting);

// Initial generate
generateArray();

const container = document.getElementById("container");
const speedInput = document.getElementById("speed");
let array = [];
let history = [];
let shouldStop = false;

// 1. Array Management
function init(size = 12) {
    stopSorting();
    const newArr = Array.from({length: size}, () => Math.floor(Math.random() * 80) + 10);
    setNewArray(newArr);
}

function handleManualInput() {
    const val = document.getElementById("manual-input").value;
    const items = val.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (items.length) { 
        stopSorting(); 
        setNewArray(items); 
    }
}

function setNewArray(newArr) {
    if (array.length > 0) history.push([...array]);
    array = [...newArr];
    renderBars();
}

function undo() {
    if (history.length > 0) { 
        stopSorting(); 
        array = history.pop(); 
        renderBars(); 
    }
}

function renderBars() {
    container.innerHTML = "";
    array.forEach(val => {
        const bar = document.createElement("div");
        bar.style.height = `${val * 4}px`;
        bar.className = "bar";
        bar.innerHTML = `<span class="bar-value">${val}</span>`;
        container.appendChild(bar);
    });
}

// 2. Control Logic
const sleep = () => {
    const val = parseInt(speedInput.value);
    // Non-linear speed: Low values are extremely slow (up to 1.2s)
    const ms = val < 50 ? 1200 - (val * 20) : 220 - val; 
    return new Promise(res => setTimeout(res, ms));
};

function stopSorting() { 
    shouldStop = true; 
    toggleUI(false); 
}

function toggleUI(running) {
    document.getElementById("start-btn").disabled = running;
    document.getElementById("stop-btn").disabled = !running;
    document.getElementById("undo-btn").disabled = running;
}

async function startSorting() {
    shouldStop = false;
    toggleUI(true);
    const algo = document.getElementById("algo-select").value;
    const bars = document.querySelectorAll(".bar");

    try {
        if (algo === "bubble") await bubbleSort(bars);
        if (algo === "selection") await selectionSort(bars);
        if (algo === "insertion") await insertionSort(bars);
        if (algo === "merge") await mergeSort(bars, 0, array.length - 1);
        if (algo === "quick") await quickSort(bars, 0, array.length - 1);
        if (algo === "heap") await heapSort(bars);
        
        if (!shouldStop) {
            for(let b of bars) b.className = "bar bar-sorted";
        }
    } catch (e) { console.warn("Sorting Process Terminated Safety."); }
    
    toggleUI(false);
}

function updateBar(bars, idx, val) {
    if (!bars[idx]) return;
    array[idx] = val;
    bars[idx].style.height = `${val * 4}px`;
    bars[idx].querySelector(".bar-value").innerText = val;
}

// 3. Algorithms

async function bubbleSort(bars) {
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length - i - 1; j++) {
            if (shouldStop) return;
            bars[j].classList.add("bar-comparing");
            bars[j+1].classList.add("bar-comparing");
            await sleep();
            if (array[j] > array[j + 1]) {
                bars[j].classList.replace("bar-comparing", "bar-swapping");
                bars[j+1].classList.replace("bar-comparing", "bar-swapping");
                let tmp = array[j];
                updateBar(bars, j, array[j+1]);
                updateBar(bars, j+1, tmp);
                await sleep();
            }
            bars[j].className = bars[j+1].className = "bar";
        }
        bars[array.length - i - 1].classList.add("bar-sorted");
    }
}

async function selectionSort(bars) {
    for (let i = 0; i < array.length; i++) {
        let min = i;
        bars[i].classList.add("bar-min");
        for (let j = i + 1; j < array.length; j++) {
            if (shouldStop) return;
            bars[j].classList.add("bar-scanning");
            await sleep();
            if (array[j] < array[min]) {
                bars[min].classList.remove("bar-min");
                min = j;
                bars[min].classList.add("bar-min");
            }
            bars[j].classList.remove("bar-scanning");
        }
        let tmp = array[i];
        updateBar(bars, i, array[min]);
        updateBar(bars, min, tmp);
        bars[min].className = "bar";
        bars[i].className = "bar bar-sorted";
    }
}

async function insertionSort(bars) {
    bars[0].classList.add("bar-sorted");
    for (let i = 1; i < array.length; i++) {
        let key = array[i];
        let j = i - 1;
        bars[i].classList.add("bar-swapping");
        while (j >= 0 && array[j] > key) {
            if (shouldStop) return;
            bars[j].classList.add("bar-comparing");
            await sleep();
            updateBar(bars, j + 1, array[j]);
            bars[j].classList.remove("bar-comparing");
            j--;
        }
        updateBar(bars, j + 1, key);
        bars[i].className = "bar";
        for(let k=0; k<=i; k++) bars[k].className = "bar bar-sorted";
    }
}

// Recursive Algorithms with Throw Catch for Stop
async function quickSort(bars, start, end) {
    if (shouldStop || start >= end) {
        if (start >= 0 && start < array.length) bars[start].classList.add("bar-sorted");
        return;
    }
    let pivotIdx = await partition(bars, start, end);
    await quickSort(bars, start, pivotIdx - 1);
    await quickSort(bars, pivotIdx + 1, end);
}

async function partition(bars, start, end) {
    let pivot = array[end];
    bars[end].classList.add("bar-pivot");
    let i = start;
    for (let j = start; j < end; j++) {
        if (shouldStop) throw "Stop";
        bars[j].classList.add("bar-scanning");
        await sleep();
        if (array[j] < pivot) {
            [array[i], array[j]] = [array[j], array[i]];
            updateBar(bars, i, array[i]);
            updateBar(bars, j, array[j]);
            i++;
        }
        bars[j].classList.remove("bar-scanning");
    }
    [array[i], array[end]] = [array[end], array[i]];
    updateBar(bars, i, array[i]);
    updateBar(bars, end, array[end]);
    bars[i].classList.add("bar-sorted");
    return i;
}

async function mergeSort(bars, l, r) {
    if (shouldStop || l >= r) return;
    const m = Math.floor((l + r) / 2);
    await mergeSort(bars, l, m);
    await mergeSort(bars, m + 1, r);
    await merge(bars, l, m, r);
}

async function merge(bars, l, m, r) {
    let left = array.slice(l, m + 1);
    let right = array.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
        if (shouldStop) throw "Stop";
        bars[k].classList.add("bar-comparing");
        await sleep();
        if (left[i] <= right[j]) updateBar(bars, k++, left[i++]);
        else updateBar(bars, k++, right[j++]);
        bars[k-1].classList.remove("bar-comparing");
        bars[k-1].classList.add("bar-sorted");
    }
    while (i < left.length) { updateBar(bars, k, left[i++]); bars[k++].classList.add("bar-sorted"); }
    while (j < right.length) { updateBar(bars, k, right[j++]); bars[k++].classList.add("bar-sorted"); }
}

async function heapSort(bars) {
    let n = array.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(bars, n, i);
    for (let i = n - 1; i > 0; i--) {
        if (shouldStop) return;
        [array[0], array[i]] = [array[i], array[0]];
        updateBar(bars, 0, array[0]);
        updateBar(bars, i, array[i]);
        bars[i].classList.add("bar-sorted");
        await heapify(bars, i, 0);
    }
}

async function heapify(bars, n, i) {
    let largest = i, l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && array[l] > array[largest]) largest = l;
    if (r < n && array[r] > array[largest]) largest = r;
    if (largest !== i) {
        if (shouldStop) throw "Stop";
        [array[i], array[largest]] = [array[largest], array[i]];
        updateBar(bars, i, array[i]);
        updateBar(bars, largest, array[largest]);
        await sleep();
        await heapify(bars, n, largest);
    }
}

init();
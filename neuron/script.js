const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const buttonClear = document.getElementById('clear');
const buttonPredict = document.getElementById('find');

function clearFunc(){
    location.reload();
}

const neurons = new Array(10).fill(null).map(() => Array.from({ length: 50 }, () => new Array(50)));
fetch('data.txt')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.text();
  })
  .then(data => {
    const arrData = data.split(' ').map(Number);
    let temp = 0;
    for (let k = 0; k < 10; ++k) {
      for (let i = 0; i < 50; ++i) {
        for (let j = 0; j < 50; ++j) {
          neurons[k][i][j] = arrData[temp++];
        }
      }
    }
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });

  const settings = {
    imageSmoothingEnabled: true,
    globalCompositeOperation: 'source-over',
    globalAlpha: 1,
    lineWidth: 3,
    strokeStyle: 'fuchsia',
    fillStyle: "fuchsia"
  };
  
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  
  function setupCanvas() {
    Object.keys(settings).forEach(key => {
      ctx[key] = settings[key];
    });
  
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);
  }
  
  function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
  }
  
  function draw(e) {
    if (!isDrawing) return;
  
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  
    [lastX, lastY] = [e.offsetX, e.offsetY];
  }
  
  function stopDrawing() {
    isDrawing = false;
  }
  
setupCanvas();

function center(image) {
    const height = image.length;
    const width = image[0].length;
  
    const centerY = Math.floor(height / 2);
    const centerX = Math.floor(width / 2);
  
    let imageY = Math.floor(height / 2);
    let imageX = Math.floor(width / 2);
  
    const offsetY = centerY - imageY;
    const offsetX = centerX - imageX;
  
    const centeredImage = new Array(height).fill(null).map(() => new Array(width).fill(0));
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const newY = y + offsetY;
        const newX = x + offsetX;
        if (newY >= 0 && newY < height && newX >= 0 && newX < width) {
          centeredImage[y][x] = image[newY][newX];
        }
      }
    }
  
    return centeredImage;
  }

buttonPredict.addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    const getIndex = (x, y) => (y * width + x) * 4;

    const binaryImage = [];
    for (let y = 0; y < height; y++) {
        binaryImage[y] = [];
        for (let x = 0; x < width; x++) {
            const index = getIndex(x, y);
            const isFuchsia = data[index] > 200 && data[index + 1] < 100 && data[index + 2] > 200;
            binaryImage[y][x] = isFuchsia ? 1 : 0;
        }
    }

    let topPixel = height;
    let downPixel = 0;
    let leftPixel = width;
    let rightPixel = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (binaryImage[y][x] === 1) {
                topPixel = Math.min(topPixel, y);
                downPixel = Math.max(downPixel, y);
                leftPixel = Math.min(leftPixel, x);
                rightPixel = Math.max(rightPixel, x);
            }
        }
    }
    const h = downPixel - topPixel;
    const w = rightPixel - leftPixel;
    const centeredImage = new Array(50).fill(0).map(() => new Array(50).fill(0));
    for (let i = leftPixel; i < rightPixel; i++) {
        for (let j = topPixel; j < downPixel; j++) {
            const cx = 25 - Math.floor(w / 2) + i - leftPixel;
            const cy = 25 - Math.floor(h / 2) + j - topPixel;
            centeredImage[cx][cy] = binaryImage[j][i];
        }
    }

    const predictions = new Array(10).fill(0).map((_, index) => ({
        index,
        value: 0
    }));
    for (let k = 0; k < 10; k++) {
        let count = 0;
        let sum = 0;
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                if (centeredImage[i][j] === 1) {
                    count++;
                    sum += neurons[k][i][j];
                }
            }
        }
        predictions[k].value = count > 0 ? sum / count : 0;
    }

    predictions.sort((a, b) => b.value - a.value);

    const predictionDiv = document.createElement('div');
    predictionDiv.classList.add('prediction');
    predictionDiv.textContent = `Verdict: ${predictions[0].index}`; 

    document.body.appendChild(predictionDiv);

    setTimeout(() => {
        predictionDiv.remove();
    }, 1500); 
});
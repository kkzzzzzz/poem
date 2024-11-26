class Game {
    constructor() {
        this.poems = POEMS;
        this.currentPoemIndex = 0;
        this.poem = this.poems[this.currentPoemIndex];
        
        this.selectedChars = [];
        this.completedLines = new Set();
        this.completedLinesData = [];
        
        this.canvas = null;
        this.ctx = null;
        this.poemLinesElement = document.querySelector('.poem-lines');
        
        this.maxLineLength = Math.max(...this.poem.content.map(line => line.length));
        
        this.init();
        this.setupNextPoemButton();
    }

    init() {
        this.setupPoemInfo();
        this.setupCanvas();
        this.setupGameBoard();
        this.setupEventListeners();
        this.setupPoemLines();
    }

    setupPoemInfo() {
        document.querySelector('.poem-title').textContent = this.poem.title;
        document.querySelector('.poem-author').textContent = this.poem.author;
    }

    setupCanvas() {
        this.canvas = document.getElementById('line-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }

    resizeCanvas() {
        const container = document.querySelector('.game-container');
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    setupGameBoard() {
        const characters = this.poem.content.join('').split('');
        const shuffledChars = this.shuffleArray([...characters]);
        
        const grid = document.getElementById('characters-grid');
        grid.innerHTML = '';
        
        const totalChars = shuffledChars.length;
        const columns = totalChars <= 16 ? 4 : 5;
        grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        
        shuffledChars.forEach(char => {
            const charDiv = document.createElement('div');
            charDiv.className = 'character';
            charDiv.textContent = char;
            grid.appendChild(charDiv);
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    setupEventListeners() {
        document.getElementById('characters-grid').addEventListener('click', (e) => {
            if (e.target.classList.contains('character')) {
                this.handleCharacterClick(e.target);
            }
        });

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.redrawLines();
        });
    }

    handleCharacterClick(charElement) {
        if (charElement.classList.contains('completed')) return;
        
        if (charElement.classList.contains('selected')) {
            const index = this.selectedChars.indexOf(charElement);
            if (index !== -1) {
                charElement.classList.remove('selected');
                this.selectedChars.splice(index, 1);
            }
        } else {
            charElement.classList.add('selected');
            this.selectedChars.push(charElement);
            
            const selectedText = this.selectedChars.map(el => el.textContent).join('');
            if (this.validateLine(selectedText)) {
                this.handleCorrectLine(selectedText);
            } else if (selectedText.length > this.maxLineLength) {
                this.handleWrongLine();
            }
        }
        
        this.redrawLines();
    }

    validateLine(line) {
        return this.poem.content.includes(line) && !this.completedLines.has(line);
    }

    handleCorrectLine(line) {
        this.completedLines.add(line);
        
        const positions = this.selectedChars.map(this.getCharacterCenter.bind(this));
        this.completedLinesData.push({
            positions,
            color: '#4CAF50'
        });
        
        this.selectedChars.forEach(char => {
            char.classList.remove('selected');
            char.classList.add('completed');
        });
        
        this.selectedChars = [];
        
        this.showCompletedLine(line);
        
        if (this.completedLines.size === this.poem.content.length) {
            this.handleGameCompletion();
        }
    }

    showCompletedLine(line) {
        const lineIndex = this.poem.content.indexOf(line);
        const lineElement = this.poemLinesElement.querySelector(`[data-index="${lineIndex}"]`);
        
        setTimeout(() => {
            lineElement.classList.add('show');
        }, 100);
    }

    handleGameCompletion() {
        setTimeout(() => {
            alert('恭喜你完成了这首诗！');
        }, 500);
    }

    handleWrongLine() {
        this.selectedChars.forEach(char => {
            char.classList.add('shake');
            setTimeout(() => {
                char.classList.remove('shake');
                char.classList.remove('selected');
            }, 500);
        });
        this.selectedChars = [];
    }

    redrawLines() {
        // 清除画布时使用完整尺寸
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 先绘制已完成的线
        this.completedLinesData.forEach(line => {
            this.drawLine(line.positions, line.color);
        });
        
        // 再绘制当前选择的线
        if (this.selectedChars.length > 1) {
            const positions = this.selectedChars.map(this.getCharacterCenter.bind(this));
            this.drawLine(positions, '#2196F3');
        }
    }

    drawLine(positions, color) {
        if (positions.length < 2) return;
        
        this.ctx.beginPath();
        this.ctx.lineCap = 'round';  // 添加圆形线帽
        this.ctx.lineJoin = 'round'; // 添加圆形连接
        
        // 移动到第一个点
        this.ctx.moveTo(positions[0].x, positions[0].y);
        
        // 使用贝塞尔曲线创建平滑的线条
        for (let i = 1; i < positions.length; i++) {
            const current = positions[i];
            const previous = positions[i - 1];
            
            // 计算控制点
            const controlPoint1 = {
                x: previous.x + (current.x - previous.x) * 0.5,
                y: previous.y
            };
            
            const controlPoint2 = {
                x: previous.x + (current.x - previous.x) * 0.5,
                y: current.y
            };
            
            // 绘制贝塞尔曲线
            this.ctx.bezierCurveTo(
                controlPoint1.x, controlPoint1.y,
                controlPoint2.x, controlPoint2.y,
                current.x, current.y
            );
        }
        
        // 设置线条样式
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        
        // 添加阴影效果
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        this.ctx.stroke();
        
        // 在连接点绘制小圆点
        positions.forEach(pos => {
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
        });
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }

    getCharacterCenter(element) {
        const rect = element.getBoundingClientRect();
        const containerRect = this.canvas.getBoundingClientRect();
        
        // 优化连接点位置计算
        return {
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top
        };
    }

    setupPoemLines() {
        this.poemLinesElement.innerHTML = '';
        this.poem.content.forEach((line, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'poem-line';
            lineDiv.textContent = line;
            lineDiv.dataset.index = index;
            this.poemLinesElement.appendChild(lineDiv);
        });
    }

    setupNextPoemButton() {
        const nextButton = document.getElementById('next-poem');
        nextButton.addEventListener('click', () => {
            this.loadNextPoem();
        });
    }

    loadNextPoem() {
        this.currentPoemIndex = (this.currentPoemIndex + 1) % this.poems.length;
        this.poem = this.poems[this.currentPoemIndex];
        this.maxLineLength = Math.max(...this.poem.content.map(line => line.length));
        
        this.resetGame();
        this.setupPoemInfo();
        this.setupGameBoard();
        this.setupPoemLines();
    }

    resetGame() {
        // 重置状态
        this.selectedChars = [];
        this.completedLines = new Set();
        this.completedLinesData = [];
        
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 重置完成的诗句显示
        const poemLines = document.querySelectorAll('.poem-line');
        poemLines.forEach(line => {
            line.classList.remove('show');
        });
    }

    handleGameCompletion() {
        setTimeout(() => {
            alert('恭喜你完成了这首诗！');
            // 启用下一首诗按钮
            document.getElementById('next-poem').disabled = false;
        }, 500);
    }

    setupPoemInfo() {
        document.querySelector('.poem-title').textContent = this.poem.title;
        document.querySelector('.poem-author').textContent = this.poem.author;
        // 重置下一首诗按钮状态
        document.getElementById('next-poem').disabled = false;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
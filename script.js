class JigsawPuzzle {
    constructor() {
        this.imageInput = document.getElementById('imageInput');
        this.startButton = document.getElementById('startButton');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.puzzleContainer = document.getElementById('puzzleContainer');
        this.previewImage = document.getElementById('previewImage');
        this.previewContainer = document.getElementById('previewContainer');
        
        this.pieces = [];
        this.draggedPiece = null;
        this.originalImage = null;
        this.gridSize = 3;
        this.aspectRatio = 1;
        
        this.setupEventListeners();
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }

    setupEventListeners() {
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.startButton.addEventListener('click', () => this.startPuzzle());
        this.difficultySelect.addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            if (this.originalImage) {
                this.startPuzzle();
            }
        });
    }

    cleanup() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.originalImage = new Image();
                this.originalImage.src = e.target.result;
                this.originalImage.onload = () => {
                    // アスペクト比を計算
                    const aspectRatio = this.originalImage.width / this.originalImage.height;
                    
                    // パズルコンテナのサイズを設定
                    const maxWidth = Math.min(800, window.innerWidth * 0.9);
                    this.puzzleContainer.style.width = maxWidth + 'px';
                    this.puzzleContainer.style.height = (maxWidth / aspectRatio) + 'px';
                    
                    // プレビューコンテナのサイズを設定
                    const previewContainer = document.getElementById('previewContainer');
                    const maxPreviewWidth = Math.min(300, window.innerWidth * 0.3);
                    previewContainer.style.width = maxPreviewWidth + 'px';
                    previewContainer.style.height = (maxPreviewWidth / aspectRatio) + 'px';
                    
                    this.previewImage.src = this.originalImage.src;
                    this.startButton.disabled = false;
                };
            };
            reader.readAsDataURL(file);
        }
    }

    handleResize() {
        if (this.originalImage) {
            const maxWidth = Math.min(800, window.innerWidth * 0.9);
            this.puzzleContainer.style.width = maxWidth + 'px';
            this.puzzleContainer.style.height = (maxWidth / this.aspectRatio) + 'px';

            const maxPreviewWidth = Math.min(300, window.innerWidth * 0.3);
            this.previewContainer.style.width = maxPreviewWidth + 'px';
            this.previewContainer.style.height = (maxPreviewWidth / this.aspectRatio) + 'px';

            // パズルが開始されている場合は再生成
            if (this.pieces.length > 0) {
                this.startPuzzle();
            }
        }
    }

    startPuzzle() {
        this.puzzleContainer.innerHTML = '';
        this.pieces = [];
        
        // アスペクト比を更新
        this.aspectRatio = this.originalImage.width / this.originalImage.height;
        
        // コンテナのサイズを設定
        const maxWidth = Math.min(800, window.innerWidth * 0.9);
        this.puzzleContainer.style.width = maxWidth + 'px';
        this.puzzleContainer.style.height = (maxWidth / this.aspectRatio) + 'px';
        
        const pieceWidth = this.puzzleContainer.offsetWidth / this.gridSize;
        const pieceHeight = this.puzzleContainer.offsetHeight / this.gridSize;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 画像をパズルコンテナのサイズに合わせる
        canvas.width = this.puzzleContainer.offsetWidth;
        canvas.height = this.puzzleContainer.offsetHeight;
        ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);

        // パズルピースの生成
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const pieceCanvas = document.createElement('canvas');
                pieceCanvas.width = pieceWidth;
                pieceCanvas.height = pieceHeight;
                const pieceCtx = pieceCanvas.getContext('2d');

                pieceCtx.drawImage(
                    canvas,
                    x * pieceWidth, y * pieceHeight,
                    pieceWidth, pieceHeight,
                    0, 0,
                    pieceWidth, pieceHeight
                );

                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.style.width = pieceWidth + 'px';
                piece.style.height = pieceHeight + 'px';
                piece.style.backgroundImage = `url(${pieceCanvas.toDataURL()})`;
                piece.style.backgroundSize = '100% 100%';

                // ランダムな位置に配置
                const randomX = Math.random() * (this.puzzleContainer.offsetWidth - pieceWidth);
                const randomY = Math.random() * (this.puzzleContainer.offsetHeight - pieceHeight);
                piece.style.left = randomX + 'px';
                piece.style.top = randomY + 'px';

                // 正解の位置を保存
                piece.dataset.correctX = x * pieceWidth + 'px';
                piece.dataset.correctY = y * pieceHeight + 'px';

                this.setupDragAndDrop(piece);
                this.puzzleContainer.appendChild(piece);
                this.pieces.push(piece);
            }
        }
    }

    setupDragAndDrop(piece) {
        piece.draggable = true;

        piece.addEventListener('dragstart', (e) => {
            this.draggedPiece = piece;
            piece.style.opacity = '0.5';
            e.dataTransfer.setData('text/plain', ''); // Firefox用
        });

        piece.addEventListener('dragend', () => {
            if (this.draggedPiece) {
                this.draggedPiece.style.opacity = '1';
                this.checkPosition(this.draggedPiece);
                this.draggedPiece = null;
            }
        });

        this.puzzleContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.puzzleContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedPiece) {
                const rect = this.puzzleContainer.getBoundingClientRect();
                const x = e.clientX - rect.left - this.draggedPiece.offsetWidth / 2;
                const y = e.clientY - rect.top - this.draggedPiece.offsetHeight / 2;

                // コンテナ内に収まるように位置を制限
                const maxX = this.puzzleContainer.offsetWidth - this.draggedPiece.offsetWidth;
                const maxY = this.puzzleContainer.offsetHeight - this.draggedPiece.offsetHeight;
                
                this.draggedPiece.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
                this.draggedPiece.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
            }
        });
    }

    checkPosition(piece) {
        const currentX = parseInt(piece.style.left);
        const currentY = parseInt(piece.style.top);
        const correctX = parseInt(piece.dataset.correctX);
        const correctY = parseInt(piece.dataset.correctY);
        const threshold = 50; // 許容誤差を50ピクセルに増やす（より緩い判定）

        // ピースの幅に基づいて許容誤差を計算（より大きなピースには大きな許容誤差）
        const pieceWidth = piece.offsetWidth;
        const dynamicThreshold = Math.max(threshold, pieceWidth * 0.2); // ピースサイズの20%まで許容

        if (
            Math.abs(currentX - correctX) < dynamicThreshold &&
            Math.abs(currentY - correctY) < dynamicThreshold
        ) {
            // アニメーションを追加して、よりスムーズに正しい位置に移動
            piece.style.transition = 'left 0.3s, top 0.3s';
            piece.style.left = piece.dataset.correctX;
            piece.style.top = piece.dataset.correctY;
            piece.classList.add('correct');
            piece.draggable = false;

            // すべてのピースが正しい位置にあるかチェック
            if (this.pieces.every(p => p.classList.contains('correct'))) {
                setTimeout(() => {
                    alert('おめでとうございます！パズルが完成しました！');
                }, 300); // アニメーション完了後にメッセージを表示
            }
        } else {
            piece.classList.remove('correct');
            // ドラッグ中は遷移効果をオフに
            piece.style.transition = 'none';
        }
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new JigsawPuzzle();
});

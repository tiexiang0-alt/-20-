document.addEventListener('DOMContentLoaded', () => {
    initCountdown();
    initFloorPlan();
});

function initCountdown() {
    const timerElement = document.getElementById('countdown-timer');
    // Set deadline to 20 days from now
    const now = new Date();
    const deadline = new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000));
    
    function updateTimer() {
        const currentTime = new Date();
        const diff = deadline - currentTime;
        
        if (diff <= 0) {
            timerElement.textContent = "00:00:00:00";
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerElement.textContent = `
            ${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
        `.trim();
        
        requestAnimationFrame(updateTimer);
    }
    
    updateTimer();
}

function initFloorPlan() {
    const canvas = document.getElementById('floorPlanCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas resolution
    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    const particles = [];
    const shoutWaves = [];
    
    // Stations relative positions (0-1)
    const stations = {
        door: { x: 0.1, y: 0.8 },
        kitchen: { x: 0.5, y: 0.2 }, // Mid kitchen
        tables: [
            {x: 0.3, y: 0.5}, {x: 0.7, y: 0.5}, 
            {x: 0.3, y: 0.7}, {x: 0.7, y: 0.7},
            {x: 0.5, y: 0.6}
        ]
    };

    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = stations.door.x * canvas.width;
            this.y = stations.door.y * canvas.height;
            this.targetX = stations.kitchen.x * canvas.width;
            this.targetY = stations.kitchen.y * canvas.height;
            this.speed = 2 + Math.random() * 2;
            this.active = true;
            this.color = '#fff';
            this.size = 2;
        }
        
        update() {
            if (!this.active) return;
            
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 5) {
                // Reached kitchen, trigger shout
                triggerShout(this.x, this.y);
                this.reset();
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
        
        draw() {
            if (!this.active) return;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    class ShoutWave {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 1;
            this.maxRadius = Math.max(canvas.width, canvas.height) * 0.8;
            this.alpha = 1;
            this.active = true;
        }
        
        update() {
            this.radius += 5;
            this.alpha -= 0.01;
            if (this.alpha <= 0) this.active = false;
        }
        
        draw() {
            if (!this.active) return;
            ctx.strokeStyle = `rgba(211, 47, 47, ${this.alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw text
            ctx.fillStyle = `rgba(212, 175, 55, ${this.alpha})`;
            ctx.font = "12px 'Roboto Mono'";
            ctx.textAlign = "center";
        }
    }
    
    function triggerShout(x, y) {
        shoutWaves.push(new ShoutWave(x, y));
    }
    
    // Create particles
    for(let i=0; i<3; i++) {
        setTimeout(() => particles.push(new Particle()), i * 2000);
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw floor plan roughly
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        // Outer walls
        ctx.strokeRect(canvas.width * 0.05, canvas.height * 0.05, canvas.width * 0.9, canvas.height * 0.9);
        // Kitchen area
        ctx.strokeRect(canvas.width * 0.05, canvas.height * 0.05, canvas.width * 0.9, canvas.height * 0.25);
        
        // Draw tables
        ctx.fillStyle = '#1a1a1a';
        stations.tables.forEach(t => {
            ctx.fillRect(t.x * canvas.width - 20, t.y * canvas.height - 10, 40, 20);
        });

        // Update and draw particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        // Update and draw waves
        for (let i = shoutWaves.length - 1; i >= 0; i--) {
            shoutWaves[i].update();
            shoutWaves[i].draw();
            if (!shoutWaves[i].active) shoutWaves.splice(i, 1);
        }
        
        // Draw Legend Text
        ctx.fillStyle = '#d32f2f';
        ctx.font = "14px monospace";
        ctx.fillText("SHOUT SOURCE", canvas.width * 0.5, canvas.height * 0.2 + 20);
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

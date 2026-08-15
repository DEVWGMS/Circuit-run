(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const scoreEl = document.getElementById('score');
  const skillsEl = document.getElementById('skills');
  const bannerEl = document.getElementById('banner');
  const startScreen = document.getElementById('startScreen');
  const overScreen = document.getElementById('overScreen');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const finalScoreEl = document.getElementById('finalScore');
  const finalSkillsEl = document.getElementById('finalSkills');
 
  const SKILLS = ['C#','JS','HTML','CSS','C','Python'];
  const MILESTONES = [
    { at: 120, text: '🔧 Técnico em Sistemas de Energia Renovável — IFMG' },
    { at: 300, text: '🎓 Cursando Sistemas de Informação — PUC Minas' },
    { at: 600, text: '⚡ Estudando C#, JS, HTML, CSS, C, Python e frameworks' }
  ];
 
  SKILLS.forEach(s=>{
    const tag = document.createElement('div');
    tag.className='skill-tag';
    tag.textContent=s;
    tag.id='tag-'+s;
    skillsEl.appendChild(tag);
  });
 
  let W,H,groundY,dpr;
  function resize(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = W*dpr;
    canvas.height = H*dpr;
    canvas.style.width=W+'px';
    canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    groundY = H*0.72;
  }
  window.addEventListener('resize', resize);
 
  let running=false, gameOver=false, t=0, speed=5.2, distance=0;
  let player, obstacles, orbs, particles, gridOffset, collected, milestonesShown, shakeT;
 
  function resetGame(){
    player = { x: 70, y: 0, vy:0, w:26, h:26, onGround:true, rot:0 };
    obstacles=[]; orbs=[]; particles=[];
    gridOffset=0; distance=0; speed=5.2; t=0;
    collected = new Set();
    milestonesShown = new Set();
    shakeT=0;
    gameOver=false;
    SKILLS.forEach(s=>document.getElementById('tag-'+s).classList.remove('got'));
    scoreEl.textContent='0000';
    spawnTimer=0; orbTimer=40;
  }
 
  let spawnTimer=0, orbTimer=40;
  const GRAV=0.62, JUMP=-11.5;
 
  function jump(){
    if(!running || gameOver) return;
    if(player.onGround){
      player.vy = JUMP;
      player.onGround=false;
    }
  }
 
  window.addEventListener('keydown', e=>{
    if(e.code==='Space'||e.code==='ArrowUp'){ e.preventDefault(); jump(); }
  });
  stage.addEventListener('pointerdown', jump);
 
  function spawnObstacle(){
    const h = 22 + Math.random()*14;
    obstacles.push({ x: W+20, y: groundY-h, w:18+Math.random()*8, h, kind:'bug' });
  }
  function spawnOrb(){
    const skill = SKILLS[Math.floor(Math.random()*SKILLS.length)];
    const y = groundY - 40 - Math.random()*70;
    orbs.push({ x: W+20, y, r:14, skill, taken:false, bob:Math.random()*Math.PI*2 });
  }
 
  function showBanner(text){
    bannerEl.textContent = text;
    bannerEl.classList.add('show');
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(()=>bannerEl.classList.remove('show'), 2600);
  }
 
  function collectSkill(skill){
    if(!collected.has(skill)){
      collected.add(skill);
      const tag = document.getElementById('tag-'+skill);
      tag.classList.add('got');
    }
    for(let i=0;i<10;i++){
      particles.push({
        x: player.x+player.w/2, y: player.y+player.h/2,
        vx:(Math.random()-0.5)*4, vy:(Math.random()-0.5)*4-1,
        life:26, color:'cyan'
      });
    }
  }
 
  function crash(){
    gameOver=true; running=false;
    shakeT=14;
    for(let i=0;i<22;i++){
      particles.push({
        x: player.x+player.w/2, y: player.y+player.h/2,
        vx:(Math.random()-0.5)*7, vy:(Math.random()-0.5)*7-2,
        life:36, color:'red'
      });
    }
    setTimeout(()=>{
      finalScoreEl.textContent = Math.floor(distance);
      finalSkillsEl.textContent = collected.size+'/'+SKILLS.length;
      overScreen.style.display='flex';
    }, 500);
  }
 
  function update(){
    t++;
    distance += speed*0.12;
    speed = Math.min(11, 5.2 + distance*0.004);
    scoreEl.textContent = String(Math.floor(distance)).padStart(4,'0');
    gridOffset = (gridOffset + speed) % 40;
 
    MILESTONES.forEach(m=>{
      if(distance>=m.at && !milestonesShown.has(m.at)){
        milestonesShown.add(m.at);
        showBanner(m.text);
      }
    });
 
    player.vy += GRAV;
    player.y += player.vy;
    const floorY = groundY - player.h;
    if(player.y >= floorY){
      player.y = floorY;
      player.vy = 0;
      player.onGround = true;
    }
    player.rot = player.onGround ? 0 : Math.max(-0.4, Math.min(0.4, player.vy*0.03));
 
    spawnTimer--;
    if(spawnTimer<=0){
      spawnObstacle();
      spawnTimer = 55 + Math.random()*45 - Math.min(30, distance*0.02);
    }
    orbTimer--;
    if(orbTimer<=0){
      spawnOrb();
      orbTimer = 70 + Math.random()*50;
    }
 
    obstacles.forEach(o=> o.x -= speed);
    obstacles = obstacles.filter(o=>o.x+o.w>-10);
 
    orbs.forEach(o=>{ o.x -= speed; o.bob += 0.08; });
    orbs = orbs.filter(o=>o.x+o.r>-10 && !o.taken);
 
    const px=player.x, py=player.y, pw=player.w, ph=player.h;
    obstacles.forEach(o=>{
      if(px < o.x+o.w-4 && px+pw-4 > o.x && py < o.y+o.h-2 && py+ph-2 > o.y){
        if(!gameOver) crash();
      }
    });
    orbs.forEach(o=>{
      const dx=(px+pw/2)-o.x, dy=(py+ph/2)-o.y;
      if(!o.taken && Math.sqrt(dx*dx+dy*dy) < o.r+14){
        o.taken=true;
        collectSkill(o.skill);
      }
    });
 
    particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life--; });
    particles = particles.filter(p=>p.life>0);
 
    if(shakeT>0) shakeT--;
  }
 
  function drawGrid(){
    ctx.save();
    ctx.strokeStyle='rgba(30,42,55,0.6)';
    ctx.lineWidth=1;
    for(let x=-40; x<W+40; x+=40){
      const gx = x - gridOffset;
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for(let y=0; y<H; y+=40){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }
    ctx.restore();
  }
 
  function drawGround(){
    ctx.save();
    const grad = ctx.createLinearGradient(0,groundY,0,H);
    grad.addColorStop(0,'rgba(76,224,210,0.12)');
    grad.addColorStop(1,'rgba(76,224,210,0)');
    ctx.fillStyle=grad;
    ctx.fillRect(0,groundY,W,H-groundY);
    ctx.strokeStyle='#2a3948';
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,groundY); ctx.lineTo(W,groundY); ctx.stroke();
 
    ctx.fillStyle='rgba(76,224,210,0.55)';
    for(let x=-((gridOffset)%50); x<W; x+=50){
      ctx.fillRect(x, groundY-1, 22, 2);
    }
    ctx.restore();
  }
 
  function drawPlayer(){
    ctx.save();
    ctx.translate(player.x+player.w/2, player.y+player.h/2);
    ctx.rotate(player.rot);
    ctx.shadowColor='#4ce0d2';
    ctx.shadowBlur=18;
    ctx.fillStyle='#4ce0d2';
    ctx.beginPath();
    ctx.roundRect(-player.w/2,-player.h/2,player.w,player.h,6);
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#0a0e13';
    ctx.fillRect(-5,-4,4,4);
    ctx.fillRect(3,-4,4,4);
    ctx.restore();
  }
 
  function drawObstacles(){
    obstacles.forEach(o=>{
      ctx.save();
      ctx.shadowColor='#ff5d5d';
      ctx.shadowBlur=14;
      ctx.strokeStyle='#ff5d5d';
      ctx.lineWidth=2.4;
      ctx.beginPath();
      ctx.moveTo(o.x,o.y); ctx.lineTo(o.x+o.w,o.y+o.h);
      ctx.moveTo(o.x+o.w,o.y); ctx.lineTo(o.x,o.y+o.h);
      ctx.stroke();
      ctx.restore();
    });
  }
 
  function drawOrbs(){
    orbs.forEach(o=>{
      const y = o.y + Math.sin(o.bob)*4;
      ctx.save();
      ctx.translate(o.x,y);
      ctx.shadowColor='#f2b134';
      ctx.shadowBlur=16;
      ctx.strokeStyle='#f2b134';
      ctx.lineWidth=2;
      ctx.beginPath();
      for(let i=0;i<6;i++){
        const a = Math.PI/3*i - Math.PI/2;
        const px = Math.cos(a)*o.r, py=Math.sin(a)*o.r;
        i===0? ctx.moveTo(px,py): ctx.lineTo(px,py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur=0;
      ctx.fillStyle='#f2b134';
      ctx.font="9px 'Space Mono', monospace";
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText(o.skill, 0, 1);
      ctx.restore();
    });
  }
 
  function drawParticles(){
    particles.forEach(p=>{
      ctx.save();
      ctx.globalAlpha = Math.max(0,p.life/30);
      ctx.fillStyle = p.color==='red' ? '#ff5d5d' : '#4ce0d2';
      ctx.beginPath();
      ctx.arc(p.x,p.y,2.4,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
  }
 
  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.save();
    if(shakeT>0){
      ctx.translate((Math.random()-0.5)*shakeT, (Math.random()-0.5)*shakeT);
    }
    drawGrid();
    drawGround();
    drawOrbs();
    drawObstacles();
    drawPlayer();
    drawParticles();
    ctx.restore();
  }
 
  function loop(){
    if(running){
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }
 
  function startGame(){
    resize();
    resetGame();
    startScreen.style.display='none';
    overScreen.style.display='none';
    running=true;
  }
 
  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
 
  resize();
  resetGame();
  draw();
  requestAnimationFrame(loop);
})();
 
(() => {
  const screens = {
    title: document.getElementById('titleScreen'),
    select: document.getElementById('selectScreen'),
    game: document.getElementById('gameScreen')
  };
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const playerHpEl = document.getElementById('playerHp');
  const enemyHpEl = document.getElementById('enemyHp');
  const comboEl = document.getElementById('comboText');
  const restartButton = document.getElementById('restartButton');

  let selectedFighter = 'green';
  let running = false;
  let last = performance.now();
  let bubbles = [];
  let particles = [];
  let gameOver = false;
  let comboTimer = 0;
  let comboHits = 0;

  const stats = {
    green: { speed: 220, tongue: 210, damage: 1.0, sink: 12, hue: 0 },
    blue:  { speed: 250, tongue: 260, damage: 0.88, sink: 8, hue: 95 }
  };

  function show(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function canUseLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  window.addEventListener('orientationchange', () => {
    if (screens.title.classList.contains('active') && canUseLandscape()) {
      setTimeout(() => show('select'), 180);
    }
  });
  window.addEventListener('resize', () => {
    resize();
    if (screens.title.classList.contains('active') && canUseLandscape() && window.innerWidth < 1000) show('select');
  });

  document.getElementById('desktopStart').onclick = () => show('select');
  if (canUseLandscape() && window.innerWidth < 900) show('select');

  document.querySelectorAll('.fighter-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.fighter-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedFighter = card.dataset.fighter;
    });
  });

  document.getElementById('fightButton').onclick = () => {
    show('game');
    resize();
    startGame();
  };
  restartButton.onclick = startGame;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  class Fighter {
    constructor(x, y, isPlayer, type='green') {
      const s = stats[type] || stats.green;
      this.x=x; this.y=y; this.vx=0; this.vy=0; this.isPlayer=isPlayer;
      this.type=type; this.speed=s.speed; this.tongueRange=s.tongue; this.damageMul=s.damage;
      this.sink=s.sink; this.hue=s.hue;
      this.radius=35; this.hp=100; this.face = isPlayer ? 1 : -1;
      this.attack=null; this.attackT=0; this.stun=0; this.guard=false; this.tongueT=0;
      this.flash=0;
    }
    update(dt) {
      if (this.stun>0) this.stun-=dt;
      if (this.flash>0) this.flash-=dt;
      if (this.attackT>0) {
        this.attackT-=dt;
        if (this.attackT<=0) this.attack=null;
      }
      if (this.tongueT>0) this.tongueT-=dt;

      this.vy += this.sink * dt;
      this.vx *= Math.pow(.35, dt);
      this.vy *= Math.pow(.5, dt);

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const minY=78, maxY=innerHeight-65;
      this.x=Math.max(45,Math.min(innerWidth-45,this.x));
      this.y=Math.max(minY,Math.min(maxY,this.y));
      if(this.y===maxY) this.vy=Math.min(0,this.vy);

      const other = this.isPlayer ? enemy : player;
      if (other) this.face = other.x >= this.x ? 1 : -1;
    }
    hit(dmg,kx,ky) {
      if(this.guard){
        dmg*=.22; kx*=.2; ky*=.2;
        spawnImpact(this.x,this.y,'guard');
      } else {
        this.stun=.16; this.flash=.12;
        spawnImpact(this.x,this.y,'hit');
      }
      this.hp=Math.max(0,this.hp-dmg);
      this.vx += kx; this.vy += ky;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x,this.y);
      if(this.face<0) ctx.scale(-1,1);
      if(this.flash>0) ctx.globalAlpha=.55;

      ctx.save();
      ctx.filter = this.hue ? `hue-rotate(${this.hue}deg)` : 'none';

      // 2頭身くらいの丸い胴体
      ctx.fillStyle='#58bd50';
      ctx.beginPath();
      ctx.ellipse(0,31,30,34,0,0,Math.PI*2);
      ctx.fill();

      // お腹
      ctx.fillStyle='#8ae47f';
      ctx.beginPath();
      ctx.ellipse(2,36,19,23,0,0,Math.PI*2);
      ctx.fill();

      // 後ろ脚：胴体から生やす
      ctx.strokeStyle='#4aa944';
      ctx.lineWidth=12;
      ctx.lineCap='round';
      ctx.lineJoin='round';
      ctx.beginPath();
      ctx.moveTo(-19,47); ctx.lineTo(-37,61); ctx.lineTo(-50,57);
      ctx.moveTo(19,47); ctx.lineTo(37,61); ctx.lineTo(50,57);
      ctx.stroke();

      // 腕：胴体の横から
      ctx.strokeStyle='#58bd50';
      ctx.lineWidth=10;
      ctx.beginPath();
      ctx.moveTo(-23,22); ctx.lineTo(-38,34);
      ctx.moveTo(23,22); ctx.lineTo(38,34);
      ctx.stroke();

      // 頭
      ctx.fillStyle='#63cf58';
      ctx.beginPath();
      ctx.ellipse(0,-6,35,30,0,0,Math.PI*2);
      ctx.fill();

      // 目のふくらみ
      ctx.fillStyle='#7ce66f';
      ctx.beginPath();
      ctx.arc(-19,-29,16,0,Math.PI*2);
      ctx.arc(19,-29,16,0,Math.PI*2);
      ctx.fill();

      // 白目
      ctx.fillStyle='#fff';
      ctx.beginPath();
      ctx.arc(-19,-30,10,0,Math.PI*2);
      ctx.arc(19,-30,10,0,Math.PI*2);
      ctx.fill();

      // 黒目
      ctx.fillStyle='#182a2a';
      ctx.beginPath();
      ctx.arc(-16,-29,4,0,Math.PI*2);
      ctx.arc(22,-29,4,0,Math.PI*2);
      ctx.fill();

      // ほっぺ
      ctx.fillStyle='rgba(255,130,150,.42)';
      ctx.beginPath();
      ctx.arc(-24,2,5,0,Math.PI*2);
      ctx.arc(24,2,5,0,Math.PI*2);
      ctx.fill();

      // 口
      ctx.strokeStyle='#255c31';
      ctx.lineWidth=3;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.arc(0,-3,14,.15*Math.PI,.85*Math.PI);
      ctx.stroke();

      ctx.restore();

      // パンチは腕だけ前へ
      if(this.attack==='punch'){
        ctx.save();
        ctx.filter = this.hue ? `hue-rotate(${this.hue}deg)` : 'none';
        ctx.strokeStyle='#61d357';
        ctx.lineWidth=12;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(22,21);
        ctx.lineTo(58,9);
        ctx.stroke();
        ctx.restore();
      }

      // キックは脚だけ前へ
      if(this.attack==='kick'){
        ctx.save();
        ctx.filter = this.hue ? `hue-rotate(${this.hue}deg)` : 'none';
        ctx.strokeStyle='#61d357';
        ctx.lineWidth=13;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(17,47);
        ctx.lineTo(62,50);
        ctx.stroke();
        ctx.restore();
      }

      if(this.tongueT>0){
        const target = this.isPlayer ? enemy : player;
        let len = Math.min(this.tongueRange, Math.abs(target.x-this.x));
        ctx.strokeStyle='#ff718e';
        ctx.lineWidth=8;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(28,-2);
        ctx.lineTo(28+len,-2);
        ctx.stroke();
      }

      if(this.guard){
        ctx.strokeStyle='rgba(185,235,255,.75)';
        ctx.lineWidth=8;
        ctx.beginPath();
        ctx.arc(22,8,59,-1.25,1.25);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  let player, enemy;
  const input={x:0,y:0};

  function startGame() {
    gameOver=false; restartButton.hidden=true; comboHits=0; comboTimer=0; comboEl.textContent='';
    player = new Fighter(innerWidth*.28, innerHeight*.52, true, selectedFighter);
    enemy = new Fighter(innerWidth*.72, innerHeight*.48, false, 'green');
    enemy.hp=100;
    bubbles = Array.from({length:28}, () => ({
      x:Math.random()*innerWidth, y:Math.random()*innerHeight, r:2+Math.random()*6, s:10+Math.random()*26
    }));
    particles=[];
    running=true; last=performance.now();
  }

  function attack(f, kind) {
    if(gameOver || f.stun>0 || f.attackT>0 || f.guard) return;
    const other = f.isPlayer ? enemy : player;
    const dir=f.face;
    const dist=Math.hypot(other.x-f.x, other.y-f.y);

    if(kind==='punch'){
      f.attack='punch';f.attackT=.18;
      if(dist<82 && Math.abs(other.y-f.y)<55){
        setTimeout(()=>damageHit(f,other,2.6*f.damageMul,65*dir,-8),55);
      }
    } else if(kind==='kick'){
      f.attack='kick';f.attackT=.28;
      if(dist<100 && Math.abs(other.y-f.y)<70){
        setTimeout(()=>damageHit(f,other,5.2*f.damageMul,175*dir,-28),80);
      }
    } else if(kind==='tongue'){
      f.tongueT=.22; f.attack='tongue'; f.attackT=.3;
      if(Math.abs(other.x-f.x)<f.tongueRange && Math.abs(other.y-f.y)<75 && Math.sign(other.x-f.x)===dir){
        setTimeout(()=>{
          if(!other.guard){
            other.vx += -dir*250;
            other.vy += (f.y-other.y)*2.0;
            other.stun=.2;
            damageHit(f,other,1.4*f.damageMul,0,0);
          } else {
            spawnImpact(other.x,other.y,'guard');
          }
        },70);
      }
    }
  }

  function damageHit(attacker,target,dmg,kx,ky){
    if(gameOver) return;
    target.hit(dmg,kx,ky);
    if(attacker.isPlayer && !target.guard){
      comboHits++; comboTimer=1.15;
      comboEl.textContent = comboHits>1 ? `${comboHits} HIT!` : '';
    }
    updateHud();
    if(target.hp<=0) endGame(attacker.isPlayer);
  }

  function endGame(playerWon){
    gameOver=true; running=true;
    comboEl.textContent = playerWon ? 'YOU WIN!' : 'YOU LOSE';
    restartButton.hidden=false;
  }

  function updateHud(){
    playerHpEl.style.width=player.hp+'%';
    enemyHpEl.style.width=enemy.hp+'%';
  }

  // Touch stick
  const zone=document.getElementById('stickZone'), base=document.getElementById('stickBase'), knob=document.getElementById('stickKnob');
  let stickId=null;
  function stickMove(t){
    const r=base.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    let dx=t.clientX-cx,dy=t.clientY-cy;
    const max=r.width*.34, len=Math.hypot(dx,dy)||1, scale=Math.min(1,max/len);
    dx*=scale;dy*=scale;
    input.x=dx/max; input.y=dy/max;
    knob.style.transform=`translate(${dx}px,${dy}px)`;
  }
  zone.addEventListener('touchstart',e=>{const t=e.changedTouches[0];stickId=t.identifier;stickMove(t);e.preventDefault()},{passive:false});
  zone.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===stickId)stickMove(t);e.preventDefault()},{passive:false});
  function clearStick(){stickId=null;input.x=input.y=0;knob.style.transform='translate(0,0)'}
  zone.addEventListener('touchend',clearStick);zone.addEventListener('touchcancel',clearStick);

  document.querySelectorAll('.action').forEach(btn=>{
    const action=btn.dataset.action;
    const down=e=>{
      e.preventDefault();btn.classList.add('pressed');
      if(action==='guard'){ if(player && player.stun<=0){player.guard=true;} }
      else if(player) attack(player,action);
    };
    const up=e=>{e.preventDefault();btn.classList.remove('pressed');if(action==='guard'&&player)player.guard=false};
    btn.addEventListener('touchstart',down,{passive:false});btn.addEventListener('touchend',up,{passive:false});btn.addEventListener('touchcancel',up,{passive:false});
    btn.addEventListener('mousedown',down);btn.addEventListener('mouseup',up);btn.addEventListener('mouseleave',up);
  });

  // Keyboard support for desktop testing
  const keys={};
  addEventListener('keydown',e=>{
    keys[e.key.toLowerCase()]=true;
    if(e.repeat)return;
    if(e.key==='j')attack(player,'punch');
    if(e.key==='k')attack(player,'kick');
    if(e.key==='l')attack(player,'tongue');
    if(e.key==='i'&&player)player.guard=true;
  });
  addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.key==='i'&&player)player.guard=false});

  function enemyAI(dt){
    if(gameOver||enemy.stun>0)return;
    const dx=player.x-enemy.x,dy=player.y-enemy.y,dist=Math.hypot(dx,dy);
    if(enemy.attackT<=0){
      if(dist>105){ enemy.vx += Math.sign(dx)*enemy.speed*.9*dt; enemy.vy += Math.sign(dy)*enemy.speed*.55*dt; }
      else if(Math.random()<dt*.8) attack(enemy,Math.random()<.62?'punch':'kick');
      if(dist>120&&dist<enemy.tongueRange&&Math.random()<dt*.28) attack(enemy,'tongue');
      enemy.guard = dist<90 && Math.random()<dt*.25;
    }
  }

  function spawnImpact(x,y,type){
    const n=type==='guard'?7:11;
    for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.5)*180,t:.35,r:2+Math.random()*4,type});
  }

  function drawBackground(dt){
    const g=ctx.createLinearGradient(0,0,0,innerHeight);
    g.addColorStop(0,'#42c7d6');g.addColorStop(.52,'#10849a');g.addColorStop(1,'#075469');
    ctx.fillStyle=g;ctx.fillRect(0,0,innerWidth,innerHeight);

    // light shafts
    ctx.fillStyle='rgba(255,255,220,.07)';
    ctx.beginPath();ctx.moveTo(innerWidth*.15,0);ctx.lineTo(innerWidth*.35,0);ctx.lineTo(innerWidth*.55,innerHeight);ctx.lineTo(innerWidth*.42,innerHeight);ctx.fill();

    // plants / floor
    ctx.fillStyle='#075047';ctx.fillRect(0,innerHeight-35,innerWidth,35);
    ctx.strokeStyle='#16855f';ctx.lineWidth=8;ctx.lineCap='round';
    for(let x=20;x<innerWidth;x+=75){ctx.beginPath();ctx.moveTo(x,innerHeight);ctx.quadraticCurveTo(x-18,innerHeight-60,x+4,innerHeight-105);ctx.stroke()}

    ctx.fillStyle='rgba(230,255,255,.5)';
    bubbles.forEach(b=>{b.y-=b.s*dt;if(b.y<-12){b.y=innerHeight+10;b.x=Math.random()*innerWidth}ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill()});
  }

  function loop(now){
    requestAnimationFrame(loop);
    if(!screens.game.classList.contains('active')||!player||!enemy)return;
    let dt=Math.min(.033,(now-last)/1000);last=now;
    if(!gameOver){
      let ix=input.x+(keys['d']?1:0)-(keys['a']?1:0);
      let iy=input.y+(keys['s']?1:0)-(keys['w']?1:0);
      if(player.stun<=0&&!player.guard){
        player.vx += ix*player.speed*dt*3.0;
        player.vy += iy*player.speed*dt*2.4;
      }
      enemyAI(dt);
      player.update(dt);enemy.update(dt);

      if(comboTimer>0){comboTimer-=dt;if(comboTimer<=0){comboHits=0;comboEl.textContent=''}}
    } else {
      player.update(dt);enemy.update(dt);
    }

    drawBackground(dt);
    player.draw();enemy.draw();

    particles.forEach(p=>{p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92;
      ctx.globalAlpha=Math.max(0,p.t/.35);ctx.fillStyle=p.type==='guard'?'#d9f5ff':'#fff3a3';
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    });
    particles=particles.filter(p=>p.t>0);
  }

  resize();
  requestAnimationFrame(loop);
})();
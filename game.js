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
  let hitRings = [];
  let guardWaves = [];
  let gameOver = false;
  let comboTimer = 0;
  let comboHits = 0;

  const stats = {
    green: { speed: 160, tongue: 210, damage: 1.0, sink: 7, hue: 0 },
    blue:  { speed: 182, tongue: 260, damage: 0.88, sink: 5, hue: 95 }
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
      this.hurtFaceT=0;
      this.hurtFace='wink';

      // ガード / 波
      this.guardStartT=0;
      this.guardTapTimes=[];
      this.waveCooldown=0;
      this.guardBreakT=0;

      // 壁受け身
      this.wallTechT=0;

      // 水中ダッシュ
      this.dashT=0;
      this.dashCooldown=0;

      // 舌システム
      this.tonguePullTarget=null;   // 今、舌で引き寄せている相手
      this.tonguePullTimer=0;       // 2回目の舌入力を受け付ける時間
      this.tongueClashTarget=null;  // 投げ抜け時：お互い舌が伸びた相手
      this.tongueClashTimer=0;      // 舌の綱引き状態の残り時間
      this.throwState=null;         // 舌投げ中の状態
      this.spinAngle=0;
    }
    update(dt) {
      if (this.stun>0) this.stun-=dt;
      if (this.flash>0) this.flash-=dt;
      if (this.hurtFaceT>0) this.hurtFaceT-=dt;
      if (this.guardStartT>0) this.guardStartT-=dt;
      if (this.waveCooldown>0) this.waveCooldown-=dt;
      if (this.guardBreakT>0) this.guardBreakT-=dt;
      if (this.wallTechT>0) this.wallTechT-=dt;
      if (this.dashT>0) this.dashT-=dt;
      if (this.dashCooldown>0) this.dashCooldown-=dt;
      if (this.attackT>0) {
        this.attackT-=dt;
        if (this.attackT<=0) this.attack=null;
      }
      if (this.tongueT>0) this.tongueT-=dt;

      // 自分が相手を舌で引っ張っている間
      if(this.tonguePullTimer>0){
        this.tonguePullTimer-=dt;
        if(this.tonguePullTimer<=0){
          this.tonguePullTimer=0;
          this.tonguePullTarget=null;
        }
      }

      // 投げ抜け成功後の「舌の綱引き」
      if(this.tongueClashTimer>0){
        this.tongueClashTimer-=dt;
        if(this.tongueClashTimer<=0){
          this.tongueClashTimer=0;
          this.tongueClashTarget=null;
        }
      }

      this.vy += this.sink * dt;
      if(this.dashT>0){
        this.vx *= Math.pow(.82, dt);
        this.vy *= Math.pow(.86, dt);
      }else{
        this.vx *= Math.pow(.56, dt);
        this.vy *= Math.pow(.68, dt);
      }

      // 舌で引かれている側は、舌の持ち主へゆっくり吸い寄せられる
      const puller = this.isPlayer ? enemy : player;
      if(puller && puller.tonguePullTarget===this && puller.tonguePullTimer>0 && !this.throwState){
        const dx = puller.x - this.x;
        const dy = puller.y - this.y;
        this.vx += dx * 6.0 * dt;
        this.vy += dy * 6.0 * dt;
        this.stun = Math.max(this.stun, .08);
      }

      // 投げ抜け成功中：両者が中間へ寄っていく。
      if(this.tongueClashTarget && this.tongueClashTimer>0 && !this.throwState){
        const dx = this.tongueClashTarget.x - this.x;
        const dy = this.tongueClashTarget.y - this.y;
        this.vx += dx * 2.8 * dt;
        this.vy += dy * 2.8 * dt;
        this.stun = Math.max(this.stun, .06);
      }

      if(this.throwState){
        this.spinAngle += this.throwState.spinSpeed * dt;
      } else {
        this.spinAngle *= Math.pow(.03, dt);
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const minY=78, maxY=innerHeight-65;

      // 舌投げで壁・床に当たった瞬間に追加ダメージ
      if(this.throwState){
        const hitWall = this.x<=45 || this.x>=innerWidth-45;
        const hitFloor = this.y>=maxY;
        if(hitWall || hitFloor){
          const owner = this.throwState.owner;
          this.x=Math.max(45,Math.min(innerWidth-45,this.x));
          this.y=Math.max(minY,Math.min(maxY,this.y));

          // 壁に当たる直前にガードを押していれば受け身成功。
          // 床は今まで通りダメージ。壁だけ受け身可能。
          if(hitWall && this.wallTechT>0){
            this.throwState=null;
            this.spinAngle=0;
            this.wallTechT=0;
            this.stun=.12;
            this.hurtFaceT=.08;

            // 壁を蹴るように軽く跳ね返る
            this.vx *= -.28;
            this.vy *= .18;

            spawnImpact(this.x,this.y,'guard');

            comboEl.textContent='UKEMI!';
            setTimeout(()=>{
              if(comboEl.textContent==='UKEMI!') comboEl.textContent='';
            },520);
          }else{
            this.hp=Math.max(0,this.hp-7.0);
            this.vx *= -.18;
            this.vy = hitFloor ? -95 : this.vy*.25;
            this.stun=.42;
            spawnImpact(this.x,this.y,'hit');

            if(owner && owner.isPlayer){
              comboHits++;
              comboTimer=1.15;
              comboEl.textContent=`${comboHits} HIT!`;
            }

            this.throwState=null;
            updateHud();
            if(this.hp<=0) endGame(owner ? owner.isPlayer : false);
          }
        }
      }

      this.x=Math.max(45,Math.min(innerWidth-45,this.x));
      this.y=Math.max(minY,Math.min(maxY,this.y));
      if(this.y===maxY && !this.throwState) this.vy=Math.min(0,this.vy);

      const other = this.isPlayer ? enemy : player;
      if (other) this.face = other.x >= this.x ? 1 : -1;
    }
    hit(dmg,kx,ky) {
      if(this.guard){
        dmg*=.22; kx*=.2; ky*=.2;
        spawnImpact(this.x,this.y,'guard');
      } else {
        this.stun=.18;
        this.flash=.15;
        this.hurtFaceT=.32;
        this.hurtFace=Math.random()<.5?'wink':'both';
        spawnImpact(this.x,this.y,'hit');
      }
      this.hp=Math.max(0,this.hp-dmg);
      this.vx += kx; this.vy += ky;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x,this.y);
      if(this.throwState || Math.abs(this.spinAngle)>.02) ctx.rotate(this.spinAngle);
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

      // ニュートラル脚：横に開かず、胴体の下に軽くたたむ。
      // キック中は前脚をここでは描かず、攻撃ポーズ側で差し替える。
      ctx.strokeStyle='#4aa944';
      ctx.lineWidth=12;
      ctx.lineCap='round';
      ctx.lineJoin='round';
      ctx.beginPath();
      ctx.moveTo(-15,48); ctx.lineTo(-19,62); ctx.lineTo(-28,67);
      if(this.attack!=='kick'){
        ctx.moveTo(15,48); ctx.lineTo(19,62); ctx.lineTo(28,67);
      }
      ctx.stroke();

      // ニュートラル腕。
      // パンチ中・ガード中は通常腕を描かず、それぞれ専用ポーズに差し替える。
      if(!this.guard && this.attack!=='wave'){
        ctx.strokeStyle='#58bd50';
        ctx.lineWidth=10;
        ctx.beginPath();
        ctx.moveTo(-23,22); ctx.lineTo(-32,35);
        if(this.attack!=='punch'){
          ctx.moveTo(23,22); ctx.lineTo(32,35);
        }
        ctx.stroke();
      }

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

      // 目：通常時と被弾時で表情を変える
      if(this.hurtFaceT>0 || this.throwState){
        ctx.strokeStyle='#182a2a';
        ctx.lineWidth=4;
        ctx.lineCap='round';

        if(this.hurtFace==='both'){
          // 両目をぎゅっと閉じる
          ctx.beginPath();
          ctx.moveTo(-28,-30); ctx.lineTo(-19,-26); ctx.lineTo(-10,-30);
          ctx.moveTo(10,-30); ctx.lineTo(19,-26); ctx.lineTo(28,-30);
          ctx.stroke();
        }else{
          // 片目を閉じ、もう片方は開く
          ctx.fillStyle='#fff';
          ctx.beginPath();
          ctx.arc(19,-30,10,0,Math.PI*2);
          ctx.fill();

          ctx.fillStyle='#182a2a';
          ctx.beginPath();
          ctx.arc(22,-29,4,0,Math.PI*2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(-28,-30); ctx.lineTo(-19,-26); ctx.lineTo(-10,-30);
          ctx.stroke();
        }
      }else{
        ctx.fillStyle='#fff';
        ctx.beginPath();
        ctx.arc(-19,-30,10,0,Math.PI*2);
        ctx.arc(19,-30,10,0,Math.PI*2);
        ctx.fill();

        ctx.fillStyle='#182a2a';
        ctx.beginPath();
        ctx.arc(-16,-29,4,0,Math.PI*2);
        ctx.arc(22,-29,4,0,Math.PI*2);
        ctx.fill();
      }

      // ほっぺ
      ctx.fillStyle='rgba(255,130,150,.42)';
      ctx.beginPath();
      ctx.arc(-24,2,5,0,Math.PI*2);
      ctx.arc(24,2,5,0,Math.PI*2);
      ctx.fill();

      // 口：被弾時は口角を下げる
      ctx.strokeStyle='#255c31';
      ctx.lineWidth=3;
      ctx.lineCap='round';
      ctx.beginPath();
      if(this.hurtFaceT>0 || this.throwState){
        ctx.arc(0,9,12,1.15*Math.PI,1.85*Math.PI);
      }else{
        ctx.arc(0,-3,14,.15*Math.PI,.85*Math.PI);
      }
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
        ctx.moveTo(22,22);
        ctx.lineTo(59,8);
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
        ctx.moveTo(15,48);
        ctx.lineTo(60,48);
        ctx.stroke();
        ctx.restore();
      }

      if(this.tongueT>0 || (this.tonguePullTarget && this.tonguePullTimer>0) || (this.tongueClashTarget && this.tongueClashTimer>0)){
        const target = this.tongueClashTarget || this.tonguePullTarget || (this.isPlayer ? enemy : player);
        let len = Math.min(this.tongueRange, Math.abs(target.x-this.x));
        ctx.strokeStyle='#ff718e';
        ctx.lineWidth=8;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(28,-2);
        ctx.lineTo(28+len,-2);
        ctx.stroke();
      }

      if(this.attack==='wave'){
        ctx.save();
        ctx.filter = this.hue ? `hue-rotate(${this.hue}deg)` : 'none';
        ctx.strokeStyle='#58bd50';
        ctx.lineWidth=11;
        ctx.lineCap='round';
        ctx.beginPath();
        // 両手を胸から前へ押し出す
        ctx.moveTo(-17,21); ctx.lineTo(13,17); ctx.lineTo(42,15);
        ctx.moveTo(-15,31); ctx.lineTo(14,29); ctx.lineTo(42,28);
        ctx.stroke();
        ctx.fillStyle='#68cf5f';
        ctx.beginPath();
        ctx.arc(43,15,6,0,Math.PI*2);
        ctx.arc(43,28,6,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      if(this.guard){
        ctx.save();
        ctx.filter = this.hue ? `hue-rotate(${this.hue}deg)` : 'none';
        ctx.strokeStyle='#58bd50';
        ctx.lineWidth=11;
        ctx.lineCap='round';
        ctx.lineJoin='round';

        // ガードは胸の前で腕を交差。
        // 描画上は常に右側が「敵に近い側」になる（face反転前提）。
        // 近い側の腕は少し上へ、遠い側は真っ直ぐ内側へ。
        ctx.beginPath();

        // 遠い側の手：胸へ真っ直ぐ内側に差し込む
        ctx.moveTo(-23,22);
        ctx.lineTo(-8,19);
        ctx.lineTo(10,18);

        // 敵に近い側の手：上から斜めに胸を守る
        ctx.moveTo(23,22);
        ctx.lineTo(12,10);
        ctx.lineTo(-5,16);

        ctx.stroke();

        // 手先を少し丸く見せる
        ctx.fillStyle='#68cf5f';
        ctx.beginPath();
        ctx.arc(10,18,6,0,Math.PI*2);
        ctx.arc(-5,16,6,0,Math.PI*2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }
  }


  class PracticeDummy {
    constructor(){
      this.x=innerWidth*.72;
      this.y=innerHeight*.48;
      this.vx=0; this.vy=0;
      this.radius=34;
      this.hp=999999;
      this.guard=false;
      this.stun=0;
      this.throwState=null;
      this.flash=0;
      this.face=-1;
      this.isPlayer=false;
    }
    hit(dmg,kx,ky){
      this.vx+=kx*.72;
      this.vy+=ky*.72;
      this.flash=.13;
      this.stun=.08;
      spawnImpact(this.x,this.y,'hit');
    }
    update(dt){
      if(this.flash>0)this.flash-=dt;
      if(this.stun>0)this.stun-=dt;
      // 葉っぱなのでゆっくり元の高さへ漂う
      this.vy += Math.sin(performance.now()/650)*5*dt;
      this.vx *= Math.pow(.28,dt);
      this.vy *= Math.pow(.42,dt);
      this.x += this.vx*dt;
      this.y += this.vy*dt;
      this.x=Math.max(innerWidth*.48,Math.min(innerWidth-55,this.x));
      this.y=Math.max(95,Math.min(innerHeight-80,this.y));
    }
    draw(){
      ctx.save();
      ctx.translate(this.x,this.y);
      ctx.rotate(-.18 + Math.sin(performance.now()/700)*.08);
      if(this.flash>0)ctx.globalAlpha=.55;

      // 水中を漂う丸い葉っぱ
      ctx.fillStyle='#72c95d';
      ctx.beginPath();
      ctx.ellipse(0,0,38,25,-.18,0,Math.PI*2);
      ctx.fill();

      ctx.strokeStyle='#397e3d';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(-27,8);
      ctx.quadraticCurveTo(0,0,29,-8);
      ctx.stroke();

      ctx.strokeStyle='#4b9950';
      ctx.lineWidth=2;
      for(let i=-15;i<=15;i+=10){
        ctx.beginPath();
        ctx.moveTo(i,1);
        ctx.lineTo(i-9,-10);
        ctx.stroke();
      }

      // 練習相手だと分かる小さな的
      ctx.strokeStyle='rgba(255,255,255,.72)';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(0,0,11,0,Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0,0,4,0,Math.PI*2);
      ctx.stroke();

      ctx.restore();
    }
  }

  let player, enemy;
  let gameMode='battle'; // battle | practice
  let practiceLabel=null;
  const input={
    x:0,y:0,
    currentDir:null,
    lastReleasedDir:null,
    lastReleasedTime:0,
    dashUsedThisTouch:false
  };

  function getStickDirection(x,y){
    const mag=Math.hypot(x,y);
    if(mag<.40) return null;

    const angle=Math.atan2(y,x);
    const oct=Math.round(angle/(Math.PI/4));
    const dirs=['right','downRight','down','downLeft','left','upLeft','up','upRight'];
    return dirs[(oct+8)%8];
  }

  function dashVector(dir){
    const s=Math.SQRT1_2;
    const map={
      right:[1,0],
      downRight:[s,s],
      down:[0,1],
      downLeft:[-s,s],
      left:[-1,0],
      upLeft:[-s,-s],
      up:[0,-1],
      upRight:[s,-s]
    };
    return map[dir] || [0,0];
  }

  function doDash(dir){
    if(!player || gameOver || player.stun>0 || player.guard || player.throwState || player.dashCooldown>0) return false;

    const [dx,dy]=dashVector(dir);
    player.vx += dx*340;
    player.vy += dy*275;
    player.dashT=.25;
    player.dashCooldown=.44;

    comboEl.textContent='DASH!';
    setTimeout(()=>{
      if(comboEl.textContent==='DASH!') comboEl.textContent='';
    },380);

    for(let i=0;i<12;i++){
      particles.push({
        x:player.x-dx*(12+Math.random()*30),
        y:player.y-dy*(12+Math.random()*30)+(Math.random()-.5)*30,
        vx:-dx*(55+Math.random()*90)+(Math.random()-.5)*35,
        vy:-dy*(55+Math.random()*90)+(Math.random()-.5)*35,
        t:.34+Math.random()*.14,
        r:2+Math.random()*4,
        type:'guard'
      });
    }
    return true;
  }

  function checkTouchDash(){
    const dir=getStickDirection(input.x,input.y);
    input.currentDir=dir;
    if(!dir || input.dashUsedThisTouch) return;

    const now=performance.now();
    if(
      input.lastReleasedDir===dir &&
      now-input.lastReleasedTime<=450
    ){
      if(doDash(dir)){
        input.dashUsedThisTouch=true;
        input.lastReleasedDir=null;
        input.lastReleasedTime=0;
      }
    }
  }


  function startPractice(){
    gameMode='practice';
    gameOver=false;
    comboHits=0;
    comboTimer=0;

    player=new Fighter(innerWidth*.28,innerHeight*.48,true,selected||'green');
    enemy=new PracticeDummy();

    if(title) title.classList.add('hidden');
    if(select) select.classList.add('hidden');
    if(game) game.classList.remove('hidden');

    if(!practiceLabel){
      practiceLabel=document.createElement('div');
      practiceLabel.className='practice-label';
      practiceLabel.textContent='操作練習　∞';
      document.body.appendChild(practiceLabel);
    }
    practiceLabel.style.display='block';

    updateHud();
  }

  function startGame() {
    gameMode='battle';
    if(practiceLabel) practiceLabel.style.display='none';
    gameOver=false; restartButton.hidden=true; comboHits=0; comboTimer=0; comboEl.textContent='';
    player = new Fighter(innerWidth*.28, innerHeight*.52, true, selectedFighter);
    enemy = new Fighter(innerWidth*.72, innerHeight*.48, false, 'green');
    enemy.hp=100;
    bubbles = Array.from({length:28}, () => ({
      x:Math.random()*innerWidth, y:Math.random()*innerHeight, r:2+Math.random()*6, s:10+Math.random()*26
    }));
    particles=[];
    hitRings=[];
    guardWaves=[];
    running=true; last=performance.now();
  }

  function attack(f, kind) {
    if(gameOver || f.guard) return;

    // 舌で引かれている最中だけは、stun中でも舌による投げ抜けを受け付ける。
    const pullerForEscape = f.isPlayer ? enemy : player;
    const canTongueEscape = kind==='tongue' && pullerForEscape &&
      pullerForEscape.tonguePullTarget===f && pullerForEscape.tonguePullTimer>0;

    if(!canTongueEscape && (f.stun>0 || f.attackT>0)) return;
    const other = f.isPlayer ? enemy : player;
    const dir=f.face;
    const dist=Math.hypot(other.x-f.x, other.y-f.y);

    if(kind==='punch'){
      f.attack='punch';f.attackT=.34;
      if(dist<82 && Math.abs(other.y-f.y)<55){
        setTimeout(()=>damageHit(f,other,2.6*f.damageMul,52*dir,-5),125);
      }
    } else if(kind==='kick'){
      f.attack='kick';f.attackT=.50;
      if(dist<100 && Math.abs(other.y-f.y)<70){
        setTimeout(()=>damageHit(f,other,5.2*f.damageMul,142*dir,-21),175);
      }
    } else if(kind==='tongue'){
      // 自分が舌で引き寄せられている最中に舌を押すと「投げ抜け」。
      // お互いの舌が伸びたままになり、投げには移行せず中央へ接近する。
      const puller = f.isPlayer ? enemy : player;
      if(puller && puller.tonguePullTarget===f && puller.tonguePullTimer>0){
        puller.tonguePullTarget=null;
        puller.tonguePullTimer=0;

        f.tongueClashTarget=puller;
        f.tongueClashTimer=.72;
        puller.tongueClashTarget=f;
        puller.tongueClashTimer=.72;

        f.tongueT=.72;
        puller.tongueT=.72;
        f.attack='tongue';
        f.attackT=.24;

        // 互いの速度を一度落とし、中央へじわっと寄る。
        f.vx*=.3; f.vy*=.3;
        puller.vx*=.3; puller.vy*=.3;

        spawnImpact((f.x+puller.x)/2,(f.y+puller.y)/2,'guard');
        return;
      }

      // 引き寄せ中にもう一度舌を押したら「舌投げ」
      if(!f.tongueClashTarget && f.tonguePullTarget && f.tonguePullTimer>0){
        const target=f.tonguePullTarget;
        f.tongueT=.18;
        f.attack='tongue';
        f.attackT=.28;

        // 2回目の舌は、相手を自分の後方へ回転させながら投げ飛ばす。
        const throwDir = -f.face;

        target.throwState={
          owner:f,
          spinSpeed: throwDir*15
        };
        target.spinAngle=0;
        target.hurtFace='both';
        target.hurtFaceT=.7;

        // 少し上向きに放り、後方の壁へ叩きつけやすくする。
        target.vx = throwDir*720;
        target.vy = -115;

        target.stun=.55;
        f.tonguePullTarget=null;
        f.tonguePullTimer=0;
        spawnImpact(target.x,target.y,'hit');
        return;
      }

      // 通常の舌。コンボ中でなくても小ダメージ＋引き寄せ。
      f.tongueT=.22;
      f.attack='tongue';
      f.attackT=.3;

      if(Math.abs(other.x-f.x)<f.tongueRange && Math.abs(other.y-f.y)<82 && Math.sign(other.x-f.x)===dir){
        setTimeout(()=>{
          if(!other.guard){
            // まず小ダメージ
            damageHit(f,other,1.8*f.damageMul,0,0);

            // 一定時間、相手を自分へ引き寄せる
            f.tonguePullTarget=other;
            f.tonguePullTimer=.72;
            other.stun=Math.max(other.stun,.18);

            const dx=f.x-other.x;
            const dy=f.y-other.y;
            other.vx += dx*1.8;
            other.vy += dy*1.8;
          } else {
            spawnImpact(other.x,other.y,'guard');
          }
        },70);
      }
    }
  }

  function damageHit(attacker,target,dmg,kx,ky){
    if(gameOver) return;

    // ガード直後の緩めの受付時間ならジャストガード。
    // 攻撃側に少し長めの隙を作る。
    const justGuard = target.guard && target.guardStartT>0;
    target.hit(dmg,kx,ky);
    if(gameMode==='practice' && target===enemy) target.hp=999999;

    if(justGuard){
      attacker.stun=Math.max(attacker.stun,.42);
      attacker.attackT=Math.max(attacker.attackT,.42);
      attacker.vx += -attacker.face*55;
      spawnImpact(attacker.x,attacker.y,'guard');
      comboEl.textContent='JUST GUARD!';
      setTimeout(()=>{
        if(comboEl.textContent==='JUST GUARD!') comboEl.textContent='';
      },520);
    }
    if(attacker.isPlayer && !target.guard){
      comboHits++; comboTimer=1.15;
      comboEl.textContent = comboHits>1 ? `${comboHits} HIT!` : '';
    }
    updateHud();
    if(target.hp<=0) endGame(attacker.isPlayer);
  }

  function endGame(playerWon){
    if(gameMode==='practice') return;
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
    checkTouchDash();
  }
  zone.addEventListener('touchstart',e=>{
    const t=e.changedTouches[0];
    stickId=t.identifier;
    input.dashUsedThisTouch=false;
    stickMove(t);
    e.preventDefault();
  },{passive:false});
  zone.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===stickId)stickMove(t);e.preventDefault()},{passive:false});
  function clearStick(){
    if(input.currentDir && !input.dashUsedThisTouch){
      input.lastReleasedDir=input.currentDir;
      input.lastReleasedTime=performance.now();
    }
    stickId=null;
    input.x=input.y=0;
    input.currentDir=null;
    input.dashUsedThisTouch=false;
    knob.style.transform='translate(0,0)';
  }
  zone.addEventListener('touchend',clearStick);zone.addEventListener('touchcancel',clearStick);

  document.querySelectorAll('.action').forEach(btn=>{
    const action=btn.dataset.action;
    const down=e=>{
      e.preventDefault();btn.classList.add('pressed');
      if(action==='guard'){
        if(player){
          // 舌投げで回転中は通常ガードではなく「壁受け身入力」。
          // 約0.24秒だけ受け身受付を残す。
          if(player.throwState){
            player.wallTechT=.24;
            return;
          }

          if(player.stun<=0){
            const now=performance.now();
            player.guardTapTimes=player.guardTapTimes.filter(t=>now-t<650);
            player.guardTapTimes.push(now);

            // ガード開始直後 約0.28秒はジャストガード受付。
            player.guard=true;
            player.guardStartT=.28;

            // 650ms以内に3回で水押し波。ダメージは0、吹き飛ばしのみ。
            if(player.guardTapTimes.length>=3){
              player.guardTapTimes=[];
              guardWave(player);
            }
          }
        }
      }
      else if(player) attack(player,action);
    };
    const up=e=>{e.preventDefault();btn.classList.remove('pressed');if(action==='guard'&&player)player.guard=false};
    btn.addEventListener('touchstart',down,{passive:false});btn.addEventListener('touchend',up,{passive:false});btn.addEventListener('touchcancel',up,{passive:false});
    btn.addEventListener('mousedown',down);btn.addEventListener('mouseup',up);btn.addEventListener('mouseleave',up);
  });

  // Keyboard support for desktop testing
  const keys={};
  const keyDashTimes={};
  addEventListener('keydown',e=>{
    const key=e.key.toLowerCase();
    keys[key]=true;
    if(e.repeat)return;

    if(['w','a','s','d'].includes(key)){
      const now=performance.now();
      if(keyDashTimes[key] && now-keyDashTimes[key]<=450){
        const map={w:'up',a:'left',s:'down',d:'right'};
        doDash(map[key]);
        keyDashTimes[key]=0;
      }else{
        keyDashTimes[key]=now;
      }
    }
    if(e.key==='j')attack(player,'punch');
    if(e.key==='k')attack(player,'kick');
    if(e.key==='l')attack(player,'tongue');
    if(e.key==='i'&&player)player.guard=true;
  });
  addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.key==='i'&&player)player.guard=false});

  function enemyAI(dt){
    if(gameMode==='practice') return;
    if(gameOver)return;

    // CPUも舌で引かれている時は、たまに投げ抜けを狙う。
    if(player && player.tonguePullTarget===enemy && player.tonguePullTimer>0){
      if(Math.random()<dt*3.2) attack(enemy,'tongue');
      return;
    }

    if(enemy.stun>0)return;
    const dx=player.x-enemy.x,dy=player.y-enemy.y,dist=Math.hypot(dx,dy);
    if(enemy.attackT<=0){
      if(dist>105){ enemy.vx += Math.sign(dx)*enemy.speed*.9*dt; enemy.vy += Math.sign(dy)*enemy.speed*.55*dt; }
      else if(Math.random()<dt*.8) attack(enemy,Math.random()<.62?'punch':'kick');
      if(enemy.tonguePullTarget && enemy.tonguePullTimer>0 && Math.random()<dt*2.2){
        attack(enemy,'tongue');
      } else if(dist>120&&dist<enemy.tongueRange&&Math.random()<dt*.28) {
        attack(enemy,'tongue');
      }
      enemy.guard = dist<90 && Math.random()<dt*.25;
    }
  }

  function guardWave(f){
    if(!f || gameOver || f.waveCooldown>0) return;

    f.waveCooldown=1.05;
    f.guard=false;
    f.attack='wave';
    f.attackT=.48;

    const dir=f.face;
    guardWaves.push({
      owner:f,
      x:f.x+dir*34,
      y:f.y+18,
      dir,
      r:18,
      t:.48,
      life:.48,
      hit:false
    });

    // 水を両手で押した反動
    f.vx += -dir*42;
  }

  function spawnImpact(x,y,type){
    const n=type==='guard'?8:16;
    for(let i=0;i<n;i++){
      particles.push({
        x,y,
        vx:(Math.random()-.5)*(type==='guard'?160:240),
        vy:(Math.random()-.5)*(type==='guard'?160:240),
        t:type==='guard'?.32:.42,
        r:2+Math.random()*(type==='guard'?4:6),
        type
      });
    }

    // 当たった瞬間に広がるリングで、ヒットを見やすくする
    hitRings.push({
      x,y,
      r:type==='guard'?12:10,
      max:type==='guard'?42:58,
      t:type==='guard'?.28:.34,
      life:type==='guard'?.28:.34,
      type
    });
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
        player.vx += ix*player.speed*dt*2.05;
        player.vy += iy*player.speed*dt*1.68;
      }
      enemyAI(dt);
      player.update(dt);enemy.update(dt);

      // ガード3連打で出る小さな水の波。
      guardWaves.forEach(w=>{
        w.t-=dt;
        w.x += w.dir*285*dt;
        w.r += 42*dt;

        const target=w.owner.isPlayer?enemy:player;
        if(!w.hit && target){
          const dx=target.x-w.x, dy=target.y-w.y;
          if(Math.hypot(dx,dy)<w.r+target.radius){
            w.hit=true;
            // ダメージ無し。水圧だけで押し返す。
            target.vx += w.dir*365;
            target.vy += -38;
            target.stun=Math.max(target.stun,.16);
            spawnImpact(target.x,target.y,'guard');
          }
        }
      });
      guardWaves=guardWaves.filter(w=>w.t>0);

      if(comboTimer>0){comboTimer-=dt;if(comboTimer<=0){comboHits=0;comboEl.textContent=''}}
    } else {
      player.update(dt);enemy.update(dt);
    }

    drawBackground(dt);
    player.draw();enemy.draw();

    guardWaves.forEach(w=>{
      const a=Math.max(0,w.t/w.life);
      ctx.save();
      ctx.globalAlpha=a*.72;
      ctx.strokeStyle='#d9f8ff';
      ctx.lineWidth=7;
      ctx.lineCap='round';

      // 進行方向へ膨らむ短い水の波
      ctx.beginPath();
      if(w.dir>0){
        ctx.arc(w.x,w.y,w.r,-1.05,1.05);
      }else{
        ctx.arc(w.x,w.y,w.r,Math.PI-1.05,Math.PI+1.05);
      }
      ctx.stroke();

      ctx.globalAlpha=a*.42;
      ctx.lineWidth=3;
      ctx.beginPath();
      if(w.dir>0){
        ctx.arc(w.x-w.dir*8,w.y,w.r+10,-.9,.9);
      }else{
        ctx.arc(w.x-w.dir*8,w.y,w.r+10,Math.PI-.9,Math.PI+.9);
      }
      ctx.stroke();
      ctx.restore();
    });

    particles.forEach(p=>{p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92;
      ctx.globalAlpha=Math.max(0,p.t/.42);ctx.fillStyle=p.type==='guard'?'#d9f5ff':'#fff3a3';
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    });
    particles=particles.filter(p=>p.t>0);

    hitRings.forEach(r=>{
      r.t-=dt;
      const p=1-Math.max(0,r.t)/r.life;
      const radius=r.r+(r.max-r.r)*p;
      ctx.globalAlpha=Math.max(0,r.t/r.life);
      ctx.strokeStyle=r.type==='guard'?'#d9f5ff':'#fff7b0';
      ctx.lineWidth=r.type==='guard'?4:6;
      ctx.beginPath();
      ctx.arc(r.x,r.y,radius,0,Math.PI*2);
      ctx.stroke();
      ctx.globalAlpha=1;
    });
    hitRings=hitRings.filter(r=>r.t>0);
  }

  resize();
  requestAnimationFrame(loop);
})();

  // v1.5 mode menu
  const practiceBtn=document.getElementById('practiceBtn');
  if(practiceBtn){
    practiceBtn.addEventListener('click',()=>{
      // キャラ選択を飛ばさず、現在選択中のカエルで練習開始
      startPractice();
    });
    practiceBtn.addEventListener('touchend',e=>{
      e.preventDefault();
      startPractice();
    },{passive:false});
  }

  // キャラクター選択カードの下に、将来の専用必殺技欄を表示。
  document.querySelectorAll('.char-card, .character-card, [data-char]').forEach((card,i)=>{
    if(card.querySelector('.special-hint')) return;
    const hint=document.createElement('div');
    hint.className='special-hint';
    hint.textContent=i===0
      ? '専用必殺技：準備中　↓↘→＋パンチ 予定'
      : '専用必殺技：準備中　←→＋舌 予定';
    card.appendChild(hint);
  });

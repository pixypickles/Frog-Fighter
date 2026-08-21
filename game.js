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
  const practiceExitButton = document.getElementById('practiceExitButton');

  let selectedFighter = 'green';
  let running = false;
  let last = performance.now();
  let bubbles = [];
  let particles = [];
  let hitRings = [];
  let guardWaves = [];
  let aquaTornadoes = [];
  let siltClouds = [];
  let catfishCharges = [];
  let gameOver = false;
  let comboTimer = 0;
  let comboHits = 0;

  const stats = {
    green:  { speed: 160, tongue: 210, damage: 1.0, sink: 7, hue: 0 },
    blue:   { speed: 182, tongue: 260, damage: 0.88, sink: 5, hue: 95 },
    black:  { speed: 148, tongue: 225, damage: 1.22, sink: 9, hue: 0 },
    purple: { speed: 174, tongue: 245, damage: 0.92, sink: 5, hue: 0 }
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

  const practiceBtn=document.getElementById('practiceBtn');
  if(practiceBtn){
    const openPractice=(e)=>{
      if(e){
        e.preventDefault();
        e.stopPropagation();
      }
      startPractice();
    };

    // スマホ・PC共通。touch/clickの二重発火を避ける。
    practiceBtn.addEventListener('pointerup',openPractice);
    practiceBtn.addEventListener('click',(e)=>{
      // pointerイベント非対応環境の保険
      if(window.PointerEvent) return;
      openPractice(e);
    });
  }

  if(practiceExitButton){
    practiceExitButton.addEventListener('pointerup',(e)=>{
      e.preventDefault();
      e.stopPropagation();

      gameMode='battle';
      if(practiceLabel) practiceLabel.style.display='none';
      practiceExitButton.hidden=true;
      comboEl.textContent='';
      show('select');
    });
  }

  restartButton.onclick = () => {
    if(gameMode==='practice') startPractice();
    else startGame();
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function drawBurningAura(x,y,rx,ry,rotation=0){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(rotation);
    ctx.globalCompositeOperation='lighter';

    const pulse=.92+Math.sin(performance.now()/55)*.08;
    ctx.scale(pulse,pulse);

    for(let i=0;i<4;i++){
      const t=performance.now()/120+i*1.7;
      ctx.globalAlpha=.12+i*.06;
      ctx.fillStyle=i%2===0?'#ff2d20':'#ff8a28';
      ctx.beginPath();
      ctx.ellipse(
        Math.sin(t*1.8+i)*4,
        Math.cos(t*1.3+i)*3,
        rx+i*3,ry+i*2,0,0,Math.PI*2
      );
      ctx.fill();
    }

    for(let i=0;i<5;i++){
      const a=performance.now()/300+i*1.25;
      ctx.globalAlpha=.5;
      ctx.fillStyle=i%2?'#ff3b25':'#ffad3d';
      ctx.beginPath();
      ctx.arc(Math.cos(a)*rx*.75,Math.sin(a*1.4)*ry*.7,2.2+(i%2),0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function fighterPalette(type){
    if(type==='black'){
      return {
        body:'#3b4048',
        limb:'#3b4048',
        light:'#59616d',
        belly:'#707984',
        eyeBump:'#4b525c'
      };
    }
    if(type==='purple'){
      return {
        body:'#8b45b5',
        limb:'#8b45b5',
        light:'#b66bd8',
        belly:'#c98ae6',
        eyeBump:'#a85ecb'
      };
    }
    if(type==='blue'){
      return {
        body:'#31aee8',
        limb:'#31aee8',
        light:'#75d8ff',
        belly:'#8ee3ff',
        eyeBump:'#63c8ef'
      };
    }
    return {
      body:'#39cb4d',
      limb:'#39cb4d',
      light:'#78e36d',
      belly:'#86e77b',
      eyeBump:'#63df6e'
    };
  }

  class Fighter {
    constructor(x, y, isPlayer, type='green') {
      const s = stats[type] || stats.green;
      this.x=x; this.y=y; this.vx=0; this.vy=0; this.isPlayer=isPlayer;
      this.type=type; this.speed=s.speed; this.tongueRange=s.tongue; this.damageMul=s.damage;
      this.sink=s.sink; this.hue=s.hue;
      this.radius=35; this.hp=100; this.face = isPlayer ? 1 : -1;
      this.attack=null; this.attackT=0; this.attackVariant='mid'; this.stun=0; this.guard=false; this.tongueT=0;
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

      // 必殺技
      this.specialT=0;
      this.specialType=null;
      this.specialHitDone=false;
      this.luciferGrabTarget=null;
      this.luciferGrabT=0;
      this.luciferRushHits=0;
      this.luciferPunchSide=0;
      this.ribbonWhipIndex=0;
      this.luciferDiveHits=0;

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
      if (this.specialT>0){
        this.specialT-=dt;
        if(this.specialT<=0){
          this.specialT=0;
          this.specialType=null;
          this.specialHitDone=false;
        }
      }
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
        // 舌投げだけは従来どおり画面平面内で回転
        this.spinAngle += this.throwState.spinSpeed * dt;
      } else {
        this.spinAngle *= Math.pow(.03, dt);
      }

      // ルシファーさん：斜め下降キック連打。
      if(this.specialType==='darknessRush' && this.luciferDiveHits<4){
        const other=this.isPlayer?enemy:player;
        const active=this.specialT<=.82 && this.specialT>=.12 && this.vy>30;
        if(other && active){
          const fx=this.x+this.face*42;
          const fy=this.y+36;
          const d=Math.hypot(other.x-fx,other.y-fy);
          const now=performance.now();
          if(d<other.radius+38 && (!this._lastDarkHit || now-this._lastDarkHit>125)){
            this._lastDarkHit=now;
            this.luciferDiveHits++;
            const last=this.luciferDiveHits===4;
            damageHit(this,other,(last?4.0:2.2)*this.damageMul,
                      (last?145:45)*this.face,last?105:35);
          }
        }
      }

      // 必殺技の赤いオーラが出ている間は、手足そのものに当たり判定を持たせる。
      // 1回の必殺技につき1ヒット。見た目と判定の時間を一致させる。
      if(this.specialType && !this.specialHitDone){
        const other = this.isPlayer ? enemy : player;

        if(other){
          if(this.specialType==='uppercut'){
            // 溜めが終わって上昇し始めてから赤い拳が有効。
            const active = this.specialT<=.54 && this.specialT>=.08;
            if(active){
              const hx=this.x + this.face*48;
              const hy=this.y - 22;
              const hitDist=Math.hypot(other.x-hx, other.y-hy);

              if(hitDist < other.radius + 28){
                this.specialHitDone=true;
                damageHit(this,other,8.0*this.damageMul,90*this.face,-230);
              }
            }
          }else if(this.specialType==='dropkick'){
            // 突進開始後、赤い足が消える直前まで有効。
            const active = this.specialT<=.475 && this.specialT>=.06;
            if(active){
              const fx=this.x + this.face*61;
              const fy=this.y + 39;
              const hitDist=Math.hypot(other.x-fx, other.y-fy);

              if(hitDist < other.radius + 31){
                this.specialHitDone=true;
                damageHit(this,other,10.0*this.damageMul,240*this.face,-35);
              }
            }
          }
        }
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
      const pal=fighterPalette(this.type);


      // ヘルラッシュ中は少し低い姿勢
      if(this.specialType==='hellRush' && this.specialT>.55){
        ctx.translate(0,8); ctx.scale(1.04,.90);
      }

      // かえる跳びアッパーの溜め：少ししゃがむ
      if(this.specialType==='uppercut' && this.specialT>.48){
        ctx.translate(0,10);
        ctx.scale(1.08,.82);
      }

      if(this.throwState || Math.abs(this.spinAngle)>.02) ctx.rotate(this.spinAngle);
      if(this.face<0) ctx.scale(-1,1);
      if(this.flash>0) ctx.globalAlpha=.55;

      ctx.save();
      ctx.filter='none';

      // 2頭身くらいの丸い胴体
      ctx.fillStyle=pal.limb;
      ctx.beginPath();
      ctx.ellipse(0,31,30,34,0,0,Math.PI*2);
      ctx.fill();

      // お腹
      ctx.fillStyle=pal.belly;
      ctx.beginPath();
      ctx.ellipse(2,36,19,23,0,0,Math.PI*2);
      ctx.fill();

      // ニュートラル脚：横に開かず、胴体の下に軽くたたむ。
      // キック中は前脚をここでは描かず、攻撃ポーズ側で差し替える。
      ctx.strokeStyle=pal.limb;
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
        ctx.strokeStyle=pal.limb;
        ctx.lineWidth=10;
        ctx.beginPath();
        ctx.moveTo(-23,22); ctx.lineTo(-32,35);
        if(this.attack!=='punch'){
          ctx.moveTo(23,22); ctx.lineTo(32,35);
        }
        ctx.stroke();
      }

      // 頭
      ctx.fillStyle=pal.body;
      ctx.beginPath();
      ctx.ellipse(0,-6,35,30,0,0,Math.PI*2);
      ctx.fill();

      // 目のふくらみ
      ctx.fillStyle=pal.eyeBump;
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

      // リリスさん：頭の大きなリボン
      if(this.type==='purple'){
        ctx.save();
        ctx.translate(0,-58);
        ctx.fillStyle='#ff86c8';
        ctx.strokeStyle='#8b2f72';
        ctx.lineWidth=2.5;
        ctx.beginPath();
        ctx.moveTo(-3,2);
        ctx.quadraticCurveTo(-24,-14,-27,3);
        ctx.quadraticCurveTo(-24,18,-3,7);
        ctx.closePath();
        ctx.moveTo(3,2);
        ctx.quadraticCurveTo(24,-14,27,3);
        ctx.quadraticCurveTo(24,18,3,7);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle='#ffd0eb';
        ctx.beginPath(); ctx.arc(0,4,7,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }

      // ルシファーさん：シンプルな一本傷
      if(this.type==='black'){
        ctx.save();
        ctx.strokeStyle='#a74a4e';
        ctx.lineWidth=3.4;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(8,-27);
        ctx.lineTo(24,-8);
        ctx.stroke();
        ctx.restore();
      }

      // パンチは腕だけ前へ
      if(this.attack==='punch'){
        ctx.save();
        ctx.filter='none';
        ctx.strokeStyle=pal.limb;
        ctx.lineWidth=12;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(22,22);
        if(this.specialType==='aquaTornado'){
          ctx.lineTo(48,-34);
        }else if(this.attackVariant==='up'){
          ctx.lineTo(48,-22);
        }else{
          ctx.lineTo(59,8);
        }
        ctx.stroke();
        ctx.restore();

        if(this.specialType==='uppercut' && this.specialT<=.54 && this.specialT>=.08){
          drawBurningAura(48,-22,13,18,-.35);
        }
      }

      // キックは脚だけ前へ
      if(this.attack==='kick' && this.specialType!=='dropkick' && this.specialType!=='aquaStream'){
        ctx.save();
        ctx.filter='none';
        ctx.strokeStyle=pal.limb;
        ctx.lineWidth=13;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(15,48);
        if(this.attackVariant==='down'){
          ctx.lineTo(52,78);
        }else{
          ctx.lineTo(60,48);
        }
        ctx.stroke();
        ctx.restore();
      }

      if(this.specialType==='dropkick'){
        // 攻撃する脚は1本だけ。反対側の脚は軸足として身体側に残す。
        ctx.save();
        ctx.filter='none';
        ctx.strokeStyle=pal.limb;
        ctx.lineWidth=13;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(14,46);
        ctx.lineTo(67,39);
        ctx.stroke();
        ctx.restore();

        if(this.specialT<=.475 && this.specialT>=.06){
          drawBurningAura(61,39,25,13,-.12);
        }
      }

      if(this.specialType==='aquaStream'){
        ctx.save();
        ctx.filter='none';
        ctx.strokeStyle=pal.limb;
        ctx.lineWidth=13;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(15,47);
        ctx.lineTo(48,68);
        ctx.stroke();
        ctx.restore();
      }

      if(this.specialType==='ribbonWhip'){
        ctx.save();
        ctx.strokeStyle='#f08b9a';
        ctx.lineWidth=6;
        ctx.lineCap='round';

        const phase=(performance.now()/55);
        const offsets=[-24,16,-8,26,-18,10,0];

        // 舌の根元は常に口中央。
        // 先端側だけが何本も高速で飛び出して見えるようにする。
        for(let i=0;i<5;i++){
          const idx=(Math.floor(phase)+i)%offsets.length;
          const y=offsets[idx];
          const reach=92+i*18;
          const alpha=.28+i*.14;

          ctx.globalAlpha=alpha;
          ctx.beginPath();
          ctx.moveTo(0,8);
          ctx.lineTo(reach,y);
          ctx.stroke();

          // 舌先だけ少し太くして「突き」の連打感を出す
          ctx.beginPath();
          ctx.arc(reach,y,5.2,0,Math.PI*2);
          ctx.fillStyle='#ff9dad';
          ctx.fill();
        }

        ctx.restore();
      }

      // ヘルラッシュ：左右の拳を交互に大きく突き出す。
      if(this.specialType==='hellRush'){
        const hammer=this.luciferRushHits>=4;
        const side=this.luciferPunchSide||0;
        ctx.save();
        ctx.strokeStyle=pal.limb;
        ctx.lineWidth=14;
        ctx.lineCap='round';

        if(hammer){
          // 最後は頭上から振り下ろす
          ctx.beginPath();
          ctx.moveTo(18,-2);
          ctx.lineTo(28,-42);
          ctx.lineTo(45,28);
          ctx.stroke();
        }else{
          // 左右で高さを変え、連打感を出す
          const yy=side===0?-8:17;
          ctx.beginPath();
          ctx.moveTo(15,yy*.25);
          ctx.lineTo(67,yy);
          ctx.stroke();

          // 引いている反対の拳
          ctx.globalAlpha=.65;
          ctx.beginPath();
          ctx.moveTo(-13,-yy*.15);
          ctx.lineTo(8,-yy*.45);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ダークネスラッシュ：片足を斜め前下へ伸ばす
      if(this.specialType==='darknessRush'){
        ctx.save();
        ctx.strokeStyle=pal.limb;
        ctx.lineWidth=13;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(15,47);
        ctx.lineTo(58,67);
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
        // 舌だけは口の中央から出す
        ctx.moveTo(0,8);
        ctx.lineTo(len,8);
        ctx.stroke();
      }

      if(this.attack==='wave'){
        ctx.save();
        ctx.filter='none';
        ctx.strokeStyle=pal.limb;
        ctx.lineWidth=11;
        ctx.lineCap='round';
        ctx.beginPath();
        // 両手を胸から前へ押し出す
        ctx.moveTo(-17,21); ctx.lineTo(13,17); ctx.lineTo(42,15);
        ctx.moveTo(-15,31); ctx.lineTo(14,29); ctx.lineTo(42,28);
        ctx.stroke();
        ctx.fillStyle=pal.light;
        ctx.beginPath();
        ctx.arc(43,15,6,0,Math.PI*2);
        ctx.arc(43,28,6,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      if(this.guard){
        ctx.save();
        ctx.filter='none';
        ctx.strokeStyle=pal.limb;
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
        ctx.fillStyle=pal.light;
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
      this.tonguePullTarget=null;
      this.tonguePullTimer=0;
      this.tongueClashTarget=null;
      this.tongueClashTimer=0;
      this.spinAngle=0;
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
    dashUsedThisTouch:false,
    commandHistory:[],
    luciferTongueReadyUntil:0,
    punchTapTimes:[],
    tongueTapTimes:[],
    guardTapTimes:[],
    lastBackInputTime:0,
    purpleGuardCount:0,
    purpleGuardLastTime:0
  };

  function pushCommandDir(dir){
    if(!dir) return;
    const now=performance.now();
    const hist=input.commandHistory;
    const last=hist[hist.length-1];

    if(!last || last.dir!==dir){
      hist.push({dir,time:now});
    }else{
      last.time=now;
    }

    // 古い入力は削除
    input.commandHistory=hist.filter(v=>now-v.time<=900).slice(-8);
  }

  function hasCommand(sequence, maxMs=700){
    const now=performance.now();
    const hist=input.commandHistory.filter(v=>now-v.time<=maxMs);

    let i=hist.length-1;
    for(let s=sequence.length-1;s>=0;s--){
      while(i>=0 && hist[i].dir!==sequence[s]) i--;
      if(i<0) return false;
      i--;
    }
    return true;
  }

  function clearCommand(){
    input.commandHistory=[];
  }

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

    // リリスさん用：後ろ方向を入れた時刻を記録
    if(player && player.type==='purple' && dir){
      const back=player.face>0?'left':'right';
      const backUp=player.face>0?'upLeft':'upRight';
      const backDown=player.face>0?'downLeft':'downRight';
      if(dir===back || dir===backUp || dir===backDown){
        input.lastBackInputTime=performance.now();
      }
    }
    if(dir) pushCommandDir(dir);
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
    restartButton.hidden=true;
    comboHits=0;
    comboTimer=0;
    comboEl.textContent='';

    show('game');
    resize();

    player=new Fighter(innerWidth*.28,innerHeight*.50,true,selectedFighter);
    enemy=new PracticeDummy();

    bubbles=Array.from({length:28},()=>({
      x:Math.random()*innerWidth,
      y:Math.random()*innerHeight,
      r:2+Math.random()*6,
      s:10+Math.random()*26
    }));
    particles=[];
    hitRings=[];
    guardWaves=[];
    aquaTornadoes=[];
    siltClouds=[];
    catfishCharges=[];
    aquaTornadoes=[];
    siltClouds=[];
    catfishCharges=[];

    if(practiceExitButton) practiceExitButton.hidden=false;

    if(!practiceLabel){
      practiceLabel=document.createElement('div');
      practiceLabel.className='practice-label';
      practiceLabel.textContent='操作練習　∞';
      document.body.appendChild(practiceLabel);
    }
    practiceLabel.style.display='block';

    running=true;
    last=performance.now();
    updateHud();
  }


  function startGame() {
    gameMode='battle';
    if(practiceLabel) practiceLabel.style.display='none';
    if(practiceExitButton) practiceExitButton.hidden=true;
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


  function chooseAttackVariant(f, other, kind){
    const dy=other.y-f.y;

    // 初心者向けの自動補正だけに絞る。
    // パンチは上方向だけ、キックは下方向だけ。
    if(kind==='punch' && dy<-30) return 'up';
    if(kind==='kick' && dy>30) return 'down';

    return 'mid';
  }

  function pointToSegmentDistance(px,py,x1,y1,x2,y2){
    const vx=x2-x1, vy=y2-y1;
    const wx=px-x1, wy=py-y1;
    const vv=vx*vx+vy*vy || 1;
    let t=(wx*vx+wy*vy)/vv;
    t=Math.max(0,Math.min(1,t));
    const cx=x1+vx*t, cy=y1+vy*t;
    return Math.hypot(px-cx,py-cy);
  }

  function specialAquaTornado(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0 || f.attackT>0) return false;

    const dir=f.face;
    f.specialType='aquaTornado';
    f.specialT=.78;
    f.specialHitDone=false;
    f.attack='punch';
    f.attackVariant='up';
    f.attackT=.78;

    // 手元から斜め前上へ。画面上端を越える長さにしておく。
    const startX=f.x+dir*35;
    const startY=f.y-6;
    const length=Math.max(innerWidth,innerHeight)*1.05;
    const dx=dir*.76;
    const dy=-.65;

    aquaTornadoes.push({
      owner:f,
      startX,startY,
      endX:startX+dx*length,
      endY:startY+dy*length,
      dir,
      t:.72,
      life:.72,
      width:28,
      hit:false,
      direction:'up',
      source:'hand'
    });

    comboEl.textContent='アクアトルネード!';
    setTimeout(()=>{
      if(comboEl.textContent==='アクアトルネード!') comboEl.textContent='';
    },650);

    return true;
  }


  function specialRibbonWhip(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0) return false;
    const other=f.isPlayer?enemy:player;
    const dir=f.face;

    f.specialType='ribbonWhip';
    f.specialT=.82;
    f.attack='tongue';
    f.attackT=.82;
    f.ribbonWhipIndex=0;

    comboEl.textContent='リボンラッシュ!';
    setTimeout(()=>{
      if(comboEl.textContent==='リボンラッシュ!') comboEl.textContent='';
    },720);

    // 百裂キック風：舌先を高速で7回突き出す。
    const offsets=[-24,16,-8,26,-18,10,0];
    offsets.forEach((oy,i)=>{
      setTimeout(()=>{
        if(gameOver || !other) return;
        f.ribbonWhipIndex=i+1;

        const dx=(other.x-f.x)*dir;
        const dy=other.y-(f.y+oy);

        if(dx>0 && dx<f.tongueRange*1.42 && Math.abs(dy)<44){
          damageHit(
            f,other,
            (i===6?1.8:1.0)*f.damageMul,
            (i===6?85:18)*dir,
            (i===6?-30:0)
          );
        }
      },i*82);
    });

    return true;
  }

  function specialCatfishCharge(f){
    if(gameOver || f.stun>0 || f.specialT>0) return false;
    const other=f.isPlayer?enemy:player;
    if(!other) return false;
    f.specialType='catfishCall'; f.specialT=.65; f.attackT=.30;
    // リリスさん自身の背後から現れて、そのまま相手方向へ突進。
    const attackDir=f.face;
    const behindX=f.x-attackDir*105;
    const spawnX=Math.max(72,Math.min(innerWidth-72,behindX));

    catfishCharges.push({
      owner:f,
      target:other,
      x:spawnX,
      y:Math.max(90,Math.min(innerHeight-90,f.y+8)),
      vx:attackDir*345,
      t:1.75,
      hit:false
    });
    comboEl.textContent='ナマズさん突進!';
    setTimeout(()=>{if(comboEl.textContent==='ナマズさん突進!')comboEl.textContent='';},800);
    return true;
  }

  function specialHellRush(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0) return false;
    const other=f.isPlayer?enemy:player;
    const dir=f.face;

    f.attackT=0;
    f.specialType='hellRush';
    f.specialT=1.18;
    f.attack='punch';
    f.attackT=1.18;
    f.luciferRushHits=0;
    f.vx += dir*185;

    comboEl.textContent='ヘルラッシュ!';
    setTimeout(()=>{ if(comboEl.textContent==='ヘルラッシュ!') comboEl.textContent=''; },800);

    const hits=[
      {delay:120,dmg:2.0,kx:12,ky:-8,pose:'mid'},
      {delay:245,dmg:2.0,kx:14,ky:10,pose:'mid'},
      {delay:370,dmg:2.2,kx:16,ky:-10,pose:'mid'},
      {delay:495,dmg:2.4,kx:18,ky:12,pose:'mid'},
      {delay:635,dmg:4.4,kx:75,ky:165,pose:'hammer'}
    ];
    hits.forEach((hit,i)=>setTimeout(()=>{
      if(gameOver || !other) return;
      const dx=(other.x-f.x)*dir;
      if(dx>-20 && dx<108 && Math.abs(other.y-f.y)<78){
        f.attack='punch';
        f.attackVariant=hit.pose==='hammer'?'down':'mid';
        f.attackT=.18;
        f.luciferRushHits=i+1;
        damageHit(f,other,hit.dmg*f.damageMul,hit.kx*dir,hit.ky);
      }
    },hit.delay));
    return true;
  }

  function specialDarknessRush(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0 || f.attackT>0) return false;

    f.specialType='darknessRush';
    f.specialT=.92;
    f.specialHitDone=false;
    f.luciferDiveHits=0;
    f.attack='kick';
    f.attackVariant='down';
    f.attackT=.92;

    // 斜め前下へ連続キックで下降。
    f.vx += f.face*250;
    f.vy += 185;

    comboEl.textContent='ダークネスラッシュ!';
    setTimeout(()=>{
      if(comboEl.textContent==='ダークネスラッシュ!') comboEl.textContent='';
    },700);

    return true;
  }

  function specialAquaStream(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0 || f.attackT>0) return false;

    const dir=f.face;
    f.specialType='aquaStream';
    f.specialT=.72;
    f.specialHitDone=false;
    f.attack='kick';
    f.attackVariant='down';
    f.attackT=.72;

    const startX=f.x+dir*28;
    const startY=f.y+42;
    const length=Math.max(innerWidth,innerHeight)*1.05;
    const dx=dir*.76;
    const dy=.65;

    aquaTornadoes.push({
      owner:f,
      startX,startY,
      endX:startX+dx*length,
      endY:startY+dy*length,
      dir,
      t:.68,
      life:.68,
      width:30,
      hit:false,
      direction:'down',
      source:'foot',
      siltSpawned:false
    });

    comboEl.textContent='アクアストリーム!';
    setTimeout(()=>{
      if(comboEl.textContent==='アクアストリーム!') comboEl.textContent='';
    },650);

    return true;
  }

  function specialUppercut(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0 || f.attackT>0) return false;

    const other=f.isPlayer?enemy:player;
    f.specialType='uppercut';
    f.specialT=.72;
    f.specialHitDone=false;
    f.attack='punch';
    f.attackVariant='up';
    f.attackT=.72;

    // 一瞬しゃがんだ後に、画面上方向へ強く跳ぶ
    setTimeout(()=>{
      if(!f || gameOver) return;
      f.vy=-520;
      f.vx+=f.face*70;

      comboEl.textContent='バーニングアッパー!';
      setTimeout(()=>{
        if(comboEl.textContent==='バーニングアッパー!') comboEl.textContent='';
      },600);
    },180);

    return true;
  }

  function specialDropKick(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0 || f.attackT>0) return false;

    const other=f.isPlayer?enemy:player;
    f.specialType='dropkick';
    f.specialT=.62;
    f.specialHitDone=false;
    f.attack='kick';
    f.attackVariant='mid';
    f.attackT=.62;

    // 水中なので超高速ではなく、少し溜めてから強く前進
    setTimeout(()=>{
      if(!f || gameOver) return;
      f.vx += f.face*470;
      f.vy *= .25;

      comboEl.textContent='バーニングキック!';
      setTimeout(()=>{
        if(comboEl.textContent==='バーニングキック!') comboEl.textContent='';
      },600);
    },145);

    return true;
  }

  function hasBackBackCommand(f, windowMs=820){
    const back=f.face>0?'left':'right';
    const diagUp=f.face>0?'upLeft':'upRight';
    const diagDown=f.face>0?'downLeft':'downRight';
    const valid=new Set([back,diagUp,diagDown]);
    const now=performance.now();
    const recent=input.commandHistory.filter(e=>now-e.t<=windowMs);
    let count=0;
    for(let i=recent.length-1;i>=0;i--){
      if(valid.has(recent[i].dir)){
        count++;
        if(count>=2) return true;
      }else if(count>0){
        break;
      }
    }
    return false;
  }

  function trySpecial(f,kind){
    if(!f) return false;

    if(f.type==='green'){
      if(kind==='punch' && hasCommand(['down','up'],720)){
        clearCommand();
        return specialUppercut(f);
      }

      const back=f.face>0?'left':'right';
      const forward=f.face>0?'right':'left';
      if(kind==='kick' && hasCommand([back,forward],720)){
        clearCommand();
        return specialDropKick(f);
      }
    }

    if(f.type==='blue'){
      const backDown=f.face>0?'downLeft':'downRight';
      const forwardUp=f.face>0?'upRight':'upLeft';
      const backUp=f.face>0?'upLeft':'upRight';
      const forwardDown=f.face>0?'downRight':'downLeft';

      if(kind==='punch' && hasCommand([backDown,forwardUp],780)){
        clearCommand();
        return specialAquaTornado(f);
      }

      if(kind==='kick' && hasCommand([backUp,forwardDown],780)){
        clearCommand();
        return specialAquaStream(f);
      }
    }

    if(f.type==='black'){
      const forward=f.face>0?'right':'left';
      if(kind==='kick' && hasCommand([forward,'down'],760)){
        clearCommand();
        return specialDarknessRush(f);
      }
    }

    return false;
  }

  function registerRapidTap(kind){
    const now=performance.now();
    const key=kind==='punch'?'punchTapTimes':'tongueTapTimes';
    input[key]=(input[key]||[]).filter(t=>now-t<=620);
    input[key].push(now);
    if(input[key].length>=3){
      input[key]=[];
      return true;
    }
    return false;
  }

  function attack(f, kind) {
    if(gameOver || f.guard) return;

    const rapidTriple=(kind==='punch' || kind==='tongue') ? registerRapidTap(kind) : false;

    if(f.type==='black' && kind==='punch' && rapidTriple){
      // 1・2発目の通常パンチ硬直を3発目でキャンセルして必殺技へ。
      f.attackT=0;
      f.attack=null;
      if(specialHellRush(f)) return;
    }

    if(f.type==='purple' && kind==='tongue' && rapidTriple){
      // 1・2回目の通常舌硬直を3回目でキャンセル。
      f.attackT=0;
      f.attack=null;
      f.tongueT=0;
      if(specialRibbonWhip(f)) return;
    }

    // 通常攻撃より先に必殺技コマンドを判定
    if(trySpecial(f,kind)) return;

    // 舌で引かれている最中だけは、stun中でも舌による投げ抜けを受け付ける。
    const pullerForEscape = f.isPlayer ? enemy : player;
    const canTongueEscape = kind==='tongue' && pullerForEscape &&
      pullerForEscape.tonguePullTarget===f && pullerForEscape.tonguePullTimer>0;

    if(!canTongueEscape && (f.stun>0 || f.attackT>0)) return;
    const other = f.isPlayer ? enemy : player;
    const dir=f.face;
    const dist=Math.hypot(other.x-f.x, other.y-f.y);

    if(kind==='punch' || kind==='kick'){
      f.attackVariant=chooseAttackVariant(f,other,kind);
    }

    if(kind==='punch'){
      f.attack='punch';f.attackT=.34;
      const v=f.attackVariant;
      const yAim=v==='up'?-34:0;
      if(dist<88 && Math.abs((other.y-f.y)-yAim)<58){
        const ky=v==='up'?-72:-5;
        setTimeout(()=>damageHit(f,other,2.6*f.damageMul,52*dir,ky),125);
      }
    } else if(kind==='kick'){
      f.attack='kick';f.attackT=.50;
      const v=f.attackVariant;
      const yAim=v==='down'?42:0;
      if(dist<106 && Math.abs((other.y-f.y)-yAim)<72){
        const ky=v==='down'?125:-21;
        setTimeout(()=>damageHit(f,other,5.2*f.damageMul,142*dir,ky),175);
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
    playerHpEl.style.width=Math.max(0,Math.min(100,player.hp))+'%';
    enemyHpEl.style.width=(gameMode==='practice'?100:Math.max(0,Math.min(100,enemy.hp)))+'%';
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
          // リリスさん：後ろを入れたまま、または直前に後ろ入力してガード×2。
          if(player.type==='purple' && !player.throwState){
            const now=performance.now();

            // 現在のスティック方向も直接見る。
            const backNow =
              (player.face>0 && input.x<-.35) ||
              (player.face<0 && input.x>.35);

            const recentlyBack = now-(input.lastBackInputTime||0) <= 1200;

            if(backNow || recentlyBack){
              if(now-(input.purpleGuardLastTime||0) <= 700){
                input.purpleGuardCount=(input.purpleGuardCount||0)+1;
              }else{
                input.purpleGuardCount=1;
              }
              input.purpleGuardLastTime=now;

              if(input.purpleGuardCount>=2){
                input.purpleGuardCount=0;
                input.purpleGuardLastTime=0;
                input.lastBackInputTime=0;
                clearCommand();

                player.guard=false;
                player.attackT=0;

                if(specialCatfishCharge(player)){
                  btn.classList.remove('pressed');
                  return;
                }
              }
            }else{
              input.purpleGuardCount=0;
            }
          }

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
      aquaTornadoes.forEach(t=>{
        t.t-=dt;

        // 発生中は持ち主の手元に根元を追従
        const owner=t.owner;
        if(owner){
          const length=Math.max(innerWidth,innerHeight)*1.05;
          const dx=owner.face*.76;
          const downward=t.direction==='down';
          const dy=downward?.65:-.65;

          t.startX=owner.x+owner.face*(t.source==='foot'?28:35);
          t.startY=owner.y+(t.source==='foot'?42:-6);
          t.endX=t.startX+dx*length;
          t.endY=t.startY+dy*length;
          t.dir=owner.face;
        }

        // 下向き水流が底に当たった場所だけ、軽い土煙を出す。
        // 円を大量生成せず、1つの濁り雲を短時間描くだけなので軽量。
        if(t.direction==='down' && !t.siltSpawned){
          const floorY=canvas.height-42;
          const segDy=t.endY-t.startY;
          if(segDy>0 && t.startY<floorY && t.endY>=floorY){
            const u=(floorY-t.startY)/segDy;
            const floorX=t.startX+(t.endX-t.startX)*u;
            if(floorX>-40 && floorX<innerWidth+40){
              t.siltSpawned=true;
              siltClouds.push({
                x:floorX,
                y:floorY,
                t:.85,
                life:.85,
                radius:28
              });
            }
          }
        }

        const target=owner && owner.isPlayer ? enemy : player;
        if(!t.hit && target){
          const d=pointToSegmentDistance(
            target.x,target.y,
            t.startX,t.startY,t.endX,t.endY
          );

          // 水流全体が当たり判定
          if(d < target.radius + t.width){
            t.hit=true;
            damageHit(owner,target,7.0*owner.damageMul,125*owner.face,-125);
          }
        }
      });
      aquaTornadoes=aquaTornadoes.filter(t=>t.t>0);

      catfishCharges.forEach(n=>{
        n.t-=dt; n.x+=n.vx*dt;
        const target=n.target;
        if(!n.hit && target && Math.hypot(target.x-(n.x+Math.sign(n.vx)*55),target.y-n.y)<target.radius+72){
          n.hit=true;
          damageHit(n.owner,target,7.0*n.owner.damageMul,n.vx*.42,-55);
        }
      });
      catfishCharges=catfishCharges.filter(n=>n.t>0);

    siltClouds.forEach(s=>{
        s.t-=dt;
        s.radius+=34*dt;
        s.y-=5*dt;
      });
      siltClouds=siltClouds.filter(s=>s.t>0);

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

    // ナマズさん：リリスさんの後ろから突進する、細長いナマズ
    catfishCharges.forEach(n=>{
      ctx.save();
      ctx.translate(n.x,n.y);
      if(n.vx<0) ctx.scale(-1,1);

      // 長い胴体
      ctx.fillStyle='#46535a';
      ctx.beginPath();
      ctx.ellipse(-10,0,92,28,0,0,Math.PI*2);
      ctx.fill();

      // 平たい頭
      ctx.fillStyle='#64777d';
      ctx.beginPath();
      ctx.ellipse(66,0,43,25,0,0,Math.PI*2);
      ctx.fill();

      // 尾びれ
      ctx.fillStyle='#3f4a50';
      ctx.beginPath();
      ctx.moveTo(-95,0);
      ctx.lineTo(-128,-27);
      ctx.lineTo(-118,0);
      ctx.lineTo(-128,27);
      ctx.closePath();
      ctx.fill();

      // 背びれ
      ctx.fillStyle='#56666c';
      ctx.beginPath();
      ctx.moveTo(-28,-25);
      ctx.lineTo(0,-45);
      ctx.lineTo(18,-24);
      ctx.closePath();
      ctx.fill();

      // 目
      ctx.fillStyle='#fff';
      ctx.beginPath();
      ctx.arc(79,-8,5,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#111';
      ctx.beginPath();
      ctx.arc(80,-8,2.5,0,Math.PI*2);
      ctx.fill();

      // 口
      ctx.strokeStyle='#29343a';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(93,5);
      ctx.lineTo(111,7);
      ctx.stroke();

      // 長いヒゲ
      ctx.strokeStyle='#8da0a5';
      ctx.lineWidth=3;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(91,0); ctx.quadraticCurveTo(128,-14,154,-3);
      ctx.moveTo(91,4); ctx.quadraticCurveTo(130,20,158,10);
      ctx.moveTo(83,-1); ctx.quadraticCurveTo(118,-32,144,-29);
      ctx.stroke();

      ctx.restore();
    });

    // 水底の土煙も描画フェーズへ移動
    siltClouds.forEach(s=>{
      const a=Math.max(0,s.t/s.life);
      ctx.save();
      ctx.globalAlpha=.34*a;
      ctx.fillStyle='#8a6848';
      ctx.beginPath();
      ctx.ellipse(s.x,s.y-4,s.radius*1.45,s.radius*.58,0,0,Math.PI*2);
      ctx.fill();

      ctx.globalAlpha=.22*a;
      ctx.fillStyle='#b08a62';
      ctx.beginPath();
      ctx.ellipse(s.x-10,s.y-12,s.radius*.75,s.radius*.42,-.25,0,Math.PI*2);
      ctx.ellipse(s.x+12,s.y-9,s.radius*.65,s.radius*.36,.2,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    aquaTornadoes.forEach(t=>{
      const alpha=Math.max(0,t.t/t.life);
      const x1=t.startX, y1=t.startY, x2=t.endX, y2=t.endY;
      const dx=x2-x1, dy=y2-y1;
      const len=Math.hypot(dx,dy) || 1;
      const nx=-dy/len, ny=dx/len;

      ctx.save();
      ctx.globalCompositeOperation='lighter';

      // 中心の太い水流
      ctx.globalAlpha=.25*alpha;
      ctx.strokeStyle='#77e8ff';
      ctx.lineWidth=30;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.stroke();

      // 竜巻らしい螺旋ライン
      for(let s=0;s<3;s++){
        ctx.globalAlpha=(.55-.12*s)*alpha;
        ctx.strokeStyle=s===0?'#d8fbff':(s===1?'#69d9ff':'#239eea');
        ctx.lineWidth=5-s;
        ctx.beginPath();

        const steps=28;
        for(let i=0;i<=steps;i++){
          const u=i/steps;
          const baseX=x1+dx*u;
          const baseY=y1+dy*u;
          const wave=Math.sin(u*Math.PI*8 + performance.now()/110 + s*2.1);
          const amp=10+u*16;
          const px=baseX+nx*wave*amp;
          const py=baseY+ny*wave*amp;
          if(i===0) ctx.moveTo(px,py);
          else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }

      // 小さな泡
      for(let i=0;i<8;i++){
        const u=((performance.now()/900)+(i/8))%1;
        const bx=x1+dx*u+nx*Math.sin(i*2.2)*14;
        const by=y1+dy*u+ny*Math.sin(i*2.2)*14;
        ctx.globalAlpha=.48*alpha;
        ctx.fillStyle='#dffcff';
        ctx.beginPath();
        ctx.arc(bx,by,2.5+(i%3),0,Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
    });

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

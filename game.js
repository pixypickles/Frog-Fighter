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
  const titleReturnButton=document.getElementById('titleReturnButton');
  const beelzebubCard=document.getElementById('beelzebubCard');
  const beelzebubOpponent=document.getElementById('beelzebubOpponent');
  let kawazuCard=document.getElementById('kawazuCard');
  let kawazuOpponent=document.getElementById('kawazuOpponent');
  const storyNarrative=document.getElementById('storyNarrative');
  const storyNarrativeText=document.getElementById('storyNarrativeText');
  const storyNarrativeNext=document.getElementById('storyNarrativeNext');
  const practiceHelp=document.getElementById('practiceHelp');
  const practiceSpecialTitle=document.getElementById('practiceSpecialTitle');
  const practiceSpecialMoves=document.getElementById('practiceSpecialMoves');
  const practiceExitButton = document.getElementById('practiceExitButton');
  const leafMiniHud=document.getElementById('leafMiniHud');
  const leafMiniTimeEl=document.getElementById('leafMiniTime');
  const leafMiniScoreEl=document.getElementById('leafMiniScore');
  const guardMiniHud=document.getElementById('guardMiniHud');
  const guardMiniTimeEl=document.getElementById('guardMiniTime');
  const guardMiniScoreEl=document.getElementById('guardMiniScore');
  const guardMiniMissEl=document.getElementById('guardMiniMiss');
  const raceMiniHud=document.getElementById('raceMiniHud');
  const raceMiniTimeEl=document.getElementById('raceMiniTime');
  const raceMiniBestEl=document.getElementById('raceMiniBest');
  const basketMiniHud=document.getElementById('basketMiniHud');
  const basketPlayerScoreEl=document.getElementById('basketPlayerScore');
  const basketEnemyScoreEl=document.getElementById('basketEnemyScore');
  const basketTimeEl=document.getElementById('basketTime');
  const opponentSelect=document.getElementById('opponentSelect');
  const storyHud=document.getElementById('storyHud');
  const difficultyButtons=[...document.querySelectorAll('.difficulty-btn')];

  let selectedFighter = 'green';
  let selectedOpponent = 'blue';
  let difficulty='normal';
  try{
    const savedDifficulty=localStorage.getItem('kaeru_difficulty');
    if(['easy','normal','hard'].includes(savedDifficulty)) difficulty=savedDifficulty;
  }catch(e){}
  let stageTheme=0;
  let storyQueue=[];
  let storyFightIndex=0;
  let storyLosses=0;
  let storyWins=0;
  let storyFinished=false;
  let running = false;
  let last = performance.now();
  let bubbles = [];
  let particles = [];
  let hitRings = [];
  let guardWaves = [];
  let aquaTornadoes = [];
  let aquaVortices = [];
  let toxicWaters=[];
  let bossFish=[];
  let abyssShocks=[];
  let kawazuShots=[];
  let kawazuGhosts=[];
  let siltClouds = [];
  let catfishCharges = [];
  let pressureBlades = [];
  let burstWaves = [];
  let leafTargets=[];
  let leafMiniActive=false;
  let leafMiniTime=60;
  let leafMiniScore=0;
  let leafSpawnTimer=0;
  let guardTargets=[];
  let guardMiniActive=false;
  let guardMiniTime=60, guardMiniScore=0, guardMiniMiss=0, guardSpawnTimer=0;
  let guardMiniGuardTapTime=-9999;
  let raceMiniActive=false, raceMiniStart=0, raceMiniElapsed=0, raceMiniBest=0;
  let raceCheckpoints=[], raceCheckpointIndex=0, raceObstacles=[];
  let basketMiniActive=false, basketMiniTime=60, basketPlayerScore=0, basketEnemyScore=0;
  let basketBall=null, basketHoops=[], basketShotCooldown=0;
  let gameOver = false;
  let comboTimer = 0;
  let comboHits = 0;

  const stats = {
    green:  { speed: 160, tongue: 210, damage: 1.00, defense:1.00, sink:7, hue:0, scale:1.00 },
    blue:   { speed: 182, tongue: 260, damage: 0.88, defense:1.00, sink:5, hue:95, scale:1.00 },
    black:  { speed: 148, tongue: 225, damage: 1.22, defense:1.00, sink:9, hue:0, scale:1.00 },
    purple: { speed: 174, tongue: 245, damage: 0.92, defense:1.00, sink:5, hue:0, scale:1.00 },
    yellow:  { speed: 190, tongue: 225, damage: 0.92, defense:0.96, sink:4, hue:0, scale:1.00 },
    orange:  { speed: 142, tongue: 215, damage: 1.05, defense:1.28, sink:9, hue:0, scale:1.10 },
    piranha: { speed: 198, tongue: 0,   damage: 1.08, defense:0.90, sink:3, hue:0, scale:0.95 },
    crayfish:{ speed: 138, tongue: 0,   damage: 1.18, defense:1.20, sink:10,hue:0, scale:1.08 },
    beelzebub:{speed: 158, tongue: 415, damage: 1.28, defense:1.22, sink:8, hue:0, scale:1.13},
    kawazu: {speed: 220, tongue: 225, damage: 0.94, defense:0.94, sink:4, hue:0, scale:0.86}
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

  function refreshDifficultyButtons(){
    difficultyButtons.forEach(btn=>{
      btn.classList.toggle('selected',btn.dataset.difficulty===difficulty);
    });
  }

  difficultyButtons.forEach(btn=>{
    const choose=(e)=>{
      if(e){e.preventDefault();e.stopPropagation();}
      difficulty=btn.dataset.difficulty||'normal';
      try{localStorage.setItem('kaeru_difficulty',difficulty);}catch(err){}
      refreshDifficultyButtons();
    };
    btn.addEventListener('pointerup',choose);
    btn.addEventListener('click',e=>{if(window.PointerEvent)return;choose(e);});
  });
  refreshDifficultyButtons();

  function difficultyProfile(){
    if(difficulty==='easy') return {move:.82,attack:.58,tongue:.55,guard:.55,special:.55,damage:.80};
    if(difficulty==='hard') return {move:1.14,attack:1.42,tongue:1.35,guard:1.45,special:1.5,damage:1.14};
    return {move:1,attack:1,tongue:1,guard:1,special:1,damage:1};
  }

  function isBeelzebubUnlocked(){
    try{return localStorage.getItem('kaeru_beelzebub_unlocked')==='1';}
    catch(e){return false;}
  }

  function refreshBossUnlock(){
    const unlocked=isBeelzebubUnlocked();
    if(beelzebubCard) beelzebubCard.hidden=!unlocked;
    if(beelzebubOpponent) beelzebubOpponent.hidden=!unlocked;
  }

  function unlockBeelzebub(){
    try{localStorage.setItem('kaeru_beelzebub_unlocked','1');}catch(e){}
    refreshBossUnlock();
  }

  function isKawazuUnlocked(){
    try{return localStorage.getItem('kaeru_kawazu_unlocked')==='1';}
    catch(e){return false;}
  }
  function refreshKawazuUnlock(){
    // 未クリア時はDOM自体を作らない。名前・見た目・技名を完全に伏せる。
    if(!isKawazuUnlocked()) return;

    if(!kawazuCard){
      const grid=document.querySelector('#selectScreen .fighter-grid');
      if(grid){
        const btn=document.createElement('button');
        btn.id='kawazuCard';
        btn.className='fighter-card kawazu-card';
        btn.dataset.fighter='kawazu';
        btn.innerHTML=`<span class="fighter-emoji kawazu-frog">🐸</span>
          <strong>カワズさん</strong>
          <small>隠しキャラ・小柄な高速コンボ型</small>
          <span class="special-hint move-names">水圧ラッシュ / ミラージュキック / ハイスピードサイクロン</span>
          <span class="special-hint move-detail-note">技の詳細は操作練習にて</span>`;
        grid.appendChild(btn);
        kawazuCard=btn;
        btn.addEventListener('click',()=>{
          document.querySelectorAll('.fighter-card').forEach(c=>c.classList.remove('selected'));
          btn.classList.add('selected');
          selectedFighter='kawazu';
        });
      }
    }

    if(!kawazuOpponent && opponentSelect){
      const opt=document.createElement('option');
      opt.id='kawazuOpponent'; opt.value='kawazu'; opt.textContent='カワズさん';
      opponentSelect.appendChild(opt);
      kawazuOpponent=opt;
    }
  }
  function unlockKawazu(){
    try{localStorage.setItem('kaeru_kawazu_unlocked','1');}catch(e){}
    refreshKawazuUnlock();
  }
  refreshKawazuUnlock();

  function showStoryNarrative(pages,onDone){
    if(!storyNarrative || !storyNarrativeText || !storyNarrativeNext){
      if(onDone)onDone(); return;
    }
    let i=0;
    const render=()=>{
      storyNarrativeText.textContent=pages[i];
      storyNarrativeNext.textContent=i===pages.length-1?'進む':'次へ';
    };
    storyNarrative.hidden=false;
    render();
    storyNarrativeNext.onclick=()=>{
      i++;
      if(i>=pages.length){
        storyNarrative.hidden=true;
        storyNarrativeNext.onclick=null;
        if(onDone)onDone();
      }else render();
    };
  }

  refreshBossUnlock();

  document.querySelectorAll('.fighter-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.fighter-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedFighter = card.dataset.fighter;
    });
  });

  if(opponentSelect){
    opponentSelect.value=selectedOpponent;
    opponentSelect.addEventListener('change',()=>{selectedOpponent=opponentSelect.value;});
  }

  document.getElementById('fightButton').onclick = () => {
    selectedOpponent=opponentSelect ? opponentSelect.value : selectedOpponent;
    show('game');
    resize();
    startGame('free');
  };

  const storyButton=document.getElementById('storyButton');
  if(storyButton){
    const openStory=(e)=>{
      if(e){
        e.preventDefault();
        e.stopPropagation();
      }
      startStoryMode();
    };
    storyButton.addEventListener('pointerup',openStory);
    storyButton.addEventListener('click',(e)=>{
      if(window.PointerEvent) return;
      openStory(e);
    });
  }

  const minigameBtn=document.getElementById('minigameBtn');
  if(minigameBtn){
    const openLeafMini=(e)=>{
      if(e){e.preventDefault();e.stopPropagation();}
      startLeafMiniGame();
    };
    minigameBtn.addEventListener('pointerup',openLeafMini);
    minigameBtn.addEventListener('click',(e)=>{
      if(window.PointerEvent)return;
      openLeafMini(e);
    });
  }

  const justGuardMiniBtn=document.getElementById('justGuardMiniBtn');
  if(justGuardMiniBtn){
    const openGuardMini=e=>{if(e){e.preventDefault();e.stopPropagation();}startGuardMiniGame();};
    justGuardMiniBtn.addEventListener('pointerup',openGuardMini);
    justGuardMiniBtn.addEventListener('click',e=>{if(window.PointerEvent)return;openGuardMini(e);});
  }

  const raceMiniBtn=document.getElementById('raceMiniBtn');
  if(raceMiniBtn){
    const openRace=e=>{if(e){e.preventDefault();e.stopPropagation();}startRaceMiniGame();};
    raceMiniBtn.addEventListener('pointerup',openRace);
    raceMiniBtn.addEventListener('click',e=>{if(window.PointerEvent)return;openRace(e);});
  }

  const basketMiniBtn=document.getElementById('basketMiniBtn');
  if(basketMiniBtn){
    const openBasket=e=>{if(e){e.preventDefault();e.stopPropagation();}startBasketMiniGame();};
    basketMiniBtn.addEventListener('pointerup',openBasket);
    basketMiniBtn.addEventListener('click',e=>{if(window.PointerEvent)return;openBasket(e);});
  }

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
      if(practiceHelp){practiceHelp.hidden=true;practiceHelp.style.display='none';}
      if(storyHud) storyHud.hidden=true;
      leafMiniActive=false;
      guardMiniActive=false;
      raceMiniActive=false;
      basketMiniActive=false;
      if(raceMiniHud){raceMiniHud.hidden=true;raceMiniHud.style.display='none';}
      if(basketMiniHud){basketMiniHud.hidden=true;basketMiniHud.style.display='none';}
      if(leafMiniHud){leafMiniHud.hidden=true;leafMiniHud.style.display='none';}
      if(guardMiniHud){guardMiniHud.hidden=true;guardMiniHud.style.display='none';}
      if(practiceLabel) practiceLabel.style.display='none';
      practiceExitButton.hidden=true;
      practiceExitButton.textContent='練習終了';
      comboEl.textContent='';
      show('select');
    });
  }

  if(titleReturnButton){
    titleReturnButton.onclick=()=>{
      gameOver=true;
      running=false;
      leafMiniActive=false;
      guardMiniActive=false;
      if(storyHud) storyHud.hidden=true;
      if(leafMiniHud){leafMiniHud.hidden=true;leafMiniHud.style.display='none';}
      if(guardMiniHud){guardMiniHud.hidden=true;guardMiniHud.style.display='none';}
      restartButton.hidden=true;
      titleReturnButton.hidden=true;
      comboEl.textContent='';
      if(practiceHelp){practiceHelp.hidden=true;practiceHelp.style.display='none';}
      show('select');
    };
  }

  restartButton.onclick = () => {
    if(gameMode==='practice') startPractice();
    else if(gameMode==='leafMini') startLeafMiniGame();
    else if(gameMode==='guardMini') startGuardMiniGame();
    else if(gameMode==='raceMini') startRaceMiniGame();
    else if(gameMode==='basketMini') startBasketMiniGame();
    else if(gameMode==='story'){
      if(storyFinished){
        if(storyHud) storyHud.hidden=true;
        gameMode='battle';
        restartButton.hidden=true;
        restartButton.textContent='もう一度';
        show('select');
      }else{
        continueStory();
      }
    }else startGame('free');
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function drawWhiteAura(x,y,rx,ry,intensity=1){
    ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';
    for(let i=0;i<4;i++){
      ctx.globalAlpha=(.12+i*.07)*intensity;
      ctx.fillStyle=i%2?'#ffffff':'#dffcff';
      ctx.beginPath();ctx.ellipse(0,0,rx+i*4,ry+i*3,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  function drawRedAura(x,y,rx,ry,intensity=1){
    ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';
    const pulse=.93+Math.sin(performance.now()/48)*.07;ctx.scale(pulse,pulse);
    for(let i=0;i<4;i++){
      ctx.globalAlpha=(.13+i*.055)*intensity;ctx.fillStyle=i%2===0?'#ff2738':'#ff7138';
      ctx.beginPath();ctx.ellipse(Math.sin(performance.now()/80+i)*4,Math.cos(performance.now()/96+i)*3,rx+i*4,ry+i*3,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
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
    if(type==='kawazu'){
      return {
        body:'#4fbd55',
        limb:'#4aaf50',
        light:'#82d96d',
        belly:'#f4f1e8',
        eyeBump:'#5bc45b'
      };
    }

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
        body:'#f05a9d',
        limb:'#f05a9d',
        light:'#ff8fc1',
        belly:'#ffc1dc',
        eyeBump:'#f777b0'
      };
    }
    if(type==='beelzebub'){
      return {
        body:'#111714',
        limb:'#141b16',
        light:'#7dff28',
        belly:'#b5ff48',
        eyeBump:'#6eff20'
      };
    }
    if(type==='yellow'){
      return {
        body:'#e7cf3f', limb:'#e7cf3f', light:'#f5e56b',
        belly:'#fff08a', eyeBump:'#f1dc55'
      };
    }
    if(type==='orange'){
      return {
        body:'#ef8b32', limb:'#ef8b32', light:'#ffad55',
        belly:'#ffc477', eyeBump:'#f9a04a'
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
      this.defense=s.defense||1; this.bodyScale=s.scale||1;
      this.sink=s.sink; this.hue=s.hue;
      this.radius=35*this.bodyScale; this.hp=100; this.face = isPlayer ? 1 : -1;
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
      this.chargeStartTime=0;
      this.chargePower=0;
      this.healT=0;
      this.counterT=0;
      this.counterReady=false;
      this.tackleArmedT=0;
      this.tackleHit=false;
      this.urielGuardHoldStart=0;
      this.urielAuraT=0;
      this.lilithSpinStartTime=0;
      this.lilithSpinLastHitA=-9999;
      this.lilithSpinLastHitB=-9999;
      this.piranhaRushHit=false;
      this.piranhaDivePhase=0;
      this.piranhaDiveTargetX=0;
      this.crayfishRushStep=0;
      this.crayfishRushLastHit=0;
      this.crayfishSmashDone=false;
      this.crayfishSmashQueued=false;
      this.crayfishSmashQueueT=0;
      this.crayfishCounterReady=false;
      this.crayfishCounterT=0;
      this.bossTongueAimY=0;
      this.bossSpecialCooldown=0;
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
      if(this.healT>0){
        this.healT-=dt;
        this.hp=Math.min(100,this.hp+3.2*dt);
        if(this.isPlayer) updateHud();
      }
      if(this.counterT>0){
        this.counterT-=dt;
        if(this.counterT<=0) this.counterReady=false;
      }
      if(this.tackleArmedT>0) this.tackleArmedT-=dt;
      if(this.bossSpecialCooldown>0) this.bossSpecialCooldown=Math.max(0,this.bossSpecialCooldown-dt);
      if(this.urielAuraT>0) this.urielAuraT=Math.max(0,this.urielAuraT-dt);
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
      if(this.specialType==='urielTackle'){
        this.vx *= Math.pow(.90, dt);
        this.vy *= Math.pow(.84, dt);
      }else if(this.dashT>0){
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
        if(typeof this.throwState.endT==='number'){
          this.throwState.endT-=dt;
          if(this.throwState.endT<=0){
            this.throwState=null;
            this.spinAngle=0;
          }
        }
        if(this.throwState){
          this.spinAngle += this.throwState.spinSpeed * dt;
        }
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

      // ボトムスマッシュ予約中：水底へ着くまで自動降下
      if(this.crayfishSmashQueued){
        this.crayfishSmashQueueT-=dt;
        this.vx*=Math.pow(.20,dt);
        this.vy=Math.max(this.vy,380);

        if(this.y>=innerHeight-128){
          this.specialType=null;
          this.specialT=0;
          executeCrayfishBottomSmash(this);
        }else if(this.crayfishSmashQueueT<=0){
          this.crayfishSmashQueued=false;
          this.specialType=null;
          this.specialT=0;
          comboEl.textContent='';
        }
      }

      if(this.type==='crayfish' && this.crayfishCounterT>0){
        this.crayfishCounterT-=dt;
        if(this.crayfishCounterT<=0){
          this.crayfishCounterT=0;
          this.crayfishCounterReady=false;
          if(this.specialType==='crayfishCounter'){
            this.specialType=null;
            this.specialT=0;
          }
        }
      }

      // アスモデウスさん：クローラッシュ
      // 土煙の中でも上下だけ少し相手へ自動追尾する。
      if(this.specialType==='crayfishRush'){
        const other=this.isPlayer?enemy:player;
        const now=performance.now();

        if(other){
          const dy=other.y-this.y;
          this.vy += Math.max(-90,Math.min(90,dy*2.2))*dt;

          // 前方向の勢いを少し維持
          if(Math.abs(this.vx)<300){
            this.vx += this.face*160*dt;
          }

          if(Math.hypot(other.x-this.x,other.y-this.y)<other.radius+this.radius+30){
            if(now-(this.crayfishRushLastHit||0)>125){
              this.crayfishRushLastHit=now;
              this.crayfishRushStep++;
              const fin=this.crayfishRushStep>=5;
              damageHit(
                this,other,
                (fin?3.8:1.8)*this.damageMul,
                (fin?155:34)*this.face,
                fin?-40:0
              );
            }
          }
        }
      }

      // リヴァイアさん：高速突進噛みつき
      if(this.specialType==='piranhaRush' && !this.piranhaRushHit){
        const other=this.isPlayer?enemy:player;
        if(other && Math.hypot(other.x-this.x,other.y-this.y)<other.radius+this.radius+12){
          this.piranhaRushHit=true; damageHit(this,other,9.2*this.damageMul,265*this.face,-35);
          other.hurtFace='both'; other.hurtFaceT=.65;
        }
      }
      // リヴァイアさん：上空から急降下
      if((this.specialType==='piranhaDivePunch'||this.specialType==='piranhaDiveKick') && this.piranhaDivePhase===2){
        const other=this.isPlayer?enemy:player;
        if(other && Math.hypot(other.x-this.x,other.y-this.y)<other.radius+this.radius+15){
          this.piranhaDivePhase=3;
          const side=this.specialType==='piranhaDivePunch'?1:-1;
          damageHit(this,other,8.4*this.damageMul,120*this.face*side,245);
          other.hurtFace='both'; other.hurtFaceT=.7;
        }
      }

      // ウリエルさん：前傾タックル。接触した相手を回転させて吹き飛ばす。
      if(this.specialType==='urielTackle' && !this.tackleHit){
        const other=this.isPlayer?enemy:player;
        if(other){
          const fx=this.x+this.face*34;
          const d=Math.hypot(other.x-fx,other.y-this.y);
          if(d<other.radius+this.radius*.78){
            this.tackleHit=true;
            damageHit(this,other,9.0*this.damageMul,285*this.face,-70);
            other.throwState={owner:this,spinSpeed:this.face*12,endT:.62,noWallDamage:true};
            other.spinAngle=0;
            other.hurtFace='both'; other.hurtFaceT=.7;
            setTimeout(()=>{
              if(other && other.throwState && other.throwState.owner===this){
                other.throwState=null;
              }
            },620);
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

      if(this.specialType==='burningCyclone'){
        ctx.rotate(burningCycloneAngle(this));
      }
      if(this.specialType==='lilithBackSpin'){
        const elapsed=(performance.now()-(this.lilithSpinStartTime||performance.now()))/1000;
        ctx.rotate(elapsed*18*(this.face>0?-1:1));
      }


      // ピラニア：リヴァイアサンさん
      if(this.type==='piranha'){
        if(this.face<0) ctx.scale(-1,1);
        // パンチは前転で背びれ斬り、キックはバク転で尻尾斬り
        if((this.specialType==='piranhaDivePunch'||this.specialType==='piranhaDiveKick') && this.piranhaDivePhase>=2){
          ctx.rotate(Math.PI/2); // 口を真下へ向けて急降下
        }else if(this.attack==='punch' && this.specialType!=='piranhaDivePunch'){
          const t=Math.max(0,Math.min(1,this.attackT/.34)); ctx.rotate((1-t)*Math.PI*2);
        }else if(this.attack==='kick' && this.specialType!=='piranhaDiveKick'){
          const t=Math.max(0,Math.min(1,this.attackT/.40)); ctx.rotate(-(1-t)*Math.PI*2);
        }
        if(this.flash>0) ctx.globalAlpha=.55;

        // 胴体
        ctx.fillStyle='#d63b32';
        ctx.beginPath();
        ctx.ellipse(0,8,43,28,0,0,Math.PI*2);
        ctx.fill();

        // 腹側
        ctx.fillStyle='#e97850';
        ctx.beginPath();
        ctx.ellipse(4,16,29,15,0,0,Math.PI*2);
        ctx.fill();

        // 尾びれ
        ctx.fillStyle='#2fae55';
        ctx.beginPath();
        ctx.moveTo(-37,6);
        ctx.lineTo(-67,-16);
        ctx.lineTo(-58,7);
        ctx.lineTo(-68,29);
        ctx.closePath();
        ctx.fill();

        // 背びれ
        ctx.fillStyle='#279c4c';
        ctx.beginPath();
        ctx.moveTo(-8,-17);
        ctx.lineTo(8,-39);
        ctx.lineTo(18,-15);
        ctx.closePath();
        ctx.fill();

        // 緑の斑点模様
        ctx.fillStyle='#35b95d';
        ctx.beginPath();
        ctx.ellipse(-10,-3,11,7,-.25,0,Math.PI*2);
        ctx.ellipse(10,15,8,5,.35,0,Math.PI*2);
        ctx.fill();

        // 目
        ctx.fillStyle='#fff';
        ctx.beginPath();
        ctx.arc(22,-4,7,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle='#111';
        ctx.beginPath();
        ctx.arc(24,-4,3,0,Math.PI*2);
        ctx.fill();

        // ピラニアらしい口と歯
        ctx.fillStyle='#26343b';
        ctx.beginPath();
        ctx.moveTo(35,7);
        ctx.lineTo(56,-2);
        ctx.lineTo(53,15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle='#fff';
        for(let i=0;i<4;i++){
          ctx.beginPath();
          ctx.moveTo(39+i*4,4);
          ctx.lineTo(41+i*4,9);
          ctx.lineTo(43+i*4,4);
          ctx.closePath();
          ctx.fill();
        }

        // 通常パンチ/キック相当：体当たりや尾びれ攻撃に見える簡易表現
        if(this.attack==='punch'){
          ctx.strokeStyle='#c8e3ec';
          ctx.lineWidth=6;
          ctx.beginPath();
          ctx.moveTo(34,2); ctx.lineTo(62,-8);
          ctx.stroke();
        }
        if(this.attack==='kick'){
          ctx.strokeStyle='#536b76';
          ctx.lineWidth=10;
          ctx.beginPath();
          ctx.moveTo(-35,8); ctx.lineTo(-72,6);
          ctx.stroke();
        }

        ctx.restore();
        return;
      }

      // ザリガニ：アスモデウスさん
      if(this.type==='crayfish'){
        if(this.face<0) ctx.scale(-1,1);
        if(this.flash>0) ctx.globalAlpha=.55;

        // 胴体
        ctx.fillStyle='#9b3f2f';
        ctx.beginPath();
        ctx.ellipse(-2,16,28,34,0,0,Math.PI*2);
        ctx.fill();

        // 頭
        ctx.fillStyle='#b64d37';
        ctx.beginPath();
        ctx.ellipse(3,-10,29,24,0,0,Math.PI*2);
        ctx.fill();

        // 尻尾の節
        ctx.fillStyle='#873427';
        for(let i=0;i<3;i++){
          ctx.beginPath();
          ctx.ellipse(-8-i*10,43+i*7,18-i*2,10,0,0,Math.PI*2);
          ctx.fill();
        }

        // 目
        ctx.fillStyle='#fff';
        ctx.beginPath();
        ctx.arc(14,-23,5.5,0,Math.PI*2);
        ctx.arc(-3,-23,5.5,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle='#111';
        ctx.beginPath();
        ctx.arc(15,-23,2.5,0,Math.PI*2);
        ctx.arc(-2,-23,2.5,0,Math.PI*2);
        ctx.fill();

        // ハサミ：腕だけでなくハサミ本体ごと振る
        let clawExtend=0, clawY=7, armStartY=0;
        if(this.attack==='crayfishStab') clawExtend=28;
        if(this.attack==='crayfishHammer'){ clawExtend=8; clawY=42; armStartY=4; }
        if(this.attack==='crayfishUpper'){ clawExtend=8; clawY=-34; armStartY=-4; }
        if(this.specialType==='crayfishRush'){
          clawExtend=18+Math.sin(performance.now()/45)*10;
          clawY=Math.sin(performance.now()/55)*12;
        }
        ctx.strokeStyle='#a94331'; ctx.lineWidth=11; ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(18,armStartY); ctx.lineTo(42+clawExtend,clawY);
        ctx.moveTo(-18,2); ctx.lineTo(-39,13); ctx.stroke();

        ctx.fillStyle='#c95b40'; ctx.beginPath();
        ctx.ellipse(49+clawExtend,clawY,19,14,.15,0,Math.PI*2);
        ctx.ellipse(-45,13,17,12,-.15,0,Math.PI*2); ctx.fill();

        if(this.attack==='crayfishHammer'||this.attack==='crayfishUpper'){
          ctx.fillStyle='#e57a58'; ctx.beginPath();
          ctx.ellipse(59+clawExtend,clawY-2,10,8,.2,0,Math.PI*2); ctx.fill();
        }

        // ハサミ割れ
        ctx.strokeStyle='#793025';
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.moveTo(49+clawExtend,clawY-11); ctx.lineTo(51+clawExtend,clawY+11);
        ctx.moveTo(-45,2); ctx.lineTo(-45,23);
        ctx.stroke();

        // 触角
        ctx.strokeStyle='#c7674f';
        ctx.lineWidth=2.5;
        ctx.beginPath();
        ctx.moveTo(12,-28); ctx.quadraticCurveTo(39,-48,58,-39);
        ctx.moveTo(-2,-28); ctx.quadraticCurveTo(-31,-49,-51,-37);
        ctx.stroke();

          if(this.type==='crayfish' && this.specialType==='crayfishCounter'){
          // 待機中は通常の腕をそのまま使い、両目だけ赤く発光。
          ctx.save();
          ctx.globalCompositeOperation='lighter';
          ctx.fillStyle='#ff2a20';
          ctx.shadowColor='#ff1d12';
          ctx.shadowBlur=13;
          ctx.beginPath();
          ctx.arc(-14,-25,6.5,0,Math.PI*2);
          ctx.arc(14,-25,6.5,0,Math.PI*2);
          ctx.fill();
          ctx.restore();
        }

        if(this.type==='crayfish' && this.specialType==='crayfishCounterHit'){
          // 反撃は両腕を上から振り下ろす
          ctx.save();
          ctx.strokeStyle='#a94331';
          ctx.lineWidth=12;
          ctx.lineCap='round';
          ctx.beginPath();
          ctx.moveTo(18,0); ctx.lineTo(54,46);
          ctx.moveTo(-18,0); ctx.lineTo(-48,43);
          ctx.stroke();

          ctx.fillStyle='#d36a4c';
          ctx.beginPath();
          ctx.ellipse(61,48,20,15,.2,0,Math.PI*2);
          ctx.ellipse(-55,45,20,15,-.2,0,Math.PI*2);
          ctx.fill();
          ctx.restore();
        }

      // ボトムスマッシュ時は両ハサミを下へ
        if(this.specialType==='crayfishBottomSmash'){
          ctx.strokeStyle='#7a2f24';
          ctx.lineWidth=12;
          ctx.beginPath();
          ctx.moveTo(12,5); ctx.lineTo(35,48);
          ctx.moveTo(-12,7); ctx.lineTo(-28,50);
          ctx.stroke();
        }

        ctx.restore();
        return;
      }

      // ウリエルさんは少し大柄
      if(this.bodyScale && this.bodyScale!==1) ctx.scale(this.bodyScale,this.bodyScale);

      // クローラッシュ中は追尾角度に合わせてほんの少し傾く
      if(this.specialType==='crayfishRush'){
        ctx.rotate(Math.max(-.16,Math.min(.16,this.vy/520)));
      }

      // ガーディアンタックル中は少し前傾
      if(this.specialType==='urielTackle') ctx.rotate(this.face*.22);

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

      if(this.type==='kawazu'){
        // 参考のアカメアマガエル風：胴体の左右に青い差し色
        ctx.save();
        ctx.fillStyle='#2e76b8';
        ctx.globalAlpha=.88;

        ctx.beginPath();
        ctx.ellipse(-23,31,8,25,-.18,0,Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(23,31,8,25,.18,0,Math.PI*2);
        ctx.fill();

        // 青と緑の境目に少し暗い青
        ctx.fillStyle='#24558d';
        ctx.globalAlpha=.72;
        ctx.beginPath();
        ctx.ellipse(-26,34,4,19,-.18,0,Math.PI*2);
        ctx.ellipse(26,34,4,19,.18,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      // ニュートラル脚：
      // キック中は蹴り足側だけ消し、反対側の軸足は残す。
      ctx.strokeStyle=pal.limb;
      ctx.lineWidth=12;
      ctx.lineCap='round';
      ctx.lineJoin='round';
      ctx.beginPath();

      // 左側の脚は軸足として常に残す
      ctx.moveTo(-15,48); ctx.lineTo(-19,62); ctx.lineTo(-28,67);

      // 右側の脚はキック中だけ攻撃ポーズ側へ差し替える
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

      if(this.type==='kawazu'){
        // 腕脚そのものは緑。先端だけオレンジにする。
        ctx.save();
        ctx.fillStyle='#ff7a2f';

        // 足先：
        // キック中も軸足側（左）は残し、蹴り足側（右）だけ攻撃用へ差し替える。
        ctx.beginPath();
        ctx.ellipse(-29,67,10,7,-.18,0,Math.PI*2);
        if(this.attack!=='kick'){
          ctx.ellipse(29,67,10,7,.18,0,Math.PI*2);
        }
        ctx.fill();

        // 手先
        if(!this.guard && this.attack!=='wave'){
          ctx.beginPath();
          ctx.ellipse(-33,36,8,6,-.25,0,Math.PI*2);
          if(this.attack!=='punch'){
            ctx.ellipse(33,36,8,6,.25,0,Math.PI*2);
          }
          ctx.fill();
        }
        ctx.restore();
      }

      // v6.35 リリスさん：リボンは廃止。代わりにピンク配色＋口紅。
      if(this.type==='purple'){
        ctx.save();
        // 上唇・下唇を小さく描き、戦闘中でも顔を邪魔しない。
        ctx.fillStyle='#d91f6f';
        ctx.beginPath();
        ctx.ellipse(-5,17,7,2.8,-.10,0,Math.PI*2);
        ctx.ellipse( 5,17,7,2.8, .10,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle='#ff7fb4';
        ctx.beginPath();
        ctx.ellipse(0,20,10,3.2,0,0,Math.PI);
        ctx.fill();
        ctx.restore();
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

        if(this.type==='kawazu'){
          // 白目は白のまま。赤い部分は虹彩だけ。
          ctx.fillStyle='#e62d24';
          ctx.beginPath();
          ctx.arc(-19,-30,7.2,0,Math.PI*2);
          ctx.arc(19,-30,7.2,0,Math.PI*2);
          ctx.fill();

          // 赤い虹彩の内側に黒い縦長の瞳孔
          ctx.fillStyle='#151515';
          ctx.beginPath();
          ctx.ellipse(-19,-30,2.8,5.3,0,0,Math.PI*2);
          ctx.ellipse(19,-30,2.8,5.3,0,0,Math.PI*2);
          ctx.fill();

          // 小さな光
          ctx.fillStyle='rgba(255,255,255,.88)';
          ctx.beginPath();
          ctx.arc(-21,-33,1.6,0,Math.PI*2);
          ctx.arc(17,-33,1.6,0,Math.PI*2);
          ctx.fill();
        }
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
        ctx.filter='none';
        ctx.strokeStyle=pal.limb;
        ctx.lineWidth=12;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(22,22);
        if(this.specialType==='abyssCharge'){
          // アビスチャージ中：肘を曲げ、拳を身体の横へ引いて溜める。
          ctx.lineTo(37,31);
          ctx.lineTo(26,8);
        }else if(this.specialType==='abyssBurst'){
          // ボタンを離した瞬間：溜めた腕を前へ伸ばしてパンチ。
          ctx.lineTo(70,7);
        }else if(this.specialType==='hellCrashFinish'){
          ctx.lineTo(48,-38);
        }else if(this.specialType==='aquaTornado'){
          ctx.lineTo(48,-34);
        }else if(this.attackVariant==='up'){
          ctx.lineTo(48,-22);
        }else{
          ctx.lineTo(59,8);
        }
        ctx.stroke();
        ctx.restore();

        if(this.type==='kawazu'){
          ctx.save();
          ctx.fillStyle='#ff7a2f';
          let kx=59, ky=8;
          if(this.specialType==='kawazuPressureRush'){kx=58;ky=8;}
          else if(this.attackVariant==='up'){kx=48;ky=-22;}
          ctx.beginPath();
          ctx.ellipse(kx,ky,9,6,0,0,Math.PI*2);
          ctx.fill();
          ctx.restore();
        }

        if(this.specialType==='uppercut' && this.specialT<=.54 && this.specialT>=.08){
          drawBurningAura(48,-22,13,18,-.35);
        }
      }

      // キックは脚だけ前へ
      if(this.attack==='kick' && this.specialType!=='dropkick' && this.specialType!=='aquaStream' && this.specialType!=='lilithBackSpin'){
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

        if(this.type==='kawazu'){
          ctx.save();
          ctx.fillStyle='#ff7a2f';
          const ky=this.attackVariant==='down'?78:48;
          const kx=this.attackVariant==='down'?52:60;
          ctx.beginPath();
          ctx.ellipse(kx,ky,10,7,0,0,Math.PI*2);
          ctx.fill();
          ctx.restore();
        }
      }

      if(this.specialType==='lilithBackSpin'){
        ctx.save(); ctx.filter='none'; ctx.strokeStyle=pal.limb; ctx.lineWidth=13; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(-13,45); ctx.lineTo(-58,46); ctx.moveTo(13,45); ctx.lineTo(58,46); ctx.stroke();
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

      if(this.type==='black' && (this.specialType==='hellCrashFinish' || this.specialType==='abyssCharge' || this.specialType==='abyssBurst')){
        let intensity=1;
        if(this.specialType==='abyssCharge'){
          const held=Math.max(0,performance.now()-(this.chargeStartTime||performance.now()));
          intensity=.4+.6*Math.min(1,held/1150);
        }
        if(this.specialType==='hellCrashFinish'){
          drawRedAura(48,-38,22,19,intensity);
        }else if(this.specialType==='abyssCharge'){
          // 曲げた腕の拳に赤い力を溜める。
          drawRedAura(26,8,16,14,intensity);
        }else{
          // パンチが伸びた先で炸裂。
          drawRedAura(64,7,23,19,intensity);
        }
      }

      if(this.type==='green' && this.specialType==='burningCyclone'){
        // 高速回転中は両足それぞれに赤いオーラ
        drawBurningAura(-17,52,18,13,-.15);
        drawBurningAura(17,52,18,13,.15);
      }

      if(this.type==='yellow' && this.specialType==='raphaelBubbleMove'){
        // 全身を泡で包む。高速移動中は飛び道具無効。
        ctx.save();
        ctx.globalCompositeOperation='lighter';
        ctx.globalAlpha=.32;
        ctx.fillStyle='#d8fbff';
        ctx.beginPath();
        ctx.ellipse(0,22,53,67,0,0,Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=.72;
        ctx.strokeStyle='#efffff';
        ctx.lineWidth=4;
        ctx.beginPath();
        ctx.ellipse(0,22,53,67,0,0,Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }

      if(this.type==='beelzebub'){
        // 黒い身体に蛍光グリーンの目・輪郭が浮くラスボス演出
        ctx.save();
        ctx.globalCompositeOperation='lighter';
        ctx.fillStyle='#9aff32';
        ctx.shadowColor='#78ff18';
        ctx.shadowBlur=12;
        ctx.beginPath();
        ctx.arc(-15,-27,5.5,0,Math.PI*2);
        ctx.arc(15,-27,5.5,0,Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=.22;
        ctx.strokeStyle='#84ff25';
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.ellipse(0,18,43,56,0,0,Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }

      // ラファエルさん：回復中は小さな泡が身体の周囲を上昇
      if(this.type==='yellow' && this.healT>0){
        ctx.save();
        ctx.strokeStyle='#d9fbff';
        ctx.lineWidth=2;
        ctx.globalAlpha=.65;
        const tm=performance.now()/220;
        for(let i=0;i<5;i++){
          const bx=Math.sin(tm+i*1.7)*28;
          const by=48-((tm*13+i*23)%100);
          ctx.beginPath();ctx.arc(bx,by,3+(i%3),0,Math.PI*2);ctx.stroke();
        }
        ctx.restore();
      }

      // ウリエルさん：ガード長押しで蓄えた薄い全身ホワイトオーラ
      if(this.type==='orange' && this.urielAuraT>0){
        ctx.save(); ctx.globalCompositeOperation='lighter';
        ctx.strokeStyle='#ffffff'; ctx.lineWidth=4; ctx.globalAlpha=.22+.08*Math.sin(performance.now()/90);
        ctx.beginPath(); ctx.ellipse(0,18,50,66,0,0,Math.PI*2); ctx.stroke();
        ctx.restore();
      }
      if(this.type==='orange' && this.urielAuraT>0 && this.whiteReachAttack){
        ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
        ctx.strokeStyle='#ffffff'; ctx.globalAlpha=.62;
        ctx.lineWidth=this.whiteReachAttack==='punch'?18:22;
        ctx.beginPath();
        if(this.whiteReachAttack==='punch'){ctx.moveTo(22,22);ctx.lineTo(205,8);}else{ctx.moveTo(15,48);ctx.lineTo(245,48);}
        ctx.stroke(); ctx.restore();
      }

      // ウリエルさん：カウンター構え/反撃の白いオーラ
      if(this.type==='orange' && (this.counterReady || this.specialType==='whiteCounterHit')){
        ctx.save();ctx.globalCompositeOperation='lighter';
        ctx.strokeStyle='#ffffff';ctx.lineWidth=5;ctx.globalAlpha=.62;
        ctx.beginPath();ctx.arc(0,18,48,0,Math.PI*2);ctx.stroke();
        if(this.specialType==='whiteCounterHit') drawWhiteAura(58,7,20,16,1);
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
        if(this.type==='beelzebub'){
          const ty=Math.max(-62,Math.min(62,(target.y-this.y)*.42));
          ctx.lineTo(len,8+ty);
        }else{
          ctx.lineTo(len,8);
        }
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
  let gameMode='battle'; // battle | practice | leafMini | guardMini | raceMini | basketMini
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
    crayfishComboStep:0,
    crayfishComboTime:0,
    guardTapTimes:[],
    lastBackInputTime:0,
    purpleGuardCount:0,
    purpleGuardLastTime:0,
    forwardTapTimes:[]
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


  function spawnLeafTarget(slot=0, initial=false){
    const laneCount=5;
    const lane=slot%laneCount;
    const top=innerHeight*.25;
    const bottom=innerHeight*.72;
    const y=top+(bottom-top)*(lane/(laneCount-1));

    // initial=true のときは画面内～右端へ時間差配置。
    // 通常生成は右端から入ってくる。
    const x=initial
      ? innerWidth*.42 + (slot%7)*innerWidth*.12
      : innerWidth+35;

    leafTargets.push({
      x, y:y+(Math.random()-.5)*18,
      vx:-(145+Math.random()*40),
      r:20+Math.random()*4,
      rot:Math.random()*Math.PI*2,
      spin:(Math.random()-.5)*1.1,
      hp:1,
      hit:false
    });
  }

  function startLeafMiniGame(){
    gameMode='leafMini';
    if(practiceHelp){practiceHelp.hidden=true;practiceHelp.style.display='none';}
    gameOver=false;
    restartButton.hidden=true;
    comboHits=0; comboTimer=0; comboEl.textContent='';

    show('game');
    resize();

    player=new Fighter(innerWidth*.25,innerHeight*.5,true,selectedFighter);
    enemy=new PracticeDummy();
    enemy.x=-5000; enemy.y=-5000;

    leafTargets=[];
    leafMiniActive=true;
    leafMiniTime=60;
    leafMiniScore=0;
    leafSpawnTimer=0;

    if(leafMiniHud){ leafMiniHud.hidden=false; leafMiniHud.style.display='flex'; }
    if(guardMiniHud){ guardMiniHud.hidden=true; guardMiniHud.style.display='none'; }
    guardMiniActive=false;
    if(leafMiniTimeEl) leafMiniTimeEl.textContent='60.0';
    if(leafMiniScoreEl) leafMiniScoreEl.textContent='0';

    if(practiceExitButton){
      practiceExitButton.hidden=false;
      practiceExitButton.textContent='ミニゲーム終了';
    }
    if(practiceLabel) practiceLabel.style.display='none';

    bubbles=Array.from({length:28},()=>({
      x:Math.random()*innerWidth,y:Math.random()*innerHeight,
      r:2+Math.random()*6,s:10+Math.random()*26
    }));

    particles=[]; hitRings=[]; guardWaves=[]; aquaTornadoes=[]; aquaVortices=[];
    siltClouds=[]; catfishCharges=[]; pressureBlades=[]; burstWaves=[];

    for(let i=0;i<12;i++){
      spawnLeafTarget(i,true);
      if(leafTargets[i]) leafTargets[i].x=innerWidth*(.38+(i%6)*.11);
    }

    running=true;
    last=performance.now();
    updateHud();
  }

  function endLeafMiniGame(){
    if(!leafMiniActive) return;
    leafMiniActive=false;
    comboEl.textContent=`RESULT ${leafMiniScore} 枚!`;
    restartButton.hidden=false;
  }

  function checkLeafHits(){
    if(!leafMiniActive || !player) return;

    const normalAttack=player.attackT>0;
    const tongueAttack=player.tongueT>0;
    const specialAttack=player.specialT>0;
    if(!normalAttack && !tongueAttack && !specialAttack) return;

    let reach=112;
    let height=82;
    if(tongueAttack){reach=190;height=58;}
    if(player.type==='piranha'){reach=Math.max(reach,130);height=90;}
    if(player.type==='crayfish'){reach=Math.max(reach,135);height=95;}
    if(specialAttack){reach+=45;height+=24;}

    leafTargets.forEach(leaf=>{
      if(leaf.hit) return;
      const dx=leaf.x-player.x;
      const dy=Math.abs(leaf.y-player.y);

      // 基本は向いている側。キャラ中心に重なった葉っぱも確実に壊す。
      const inFront=(dx*player.face)>=-28 && (dx*player.face)<=reach;
      const overlapping=Math.abs(dx)<=player.radius+leaf.r;
      if((inFront || overlapping) && dy<=height){
        leaf.hp=0;
        leaf.hit=true;
        leafMiniScore++;
        if(leafMiniScoreEl)leafMiniScoreEl.textContent=String(leafMiniScore);
        spawnImpact(leaf.x,leaf.y,'guard');
      }
    });
  }

  function spawnGuardTarget(){
    const targetY=player ? player.y : innerHeight*.5;
    guardTargets.push({
      x:innerWidth+60,
      y:targetY,
      targetY:targetY,
      vx:-(150+Math.random()*35),
      r:14+Math.random()*3,
      phase:Math.random()*Math.PI*2,
      kind:Math.random()<.75?'fish':'bug',
      resolved:false
    });
  }

  function startGuardMiniGame(){
    gameMode='guardMini';
    if(practiceHelp){practiceHelp.hidden=true;practiceHelp.style.display='none';} gameOver=false; restartButton.hidden=true;
    comboHits=0; comboTimer=0; comboEl.textContent='';
    show('game'); resize();
    player=new Fighter(innerWidth*.25,innerHeight*.5,true,selectedFighter);
    enemy=new PracticeDummy(); enemy.x=-5000; enemy.y=-5000;
    guardTargets=[]; guardMiniActive=true; leafMiniActive=false;
    guardMiniTime=60; guardMiniScore=0; guardMiniMiss=0; guardSpawnTimer=2.2;
    guardMiniGuardTapTime=-9999;
    if(leafMiniHud){ leafMiniHud.hidden=true; leafMiniHud.style.display='none'; }
    if(guardMiniHud){ guardMiniHud.hidden=false; guardMiniHud.style.display='flex'; }
    if(guardMiniTimeEl) guardMiniTimeEl.textContent='60.0';
    if(guardMiniScoreEl) guardMiniScoreEl.textContent='0';
    if(guardMiniMissEl) guardMiniMissEl.textContent='0';
    if(practiceExitButton){practiceExitButton.hidden=false;practiceExitButton.textContent='ミニゲーム終了';}
    if(practiceLabel) practiceLabel.style.display='none';
    particles=[]; hitRings=[]; guardWaves=[]; aquaTornadoes=[]; aquaVortices=[]; siltClouds=[];
    catfishCharges=[]; pressureBlades=[]; burstWaves=[];

    // 最初は1体だけ。いきなり複数が同時に来ないようにする。
    spawnGuardTarget();

    running=true; last=performance.now(); updateHud();
  }

  function endGuardMiniGame(){
    if(!guardMiniActive)return;
    guardMiniActive=false;
    comboEl.textContent=`JUST GUARD ${guardMiniScore} 回!`;
    restartButton.hidden=false;
  }

  function hideAllMiniHuds(){
    if(leafMiniHud){leafMiniHud.hidden=true;leafMiniHud.style.display='none';}
    if(guardMiniHud){guardMiniHud.hidden=true;guardMiniHud.style.display='none';}
    if(raceMiniHud){raceMiniHud.hidden=true;raceMiniHud.style.display='none';}
    if(basketMiniHud){basketMiniHud.hidden=true;basketMiniHud.style.display='none';}
  }

  function buildRaceCourse(){
    const left=82, right=innerWidth-82, top=88, bottom=innerHeight-78;
    raceObstacles=[
      {x:innerWidth*.25,y:bottom-80,r:25},
      {x:innerWidth*.49,y:top+85,r:27},
      {x:innerWidth*.73,y:bottom-100,r:25}
    ];
    raceCheckpoints=[
      {x:left,y:bottom,r:48},
      {x:raceObstacles[0].x,y:raceObstacles[0].y-88,r:52},
      {x:raceObstacles[1].x,y:raceObstacles[1].y+92,r:52},
      {x:raceObstacles[2].x,y:raceObstacles[2].y-92,r:52},
      {x:right,y:top+26,r:58},
      {x:right-20,y:bottom-12,r:58},
      {x:raceObstacles[2].x,y:raceObstacles[2].y+92,r:52},
      {x:raceObstacles[1].x,y:raceObstacles[1].y-92,r:52},
      {x:raceObstacles[0].x,y:raceObstacles[0].y+88,r:52},
      {x:left,y:bottom,r:52}
    ];
    raceCheckpointIndex=1;
  }

  function startRaceMiniGame(){
    gameMode='raceMini'; gameOver=false; restartButton.hidden=true;
    comboEl.textContent=''; show('game'); resize();
    player=new Fighter(82,innerHeight-78,true,selectedFighter);
    enemy=new PracticeDummy(); enemy.x=-5000; enemy.y=-5000;
    leafMiniActive=false;guardMiniActive=false;basketMiniActive=false;raceMiniActive=true;
    hideAllMiniHuds();
    buildRaceCourse();
    raceMiniStart=performance.now();raceMiniElapsed=0;
    try{raceMiniBest=parseFloat(localStorage.getItem('kaeru_race_best')||'0')||0;}catch(e){raceMiniBest=0;}
    if(raceMiniHud){raceMiniHud.hidden=false;raceMiniHud.style.display='flex';}
    if(raceMiniTimeEl)raceMiniTimeEl.textContent='0.00';
    if(raceMiniBestEl)raceMiniBestEl.textContent=raceMiniBest?raceMiniBest.toFixed(2):'--';
    if(practiceExitButton){practiceExitButton.hidden=false;practiceExitButton.textContent='ミニゲーム終了';}
    running=true;last=performance.now();updateHud();
  }

  function endRaceMiniGame(){
    if(!raceMiniActive)return;
    raceMiniActive=false;
    const time=raceMiniElapsed;
    let best=false;
    if(!raceMiniBest || time<raceMiniBest){
      raceMiniBest=time;best=true;
      try{localStorage.setItem('kaeru_race_best',String(time));}catch(e){}
    }
    if(raceMiniBestEl)raceMiniBestEl.textContent=raceMiniBest.toFixed(2);
    comboEl.textContent=(best?'NEW BEST! ':'FINISH! ')+time.toFixed(2)+' sec';
    restartButton.hidden=false;
  }

  function resetBasketBall(){
    basketBall={x:innerWidth*.5,y:innerHeight*.52,vx:0,vy:0,r:18,owner:null,lastTouch:null};
    player.x=innerWidth*.28;player.y=innerHeight*.60;player.vx=player.vy=0;
    enemy.x=innerWidth*.72;enemy.y=innerHeight*.42;enemy.vx=enemy.vy=0;
  }

  function startBasketMiniGame(){
    gameMode='basketMini'; gameOver=false; restartButton.hidden=true;
    comboEl.textContent=''; show('game'); resize();
    player=new Fighter(innerWidth*.28,innerHeight*.60,true,selectedFighter);
    enemy=new Fighter(innerWidth*.72,innerHeight*.42,false,'blue');
    leafMiniActive=false;guardMiniActive=false;raceMiniActive=false;basketMiniActive=true;
    basketMiniTime=60;basketPlayerScore=0;basketEnemyScore=0;basketShotCooldown=0;
    basketHoops=[
      {x:70,y:innerHeight*.27,side:'cpu'},
      {x:innerWidth-70,y:innerHeight*.27,side:'player'}
    ];
    resetBasketBall();
    hideAllMiniHuds();
    if(basketMiniHud){basketMiniHud.hidden=false;basketMiniHud.style.display='flex';}
    if(basketPlayerScoreEl)basketPlayerScoreEl.textContent='0';
    if(basketEnemyScoreEl)basketEnemyScoreEl.textContent='0';
    if(basketTimeEl)basketTimeEl.textContent='60.0';
    if(practiceExitButton){practiceExitButton.hidden=false;practiceExitButton.textContent='ミニゲーム終了';}
    running=true;last=performance.now();updateHud();
  }

  function endBasketMiniGame(){
    if(!basketMiniActive)return;
    basketMiniActive=false;
    const result=basketPlayerScore===basketEnemyScore?'DRAW':
      (basketPlayerScore>basketEnemyScore?'YOU WIN!':'YOU LOSE');
    comboEl.textContent=`${result} ${basketPlayerScore}-${basketEnemyScore}`;
    restartButton.hidden=false;
  }

  function basketTongueUse(f){
    if(!basketMiniActive || !basketBall || !f)return false;
    const other=f.isPlayer?enemy:player;
    const range=(f.tongueRange||220)*1.05;
    if(basketBall.owner===other &&
       Math.abs(other.x-f.x)<range &&
       Math.abs(other.y-f.y)<115){
      basketBall.owner=f;basketBall.lastTouch=f;
      comboEl.textContent='TONGUE STEAL!';
      setTimeout(()=>{if(comboEl.textContent==='TONGUE STEAL!')comboEl.textContent='';},400);
      return true;
    }
    const dx=basketBall.x-f.x,dy=basketBall.y-f.y;
    if(!basketBall.owner && Math.sign(dx)===f.face && Math.abs(dx)<range && Math.abs(dy)<115){
      basketBall.owner=f;basketBall.lastTouch=f;basketBall.vx=basketBall.vy=0;
      comboEl.textContent='BALL CATCH!';
      setTimeout(()=>{if(comboEl.textContent==='BALL CATCH!')comboEl.textContent='';},340);
      return true;
    }
    return false;
  }

  function basketShoot(f){
    if(!basketMiniActive || !basketBall || basketBall.owner!==f || basketShotCooldown>0)return false;
    const hoop=f.isPlayer?basketHoops[1]:basketHoops[0];
    const dx=hoop.x-basketBall.x,dy=hoop.y-basketBall.y;
    const d=Math.hypot(dx,dy)||1;
    basketBall.owner=null;
    basketBall.lastTouch=f;
    basketBall.vx=dx/d*360;
    basketBall.vy=dy/d*360;
    basketShotCooldown=.38;
    return true;
  }

  function startPractice(){
    gameMode='practice';
    updatePracticeHelp();
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
    aquaTornadoes=[]; aquaVortices=[];
    siltClouds=[];
    catfishCharges=[];
    pressureBlades=[];
    burstWaves=[];
    aquaTornadoes=[]; aquaVortices=[];
    siltClouds=[];
    catfishCharges=[];
    burstWaves=[];

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


  const playableTypes=['green','blue','black','purple','yellow','orange','piranha','crayfish'].concat(isKawazuUnlocked()?['kawazu']:[]);

  function practiceSpecialText(type){
    const map={
      green:[
        '↓ ↑ ＋ パンチ：バーニングアッパー',
        '↓ → ＋ キック：バーニングキック',
        '時計回り1回転 ＋ キック：バーニングサイクロン（敵が右の場合）'
      ],
      blue:[
        '↙ ↗ ＋ パンチ：アクアトルネード',
        '↖ ↘ ＋ キック：アクアストリーム',
        '↓ → ＋ パンチ：アクアボルテックス'
      ],
      black:[
        '→ → ＋ パンチ：ヘルクラッシュ',
        '後ろを押しながらパンチ長押し → 離す：アビスチャージ'
      ],
      purple:[
        '舌×3：リボンラッシュ',
        '後ろ ＋ ガード×2：ナマズ突進',
        '後ろ ＋ キック：バックスピンキック（キック追加入力で追加回転）'
      ],
      yellow:[
        '↓ → ＋ パンチ：水圧カッター（真横）',
        '↓ → ＋ キック：水圧カッター（約15°下）',
        '後ろ ＋ ガード×2：ヒーリングバブル',
        '反時計回り1回転 ＋ ガード：高速バブル移動（敵が右の場合）'
      ],
      orange:[
        'スティック1回転 ＋ ガード：ホワイトカウンター',
        '← → ＋ ガード：ガーディアンタックル',
        'ガード長押し→離す：ホワイトオーラ（長押し時間に応じて維持）',
        'ホワイトオーラ中 パンチ／キック：白いリーチ約3倍攻撃'
      ],
      piranha:[
        '← → ＋ 舌：高速突進噛みつき',
        '↓ ↑ ＋ パンチ：前寄りへ急降下',
        '↓ ↑ ＋ キック：後ろ寄りへ急降下'
      ],
      crayfish:[
        'パンチ×3：クローラッシュ',
        '← ↓ ＋ キック：ボトムスマッシュ',
        '↓ ＋ ガード×2：クロー・カウンター'
      ],
      beelzebub:[
        '舌：通常の約1.5倍リーチ＋軽い上下追尾',
        '方向キー1回転 ＋ ガード：ヴェノム・ウォーター',
        '↓ → ＋ パンチ：フィッシュ・レイド',
        '↓ → ＋ キック：アビスショック'
      ],
      kawazu:[
        '↓ → ＋ パンチ：水圧ラッシュ（小型衝撃波を扇状に乱射）',
        '↓ → ＋ キック：ミラージュキック（初撃ヒットで残像連続蹴り）',
        '時計回り1回転 ＋ キック：ハイスピードサイクロン'
      ]
    };
    return map[type] || ['専用必殺技：準備中'];
  }

  function updatePracticeHelp(){
    if(!practiceHelp) return;
    if(gameMode!=='practice'){
      practiceHelp.hidden=true;
      practiceHelp.style.display='none';
      return;
    }

    const moves=practiceSpecialText(selectedFighter);
    if(practiceSpecialTitle){
      practiceSpecialTitle.textContent=`${fighterDisplayName(selectedFighter)} の必殺技`;
    }
    if(practiceSpecialMoves){
      practiceSpecialMoves.innerHTML=moves.map(v=>`<div>${v}</div>`).join('');
    }
    practiceHelp.hidden=false;
    practiceHelp.style.display='block';
  }

  function fighterDisplayName(type){
    return {
      green:'ミカエルさん', blue:'ガブリエルさん', black:'ルシファーさん',
      purple:'リリスさん', yellow:'ラファエルさん', orange:'ウリエルさん',
      piranha:'リヴァイアさん', crayfish:'アスモデウスさん',
      beelzebub:'ベルゼブブさん', kawazu:'カワズさん'
    }[type]||type;
  }

  function resetBattleEffects(){
    particles=[]; hitRings=[]; guardWaves=[]; aquaTornadoes=[]; aquaVortices=[];
    siltClouds=[]; catfishCharges=[]; pressureBlades=[]; burstWaves=[];
    leafTargets=[]; guardTargets=[]; toxicWaters=[]; bossFish=[]; abyssShocks=[]; kawazuShots=[]; kawazuGhosts=[];
  }

  function startGame(mode='free', enemyType=null) {
    gameMode=mode==='story'?'story':'battle';
    if(practiceHelp){practiceHelp.hidden=true;practiceHelp.style.display='none';}
    if(practiceLabel) practiceLabel.style.display='none';
    if(practiceExitButton) practiceExitButton.hidden=true;
    if(leafMiniHud){
      leafMiniHud.hidden=true;
      leafMiniHud.style.display='none';
    }
    if(guardMiniHud){
      guardMiniHud.hidden=true;
      guardMiniHud.style.display='none';
    }
    if(raceMiniHud){raceMiniHud.hidden=true;raceMiniHud.style.display='none';}
    if(basketMiniHud){basketMiniHud.hidden=true;basketMiniHud.style.display='none';}
    leafMiniActive=false;
    guardMiniActive=false;
    leafTargets=[];
    guardTargets=[];

    gameOver=false;
    restartButton.hidden=true;
    restartButton.textContent='もう一度';
    if(titleReturnButton) titleReturnButton.hidden=true;
    comboHits=0; comboTimer=0; comboEl.textContent='';

    const rivalType=enemyType || selectedOpponent || 'blue';
    player=new Fighter(innerWidth*.28,innerHeight*.52,true,selectedFighter);
    enemy=new Fighter(innerWidth*.72,innerHeight*.48,false,rivalType);
    enemy.hp=100;
    enemy.sameCharacter=(rivalType===selectedFighter);

    bubbles=Array.from({length:28},()=>({
      x:Math.random()*innerWidth,y:Math.random()*innerHeight,
      r:2+Math.random()*6,s:10+Math.random()*26
    }));
    resetBattleEffects();

    if(gameMode==='story'){
      if(storyHud){
        storyHud.hidden=false;
        const total=storyQueue.length;
        storyHud.textContent=`STORY ${storyFightIndex+1}/${total}　勝${storyWins} 敗${storyLosses}/3　VS ${fighterDisplayName(rivalType)}`;
      }
    }else{
      if(storyHud) storyHud.hidden=true;
      stageTheme=0;
    }

    running=true; last=performance.now();
    updateHud();
  }

  function startStoryMode(){
    // ストーリー開始前にミニゲームHUD/状態を完全クリア
    if(leafMiniHud){leafMiniHud.hidden=true;leafMiniHud.style.display='none';}
    if(guardMiniHud){guardMiniHud.hidden=true;guardMiniHud.style.display='none';}
    leafMiniActive=false;
    guardMiniActive=false;
    leafTargets=[];
    guardTargets=[];

    storyQueue=playableTypes.filter(t=>t!==selectedFighter);
    if(selectedFighter!=='beelzebub') storyQueue.push('beelzebub');
    storyFightIndex=0;
    storyLosses=0;
    storyWins=0;
    storyFinished=false;
    stageTheme=0;

    show('game');
    resize();

    showStoryNarrative([
      '仕事に疲れた河津一郎は、帰り道、ぼんやりと池を眺めていた。\n\n水の中を泳ぐ一匹のカエル。\n\n「……あいつらは呑気でいいよな」',
      'しばらく眺めているうちに、ふと思う。\n\n「いや、待てよ……」\n\n「あいつらはあいつらで、厳しい世界を生き抜いているのかもしれない」',
      '河津一郎は妄想し始めた――。'
    ],()=>startGame('story',storyQueue[0]));
  }

  function continueStory(){
    if(storyFinished) return;

    storyFightIndex++;
    if(storyFightIndex>=storyQueue.length){
      storyFinished=true;
      gameOver=true;
      comboEl.textContent=`STORY CLEAR!　${storyWins}勝 ${storyLosses}敗`;
      restartButton.hidden=false;
      restartButton.textContent='キャラ選択へ';
      return;
    }

    // 3戦ごとに背景を変更。ラスボスは専用の暗い水域。
    const nextType=storyQueue[storyFightIndex];
    stageTheme=nextType==='beelzebub' ? 3 : Math.min(2,Math.floor(storyFightIndex/3));
    startGame('story',nextType);
  }


  function chooseAttackVariant(f, other, kind){
    const dy=other.y-f.y;

    // 初心者向けの自動補正だけに絞る。
    // パンチは上方向だけ、キックは下方向だけ。
    if(kind==='punch' && dy<-30) return 'up';
    if(kind==='kick' && dy>30) return 'down';

    return 'mid';
  }

  function auraCancelZones(f){
    if(!f) return [];
    const z=[];
    const fx=x=>f.x+f.face*x;

    if(f.type==='green' && f.specialType==='uppercut' && f.specialT<=.54 && f.specialT>=.08)
      z.push({owner:f,x:fx(48),y:f.y-22,r:30});
    if(f.type==='green' && f.specialType==='dropkick' && f.specialT<=.475 && f.specialT>=.06)
      z.push({owner:f,x:fx(61),y:f.y+39,r:34});
    if(f.type==='green' && f.specialType==='burningCyclone'){
      const ang=burningCycloneAngle(f);
      const a=rotatePoint(-17,52,ang);
      const b=rotatePoint(17,52,ang);
      z.push({owner:f,x:f.x+a.x,y:f.y+a.y,r:28});
      z.push({owner:f,x:f.x+b.x,y:f.y+b.y,r:28});
    }

    if(f.type==='black' && f.specialType==='hellCrashFinish')
      z.push({owner:f,x:fx(48),y:f.y-38,r:34});
    if(f.type==='black' && f.specialType==='abyssCharge')
      z.push({owner:f,x:fx(26),y:f.y+8,r:27});
    if(f.type==='black' && f.specialType==='abyssBurst')
      z.push({owner:f,x:fx(64),y:f.y+7,r:36});

    if(f.type==='orange' && f.specialType==='whiteCounterHit')
      z.push({owner:f,x:fx(58),y:f.y+7,r:32});

    return z;
  }

  function cancelSoftProjectilesAtZone(z){
    if(!z || !z.owner) return;

    pressureBlades.forEach(p=>{
      if(p.hit || !p.owner || p.owner===z.owner) return;
      if(Math.hypot(p.x-z.x,p.y-z.y)<z.r+30){
        p.hit=true; p.t=0;
        spawnImpact(p.x,p.y,'guard');
      }
    });

    catfishCharges.forEach(n=>{
      if(n.hit || !n.owner || n.owner===z.owner) return;
      const headX=n.x+Math.sign(n.vx||1)*58;
      if(Math.hypot(headX-z.x,n.y-z.y)<z.r+58){
        n.hit=true; n.t=0;
        spawnImpact(headX,n.y,'guard');
      }
    });
  }

  function cancelSoftProjectilesByAura(){
    [player,enemy].filter(Boolean).forEach(f=>{
      auraCancelZones(f).forEach(cancelSoftProjectilesAtZone);
    });
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

  function specialAquaVortex(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0 || f.attackT>0) return false;

    const dir=f.face;
    f.specialType='aquaVortex';
    f.specialT=.48;
    f.attack='punch';
    f.attackVariant='mid';
    f.attackT=.48;

    aquaVortices.push({
      owner:f,
      x:f.x+dir*52,
      y:f.y+7,
      r:34,
      t:3.0,
      life:3.0,
      spin:0,
      lastHitAt:-9999
    });

    comboEl.textContent='アクアボルテックス!';
    setTimeout(()=>{
      if(comboEl.textContent==='アクアボルテックス!') comboEl.textContent='';
    },700);
    return true;
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

  function specialHellCrash(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0) return false;

    const other=f.isPlayer?enemy:player;
    if(!other) return false;

    const dir=f.face;
    f.specialType='hellCrash';
    f.specialT=.95;
    f.attack='punch';
    f.attackT=.95;
    f.specialHitDone=false;

    comboEl.textContent='ヘルクラッシュ!';
    setTimeout(()=>{
      if(comboEl.textContent==='ヘルクラッシュ!') comboEl.textContent='';
    },800);

    // 短く鋭い体当たり
    f.vx += dir*355;

    const started=performance.now();
    const timer=setInterval(()=>{
      if(gameOver || !f || !other || f.specialType!=='hellCrash'){
        clearInterval(timer);
        return;
      }

      const dx=(other.x-f.x)*dir;
      const dy=Math.abs(other.y-f.y);

      if(dx>-16 && dx<84 && dy<72 && !f.specialHitDone){
        f.specialHitDone=true;
        clearInterval(timer);

        f.vx*=.08;
        other.vx*=.08;
        other.vy*=.12;
        other.stun=Math.max(other.stun,.38);

        // 接触後、赤オーラのアッパーへ
        f.specialType='hellCrashFinish';
        f.specialT=.5;
        f.attack='punch';
        f.attackVariant='up';
        f.attackT=.5;

        setTimeout(()=>{
          if(gameOver) return;

          other.hurtFace='both';
          other.hurtFaceT=.72;

          // 斜め上へ強く飛ばし、やられ顔で回転させる
          damageHit(f,other,12.0*f.damageMul,245*dir,-315);

          // Fighterの既存回転処理を使う。文字列ではなく安全なthrowStateオブジェクト。
          other.throwState=null;
          other.spinAngle=0;
          other.throwState={
            owner:f,
            spinSpeed:dir*13.5,
            endT:.82,
            noWallDamage:true
          };

          burstWaves.push({
            x:other.x,
            y:other.y+4,
            t:.30,life:.30,
            radius:12,max:70,
            power:1
          });
        },125);
      }

      if(performance.now()-started>650){
        clearInterval(timer);
      }
    },20);

    return true;
  }

  function startAbyssCharge(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0) return false;
    f.specialType='abyssCharge'; f.specialT=20; f.attack='punch'; f.attackT=20;
    f.chargeStartTime=performance.now(); f.chargePower=.2; f.vx*=.25; f.vy*=.25;
    comboEl.textContent='CHARGE...'; return true;
  }

  function releaseAbyssCharge(f){
    if(!f || f.specialType!=='abyssCharge') return false;
    const held=Math.max(0,performance.now()-(f.chargeStartTime||performance.now()));
    const power=Math.max(.25,Math.min(1,held/1150));
    f.specialType='abyssBurst'; f.specialT=.5; f.attack='punch'; f.attackVariant='mid'; f.attackT=.5; f.chargePower=power;
    // 溜め姿勢から拳を出す瞬間に、身体もわずかに前へ乗せる。
    f.vx+=f.face*(38+42*power);
    comboEl.textContent='アビスチャージ!';setTimeout(()=>{if(comboEl.textContent==='アビスチャージ!')comboEl.textContent='';},720);
    setTimeout(()=>{
      if(gameOver)return; const other=f.isPlayer?enemy:player; if(!other)return;
      const hx=f.x+f.face*67, hy=f.y+7, dist=Math.hypot(other.x-hx,other.y-hy);
      if(dist<other.radius+34){
        // 直撃は相手をルシファーさんから遠ざける方向へ大きく吹き飛ばす
        const directKnockback=300+150*power;
        damageHit(
          f,other,
          (7.5+7.5*power)*f.damageMul,
          directKnockback*f.face,
          -55
        );
      }else if(dist<155){
        // 衝撃波だけなら従来どおり小さめ
        damageHit(f,other,(1.1+1.9*power)*f.damageMul,85*f.face,-16);
      }
      burstWaves.push({x:hx,y:hy,t:.44,life:.44,radius:18,max:150,power});
    },110);
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

  function specialBurningCyclone(f){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0 || f.attackT>0) return false;

    f.specialType='burningCyclone';
    f.specialT=1.02;
    f.attack='kick';
    f.attackT=1.02;
    f.cycloneLastHitA=-9999;
    f.cycloneLastHitB=-9999;
    f.cycloneStartTime=performance.now();

    // 高速回転しながら相手方向へ突進
    f.vx+=f.face*510;
    f.vy*=.18;

    comboEl.textContent='バーニングサイクロン!';
    setTimeout(()=>{
      if(comboEl.textContent==='バーニングサイクロン!') comboEl.textContent='';
    },820);
    clearCommand();
    return true;
  }

  function specialLilithBackSpin(f,additional=false){
    if(gameOver || !f || f.type!=='purple' || f.stun>0 || f.throwState) return false;
    if(additional && f.specialType==='lilithBackSpin'){
      f.specialT=Math.min(1.55,f.specialT+.34);
      f.attackT=Math.min(1.55,f.attackT+.34);
      f.vx-=f.face*115;
      return true;
    }
    if(f.specialT>0 || f.attackT>0) return false;
    f.specialType='lilithBackSpin'; f.specialT=.58;
    f.attack='kick'; f.attackT=.58;
    f.lilithSpinStartTime=performance.now();
    f.lilithSpinLastHitA=-9999; f.lilithSpinLastHitB=-9999;
    f.vx-=f.face*285; f.vy*=.25;
    comboEl.textContent='バックスピンキック!';
    setTimeout(()=>{if(comboEl.textContent==='バックスピンキック!')comboEl.textContent='';},600);
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


  function specialVenomWater(f){
    if(gameOver || !f || f.stun>0 || f.specialT>0 || f.bossSpecialCooldown>0) return false;
    f.guard=false;
    f.specialType='venomWater';
    f.specialT=.68;
    f.bossSpecialCooldown=2.4;

    toxicWaters.push({
      owner:f,
      t:5.4,
      life:5.4,
      tick:0,
      // v6.34: ベルゼブブ本人を中心に毒煙が広がる。
      originX:f.x,
      originY:f.y,
      seed:Math.random()*1000
    });

    comboEl.textContent='ヴェノム・ウォーター!';
    setTimeout(()=>{if(comboEl.textContent==='ヴェノム・ウォーター!')comboEl.textContent='';},800);
    clearCommand();
    return true;
  }

  function specialFishRaid(f){
    if(gameOver || !f || f.stun>0 || f.specialT>0 || f.bossSpecialCooldown>0) return false;
    const target=f.isPlayer?enemy:player;
    if(!target) return false;

    f.specialType='fishRaid';
    f.specialT=.55;
    f.attack='punch';
    f.attackT=.55;
    f.bossSpecialCooldown=2.0;

    const count=10+Math.floor(Math.random()*11);
    for(let i=0;i<count;i++){
      const side=(i%2===0)?1:-1;
      bossFish.push({
        owner:f,
        target,
        x:side>0?innerWidth+30+Math.random()*130:-30-Math.random()*130,
        y:70+Math.random()*Math.max(120,innerHeight-150),
        vx:0,vy:0,
        r:10+Math.random()*4,
        hp:1,
        t:4.4,
        phase:Math.random()*Math.PI*2
      });
    }

    comboEl.textContent='フィッシュ・レイド!';
    setTimeout(()=>{if(comboEl.textContent==='フィッシュ・レイド!')comboEl.textContent='';},800);
    clearCommand();
    return true;
  }

  function specialAbyssShock(f){
    if(gameOver || !f || f.stun>0 || f.specialT>0 || f.bossSpecialCooldown>0) return false;

    f.specialType='abyssShock';
    f.specialT=.68;
    f.attack='kick';
    f.attackVariant='up';
    f.attackT=.68;
    f.bossSpecialCooldown=1.7;

    setTimeout(()=>{
      if(gameOver || !f) return;
      abyssShocks.push({
        owner:f,
        x:f.x+f.face*48,
        y:f.y+42,
        vx:f.face*430,
        vy:-120,
        t:1.5,
        life:1.5,
        r:58,
        hit:false
      });
    },130);

    comboEl.textContent='アビスショック!';
    setTimeout(()=>{if(comboEl.textContent==='アビスショック!')comboEl.textContent='';},760);
    clearCommand();
    return true;
  }

  function specialCrayfishCounter(f){
    if(gameOver || f.stun>0 || f.throwState || f.specialT>0) return false;
    f.guard=false;
    f.attack=null;
    f.attackT=0;
    f.specialType='crayfishCounter';
    f.specialT=1.15;
    f.crayfishCounterReady=true;
    f.crayfishCounterT=1.15;
    comboEl.textContent='クロー・カウンター!';
    setTimeout(()=>{
      if(comboEl.textContent==='クロー・カウンター!') comboEl.textContent='';
    },720);
    clearCommand();
    return true;
  }

  function triggerCrayfishCounter(f,attacker){
    if(!f || !f.crayfishCounterReady || !attacker) return false;

    f.crayfishCounterReady=false;
    f.crayfishCounterT=0;
    f.specialType='crayfishCounterHit';
    f.specialT=.52;
    f.attack='punch';
    f.attackT=.52;

    attacker.stun=Math.max(attacker.stun,.44);
    attacker.attackT=Math.max(attacker.attackT,.30);

    setTimeout(()=>{
      if(gameOver || !f || !attacker) return;
      // 両腕を広げた構えから、一気に振り下ろす
      damageHit(f,attacker,9.0*f.damageMul,150*f.face,115);
      attacker.hurtFace='both';
      attacker.hurtFaceT=.55;
    },110);

    comboEl.textContent='COUNTER!';
    setTimeout(()=>{
      if(comboEl.textContent==='COUNTER!') comboEl.textContent='';
    },520);

    return true;
  }

  function specialCrayfishRush(f){
    if(gameOver || f.stun>0 || f.specialT>0) return false;
    f.specialType='crayfishRush';
    f.specialT=1.05;
    f.attack='punch';
    f.attackT=1.05;
    f.crayfishRushStep=0;
    f.crayfishRushLastHit=0;
    f.vx += f.face*390;
    f.vy *= .35;

    comboEl.textContent='クローラッシュ!';
    setTimeout(()=>{if(comboEl.textContent==='クローラッシュ!')comboEl.textContent='';},750);
    return true;
  }

  function executeCrayfishBottomSmash(f){
    if(gameOver || !f) return false;

    f.crayfishSmashQueued=false;
    f.crayfishSmashQueueT=0;
    f.specialType='crayfishBottomSmash';
    f.specialT=.72;
    f.attack='kick';
    f.attackT=.72;
    f.crayfishSmashDone=false;

    comboEl.textContent='ボトムスマッシュ!';
    setTimeout(()=>{if(comboEl.textContent==='ボトムスマッシュ!')comboEl.textContent='';},720);

    setTimeout(()=>{
      if(gameOver || !f) return;
      f.crayfishSmashDone=true;

      const floorY=innerHeight-35;
      for(let i=0;i<42;i++){
        const life=1.65+Math.random()*.75;
        siltClouds.push({
          x:Math.random()*innerWidth,
          y:floorY-Math.random()*Math.max(150,innerHeight*.58),
          t:life,life,radius:45+Math.random()*70,mega:true
        });
      }
      for(let i=0;i<14;i++){
        const life=1.4+Math.random()*.55;
        siltClouds.push({
          x:Math.max(0,Math.min(innerWidth,f.x+(Math.random()-.5)*360)),
          y:floorY-Math.random()*180,
          t:life,life,radius:65+Math.random()*75,mega:true
        });
      }

      const other=f.isPlayer?enemy:player;
      if(other && Math.abs(other.x-f.x)<145 && other.y>innerHeight-145){
        damageHit(f,other,5.8*f.damageMul,70*f.face,-135);
      }
    },220);

    return true;
  }

  function specialCrayfishBottomSmash(f){
    if(gameOver || f.stun>0 || f.specialT>0 || f.crayfishSmashQueued) return false;

    // 水底すれすれなら、その場で発動してよい
    if(f.y>=innerHeight-128){
      return executeCrayfishBottomSmash(f);
    }

    // 高い場所ではまず水底へ降りる。空中で土煙は出さない。
    f.crayfishSmashQueued=true;
    f.crayfishSmashQueueT=2.0;
    f.specialType='crayfishSmashDrop';
    f.specialT=2.0;
    f.attack=null;
    f.attackT=0;
    f.vx*=.25;
    f.vy=Math.max(f.vy,360);
    comboEl.textContent='水底へ…';
    return true;
  }

  function specialPiranhaRush(f){
    if(gameOver || f.stun>0 || f.specialT>0) return false;
    f.specialType='piranhaRush'; f.specialT=.72; f.attack='tongue'; f.attackT=.72;
    f.piranhaRushHit=false; f.vx += f.face*610;
    comboEl.textContent='高速突進噛みつき!';
    setTimeout(()=>{if(comboEl.textContent==='高速突進噛みつき!')comboEl.textContent='';},650);
    return true;
  }

  function specialPiranhaDive(f,variant){
    if(gameOver || f.stun>0 || f.specialT>0) return false;
    const other=f.isPlayer?enemy:player;
    f.specialType=variant==='punch'?'piranhaDivePunch':'piranhaDiveKick';
    f.specialT=1.15; f.attack=variant; f.attackT=1.15; f.piranhaDivePhase=1;
    const offset=(variant==='punch'?42:-42)*f.face;
    f.piranhaDiveTargetX=Math.max(45,Math.min(innerWidth-45,(other?other.x:f.x)+offset));
    f.vy=-620; f.vx*=.15;
    comboEl.textContent=variant==='punch'?'急降下背びれ!':'急降下テール!';
    setTimeout(()=>{
      if(gameOver || !f || !f.specialType || !f.specialType.startsWith('piranhaDive')) return;
      f.x=f.piranhaDiveTargetX; f.y=-42; f.vx=0; f.vy=690; f.piranhaDivePhase=2;
    },330);
    return true;
  }

  function specialPressureBlade(f,angleDeg=0,source='punch'){
    if(gameOver || f.stun>0 || f.guard || f.specialT>0) return false;

    f.specialType='pressureBlade';
    f.specialT=.42;
    f.attack=source==='kick' ? 'kick' : (source==='punch' ? 'punch' : null);
    f.attackT=.42;

    const speed=350;
    const rad=angleDeg*Math.PI/180;
    const yOffset=source==='punch' ? -10 : (source==='kick' ? 28 : 2);

    pressureBlades.push({
      owner:f,
      x:f.x+f.face*68,
      y:f.y+yOffset,
      vx:f.face*Math.cos(rad)*speed,
      vy:Math.sin(rad)*speed,
      t:1.25,
      life:1.25,
      hit:false,
      size:1.0,
      angle:rad
    });

    comboEl.textContent='水圧カッター!';
    setTimeout(()=>{if(comboEl.textContent==='水圧カッター!')comboEl.textContent='';},900);
    return true;
  }

  function specialRaphaelBubbleMove(f){
    if(gameOver || f.stun>0 || f.throwState || f.specialT>0) return false;

    f.guard=false;
    f.specialType='raphaelBubbleMove';
    f.specialT=.92;
    f.attack=null;
    f.attackT=0;
    f.raphaelMoveElapsed=0;
    f.raphaelMoveDuration=.82;
    f.raphaelMoveStartX=f.x;
    f.raphaelMoveStartY=f.y;

    // 最初は斜め後ろ下へ、そこから大きく回り込んで前下へ。
    const dir=f.face;
    f.raphaelMoveControlX=f.x-dir*Math.min(180,innerWidth*.18);
    f.raphaelMoveControlY=Math.min(innerHeight-70,f.y+Math.min(180,innerHeight*.30));
    f.raphaelMoveEndX=dir>0 ? innerWidth-90 : 90;
    f.raphaelMoveEndY=innerHeight-92;
    f.vx=0;
    f.vy=0;

    comboEl.textContent='高速バブル移動!';
    setTimeout(()=>{
      if(comboEl.textContent==='高速バブル移動!') comboEl.textContent='';
    },720);
    clearCommand();
    return true;
  }

  function specialHealingBubble(f){
    if(gameOver || f.stun>0 || f.specialT>0 || f.healT>0) return false;
    f.guard=false; f.specialType='healingBubble'; f.specialT=.55; f.healT=4.8;
    comboEl.textContent='ヒーリングバブル!';
    setTimeout(()=>{if(comboEl.textContent==='ヒーリングバブル!')comboEl.textContent='';},720);
    return true;
  }

  function hasFacingCircle(f, clockwiseWhenFacingRight=true, maxMs=1100){
    if(!f) return false;
    const now=performance.now();
    const hist=input.commandHistory
      .filter(v=>now-v.time<=maxMs)
      .map(v=>v.dir);

    // 画面座標では下が正なので、この並びが時計回り。
    const cw=['right','downRight','down','downLeft','left','upLeft','up','upRight'];
    const ccw=['right','upRight','up','upLeft','left','downLeft','down','downRight'];

    // 左向き時はコマンドを鏡映しにする。
    const wantCw = f.face>0 ? clockwiseWhenFacingRight : !clockwiseWhenFacingRight;
    const seq=wantCw ? cw : ccw;

    for(let start=0;start<8;start++){
      let p=0;
      for(const d of hist){
        if(d===seq[(start+p)%8]) p++;
        if(p>=7) return true;
      }
    }
    return false;
  }

  function hasFullCircle(maxMs=900){
    const now=performance.now();
    const hist=input.commandHistory.filter(v=>now-v.time<=maxMs).map(v=>v.dir);
    const cw=['right','downRight','down','downLeft','left','upLeft','up','upRight'];
    const ccw=['right','upRight','up','upLeft','left','downLeft','down','downRight'];
    const match=seq=>{
      for(let start=0;start<seq.length;start++){
        let p=0;
        for(const d of hist){
          if(d===seq[(start+p)%8]) p++;
          if(p>=7) return true;
        }
      }
      return false;
    };
    return match(cw)||match(ccw);
  }

  function specialWhiteCounter(f){
    if(gameOver || f.stun>0 || f.specialT>0) return false;
    f.guard=false; f.attack=null; f.attackT=0;
    f.specialType='whiteCounter'; f.specialT=1.15;
    f.counterT=1.15; f.counterReady=true;
    comboEl.textContent='ホワイトカウンター!';
    setTimeout(()=>{if(comboEl.textContent==='ホワイトカウンター!')comboEl.textContent='';},720);
    clearCommand();
    return true;
  }

  function triggerWhiteCounter(f,attacker){
    if(!f || !f.counterReady) return false;
    f.counterReady=false; f.counterT=0;
    f.specialType='whiteCounterHit'; f.specialT=.46;
    f.attack='punch'; f.attackVariant='mid'; f.attackT=.46;
    f.face=attacker && attacker.x<f.x ? -1 : 1;
    if(attacker){
      attacker.stun=Math.max(attacker.stun,.48);
      attacker.attackT=Math.max(attacker.attackT,.48);
      setTimeout(()=>{
        if(gameOver)return;
        damageHit(f,attacker,8.5*f.damageMul,210*f.face,-65,true);
      },105);
    }
    comboEl.textContent='COUNTER!';
    setTimeout(()=>{if(comboEl.textContent==='COUNTER!')comboEl.textContent='';},520);
    return true;
  }

  function armUrielTackle(f){
    if(gameOver || f.stun>0 || f.specialT>0) return false;
    f.tackleArmedT=.8;
    comboEl.textContent='TACKLE READY';
    setTimeout(()=>{if(comboEl.textContent==='TACKLE READY')comboEl.textContent='';},420);
    return true;
  }

  function specialUrielTackle(f){
    if(gameOver || f.stun>0 || f.specialT>0) return false;
    f.guard=false; f.tackleArmedT=0;
    f.specialType='urielTackle'; f.specialT=.96;
    f.attack='punch'; f.attackT=.96; f.tackleHit=false;
    // v4.3: より速く、より長く突進
    f.vx += f.face*560;
    comboEl.textContent='ガーディアンタックル!';
    setTimeout(()=>{if(comboEl.textContent==='ガーディアンタックル!')comboEl.textContent='';},720);
    return true;
  }

  function hasForwardForwardTap(f, windowMs=780){
    const now=performance.now();
    const taps=(input.forwardTapTimes||[]).filter(t=>now-t<=windowMs);
    input.forwardTapTimes=taps;
    return taps.length>=2;
  }

  function specialKawazuPressureRush(f){
    if(gameOver || f.stun>0 || f.specialT>0)return false;
    f.specialType='kawazuPressureRush';f.specialT=.62;f.attack='punch';f.attackT=.62;
    const count=14;
    for(let i=0;i<count;i++){
      const spread=(-.48+Math.random()*.96);
      const speed=390+Math.random()*170;
      kawazuShots.push({
        owner:f,x:f.x+f.face*45,y:f.y+5+(Math.random()-.5)*20,
        vx:f.face*Math.cos(spread)*speed,vy:Math.sin(spread)*speed,
        r:8+Math.random()*4,t:.9,life:.9,hit:false
      });
    }
    comboEl.textContent='水圧ラッシュ!';
    clearCommand();return true;
  }

  function specialKawazuMirageKick(f){
    if(gameOver || f.stun>0 || f.specialT>0)return false;
    const other=f.isPlayer?enemy:player;
    f.specialType='kawazuMirageKick';f.specialT=1.0;f.attack='kick';f.attackT=1.0;
    f.vx=f.face*760;
    const startFace=f.face;
    setTimeout(()=>{
      if(gameOver||!other||f.specialType!=='kawazuMirageKick')return;
      if(Math.hypot(other.x-f.x,other.y-f.y)<other.radius+f.radius+72){
        f.vx=0;other.stun=Math.max(other.stun,.95);
        for(let i=0;i<9;i++){
          setTimeout(()=>{
            if(gameOver||!other)return;
            const a=i*Math.PI*2/9;
            const gx=other.x+Math.cos(a)*72,gy=other.y+Math.sin(a)*54;
            kawazuGhosts.push({x:gx,y:gy,t:.22,life:.22,angle:a});
            spawnImpact(other.x+Math.cos(a)*20,other.y+Math.sin(a)*15,'hit');
            damageHit(f,other,(i===8?2.8:1.05)*f.damageMul,(i===8?190:12)*startFace,(i===8?-55:0));
          },i*62);
        }
      }
    },105);
    comboEl.textContent='ミラージュキック!';
    clearCommand();return true;
  }

  function specialKawazuCyclone(f){
    if(gameOver || f.stun>0 || f.specialT>0)return false;
    const other=f.isPlayer?enemy:player;
    if(!other)return false;
    f.specialType='kawazuCyclone';f.specialT=1.15;f.attack='kick';f.attackT=1.15;
    const dir=f.face;
    other.stun=Math.max(other.stun,1.0);
    for(let i=0;i<14;i++){
      setTimeout(()=>{
        if(gameOver||!other)return;
        const a=i*Math.PI*2/7;
        f.x=Math.max(45,Math.min(innerWidth-45,other.x+Math.cos(a)*64));
        f.y=Math.max(55,Math.min(innerHeight-55,other.y+Math.sin(a)*48));
        kawazuGhosts.push({x:f.x,y:f.y,t:.18,life:.18,angle:a});
        if(Math.hypot(f.x-other.x,f.y-other.y)<100){
          damageHit(f,other,(i===13?3.2:.72)*f.damageMul,(i===13?225:8)*dir,(i===13?-65:0));
        }
      },i*55);
    }
    comboEl.textContent='ハイスピードサイクロン!';
    clearCommand();return true;
  }

  function trySpecial(f,kind){
    if(!f) return false;

    if(f.type==='kawazu'){
      const forward=f.face>0?'right':'left';
      const downForward=f.face>0?'downRight':'downLeft';
      if(kind==='kick' && hasFacingCircle(f,true,1000)) return specialKawazuCyclone(f);
      const q=hasCommand(['down',forward],760)||hasCommand(['down',downForward],760)||hasCommand([downForward,forward],760);
      if(q && kind==='punch') return specialKawazuPressureRush(f);
      if(q && kind==='kick') return specialKawazuMirageKick(f);
    }

    if(f.type==='green'){
      if(kind==='kick' && hasFacingCircle(f,true,1100)){
        return specialBurningCyclone(f);
      }

      if(kind==='punch' && hasCommand(['down','up'],720)){
        clearCommand();
        return specialUppercut(f);
      }

      const back=f.face>0?'left':'right';
      const forward=f.face>0?'right':'left';
      if(kind==='kick' && hasCommand(['down',forward],720)){
        clearCommand();
        return specialDropKick(f);
      }
    }

    if(f.type==='blue'){
      const backDown=f.face>0?'downLeft':'downRight';
      const forwardUp=f.face>0?'upRight':'upLeft';
      const backUp=f.face>0?'upLeft':'upRight';
      const forwardDown=f.face>0?'downRight':'downLeft';

      const forward=f.face>0?'right':'left';

      if(kind==='punch' && hasCommand(['down',forward],720)){
        clearCommand();
        return specialAquaVortex(f);
      }

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
      if(kind==='punch' && hasForwardForwardTap(f,780)){
        input.forwardTapTimes=[]; clearCommand(); f.attackT=0; f.attack=null;
        return specialHellCrash(f);
      }
    }

    if(f.type==='piranha'){
      const back=f.face>0?'left':'right', forward=f.face>0?'right':'left';
      if(kind==='tongue' && hasCommand([back,forward],850)){ clearCommand(); return specialPiranhaRush(f); }
      if(kind==='punch' && hasCommand(['down','up'],900)){ clearCommand(); return specialPiranhaDive(f,'punch'); }
      if(kind==='kick' && hasCommand(['down','up'],900)){ clearCommand(); return specialPiranhaDive(f,'kick'); }
    }

    if(f.type==='crayfish'){
      if(kind==='kick' && hasCommand([f.face>0?'left':'right','down'],850)){
        clearCommand();
        return specialCrayfishBottomSmash(f);
      }
    }

    if(f.type==='yellow'){
      const forward=f.face>0?'right':'left';
      const downForward=f.face>0?'downRight':'downLeft';

      const pressureCommand =
        hasCommand(['down',forward],900) ||
        hasCommand(['down',downForward],900) ||
        hasCommand([downForward,forward],900);

      if(pressureCommand && (kind==='punch' || kind==='kick')){
        clearCommand();
        if(kind==='punch') return specialPressureBlade(f,0,'punch');
        return specialPressureBlade(f,15,'kick');
      }
    }

    if(f.type==='beelzebub'){
      const forward=f.face>0?'right':'left';
      const downForward=f.face>0?'downRight':'downLeft';

      const bossQuarterCommand =
        hasCommand(['down',forward],850) ||
        hasCommand(['down',downForward],850) ||
        hasCommand([downForward,forward],850);

      if(kind==='punch' && bossQuarterCommand){
        return specialFishRaid(f);
      }
      if(kind==='kick' && bossQuarterCommand){
        return specialAbyssShock(f);
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
    if(basketMiniActive){
      if(kind==='tongue' && basketTongueUse(f)) return;
      if((kind==='punch' || kind==='kick') && basketBall && basketBall.owner===f){
        basketShoot(f);
        return;
      }
    }

    if(gameOver || f.guard) return;

    const rapidTriple=(kind==='punch' || kind==='tongue') ? registerRapidTap(kind) : false;
    // アスモデウスさん：パンチ×3でクローラッシュ
    if(f.type==='crayfish' && kind==='punch' && rapidTriple){
      f.attackT=0;
      f.attack=null;
      if(specialCrayfishRush(f)) return;
    }


    if(f.type==='purple' && kind==='tongue' && rapidTriple){
      // 1・2回目の通常舌硬直を3回目でキャンセル。
      f.attackT=0;
      f.attack=null;
      f.tongueT=0;
      if(specialRibbonWhip(f)) return;
    }

    // リリスさん：後ろ＋キック。技中のキック追加入力で回転を追加。
    if(f.type==='purple' && kind==='kick'){
      if(f.specialType==='lilithBackSpin'){
        if(specialLilithBackSpin(f,true)) return;
      }
      const backHeld=(f.face>0 && input.x<-.35)||(f.face<0 && input.x>.35);
      if(backHeld && specialLilithBackSpin(f,false)) return;
    }

    // 通常攻撃より先に必殺技コマンドを判定
    if(trySpecial(f,kind)) return;

    // 舌で引かれている最中だけは、stun中でも舌による投げ抜けを受け付ける。
    const pullerForEscape = f.isPlayer ? enemy : player;
    const canTongueEscape = kind==='tongue' && pullerForEscape &&
      pullerForEscape.tonguePullTarget===f && pullerForEscape.tonguePullTimer>0;

    if(!canTongueEscape && (f.stun>0 || f.attackT>0)) return;

    // 非カエル種の舌ボタンは、それぞれ固有の近接攻撃に置換
    if(kind==='tongue' && f.type==='piranha'){
      f.attack='tongue'; f.attackT=.34; f.vx += f.face*115;
      const other=f.isPlayer?enemy:player;
      setTimeout(()=>{ if(other && Math.hypot(other.x-f.x,other.y-f.y)<88) damageHit(f,other,4.4*f.damageMul,92*f.face,-5); },105);
      return;
    }

    if(kind==='tongue' && f.type==='crayfish'){
      f.attack='crayfishStab'; f.attackT=.34;
      const other=f.isPlayer?enemy:player;
      setTimeout(()=>{
        if(!other)return;
        const dx=(other.x-f.x)*f.face;
        if(dx>0 && dx<105 && Math.abs(other.y-f.y)<58){
          damageHit(f,other,4.8*f.damageMul,110*f.face,-5);
        }
      },105);
      return;
    }

    const other = f.isPlayer ? enemy : player;
    const dir=f.face;
    const dist=Math.hypot(other.x-f.x, other.y-f.y);

    // ウリエルさん：ガード長押しで得た白いオーラ中はパンチ/キックのリーチ約3倍。
    if(f.type==='orange' && f.urielAuraT>0 && (kind==='punch'||kind==='kick')){
      f.attack=kind; f.attackVariant='mid'; f.attackT=kind==='punch'?.40:.54;
      f.whiteReachAttack=kind;
      const reach=kind==='punch'?235:285;
      const dmg=kind==='punch'?3.5:6.4;
      const delay=kind==='punch'?120:170;
      if(other && (other.x-f.x)*dir>0 && (other.x-f.x)*dir<reach && Math.abs(other.y-f.y)<82){
        setTimeout(()=>{
          if(!other)return;
          damageHit(f,other,dmg*f.damageMul,(kind==='punch'?85:170)*dir,kind==='punch'?-8:-28);
        },delay);
      }
      setTimeout(()=>{ if(f.whiteReachAttack===kind) f.whiteReachAttack=null; },Math.round((kind==='punch'?.40:.54)*1000));
      return;
    }

    if(f.type==='crayfish' && kind==='punch'){
      f.attack='crayfishHammer'; f.attackT=.42;
      if(dist<100 && Math.abs(other.y-f.y)<72){
        setTimeout(()=>damageHit(f,other,5.6*f.damageMul,85*dir,110),150);
      }
      return;
    }

    if(f.type==='crayfish' && kind==='kick'){
      f.attack='crayfishUpper'; f.attackT=.44;
      if(dist<100 && Math.abs(other.y-f.y)<78){
        setTimeout(()=>damageHit(f,other,5.2*f.damageMul,80*dir,-145),155);
      }
      return;
    }

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

        // 連続舌投げ時に前回の回転状態を引き継がない
        target.throwState=null;
        target.spinAngle=0;

        target.throwState={
          owner:f,
          spinSpeed: throwDir*15,
          endT:.72,
          noWallDamage:false
        };
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

      const tongueDy=Math.abs(other.y-f.y);
      const tongueTolerance=f.type==='beelzebub' ? 145 : 82;
      if(Math.abs(other.x-f.x)<f.tongueRange && tongueDy<tongueTolerance && Math.sign(other.x-f.x)===dir){
        if(f.type==='beelzebub'){
          // 軽く上下へ追尾するよう、舌を出す瞬間に相手側へ少し寄せる
          f.bossTongueAimY=(other.y-f.y)*.42;
        }
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

  function damageHit(attacker,target,dmg,kx,ky,bypassCounter=false){
    if(attacker && !attacker.isPlayer && target && target.isPlayer){
      dmg*=difficultyProfile().damage;
    }
    // アスモデウスさんのクロー・カウンター：
    // 近距離打撃だけ無効化。飛び道具は普通に受ける。
    if(target && target.type==='crayfish' && target.crayfishCounterReady && attacker){
      const projectileLike =
        attacker._projectileHit===true ||
        attacker.specialType==='pressureBlade' ||
        attacker.specialType==='aquaTornado' ||
        attacker.specialType==='aquaStream' ||
        attacker.specialType==='aquaVortex';

      const closeEnough=Math.hypot(attacker.x-target.x,attacker.y-target.y)<135;

      if(!projectileLike && closeEnough){
        triggerCrayfishCounter(target,attacker);
        spawnImpact(target.x,target.y,'guard');
        return;
      }
    }

    if(gameOver) return;

    // ウリエルさんのカウンター構え：打撃を無効化して白オーラ拳で反撃。
    if(!bypassCounter && target && target.type==='orange' && target.counterReady){
      spawnImpact(target.x,target.y,'guard');
      triggerWhiteCounter(target,attacker);
      return;
    }

    // 防御力。ウリエルさんは約22%軽減。
    dmg /= (target.defense||1);

    // ガード直後の緩めの受付時間ならジャストガード。
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
    if(gameMode==='practice' || gameMode==='leafMini' || gameMode==='guardMini') return;

    gameOver=true; running=true;

    if(gameMode==='story'){
      if(playerWon) storyWins++;
      else storyLosses++;

      if(!playerWon && storyLosses>=4){
        storyFinished=true;
        comboEl.textContent=`GAME OVER　${storyWins}勝 ${storyLosses}敗`;
        restartButton.textContent='キャラ選択へ';
      }else if(storyFightIndex>=storyQueue.length-1){
        storyFinished=true;
        const perfectUnlock=playerWon && storyLosses===0 && selectedFighter!=='beelzebub';
        if(perfectUnlock) unlockBeelzebub();

        if(playerWon){
          const firstKawazu=!isKawazuUnlocked();
          unlockKawazu();
          comboEl.textContent=perfectUnlock
            ? `PERFECT CLEAR!　ベルゼブブさん＆カワズさん解禁!`
            : `STORY CLEAR!　カワズさん解禁!`;
          restartButton.hidden=true;
          showStoryNarrative([
            '激闘の末、ベルゼブブさんは倒れた。\n\n……\n\n池を眺めていた河津一郎は、我に返った。',
            '河津一郎「……俺も、負けちゃいられないな」\n\n一郎は立ち上がった。\n\nそして――\n\n池に飛び込んだ。\n\nポチャン。',
            '水かきのついた手足で、ものすごい勢いで水中を泳いでいく河津一郎。\n\n……って、お前もカエルかよ！',
            '河津一郎――いや、\n\nカワズさん参戦！！'
          ],()=>{restartButton.hidden=false;});
        }else{
          comboEl.textContent=`STORY END　${storyWins}勝 ${storyLosses}敗`;
        }
        restartButton.textContent='キャラ選択へ';
      }else{
        comboEl.textContent=playerWon ? 'YOU WIN!　次の相手へ' : `YOU LOSE　残り猶予 ${3-storyLosses}`;
        restartButton.textContent='次の相手';
      }

      if(storyHud){
        storyHud.textContent=`STORY ${storyFightIndex+1}/${storyQueue.length}　勝${storyWins} 敗${storyLosses}/3`;
      }
      restartButton.hidden=false;
      return;
    }

    comboEl.textContent = playerWon ? 'YOU WIN!' : 'YOU LOSE';
    restartButton.textContent='もう一度';
    restartButton.hidden=false;
    if(titleReturnButton) titleReturnButton.hidden=false;
  }

  function updateHud(){
    playerHpEl.style.width=Math.max(0,Math.min(100,player.hp))+'%';
    enemyHpEl.style.width=((gameMode==='practice'||gameMode==='leafMini')?100:Math.max(0,Math.min(100,enemy.hp)))+'%';
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
    if(player && input.currentDir){
      const forward=player.face>0?'right':'left';
      const forwardUp=player.face>0?'upRight':'upLeft';
      const forwardDown=player.face>0?'downRight':'downLeft';
      if(input.currentDir===forward || input.currentDir===forwardUp || input.currentDir===forwardDown){
        const now=performance.now();
        input.forwardTapTimes=(input.forwardTapTimes||[]).filter(t=>now-t<=800);
        input.forwardTapTimes.push(now);
      }
    }
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
          // ベルゼブブさん：方向キー1回転＋ガードで毒水
          if(player.type==='beelzebub' && !player.throwState && hasFullCircle(1100)){
            if(specialVenomWater(player)){
              btn.classList.remove('pressed');
              return;
            }
          }

          // アスモデウスさん：下＋ガード×2で近距離カウンター構え
          if(player.type==='crayfish' && !player.throwState){
            const now=performance.now();
            const downNow=input.y>.35;
            input._crayGuardTimes=(input._crayGuardTimes||[]).filter(t=>now-t<760);

            if(downNow){
              input._crayGuardTimes.push(now);
              if(input._crayGuardTimes.length>=2){
                input._crayGuardTimes=[];
                if(specialCrayfishCounter(player)){
                  btn.classList.remove('pressed');
                  return;
                }
              }
            }
          }

          // ラファエルさん：敵が右なら反時計回り1回転＋ガードで高速バブル移動
          if(player.type==='yellow' && !player.throwState && hasFacingCircle(player,false,1150)){
            if(specialRaphaelBubbleMove(player)){
              btn.classList.remove('pressed');
              return;
            }
          }

          // ラファエルさん：後ろ＋ガード×2で徐々に回復
          if(player.type==='yellow' && !player.throwState){
            const now=performance.now();
            const backNow=(player.face>0 && input.x<-.35)||(player.face<0 && input.x>.35);
            input._raphaelGuardTimes=(input._raphaelGuardTimes||[]).filter(t=>now-t<720);
            if(backNow){
              input._raphaelGuardTimes.push(now);
              if(input._raphaelGuardTimes.length>=2){
                input._raphaelGuardTimes=[];
                if(specialHealingBubble(player)){btn.classList.remove('pressed');return;}
              }
            }
          }

          // ウリエルさん：1回転＋ガードでカウンター構え
          if(player.type==='orange' && !player.throwState && hasFullCircle(1000)){
            if(specialWhiteCounter(player)){btn.classList.remove('pressed');return;}
          }

          // ウリエルさん：後ろ→前→ガードだけでガーディアンタックル発動。
          if(player.type==='orange' && !player.throwState){
            const back=player.face>0?'left':'right';
            const forward=player.face>0?'right':'left';
            if(hasCommand([back,forward],820)){
              clearCommand();
              if(specialUrielTackle(player)){
                btn.classList.remove('pressed');
                return;
              }
            }
          }

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

          // ウリエルさん：通常ガード長押しの計測開始。
          if(player.type==='orange' && !player.throwState && !player.urielGuardHoldStart){
            player.urielGuardHoldStart=performance.now();
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
            if(guardMiniActive) guardMiniGuardTapTime=performance.now();

            // 650ms以内に3回で水押し波。ダメージは0、吹き飛ばしのみ。
            if(player.guardTapTimes.length>=3){
              player.guardTapTimes=[];
              guardWave(player);
            }
          }
        }
      }
      else if(action==='punch' && player && player.type==='black'){
        const backHeld=(player.face>0 && input.x<-.35) || (player.face<0 && input.x>.35);
        if(backHeld && !player.throwState){
          player.attackT=0; player.attack=null;
          if(startAbyssCharge(player)){btn.dataset.charging='1';return;}
        }
        attack(player,action);
      }
      else if(player) attack(player,action);
    };
    const up=e=>{
      e.preventDefault(); btn.classList.remove('pressed');
      if(action==='punch' && player && btn.dataset.charging==='1'){
        btn.dataset.charging=''; releaseAbyssCharge(player);
      }
      if(action==='guard'&&player){
        player.guard=false;
        if(player.type==='orange' && player.urielGuardHoldStart){
          const held=(performance.now()-player.urielGuardHoldStart)/1000;
          player.urielGuardHoldStart=0;
          // 誤タップでは発動しない。0.55秒以上から、押していた長さ程度を維持（最大4秒）。
          if(held>=.55 && !player.counterReady && player.specialType!=='whiteCounter'){
            player.urielAuraT=Math.min(4.0,held);
            comboEl.textContent='ホワイトオーラ!';
            setTimeout(()=>{if(comboEl.textContent==='ホワイトオーラ!')comboEl.textContent='';},600);
          }
        }
      }
    };
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
    if(e.key==='i'&&player){
      if(player.type==='orange'&&!player.urielGuardHoldStart)player.urielGuardHoldStart=performance.now();
      player.guard=true;
      player.guardStartT=.28;
      if(guardMiniActive) guardMiniGuardTapTime=performance.now();
    }
  });
  addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.key==='i'&&player)player.guard=false});

  function enemyAI(dt){
    const diff=difficultyProfile();
    if(gameMode==='practice' || gameMode==='raceMini' || gameMode==='basketMini') return;
    if(gameOver)return;

    // CPUも舌で引かれている時は、たまに投げ抜けを狙う。
    if(player && player.tonguePullTarget===enemy && player.tonguePullTimer>0){
      if(Math.random()<dt*3.2*diff.tongue) attack(enemy,'tongue');
      return;
    }

    if(enemy.stun>0)return;
    const dx=player.x-enemy.x,dy=player.y-enemy.y,dist=Math.hypot(dx,dy);
    if(enemy.attackT<=0){
      if(enemy.type==='beelzebub' && enemy.specialT<=0 && enemy.bossSpecialCooldown<=0){
        const roll=Math.random();
        if(roll<dt*.16){ specialVenomWater(enemy); return; }
        if(roll<dt*.34){ specialFishRaid(enemy); return; }
        if(roll<dt*.52){ specialAbyssShock(enemy); return; }
      }

      if(dist>105){ enemy.vx += Math.sign(dx)*enemy.speed*.9*diff.move*dt; enemy.vy += Math.sign(dy)*enemy.speed*.55*diff.move*dt; }
      else if(Math.random()<dt*.8*diff.attack) attack(enemy,Math.random()<.62?'punch':'kick');
      if(enemy.tonguePullTarget && enemy.tonguePullTimer>0 && Math.random()<dt*2.2*diff.attack){
        attack(enemy,'tongue');
      } else if(dist>120&&dist<enemy.tongueRange&&Math.random()<dt*.28*diff.tongue) {
        attack(enemy,'tongue');
      }
      enemy.guard = dist<90 && Math.random()<dt*.25*diff.guard;
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

  function ensureFighterVisible(f,fallbackX,fallbackY){
    if(!f) return;

    if(!Number.isFinite(f.x) || !Number.isFinite(f.y) ||
       !Number.isFinite(f.vx) || !Number.isFinite(f.vy)){
      f.x=fallbackX;
      f.y=fallbackY;
      f.vx=0;
      f.vy=0;
      f.spinAngle=0;
      f.throwState=null;
    }

    const margin=Math.max(42,(Number.isFinite(f.radius)?f.radius:35)+8);
    f.x=Math.max(margin,Math.min(innerWidth-margin,f.x));
    f.y=Math.max(58,Math.min(innerHeight-58,f.y));
  }

  function separateBattleFighters(a,b){
    // 表示・描画処理とは完全に独立した座標補正だけ。
    if(!a || !b) return;
    if(!Number.isFinite(a.x) || !Number.isFinite(a.y) ||
       !Number.isFinite(b.x) || !Number.isFinite(b.y)) return;

    // 舌投げなど、意図的に重なる演出中は何もしない。
    if(a.throwState || b.throwState) return;

    const ar=Number.isFinite(a.radius) ? a.radius : 35;
    const br=Number.isFinite(b.radius) ? b.radius : 35;

    const dx=b.x-a.x;
    const dy=b.y-a.y;

    // 上下差が大きい場合は水中ですれ違える。
    const verticalLimit=(ar+br)*0.62;
    if(Math.abs(dy)>verticalLimit) return;

    // 横方向の最低距離。見た目より少し柔らかめ。
    const minX=(ar+br)*0.76;
    const absDx=Math.abs(dx);
    if(absDx>=minX) return;

    // 完全に同じXなら、PLAYERを左・RIVALを右に分ける。
    const dir=absDx<0.001 ? 1 : Math.sign(dx);
    const overlap=minX-absDx;

    // 一気に弾かず、1フレームで少しずつ押し分ける。
    const push=Math.min(overlap*.52,8);

    a.x-=dir*push;
    b.x+=dir*push;

    // 互いに突っ込み続けて再び重なるのを少し抑える。
    if(Number.isFinite(a.vx) && Number.isFinite(b.vx)){
      const approaching=(b.vx-a.vx)*dir<0;
      if(approaching){
        a.vx*=.72;
        b.vx*=.72;
      }
    }

    // 画面外へ押し出さない。
    const margin=42;
    a.x=Math.max(margin,Math.min(innerWidth-margin,a.x));
    b.x=Math.max(margin,Math.min(innerWidth-margin,b.x));
  }

  function rotatePoint(x,y,a){
    const ca=Math.cos(a), sa=Math.sin(a);
    return {x:x*ca-y*sa,y:x*sa+y*ca};
  }

  function burningCycloneAngle(f){
    if(!f || f.specialType!=='burningCyclone') return 0;
    const elapsed=(performance.now()-(f.cycloneStartTime||performance.now()))/1000;
    // 右向きは時計回り、左向きは鏡映し
    return elapsed*22*(f.face>0?1:-1);
  }

  function updateNewSpecialMoves(f,dt){
    if(!f) return;

    if(f.specialType==='burningCyclone'){
      const other=f.isPlayer?enemy:player;
      const ang=burningCycloneAngle(f);

      // 突進速度を維持
      if(Math.abs(f.vx)<350) f.vx+=f.face*220*dt;

      if(other){
        const feet=[
          {localX:-17,localY:52,key:'cycloneLastHitA'},
          {localX: 17,localY:52,key:'cycloneLastHitB'}
        ];
        const now=performance.now();

        feet.forEach(foot=>{
          const p=rotatePoint(foot.localX,foot.localY,ang);
          const wx=f.x+p.x, wy=f.y+p.y;
          if(
            Math.hypot(other.x-wx,other.y-wy)<other.radius+22 &&
            now-(f[foot.key]||-9999)>72
          ){
            f[foot.key]=now;
            // 超多段用の小ダメージ
            damageHit(f,other,.62*f.damageMul,16*f.face,-2);
          }
        });
      }
    }

    if(f.specialType==='lilithBackSpin'){
      const other=f.isPlayer?enemy:player;
      const elapsed=(performance.now()-(f.lilithSpinStartTime||performance.now()))/1000;
      const ang=elapsed*18*(f.face>0?-1:1);
      if(other){
        const now=performance.now();
        [{x:-58,y:46,key:'lilithSpinLastHitA'},{x:58,y:46,key:'lilithSpinLastHitB'}].forEach(foot=>{
          const p=rotatePoint(foot.x,foot.y,ang);
          if(Math.hypot(other.x-(f.x+p.x),other.y-(f.y+p.y))<other.radius+22 && now-(f[foot.key]||-9999)>115){
            f[foot.key]=now;
            damageHit(f,other,.82*f.damageMul,-38*f.face,-5);
          }
        });
      }
    }

    if(f.specialType==='raphaelBubbleMove'){
      f.raphaelMoveElapsed=(f.raphaelMoveElapsed||0)+dt;
      const dur=f.raphaelMoveDuration||.82;
      const t=Math.max(0,Math.min(1,f.raphaelMoveElapsed/dur));
      const u=1-t;

      // 2次ベジェ：斜め後ろ下へ膨らみ、前下へぐるっと回り込む
      f.x=
        u*u*f.raphaelMoveStartX+
        2*u*t*f.raphaelMoveControlX+
        t*t*f.raphaelMoveEndX;
      f.y=
        u*u*f.raphaelMoveStartY+
        2*u*t*f.raphaelMoveControlY+
        t*t*f.raphaelMoveEndY;

      f.vx=0;
      f.vy=0;
    }
  }

  function projectileImmuneByBubble(f){
    return !!(f && f.specialType==='raphaelBubbleMove' && f.specialT>0);
  }

function drawBackground(dt){
    const themes=[
      {top:'#42c7d6',mid:'#10849a',bottom:'#075469',floor:'#075047',plant:'#16855f',shaft:'rgba(255,255,220,.07)'},
      {top:'#56b78f',mid:'#29786f',bottom:'#174f50',floor:'#3e5438',plant:'#718347',shaft:'rgba(255,245,190,.06)'},
      {top:'#5a84a3',mid:'#345970',bottom:'#243d50',floor:'#3b4043',plant:'#596b67',shaft:'rgba(200,235,255,.055)'},
      {top:'#34254a',mid:'#201d3b',bottom:'#11182d',floor:'#201826',plant:'#493151',shaft:'rgba(180,120,220,.055)'}
    ];
    const th=themes[Math.max(0,Math.min(themes.length-1,stageTheme||0))];

    const grad=ctx.createLinearGradient(0,0,0,innerHeight);
    grad.addColorStop(0,th.top);
    grad.addColorStop(.52,th.mid);
    grad.addColorStop(1,th.bottom);
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,innerWidth,innerHeight);

    ctx.fillStyle=th.shaft;
    ctx.beginPath();
    ctx.moveTo(innerWidth*.15,0);ctx.lineTo(innerWidth*.35,0);
    ctx.lineTo(innerWidth*.55,innerHeight);ctx.lineTo(innerWidth*.42,innerHeight);
    ctx.fill();

    // 2つ目以降は岩や遠景を少し追加
    if(stageTheme===1){
      ctx.fillStyle='rgba(58,72,55,.36)';
      for(let x=30;x<innerWidth;x+=170){
        ctx.beginPath();ctx.ellipse(x,innerHeight-40,65,26,0,0,Math.PI*2);ctx.fill();
      }
    }else if(stageTheme===2){
      ctx.fillStyle='rgba(28,39,48,.42)';
      for(let x=70;x<innerWidth;x+=220){
        ctx.beginPath();ctx.moveTo(x,innerHeight-35);ctx.lineTo(x+45,innerHeight-135);ctx.lineTo(x+95,innerHeight-35);ctx.closePath();ctx.fill();
      }
    }else if(stageTheme===3){
      ctx.fillStyle='rgba(60,20,72,.24)';
      ctx.beginPath();ctx.arc(innerWidth*.78,innerHeight*.30,120,0,Math.PI*2);ctx.fill();
    }

    ctx.fillStyle=th.floor;
    ctx.fillRect(0,innerHeight-35,innerWidth,35);

    ctx.strokeStyle=th.plant;ctx.lineWidth=8;ctx.lineCap='round';
    for(let x=20;x<innerWidth;x+=75){
      ctx.beginPath();ctx.moveTo(x,innerHeight);
      ctx.quadraticCurveTo(x-18,innerHeight-60,x+4,innerHeight-105);ctx.stroke();
    }

    ctx.fillStyle='rgba(230,255,255,.5)';
    bubbles.forEach(b=>{
      b.y-=b.s*dt;
      if(b.y<-12){b.y=innerHeight+10;b.x=Math.random()*innerWidth}
      ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();
    });
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
      updateNewSpecialMoves(player,dt);
      updateNewSpecialMoves(enemy,dt);

      // v6.5: フリー対戦／ストーリーだけ、上下位置が近い時に横へ押し分ける。
      if(gameMode==='battle' || gameMode==='story'){
        separateBattleFighters(player,enemy);
      }

      ensureFighterVisible(player,innerWidth*.28,innerHeight*.52);
      ensureFighterVisible(enemy,innerWidth*.72,innerHeight*.48);




      // ラファエルさんの水圧カッター更新
      if(leafMiniActive){
        leafMiniTime-=dt;
        leafSpawnTimer-=dt;

        if(leafMiniTimeEl) leafMiniTimeEl.textContent=Math.max(0,leafMiniTime).toFixed(1);

        if(leafSpawnTimer<=0 && leafTargets.length<22){
          spawnLeafTarget(Math.floor(Math.random()*5),false);
          leafSpawnTimer=.24+Math.random()*.16;
        }

        leafTargets.forEach(leaf=>{
          leaf.x+=leaf.vx*dt;
          leaf.rot+=leaf.spin*dt;
        });

        leafTargets=leafTargets.filter(leaf=>!leaf.hit && leaf.x>-80);
        checkLeafHits();

        if(leafMiniTime<=0){
          leafMiniTime=0;
          endLeafMiniGame();
        }
      }

      if(guardMiniActive){
        guardMiniTime-=dt; guardSpawnTimer-=dt;
        if(guardMiniTimeEl) guardMiniTimeEl.textContent=Math.max(0,guardMiniTime).toFixed(1);
        const progress=1-Math.max(0,guardMiniTime)/60;
        // 最初の20秒は必ず1体ずつ。以降も最大2体まで。
        const maxTargets=guardMiniTime>40 ? 1 : 2;
        if(guardSpawnTimer<=0 && guardTargets.length<maxTargets){
          spawnGuardTarget();
          // 序盤は約2秒間隔。後半だけ少しずつ短くする。
          guardSpawnTimer=Math.max(.95,2.05-progress*.95)+Math.random()*.35;
        }
        guardTargets.forEach(t=>{
          t.x+=t.vx*dt;
          t.phase+=dt*4;
          // 全て主人公へ向かう。上下移動してもゆっくり追尾する。
          t.targetY=player.y;
          t.y+=(t.targetY-t.y)*Math.min(1,dt*3.2);
          if(t.resolved)return;
          const dx=t.x-player.x, dy=Math.abs(t.y-player.y);
          if(dx<player.radius+t.r+13 && dx>-player.radius-t.r-10 && dy<player.radius+t.r+8){
            t.resolved=true;
            const elapsed=performance.now()-guardMiniGuardTapTime;
            if(player.guard && elapsed>=0 && elapsed<=300){
              guardMiniScore++;
              if(guardMiniScoreEl)guardMiniScoreEl.textContent=String(guardMiniScore);
              comboEl.textContent='JUST GUARD!';
              spawnImpact(player.x+player.face*30,player.y,'guard');
            }else{
              guardMiniMiss++;
              if(guardMiniMissEl)guardMiniMissEl.textContent=String(guardMiniMiss);
              comboEl.textContent='MISS';
              player.hurtFace='both'; player.hurtFaceT=.28;
              spawnImpact(player.x+player.face*24,player.y,'hit');
            }
          }
        });
        guardTargets=guardTargets.filter(t=>!t.resolved && t.x>-80);
        if(guardMiniTime<=0){guardMiniTime=0;endGuardMiniGame();}
      }

      if(leafMiniActive){
        // 保険：葉っぱが0枚になっても必ず次を生成する
        if(leafTargets.length===0){
          for(let i=0;i<5;i++){
            spawnLeafTarget(i,false);
            const t=leafTargets[leafTargets.length-1];
            if(t) t.x=innerWidth+35+i*95;
          }
        }
      }

      // オーラのある拳・脚で水圧カッター／ナマズを打ち消す。
      // ガブリエルさんの長い水流は貫通系なので対象外。
      cancelSoftProjectilesByAura();

      aquaVortices.forEach(v=>{
        v.t-=dt;
        v.spin+=dt*8.5;

        cancelSoftProjectilesAtZone({owner:v.owner,x:v.x,y:v.y,r:v.r});

        const target=v.owner && v.owner.isPlayer ? enemy : player;
        if(target){
          const d=Math.hypot(target.x-v.x,target.y-v.y);
          const now=performance.now();
          if(d<target.radius+v.r && now-v.lastHitAt>260){
            v.lastHitAt=now;
            if(projectileImmuneByBubble(target)){
              spawnImpact(target.x,target.y,'guard');
            }else{
              v.owner._projectileHit=true;
              damageHit(v.owner,target,1.15*v.owner.damageMul,26*v.owner.face,-8);
              v.owner._projectileHit=false;
            }
          }
        }
      });
      aquaVortices=aquaVortices.filter(v=>v.t>0);

      toxicWaters.forEach(v=>{
        v.t-=dt;
        v.tick-=dt;
        const target=v.owner && v.owner.isPlayer ? enemy : player;
        if(target && v.tick<=0){
          v.tick=.48;
          // 紫の水の間、相手だけ。ガードし続けていれば無傷。
          if(!target.guard){
            v.owner._projectileHit=true;
            damageHit(v.owner,target,1.45*v.owner.damageMul,0,0);
            v.owner._projectileHit=false;
          }
        }
      });
      toxicWaters=toxicWaters.filter(v=>v.t>0);

      bossFish.forEach(fish=>{
        fish.t-=dt;
        fish.phase+=dt*7;
        const target=fish.target;
        if(target){
          const dx=target.x-fish.x, dy=target.y-fish.y;
          const d=Math.hypot(dx,dy)||1;
          fish.vx+=(dx/d)*260*dt;
          fish.vy+=(dy/d)*210*dt;
          const sp=Math.hypot(fish.vx,fish.vy)||1;
          const maxSp=235;
          if(sp>maxSp){fish.vx=fish.vx/sp*maxSp;fish.vy=fish.vy/sp*maxSp;}
          fish.x+=fish.vx*dt;
          fish.y+=fish.vy*dt+Math.sin(fish.phase)*6*dt;

          // 相手の攻撃に触れれば小魚は1発で倒せる
          const attacking=target.attackT>0 || target.tongueT>0 || target.specialT>0;
          if(attacking && Math.hypot(target.x-fish.x,target.y-fish.y)<target.radius+72){
            fish.hp=0;
            spawnImpact(fish.x,fish.y,'guard');
          }else if(Math.hypot(target.x-fish.x,target.y-fish.y)<target.radius+fish.r+8){
            fish.hp=0;
            fish.owner._projectileHit=true;
            damageHit(fish.owner,target,1.25*fish.owner.damageMul,45*Math.sign(fish.vx||1),-8);
            fish.owner._projectileHit=false;
          }
        }
      });
      bossFish=bossFish.filter(f=>f.t>0 && f.hp>0);

      abyssShocks.forEach(w=>{
        w.t-=dt;
        w.x+=w.vx*dt;
        w.y+=w.vy*dt;
        w.r+=42*dt;
        const target=w.owner && w.owner.isPlayer ? enemy : player;
        if(!w.hit && target && Math.hypot(target.x-w.x,target.y-w.y)<target.radius+w.r){
          w.hit=true;
          w.owner._projectileHit=true;
          damageHit(w.owner,target,8.5*w.owner.damageMul,190*w.owner.face,-165);
          w.owner._projectileHit=false;
        }
      });
      abyssShocks=abyssShocks.filter(w=>w.t>0 && !w.hit && w.x>-100 && w.x<innerWidth+100);

      if(raceMiniActive){
        raceMiniElapsed=(performance.now()-raceMiniStart)/1000;
        if(raceMiniTimeEl)raceMiniTimeEl.textContent=raceMiniElapsed.toFixed(2);
        const cp=raceCheckpoints[raceCheckpointIndex];
        if(cp && Math.hypot(player.x-cp.x,player.y-cp.y)<cp.r){
          raceCheckpointIndex++;
          if(raceCheckpointIndex>=raceCheckpoints.length){
            endRaceMiniGame();
          }
        }
        raceObstacles.forEach(o=>{
          const dx=player.x-o.x,dy=player.y-o.y;
          const d=Math.hypot(dx,dy)||1;
          if(d<player.radius+o.r){
            const rr=player.radius+o.r+3;
            player.x=o.x+dx/d*rr;
            player.y=o.y+dy/d*rr;
            player.vx*=.42;player.vy*=.42;
          }
        });
      }

      if(basketMiniActive){
        basketMiniTime-=dt;
        basketShotCooldown=Math.max(0,basketShotCooldown-dt);
        if(basketTimeEl)basketTimeEl.textContent=Math.max(0,basketMiniTime).toFixed(1);

        if(basketBall){
          if(basketBall.owner){
            const f=basketBall.owner;
            basketBall.x=f.x+f.face*43;
            basketBall.y=f.y+5;
          }else{
            basketBall.vy+=10*dt;
            basketBall.vx*=Math.pow(.993,dt*60);
            basketBall.vy*=Math.pow(.995,dt*60);
            basketBall.x+=basketBall.vx*dt;
            basketBall.y+=basketBall.vy*dt;
            if(basketBall.x<18||basketBall.x>innerWidth-18)basketBall.vx*=-.72;
            if(basketBall.y<55||basketBall.y>innerHeight-50)basketBall.vy*=-.72;
            basketBall.x=Math.max(18,Math.min(innerWidth-18,basketBall.x));
            basketBall.y=Math.max(55,Math.min(innerHeight-50,basketBall.y));

            for(const hoop of basketHoops){
              if(Math.hypot(basketBall.x-hoop.x,basketBall.y-hoop.y)<29){
                if(hoop.side==='player' && basketBall.lastTouch===player){
                  basketPlayerScore++;
                  if(basketPlayerScoreEl)basketPlayerScoreEl.textContent=String(basketPlayerScore);
                  comboEl.textContent='SCORE!';
                  resetBasketBall();
                  break;
                }
                if(hoop.side==='cpu' && basketBall.lastTouch===enemy){
                  basketEnemyScore++;
                  if(basketEnemyScoreEl)basketEnemyScoreEl.textContent=String(basketEnemyScore);
                  comboEl.textContent='CPU SCORE';
                  resetBasketBall();
                  break;
                }
              }
            }

            for(const f of [player,enemy]){
              if(!basketBall.owner && Math.hypot(f.x-basketBall.x,f.y-basketBall.y)<f.radius+basketBall.r+7){
                basketBall.owner=f;basketBall.lastTouch=f;break;
              }
            }
          }
        }

        // 1on1 CPU: ボールへ移動、保持したらリングへ。舌でも奪う。
        if(enemy && enemy.stun<=0 && basketBall){
          const target=basketBall.owner===enemy?basketHoops[0]:
            (basketBall.owner===player?player:basketBall);
          const dx=target.x-enemy.x,dy=target.y-enemy.y;
          enemy.vx+=Math.sign(dx)*enemy.speed*.82*dt;
          enemy.vy+=Math.sign(dy)*enemy.speed*.54*dt;

          if(basketBall.owner===enemy){
            if(Math.hypot(enemy.x-basketHoops[0].x,enemy.y-basketHoops[0].y)<255 && Math.random()<dt*1.5){
              basketShoot(enemy);
            }
          }else if(basketBall.owner===player &&
                   Math.abs(player.x-enemy.x)<enemy.tongueRange*.95 &&
                   Math.random()<dt*.75){
            basketTongueUse(enemy);
          }
        }

        if(basketMiniTime<=0){basketMiniTime=0;endBasketMiniGame();}
      }

      kawazuShots.forEach(p=>{
        p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
        const target=p.owner&&p.owner.isPlayer?enemy:player;
        if(!p.hit&&target&&Math.hypot(target.x-p.x,target.y-p.y)<target.radius+p.r){
          p.hit=true;
          p.owner._projectileHit=true;
          damageHit(p.owner,target,1.15*p.owner.damageMul,30*Math.sign(p.vx),p.vy*.08);
          p.owner._projectileHit=false;
        }
      });
      kawazuShots=kawazuShots.filter(p=>p.t>0&&!p.hit&&p.x>-40&&p.x<innerWidth+40&&p.y>-40&&p.y<innerHeight+40);
      kawazuGhosts.forEach(q=>q.t-=dt);
      kawazuGhosts=kawazuGhosts.filter(q=>q.t>0);

    pressureBlades.forEach(p=>{
        p.t-=dt; p.x+=p.vx*dt; p.y+=(p.vy||0)*dt;
        const target=p.owner && p.owner.isPlayer ? enemy : player;
        if(!p.hit && target){
          const d=Math.hypot(target.x-p.x,target.y-p.y);
          if(d<target.radius+28){
            p.hit=true;
            // ウリエルのカウンター構えは飛び道具を無効化。反撃は発生させない。
            if(projectileImmuneByBubble(target)){
              spawnImpact(p.x,p.y,'guard');
            }else if(target.type==='orange' && target.counterReady){
              spawnImpact(p.x,p.y,'guard');
            }else{
              p.owner._projectileHit=true;
              damageHit(p.owner,target,5.2*p.owner.damageMul,105*p.owner.face,-18);
              p.owner._projectileHit=false;
            }
          }
        }
      });
      pressureBlades=pressureBlades.filter(p=>p.t>0 && !p.hit && p.x>-80 && p.x<innerWidth+80);

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
          const floorY=innerHeight-35;
          const segDy=t.endY-t.startY;
          if(segDy>0 && t.startY<floorY && t.endY>=floorY){
            const u=(floorY-t.startY)/segDy;
            const floorX=t.startX+(t.endX-t.startX)*u;
            if(floorX>-40 && floorX<innerWidth+40){
              t.siltSpawned=true;
              siltClouds.push({
                x:floorX,
                y:floorY-2,
                t:1.05,
                life:1.05,
                radius:32
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
            if(projectileImmuneByBubble(target)){
              spawnImpact(target.x,target.y,'guard');
            }else{
              owner._projectileHit=true;
              damageHit(owner,target,7.0*owner.damageMul,125*owner.face,-125);
              owner._projectileHit=false;
            }
          }
        }
      });
      aquaTornadoes=aquaTornadoes.filter(t=>t.t>0);

      catfishCharges.forEach(n=>{
        n.t-=dt; n.x+=n.vx*dt;
        const target=n.target;
        if(!n.hit && target && Math.hypot(target.x-(n.x+Math.sign(n.vx)*55),target.y-n.y)<target.radius+72){
          n.hit=true;
          if(projectileImmuneByBubble(target)){
            spawnImpact(target.x,target.y,'guard');
          }else{
            n.owner._projectileHit=true;
            damageHit(n.owner,target,7.0*n.owner.damageMul,n.vx*.42,-55);
            n.owner._projectileHit=false;
          }
        }
      });
      catfishCharges=catfishCharges.filter(n=>n.t>0);

    burstWaves.forEach(b=>{b.t-=dt;});
      burstWaves=burstWaves.filter(b=>b.t>0);

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
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';

    if(raceMiniActive){
      ctx.save();
      ctx.strokeStyle='rgba(255,255,255,.25)';
      ctx.lineWidth=3;
      ctx.setLineDash([8,10]);
      ctx.beginPath();
      raceCheckpoints.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});
      ctx.stroke();
      ctx.setLineDash([]);

      for(let i=0;i<raceCheckpoints.length-1;i++){
        const a=raceCheckpoints[i],b=raceCheckpoints[i+1];
        const x=a.x+(b.x-a.x)*.55,y=a.y+(b.y-a.y)*.55;
        const ang=Math.atan2(b.y-a.y,b.x-a.x);
        ctx.save();ctx.translate(x,y);ctx.rotate(ang);
        ctx.fillStyle='rgba(255,242,120,.84)';
        ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-10,-9);ctx.lineTo(-5,0);ctx.lineTo(-10,9);ctx.closePath();ctx.fill();
        ctx.restore();
      }

      raceObstacles.forEach(o=>{
        ctx.save();ctx.translate(o.x,o.y);
        ctx.fillStyle='#685674';ctx.strokeStyle='#e0bdff';ctx.lineWidth=3;
        ctx.beginPath();
        for(let i=0;i<16;i++){
          const a=i*Math.PI/8,rr=i%2===0?o.r*1.58:o.r;
          const x=Math.cos(a)*rr,y=Math.sin(a)*rr;
          if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
      });

      const cp=raceCheckpoints[raceCheckpointIndex];
      if(cp){
        ctx.strokeStyle='rgba(255,255,125,.8)';ctx.lineWidth=4;
        ctx.beginPath();ctx.arc(cp.x,cp.y,cp.r*.72,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
    }

    if(basketMiniActive){
      ctx.save();
      basketHoops.forEach(hoop=>{
        ctx.strokeStyle='#f7d660';ctx.lineWidth=5;
        ctx.beginPath();ctx.arc(hoop.x,hoop.y,27,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;
        ctx.beginPath();
        for(let x=-16;x<=16;x+=8){
          ctx.moveTo(hoop.x+x,hoop.y+20);
          ctx.lineTo(hoop.x+x*.45,hoop.y+48);
        }
        ctx.stroke();
      });
      ctx.restore();
    }

    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';
    ctx.filter='none';
    ctx.shadowBlur=0;
    ctx.shadowColor='transparent';

    ctx.save();
    player.draw();
    ctx.restore();

    ctx.save();
    enemy.draw();
    ctx.restore();

    // WATER BASKETのボールは背景・キャラクターの後に描画。
    // update側で描くと次のdrawBackgroundで消えるため、必ずここで表示する。
    if(basketMiniActive && basketBall){
      ctx.save();
      ctx.globalAlpha=1;
      ctx.globalCompositeOperation='source-over';

      // 水中でも見失いにくいよう少し大きめ＋白い縁取り
      const br=Math.max(18,basketBall.r||15);

      ctx.fillStyle='#f4a83b';
      ctx.strokeStyle='#fff1c7';
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.arc(basketBall.x,basketBall.y,br,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle='#6d3c18';
      ctx.lineWidth=2.5;
      ctx.beginPath();
      ctx.moveTo(basketBall.x-br,basketBall.y);
      ctx.lineTo(basketBall.x+br,basketBall.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(basketBall.x,basketBall.y,br*.58,-Math.PI/2,Math.PI/2);
      ctx.stroke();

      // 小さなハイライト
      ctx.fillStyle='rgba(255,255,255,.72)';
      ctx.beginPath();
      ctx.arc(basketBall.x-br*.35,basketBall.y-br*.35,br*.18,0,Math.PI*2);
      ctx.fill();

      ctx.restore();
    }

    if(leafMiniActive){
      leafTargets.forEach(leaf=>{
        ctx.save();
        ctx.translate(leaf.x,leaf.y);
        ctx.rotate(leaf.rot);
        ctx.fillStyle='#62b453';
        ctx.strokeStyle='#2d7b37';
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.ellipse(0,0,leaf.r*1.2,leaf.r*.65,-.25,0,Math.PI*2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle='#d9ee91';
        ctx.beginPath();
        ctx.moveTo(-leaf.r*.9,0);
        ctx.lineTo(leaf.r*.9,0);
        ctx.stroke();
        ctx.restore();
      });
    }

    // 同キャラ対戦時は相手側にRIVALマーク
    if(enemy && enemy.sameCharacter && gameMode==='battle'){
      ctx.save();
      ctx.textAlign='center';
      ctx.font='900 13px sans-serif';
      ctx.fillStyle='#fff5a8';
      ctx.strokeStyle='rgba(35,22,10,.7)';
      ctx.lineWidth=4;
      ctx.strokeText('▼ RIVAL ▼',enemy.x,enemy.y-enemy.radius-25);
      ctx.fillText('▼ RIVAL ▼',enemy.x,enemy.y-enemy.radius-25);
      ctx.restore();
    }

    // JUST GUARD ミニゲームの小魚/水生昆虫は、背景とキャラ描画の後に必ず描く。
    if(guardMiniActive){
      guardTargets.forEach(t=>{
        ctx.save();
        ctx.translate(t.x,t.y);

        if(t.kind==='fish'){
          // 小魚
          ctx.fillStyle='#8fd5cf';
          ctx.beginPath();
          ctx.ellipse(0,0,t.r*1.35,t.r*.72,0,0,Math.PI*2);
          ctx.fill();

          ctx.fillStyle='#6cb5b0';
          ctx.beginPath();
          ctx.moveTo(t.r*.95,0);
          ctx.lineTo(t.r*2.15,-t.r*.8);
          ctx.lineTo(t.r*2.15,t.r*.8);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle='#ffffff';
          ctx.beginPath();
          ctx.arc(-t.r*.45,-3,3,0,Math.PI*2);
          ctx.fill();

          ctx.fillStyle='#17282c';
          ctx.beginPath();
          ctx.arc(-t.r*.45,-3,1.5,0,Math.PI*2);
          ctx.fill();
        }else{
          // 水生昆虫
          ctx.fillStyle='#b8d56f';
          ctx.beginPath();
          ctx.ellipse(0,0,t.r*.85,t.r*.52,0,0,Math.PI*2);
          ctx.fill();

          ctx.strokeStyle='#e3f2ad';
          ctx.lineWidth=2.5;
          ctx.beginPath();
          ctx.moveTo(-t.r*.3,-2); ctx.lineTo(-t.r*1.35,-t.r*.9);
          ctx.moveTo(-t.r*.3, 2); ctx.lineTo(-t.r*1.35, t.r*.9);
          ctx.moveTo( t.r*.3,-2); ctx.lineTo( t.r*1.3,-t.r*.9);
          ctx.moveTo( t.r*.3, 2); ctx.lineTo( t.r*1.3, t.r*.9);
          ctx.stroke();
        }

        ctx.restore();
      });
    }

    toxicWaters.forEach(v=>{
      // v6.34:
      // 土煙のようにベルゼブブから紫の毒が一気に広がる。
      // 発動直後 -> 画面がほぼ見えない濃さ -> その後は薄い毒水として残る。
      const age=v.life-v.t;
      const spread=Math.min(1,age/.82);
      const denseIn=Math.min(1,age/.48);
      const denseOut=age<1.45 ? 1 : Math.max(0,1-(age-1.45)/1.05);
      const dense=denseIn*denseOut;
      const linger=Math.max(0,Math.min(1,v.t/1.0));
      const ox=Number.isFinite(v.originX)?v.originX:(v.owner?v.owner.x:innerWidth/2);
      const oy=Number.isFinite(v.originY)?v.originY:(v.owner?v.owner.y:innerHeight/2);
      const maxR=Math.hypot(innerWidth,innerHeight)*1.15;
      const now=performance.now()/1000;

      ctx.save();

      // 中心から外へ膨らむ巨大な紫煙。
      const grad=ctx.createRadialGradient(ox,oy,0,ox,oy,maxR*spread);
      grad.addColorStop(0,`rgba(91,12,119,${0.76*dense + 0.18*linger})`);
      grad.addColorStop(.45,`rgba(119,24,157,${0.72*dense + 0.15*linger})`);
      grad.addColorStop(.82,`rgba(159,41,196,${0.64*dense + 0.10*linger})`);
      grad.addColorStop(1,'rgba(116,18,150,0)');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(ox,oy,maxR*spread,0,Math.PI*2);
      ctx.fill();

      // 土煙感のある塊。発生源から外側へ拡散。
      for(let i=0;i<28;i++){
        const ang=(i*2.3999632297)+(v.seed||0);
        const lane=.18+((i*37)%83)/100;
        const rr=maxR*spread*lane;
        const wobble=Math.sin(now*1.7+i*2.1)*18;
        const x=ox+Math.cos(ang)*rr+wobble;
        const y=oy+Math.sin(ang)*rr*.72+Math.cos(now*1.3+i)*14;
        const rad=38+(i%7)*13+spread*34;
        ctx.globalAlpha=(.08+.22*dense)*Math.min(1,spread*2.4);
        ctx.fillStyle=i%3===0?'#d84cff':(i%3===1?'#71118f':'#9d27bd');
        ctx.beginPath();
        ctx.arc(x,y,rad,0,Math.PI*2);
        ctx.fill();
      }

      // 一度だけ「ほぼ見えない」ピークを作る。
      if(dense>.05){
        ctx.globalAlpha=.78*dense;
        ctx.fillStyle='#4b075f';
        ctx.fillRect(0,0,innerWidth,innerHeight);
        ctx.globalAlpha=.25*dense;
        ctx.fillStyle='#c83ff0';
        ctx.fillRect(0,0,innerWidth,innerHeight);
      }

      // ピーク後は従来より薄い紫の水だけが残る。
      const thin=Math.max(0,Math.min(1,(age-1.6)/.9))*linger;
      if(thin>0){
        ctx.globalAlpha=.15*thin;
        ctx.fillStyle='#7d24a8';
        ctx.fillRect(0,0,innerWidth,innerHeight);
      }
      ctx.restore();
    });

    bossFish.forEach(fish=>{
      ctx.save();
      ctx.translate(fish.x,fish.y);
      // 元の魚絵は左向き（頭が左、尾が右）。
      // 右へ泳ぐ時だけ反転し、常に進行方向へ頭を向ける。
      if(fish.vx>0) ctx.scale(-1,1);
      ctx.fillStyle='#72c75d';
      ctx.beginPath();
      ctx.ellipse(0,0,fish.r*1.25,fish.r*.72,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#e64b38';
      ctx.beginPath();
      ctx.moveTo(fish.r*.7,0);
      ctx.lineTo(fish.r*1.7,-fish.r*.7);
      ctx.lineTo(fish.r*1.7,fish.r*.7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(-fish.r*.45,-2,2.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
    });

    abyssShocks.forEach(w=>{
      const a=Math.max(0,w.t/w.life);
      ctx.save();
      ctx.translate(w.x,w.y);
      // 衝撃波の進行方向に合わせて左右反転。
      // 右向き時は従来の形、左向き時は鏡映し。
      if(w.vx<0) ctx.scale(-1,1);
      ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=.55*a;
      ctx.strokeStyle='#d9ff8a';
      ctx.lineWidth=16;
      ctx.beginPath();
      ctx.arc(0,0,w.r,-1.08,1.08);
      ctx.stroke();
      ctx.globalAlpha=.28*a;
      ctx.strokeStyle='#8fff2c';
      ctx.lineWidth=34;
      ctx.beginPath();
      ctx.arc(0,0,w.r*.84,-1.12,1.12);
      ctx.stroke();
      ctx.restore();
    });

    // ガブリエルさん：その場に残る小型渦
    aquaVortices.forEach(v=>{
      const a=Math.max(0,v.t/v.life);
      ctx.save();
      ctx.translate(v.x,v.y);
      ctx.rotate(v.spin);
      ctx.globalCompositeOperation='lighter';

      for(let i=0;i<3;i++){
        ctx.globalAlpha=(.44-i*.08)*Math.min(1,a*1.8);
        ctx.strokeStyle=i===0?'#e7ffff':(i===1?'#7ee5ff':'#37bee8');
        ctx.lineWidth=6-i*1.2;
        ctx.beginPath();
        ctx.arc(0,0,v.r-i*8,.20*Math.PI,1.78*Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    });

    // ラファエルさん：控えめな三日月型の水圧カッター
    // 描画順だけは修正版のまま。見た目は最初の予定に近くする。
    kawazuGhosts.forEach(q=>{
      const a=Math.max(0,q.t/q.life);
      ctx.save();
      ctx.translate(q.x,q.y);
      ctx.globalAlpha=.28*a;
      ctx.fillStyle='#63d968';
      ctx.beginPath();
      ctx.ellipse(0,4,23,27,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#ff7138';
      ctx.beginPath();
      ctx.arc(-13,-20,10,0,Math.PI*2);
      ctx.arc(13,-20,10,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    kawazuShots.forEach(p=>{
      const a=Math.max(0,p.t/p.life);
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=.72*a;
      ctx.fillStyle='#c8f7ff';
      ctx.beginPath();
      ctx.arc(0,0,p.r,0,Math.PI*2);
      ctx.fill();
      ctx.globalAlpha=.35*a;
      ctx.strokeStyle='#6ee7ff';
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.arc(0,0,p.r+5,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    });

    pressureBlades.forEach(p=>{
      const a=Math.max(0,p.t/p.life);

      ctx.save();
      ctx.translate(p.x,p.y);
      if(p.vx<0) ctx.scale(-1,1);
      ctx.rotate(Math.atan2(p.vy||0,Math.abs(p.vx||1)));

      ctx.globalCompositeOperation='lighter';

      // 薄い水色の三日月
      ctx.globalAlpha=.34*a;
      ctx.strokeStyle='#77e8ff';
      ctx.lineWidth=15;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.arc(0,0,28,-1.05,1.05);
      ctx.stroke();

      // 中心の細い白い水圧線
      ctx.globalAlpha=.62*a;
      ctx.strokeStyle='#d8fbff';
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.arc(0,0,27,-1.03,1.03);
      ctx.stroke();

      // 内側に少しだけ青
      ctx.globalAlpha=.38*a;
      ctx.strokeStyle='#69d9ff';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(-2,0,22,-1.0,1.0);
      ctx.stroke();

      // 後ろに小さな泡を少量
      ctx.globalAlpha=.42*a;
      ctx.fillStyle='#dffcff';

      ctx.beginPath();
      ctx.arc(-26,-9,3,0,Math.PI*2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-35,7,2.5,0,Math.PI*2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-44,-3,2,0,Math.PI*2);
      ctx.fill();

      ctx.restore();
    });

    burstWaves.forEach(b=>{
      const a=Math.max(0,b.t/b.life);
      const progress=1-a;
      const rr=b.radius+(b.max-b.radius)*progress;
      ctx.save();ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=.58*a;ctx.strokeStyle='#ff3447';ctx.lineWidth=8;ctx.beginPath();ctx.arc(b.x,b.y,rr,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=.28*a;ctx.strokeStyle='#ff9a59';ctx.lineWidth=18;ctx.beginPath();ctx.arc(b.x,b.y,rr*.72,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    });

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
      ctx.globalAlpha=(s.mega ? .76 : .42)*a;
      ctx.fillStyle=s.mega ? '#674323' : '#8a6848';
      ctx.beginPath();
      ctx.ellipse(s.x,s.y-4,s.radius*(s.mega?1.75:1.45),s.radius*(s.mega?.82:.58),0,0,Math.PI*2);
      ctx.fill();

      ctx.globalAlpha=(s.mega ? .48 : .22)*a;
      ctx.fillStyle=s.mega ? '#9a6938' : '#b08a62';
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

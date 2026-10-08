const AUDIO_BASE = "/audio";

const episodes = [
  {
    displayNo:"01", id:"08", file:"08.m4a", duration:"22:07",
    module:"覺察與穩定", moduleKey:"self",
    title:"需求雷達｜看懂情緒背後的在乎",
    summary:"生氣、失望、嫉妒或委屈背後，常常還藏著更深一層的在乎。這一集把注意力放到「我到底需要什麼」。",
    context:"學生說不清自己為什麼生氣、委屈，或常覺得別人不懂自己",
    tags:["需求辨識","自我理解","情緒訊號"],
    points:["從情緒往下找正在乎的需要","分辨需要、期待和要求之間的差別","把需求當成理解自己的線索，而不是指責別人的理由"]
  },
  {
    displayNo:"02", id:"07", file:"07 (1).m4a", duration:"22:35",
    module:"覺察與穩定", moduleKey:"self",
    title:"情緒急救箱｜先穩下來，再處理事情",
    summary:"情緒很滿的時候，先回到能處理事情的狀態，往往比立刻講道理更重要。這一集整理不同的穩定方式，也談什麼時候需要外在支持。",
    context:"情緒來得很快、很滿，需要一起找回穩定的方法",
    tags:["情緒穩定","身體訊號","求助"],
    points:["先處理情緒強度，再處理事件內容","不同穩定方法適合不同的人與情境","辨認已經需要找人陪伴或協助的時刻"]
  },
  {
    displayNo:"03", id:"01", file:"01.m4a", duration:"18:52",
    module:"覺察與穩定", moduleKey:"self",
    title:"五道安檢｜在理智線斷掉以前",
    summary:"情緒衝上來之前，身體、念頭和行動通常會先留下線索。這一集把「快要爆掉」拆成幾個可以辨認的訊號。",
    context:"衝突前常來不及踩煞車，想練習看見自己的預警訊號",
    tags:["情緒警訊","暫停","衝動管理"],
    points:["看見情緒升高前的身體與思緒訊號","理解暫停不是壓抑，而是替自己保留選擇","把「反應」和「行動」分開來看"]
  },
  {
    displayNo:"04", id:"03", file:"03.m4a", duration:"22:29",
    module:"專注與啟動", moduleKey:"calm",
    title:"學習卡關｜不是不會，是還沒找到卡點",
    summary:"卡住、做錯、聽不懂，不必立刻等同於「我不行」。這一集從學習挫折出發，整理錯誤、練習與策略調整在學習中的角色。",
    context:"一遇到不會就想放棄，或把一次失敗當成「我就是不行」",
    tags:["學習挫折","找到卡點","重新開始"],
    points:["把錯誤視為了解學習狀態的資訊","區分一次表現與能力判斷","把大卡關拆成下一個可嘗試的小步驟"]
  },
  {
    displayNo:"05", id:"02", file:"02.m4a", duration:"20:12",
    module:"專注與啟動", moduleKey:"calm",
    title:"內耗重開機｜讓腦袋停止反覆打轉",
    summary:"反覆想、一直擔心、越想越累，是很多孩子熟悉的狀態。這一集談「正在思考」和「被思緒困住」有什麼不同。",
    context:"事情過了還一直想、反覆擔心，腦袋很難停下來",
    tags:["內耗","反芻","注意力"],
    points:["分辨解決問題和反覆打轉的差別","看見思緒、情緒與疲累如何互相影響","把注意力重新帶回當下可處理的部分"]
  },
  {
    displayNo:"06", id:"09", file:"09.m4a", duration:"18:48",
    module:"專注與啟動", moduleKey:"calm",
    title:"大腦導航｜卡住時，重新找下一步",
    summary:"迷路不代表走不下去。這一集把卡住的狀態重新畫成「現在在哪裡、有哪些路、下一步是什麼」，讓混亂慢慢有方向。",
    context:"選項很多卻不知道下一步，或想一次找到完美答案",
    tags:["重新導航","選擇","下一步"],
    points:["先看清楚現在的位置與真正的問題","接受路線可以在過程中重新規劃","把模糊的大問題換成下一個可決定的小問題"]
  },
  {
    displayNo:"07", id:"04", file:"04.m4a", duration:"17:32",
    module:"思考與選擇", moduleKey:"think",
    title:"事情放大鏡｜分清事實、想法和情緒",
    summary:"感受可以很大，同時也可以把事情本身看清楚。這一集把「真的發生了什麼」和「我怎麼解讀它」分開來談。",
    context:"容易把猜測當成事實，或一件小事越想越嚴重",
    tags:["事實與解讀","證據","替代解釋"],
    points:["區分可以確認的事實與腦中的推測","留意讀心、災難化等常見思考偏差","替同一件事找出不只一種可能解釋"]
  },
  {
    displayNo:"08", id:"06", file:"06.m4a", duration:"11:50",
    module:"思考與選擇", moduleKey:"think",
    title:"控制圈｜把力氣放回能改變的事",
    summary:"有些事能直接改變，有些只能影響，有些真的不在掌握中。這一集把混在一起的焦慮重新分類。",
    context:"很多心力放在別人的反應、結果，或自己無法改變的事情上",
    tags:["控制圈","焦慮","行動選擇"],
    points:["分辨可控制、可影響與無法控制的部分","看見力氣花在哪裡最有作用","把焦點放回此刻仍能採取的行動"]
  },
  {
    displayNo:"09", id:"12", file:"12.m4a", duration:"17:12",
    module:"思考與選擇", moduleKey:"think",
    title:"THINK 安檢門｜訊息送出前，再看一次",
    summary:"文字訊息很快，情緒也很快。這一集把按下傳送前的一瞬間拉長一點，重新看看這句話是不是值得現在送出去。",
    context:"群組或訊息裡很想立刻回應，需要多一點時間判斷要不要送出",
    tags:["THINK","數位溝通","衝動訊息"],
    points:["分辨「很想立刻回」和「真的值得送出」","用 THINK 重新檢視訊息的真實、必要與合適程度","理解文字缺少語氣與表情，更容易讓雙方自行補上意思"]
  },
  {
    displayNo:"10", id:"10", file:"10.m4a", duration:"13:54",
    module:"溝通與關係", moduleKey:"connect",
    title:"話語遙控器｜換個說法，關係就不同",
    summary:"一句話的意思，不只藏在字裡，也藏在語氣、音量、表情、時機和場合裡。這一集從面對面溝通談到訊息互動。",
    context:"有話想說，卻常因語氣、時機或說法，讓彼此更難理解",
    tags:["語氣","重新表達","溝通時機"],
    points:["同一句話換一種語氣與時機，效果可能完全不同","面對面與文字訊息各自缺少或增加不同線索","說錯話之後，仍然有重新說、補充與修正的空間"]
  },
  {
    displayNo:"11", id:"05", file:"05.m4a", duration:"19:27",
    module:"溝通與關係", moduleKey:"connect",
    title:"衝突翻譯機｜把地雷話翻成能聽懂的話",
    summary:"很多衝突表面上是在吵一句話，底下其實藏著感受、需要和期待。這一集把刺人的話重新翻譯成比較容易被理解的訊息。",
    context:"爭執時只剩指責和反擊，很難說出真正介意的是什麼",
    tags:["衝突","感受與需要","表達"],
    points:["從指責裡辨認真正卡住的地方","把「你都怎樣」換成較清楚的感受與需要","理解立場不同不等於誰一定是壞人"]
  },
  {
    displayNo:"12", id:"11", file:"11.m4a", duration:"20:38",
    module:"溝通與關係", moduleKey:"connect",
    title:"友誼修復站｜吵架之後，怎麼重新靠近",
    summary:"關係有刮痕，可以慢慢修；但修復也不一定代表回到原來。這一集談道歉、補救、信任、界線與重新靠近之間的距離。",
    context:"吵架後想修復關係，卻不知道怎麼道歉、靠近或重新建立信任",
    tags:["友誼修復","道歉","信任與界線"],
    points:["理解道歉和被原諒不是同一件事","信任通常靠後續一致的行動慢慢重建","有些關係修好後，也可能形成新的距離"]
  }
];

const moduleOrder = ["全部","覺察與穩定","專注與啟動","思考與選擇","溝通與關係"];
const grid = document.querySelector("#episode-grid");
const filters = document.querySelector("#filters");
const player = document.querySelector("#audio-player");
const playerTitle = document.querySelector("#player-title");
const playerDesc = document.querySelector("#player-desc");
const playerStatus = document.querySelector("#player-status");
const playerNumber = document.querySelector("#player-number");
const mainPlay = document.querySelector("#main-play");
const quickPlay = document.querySelector("#quick-play");
let activeModule = "全部";
let activeEpisode = episodes[0].id;

function renderFilters(){
  filters.innerHTML = moduleOrder.map(name => `<button class="filter-btn ${name===activeModule?"active":""}" data-filter="${name}">${name}</button>`).join("");
  filters.querySelectorAll("button").forEach(btn => btn.addEventListener("click",()=>{
    activeModule = btn.dataset.filter;
    renderFilters();
    renderEpisodes();
  }));
}

function renderEpisodes(){
  const list = activeModule === "全部" ? episodes : episodes.filter(ep => ep.module === activeModule);
  grid.innerHTML = list.map(ep => `
    <article class="episode-card module-${ep.moduleKey} ${activeEpisode===ep.id?"active-card":""}">
      <div class="card-top"><span class="ep-no">EP ${ep.displayNo}</span><span class="duration">${ep.duration}</span></div>
      <div class="module">${ep.module}</div>
      <h3>${ep.title}</h3>
      <p class="summary">${ep.summary}</p>
      <div class="context"><b>可以一起聊</b><span>${ep.context}</span></div>
      <div class="tags">${ep.tags.map(tag=>`<span class="tag">${tag}</span>`).join("")}</div>
      <div class="episode-points"><div class="points-title">本集會談到</div><ul class="points">${ep.points.map(point=>`<li>${point}</li>`).join("")}</ul></div>
      <div class="play-row"><span class="play-hint">${ep.duration}</span><button class="play-btn" data-play="${ep.id}"><span>▶</span> 播放本集</button></div>
    </article>
  `).join("");
  grid.querySelectorAll("[data-play]").forEach(btn => btn.addEventListener("click",()=>selectEpisode(btn.dataset.play, true, true)));
}

function currentEpisode(){
  return episodes.find(item => item.id === activeEpisode) || episodes[0];
}

function updatePlayButton(){
  const ep = currentEpisode();
  const playing = !player.paused && !player.ended;
  quickPlay.textContent = playing ? "❚❚ 暫停" : `▶ 播放第 ${ep.displayNo} 集`;
  quickPlay.classList.toggle("is-playing", playing);
  mainPlay.setAttribute("aria-label", playing ? "暫停目前集數" : `播放第 ${ep.displayNo} 集`);
}

function togglePlay(){
  if(player.paused || player.ended){
    player.play().catch(()=>{});
  } else {
    player.pause();
  }
}

function selectEpisode(id, autoplay = false, shouldScroll = true){
  const ep = episodes.find(item => item.id === id);
  if(!ep) return;
  activeEpisode = id;
  playerNumber.textContent = ep.displayNo;
  playerTitle.textContent = `EP ${ep.displayNo}｜${ep.title}`;
  playerDesc.textContent = ep.summary;
  playerStatus.textContent = "正在載入…";
  player.src = `${AUDIO_BASE}/${encodeURIComponent(ep.file)}`;
  player.load();
  renderEpisodes();
  updatePlayButton();
  if(shouldScroll){
    document.querySelector("#player-panel")?.scrollIntoView({behavior:"smooth",block:"center"});
  }
  if(autoplay) player.play().catch(()=>{});
}

mainPlay?.addEventListener("click", togglePlay);
quickPlay?.addEventListener("click", togglePlay);
player.addEventListener("playing",()=>{playerStatus.textContent="";updatePlayButton();});
player.addEventListener("pause",updatePlayButton);
player.addEventListener("ended",updatePlayButton);
player.addEventListener("loadedmetadata",()=>{playerStatus.textContent="";});
player.addEventListener("error",()=>{playerStatus.textContent=`音檔載入失敗（錯誤 ${player.error?.code || "?"}）`;updatePlayButton();});

renderFilters();
renderEpisodes();
selectEpisode(episodes[0].id, false, false);

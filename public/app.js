const AUDIO_BASE = "/audio";

const episodes = [
  {
    id:"01", file:"01.m4a", duration:"18:52", module:"先讓自己穩下來", moduleKey:"calm",
    title:"理智線斷裂前的五道安檢",
    summary:"情緒衝上來之前，身體、念頭和行動通常會先留下線索。這一集把『快要爆掉』拆成幾個可以辨認的訊號。",
    context:"情緒快失控、衝突升高、學生常說『我就是忍不住』時",
    tags:["情緒警訊","暫停","衝動管理"],
    points:["看見情緒升高前的身體與思緒訊號","理解暫停不是壓抑，而是替自己保留選擇","把『反應』和『行動』分開來看"]
  },
  {
    id:"02", file:"02.m4a", duration:"20:12", module:"看懂自己", moduleKey:"self",
    title:"大腦內耗重開機",
    summary:"反覆想、一直擔心、越想越累，是很多孩子熟悉的狀態。這一集談『正在思考』和『被思緒困住』有什麼不同。",
    context:"想很多停不下來、一直後悔、睡前反覆想同一件事時",
    tags:["內耗","反芻","注意力"],
    points:["分辨解決問題和反覆打轉的差別","看見思緒、情緒與疲累如何互相影響","把注意力重新帶回當下可處理的部分"]
  },
  {
    id:"03", file:"03.m4a", duration:"22:29", module:"想清楚，再決定", moduleKey:"think",
    title:"學習卡關，是大腦在長肌肉",
    summary:"卡住、做錯、聽不懂，不必立刻等同於『我不行』。這一集從學習挫折出發，整理錯誤、練習與策略調整在學習中的角色。",
    context:"考不好、學不會、很快想放棄，或開始替自己貼能力標籤時",
    tags:["學習挫折","成長心態","策略調整"],
    points:["把錯誤視為了解學習狀態的資訊","區分一次表現與能力判斷","把大卡關拆成下一個可嘗試的小步驟"]
  },
  {
    id:"04", file:"04.m4a", duration:"17:32", module:"想清楚，再決定", moduleKey:"think",
    title:"事情放大鏡",
    summary:"感受可以很大，同時也可以把事情本身看清楚。這一集把『真的發生了什麼』和『我怎麼解讀它』分開來談。",
    context:"覺得別人在針對自己、事情越想越嚴重、容易先下結論時",
    tags:["事實與解讀","證據","替代解釋"],
    points:["區分可以確認的事實與腦中的推測","留意讀心、災難化等常見思考偏差","替同一件事找出不只一種可能解釋"]
  },
  {
    id:"05", file:"05.m4a", duration:"19:27", module:"理解別人，也說出自己", moduleKey:"connect",
    title:"衝突翻譯機｜破解溝通地雷",
    summary:"很多衝突表面上是在吵一句話，底下其實藏著感受、需要和期待。這一集把刺人的話重新翻譯成比較容易被理解的訊息。",
    context:"朋友吵架、互相嗆聲、越解釋越生氣，或總覺得對方故意時",
    tags:["衝突","感受與需要","表達"],
    points:["從指責裡辨認真正卡住的地方","把『你都怎樣』換成較清楚的感受與需要","理解立場不同不等於誰一定是壞人"]
  },
  {
    id:"06", file:"06.m4a", duration:"11:50", module:"想清楚，再決定", moduleKey:"think",
    title:"控制圈｜把力氣放回能改變的地方",
    summary:"有些事能直接改變，有些只能影響，有些真的不在掌握中。這一集把混在一起的焦慮重新分類。",
    context:"擔心別人怎麼想、反覆焦慮結果、把力氣耗在無法改變的事時",
    tags:["控制圈","焦慮","行動選擇"],
    points:["分辨可控制、可影響與無法控制的部分","看見力氣花在哪裡最有作用","把焦點放回此刻仍能採取的行動"]
  },
  {
    id:"07", file:"07 (1).m4a", duration:"22:35", module:"先讓自己穩下來", moduleKey:"calm",
    title:"情緒急救箱",
    summary:"情緒很滿的時候，先回到能處理事情的狀態，往往比立刻講道理更重要。這一集整理不同的穩定方式，也談什麼時候需要外在支持。",
    context:"哭不停、很生氣、很慌、腦袋一片空白，暫時談不下去時",
    tags:["情緒穩定","身體訊號","求助"],
    points:["先處理情緒強度，再處理事件內容","不同穩定方法適合不同的人與情境","辨認已經需要找人陪伴或協助的時刻"]
  },
  {
    id:"08", file:"08.m4a", duration:"22:07", module:"看懂自己", moduleKey:"self",
    title:"我的需求雷達",
    summary:"生氣、失望、嫉妒或委屈背後，常常還藏著更深一層的在乎。這一集把注意力放到『我到底需要什麼』。",
    context:"常常悶著、生氣卻說不出原因、覺得沒人懂自己時",
    tags:["需求辨識","自我理解","情緒訊號"],
    points:["從情緒往下找正在乎的需要","分辨需要、期待和要求之間的差別","把需求當成理解自己的線索，而不是指責別人的理由"]
  },
  {
    id:"09", file:"09.m4a", duration:"18:48", module:"先讓自己穩下來", moduleKey:"calm",
    title:"大腦導航",
    summary:"迷路不代表走不下去。這一集把卡住的狀態重新畫成『現在在哪裡、有哪些路、下一步是什麼』，讓混亂慢慢有方向。",
    context:"不知道怎麼辦、選項很多、腦中很亂，或一直想一次找到完美答案時",
    tags:["重新導航","選擇","下一步"],
    points:["先看清楚現在的位置與真正的問題","接受路線可以在過程中重新規劃","把模糊的大問題換成下一個可決定的小問題"]
  },
  {
    id:"10", file:"10.m4a", duration:"13:54", module:"理解別人，也說出自己", moduleKey:"connect",
    title:"話語遙控器",
    summary:"一句話的意思，不只藏在字裡，也藏在語氣、音量、表情、時機和場合裡。這一集從面對面溝通談到訊息互動，整理『想表達』和『只想刺一下』之間的差別。",
    context:"口氣太衝、講完後悔、訊息被誤會，或明明想說好卻越說越糟時",
    tags:["語氣","重新表達","溝通時機"],
    points:["同一句話換一種語氣與時機，效果可能完全不同","面對面與文字訊息各自缺少或增加不同線索","說錯話之後，仍然有重新說、補充與修正的空間"]
  },
  {
    id:"11", file:"11.m4a", duration:"20:38", module:"理解別人，也說出自己", moduleKey:"connect",
    title:"友誼壞了，該怎麼修？",
    summary:"關係有刮痕，可以慢慢修；但修復也不一定代表回到原來。這一集談道歉、補救、信任、界線與重新靠近之間的距離。",
    context:"吵架後不知道怎麼開口、道歉沒被接受、友誼變得尷尬時",
    tags:["友誼修復","道歉","信任與界線"],
    points:["理解道歉和被原諒不是同一件事","信任通常靠後續一致的行動慢慢重建","有些關係修好後，也可能形成新的距離"]
  },
  {
    id:"12", file:"12.m4a", duration:"17:12", module:"理解別人，也說出自己", moduleKey:"connect",
    title:"怒傳訊息前的 THINK 安檢門",
    summary:"文字訊息很快，情緒也很快。這一集把按下傳送前的一瞬間拉長一點，重新看看這句話是不是值得現在送出去。",
    context:"群組吵架、想立刻回嗆、深夜情緒訊息，或怕文字越講越失控時",
    tags:["THINK","數位溝通","衝動訊息"],
    points:["分辨『很想立刻回』和『真的值得送出』","用 THINK 重新檢視訊息的真實、必要與合適程度","理解文字缺少語氣與表情，更容易讓雙方自行補上意思"]
  }
];

const moduleOrder = ["全部","看懂自己","先讓自己穩下來","想清楚，再決定","理解別人，也說出自己"];
const grid = document.querySelector("#episode-grid");
const filters = document.querySelector("#filters");
const player = document.querySelector("#audio-player");
const playerTitle = document.querySelector("#player-title");
const playerDesc = document.querySelector("#player-desc");
const playerStatus = document.querySelector("#player-status");
const playerNumber = document.querySelector("#player-number");
let activeModule = "全部";
let activeEpisode = "01";

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
      <div class="card-top"><span class="ep-no">EP ${ep.id}</span><span class="duration">${ep.duration}</span></div>
      <div class="module">${ep.module}</div>
      <h3>${ep.title}</h3>
      <p class="summary">${ep.summary}</p>
      <div class="context"><b>適合在</b>｜${ep.context}</div>
      <div class="tags">${ep.tags.map(tag=>`<span class="tag">${tag}</span>`).join("")}</div>
      <details>
        <summary>本集會談到</summary>
        <ul class="points">${ep.points.map(point=>`<li>${point}</li>`).join("")}</ul>
      </details>
      <div class="play-row"><span class="play-hint">${ep.duration}</span><button class="play-btn" data-play="${ep.id}"><span>▶</span> 播放本集</button></div>
    </article>
  `).join("");
  grid.querySelectorAll("[data-play]").forEach(btn => btn.addEventListener("click",()=>selectEpisode(btn.dataset.play, true)));
}

function selectEpisode(id, autoplay = false){
  const ep = episodes.find(item => item.id === id);
  if(!ep) return;
  activeEpisode = id;
  playerNumber.textContent = ep.id;
  playerTitle.textContent = `EP ${ep.id}｜${ep.title}`;
  playerDesc.textContent = ep.summary;
  playerStatus.textContent = "";
  const nextSrc = `${AUDIO_BASE}/${encodeURIComponent(ep.file)}`;
  if(player.getAttribute("src") !== nextSrc){
    player.src = nextSrc;
    player.load();
  }
  renderEpisodes();
  if(autoplay){
    document.querySelector("#player-panel").scrollIntoView({behavior:"smooth",block:"center"});
    player.play().catch(()=>{
      playerStatus.textContent = "可直接按播放器左側的播放鍵開始收聽。";
    });
  }
}

player.addEventListener("loadedmetadata",()=>{
  playerStatus.textContent = "已載入，可以播放。";
});
player.addEventListener("canplay",()=>{
  playerStatus.textContent = "";
});
player.addEventListener("error",()=>{
  const code = player.error?.code || "unknown";
  playerStatus.textContent = `音訊載入失敗（${code}）。`;
});
player.addEventListener("playing",()=>{
  playerStatus.textContent = "";
});

renderFilters();
renderEpisodes();
selectEpisode("01", false);

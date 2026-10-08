const AUDIO_BASE = "/audio";

const episodes = [
  {
    id:"01", duration:"18:52", module:"覺察與穩定",
    title:"理智線斷裂前的五道安檢",
    summary:"情緒快要衝過頭時，身體、想法與行動通常會先出現訊號。這一集把『爆掉之前』拆開來看，讓學生理解暫停不是壓抑，而是替自己保留選擇。",
    tags:["情緒警訊","暫停","衝動管理"],
    points:["辨認情緒升高前的身體與思緒訊號","把反應和行動之間留出一點空間","理解冷靜不是把情緒消失，而是回到可選擇的狀態"]
  },
  {
    id:"02", duration:"20:12", module:"覺察與穩定",
    title:"大腦內耗重開機",
    summary:"反覆想、一直擔心、越想越累，是很多孩子熟悉的狀態。這一集整理『想事情』和『被思緒困住』的差別，也談怎麼讓注意力慢慢離開迴圈。",
    tags:["內耗","反芻","注意力轉換"],
    points:["分辨解決問題與反覆打轉的不同","看見思緒、情緒和身體疲累如何互相影響","把注意力重新放回當下能處理的部分"]
  },
  {
    id:"03", duration:"22:29", module:"專注與啟動",
    title:"學習卡關，不等於學不會",
    summary:"卡住、做錯、聽不懂，不一定代表能力不夠。這一集從學習挫折出發，談怎麼把『我不會』重新看成『我還在找方法』。",
    tags:["學習挫折","成長心態","重新開始"],
    points:["把錯誤當成理解學習狀態的資訊","分辨能力判斷與一次表現之間的差距","把大卡關拆成下一個可嘗試的小步驟"]
  },
  {
    id:"04", duration:"17:32", module:"思考與選擇",
    title:"事情放大鏡",
    summary:"感受可以很大，同時也可以把事情本身看清楚。這一集練習分開『真的發生了什麼』和『我怎麼解讀它』，讓判斷多一點空間。",
    tags:["事實與解讀","證據","替代解釋"],
    points:["區分可確認的事實和腦中推測","留意讀心、災難化等常見思考偏差","找出不只一種可能的解釋"]
  },
  {
    id:"05", duration:"19:27", module:"溝通與關係",
    title:"衝突翻譯機：破解溝通地雷",
    summary:"很多衝突表面上是在吵一句話，底下其實藏著感受、需要和期待。這一集把攻擊性的話重新翻譯成比較能被理解的訊息。",
    tags:["衝突","感受與需要","溝通"],
    points:["從指責裡辨認真正卡住的地方","把『你都怎樣』換成較清楚的感受與需求","理解彼此立場不同，不等於誰一定是壞人"]
  },
  {
    id:"06", duration:"11:50", module:"思考與選擇",
    title:"控制圈：把力氣放回能改變的地方",
    summary:"有些事情能改、有些只能影響、有些真的不在掌握中。這一集把混在一起的焦慮重新分類，讓力氣回到現在還能做的地方。",
    tags:["控制圈","焦慮","行動選擇"],
    points:["分辨可控制、可影響與無法控制的部分","減少把力氣耗在無法改變的事情上","找到此刻還能採取的一個行動"]
  },
  {
    id:"07", duration:"22:35", module:"覺察與穩定",
    title:"情緒急救箱",
    summary:"情緒很滿的時候，先把自己帶回可以處理事情的狀態，比立刻講道理更重要。這一集整理幾種常見的穩定方式，也談什麼時候需要找人幫忙。",
    tags:["情緒穩定","身體訊號","求助"],
    points:["先處理情緒強度，再處理事件內容","理解不同穩定方法適合不同的人","辨認自己已經需要外在支持的時刻"]
  },
  {
    id:"08", duration:"22:07", module:"覺察與穩定",
    title:"我的需求雷達",
    summary:"生氣、失望、嫉妒或委屈背後，常常不只是一種情緒。這一集把注意力放到『我到底在乎什麼』，讓感受變成更清楚的訊息。",
    tags:["需求辨識","自我理解","情緒訊號"],
    points:["從情緒往下找正在乎的需要","分辨需要、期待和要求之間的不同","讓需求成為理解自己的線索，而不是指責別人的理由"]
  },
  {
    id:"09", duration:"18:48", module:"思考與選擇",
    title:"大腦導航",
    summary:"走偏了，可以重新規劃；重點不是一次就選對，而是看得見下一條路。這一集把迷惘拆成方向、選項與下一步。",
    tags:["選擇","重新規劃","下一步"],
    points:["看清楚現在的位置和真正想去的方向","接受路線可以在過程中調整","把模糊的大問題換成下一個可決定的小問題"]
  },
  {
    id:"10", duration:"13:54", module:"溝通與關係",
    title:"話語遙控器",
    summary:"話還沒說出去以前可以暫停，說出去了也可以重新說。這一集談的是語氣、時機與修正，讓一句話不必決定整段關係。",
    tags:["表達","暫停","重新說"],
    points:["在開口前多看一眼自己的情緒狀態","同一句意思可以有不同的說法與效果","說錯話後仍然有重新表達和修復的空間"]
  },
  {
    id:"11", duration:"20:38", module:"溝通與關係",
    title:"友誼壞了，該怎麼修？",
    summary:"關係有刮痕，可以慢慢修；但修復也不一定代表回到原來。這一集談道歉、信任、界線與重新靠近之間的距離。",
    tags:["友誼修復","道歉","界線"],
    points:["理解道歉和被原諒不是同一件事","信任通常靠後續一致的行動慢慢重建","有些關係修好後，也可能形成新的距離"]
  },
  {
    id:"12", duration:"17:12", module:"溝通與關係",
    title:"怒傳訊息前的 THINK 安檢門",
    summary:"文字訊息很快，情緒也很快。這一集把傳送前的一瞬間拉長一點，重新看見真實、必要、合適，以及這句話可能帶來的關係成本。",
    tags:["THINK","數位溝通","衝動訊息"],
    points:["分辨『很想立刻回』和『真的值得送出』","用 THINK 檢核重新看一次訊息內容","理解文字缺少語氣與表情，更容易產生誤解"]
  }
];

const moduleOrder = ["全部","覺察與穩定","專注與啟動","思考與選擇","溝通與關係"];
const grid = document.querySelector("#episode-grid");
const filters = document.querySelector("#filters");
const player = document.querySelector("#audio-player");
const playerTitle = document.querySelector("#player-title");
const playerDesc = document.querySelector("#player-desc");
const playerStatus = document.querySelector("#player-status");
let activeModule = "全部";

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
    <article class="episode-card">
      <div class="card-top"><span class="ep-no">EP ${ep.id}</span><span class="duration">${ep.duration}</span></div>
      <div class="module">${ep.module}</div>
      <h3>${ep.title}</h3>
      <p class="summary">${ep.summary}</p>
      <div class="tags">${ep.tags.map(tag=>`<span class="tag">${tag}</span>`).join("")}</div>
      <details>
        <summary>本集重點</summary>
        <ul class="points">${ep.points.map(point=>`<li>${point}</li>`).join("")}</ul>
      </details>
      <div class="play-row"><button class="play-btn" data-play="${ep.id}"><span>▶</span> 播放本集</button></div>
    </article>
  `).join("");
  grid.querySelectorAll("[data-play]").forEach(btn => btn.addEventListener("click",()=>playEpisode(btn.dataset.play)));
}

function playEpisode(id){
  const ep = episodes.find(item => item.id === id);
  if(!ep) return;
  playerTitle.textContent = `EP ${ep.id}｜${ep.title}`;
  playerDesc.textContent = ep.summary;
  playerStatus.textContent = "";
  player.src = `${AUDIO_BASE}/${ep.id}.mp3`;
  document.querySelector("#player-panel").scrollIntoView({behavior:"smooth",block:"center"});
  player.play().catch(()=>{});
}

player.addEventListener("error",()=>{
  playerStatus.textContent = "這一集的聲音檔準備中。";
});
player.addEventListener("playing",()=>{
  playerStatus.textContent = "";
});

renderFilters();
renderEpisodes();

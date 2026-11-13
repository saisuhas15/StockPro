const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n||0));
let stocks=[],history=new Map(),session=new Map(),selectedSymbol=null,timeframe="1m",dashboardChart=null,candleChart=null,candleSeries=null,trade=null,refreshing=false;

async function api(url,options={}) {
  const response=await fetch(url,options);
  const raw=await response.text();
  let data={}; try{data=raw?JSON.parse(raw):{};}catch{data={message:raw};}
  if(!response.ok) throw new Error(data.message||`HTTP ${response.status}`);
  return data;
}
function toast(message,error=false){$("toast").textContent=message;$("toast").classList.toggle("error",error);$("toast").classList.remove("hidden");clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("toast").classList.add("hidden"),3000);}
function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function safeJs(s){return String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");}
function page(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  $(`${name}-page`).classList.remove("hidden");
  document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  const titles={dashboard:["Trading Dashboard","Your simulated trading workspace."],market:["Stock Market","Search stocks and open detailed analysis."],portfolio:["My Portfolio","Your holdings and unrealized returns."],transactions:["Transactions","Your simulated order history."],details:["Stock Details","Candles, indicators and trading signal."]};
  $("page-title").textContent=titles[name][0];$("page-subtitle").textContent=titles[name][1];
  if(name==="market")renderMarket();if(name==="portfolio")loadPortfolio();if(name==="transactions")loadTransactions();
}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
$("back-market").addEventListener("click",()=>page("market"));

function updateHistory(list){
  list.forEach(s=>{
    if(!history.has(s.symbol))history.set(s.symbol,[]);
    if(!session.has(s.symbol))session.set(s.symbol,{open:s.price,high:s.price,low:s.price});
    const stat=session.get(s.symbol);stat.high=Math.max(stat.high,s.price);stat.low=Math.min(stat.low,s.price);
    history.get(s.symbol).push({time:Date.now(),price:Number(s.price),volume:Math.floor(Math.random()*9000)+1000});
    if(history.get(s.symbol).length>600)history.get(s.symbol).shift();
    s.changePercent=stat.open?((s.price-stat.open)/stat.open)*100:0;
    s.sessionHigh=stat.high;s.sessionLow=stat.low;
  });
  stocks=list;
}
function updateStats(d){
  $("wallet").textContent=money(d.walletBalance);$("investment").textContent=money(d.totalInvestment);$("portfolio-value").textContent=money(d.portfolioValue);
  $("profit-loss").textContent=money(d.profitLoss);$("profit-loss").style.color=d.profitLoss>=0?"var(--green)":"var(--red)";
}
function renderWatchlist(){
  const up=stocks.filter(s=>s.changePercent>0).length,down=stocks.filter(s=>s.changePercent<0).length;
  $("rising").textContent=up;$("falling").textContent=down;$("trend").textContent=up>down?"BULLISH":down>up?"BEARISH":"SIDEWAYS";
  $("trend").style.color=up>down?"var(--green)":down>up?"var(--red)":"var(--yellow)";
  $("last-update").textContent="Updated "+new Date().toLocaleTimeString();
  $("watchlist").innerHTML=stocks.map(s=>`<tr><td>${safe(s.companyName)}</td><td><b>${safe(s.symbol)}</b></td><td>${money(s.price)}</td><td class="${s.changePercent>=0?"up":"down"}">${s.changePercent>=0?"+":""}${s.changePercent.toFixed(2)}%</td><td><button class="secondary" onclick="openDetails('${safeJs(s.symbol)}')">Details</button></td></tr>`).join("");
}
function drawDashboardChart(){
  const symbol=$("dashboard-symbol").value||stocks[0]?.symbol;if(!symbol)return;
  const container=$("dashboard-chart");const data=(history.get(symbol)||[]).map(p=>({time:Math.floor(p.time/1000),value:p.price}));
  if(!window.LightweightCharts)return;
  if(!dashboardChart){
    dashboardChart=LightweightCharts.createChart(container,{width:container.clientWidth,height:container.clientHeight,layout:{background:{color:"#14243b"},textColor:"#9db2d1"},grid:{vertLines:{color:"#ffffff0b"},horzLines:{color:"#ffffff0b"}},timeScale:{timeVisible:true,secondsVisible:true},rightPriceScale:{borderColor:"#2b405d"}});
    dashboardChart._stockproSeries=dashboardChart.addAreaSeries({lineColor:"#28b9ff",topColor:"rgba(40,185,255,.3)",bottomColor:"rgba(40,185,255,.02)"});
  }
  const series=dashboardChart._stockproSeries;
  const clean=data.filter((v,i)=>i===0||v.time>data[i-1].time);
  if(clean.length)series.setData(clean);
}
function fillDashboardSelect(){
  const old=$("dashboard-symbol").value;
  $("dashboard-symbol").innerHTML=stocks.map(s=>`<option value="${safe(s.symbol)}">${safe(s.symbol)}</option>`).join("");
  if(stocks.some(s=>s.symbol===old))$("dashboard-symbol").value=old;
}
$("dashboard-symbol").addEventListener("change",drawDashboardChart);

function renderMarket(){
  const q=($("search").value||"").toLowerCase();
  $("stock-cards").innerHTML=stocks.filter(s=>s.companyName.toLowerCase().includes(q)||s.symbol.toLowerCase().includes(q)).map(s=>`
    <div class="stock-card">
      <div class="stock-card-top"><div><b>${safe(s.companyName)}</b><div class="muted">${safe(s.symbol)}</div></div><strong>${money(s.price)}</strong></div>
      <div class="${s.changePercent>=0?"up":"down"}">${s.changePercent>=0?"+":""}${s.changePercent.toFixed(2)}% today (simulated)</div>
      <div class="actions"><button class="secondary" onclick="openDetails('${safeJs(s.symbol)}')">View Details</button><button class="buy" onclick="openTrade('${safeJs(s.symbol)}','BUY')">Buy</button></div>
    </div>`).join("");
}
$("search").addEventListener("input",renderMarket);

function ema(values,period){if(values.length<period)return[];const k=2/(period+1);let v=values.slice(0,period).reduce((a,b)=>a+b,0)/period;const out=[v];for(let i=period;i<values.length;i++){v=(values[i]-v)*k+v;out.push(v);}return out;}
function rsi(p,period=14){if(p.length<=period)return null;let gains=0,losses=0;for(let i=p.length-period;i<p.length;i++){let d=p[i]-p[i-1];if(d>0)gains+=d;else losses-=d;}if(!gains&&!losses)return 50;if(!losses)return 100;if(!gains)return 0;let rs=(gains/period)/(losses/period);return 100-100/(1+rs);}
function macd(p){if(p.length<34)return null;const a=ema(p,12),b=ema(p,26),line=[];for(let i=0;i<b.length;i++)line.push(a[i+14]-b[i]);const sig=ema(line,9);if(!sig.length)return null;return{value:line.at(-1),signal:sig.at(-1),hist:line.at(-1)-sig.at(-1)};}
function sma(p,n=20){if(p.length<n)return null;return p.slice(-n).reduce((a,b)=>a+b,0)/n;}
function indicator(id,note,value,description,color){$(id).textContent=value;$(note).textContent=description;$(note).style.color=color;}
function updateIndicators(symbol){
  const points=history.get(symbol)||[],prices=points.map(p=>p.price),current=prices.at(-1),R=rsi(prices),M=macd(prices),S=sma(prices);
  let B=null,V=null;
  if(R===null)indicator("rsi","rsi-note","Collecting…","Need 15 observations","var(--muted)");
  else indicator("rsi","rsi-note",R.toFixed(2),R>=70?"Potentially overbought":R<=30?"Potentially oversold":"Neutral momentum",R>=70?"var(--red)":R<=30?"var(--green)":"var(--yellow)");
  if(!M)indicator("macd","macd-note","Collecting…","Need 34 observations","var(--muted)");
  else indicator("macd","macd-note",M.value.toFixed(4),`${M.hist>=0?"Positive":"Negative"} momentum · Signal ${M.signal.toFixed(4)}`,M.hist>=0?"var(--green)":"var(--red)");
  if(S===null)indicator("sma","sma-note","Collecting…","Need 20 observations","var(--muted)");
  else indicator("sma","sma-note",money(S),current>=S?"Price above average":"Price below average",current>=S?"var(--green)":"var(--red)");
  if(prices.length<20)indicator("bands","bands-note","Collecting…","Need 20 observations","var(--muted)");
  else{const p=prices.slice(-20),mean=p.reduce((a,b)=>a+b,0)/20,sd=Math.sqrt(p.reduce((a,x)=>a+(x-mean)**2,0)/20);B={upper:mean+2*sd,lower:mean-2*sd};B.side=current>=B.upper?"SELL":current<=B.lower?"BUY":"HOLD";indicator("bands","bands-note",`${money(B.upper)} / ${money(B.lower)}`,B.side==="SELL"?"At/above upper band":B.side==="BUY"?"At/below lower band":"Price within bands",B.side==="BUY"?"var(--green)":B.side==="SELL"?"var(--red)":"var(--yellow)");}
  const volume=points.filter(p=>p.volume>0),totalVol=volume.reduce((a,p)=>a+p.volume,0);
  if(!totalVol)indicator("vwap","vwap-note","Collecting…","Waiting for simulated volume","var(--muted)");
  else{V=volume.reduce((a,p)=>a+p.price*p.volume,0)/totalVol;indicator("vwap","vwap-note",money(V),current>=V?"Price above simulated VWAP":"Price below simulated VWAP",current>=V?"var(--green)":"var(--red)");}
  signal({R,M,S,B,V,current});
}
function signal(x){
  const rows=[];
  if(x.R!==null)rows.push(["RSI",x.R<=30?"BUY":x.R>=70?"SELL":"HOLD"]);
  if(x.M)rows.push(["MACD",x.M.hist>0?"BUY":x.M.hist<0?"SELL":"HOLD"]);
  if(x.S!==null)rows.push(["SMA",x.current>=x.S?"BUY":"SELL"]);
  if(x.B)rows.push(["Bollinger",x.B.side]);
  if(x.V!==null)rows.push(["VWAP",x.current>=x.V?"BUY":"SELL"]);
  const buys=rows.filter(r=>r[1]==="BUY").length,sells=rows.filter(r=>r[1]==="SELL").length,holds=rows.filter(r=>r[1]==="HOLD").length;
  const result=rows.length<5?"COLLECTING DATA":buys>=4?"BUY":sells>=4?"SELL":"HOLD";
  const agreement=rows.length?Math.round(Math.max(buys,sells,holds)/rows.length*100):0;
  $("signal").textContent=result;$("signal").className="signal "+(result==="BUY"?"buy-signal":result==="SELL"?"sell-signal":"hold");
  $("agreement").textContent=rows.length===5?`${agreement}% indicator agreement · ${buys} BUY / ${sells} SELL / ${holds} HOLD`:`${rows.length}/5 indicators ready`;
  $("signal-reason").textContent=result==="BUY"?"At least four indicators show bullish conditions.":result==="SELL"?"At least four indicators show bearish conditions.":result==="HOLD"?"Readings are mixed or neutral.":"Collecting enough observations.";
  $("agreement-bar").style.width=(rows.length===5?agreement:rows.length*20)+"%";
  $("signal-time").textContent="Updated "+new Date().toLocaleTimeString();
  $("signal-items").innerHTML=rows.map(r=>`<div class="signal-item">${r[0]}<b class="${r[1]==="BUY"?"up":r[1]==="SELL"?"down":"muted"}">${r[1]}</b></div>`).join("");
}
async function drawCandles(symbol,tf){
  const el=$("candle-chart");if(!window.LightweightCharts)return;
  try{
    const candles=await api(`/api/stocks/${encodeURIComponent(symbol)}/candles?timeframe=${tf}`);
    if(!candleChart){
      candleChart=LightweightCharts.createChart(el,{width:el.clientWidth,height:el.clientHeight,layout:{background:{color:"#14243b"},textColor:"#9db2d1"},grid:{vertLines:{color:"#ffffff0b"},horzLines:{color:"#ffffff0b"}},rightPriceScale:{borderColor:"#2b405d"},timeScale:{borderColor:"#2b405d",timeVisible:true,secondsVisible:false}});
      candleSeries=candleChart.addCandlestickSeries({upColor:"#20c997",downColor:"#ff647c",borderUpColor:"#20c997",borderDownColor:"#ff647c",wickUpColor:"#20c997",wickDownColor:"#ff647c"});
      window.addEventListener("resize",()=>{if(candleChart)candleChart.applyOptions({width:el.clientWidth,height:el.clientHeight});});
    }
    candleSeries.setData(candles);candleChart.timeScale().fitContent();
  }catch(e){console.error(e);toast("Candlestick data could not be loaded.",true);}
}
document.querySelectorAll(".tf").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tf").forEach(x=>x.classList.toggle("active",x===b));timeframe=b.dataset.tf;if(selectedSymbol)drawCandles(selectedSymbol,timeframe);}));

function openDetails(symbol){
  const s=stocks.find(x=>x.symbol===symbol);if(!s)return;
  selectedSymbol=symbol;page("details");$("detail-name").textContent=s.companyName;$("detail-symbol").textContent=s.symbol;
  renderDetails();drawCandles(symbol,timeframe);
}
function renderDetails(){
  const s=stocks.find(x=>x.symbol===selectedSymbol);if(!s)return;
  const st=session.get(s.symbol)||{open:s.price,high:s.price,low:s.price};
  $("detail-price").textContent=money(s.price);$("detail-change").textContent=`${s.changePercent>=0?"+":""}${s.changePercent.toFixed(2)}%`;
  $("detail-change").style.color=s.changePercent>=0?"var(--green)":"var(--red)";
  $("ohlc-current").textContent=money(s.price);$("ohlc-previous").textContent=money(s.previousPrice);
  $("ohlc-high").textContent=money(st.high);$("ohlc-low").textContent=money(st.low);
  updateIndicators(s.symbol);
  $("buy-detail").onclick=()=>openTrade(s.symbol,"BUY");$("sell-detail").onclick=()=>openTrade(s.symbol,"SELL");
}
function openTrade(symbol,type){
  const s=stocks.find(x=>x.symbol===symbol);if(!s)return;
  trade={symbol,type,price:s.price};$("trade-heading").textContent=type==="BUY"?"Buy Stock":"Sell Stock";
  $("trade-description").textContent=`${s.companyName} (${symbol}) · ${money(s.price)} per share`;
  $("quantity").value=1;estimate();$("trade-dialog").showModal();
}
function estimate(){$("trade-estimate").textContent=money(Number($("quantity").value||0)*(trade?.price||0));}
$("quantity").addEventListener("input",estimate);
$("confirm-trade").addEventListener("click",async()=>{
  const qty=Number($("quantity").value);if(!trade||!Number.isInteger(qty)||qty<1)return toast("Enter a valid quantity.",true);
  try{await api(`/api/trading/${trade.type.toLowerCase()}?symbol=${encodeURIComponent(trade.symbol)}&quantity=${qty}`,{method:"POST"});$("trade-dialog").close();toast(`${trade.type} order completed.`);await refresh();}
  catch(e){toast(e.message,true);}
});

async function loadPortfolio(){
  try{
    const rows=await api("/api/portfolio");$("portfolio-empty").classList.toggle("hidden",rows.length>0);
    $("portfolio-rows").innerHTML=rows.map(h=>{const s=h.stock,q=h.quantity,value=s.price*q,pl=value-h.averageBuyPrice*q;return `<tr><td>${safe(s.companyName)}</td><td>${safe(s.symbol)}</td><td>${q}</td><td>${money(h.averageBuyPrice)}</td><td>${money(s.price)}</td><td>${money(value)}</td><td class="${pl>=0?"up":"down"}">${money(pl)}</td><td><button class="sell" onclick="openTrade('${safeJs(s.symbol)}','SELL')">Sell</button></td></tr>`;}).join("");
  }catch(e){toast(e.message,true);}
}
async function loadTransactions(){
  try{const rows=await api("/api/trading/transactions");$("transactions-empty").classList.toggle("hidden",rows.length>0);
    $("transaction-rows").innerHTML=rows.map(t=>`<tr><td>${new Date(t.transactionDate).toLocaleString()}</td><td class="${t.transactionType==="BUY"?"up":"down"}">${t.transactionType}</td><td>${safe(t.companyName)}</td><td>${safe(t.stockSymbol)}</td><td>${t.quantity}</td><td>${money(t.price)}</td><td>${money(t.totalAmount)}</td></tr>`).join("");
  }catch(e){toast(e.message,true);}
}
async function refresh(){
  if(refreshing)return;refreshing=true;
  try{
    const [d,s]=await Promise.all([api("/api/dashboard"),api("/api/stocks")]);
    updateHistory(s);updateStats(d);fillDashboardSelect();renderWatchlist();drawDashboardChart();
    const visible=document.querySelector(".page:not(.hidden)")?.id;
    if(visible==="market-page")renderMarket();
    if(visible==="details-page"&&selectedSymbol){renderDetails();drawCandles(selectedSymbol,timeframe);}
    if(visible==="portfolio-page")loadPortfolio();
  }catch(e){console.error("Refresh failed",e);}
  finally{refreshing=false;}
}
function fillDashboardSelect(){const old=$("dashboard-symbol").value;$("dashboard-symbol").innerHTML=stocks.map(s=>`<option value="${safe(s.symbol)}">${safe(s.symbol)}</option>`).join("");if(stocks.some(s=>s.symbol===old))$("dashboard-symbol").value=old;}
async function start(){try{await refresh();setInterval(refresh,3000);}catch(e){toast("StockPro could not start: "+e.message,true);console.error(e);}}
start();

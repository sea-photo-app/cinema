// ============================================
// Beach Cinema — App (Firebase Firestore)
// Требует: firebase-config.js, data.js
// ============================================

// --- Defaults (seed при первом запуске) ---
const DEFAULT_MOVIES=[
{id:1,title:"Интерстеллар",genre:"Фантастика",date:"2026-09-08",time:"21:30",duration:169,price:1200,image:"https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=80",description:"Космическое путешествие за пределы человеческого мира."},
{id:2,title:"Ла-Ла Ленд",genre:"Драма",date:"2026-09-09",time:"21:00",duration:128,price:1000,image:"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80",description:"История любви, мечтаний и большого города."},
{id:3,title:"Безумный Макс",genre:"Триллер",date:"2026-09-10",time:"22:00",duration:120,price:1100,image:"https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1000&q=80",description:"Постапокалиптическое приключение."}];

const DEFAULT_ANNOUNCEMENTS=[
{id:1,title:"Сегодня кино под открытым небом",text:"Не забудьте взять с собой лёгкую кофту. Вечером у моря может быть прохладно.",date:new Date().toLocaleDateString("ru-RU")},
{id:2,title:"Приходите заранее",text:"Рекомендуем приходить за 20–30 минут до начала сеанса.",date:new Date().toLocaleDateString("ru-RU")}];

const DEFAULT_CONTENT={heroLabel:"КИНО ПОД ОТКРЫТЫМ НЕБОМ",heroTitle1:"Фильмы.",heroTitle2:"Море.",heroTitle3:"Закат.",heroText:"Устройтесь поудобнее, почувствуйте морской бриз и наслаждайтесь любимыми фильмами прямо на пляже.",heroImage:"https://images.unsplash.com/photo-1529348915581-73628f0cf212?auto=format&fit=crop&w=1800&q=80",aboutEyebrow:"BEACH CINEMA",aboutTitle1:"Здесь кино",aboutTitle2:"ощущается иначе.",aboutText:"Мы объединили большой экран, морской воздух и атмосферу летнего вечера.",feature1Title:"У моря",feature1Text:"Смотрите кино под открытым небом всего в нескольких шагах от воды.",feature2Title:"Большой экран",feature2Text:"Качественное изображение и звук, чтобы не пропустить ни одной сцены.",feature3Title:"Обычные места",feature3Text:"Все места одинаковые. Вы просто выбираете свободное место, которое вам нравится.",ctaEyebrow:"ЛЕТНИЙ ВЕЧЕР",ctaTitle1:"Забронируйте",ctaTitle2:"своё место.",footerText:"Кино под открытым небом."};

const DEFAULT_MENU=[
{id:1,name:"Попкорн солёный",price:250,category:"Закуски",availableToday:true},
{id:2,name:"Попкорн карамельный",price:280,category:"Закуски",availableToday:true},
{id:3,name:"Начос с сыром",price:350,category:"Закуски",availableToday:true},
{id:4,name:"Хот-дог",price:300,category:"Горячее",availableToday:true},
{id:5,name:"Кола 0.5",price:200,category:"Напитки",availableToday:true},
{id:6,name:"Вода 0.5",price:150,category:"Напитки",availableToday:true},
{id:7,name:"Чай / кофе",price:180,category:"Напитки",availableToday:true},
{id:8,name:"Мороженое",price:220,category:"Десерты",availableToday:true}];

// Роли сотрудников: к каким действиям даёт доступ каждая роль.
// owner — всё; cashier — касса (афиша, брони, сканер); order — еда (меню, заказы).
function rolePerms(role){
  if(role==="owner")return{scan:true,movies:true,bookings:true,menu:true,orders:true};
  if(role==="order")return{scan:false,movies:false,bookings:false,menu:true,orders:true};
  return{scan:true,movies:true,bookings:true,menu:false,orders:false}; // cashier
}
function roleLabel(role){return role==="owner"?"Владелец":role==="order"?"Оператор заказов":"Обычный кассир"}

// --- Utility ---
function escapeHtml(v){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function formatMoney(v){return Number(v).toLocaleString("ru-RU",{maximumFractionDigits:0})+" ₽"}
function formatDate(d){if(!d)return"";return new Date(d+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long"})}
function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
function toLocalDateStr(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function toLocalTimeStr(d){return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`}
function movieSlotEnd(m){const start=new Date(`${m.date}T${m.time}:00`),rawEnd=new Date(start.getTime()+(Number(m.duration)||120)*60000),withBreak=new Date(rawEnd.getTime()+10*60000),step=5*60000;return{rawEnd,slotEnd:new Date(Math.ceil(withBreak.getTime()/step)*step)}}
function toggleMenu(){const n=document.querySelector(".nav");if(n)n.classList.toggle("mobile-open")}

// ============================================
// HOME PAGE
// ============================================
async function renderHomeMovies(){
  const c=document.getElementById("homeMovies");if(!c)return;
  const movies=sortMoviesBySchedule(await fbGetMovies());
  c.innerHTML=movies.slice(0,3).map(m=>`<a class="movie-card" href="booking.html?movie=${m.id}"><div class="movie-poster" style="background-image:url('${m.image}')"><div class="movie-overlay"><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.genre)} · ${m.time} · ${m.duration||120} мин</p></div></div><div class="movie-info"><span class="movie-meta">${formatDate(m.date)}</span><span class="movie-price">${formatMoney(m.price)}</span></div></a>`).join("");
}

async function renderScheduleStatus(){
  const nowLabelEl=document.getElementById("heroNowLabel"),nowEl=document.getElementById("heroNowFilm"),nextLabelEl=document.getElementById("heroNextLabel"),nextEl=document.getElementById("heroNextFilm");
  if(!nowEl||!nextEl)return;
  const LAST_TODAY_MSG="Это был последний фильм на сегодня. Приходите завтра!";
  const movies=(await fbGetMovies()).slice().sort((a,b)=>new Date(`${a.date}T${a.time}`)-new Date(`${b.date}T${b.time}`));
  const now=new Date();
  if(!movies.length){nowLabelEl.textContent="Афиша";nowEl.textContent="Сеансов пока нет";nextLabelEl.textContent="";nextEl.textContent=LAST_TODAY_MSG;return}
  let currentIdx=-1;
  for(let i=0;i<movies.length;i++){const start=new Date(`${movies[i].date}T${movies[i].time}:00`),{slotEnd}=movieSlotEnd(movies[i]);if(now>=start&&now<slotEnd){currentIdx=i;break}}
  const timeOf=m=>`${formatDate(m.date)} · ${m.time}`;
  if(currentIdx>-1){const cur=movies[currentIdx],{rawEnd}=movieSlotEnd(cur);nowLabelEl.textContent="Сейчас идёт";nowEl.textContent=`${cur.title} · до ${toLocalTimeStr(rawEnd)}`;const next=movies[currentIdx+1];if(next){nextLabelEl.textContent="Следующий сеанс";nextEl.textContent=timeOf(next)+` — ${next.title}`}else{nextLabelEl.textContent="После этого фильма";nextEl.textContent="Это последний фильм на сегодня. Ждём вас завтра!"}}else{const next=movies.find(m=>new Date(`${m.date}T${m.time}:00`)>now);if(next){const idx=movies.indexOf(next),after=movies[idx+1];nowLabelEl.textContent="Ближайший сеанс";nowEl.textContent=`${next.title} · ${timeOf(next)}`;if(after){nextLabelEl.textContent="Затем";nextEl.textContent=`${after.title} · ${timeOf(after)}`}else{nextLabelEl.textContent="После этого фильма";nextEl.textContent="Больше сеансов в афише пока нет"}}else{nowLabelEl.textContent="Афиша";nowEl.textContent="Сегодняшние сеансы завершены";nextLabelEl.textContent="";nextEl.textContent=LAST_TODAY_MSG}}
}

async function renderHomeAnnouncements(){
  const c=document.getElementById("homeAnnouncements");if(!c)return;
  const a=await fbGetAnnouncements();
  if(!a.length){c.innerHTML="<p>Пока новых объявлений нет.</p>";return}
  const x=a[0];
  c.innerHTML=`<div class="announcement-item"><div class="announcement-date">${x.date}</div><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.text)}</p></div>`;
}

async function renderSiteContent(){
  const c=await fbGetSiteContent();
  setText("contentHeroLabel",c.heroLabel);
  setText("contentHeroTitle1",c.heroTitle1);
  setText("contentHeroTitle2",c.heroTitle2);
  setText("contentHeroTitle3",c.heroTitle3);
  setText("contentHeroText",c.heroText);
  const bg=document.getElementById("heroBg");if(bg)bg.style.backgroundImage=`url('${c.heroImage}')`;
  setText("contentAboutEyebrow",c.aboutEyebrow);
  setText("contentAboutTitle1",c.aboutTitle1);
  setText("contentAboutTitle2",c.aboutTitle2);
  setText("contentAboutText",c.aboutText);
  setText("contentFeature1Title",c.feature1Title);
  setText("contentFeature1Text",c.feature1Text);
  setText("contentFeature2Title",c.feature2Title);
  setText("contentFeature2Text",c.feature2Text);
  setText("contentFeature3Title",c.feature3Title);
  setText("contentFeature3Text",c.feature3Text);
  setText("contentCtaEyebrow",c.ctaEyebrow);
  setText("contentCtaTitle1",c.ctaTitle1);
  setText("contentCtaTitle2",c.ctaTitle2);
  setText("contentFooterText",c.footerText);
}

// ============================================
// FILMS PAGE
// ============================================
let currentMovieFilter="all";

async function renderMovieFilters(){
  const c=document.getElementById("movieFilters");if(!c)return;
  const movies=await fbGetMovies();
  const genres=[...new Set(movies.map(m=>m.genre).filter(Boolean))];
  c.innerHTML=[`<button class="filter${currentMovieFilter==="all"?" active":""}" onclick="filterMovies('all',this)">Все</button>`,...genres.map(g=>`<button class="filter${currentMovieFilter===g?" active":""}" onclick="filterMovies('${g.replaceAll("'","\\'")}',this)">${escapeHtml(g)}</button>`)].join("");
}

async function renderMovies(){
  const c=document.getElementById("moviesList");if(!c)return;
  let m=sortMoviesBySchedule(await fbGetMovies());
  if(currentMovieFilter!=="all")m=m.filter(x=>x.genre===currentMovieFilter);
  c.innerHTML=m.length?m.map(x=>`<div class="movie-card"><a href="booking.html?movie=${x.id}"><div class="movie-poster" style="background-image:url('${x.image}')"><div class="movie-overlay"><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.genre)} · ${x.time} · ${x.duration||120} мин</p></div></div></a><div class="movie-info"><div><div class="movie-meta">${formatDate(x.date)}</div><div class="movie-meta">Начало: ${x.time} · ${x.duration||120} мин</div></div><span class="movie-price">${formatMoney(x.price)}</span></div></div>`).join(""):"<div>Фильмов этой категории пока нет.</div>";
}

async function filterMovies(f,b){
  currentMovieFilter=f;
  document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  await renderMovies();
}

// ============================================
// ANNOUNCEMENTS PAGE
// ============================================
async function renderAnnouncements(){
  const c=document.getElementById("announcementsList");if(!c)return;
  const a=await fbGetAnnouncements();
  c.innerHTML=a.length?a.map(x=>`<article class="announcement-item"><div class="announcement-date">${x.date}</div><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.text)}</p></article>`).join(""):"<p>Пока объявлений нет.</p>";
}

// ============================================
// BOOKING
// ============================================
let selectedSeats=[],currentMovie=null;

async function populateFilmSelect(){
  const s=document.getElementById("filmSelect");if(!s)return;
  const movies=sortMoviesBySchedule(await fbGetMovies());
  s.innerHTML=movies.map(m=>`<option value="${m.id}">${escapeHtml(m.title)} — ${formatDate(m.date)} — ${m.time} — ${m.duration||120} мин — ${formatMoney(m.price)}</option>`).join("");
}

async function initBooking(){
  await populateFilmSelect();
  const s=document.getElementById("filmSelect");if(!s)return;
  const movies=await fbGetMovies();
  const id=Number(new URLSearchParams(location.search).get("movie"));
  if(id&&movies.some(m=>m.id===id))s.value=id;
  await loadSeats();
}

async function loadSeats(){
  selectedSeats=[];
  const s=document.getElementById("filmSelect");if(!s)return;
  const movies=await fbGetMovies();
  currentMovie=movies.find(m=>m.id===Number(s.value));
  if(!currentMovie)return;
  await renderSeatMap();
  updateSummary();
}

async function renderSeatMap(){
  const map=document.getElementById("seatMap");if(!map)return;
  const bookings=await fbGetBookings();
  const occupied=[];
  bookings.filter(b=>b.movieId===currentMovie.id).forEach(b=>seatsList(b.seats).forEach(x=>occupied.push(x)));
  map.innerHTML="";
  for(let r=0;r<4;r++)for(let n=1;n<=10;n++){
    const sn=`${String.fromCharCode(65+r)}${n}`,b=document.createElement("button");
    b.className="seat";b.textContent=sn;
    if(occupied.includes(sn)){b.classList.add("occupied");b.disabled=true}
    else b.onclick=()=>selectSeat(sn,b);
    map.appendChild(b);
  }
  if (seatMapNative()) { requestAnimationFrame(()=>seatAutoFit()); }
}

/* ===== Приближение и перемещение карты мест (только на телефоне) ===== */
const seatMapNative=()=>("ontouchstart" in window||navigator.maxTouchPoints>0)&&window.matchMedia("(max-width:550px)").matches;
let seatZoom={s:1,tx:0,ty:0},seatTouches=[],seatLastDist=0,seatLastX,seatLastY,seatTwoCenter=null;

function initSeatViewport(){
  const vp=document.querySelector(".seat-viewport");if(!vp||vp._pts)return;vp._pts=true;
  if(seatMapNative()){
    const c=document.createElement("div");c.className="zoom-controls";
    const btn=(t,fn)=>{const b=document.createElement("button");b.type="button";b.className="zoom-btn";b.textContent=t;b.addEventListener("click",e=>{e.stopPropagation();fn()});return b};
    c.appendChild(btn("+",()=>seatZoomTo(seatZoom.s*1.35)));
    c.appendChild(btn("−",()=>seatZoomTo(seatZoom.s/1.35)));
    c.appendChild(btn("⟲",seatResetZoom));
    vp.appendChild(c);
  }
  vp.addEventListener("touchstart",seatTouchStart,{passive:false});
  vp.addEventListener("touchmove",seatTouchMove,{passive:false});
  vp.addEventListener("touchend",seatTouchEnd);
  vp.addEventListener("touchcancel",()=>{seatLastDist=0});
}

function seatTouchStart(e){
  if(e.target&&e.target.closest(".zoom-btn"))return;
  seatTouches=Array.from(e.touches);
  seatTwoCenter=null;
  if(seatTouches.length>=2)seatLastDist=seatDist(seatTouches[0],seatTouches[1]);
  else{seatLastDist=0;seatLastX=seatTouches[0].clientX;seatLastY=seatTouches[0].clientY}
}
function seatTouchMove(e){
  const vp=e.currentTarget,stage=vp.querySelector(".seat-stage");
  const t=Array.from(e.touches);if(!stage)return;
  if(t.length>=2){
    const d=seatDist(t[0],t[1]);
    if(seatLastDist>0)seatZoom.s=Math.max(0.5,Math.min(4.2,seatZoom.s*d/seatLastDist));
    seatLastDist=d;
    const cx=(t[0].clientX+t[1].clientX)/2,cy=(t[0].clientY+t[1].clientY)/2;
    if(seatTwoCenter){seatZoom.tx+=cx-seatTwoCenter.x;seatZoom.ty+=cy-seatTwoCenter.y}
    seatTwoCenter={x:cx,y:cy};
    e.preventDefault();seatApply(vp);
  }else if(t.length===1){
    seatLastDist=0;seatTwoCenter=null;
    if(seatLastX!==undefined){seatZoom.tx+=t[0].clientX-seatLastX;seatZoom.ty+=t[0].clientY-seatLastY}
    seatLastX=t[0].clientX;seatLastY=t[0].clientY;
    e.preventDefault();seatApply(vp);
  }
}
function seatTouchEnd(){
  seatTouches=[];seatLastDist=0;seatTwoCenter=null;seatLastX=seatLastY=undefined;
}
function seatDist(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}

function seatMapStage(){return document.querySelector(".seat-viewport .seat-stage")}
function seatApply(vp){
  const stage=seatMapStage();if(!stage)return;
  const sw=stage.scrollWidth*seatZoom.s,sh=Math.max(stage.scrollHeight||300,200)*seatZoom.s;
  const vw=vp.clientWidth||window.innerWidth,vh=vp.clientHeight||200;
  const rx=(sw-vw)/2,ry=(sh-vh)/2;
  seatZoom.tx=rx>0?Math.max(-rx,Math.min(rx,seatZoom.tx)):0;
  seatZoom.ty=ry>0?Math.max(-ry,Math.min(ry,seatZoom.ty)):0;
  stage.style.transform=`translate(${seatZoom.tx}px,${seatZoom.ty}px) scale(${seatZoom.s})`;
}
function seatAutoFit(){
  const vp=document.querySelector(".seat-viewport"),stage=seatMapStage();
  if(!vp||!stage)return;
  const gap=20;let s=Math.min(1,(vp.clientWidth-gap)/(stage.scrollWidth||620));
  if(isNaN(s)||s<=0)s=1;
  seatZoom.s=s;seatZoom.tx=0;seatZoom.ty=0;
  seatApply(vp);
}
function seatZoomTo(s){seatZoom.s=Math.max(0.5,Math.min(4.2,s));seatApply(document.querySelector(".seat-viewport"))}
function seatResetZoom(){seatAutoFit()}

initSeatViewport();
window.addEventListener("resize",()=>{if(seatMapNative())seatAutoFit()});

function selectSeat(sn,b){
  if(selectedSeats.includes(sn)){selectedSeats=selectedSeats.filter(x=>x!==sn);b.classList.remove("selected")}
  else{selectedSeats.push(sn);b.classList.add("selected")}
  updateSummary();
}

function updateSummary(){
  if(!currentMovie)return;
  document.getElementById("summaryFilm").textContent=`${currentMovie.title} · ${currentMovie.time} · ${currentMovie.duration||120} мин`;
  document.getElementById("selectedSeatsText").textContent=selectedSeats.length?selectedSeats.join(", "):"—";
  document.getElementById("ticketCount").textContent=selectedSeats.length;
  document.getElementById("totalPrice").textContent=formatMoney(selectedSeats.length*currentMovie.price);
}

function openBookingModal(){
  if(!currentMovie)return alert("Сначала выберите фильм.");
  if(!selectedSeats.length)return alert("Выберите хотя бы одно место.");
  document.getElementById("bookingModal").classList.add("open");
}

function closeBookingModal(){document.getElementById("bookingModal").classList.remove("open")}

async function confirmBooking(e){
  e.preventDefault();
  const name=document.getElementById("customerName").value.trim(),
        phone=document.getElementById("customerPhone").value.trim(),
        email=document.getElementById("customerEmail").value.trim();

  // Проверка занятых мест
  const bookings=await fbGetBookings();
  const occupied=[];
  bookings.filter(b=>b.movieId===currentMovie.id).forEach(b=>seatsList(b.seats).forEach(s=>occupied.push(s)));
  if(selectedSeats.some(s=>occupied.includes(s))){
    alert("Одно из выбранных мест уже заняли.");
    closeBookingModal();await loadSeats();return;
  }

  const booking={
    id:Date.now(),
    ticketCode:"BC-"+Date.now().toString(36).toUpperCase(),
    movieId:currentMovie.id,
    movieTitle:currentMovie.title,
    customerName:name,customerPhone:phone,customerEmail:email,
    seats:[...selectedSeats],
    amount:selectedSeats.length*currentMovie.price,
    date:new Date().toISOString(),
    status:"Оплачено",checkedIn:false
  };

  await fbAddBooking(booking);
  closeBookingModal();e.target.reset();
  showTicketSuccess(booking); // сначала билет, пустая схема обновится следом
  loadSeats().catch(()=>{});
}

// ============================================
// ADMIN BOOKING MODAL
// ============================================
async function openAdminBookingModal(){await populateFilmSelect();await loadSeats();document.getElementById("adminBookingModal").classList.add("open");if(seatMapNative())requestAnimationFrame(seatAutoFit)}
function closeAdminBookingModal(){document.getElementById("adminBookingModal").classList.remove("open")}

async function confirmAdminBooking(e){
  e.preventDefault();
  if(!currentMovie)return alert("Выберите фильм.");
  if(!selectedSeats.length)return alert("Выберите хотя бы одно свободное место.");

  const bookings=await fbGetBookings();
  const occupied=[];
  bookings.filter(b=>b.movieId===currentMovie.id).forEach(b=>seatsList(b.seats).forEach(s=>occupied.push(s)));
  if(selectedSeats.some(s=>occupied.includes(s))){
    alert("Одно из выбранных мест уже заняли.");
    closeAdminBookingModal();await loadSeats();return;
  }

  const name=document.getElementById("adminCustomerName").value.trim()||"Бронь администратора";
  const booking={
    id:Date.now(),
    movieId:currentMovie.id,movieTitle:currentMovie.title,
    customerName:name,customerPhone:"",customerEmail:"",
    seats:[...selectedSeats],amount:0,
    date:new Date().toISOString(),
    status:"Бесплатно (админ)",
    ticketCode:"BC-"+Date.now().toString(36).toUpperCase(),
    checkedIn:false
  };

  await fbAddBooking(booking);
  e.target.reset();closeAdminBookingModal();
  showTicketSuccess(booking); // билет показываем сразу — refresh не должен его блокировать
  refreshAdmin().catch(()=>{});
}

// ============================================
// EMPLOYEES
// ============================================
async function renderEmployeeTable(){
  const c=document.getElementById("employeesList");if(!c)return;
  const es=await fbGetEmployees();
  c.innerHTML=es.length?`<div class="staff-grid">${es.map(e=>`<div class="item-row"><div class="ava">${escapeHtml((e.name||e.login||"С")[0])}</div><div class="row-main"><b>${escapeHtml(e.name||e.login)}</b><span class="row-meta">Логин: ${escapeHtml(e.login)} · ${escapeHtml(roleLabel(e.role))}</span></div><span class="status-pill ${e.active!==false?'status-ok':'status-off'}">${e.active!==false?'Активен':'Заблокирован'}</span><div class="employee-actions"><button class="admin-chip" title="${e.active!==false?'Заблокировать':'Разблокировать'}" onclick="toggleEmployeeActive('${e.firebaseId}')">${e.active!==false?'🔒':'🔓'}</button><button class="admin-chip delete" title="Удалить" onclick="deleteEmployee('${e.firebaseId}')">🗑</button></div></div>`).join("")}</div>`:"<p class='small-text'>Сотрудников пока нет.</p>";
}

function openEmployeeModal(){document.getElementById("employeeModal").classList.add("open")}
function closeEmployeeModal(){document.getElementById("employeeModal").classList.remove("open");document.getElementById("employeeForm").reset()}

async function saveEmployee(e){
  e.preventDefault();
  const login=document.getElementById("employeeLogin").value.trim(),
        password=document.getElementById("employeePassword").value,
        name=document.getElementById("employeeName").value.trim()||login,
        roleSel=document.getElementById("employeeRole");
  if(!roleSel)return;
  const role=roleSel.value;
  if(!role)return alert("Выберите роль сотрудника.");
  const es=await fbGetEmployees();
  if(es.some(x=>x.login.toLowerCase()===login.toLowerCase()))return alert("Такой логин уже существует.");
  await fbAddEmployee({login,password,name,role,active:true});
  closeEmployeeModal();await renderEmployeeTable();showToast("Сотрудник создан · "+roleLabel(role));
}

async function toggleEmployeePermission(firebaseId,key,value){
  const update={};update[key]=value;
  await fbUpdateEmployee(firebaseId,update);
}

async function toggleEmployeeActive(firebaseId){
  const es=await fbGetEmployees();
  const x=es.find(e=>e.firebaseId===firebaseId);
  if(x){await fbUpdateEmployee(firebaseId,{active:x.active===false});await renderEmployeeTable()}
}

async function deleteEmployee(firebaseId){
  if(!confirm("Удалить сотрудника?"))return;
  await fbDeleteEmployee(firebaseId);await renderEmployeeTable();
}

// ============================================
// ADMIN AUTH
// ============================================
function getCurrentUser(){try{return JSON.parse(sessionStorage.getItem("beachUser")||"null")}catch(e){return null}}
function can(action){const u=getCurrentUser();return !!u&&(u.role==="owner"||!!u[action])}

async function employeeLogin(login,password){
  const es=await fbGetEmployees();
  const e=es.find(x=>x.active!==false&&x.login===login&&x.password===password);
  if(!e)return false;
  const pr=rolePerms(e.role); // кассир / оператор / (старые без роли = кассир)
  sessionStorage.setItem("beachUser",JSON.stringify({...e,role:"employee",scan:pr.scan,movies:pr.movies,bookings:pr.bookings,menu:pr.menu,orders:pr.orders}));
  sessionStorage.setItem("beachAdmin","true");
  return true;
}

async function adminLogin(e){
  e.preventDefault();
  const login=document.getElementById("adminLoginInput").value.trim(),
        password=document.getElementById("adminPassword").value,
        errorEl=document.getElementById("loginError");
  if(login==="admin"&&password==="12345"){
    sessionStorage.setItem("beachAdmin","true");
    sessionStorage.setItem("beachUser",JSON.stringify({role:"owner",name:"Владелец",login:"admin"}));
    if(errorEl)errorEl.classList.add("hidden");
    showAdminPanel();
  }else if(await employeeLogin(login,password)){
    if(errorEl)errorEl.classList.add("hidden");
    showAdminPanel();
  }else if(errorEl)errorEl.classList.remove("hidden");
}

function initAdmin(){
  if(sessionStorage.getItem("beachAdmin")==="true")showAdminPanel();
  else{document.getElementById("loginScreen").classList.remove("hidden");document.getElementById("adminPanel").classList.add("hidden")}
}

function showAdminPanel(){
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");
  const u=getCurrentUser()||{role:"owner",name:"Владелец"};
  const who=document.getElementById("currentUserName");if(who)who.textContent=u.role==="owner"?"Владелец":u.name;
  const ava=document.getElementById("currentUserAva");if(ava)ava.textContent=((u.role==="owner"?"Владелец":u.name)||"В").charAt(0).toUpperCase();
  const dl=document.getElementById("adminDateLabel");if(dl)dl.textContent=new Date().toLocaleDateString("ru-RU",{day:"numeric",month:"long",weekday:"short"});
  applyPermissions();refreshAdmin();
}

function adminLogout(){sessionStorage.removeItem("beachAdmin");sessionStorage.removeItem("beachUser");location.reload()}

// ============================================
// ADMIN UI: тосты, анимации, мелкие хелперы
// ============================================
function showToast(msg,type){
  let wrap=document.querySelector(".toast-wrap");
  if(!wrap){wrap=document.createElement("div");wrap.className="toast-wrap";document.body.appendChild(wrap)}
  const t=document.createElement("div");
  t.className="toast "+(type==="error"?"error":type==="info"?"":"success");
  const ico=type==="error"?"⚠️":type==="info"?"ℹ️":"✅";
  t.innerHTML="<span class='t-ico'>"+ico+"</span><span>"+escapeHtml(msg)+"</span>";
  wrap.appendChild(t);
  setTimeout(()=>{t.classList.add("out");setTimeout(()=>t.remove(),320)},2800);
}

// Плавная «прокрутка» числа в стат-карточке (0 → значение, ~0.5с)
function animateCount(id,v,fmt){
  const el=document.getElementById(id);if(!el)return;
  const f=fmt||(x=>String(x));
  const dur=520,start=performance.now();
  if(window.__countRAF)cancelAnimationFrame(window.__countRAF);
  const step=t=>{
    const p=Math.min((t-start)/dur,1),e=1-Math.pow(1-p,3);
    el.textContent=f(Math.round(v*e));
    if(p<1)window.__countRAF=requestAnimationFrame(step);
  };
  window.__countRAF=requestAnimationFrame(step);
}

// Красочная пилюля статуса брони
function bookingPillHtml(x){
  return '<span class="status-pill '+(x.checkedIn?'status-blocked':'status-active')+'">'+(x.checkedIn?'Пропущен':escapeHtml(x.status||"Оплачено"))+'</span>';
}

function applyPermissions(){
  const u=getCurrentUser()||{role:"owner"},owner=u.role==="owner";
  document.querySelectorAll("[data-permission]").forEach(el=>{const p=el.dataset.permission;el.classList.toggle("hidden",!owner&&!u[p])});
  const title=document.getElementById("adminRoleLabel");if(title)title.textContent=owner?"ВЛАДЕЛЕЦ":"СОТРУДНИК";
}

function showAdminPage(page,button){
  const u=getCurrentUser()||{role:"owner"},owner=u.role==="owner",perms={scanner:"scan",movies:"movies",bookings:"bookings",menu:"menu",orders:"orders",cash:"orders"};
  if(!owner&&perms[page]&&!u[perms[page]]){showToast("У вас нет прав на этот раздел","error");return}
  const ownerOnly={announcements:1,reports:1,content:1,employees:1};
  if(!owner&&ownerOnly[page]){showToast("Этот раздел доступен только владельцу","error");return}
  if(page!=="scanner")stopScanner();
  document.querySelectorAll(".admin-page").forEach(x=>{x.classList.add("hidden");x.classList.remove("active")});
  document.querySelectorAll(".admin-nav").forEach(x=>x.classList.remove("active"));
  const ids={dashboard:"adminDashboard",movies:"adminMovies",announcements:"adminAnnouncements",bookings:"adminBookings",reports:"adminReports",scanner:"adminScanner",content:"adminContent",employees:"adminEmployees",menu:"adminMenu",orders:"adminOrders",cash:"adminCash"};
  if(!ids[page])return;
  const sec=document.getElementById(ids[page]);
  sec.classList.remove("hidden");
  void sec.offsetHeight; // перезапуск анимации показа (pageIn)
  sec.classList.add("active");
  if(button)button.classList.add("active");
  if(page==="content")fillContentForm();
  if(page==="employees")renderEmployeeTable();
  if(page==="orders"){cleanupExpiredCodes();renderAdminOrders();}
  if(page==="cash")renderAdminCash();
  refreshAdmin();
}

async function refreshAdmin(){
  const tasks=[
    renderAdminStats(),renderDashboardBookings(),renderAdminMovies(),
    renderAdminAnnouncements(),renderAdminBookings(),renderReports(),
    renderDailyReports(),renderEmployeeTable(),renderAdminMenu(),renderAdminOrders(),
    renderAdminCash(),cleanupExpiredCodes()
  ];
  // Ошибка одной секции (например, нет доступа к коллекции) не должна ломать остальные
  await Promise.all(tasks.map(t=>Promise.resolve(t).catch(()=>{})));
}

// ============================================
// ADMIN: STATS & DASHBOARD
// ============================================
async function renderAdminStats(){
  const b=await fbGetBookings(),m=await fbGetMovies(),o=await fbGetOrders();
  const todayString=new Date().toISOString().slice(0,10);
  const bookTotal=b.reduce((s,x)=>s+Number(x.amount),0);
  const bookToday=b.filter(x=>x.date.slice(0,10)===todayString).reduce((s,x)=>s+Number(x.amount),0);
  const foodTotal=o.filter(x=>x.status==="done").reduce((s,x)=>s+Number(x.total||0),0);
  const foodToday=foodRevenueForDay(o,todayString);
  animateCount("statToday",bookToday+foodToday,x=>formatMoney(x));
  animateCount("statTotal",bookTotal+foodTotal,x=>formatMoney(x));
  animateCount("statTickets",b.reduce((s,x)=>s+seatsList(x.seats).length,0));
  animateCount("statMovies",m.length);
}

async function renderDashboardBookings(){
  const c=document.getElementById("dashboardBookings");if(!c)return;
  const b=(await fbGetBookings()).slice().reverse().slice(0,8);
  c.innerHTML=b.length?b.map(x=>`<div class="dash-row"><div class="ava">${escapeHtml((x.customerName||"Г")[0])}</div><div class="dash-main"><b>${escapeHtml(x.customerName||"Гость")}</b><small>${escapeHtml(x.movieTitle)} · ${seatsList(x.seats).join(", ")||"—"}</small></div>${bookingPillHtml(x)}<span class="dash-amount">${formatMoney(x.amount)}</span></div>`).join(""):"<p class='small-text'>Пока бронирований нет.</p>";
}

// ============================================
// ADMIN: MOVIES
// ============================================
function suggestNextMovieSlot(){
  return fbGetMovies().then(movies=>{
    movies.sort((a,b)=>new Date(`${a.date}T${a.time}`)-new Date(`${b.date}T${b.time}`));
    if(!movies.length)return null;
    return movieSlotEnd(movies[movies.length-1]).slotEnd;
  });
}

function openMovieModal(){
  const dateInput=document.getElementById("movieDate"),timeInput=document.getElementById("movieTime"),durInput=document.getElementById("movieDuration");
  suggestNextMovieSlot().then(suggested=>{
    if(suggested&&dateInput&&timeInput){dateInput.value=toLocalDateStr(suggested);timeInput.value=toLocalTimeStr(suggested)}
  });
  if(durInput&&!durInput.value)durInput.value=120;
  document.getElementById("movieModal").classList.add("open");
}

function closeMovieModal(){
  document.getElementById("movieModal").classList.remove("open");
  document.getElementById("movieModal").querySelector("form").reset();
  const p=document.getElementById("movieImagePreview");p.src="";p.classList.add("hidden");
}

function previewMovieImage(input){
  const p=document.getElementById("movieImagePreview");
  const file=input.files&&input.files[0];
  if(!file){p.src="";p.classList.add("hidden");return}
  const reader=new FileReader();
  reader.onload=()=>{p.src=reader.result;p.classList.remove("hidden")};
  reader.readAsDataURL(file);
}

function resizeImageFile(file,maxSize,quality){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        let w=img.width,h=img.height;
        if(w>h&&w>maxSize){h=Math.round(h*maxSize/w);w=maxSize}
        else if(h>maxSize){w=Math.round(w*maxSize/h);h=maxSize}
        const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL("image/jpeg",quality));
      };img.onerror=reject;img.src=reader.result;
    };reader.onerror=reject;reader.readAsDataURL(file);
  });
}

async function saveMovie(e){
  e.preventDefault();
  const fileInput=document.getElementById("movieImage"),file=fileInput.files&&fileInput.files[0],
        btn=document.getElementById("saveMovieBtn"),
        defaultImage="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80";
  let image=defaultImage;
  if(file){btn.disabled=true;btn.textContent="Загрузка фото...";
    try{image=await resizeImageFile(file,1000,.82)}
    catch(err){alert("Не удалось загрузить фото, будет использовано изображение по умолчанию.");image=defaultImage}
    finally{btn.disabled=false;btn.textContent="Сохранить фильм"}
  }
  const m={
    id:Date.now(),
    title:document.getElementById("movieTitle").value.trim(),
    genre:document.getElementById("movieGenre").value.trim(),
    date:document.getElementById("movieDate").value,
    time:document.getElementById("movieTime").value,
    duration:Number(document.getElementById("movieDuration").value)||120,
    price:Number(document.getElementById("moviePrice").value),
    image,description:document.getElementById("movieDescription").value.trim()
  };
  await fbAddMovie(m);
  closeMovieModal();await refreshAdmin();showToast("Фильм добавлен");
}

async function deleteMovie(firebaseId){
  if(!confirm("Удалить этот фильм?"))return;
  await fbDeleteMovie(firebaseId);await refreshAdmin();
}

async function renderAdminMovies(){
  const c=document.getElementById("adminMoviesList");if(!c)return;
  const m=await fbGetMovies();
  c.innerHTML=m.length?m.map(x=>`<div class="item-row"><div class="row-icon">🎬</div><div class="row-main"><b>${escapeHtml(x.title)}</b><span class="row-meta">${escapeHtml(x.genre)} · ${formatDate(x.date)} · ${x.time} · ${x.duration||120} мин · ${formatMoney(x.price)}</span></div><button class="admin-chip delete" title="Удалить" onclick="deleteMovie('${x.firebaseId}')">🗑</button></div>`).join(""):"<p class='small-text'>Фильмов пока нет.</p>";
}

// ============================================
// ADMIN: ANNOUNCEMENTS
// ============================================
function openAnnouncementModal(){document.getElementById("announcementModal").classList.add("open")}
function closeAnnouncementModal(){document.getElementById("announcementModal").classList.remove("open")}

async function saveAnnouncement(e){
  e.preventDefault();
  await fbAddAnnouncement({
    id:Date.now(),
    title:document.getElementById("announcementTitle").value.trim(),
    text:document.getElementById("announcementText").value.trim(),
    date:new Date().toLocaleDateString("ru-RU")
  });
  e.target.reset();closeAnnouncementModal();await refreshAdmin();showToast("Объявление опубликовано");
}

async function deleteAnnouncement(firebaseId){
  if(!confirm("Удалить объявление?"))return;
  await fbDeleteAnnouncement(firebaseId);await refreshAdmin();
}

async function renderAdminAnnouncements(){
  const c=document.getElementById("adminAnnouncementsList");if(!c)return;
  const a=await fbGetAnnouncements();
  c.innerHTML=a.length?a.map(x=>`<div class="item-row"><div class="row-icon">📢</div><div class="row-main"><b>${escapeHtml(x.title)}</b><span class="row-meta">${x.date}</span>${x.text?`<span class="row-meta">${escapeHtml(x.text)}</span>`:""}</div><button class="admin-chip delete" title="Удалить" onclick="deleteAnnouncement('${x.firebaseId}')">🗑</button></div>`).join(""):"<p class='small-text'>Объявлений пока нет.</p>";
}

// ============================================
// ADMIN: BOOKINGS
// ============================================
async function renderAdminBookings(){
  const c=document.getElementById("adminBookingsList");if(!c)return;
  const isOwner=!getCurrentUser()||getCurrentUser().role==="owner";
  const b=(await fbGetBookings()).slice().reverse();
  c.innerHTML=b.length?`<table class="admin-table"><thead><tr><th>Дата</th><th>Клиент</th><th>Телефон</th><th>Фильм</th><th>Места</th><th>Статус</th><th>Сумма</th>${isOwner?"<th></th>":""}</tr></thead><tbody>${b.map(x=>`<tr><td>${new Date(x.date).toLocaleDateString("ru-RU")}</td><td>${escapeHtml(x.customerName)}</td><td>${escapeHtml(x.customerPhone||"—")}</td><td>${escapeHtml(x.movieTitle)}</td><td>${seatsList(x.seats).join(", ")||"—"}</td><td>${bookingPillHtml(x)}</td><td><strong>${formatMoney(x.amount)}</strong></td>${isOwner?`<td><button class="admin-chip delete" title="Удалить" onclick="deleteBooking('${x.firebaseId}')">🗑</button></td>`:""}</tr>`).join("")}</tbody></table>`:"<p class='small-text'>Бронирований пока нет.</p>";
}

async function deleteBooking(firebaseId){
  const u=getCurrentUser();if(!u||u.role!=="owner")return showToast("Удалять бронирования может только владелец","error");
  if(!confirm("Удалить это бронирование? Место снова станет свободным."))return;
  await fbDeleteBooking(firebaseId);await refreshAdmin();
}

// ============================================
// ADMIN: REPORTS
// ============================================
async function renderReports(){
  const b=await fbGetBookings(),o=await fbGetOrders();
  const bookRevenue=b.reduce((s,x)=>s+Number(x.amount),0);
  const foodRevenue=o.filter(x=>x.status==="done").reduce((s,x)=>s+Number(x.total||0),0);
  const seats=b.reduce((s,x)=>s+seatsList(x.seats).length,0);
  animateCount("reportRevenue",bookRevenue+foodRevenue,x=>formatMoney(x));
  animateCount("reportAverage",b.length?bookRevenue/b.length:0,x=>formatMoney(x));
  animateCount("reportSeats",seats);
  animateCount("reportFood",foodRevenue,x=>formatMoney(x));
  const c=document.getElementById("movieReports");if(!c)return;
  const m=await fbGetMovies();
  const stats=m.map(movie=>{
    const bb=b.filter(x=>x.movieId===movie.id);
    return{movie,revenue:bb.reduce((s,x)=>s+Number(x.amount),0),seats:bb.reduce((s,x)=>s+seatsList(x.seats).length,0)};
  });
  const max=Math.max(...stats.map(x=>x.revenue),1);
  c.innerHTML=stats.map(x=>`<div class="rep-row"><div class="rep-head"><span><b>${escapeHtml(x.movie.title)}</b> · <span class="rep-seats">${x.seats} мест</span></span><strong>${formatMoney(x.revenue)}</strong></div><div class="bar-track"><span style="width:${x.revenue/max*100}%"></span></div></div>`).join("");
}

async function renderDailyReports(){
  const c=document.getElementById("dailyReportsList");if(!c)return;
  const reports=(await fbGetDailyReports()).slice().sort((a,b)=>b.date.localeCompare(a.date));
  c.innerHTML=reports.length?reports.map(r=>`<div class="arch-row"><div class="z">📅</div><div class="d"><b>${formatDate(r.date)}</b><small>${r.tickets} билетов · ${r.bookings} броней</small></div><div style="text-align:right"><b>${formatMoney(r.revenue)}</b><br><small style="color:var(--muted)">еда: ${r.foodRevenue!=null?formatMoney(r.foodRevenue):"—"}</small></div><button class="admin-chip delete" title="Удалить" onclick="deleteDailyReport('${r.firebaseId}')">🗑</button></div>`).join(""):"<p class='small-text'>Сохранённых отчётов пока нет. Нажмите «Сохранить отчёт за сегодня».</p>";
}

async function saveTodayReport(){
  const b=await fbGetBookings(),o=await fbGetOrders();
  const todayString=new Date().toISOString().slice(0,10);
  const todayStringLocal=tsDateStr(Date.now());
  const todays=b.filter(x=>x.date.slice(0,10)===todayString);
  const bookRevenue=todays.reduce((s,x)=>s+Number(x.amount),0);
  const tickets=todays.reduce((s,x)=>s+seatsList(x.seats).length,0);
  const foodRevenue=foodRevenueForDay(o,todayStringLocal);

  const reports=await fbGetDailyReports();
  const existing=reports.find(r=>r.date===todayStringLocal);
  if(existing){
    if(!confirm("Отчёт за сегодня уже сохранён. Обновить его текущими данными?"))return;
    await fbUpdateDailyReport(existing.firebaseId,{revenue:bookRevenue+foodRevenue,foodRevenue,bookRevenue,tickets,bookings:todays.length,savedAt:new Date().toISOString()});
  }else{
    await fbAddDailyReport({id:Date.now(),date:todayStringLocal,revenue:bookRevenue+foodRevenue,foodRevenue,bookRevenue,tickets,bookings:todays.length,savedAt:new Date().toISOString()});
  }
  await renderDailyReports();showToast("Отчёт за сегодня сохранён (билеты + еда)");
}

async function deleteDailyReport(firebaseId){
  if(!confirm("Удалить этот сохранённый отчёт? Сами бронирования это не затронет."))return;
  await fbDeleteDailyReport(firebaseId);await renderDailyReports();
}

// ============================================
// SITE CONTENT (admin)
// ============================================
async function fillContentForm(){
  const c=await fbGetSiteContent();
  const ids=["cHeroLabel","cHeroTitle1","cHeroTitle2","cHeroTitle3","cHeroText","cAboutEyebrow","cAboutTitle1","cAboutTitle2","cAboutText","cFeature1Title","cFeature1Text","cFeature2Title","cFeature2Text","cFeature3Title","cFeature3Text","cCtaEyebrow","cCtaTitle1","cCtaTitle2","cFooterText"];
  const keys=["heroLabel","heroTitle1","heroTitle2","heroTitle3","heroText","aboutEyebrow","aboutTitle1","aboutTitle2","aboutText","feature1Title","feature1Text","feature2Title","feature2Text","feature3Title","feature3Text","ctaEyebrow","ctaTitle1","ctaTitle2","footerText"];
  ids.forEach((id,i)=>{const e=document.getElementById(id);if(e)e.value=c[keys[i]]});
  const hp=document.getElementById("cHeroImagePreview");if(hp){hp.src=c.heroImage;hp.classList.remove("hidden")}
  const hi=document.getElementById("cHeroImage");if(hi)hi.value="";
}

function previewContentImage(input,previewId){
  const p=document.getElementById(previewId);
  const file=input.files&&input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{p.src=reader.result;p.classList.remove("hidden")};
  reader.readAsDataURL(file);
}

async function saveSiteContentForm(){
  const btn=document.getElementById("saveContentBtn"),current=await fbGetSiteContent(),
        fileInput=document.getElementById("cHeroImage"),file=fileInput.files&&fileInput.files[0];
  let heroImage=current.heroImage;
  if(file){btn.disabled=true;btn.textContent="Сохранение фото...";
    try{heroImage=await resizeImageFile(file,1800,.82)}
    catch(err){alert("Не удалось загрузить фото, оставлено прежнее.")}
  }
  const updated={
    ...current,
    heroLabel:document.getElementById("cHeroLabel").value.trim(),
    heroTitle1:document.getElementById("cHeroTitle1").value.trim(),
    heroTitle2:document.getElementById("cHeroTitle2").value.trim(),
    heroTitle3:document.getElementById("cHeroTitle3").value.trim(),
    heroText:document.getElementById("cHeroText").value.trim(),
    heroImage,
    aboutEyebrow:document.getElementById("cAboutEyebrow").value.trim(),
    aboutTitle1:document.getElementById("cAboutTitle1").value.trim(),
    aboutTitle2:document.getElementById("cAboutTitle2").value.trim(),
    aboutText:document.getElementById("cAboutText").value.trim(),
    feature1Title:document.getElementById("cFeature1Title").value.trim(),
    feature1Text:document.getElementById("cFeature1Text").value.trim(),
    feature2Title:document.getElementById("cFeature2Title").value.trim(),
    feature2Text:document.getElementById("cFeature2Text").value.trim(),
    feature3Title:document.getElementById("cFeature3Title").value.trim(),
    feature3Text:document.getElementById("cFeature3Text").value.trim(),
    ctaEyebrow:document.getElementById("cCtaEyebrow").value.trim(),
    ctaTitle1:document.getElementById("cCtaTitle1").value.trim(),
    ctaTitle2:document.getElementById("cCtaTitle2").value.trim(),
    footerText:document.getElementById("cFooterText").value.trim()
  };
  await fbSaveSiteContent(updated);
  btn.disabled=false;btn.textContent="Сохранить изменения";
  await fillContentForm();showToast("Изменения сайта сохранены");
}

function resetSiteContent(){
  if(!confirm("Вернуть все тексты и фото на главной к значениям по умолчанию?"))return;
  fbSaveSiteContent(DEFAULT_CONTENT).then(()=>{fillContentForm();showToast("Восстановлены значения по умолчанию")});
}

// ============================================
// MENU (админ: список, модалка, тумблер «нет сегодня»)
// ============================================
function openMenuItemModal(){
  document.getElementById("menuItemName").value="";
  document.getElementById("menuItemPrice").value="";
  document.getElementById("menuItemCategory").value="Закуски";
  document.getElementById("menuItemModal").classList.add("open");
}
function closeMenuItemModal(){document.getElementById("menuItemModal").classList.remove("open")}

async function saveMenuItem(e){
  e.preventDefault();
  const name=document.getElementById("menuItemName").value.trim();
  const price=Number(document.getElementById("menuItemPrice").value);
  const category=document.getElementById("menuItemCategory").value.trim();
  if(!name||isNaN(price))return alert("Заполните название и цену.");
  await fbAddMenuItem({name,price,category,availableToday:true});
  closeMenuItemModal();await renderAdminMenu();
}

async function toggleMenuItemAvailability(firebaseId,current){
  // Менять «нет сегодня» могут владелец и оператор заказов
  if(!can("menu"))return showToast("У вас нет прав на это действие","error");
  await fbUpdateMenu(firebaseId,{availableToday:!current});
  await renderAdminMenu();
}

async function deleteMenuItem(firebaseId){
  // Удалять позиции может только владелец
  const u=getCurrentUser();if(!u||u.role!=="owner")return showToast("Удалять позиции может только владелец","error");
  if(!confirm("Удалить позицию из меню?"))return;
  await fbDeleteMenuItem(firebaseId);await renderAdminMenu();
}

async function renderAdminMenu(){
  const c=document.getElementById("adminMenuList");if(!c)return;
  const isOwner=!getCurrentUser()||getCurrentUser().role==="owner";
  let items;
  try{items=await fbGetMenu()}catch(e){c.innerHTML="<p class='small-text'>Не удалось загрузить меню. Проверьте, что в Firestore открыт доступ к коллекции menu.</p>";return}
  if(!items.length){c.innerHTML="<p class='small-text'>Меню пустое.</p>";return}
  const CAT={Закуски:"🍿",Горячее:"🍗",Напитки:"🥤",Десерты:"🍰",Другое:"🍽"};
  const cats={};items.forEach(i=>{const cat=i.category||"Другое";(cats[cat]=cats[cat]||[]).push(i)});
  const order=["Закуски","Горячее","Напитки","Десерты","Другое"];
  let html="";
  order.forEach(cat=>{
    if(!cats[cat])return;
    const ico=CAT[cat]||"🍽";
    html+=`<div class="menu-group"><div class="menu-group-title">${ico} ${escapeHtml(cat)}</div><div class="menu-grid">`;
    html+=cats[cat].map(m=>{
      const on=m.availableToday!==false;
      return `<div class="menu-card ${on?"":"off"}"><div class="menu-emoji">${ico}</div><div class="menu-info"><b>${escapeHtml(m.name)}</b><small>${on?(escapeHtml(m.category||"")):"нет сегодня"}</small><span class="menu-price">${formatMoney(m.price)}</span></div><span class="switch ${on?"on":""}" role="button" title="${on?"Нажмите — скрыть с сегодняшнего меню":"Нажмите — вернуть в меню"}" onclick="toggleMenuItemAvailability('${m.firebaseId}',${on})"></span>${isOwner?`<button class="admin-chip delete" title="Удалить" onclick="deleteMenuItem('${m.firebaseId}')">🗑</button>`:""}</div>`;
    }).join("");
    html+=`</div></div>`;
  });
  c.innerHTML=html;
}

// ============================================
// FOOD ORDERS (админ: входящие заказы, статусы, сброс кодов)
// ============================================
// Дата (YYYY-MM-DD) в локальной таймзоне из timestamp
function tsDateStr(ts){const d=new Date(Number(ts)||0);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
// День, к которому относится выручка заказа: дата выдачи (doneAt) — момент получения денег.
function orderIncomeDate(o){return tsDateStr(o.doneAt||o.createdAt)}
// Сумма выданных заказов за конкретную локальную дату
function foodRevenueForDay(orders,dateStr){return orders.filter(o=>o.status==="done"&&orderIncomeDate(o)===dateStr).reduce((s,x)=>s+Number(x.total||0),0)}

async function renderAdminOrders(){
  const c=document.getElementById("adminOrdersList");if(!c)return;
  await cleanupExpiredCodes();
  let orders;
  try{orders=await fbGetOrders()}catch(e){c.innerHTML="<p class='small-text'>Не удалось загрузить заказы. Проверьте доступ Firestore к коллекции foodOrders.</p>";return}
  if(!orders.length){c.innerHTML="<p class='small-text'>Заказов пока нет.</p>";return}
  c.innerHTML=orders.map(o=>{
    const t=o.status||"new";
    const s1=t==="new"?"current":(t==="ready"||t==="done")?"done":"";
    const s2=t==="ready"?"current":t==="done"?"done":"";
    const s3=t==="done"?"current":"";
    const b1=(t==="ready"||t==="done")?"done":"";
    const b2=t==="done"?"done":"";
    const steps=`<span class="step ${s1}"><span class="step-dot">1</span><span class="step-label">Новый</span></span><span class="step-bar ${b1}"></span><span class="step ${s2}"><span class="step-dot">2</span><span class="step-label">Готов</span></span><span class="step-bar ${b2}"></span><span class="step ${s3}"><span class="step-dot">✓</span><span class="step-label">Выдан</span></span>`;
    const meta=(o.code?`<span class="meta-chip">🍴 Код: <span class="mi">${escapeHtml(o.code)}</span></span>`:"")
      +(o.movieTitle?`<span class="meta-chip">🎬 ${escapeHtml(o.movieTitle)}</span>`:"")
      +(seatsList(o.seats).length?`<span class="meta-chip">💺 ${escapeHtml(seatsList(o.seats).join(", "))}</span>`:"");
    const itemsStr=(o.items||[]).map(i=>`<span class="item-chip"><span class="qty">${i.qty}</span>${escapeHtml(i.name)}</span>`).join("");
    let action="";
    if(t==="new")action=`<button class="btn-stepper gold" onclick="setOrderStatus('${o.firebaseId}','ready')">👨‍🍳 Готов</button>`;
    else if(t==="ready")action=`<button class="btn-stepper green" onclick="setOrderStatus('${o.firebaseId}','done')">💵 Выдан</button>`;
    else action=`<button class="btn-stepper dark" onclick="deleteOrder('${o.firebaseId}')">🗑 Удалить</button>`;
    return `<div class="order-card"><div class="order-head"><div class="order-code-box"><span class="label">Код заказа</span><span class="code">${escapeHtml(o.code||"—")}</span></div><div class="order-time"><b>${o.createdAt?new Date(o.createdAt).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}):"—"}</b>${o.createdAt?new Date(o.createdAt).toLocaleDateString("ru-RU",{day:"numeric",month:"short"}):""}</div></div><div class="order-meta">${meta}</div><div class="order-items">${itemsStr}</div><div class="order-foot"><div class="order-steps">${steps}</div><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><span class="order-total">${formatMoney(o.total)}</span>${action}</div></div></div>`;
  }).join("");
}

async function setOrderStatus(firebaseId,status){
  const update={status};
  if(status==="done")update.doneAt=Date.now(); // момент получения денег
  await fbUpdateOrder(firebaseId,update);await renderAdminOrders();await renderAdminCash();
}

// Удалить можно только выданный заказ (деньги уже получены — это кассовый чек)
async function deleteOrder(firebaseId){
  if(!confirm("Удалить этот выданный заказ? Он уйдёт из кассы (выручка за день уменьшится)."))return;
  await fbDeleteOrder(firebaseId);await renderAdminOrders();await renderAdminCash();
}

// ============================================
// CASH (касса оператора заказов: только выручка с еды)
// ============================================
async function renderAdminCash(){
  const c=document.getElementById("adminCashList");if(!c)return;
  let orders;
  try{orders=await fbGetOrders()}catch(e){setText("cashToday","—");setText("cashTodayCount","—");c.innerHTML="<p class='small-text'>Не удалось загрузить кассу. Проверьте доступ Firestore к коллекции foodOrders.</p>";return}
  const todayStr=tsDateStr(Date.now());
  const todayRevenue=foodRevenueForDay(orders,todayStr);
  const todayCount=orders.filter(o=>o.status==="done"&&orderIncomeDate(o)===todayStr).length;
  animateCount("cashToday",todayRevenue,x=>formatMoney(x));
  animateCount("cashTodayCount",todayCount);
  const reports=(await fbGetFoodReports()).slice().sort((a,b)=>b.date.localeCompare(a.date));
  c.innerHTML=reports.length?reports.map(r=>`<div class="arch-row"><div class="z">🍟</div><div class="d"><b>${formatDate(r.date)}</b><small>${r.orders} заказов выдано</small></div><div style="text-align:right"><b>${formatMoney(r.revenue)}</b></div><button class="admin-chip delete" title="Удалить" onclick="deleteFoodReport('${r.firebaseId}')">🗑</button></div>`).join(""):"<p class='small-text'>Сохранённых отчётов кассы нет.</p>";
}

async function saveFoodReportToday(){
  const orders=await fbGetOrders();
  const todayStr=tsDateStr(Date.now());
  const revenue=foodRevenueForDay(orders,todayStr);
  const count=orders.filter(o=>o.status==="done"&&orderIncomeDate(o)===todayStr).length;
  if(revenue<=0&&!confirm("За сегодня ещё нет выручки с заказов. Всё равно сохранить отчёт?"))return;
  const reports=await fbGetFoodReports();
  const existing=reports.find(r=>r.date===todayStr);
  if(existing){
    if(!confirm("Отчёт кассы за сегодня уже сохранён. Обновить его текущими данными?"))return;
    await fbUpdateFoodReport(existing.firebaseId,{revenue,orders:count,savedAt:new Date().toISOString()});
  }else{
    await fbAddFoodReport({id:Date.now(),date:todayStr,revenue,orders:count,savedAt:new Date().toISOString()});
  }
  await renderAdminCash();showToast("Отчёт кассы за сегодня сохранён");
}

async function deleteFoodReport(firebaseId){
  if(!confirm("Удалить этот отчёт кассы?"))return;
  await fbDeleteFoodReport(firebaseId);await renderAdminCash();
}

// ============================================
// ORDER PAGE (order.html) — заказ еды по коду
// ============================================
let currentOrderCode=null,currentOrderSeats=null,currentOrderMovieTitle=null;
let orderCart=[]; // [{name,price,qty}]

async function initOrderPage(){
  orderCart=[];currentOrderCode=null;currentOrderSeats=null;currentOrderMovieTitle=null;
  await cleanupExpiredCodes();
  renderOrderCart();
}

async function validateOrderCode(){
  const input=document.getElementById("orderCodeInput");
  const code=(input?input.value:"").trim().toUpperCase();
  if(!code)return alert("Введите код.");
  let codes=[];
  try{codes=await fbGetAccessCodes()}catch(e){return alert("Коды временно недоступны. Попробуйте позже.")}
  const match=codes.find(c=>c.code===code);
  if(!match)return alert("Код не найден или истёк.");
  const now=Date.now();
  if(match.expiresAt&&Number(match.expiresAt)<now)return alert("Срок действия кода истёк. Попросите новый код у сотрудника.");
  currentOrderCode=match.code;
  currentOrderSeats=match.seats;
  const movies=await fbGetMovies();
  const mv=movies.find(m=>m.id===match.movieId);
  currentOrderMovieTitle=mv?mv.title:"";
  document.getElementById("orderCodeSection").classList.add("hidden");
  document.getElementById("orderMenuSection").classList.remove("hidden");
  document.getElementById("orderSeatInfo").textContent="Места: "+(seatsList(match.seats).join(", ")||"—")+(currentOrderMovieTitle?" · "+currentOrderMovieTitle:"");
  await renderOrderMenu();
}

function orderBackToCode(){
  orderCart=[];currentOrderCode=null;
  document.getElementById("orderMenuSection").classList.add("hidden");
  document.getElementById("orderCodeSection").classList.remove("hidden");
  document.getElementById("orderCodeInput").value="";
  renderOrderCart();
}

async function renderOrderMenu(){
  const c=document.getElementById("orderMenuItems");if(!c)return;
  let items;
  try{items=await fbGetMenu()}catch(e){c.innerHTML="<p>Меню временно недоступно. Подойдите к киоску.</p>";return}
  const available=items.filter(m=>m.availableToday!==false);
  if(!available.length){c.innerHTML="<p>На сегодня ничего нет. Попробуйте позже.</p>";return}
  const cats={};available.forEach(m=>{const cat=m.category||"Другое";if(!cats[cat])cats[cat]=[];cats[cat].push(m)});
  let html="";
  for(const cat in cats){
    html+=`<div class="menu-category"><h3>${escapeHtml(cat)}</h3>`;
    html+=cats[cat].map(m=>`<div class="menu-item-card"><div class="menu-item-info"><span class="menu-item-name">${escapeHtml(m.name)}</span><span class="menu-item-price">${formatMoney(m.price)}</span></div><button class="btn-add" onclick="addToOrder(${JSON.stringify(m).replace(/"/g,"&quot;")})">+ Добавить</button></div>`).join("");
    html+=`</div>`;
  }
  c.innerHTML=html;
}

function addToOrder(item){
  const existing=orderCart.find(c=>c.name===item.name);
  if(existing)existing.qty++;
  else orderCart.push({name:item.name,price:item.price,qty:1});
  renderOrderCart();
}

function removeFromOrder(idx){
  if(orderCart[idx].qty>1)orderCart[idx].qty--;
  else orderCart.splice(idx,1);
  renderOrderCart();
}

function renderOrderCart(){
  const c=document.getElementById("orderCart");if(!c)return;
  const total=orderCart.reduce((s,i)=>s+i.price*i.qty,0);
  if(!orderCart.length){c.innerHTML="<p class='empty-cart'>Корзина пуста</p>";document.getElementById("orderTotal").textContent="0 ₽";return}
  c.innerHTML=orderCart.map((item,i)=>`<div class="cart-item"><span>${escapeHtml(item.name)} × ${item.qty}</span><span>${formatMoney(item.price*item.qty)}</span><button class="cart-remove" onclick="removeFromOrder(${i})">✕</button></div>`).join("");
  document.getElementById("orderTotal").textContent=formatMoney(total);
}

async function placeOrder(){
  if(!currentOrderCode)return alert("Сначала введите код.");
  if(!orderCart.length)return alert("Корзина пуста.");
  const total=orderCart.reduce((s,i)=>s+i.price*i.qty,0);
  await fbAddOrder({
    code:currentOrderCode,
    seats:currentOrderSeats,
    movieTitle:currentOrderMovieTitle,
    items:[...orderCart],
    total,
    status:"new",
    createdAt:Date.now()
  });
  orderCart=[];
  document.getElementById("orderMenuSection").classList.add("hidden");
  document.getElementById("orderConfirmSection").classList.remove("hidden");
}

function orderMore(){
  document.getElementById("orderConfirmSection").classList.add("hidden");
  document.getElementById("orderCodeSection").classList.remove("hidden");
  document.getElementById("orderCodeInput").value="";
  renderOrderCart();
  currentOrderCode=null;currentOrderSeats=null;currentOrderMovieTitle=null;
}

// ============================================
// TICKET SUCCESS & QR
// ============================================
let activeTicket=null,scanner=null,scanLock=false,restartTimer=null,lastCode=null,lastCodeAt=0;

function showTicketSuccess(b){
  activeTicket=b;
  document.getElementById("ticketMovie").textContent=b.movieTitle;
  document.getElementById("ticketSeats").textContent=seatsList(b.seats).join(", ")||"—";
  document.getElementById("ticketCode").textContent=b.ticketCode;
  const q=document.getElementById("ticketQR");q.innerHTML="";
  new QRCode(q,{text:JSON.stringify({ticketCode:b.ticketCode,id:b.id}),width:190,height:190});
  document.getElementById("ticketSuccessModal").classList.add("open");
}

function closeTicketSuccess(){document.getElementById("ticketSuccessModal").classList.remove("open")}

function saveTicket(){
  const t=activeTicket;if(!t)return;
  const blob=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),
        x=document.createElement("a");x.href=URL.createObjectURL(blob);x.download=t.ticketCode+".ticket.json";x.click();
}

function walletInfo(){alert("Для настоящего Apple Wallet / Google Wallet нужен сервер, сертификаты и подписанный цифровой пропуск. QR-билет уже работает.")}

// ============================================
// КОДЫ ЗАКАЗА ЕДЫ (генерируются при проверке билета)
// Один код — на непрерывную группу мест одного бронирования.
// ============================================
function parseSeat(sn){const m=String(sn).match(/^([A-Z])(\d+)$/);return m?{row:m[1],n:Number(m[2])}:null}

// Приводит места к массиву строк — защита от пустого/строкового формата в БД
function seatsList(s){
  if(Array.isArray(s))return s.map(x=>String(x).trim()).filter(Boolean);
  if(typeof s==="string")return s.split(",").map(x=>x.trim()).filter(Boolean);
  return [];
}

function splitSeatGroups(seats){
  const arr=seats.map(parseSeat).filter(Boolean).sort((a,b)=>a.row<b.row?-1:a.row>b.row?1:a.n-b.n);
  const groups=[];
  for(const s of arr){
    const g=groups[groups.length-1];
    if(g&&g[g.length-1].row===s.row&&g[g.length-1].n+1===s.n)g.push(s);
    else groups.push([s]);
  }
  return groups.map(g=>g.map(x=>x.row+x.n));
}

// Код — только цифры, 4 знака (0000–9999). Проверяется уникальность среди активных кодов.
async function generateUniqueCode(){
  const existing=await fbGetAccessCodes();
  const taken=new Set(existing.map(c=>c.code));
  let code="";
  do{code=String(Math.floor(Math.random()*10000)).padStart(4,"0")}while(taken.has(code));
  return code;
}

// Возвращает коды для брони: если уже были сгенерированы (та же бронь, те же места) — возвращает их,
// иначе создаёт по одному коду на каждую группу мест. expiresAt — конец фильма + 15 минут.
async function ensureSeatCodes(booking){
  const groups=splitSeatGroups(seatsList(booking.seats));
  if(!groups.length)return [];
  const codes=await fbGetAccessCodes();
  const already=codes.filter(c=>c.bookingId===booking.firebaseId);
  if(already.length)return already;
  const movies=await fbGetMovies();
  const mv=movies.find(m=>m.id===booking.movieId);
  const expiresAt=mv?new Date(new Date(`${mv.date}T${mv.time}:00`).getTime()+(Number(mv.duration)||120)*60000+15*60000).getTime():Date.now()+3*3600000;
  const created=[];
  for(const g of groups){
    const code=await generateUniqueCode();
    const doc={code,bookingId:booking.firebaseId,movieId:booking.movieId,seats:g,allSeats:seatsList(booking.seats),createdAt:Date.now(),expiresAt};
    const firebaseId=await fbAddAccessCode(doc);
    created.push({firebaseId,...doc});
  }
  return created;
}

async function getCodesForBooking(bookingId){
  return (await fbGetAccessCodes()).filter(c=>c.bookingId===bookingId);
}

// Удаляет коды истёкших сеансов ("после просмотра фильма сбрасывается из базы").
async function cleanupExpiredCodes(){
  try{
    const codes=await fbGetAccessCodes();
    const now=Date.now();
    for(const c of codes){if(Number(c.expiresAt)&&Number(c.expiresAt)<now)await fbDeleteAccessCode(c.firebaseId)}
  }catch(e){}
}

function renderCodesHtml(codes){
  if(!codes||!codes.length)return "";
  return codes.map(c=>`<div class="order-code-line">🍴 Код заказа: <strong>${escapeHtml(c.code)}</strong> <small>(места: ${escapeHtml(seatsList(c.seats).join(", "))})</small></div>`).join("");
}

async function resetAllCodes(){
  if(!confirm("Сбросить все коды заказов? Коды будут очищены из базы."))return;
  for(const c of await fbGetAccessCodes())await fbDeleteAccessCode(c.firebaseId);
  await renderAdminOrders();showToast("Все коды заказов сброшены");
}

// ============================================
// QR SCANNER
// ============================================
function stopScanner(){
  cancelRestart();
  if(!scanner)return;
  const s=scanner;scanner=null;
  try{s.stop().then(()=>s.clear().catch(()=>{})).catch(()=>{})}catch(e){}
  const bs=document.getElementById("btnStopScanner"),bn=document.getElementById("btnStartScanner");
  if(bs)bs.classList.add("hidden");
  if(bn)bn.classList.remove("hidden");
}
function restartScannerSoon(ms){
  cancelRestart();
  restartTimer=setTimeout(()=>{restartTimer=null;startScanner()},ms);
}
function cancelRestart(){
  if(restartTimer){clearTimeout(restartTimer);restartTimer=null;}
}

async function startScanner(){
  if(!can("scan"))return alert("У вас нет права на сканирование QR.");
  if(typeof Html5Qrcode==="undefined"){document.getElementById("scanResult").textContent="Сканер не загрузился.";return}
  if(scanner)stopScanner();
  const bs=document.getElementById("btnStopScanner"),bn=document.getElementById("btnStartScanner");
  if(bs)bs.classList.remove("hidden");
  if(bn)bn.classList.add("hidden");
  scanner=new Html5Qrcode("reader");
  scanner.start({facingMode:"environment"},{fps:15,qrbox:{width:280,height:180}},async txt=>{
    if(scanLock)return;
    const code=String(txt||"").trim();
    const now=Date.now();
    if(code&&code===lastCode&&now-lastCodeAt<3000)return;
    scanLock=true;
    stopScanner();
    const r=document.getElementById("scanResult");
    r.innerHTML="<h3>⏳ Проверяю билет…</h3>";
    let b=null;
    try{
      const d=JSON.parse(txt);
      const bookings=await fbGetBookings();
      b=bookings.find(x=>x.ticketCode===d.ticketCode||x.id==d.id);
    }catch(e){
      const bookings=await fbGetBookings();
      b=bookings.find(x=>x.ticketCode===code||String(x.id)===code);
    }
    lastCode=code;lastCodeAt=Date.now();
    if(!b){
      r.innerHTML="<h3>✕ Билет не найден</h3><p>Проверьте QR-код.</p>";
      scanLock=false;
      restartScannerSoon(2000);
      return;
    }
    const seatStr=seatsList(b.seats).join(", ")||"—";
    if(b.checkedIn){
      let exCodes=[];
      try{exCodes=await getCodesForBooking(b.firebaseId)}catch(e1){}
      r.innerHTML="<h3>⚠ Билет уже использован</h3><p><b>Фильм:</b> "+escapeHtml(b.movieTitle)+"</p><p><b>Место:</b> <strong>"+escapeHtml(seatStr)+"</strong></p>"+renderCodesHtml(exCodes);
      scanLock=false;
      restartScannerSoon(2500);
      return;
    }
    window.lastScannedBookingId=b.firebaseId;
    let codes=[],codeErr=false;
    try{codes=await ensureSeatCodes(b)}catch(e2){codeErr=true}
    r.innerHTML="<h3>✓ Билет найден</h3><p><b>Фильм:</b> "+escapeHtml(b.movieTitle)+"</p><p><b>Клиент:</b> "+escapeHtml(b.customerName)+"</p><p><b>Место:</b> <strong>"+escapeHtml(seatStr)+"</strong></p><p><b>Статус:</b> Можно пропустить</p>"+(codeErr?"<p class='small-text' style='color:var(--red)'>Не удалось выдать код заказа — проверьте доступ к Firestore (коллекция accessCodes).</p>":"")+renderCodesHtml(codes)+"<button class='button button-main' onclick='checkInScanned()'>Пропустить гостя</button>";
    scanLock=false;
  }).catch(()=>{document.getElementById("scanResult").textContent="Не удалось включить камеру. Разрешите доступ к камере."});
}

async function checkInScanned(){
  const firebaseId=window.lastScannedBookingId;
  const bookings=await fbGetBookings();
  const b=bookings.find(x=>x.firebaseId===firebaseId);
  if(!b)return;
  if(b.checkedIn)return alert("Билет уже использован.");
  await fbUpdateBooking(firebaseId,{checkedIn:true,checkedInAt:new Date().toISOString(),checkedInBy:(getCurrentUser()||{}).login||"admin"});
  window.lastScannedBookingId=null;
  document.getElementById("scanResult").innerHTML="<h3>✓ Гость пропущен</h3><p>Место: <strong>"+escapeHtml(seatsList(b.seats).join(", ")||"—")+"</strong></p><p>Повторный проход по этому QR будет запрещён.</p>";
  restartScannerSoon(2000);
}

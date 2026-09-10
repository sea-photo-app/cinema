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
  bookings.filter(b=>b.movieId===currentMovie.id).forEach(b=>b.seats.forEach(x=>occupied.push(x)));
  map.innerHTML="";
  for(let r=0;r<4;r++)for(let n=1;n<=10;n++){
    const sn=`${String.fromCharCode(65+r)}${n}`,b=document.createElement("button");
    b.className="seat";b.textContent=sn;
    if(occupied.includes(sn)){b.classList.add("occupied");b.disabled=true}
    else b.onclick=()=>selectSeat(sn,b);
    map.appendChild(b);
  }
}

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
  bookings.filter(b=>b.movieId===currentMovie.id).forEach(b=>b.seats.forEach(s=>occupied.push(s)));
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
  closeBookingModal();e.target.reset();await loadSeats();
  showTicketSuccess(booking);
}

// ============================================
// ADMIN BOOKING MODAL
// ============================================
async function openAdminBookingModal(){await populateFilmSelect();await loadSeats();document.getElementById("adminBookingModal").classList.add("open")}
function closeAdminBookingModal(){document.getElementById("adminBookingModal").classList.remove("open")}

async function confirmAdminBooking(e){
  e.preventDefault();
  if(!currentMovie)return alert("Выберите фильм.");
  if(!selectedSeats.length)return alert("Выберите хотя бы одно свободное место.");

  const bookings=await fbGetBookings();
  const occupied=[];
  bookings.filter(b=>b.movieId===currentMovie.id).forEach(b=>b.seats.forEach(s=>occupied.push(s)));
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
  e.target.reset();closeAdminBookingModal();await refreshAdmin();
  alert(`Бронь без оплаты создана.\n\nФильм: ${currentMovie.title}\nМеста: ${selectedSeats.join(", ")}`);
}

// ============================================
// EMPLOYEES
// ============================================
async function renderEmployeeTable(){
  const c=document.getElementById("employeesList");if(!c)return;
  const es=await fbGetEmployees();
  c.innerHTML=es.length?`<div class="employee-grid">${es.map(e=>`<div class="employee-card"><div><h3>${escapeHtml(e.name||e.login)}</h3><p class="small-text">Логин: ${escapeHtml(e.login)}</p></div><div class="permission-list"><label><input type="checkbox" ${e.scan?"checked":""} onchange="toggleEmployeePermission('${e.firebaseId}','scan',this.checked)"> Сканировать QR</label><label><input type="checkbox" ${e.movies?"checked":""} onchange="toggleEmployeePermission('${e.firebaseId}','movies',this.checked)"> Управлять афишей</label><label><input type="checkbox" ${e.bookings?"checked":""} onchange="toggleEmployeePermission('${e.firebaseId}','bookings',this.checked)"> Смотреть бронирования</label></div><div class="employee-actions"><span class="status-pill ${e.active!==false?'status-ok':'status-off'}">${e.active!==false?'Активен':'Заблокирован'}</span><button class="admin-action" onclick="toggleEmployeeActive('${e.firebaseId}')">${e.active!==false?'Заблокировать':'Разблокировать'}</button><button class="admin-action delete-action" onclick="deleteEmployee('${e.firebaseId}')">Удалить</button></div></div>`).join("")}</div>`:"<p>Сотрудников пока нет.</p>";
}

function openEmployeeModal(){document.getElementById("employeeModal").classList.add("open")}
function closeEmployeeModal(){document.getElementById("employeeModal").classList.remove("open");document.getElementById("employeeForm").reset()}

async function saveEmployee(e){
  e.preventDefault();
  const login=document.getElementById("employeeLogin").value.trim(),
        password=document.getElementById("employeePassword").value,
        name=document.getElementById("employeeName").value.trim()||login;
  const es=await fbGetEmployees();
  if(es.some(x=>x.login.toLowerCase()===login.toLowerCase()))return alert("Такой логин уже существует.");
  await fbAddEmployee({login,password,name,
    scan:document.getElementById("permScan").checked,
    movies:document.getElementById("permMovies").checked,
    bookings:document.getElementById("permBookings").checked,
    active:true});
  closeEmployeeModal();await renderEmployeeTable();alert("Сотрудник создан.");
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
  sessionStorage.setItem("beachUser",JSON.stringify({...e,role:"employee"}));
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
  applyPermissions();refreshAdmin();
}

function adminLogout(){sessionStorage.removeItem("beachAdmin");sessionStorage.removeItem("beachUser");location.reload()}

function applyPermissions(){
  const u=getCurrentUser()||{role:"owner"},owner=u.role==="owner";
  document.querySelectorAll("[data-permission]").forEach(el=>{const p=el.dataset.permission;el.classList.toggle("hidden",!owner&&!u[p])});
  const title=document.getElementById("adminRoleLabel");if(title)title.textContent=owner?"ВЛАДЕЛЕЦ":"СОТРУДНИК";
}

function showAdminPage(page,button){
  const u=getCurrentUser()||{role:"owner"},owner=u.role==="owner",perms={scanner:"scan",movies:"movies",bookings:"bookings"};
  if(!owner&&perms[page]&&!u[perms[page]]){alert("У вас нет прав на этот раздел.");return}
  if(page!=="scanner")stopScanner();
  document.querySelectorAll(".admin-page").forEach(x=>x.classList.add("hidden"));
  document.querySelectorAll(".admin-nav").forEach(x=>x.classList.remove("active"));
  const ids={dashboard:"adminDashboard",movies:"adminMovies",announcements:"adminAnnouncements",bookings:"adminBookings",reports:"adminReports",scanner:"adminScanner",content:"adminContent",employees:"adminEmployees"};
  if(!ids[page])return;
  document.getElementById(ids[page]).classList.remove("hidden");
  if(button)button.classList.add("active");
  if(page==="content")fillContentForm();
  if(page==="employees")renderEmployeeTable();
  refreshAdmin();
}

async function refreshAdmin(){
  await Promise.all([
    renderAdminStats(),renderDashboardBookings(),renderAdminMovies(),
    renderAdminAnnouncements(),renderAdminBookings(),renderReports(),
    renderDailyReports(),renderEmployeeTable()
  ]);
}

// ============================================
// ADMIN: STATS & DASHBOARD
// ============================================
async function renderAdminStats(){
  const b=await fbGetBookings(),m=await fbGetMovies();
  const total=b.reduce((s,x)=>s+Number(x.amount),0);
  const todayString=new Date().toISOString().slice(0,10);
  const today=b.filter(x=>x.date.slice(0,10)===todayString).reduce((s,x)=>s+Number(x.amount),0);
  setText("statToday",formatMoney(today));
  setText("statTotal",formatMoney(total));
  setText("statTickets",b.reduce((s,x)=>s+x.seats.length,0));
  setText("statMovies",m.length);
}

async function renderDashboardBookings(){
  const c=document.getElementById("dashboardBookings");if(!c)return;
  const b=(await fbGetBookings()).slice().reverse().slice(0,8);
  c.innerHTML=b.length?`<table class="admin-table"><thead><tr><th>Клиент</th><th>Фильм</th><th>Места</th><th>Статус</th><th>Сумма</th></tr></thead><tbody>${b.map(x=>`<tr><td>${escapeHtml(x.customerName)}</td><td>${escapeHtml(x.movieTitle)}</td><td>${x.seats.join(", ")}</td><td>${escapeHtml(x.status||"Оплачено")}</td><td><strong>${formatMoney(x.amount)}</strong></td></tr>`).join("")}</tbody></table>`:"<p>Пока бронирований нет.</p>";
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
  closeMovieModal();await refreshAdmin();alert("Фильм добавлен.");
}

async function deleteMovie(firebaseId){
  if(!confirm("Удалить этот фильм?"))return;
  await fbDeleteMovie(firebaseId);await refreshAdmin();
}

async function renderAdminMovies(){
  const c=document.getElementById("adminMoviesList");if(!c)return;
  const m=await fbGetMovies();
  c.innerHTML=m.length?m.map(x=>`<div class="admin-movie-row"><div><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.genre)} · ${formatDate(x.date)} · ${x.time} · ${x.duration||120} мин · ${formatMoney(x.price)}</p></div><div class="admin-actions"><button class="admin-action delete-action" onclick="deleteMovie('${x.firebaseId}')">Удалить</button></div></div>`).join(""):"<p>Фильмов пока нет.</p>";
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
  e.target.reset();closeAnnouncementModal();await refreshAdmin();alert("Объявление опубликовано.");
}

async function deleteAnnouncement(firebaseId){
  if(!confirm("Удалить объявление?"))return;
  await fbDeleteAnnouncement(firebaseId);await refreshAdmin();
}

async function renderAdminAnnouncements(){
  const c=document.getElementById("adminAnnouncementsList");if(!c)return;
  const a=await fbGetAnnouncements();
  c.innerHTML=a.length?a.map(x=>`<div class="admin-movie-row"><div><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.text)}</p><p>${x.date}</p></div><div><button class="admin-action delete-action" onclick="deleteAnnouncement('${x.firebaseId}')">Удалить</button></div></div>`).join(""):"<p>Объявлений пока нет.</p>";
}

// ============================================
// ADMIN: BOOKINGS
// ============================================
async function renderAdminBookings(){
  const c=document.getElementById("adminBookingsList");if(!c)return;
  const b=(await fbGetBookings()).slice().reverse();
  c.innerHTML=b.length?`<table class="admin-table"><thead><tr><th>Дата</th><th>Клиент</th><th>Телефон</th><th>Фильм</th><th>Места</th><th>Статус</th><th>Сумма</th><th></th></tr></thead><tbody>${b.map(x=>`<tr><td>${new Date(x.date).toLocaleDateString("ru-RU")}</td><td>${escapeHtml(x.customerName)}</td><td>${escapeHtml(x.customerPhone||"—")}</td><td>${escapeHtml(x.movieTitle)}</td><td>${x.seats.join(", ")}</td><td>${escapeHtml(x.status||"Оплачено")}</td><td><strong>${formatMoney(x.amount)}</strong></td><td><button class="admin-action delete-action" onclick="deleteBooking('${x.firebaseId}')">Удалить</button></td></tr>`).join("")}</tbody></table>`:"<p>Бронирований пока нет.</p>";
}

async function deleteBooking(firebaseId){
  if(!confirm("Удалить это бронирование? Место снова станет свободным."))return;
  await fbDeleteBooking(firebaseId);await refreshAdmin();
}

// ============================================
// ADMIN: REPORTS
// ============================================
async function renderReports(){
  const b=await fbGetBookings();
  const revenue=b.reduce((s,x)=>s+Number(x.amount),0);
  const seats=b.reduce((s,x)=>s+x.seats.length,0);
  setText("reportRevenue",formatMoney(revenue));
  setText("reportAverage",formatMoney(b.length?revenue/b.length:0));
  setText("reportSeats",seats);
  const c=document.getElementById("movieReports");if(!c)return;
  const m=await fbGetMovies();
  const stats=m.map(movie=>{
    const bb=b.filter(x=>x.movieId===movie.id);
    return{movie,revenue:bb.reduce((s,x)=>s+Number(x.amount),0),seats:bb.reduce((s,x)=>s+x.seats.length,0)};
  });
  const max=Math.max(...stats.map(x=>x.revenue),1);
  c.innerHTML=stats.map(x=>`<div class="report-bar"><div class="report-bar-title"><span>${escapeHtml(x.movie.title)}</span><strong>${formatMoney(x.revenue)}</strong></div><div class="bar"><span style="width:${x.revenue/max*100}%"></span></div><small>${x.seats} мест</small></div>`).join("");
}

async function renderDailyReports(){
  const c=document.getElementById("dailyReportsList");if(!c)return;
  const reports=(await fbGetDailyReports()).slice().sort((a,b)=>b.date.localeCompare(a.date));
  c.innerHTML=reports.length?`<table class="admin-table"><thead><tr><th>Дата</th><th>Выручка</th><th>Билетов</th><th>Броней</th><th></th></tr></thead><tbody>${reports.map(r=>`<tr><td>${formatDate(r.date)}</td><td><strong>${formatMoney(r.revenue)}</strong></td><td>${r.tickets}</td><td>${r.bookings}</td><td><button class="admin-action delete-action" onclick="deleteDailyReport('${r.firebaseId}')">Удалить</button></td></tr>`).join("")}</tbody></table>`:"<p>Сохранённых отчётов пока нет. Нажмите «Сохранить отчёт за сегодня».</p>";
}

async function saveTodayReport(){
  const b=await fbGetBookings();
  const todayString=new Date().toISOString().slice(0,10);
  const todays=b.filter(x=>x.date.slice(0,10)===todayString);
  const revenue=todays.reduce((s,x)=>s+Number(x.amount),0);
  const tickets=todays.reduce((s,x)=>s+x.seats.length,0);

  const reports=await fbGetDailyReports();
  const existing=reports.find(r=>r.date===todayString);
  if(existing){
    if(!confirm("Отчёт за сегодня уже сохранён. Обновить его текущими данными?"))return;
    await fbUpdateDailyReport(existing.firebaseId,{revenue,tickets,bookings:todays.length,savedAt:new Date().toISOString()});
  }else{
    await fbAddDailyReport({id:Date.now(),date:todayString,revenue,tickets,bookings:todays.length,savedAt:new Date().toISOString()});
  }
  await renderDailyReports();alert("Отчёт за сегодня сохранён отдельно от общей выручки.");
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
  await fillContentForm();alert("Изменения сохранены. Откройте главную страницу, чтобы увидеть их.");
}

function resetSiteContent(){
  if(!confirm("Вернуть все тексты и фото на главной к значениям по умолчанию?"))return;
  fbSaveSiteContent(DEFAULT_CONTENT).then(()=>{fillContentForm();alert("Восстановлены значения по умолчанию.")});
}

// ============================================
// TICKET SUCCESS & QR
// ============================================
let activeTicket=null,scanner=null;

function showTicketSuccess(b){
  activeTicket=b;
  document.getElementById("ticketMovie").textContent=b.movieTitle;
  document.getElementById("ticketSeats").textContent=b.seats.join(", ");
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
// QR SCANNER
// ============================================
function stopScanner(){
  if(!scanner)return;
  const s=scanner;scanner=null;
  try{s.stop().then(()=>s.clear().catch(()=>{})).catch(()=>{})}catch(e){}
  const bs=document.getElementById("btnStopScanner"),bn=document.getElementById("btnStartScanner");
  if(bs)bs.classList.add("hidden");
  if(bn)bn.classList.remove("hidden");
}

async function startScanner(){
  if(!can("scan"))return alert("У вас нет права на сканирование QR.");
  if(typeof Html5Qrcode==="undefined"){document.getElementById("scanResult").textContent="Сканер не загрузился.";return}
  if(scanner)stopScanner();
  const bs=document.getElementById("btnStopScanner"),bn=document.getElementById("btnStartScanner");
  if(bs)bs.classList.remove("hidden");
  if(bn)bn.classList.add("hidden");
  scanner=new Html5Qrcode("reader");
  scanner.start({facingMode:"environment"},{fps:10,qrbox:220},async txt=>{
    const r=document.getElementById("scanResult");
    let b=null;
    try{
      const d=JSON.parse(txt);
      const bookings=await fbGetBookings();
      b=bookings.find(x=>x.ticketCode===d.ticketCode||x.id==d.id);
    }catch(e){
      const code=String(txt||"").trim();
      const bookings=await fbGetBookings();
      b=bookings.find(x=>x.ticketCode===code||String(x.id)===code);
    }
    if(!b){
      r.innerHTML="<h3>✕ Билет не найден</h3><p>Проверьте QR-код.</p>";
      stopScanner();
      setTimeout(()=>{if(!scanner)startScanner()},1500);
      return;
    }
    if(b.checkedIn){
      r.innerHTML="<h3>⚠ Билет уже использован</h3><p><b>Фильм:</b> "+escapeHtml(b.movieTitle)+"</p><p><b>Место:</b> <strong>"+escapeHtml(b.seats.join(", "))+"</strong></p>";
      stopScanner();return;
    }
    window.lastScannedBookingId=b.firebaseId;
    r.innerHTML="<h3>✓ Билет найден</h3><p><b>Фильм:</b> "+escapeHtml(b.movieTitle)+"</p><p><b>Клиент:</b> "+escapeHtml(b.customerName)+"</p><p><b>Место:</b> <strong>"+escapeHtml(b.seats.join(", "))+"</strong></p><p><b>Статус:</b> Можно пропустить</p><button class='button button-main' onclick='checkInScanned()'>Пропустить гостя</button>";
    stopScanner();
  }).catch(()=>{document.getElementById("scanResult").textContent="Не удалось включить камеру. Разрешите доступ к камере."});
}

async function checkInScanned(){
  const firebaseId=window.lastScannedBookingId;
  const bookings=await fbGetBookings();
  const b=bookings.find(x=>x.firebaseId===firebaseId);
  if(!b)return;
  if(b.checkedIn)return alert("Билет уже использован.");
  await fbUpdateBooking(firebaseId,{checkedIn:true,checkedInAt:new Date().toISOString(),checkedInBy:(getCurrentUser()||{}).login||"admin"});
  document.getElementById("scanResult").innerHTML="<h3>✓ Гость пропущен</h3><p>Место: <strong>"+escapeHtml(b.seats.join(", "))+"</strong></p><p>Повторный проход по этому QR будет запрещён.</p>";
}
